param(
  [switch]$NoAudit
)

$ErrorActionPreference = "Stop"

function Invoke-Install([string]$registry) {
  Write-Host "Trying registry: $registry" -ForegroundColor Cyan
  npm.cmd config set registry $registry
  if ($NoAudit) {
    npm.cmd install --prefer-offline --no-audit --no-fund
  } else {
    npm.cmd install --prefer-offline
  }
}

try {
  Invoke-Install "https://registry.npmjs.org"
  Write-Host "Install completed with npmjs registry." -ForegroundColor Green
  exit 0
} catch {
  Write-Warning "Install failed on npmjs registry: $($_.Exception.Message)"
}

try {
  Invoke-Install "https://registry.npmmirror.com"
  Write-Host "Install completed with npmmirror registry." -ForegroundColor Green
  exit 0
} catch {
  Write-Warning "Install failed on npmmirror registry: $($_.Exception.Message)"
}

Write-Error "Dependency installation failed on all fallback registries."
exit 1
