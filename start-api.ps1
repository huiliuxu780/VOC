param(
  [int]$Port = 8000,
  [switch]$NoReload
)

$ErrorActionPreference = "Stop"

function Resolve-PythonExe {
  $commands = @("python", "py")
  foreach ($name in $commands) {
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

$pythonExe = Resolve-PythonExe
if (-not $pythonExe) {
  Write-Host "Python executable not found."
  Write-Host "Try one of the following:"
  Write-Host "1) Install Python 3.11/3.12 and enable 'Add Python to PATH'"
  Write-Host "2) Run with an absolute Python path:"
  Write-Host "   C:\Users\<YourUser>\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn app.main:app --reload --port $Port"
  exit 1
}

Push-Location (Join-Path $PSScriptRoot "backend")
try {
  if ($NoReload) {
    & $pythonExe -m uvicorn app.main:app --port $Port
  } else {
    & $pythonExe -m uvicorn app.main:app --reload --port $Port
  }
} finally {
  Pop-Location
}
