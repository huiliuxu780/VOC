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
  Write-Host "未找到 Python 可执行文件。"
  Write-Host "替换方案："
  Write-Host "1) 安装 Python 3.11/3.12 并勾选 Add Python to PATH"
  Write-Host "2) 或手动指定完整路径运行："
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
