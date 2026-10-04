param(
  [string]$SkillDir = (Resolve-Path ".\.opencode\skills\k6-test-suite").Path,
  [string]$OpenCode = "opencode",
  [switch]$KeepWorkspace,
  [switch]$CopyMirrors  # if true, also copy .github/skills
)

$ws = Join-Path $env:TEMP ("k6-eval-" + [guid]::NewGuid().ToString())
Write-Host "Creating workspace: $ws" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $ws | Out-Null
New-Item -ItemType Directory -Force -Path "$ws\.opencode" | Out-Null

# Copy .opencode/skills
$skillsSrc = (Resolve-Path "$SkillDir\..").Path  # skills folder
Copy-Item -Recurse -Force $skillsSrc "$ws\.opencode\skills"

# Optionally copy mirrors
if ($CopyMirrors) {
  $githubSkillsSrc = (Resolve-Path "$SkillDir\..\..\..\..\github\skills" -ErrorAction SilentlyContinue).Path
  if ($githubSkillsSrc -and (Test-Path $githubSkillsSrc)) {
    New-Item -ItemType Directory -Force -Path "$ws\.github" | Out-Null
    Copy-Item -Recurse -Force $githubSkillsSrc "$ws\.github\skills"
  }
}

$promptPath = Join-Path $PSScriptRoot "smoke_prompt.txt"
$prompt = Get-Content $promptPath -Raw

$exitCode = 0
Push-Location $ws
try {
  Write-Host "Running: $OpenCode run (prompt from smoke_prompt.txt)" -ForegroundColor Cyan
  & $OpenCode run $prompt.Trim()
  $exitCode = $LASTEXITCODE
} catch {
  Write-Error "Failed to execute opencode: $($_.Exception.Message)"
  $exitCode = 1
} finally {
  Pop-Location
}

if ($exitCode -ne 0) {
  Write-Warning "opencode exited with code $exitCode"
}

Write-Host "Running assertions..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "assert.ps1") -Path $ws
$assertCode = $LASTEXITCODE

if (-not $KeepWorkspace) {
  Write-Host "Cleaning workspace: $ws" -ForegroundColor Cyan
  Remove-Item -Recurse -Force $ws -ErrorAction SilentlyContinue
} else {
  Write-Host "Workspace kept: $ws" -ForegroundColor Yellow
}

exit $assertCode
