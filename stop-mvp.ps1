$ErrorActionPreference = "SilentlyContinue"

$root = $PSScriptRoot
$pidFile = Join-Path $root ".mvp-pids.json"

function Get-DescendantProcessIds {
  param([int]$ParentId)

  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentId" | Select-Object -ExpandProperty ProcessId
  $all = New-Object System.Collections.Generic.List[int]
  foreach ($childId in $children) {
    $all.Add($childId)
    $nested = Get-DescendantProcessIds -ParentId $childId
    foreach ($id in $nested) {
      $all.Add($id)
    }
  }
  return $all
}

function Stop-ProcessByPort {
  param([int]$Port)

  $lines = netstat -ano | Select-String ":$Port\s"
  foreach ($line in $lines) {
    $parts = ($line -replace "\s+", " ").Trim().Split(" ")
    if ($parts.Length -lt 5) {
      continue
    }
    $procId = [int]$parts[-1]
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
      Stop-Process -Id $procId -Force
      Write-Host "Stopped PID $procId by port $Port ($($proc.ProcessName))"
    }
  }
}

if (-not (Test-Path -LiteralPath $pidFile)) {
  Write-Host "No running MVP session found."
  exit 0
}

$state = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
$rootPids = @($state.backend_pid, $state.frontend_pid) | Where-Object { $_ } | ForEach-Object { [int]$_ }

$allPids = New-Object System.Collections.Generic.List[int]
foreach ($pid in $rootPids) {
  $allPids.Add($pid)
  $children = Get-DescendantProcessIds -ParentId $pid
  foreach ($child in $children) {
    $allPids.Add($child)
  }
}

$ordered = $allPids | Sort-Object -Unique -Descending
foreach ($pid in $ordered) {
  $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
  if ($proc) {
    Stop-Process -Id $pid -Force
    Write-Host "Stopped PID $pid ($($proc.ProcessName))"
  }
}

if ($state.backend_port) {
  Stop-ProcessByPort -Port ([int]$state.backend_port)
}
if ($state.frontend_port) {
  Stop-ProcessByPort -Port ([int]$state.frontend_port)
}

Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "MVP session stopped."
