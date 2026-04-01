param(
  [Parameter(Mandatory = $true)]
  [string]$Version,
  [switch]$RunReleaseCheck,
  [switch]$RunAlertFlow,
  [switch]$PushTag,
  [switch]$DryRun,
  [switch]$AllowDirty,
  [switch]$AllowNonMain
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$AllowFailure
  )
  $oldPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = & git @Arguments 2>&1
  $ErrorActionPreference = $oldPreference
  $code = $LASTEXITCODE
  if ($code -ne 0 -and -not $AllowFailure) {
    throw "git $($Arguments -join ' ') failed: $output"
  }
  return [pscustomobject]@{
    Output = $output
    ExitCode = $code
  }
}

function Ensure-GitRepo {
  $check = Invoke-Git -Arguments @("rev-parse", "--is-inside-work-tree") -AllowFailure
  if ($check.ExitCode -ne 0 -or ($check.Output -join "").Trim() -ne "true") {
    throw "Current directory is not a git repository."
  }
}

function Normalize-Tag {
  param([string]$RawVersion)
  if ($RawVersion.StartsWith("v")) {
    return $RawVersion
  }
  return "v$RawVersion"
}

function Assert-TagFormat {
  param([string]$Tag)
  if ($Tag -notmatch '^v\d+\.\d+\.\d+([\-+][0-9A-Za-z\.-]+)?$') {
    throw "Invalid version format: $Tag. Expected: vX.Y.Z (example: v0.2.0)"
  }
}

function Get-PreviousTag {
  $res = Invoke-Git -Arguments @("describe", "--tags", "--abbrev=0") -AllowFailure
  if ($res.ExitCode -ne 0) {
    return $null
  }
  return ($res.Output -join "").Trim()
}

function Ensure-CleanWorktree {
  param([switch]$AllowDirty)
  if ($AllowDirty) {
    return
  }
  $status = Invoke-Git -Arguments @("status", "--porcelain")
  if ((($status.Output -join "")).Trim().Length -gt 0) {
    throw "Working tree is not clean. Commit/stash changes or use -AllowDirty."
  }
}

function Ensure-MainBranch {
  param([switch]$AllowNonMain)
  if ($AllowNonMain) {
    return
  }
  $branch = Invoke-Git -Arguments @("branch", "--show-current")
  $name = (($branch.Output -join "")).Trim()
  if ($name -ne "main") {
    throw "Current branch is '$name'. Switch to 'main' or use -AllowNonMain."
  }
}

function Ensure-TagNotExists {
  param([string]$Tag)
  $local = Invoke-Git -Arguments @("tag", "-l", $Tag)
  if ((($local.Output -join "")).Trim() -eq $Tag) {
    throw "Tag already exists locally: $Tag"
  }

  $remote = Invoke-Git -Arguments @("ls-remote", "--tags", "origin", "refs/tags/$Tag") -AllowFailure
  if ($remote.ExitCode -eq 0 -and (($remote.Output -join "")).Trim().Length -gt 0) {
    throw "Tag already exists on remote origin: $Tag"
  }
}

function Get-CommitLines {
  param([string]$PreviousTag)
  if ([string]::IsNullOrWhiteSpace($PreviousTag)) {
    $res = Invoke-Git -Arguments @("log", "-n", "30", "--no-merges", "--pretty=format:- %h %s")
    return $res.Output
  }
  $range = "$PreviousTag..HEAD"
  $res = Invoke-Git -Arguments @("log", $range, "--no-merges", "--pretty=format:- %h %s")
  return $res.Output
}

function Build-ReleaseNotes {
  param(
    [string]$Tag,
    [string]$PreviousTag,
    [string[]]$CommitLines
  )
  $date = (Get-Date).ToString("yyyy-MM-dd")
  $branchRes = Invoke-Git -Arguments @("branch", "--show-current")
  $branch = (($branchRes.Output -join "")).Trim()
  $headRes = Invoke-Git -Arguments @("rev-parse", "--short", "HEAD")
  $head = (($headRes.Output -join "")).Trim()

  $compareText = if ($PreviousTag) { "$PreviousTag..$Tag" } else { "initial release window" }
  $commitSection = if ($CommitLines.Count -gt 0) { $CommitLines } else { @("- No code changes found in range.") }

  $lines = @(
    "# Release $Tag",
    "",
    "- Date: $date",
    "- Branch: $branch",
    "- Head: $head",
    "- Compare: $compareText",
    "",
    "## Highlights",
    "- Fill in release highlights before publishing.",
    "",
    "## Commit List",
    $commitSection,
    "",
    "## Verification",
    "- [ ] release-check passed",
    "- [ ] smoke check passed",
    "- [ ] key user journey verified",
    ""
  )
  return $lines
}

function Save-ReleaseNotesDraft {
  param(
    [string]$Tag,
    [string[]]$Lines
  )
  $root = $PSScriptRoot
  $dir = Join-Path $root ".release-check\releases"
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -Path $dir -ItemType Directory | Out-Null
  }
  $path = Join-Path $dir "$Tag.md"
  $Lines | Set-Content -LiteralPath $path -Encoding utf8
  return $path
}

Write-Host "== Release Tag ==" -ForegroundColor Cyan
Ensure-GitRepo

$tag = Normalize-Tag -RawVersion $Version
Assert-TagFormat -Tag $tag

Ensure-CleanWorktree -AllowDirty:$AllowDirty
Ensure-MainBranch -AllowNonMain:$AllowNonMain
Ensure-TagNotExists -Tag $tag

if ($RunReleaseCheck) {
  Write-Host "[Step] Running release-check..."
  if ($RunAlertFlow) {
    & (Join-Path $PSScriptRoot "release-check.ps1") -RunAlertFlow
  } else {
    & (Join-Path $PSScriptRoot "release-check.ps1")
  }
  if ($LASTEXITCODE -ne 0) {
    throw "release-check failed, aborting tag creation."
  }
}

$previousTag = Get-PreviousTag
$commits = Get-CommitLines -PreviousTag $previousTag
$notes = Build-ReleaseNotes -Tag $tag -PreviousTag $previousTag -CommitLines $commits
$notePath = Save-ReleaseNotesDraft -Tag $tag -Lines $notes
Write-Host ("[OK] Release notes draft: {0}" -f $notePath)

if ($DryRun) {
  Write-Host ("[DRY-RUN] Tag would be created: {0}" -f $tag) -ForegroundColor Yellow
  if ($PushTag) {
    Write-Host ("[DRY-RUN] Tag would be pushed: origin {0}" -f $tag) -ForegroundColor Yellow
  }
  exit 0
}

Invoke-Git -Arguments @("tag", "-a", $tag, "-m", "Release $tag") | Out-Null
Write-Host ("[OK] Created tag: {0}" -f $tag) -ForegroundColor Green

if ($PushTag) {
  Invoke-Git -Arguments @("push", "origin", $tag) | Out-Null
  Write-Host ("[OK] Pushed tag to origin: {0}" -f $tag) -ForegroundColor Green
} else {
  Write-Host ("[Next] Push tag when ready: git push origin {0}" -f $tag)
}
