[<- Back to Workshop overview](../../workshop.md)

# Eval suite for k6-test-suite skill

This small eval verifies that `k6-test-suite` generates the expected project structure and conventions after prompt changes.

## Files

- `smoke_prompt.txt` — Canonical prompt used for the smoke test
- `run_eval.ps1` — Creates an isolated workspace, copies skills, runs `opencode run`, then asserts
- `assert.ps1` — Structural assertions (dirs, files, executor, tags, Prometheus RW)
- `assert.py` — Same assertions in Python (stdlib only), for non-Windows or CI use
- `golden/` — Optional known-good outputs for deeper comparison

## Prerequisites

- OpenCode installed and on PATH (`opencode --version`)
- From repo root: skills exist at `.opencode/skills/k6-test-suite/SKILL.md`

## Run (PowerShell)

From `workshop/02-How-to-validate-Skills/`:

```powershell
.\eval\run_eval.ps1
```

Or from anywhere, pointing to the skill:

```powershell
.\workshop\02-How-to-validate-Skills\eval\run_eval.ps1 -SkillDir .\opencode\skills\k6-test-suite
```

Or from repo root:

```powershell
.\workshop\02-How-to-validate-Skills\eval\run_eval.ps1 -SkillDir .\.opencode\skills\k6-test-suite
```

Keep workspace for debugging:

```powershell
.\eval\run_eval.ps1 -KeepWorkspace
```

Copy `.github/skills` mirrors too:

```powershell
.\eval\run_eval.ps1 -CopyMirrors -KeepWorkspace
```

## Run the assertions in Python

`assert.py` performs the same checks with no dependencies beyond the Python standard library. Pass the generated project directory (defaults to the current directory):

```bash
python eval/assert.py /path/to/generated/project
```

It prints the same messages as `assert.ps1` and exits with the number of failed assertions.

## What it asserts

1. Required paths exist: `configs/`, `constants/`, `shared/`, `tests/`, `workloads/`, `Makefile`, `configs/smoke.json`, `configs/load.json`, `workloads/smoke.js`, `workloads/load.js`
2. `configs/load.json` uses `executor: "ramping-arrival-rate"` in at least one scenario
3. `workloads/*.js` contain `operation` tags
4. `Makefile` includes `experimental-prometheus-rw` and Prometheus RW URL `http://localhost:9090/api/v1/write`

## After changing the prompt

Run the eval. If it passes, the skill still produces the expected contract. If it fails, inspect the workspace (use `-KeepWorkspace`) and compare against `golden/` if present.