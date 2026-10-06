param(
  [string]$SkillDir = "",
  [string]$OpenCode = "opencode",
  [switch]$KeepWorkspace,
  [switch]$CopyMirrors  # if true, also copy .github/skills
)

# Resolve the skills folder from a skill dir, a skills dir, or .opencode itself.
function Get-SkillsRoot([string]$dir) {
  $resolved = (Resolve-Path $dir -ErrorAction Stop).Path
  if (Test-Path (Join-Path $resolved "k6-test-suite\SKILL.md")) { return $resolved }
  if (Test-Path (Join-Path $resolved "skills\k6-test-suite\SKILL.md")) { return (Join-Path $resolved "skills") }
  if (Test-Path (Join-Path $resolved "SKILL.md")) { $parent = Split-Path -Parent $resolved; if (Test-Path (Join-Path $parent "k6-test-suite\SKILL.md")) { return $parent } }
  throw "No k6-test-suite/SKILL.md found under '$dir'. Pass -SkillDir pointing at .opencode\skills\k6-test-suite."
}

if (-not $SkillDir) { $SkillDir = ".\.opencode\skills\k6-test-suite" }
$skillsSrc = Get-SkillsRoot $SkillDir

$ws = Join-Path $env:TEMP ("k6-eval-" + [guid]::NewGuid().ToString())
Write-Host "Creating workspace: $ws" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $ws | Out-Null
New-Item -ItemType Directory -Force -Path "$ws\.opencode" | Out-Null

# Copy .opencode/skills
Copy-Item -Recurse -Force $skillsSrc "$ws\.opencode\skills"

if (-not (Test-Path "$ws\.opencode\skills\k6-test-suite\SKILL.md")) {
  throw "Skill copy failed: $ws\.opencode\skills\k6-test-suite\SKILL.md not found. The agent would run without the k6-test-suite skill."
}
Write-Host "Skill staged: $ws\.opencode\skills\k6-test-suite" -ForegroundColor Cyan

# Optionally copy mirrors
if ($CopyMirrors) {
  $githubSkillsSrc = (Resolve-Path "$skillsSrc\..\..\.github\skills" -ErrorAction SilentlyContinue).Path
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
  Write-Host "Failed to execute opencode: $($_.Exception.Message)" -ForegroundColor Red
  $exitCode = 1
} finally {
  Pop-Location
}

if ($exitCode -ne 0) {
  Write-Warning "opencode exited with code $exitCode"
}

# Distinguish 'generation never finished' from 'generation finished wrong'.
$expected = @('Makefile', 'configs\load.json', 'configs\smoke.json', 'workloads\smoke.js', 'workloads\load.js')
$notWritten = @($expected | Where-Object { -not (Test-Path (Join-Path $ws $_)) })
if ($notWritten.Count -gt 0) {
  Write-Warning "opencode run stopped before writing: $($notWritten -join ', ') (exit code $exitCode)."
  Write-Warning "The assertions below will fail because generation is incomplete, not because the skill contract broke."
}

Write-Host "Running assertions..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "assert.ps1") -Path $ws
$assertCode = $LASTEXITCODE

if ($assertCode -ne 0) {
  # Never throw away the evidence of a failed eval.
  $KeepWorkspace = $true
  Write-Warning "Assertions failed - workspace kept for inspection: $ws"
}

if (-not $KeepWorkspace) {
  Write-Host "Cleaning workspace: $ws" -ForegroundColor Cyan
  Remove-Item -Recurse -Force $ws -ErrorAction SilentlyContinue
} else {
  Write-Host "Workspace kept: $ws" -ForegroundColor Yellow
}

exit $assertCode
