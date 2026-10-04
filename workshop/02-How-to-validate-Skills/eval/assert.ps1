param(
  [string]$Path = (Get-Location).Path
)

$fail = 0

# Required directories and files
$need = @(
  'configs',
  'constants',
  'shared',
  'tests',
  'workloads',
  'Makefile',
  'configs/smoke.json',
  'configs/load.json',
  'workloads/smoke.js',
  'workloads/load.js'
)

Write-Host "Checking required paths in $Path" -ForegroundColor Cyan
foreach ($n in $need) {
  $full = Join-Path $Path $n
  if (-not (Test-Path $full)) {
    Write-Error "MISSING: $n"
    $fail++
  } else {
    Write-Host "  OK: $n" -ForegroundColor Green
  }
}

# Check load.json uses ramping-arrival-rate
$loadJson = Join-Path $Path 'configs/load.json'
if (Test-Path $loadJson) {
  try {
    $j = Get-Content $loadJson -Raw | ConvertFrom-Json
    $foundRar = $false
    foreach ($prop in $j.scenarios.PSObject.Properties) {
      if ($prop.Value.executor -eq 'ramping-arrival-rate') { $foundRar = $true; break }
    }
    if (-not $foundRar) {
      Write-Error "configs/load.json missing executor 'ramping-arrival-rate'"
      $fail++
    } else {
      Write-Host "  OK: load.json uses ramping-arrival-rate" -ForegroundColor Green
    }
  } catch {
    Write-Error "Failed to parse configs/load.json: $($_.Exception.Message)"
    $fail++
  }
}

# Check operation tags in workload scripts
$workloadsDir = Join-Path $Path 'workloads'
if (Test-Path $workloadsDir) {
  $wContent = Get-ChildItem $workloadsDir -Filter *.js -ErrorAction SilentlyContinue | Get-Content -Raw -ErrorAction SilentlyContinue
  if (-not $wContent -or $wContent -notmatch "operation") {
    Write-Error "Missing 'operation' tag in workloads/*.js"
    $fail++
  } else {
    Write-Host "  OK: workloads contain 'operation' tags" -ForegroundColor Green
  }
}

# Check Makefile for Prometheus remote write
$makefile = Join-Path $Path 'Makefile'
if (Test-Path $makefile) {
  $m = Get-Content $makefile -Raw
  if ($m -notmatch "experimental-prometheus-rw") {
    Write-Error "Makefile missing 'experimental-prometheus-rw'"
    $fail++
  } else {
    Write-Host "  OK: Makefile includes experimental-prometheus-rw" -ForegroundColor Green
  }
  if ($m -notmatch "http://localhost:9090/api/v1/write") {
    Write-Error "Makefile missing Prometheus RW URL"
    $fail++
  } else {
    Write-Host "  OK: Makefile includes Prometheus RW URL" -ForegroundColor Green
  }
}

if ($fail -eq 0) {
  Write-Host "`nAll assertions PASSED" -ForegroundColor Green
} else {
  Write-Host "`n$fail assertion(s) FAILED" -ForegroundColor Red
}

exit $fail
