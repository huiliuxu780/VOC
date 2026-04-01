param(
  [string]$BackendBase = "http://127.0.0.1:8000",
  [string]$FrontendBase = "http://127.0.0.1:5173",
  [string]$ReportRoot = ".release-check",
  [int]$SmokeMaxWaitSec = 45,
  [switch]$SkipBuild,
  [switch]$SkipSmoke,
  [switch]$NoStart,
  [switch]$KeepRunning,
  [switch]$RunAlertFlow
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$pidFile = Join-Path $root ".mvp-pids.json"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([System.IO.Path]::IsPathRooted($ReportRoot)) {
  $reportBase = $ReportRoot
} else {
  $reportBase = Join-Path $root $ReportRoot
}
$reportDir = Join-Path $reportBase $timestamp
$logDir = Join-Path $reportDir "logs"
$snapshotDir = Join-Path $reportDir "snapshots"

New-Item -Path $logDir -ItemType Directory -Force | Out-Null
New-Item -Path $snapshotDir -ItemType Directory -Force | Out-Null

$results = New-Object System.Collections.Generic.List[object]
$startedByScript = $false

function Add-StepResult {
  param(
    [string]$Step,
    [string]$Status,
    [string]$Detail
  )
  $results.Add(
    [pscustomobject]@{
      step = $Step
      status = $Status
      detail = $Detail
      at = (Get-Date).ToString("o")
    }
  ) | Out-Null
}

function Invoke-LoggedStep {
  param(
    [string]$Name,
    [string]$LogPath,
    [scriptblock]$Action
  )
  Write-Host ""
  Write-Host ("== {0} ==" -f $Name)
  try {
    & $Action *>&1 | Tee-Object -FilePath $LogPath
    Add-StepResult -Step $Name -Status "ok" -Detail "completed"
  } catch {
    Add-StepResult -Step $Name -Status "failed" -Detail $_.Exception.Message
    throw
  }
}

function Save-JsonSnapshot {
  param(
    [string]$Name,
    [string]$Url
  )
  $data = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 12
  $path = Join-Path $snapshotDir ("{0}.json" -f $Name)
  $data | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $path -Encoding utf8
  Write-Host ("[SNAPSHOT] {0} -> {1}" -f $Url, $path)
}

function Invoke-CmdOrThrow {
  param(
    [scriptblock]$Action,
    [string]$ErrorMessage
  )
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw $ErrorMessage
  }
}

Write-Host "== Release Check =="
Write-Host ("Report dir: {0}" -f $reportDir)
Write-Host ("Build step: {0}" -f ($(if ($SkipBuild) { "skip" } else { "run" })))
Write-Host ("Smoke step: {0}" -f ($(if ($SkipSmoke) { "skip" } else { "run" })))

$exitCode = 0
$failureMessage = ""

try {
  if (-not $SkipBuild) {
    Invoke-LoggedStep -Name "Backend Compile Check" -LogPath (Join-Path $logDir "backend-compile.log") -Action {
      Invoke-CmdOrThrow -Action { python -m compileall backend/app } -ErrorMessage "Backend compile check failed"
    }

    Invoke-LoggedStep -Name "Frontend Build Check" -LogPath (Join-Path $logDir "frontend-build.log") -Action {
      Push-Location (Join-Path $root "frontend")
      try {
        Invoke-CmdOrThrow -Action { npm.cmd run build } -ErrorMessage "Frontend build failed"
      } finally {
        Pop-Location
      }
    }
  } else {
    Add-StepResult -Step "Build Checks" -Status "skipped" -Detail "SkipBuild enabled"
  }

  if (-not $SkipSmoke) {
    if (-not $NoStart) {
      if (-not (Test-Path -LiteralPath $pidFile)) {
        Invoke-LoggedStep -Name "Start MVP Session" -LogPath (Join-Path $logDir "start-mvp.log") -Action {
          Invoke-CmdOrThrow -Action { & (Join-Path $root "run-mvp.ps1") } -ErrorMessage "Failed to start MVP session"
        }
        $startedByScript = $true
      } else {
        Add-StepResult -Step "Start MVP Session" -Status "skipped" -Detail "Existing MVP session detected"
      }
    } else {
      Add-StepResult -Step "Start MVP Session" -Status "skipped" -Detail "NoStart enabled"
    }

    Invoke-LoggedStep -Name "MVP Smoke Check" -LogPath (Join-Path $logDir "smoke.log") -Action {
      if ($RunAlertFlow) {
        Invoke-CmdOrThrow -Action {
          & (Join-Path $root "smoke-mvp.ps1") -BackendBase $BackendBase -FrontendBase $FrontendBase -MaxWaitSec $SmokeMaxWaitSec
        } -ErrorMessage "Smoke check failed"
      } else {
        Invoke-CmdOrThrow -Action {
          & (Join-Path $root "smoke-mvp.ps1") -BackendBase $BackendBase -FrontendBase $FrontendBase -MaxWaitSec $SmokeMaxWaitSec -SkipAlertFlow
        } -ErrorMessage "Smoke check failed"
      }
    }
  } else {
    Add-StepResult -Step "Smoke Check" -Status "skipped" -Detail "SkipSmoke enabled"
  }

  Invoke-LoggedStep -Name "API Snapshot Export" -LogPath (Join-Path $logDir "snapshots.log") -Action {
    Save-JsonSnapshot -Name "health" -Url "$BackendBase/health"
    Save-JsonSnapshot -Name "jobs" -Url "$BackendBase/api/v1/jobs"
    Save-JsonSnapshot -Name "monitoring-dashboard" -Url "$BackendBase/api/v1/monitoring/dashboard"
    Save-JsonSnapshot -Name "monitoring-trend" -Url "$BackendBase/api/v1/monitoring/trend"
    Save-JsonSnapshot -Name "monitoring-alerts" -Url "$BackendBase/api/v1/monitoring/alerts?status=all&severity=all"
  }

} catch {
  $exitCode = 1
  $failureMessage = $_.Exception.Message
  Write-Host ""
  Write-Host ("Release check failed: {0}" -f $failureMessage) -ForegroundColor Red
} finally {
  if ($startedByScript -and -not $KeepRunning) {
    try {
      & (Join-Path $root "stop-mvp.ps1") | Out-Null
      Add-StepResult -Step "Stop MVP Session" -Status "ok" -Detail "stopped auto-started session"
    } catch {
      Add-StepResult -Step "Stop MVP Session" -Status "failed" -Detail $_.Exception.Message
    }
  }
}

$summaryPath = Join-Path $reportDir "summary.json"
$results | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $summaryPath -Encoding utf8

$readmePath = Join-Path $reportDir "README.txt"
$stepLines = $results | ForEach-Object { "- $($_.status.ToUpper()): $($_.step) ($($_.detail))" }
$readmeLines = @(
  "VOC MVP Release Check Summary"
  ("Generated: {0}" -f (Get-Date).ToString("u"))
  ("Report Dir: {0}" -f $reportDir)
  ""
  "Steps:"
) + $stepLines + @(
  ""
  "Artifacts:"
  ("- Logs: {0}" -f $logDir)
  ("- Snapshots: {0}" -f $snapshotDir)
  ("- Summary JSON: {0}" -f $summaryPath)
)
$readmeLines | Set-Content -LiteralPath $readmePath -Encoding utf8

Write-Host ""
if ($exitCode -eq 0) {
  Write-Host ("Release check passed. Report: {0}" -f $reportDir) -ForegroundColor Green
} else {
  Write-Host ("See logs under: {0}" -f $logDir)
}
exit $exitCode
