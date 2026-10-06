[<- Back to Workshop overview](../../workshop.md)

# 02 — How to Validate Agent Skills

**Objective:** Ensure that changes to a skill's `SKILL.md` (or its bundled resources) do not break the behaviour it is meant to enforce. Learn what "evals" mean for Agent Skills, how to write checks, and how to run them in OpenCode and GitHub Copilot.

> **References:** [OpenCode Agent Skills](https://opencode.ai/docs/skills/) · [Agent Skills specification](https://agentskills.io/specification) · [GitHub Copilot Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)

---

## 1) What "validate a skill" means

Validating a skill is different from unit-testing application code. A skill is a set of instructions for an agent: changing a sentence, an example, a path or a required tag can change which tool the agent picks, what questions it asks, or what it generates.

A minimal validation should cover:

- **Structure**: `SKILL.md` exists, `name` matches directory, frontmatter is valid, required fields present.
- **Discovery**: the skill appears with the expected `name` and `description` in the skill list.
- **Activation**: loading the skill injects the expected instructions and references.
- **Behaviour**: the agent follows the workflow (asks the right questions, uses the right files, produces the expected artefacts).
- **Regression**: after any edit, the same inputs still produce acceptable outputs.

---

## 2) Quick structural checks (no LLM required)

Run these before any behavioural test. They catch the most common mistakes.

```bash
# From repo root
cd C:\Users\Daehin\Documents\05. Proyectos\copilot-k6-skills

# 1) Verify SKILL.md exists in both mirrored locations (if mirrored)
test -f .opencode/skills/k6-test-suite/SKILL.md && echo "OK: OpenCode copy"
test -f .github/skills/k6-test-suite/SKILL.md && echo "OK: Copilot copy"

# 2) Check frontmatter syntax (YAML) and required keys
python -c "
import sys, yaml
for p in ['.opencode/skills/k6-test-suite/SKILL.md','.github/skills/k6-test-suite/SKILL.md']:
    with open(p,encoding='utf-8',errors='ignore') as f:
        s=f.read()
    if not s.startswith('---'):
        print('NO FRONTMATTER',p); sys.exit(1)
    end=s.find('---',3)
    if end<0: print('BAD FRONTMATTER',p); sys.exit(1)
    data=yaml.safe_load(s[3:end])
    for k in ['name','description']:
        if k not in data: print('MISSING',k,p); sys.exit(1)
    print('VALID',p,data['name'])
" 2>&1 | tail -5

# 3) Ensure name matches directory and is well-formed
python -c "
import os,re,sys
root='.opencode/skills/k6-test-suite'
name=open(root+'/SKILL.md',encoding='utf-8').read().split('---')[1]
data=__import__('yaml').safe_load(name)
m=re.fullmatch(r'^[a-z0-9]+(-[a-z0-9]+)*$', data['name'])
assert m, 'bad name'
assert data['name']==os.path.basename(root), 'name!=dir'
print('NAME OK', data['name'])
"

# 4) Spot obvious whitespace / line-ending issues
git diff --check
```

Notes:
- `pyyaml` is available in most environments. If not, `node -e ...` with `js-yaml` also works.
- For mirrored skills (`k6-test-suite`, `k6-grafana-validation`) keep the two copies byte-for-byte identical. Add a quick checksum when changing both:

```bash
fc.exe /B .opencode\skills\k6-test-suite\SKILL.md .github\skills\k6-test-suite\SKILL.md
# or on Unix: cmp -s ...
```

---

## 3) What is an "eval" for a skill?

An **eval** (evaluation) is a tiny, repeatable test that checks the agent's behaviour when the skill is present. For skills there are two layers that are practical today:

| Layer | What it checks | How | When |
|---|---|---|---|
| **Static** | Frontmatter, paths, references exist | Scripts (bash + yaml/json check) | On every edit/PR |
| **Behavioural (smoke)** | Agent uses the skill and produces the expected artefact | Run the agent with a fixed prompt against a scratch workspace, assert files/strings | Before sharing a skill, after prompt edits, on release |
| **Behavioural (regression set)** | Covers edge cases (auth, thresholds, multiple scenarios) | Small suite of prompts + golden outputs | For "stable" skills used in CI or shared widely |

Treat the first as required. Treat the second as the minimum to answer *"After changing the prompt, is the skill still doing what it is expected?"*. Treat the third only if the cost/complexity is justified.

There is no single "official" CLI for skill evals yet. The approach below uses the agent runner that ships with OpenCode (`opencode run`) or GitHub Copilot CLI's non-interactive flows where available. Both run headlessly with a prompt and can write files to a workspace.

---

## 4) Creating a repeatable behavioural test (smoke test)

Pick one canonical use case per skill. For `k6-test-suite` a good smoke test is: *"Generate a k6 test suite for https://petstore3.swagger.io/api/v3 with smoke and load tests, no auth, p(95)<500ms."* The expected contract is that it creates the agreed project structure and key files.

### 4.1 Create an isolated test workspace

Never run evals inside the repo. Use a temp directory so generated files don't leak.

```bash
$WORK = "$env:TEMP\k6-skill-eval-$(Get-Date -Format HHmmss)"
New-Item -ItemType Directory -Force -Path $WORK | Out-Null
Copy-Item -Recurse -Force ".opencode\skills" "$WORK\.opencode\skills"
Set-Location $WORK
```

On Unix: `WORK=$(mktemp -d); cp -r .opencode/skills "$WORK/"; cd "$WORK"`

### 4.2 Write a golden checklist

Define assertions explicitly. For `k6-test-suite`, assert:

- Directories exist: `configs/`, `constants/`, `shared/`, `tests/`, `workloads/`
- Files exist: `Makefile`, `configs/smoke.json`, `configs/load.json`, `workloads/smoke.js`, `workloads/load.js`
- `configs/load.json` uses `ramping-arrival-rate`
- `workloads/*.js` tag requests with `operation`
- `Makefile`/run instructions include `-o experimental-prometheus-rw` and the Prometheus URL `http://localhost:9090/api/v1/write`
- Thresholds include `http_req_duration` p(95)<500 and `http_req_failed` rate<0.01 (or the requested values)

Store this checklist next to the eval (e.g. `eval/checks.ps1` or `eval/checks.py`).

### 4.3 Run the agent non-interactively (OpenCode)

Use `opencode run` to send a single prompt and let it act. By default it runs in the current directory. Attach the skills by running from the workspace that contains `.opencode/skills/`.

```bash
# From the isolated workspace ($WORK)
opencode run "Generate a k6 test suite for https://petstore3.swagger.io/api/v3 with smoke and load tests, no auth, p(95)<500ms, error rate < 0.01. Follow the k6-test-suite skill exactly."
```

If you want to pin a model/agent or avoid TUI output, `opencode run --format json` is available to stream events, but for a smoke test it's usually enough to run it once and inspect files. For CI, prefer `--format json` + a small parser.

Notes:
- `opencode run` accepts the message as positional args; quotes are fine on PowerShell/cmd.
- If the workspace has `opencode.json`, permissions still apply. For an eval you may want to `allow` all skills or use `--auto` **only** in a throwaway workspace (dangerous in real projects).
- The skills are discovered from `.opencode/skills/` in that workspace (and parents). Since we copied them, they're present.

### 4.4 Run the agent (GitHub Copilot CLI)

If you use `gh copilot` CLI:

```bash
cd "$WORK"
gh copilot agent run "Generate a k6 test suite for https://petstore3.swagger.io/api/v3 with smoke and load tests, no auth, p(95)<500ms. Use the k6-test-suite skill." --file .github/skills
```

Availability varies by version. The key idea is the same: fixed prompt, fixed workspace, inspect outputs. Check `gh copilot --help` for the current non-interactive command.

### 4.5 Assert the golden checklist

After the agent finishes, run assertions against the generated files.

PowerShell example (`eval/assert.ps1`):

```powershell
$fail=0
$need=@('configs','constants','shared','tests','workloads','Makefile','configs/smoke.json','configs/load.json','workloads/smoke.js','workloads/load.js')
foreach($n in $need){ if(-not (Test-Path $n)){ Write-Error "MISSING $n"; $fail++ } }

# Check ramping-arrival-rate in load
if(Test-Path 'configs/load.json'){
  $j = Get-Content 'configs/load.json' | ConvertFrom-Json
  if($j.scenarios.PSObject.Properties.Value.executor -notcontains 'ramping-arrival-rate'){
    Write-Error "load.json missing ramping-arrival-rate"; $fail++
  }
}

# Check operation tags
$w = Get-ChildItem workloads -Filter *.js | Get-Content
if($w -notmatch "operation"){ Write-Error "missing operation tag"; $fail++ }

# Check Prometheus RW
$m = Get-Content Makefile -Raw
if($m -notmatch "experimental-prometheus-rw"){ Write-Error "missing prometheus rw"; $fail++ }
if($m -notmatch "http://localhost:9090/api/v1/write"){ Write-Error "missing rw url"; $fail++ }

exit $fail
```

Python equivalent is also fine.

---

## 5) Turning evals into a repeatable script

Put everything under an `eval/` folder in the skill's directory (or at repo level) so it can be versioned with the skill.

Suggested layout:

```
k6-test-suite/
├── SKILL.md
└── eval/
    ├── smoke_prompt.txt      # Canonical user request
    ├── run_eval.ps1          # Creates temp workspace, runs agent, asserts
    ├── assert.ps1            # Assertions
    └── README.md             # How to run
```

Minimal `run_eval.ps1` (OpenCode):

```powershell
param(
  [string]$SkillDir = (Resolve-Path ".\k6-test-suite").Path,
  [string]$OpenCode = "opencode"
)
$ws = Join-Path $env:TEMP ("k6-eval-" + [guid]::NewGuid())
New-Item -ItemType Directory -Force -Path $ws | Out-Null
New-Item -ItemType Directory -Force -Path "$ws\.opencode" | Out-Null
Copy-Item -Recurse -Force (Join-Path $SkillDir "..") "$ws\.opencode\skills"  # copy skills folder
$prompt = Get-Content (Join-Path $PSScriptRoot "smoke_prompt.txt") -Raw
Push-Location $ws
try {
  & $OpenCode run $prompt.Trim()
  Pop-Location
  & (Join-Path $PSScriptRoot "assert.ps1") -Path $ws
} finally {
  Pop-Location
  # Remove-Item -Recurse -Force $ws  # keep for debugging on failure
}
```

Adjust the copy path to your layout (if `eval/` is inside the skill, go up once to get `skills/` context, or copy just that skill). For the mirrored case, copying `.opencode/skills` is enough for OpenCode evals.

---

## 6) Testing after changing the prompt

The most common regression is "I rephrased the workflow and now the agent no longer tags requests with `operation`". Use this checklist every time you touch `SKILL.md`:

1. **Diff review**: `git diff -U0 k6-test-suite/SKILL.md` — read only changed lines. Look for removed "must", "always", file names, or example commands.
2. **Structural sanity**: run the static checks (frontmatter, name==dir, mirrors identical).
3. **Smoke eval**: run the eval against the canonical prompt. It must pass before committing.
4. **Spot-check the generated output**: open 1 workload and 1 config from the eval workspace. Do they match the conventions (executor, thresholds, tags)?
5. **If you changed a reference**: verify the referenced file still exists and is read in a realistic prompt (e.g. the eval triggers it, or ask the agent to load the skill and read that file).
6. **Mirror consistency**: if you edited both copies, checksum them. If only one was edited by mistake, fix it.

If the eval fails, compare the new generated files to a known-good golden set. Keep a `golden/` folder (small, committed) for the smoke case:

```
eval/
├── golden/
│   ├── configs/load.json
│   ├── workloads/load.js
│   └── Makefile
└── assert_vs_golden.ps1  # deep compare (ignoring timestamps/paths)
```

But don't overfit: compare only the invariant parts (executor name, threshold strings, presence of `operation`, RW flags). Exact string equality will be brittle across models/versions.

---

## 7) Testing resources, permissions and discovery

Skills don't just produce files — they also reference other files and can be gated by permissions.

### 7.1 References and on-demand loading

To verify that a reference file is actually usable:

```bash
opencode run "Load the k6-grafana-validation skill and use reference/bottleneck-patterns.md to explain p95/p50 ratio."
```

Expect: the agent cites the ratio table (healthy/warning/critical). If it hallucinates numbers, the reference path is probably unclear in `SKILL.md`.

### 7.2 Discovery test

```bash
opencode run "What skills are available? List only k6 skills with their descriptions."
```

Should list `k6-test-suite` and `k6-grafana-validation` with the current descriptions. If a skill disappeared, check:
- `SKILL.md` is named exactly `SKILL.md` (caps)
- frontmatter has `name` and `description`
- `name` matches directory and passes the regex
- unique across all discovered locations
- not denied by permissions

### 7.3 Permissions test

Create a throwaway `opencode.json` in the eval workspace:

```json
{
  "permission": { "skill": { "*": "deny", "k6-test-suite": "allow" } }
}
```

Run:

```bash
opencode run "Load k6-grafana-validation skill and summarize its workflow."
```

Expected: the agent cannot load it (permission denied / skill hidden). Then:

```bash
opencode run "Load k6-test-suite skill and generate smoke test for https://httpbin.org/get."
```

Expected: allowed and proceeds.

This catches accidental `deny` rules or overly broad patterns.

---

## 8) Adding evals to CI (optional but recommended)

Keep CI minimal. A good first pass runs structural checks on every PR that touches `.opencode/skills/**` or `.github/skills/**`.

Example GitHub Actions (conceptual):

```yaml
name: skill-evals
on:
  pull_request:
    paths:
      - '.opencode/skills/**'
      - '.github/skills/**'
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install pyyaml
      - name: Structural checks
        run: |
          python scripts/check_skills.py  # validates frontmatter, name==dir, mirrors equal
      - name: Smoke eval (non-blocking or blocking)
        if: false  # enable when stable
        run: |
          scripts/run_skill_eval.sh k6-test-suite
```

Notes for OpenCode in CI:
- `opencode run` needs credentials (model key). Use repository/org secrets and a minimal model.
- Network access may be needed if the agent fetches docs, but smoke tests that only generate files don't require external calls except the model API.
- Keep evals blocking once they are stable and fast.

---

## 9) Practical tips for "after changing the prompt"

- **Change one thing at a time.** If you rewrote the entire workflow, run the smoke eval before and after on the same prompt.
- **Make triggers explicit.** Put the canonical trigger phrase in `description` (the words users actually type). If you change `description`, re-test discovery.
- **Name paths explicitly.** If you moved a file to `reference/`, update every `See reference/...` line in `SKIELD.md` (and any cross-links).
- **Don't rely on "the agent will figure it out".** Replace vague advice ("consider tags") with an imperative ("tag every HTTP request with `{ tags: { operation: '<name>' } }`").
- **Preserve invariants.** For k6 skills: `ramping-arrival-rate` preference, `p(95)<500ms`, `rate<0.01`, Prometheus RW URL, `operation` tags, `ENVIRONMENT` default `dev`. Encode these as bullets the agent must follow.
- **Test with the same "contract".** The eval prompt should not change unless the contract changes. If the contract changes, update the golden set intentionally.
- **Log what you changed.** In the PR description, list what the eval covers and link to the eval script.

---

## 10) Quick start checklist

Copy this to your PR when editing any skill.

```text
- [ ] Frontmatter valid (name, description present; name matches dir; regex OK)
- [ ] Mirrors identical (.opencode and .github) if both exist
- [ ] References point to files that exist
- [ ] Smoke eval passes with canonical prompt
- [ ] Generated artefacts contain required invariants (executor, thresholds, tags, RW)
- [ ] Discovery text reflects new description
- [ ] Permissions unchanged or explicitly tested
```

---

## 11) Example smoke_prompt.txt

For `k6-test-suite`:

```text
Generate a k6 test suite for https://petstore3.swagger.io/api/v3 with smoke and load tests, no auth, p(95)<500ms, error rate < 0.01. Follow the k6-test-suite skill exactly. Output to the current directory.
```

For `k6-grafana-validation` (behavioural smoke is harder without a real Prometheus run; start with discovery + activation):

```text
Load k6-grafana-validation skill. Confirm prerequisites and list the exact PromQL to check p95 latency and error rate.
```

---

## 12) Where this fits in the workshop

- **Module 1** (foundations): use structural checks and discovery test.
- **Module 2** (write skill): create `eval/` and the first smoke eval.
- **Module 5** (run+validate): extend evals to assert against a real k6 run + Prometheus.
- **Module 6** (extend+share): add permission tests and CI.

After changing any prompt in `SKILL.md`, run the smoke eval. If it passes and the checklist is green, the skill is still doing what it is expected to do.
