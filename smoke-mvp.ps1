param(
  [string]$BackendBase = "http://127.0.0.1:8000",
  [string]$FrontendBase = "http://127.0.0.1:5173",
  [switch]$SkipAlertFlow,
  [int]$TimeoutSec = 8
)

$ErrorActionPreference = "Stop"

function Assert-Condition {
  param(
    [bool]$Condition,
    [string]$Message
  )
  if (-not $Condition) {
    throw $Message
  }
}

function Get-Json {
  param([string]$Url)
  return Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec $TimeoutSec
}

function Post-Json {
  param([string]$Url)
  return Invoke-RestMethod -Method Post -Uri $Url -TimeoutSec $TimeoutSec
}

Write-Host "== MVP Smoke Check =="
Write-Host "Frontend: $FrontendBase"
Write-Host "Backend : $BackendBase"
Write-Host ""

try {
  $frontendResp = Invoke-WebRequest -Method Get -Uri $FrontendBase -TimeoutSec $TimeoutSec -UseBasicParsing
  Assert-Condition ($frontendResp.StatusCode -ge 200 -and $frontendResp.StatusCode -lt 400) "Frontend is not reachable"
  Write-Host ("[OK] Frontend reachable: {0}" -f $frontendResp.StatusCode)

  $health = Get-Json -Url "$BackendBase/health"
  Assert-Condition ($health.status -eq "ok") "Backend health check failed"
  Write-Host "[OK] Backend /health status=ok"

  $dashboard = Get-Json -Url "$BackendBase/api/v1/monitoring/dashboard"
  Assert-Condition ($dashboard.total_processed -ge 0) "Dashboard total_processed missing"
  Write-Host ("[OK] Monitoring dashboard total_processed={0}, open_alerts={1}" -f $dashboard.total_processed, $dashboard.open_alerts)

  $trend = Get-Json -Url "$BackendBase/api/v1/monitoring/trend"
  Assert-Condition (@($trend).Count -gt 0) "Monitoring trend is empty"
  Write-Host ("[OK] Monitoring trend points={0}" -f @($trend).Count)

  $jobs = Get-Json -Url "$BackendBase/api/v1/jobs"
  Assert-Condition (@($jobs).Count -gt 0) "Jobs list is empty"
  Write-Host ("[OK] Jobs loaded count={0}" -f @($jobs).Count)

  $alerts = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts?status=all&severity=all"
  Assert-Condition (@($alerts).Count -gt 0) "Alerts list is empty"
  Write-Host ("[OK] Alerts loaded count={0}" -f @($alerts).Count)

  if (-not $SkipAlertFlow) {
    $resolved = @($alerts | Where-Object { $_.status -eq "resolved" })
    $open = @($alerts | Where-Object { $_.status -eq "open" })
    $ack = @($alerts | Where-Object { $_.status -eq "ack" })

    if ($resolved.Count -gt 0) {
      $target = $resolved[0]
      $detailBefore = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)"
      $beforeHistory = @($detailBefore.detail.history).Count
      $step1 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/reopen?actor=smoke"
      $step2 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/ack?actor=smoke"
      $step3 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/resolve?actor=smoke"
      Assert-Condition ($step1.status -eq "open") "Reopen step failed"
      Assert-Condition ($step2.status -eq "ack") "Ack step failed"
      Assert-Condition ($step3.status -eq "resolved") "Resolve step failed"
      $detailAfter = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)"
      $afterHistory = @($detailAfter.detail.history).Count
      Assert-Condition ($afterHistory -ge ($beforeHistory + 3)) "Alert history was not appended as expected"
      Write-Host ("[OK] Alert flow resolved->open->ack->resolved id={0} history {1}->{2}" -f $target.id, $beforeHistory, $afterHistory)
    } elseif ($open.Count -gt 0) {
      $target = $open[0]
      $detailBefore = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)"
      $beforeHistory = @($detailBefore.detail.history).Count
      $step1 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/ack?actor=smoke"
      $step2 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/resolve?actor=smoke"
      Assert-Condition ($step1.status -eq "ack") "Ack step failed"
      Assert-Condition ($step2.status -eq "resolved") "Resolve step failed"
      $detailAfter = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)"
      $afterHistory = @($detailAfter.detail.history).Count
      Assert-Condition ($afterHistory -ge ($beforeHistory + 2)) "Alert history was not appended as expected"
      Write-Host ("[OK] Alert flow open->ack->resolved id={0} history {1}->{2}" -f $target.id, $beforeHistory, $afterHistory)
    } elseif ($ack.Count -gt 0) {
      $target = $ack[0]
      $detailBefore = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)"
      $beforeHistory = @($detailBefore.detail.history).Count
      $step1 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/resolve?actor=smoke"
      $step2 = Post-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)/reopen?actor=smoke"
      Assert-Condition ($step1.status -eq "resolved") "Resolve step failed"
      Assert-Condition ($step2.status -eq "open") "Reopen step failed"
      $detailAfter = Get-Json -Url "$BackendBase/api/v1/monitoring/alerts/$($target.id)"
      $afterHistory = @($detailAfter.detail.history).Count
      Assert-Condition ($afterHistory -ge ($beforeHistory + 2)) "Alert history was not appended as expected"
      Write-Host ("[OK] Alert flow ack->resolved->open id={0} history {1}->{2}" -f $target.id, $beforeHistory, $afterHistory)
    } else {
      throw "No alert in open/ack/resolved status; cannot test alert flow"
    }
  } else {
    Write-Host "[SKIP] Alert flow transitions skipped by parameter"
  }

  Write-Host ""
  Write-Host "Smoke check passed."
  exit 0
} catch {
  Write-Host ""
  Write-Host "[FAIL] Smoke check failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
