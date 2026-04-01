param(
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

function Resolve-PythonExe {
  foreach ($name in @("python", "py")) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) {
      return $cmd.Source
    }
  }

  $candidates = @(
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python312\python.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }
  return $null
}

$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$pidFile = Join-Path $root ".mvp-pids.json"
$logDir = Join-Path $root ".mvp-logs"

if (-not (Test-Path -LiteralPath $logDir)) {
  New-Item -Path $logDir -ItemType Directory | Out-Null
}

if (Test-Path -LiteralPath $pidFile) {
  Write-Host "Existing MVP processes found. Stopping previous session first..."
  & (Join-Path $root "stop-mvp.ps1")
}

$pythonExe = Resolve-PythonExe
if (-not $pythonExe) {
  throw "Python executable not found. Please install Python 3.11+."
}

$backendOut = Join-Path $logDir "backend.out.log"
$backendErr = Join-Path $logDir "backend.err.log"
$frontendOut = Join-Path $logDir "frontend.out.log"
$frontendErr = Join-Path $logDir "frontend.err.log"

foreach ($file in @($backendOut, $backendErr, $frontendOut, $frontendErr)) {
  if (Test-Path -LiteralPath $file) {
    Remove-Item -LiteralPath $file -Force
  }
}

$backendArgs = @("-m", "uvicorn", "app.main:app", "--port", "$BackendPort")
$backendProc = Start-Process -FilePath $pythonExe -ArgumentList $backendArgs -WorkingDirectory $backendDir -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr -PassThru

$frontendArgs = @("run", "dev", "--", "--host", "0.0.0.0", "--port", "$FrontendPort")
$frontendProc = Start-Process -FilePath "npm.cmd" -ArgumentList $frontendArgs -WorkingDirectory $frontendDir -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr -PassThru

Start-Sleep -Seconds 4

$state = [pscustomobject]@{
  started_at = (Get-Date).ToString("o")
  backend_pid = $backendProc.Id
  frontend_pid = $frontendProc.Id
  backend_port = $BackendPort
  frontend_port = $FrontendPort
  backend_health = "http://127.0.0.1:$BackendPort/health"
  frontend_url = "http://127.0.0.1:$FrontendPort"
}
$state | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding utf8

Write-Host ""
Write-Host "MVP session started."
Write-Host "Frontend: http://127.0.0.1:$FrontendPort"
Write-Host "Backend : http://127.0.0.1:$BackendPort (health: /health)"
Write-Host "Logs    : $logDir"
Write-Host "Stop    : .\\stop-mvp.ps1"
Write-Host ""

if (Test-Path -LiteralPath $backendErr) {
  Write-Host "[backend.err tail]"
  Get-Content -LiteralPath $backendErr -Tail 8
}
if (Test-Path -LiteralPath $frontendErr) {
  Write-Host "[frontend.err tail]"
  Get-Content -LiteralPath $frontendErr -Tail 8
}
