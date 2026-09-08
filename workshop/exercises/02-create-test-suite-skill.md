# Exercise 2: Create the k6 Test Suite Skill

**Objective:** Build a `SKILL.md` that instructs the agent to generate a k6 performance test suite with Prometheus output.

**Time:** 30 minutes

---

## What you will learn

- How to write a skill from scratch
- How to encode team conventions into skill instructions
- How the agent uses the skill to generate files

---

## Reference

Before you start, look at these existing skills for patterns:

- `.github/skills/k6-config-generator/SKILL.md` — config generation workflow
- `.github/skills/k6-boilerplate-generator/SKILL.md` — full project generation
- `.github/skills/k6-auth-generators/SKILL.md` — utility file generation

---

## Steps

### 1. Create the skill directory

```bash
mkdir -p .opencode/skills/k6-my-custom-suite
```

### 2. Write the frontmatter

Create `.opencode/skills/k6-my-custom-suite/SKILL.md`:

```yaml
---
name: k6-my-custom-suite
description: Generates a k6 test suite with smoke, load, and stress scenarios for a given API, including Prometheus remote write output for Grafana.
---
```

### 3. Add the description section

```markdown
# k6 Custom Suite Skill

## Description

Creates a k6 performance test suite tailored to a specific API. Generates configuration files, workload scripts, and a Makefile. All tests stream results to Prometheus via remote write for Grafana visualization.
```

### 4. Add the workflow

The workflow tells the agent step by step what to do when the skill is loaded:

```markdown
## Workflow

### 1. Gather requirements
Ask the user for:
- Target API URL
- Which test types to include (smoke, load, stress)
- Threshold values (defaults: p(95)<500ms, error rate<1%)

### 2. Generate configuration files
Create a `configs/` directory with JSON config files for each test type.

Each config must include:
- A scenario with `ramping-arrival-rate` executor
- Thresholds for `http_req_duration` and `http_req_failed`
- `preAllocatedVUs` and `maxVUs` settings

Example load config:
{
  "scenarios": {
    "load": {
      "executor": "ramping-arrival-rate",
      "startRate": 1,
      "timeUnit": "1s",
      "preAllocatedVUs": 3,
      "maxVUs": 30,
      "stages": [
        { "target": 20, "duration": "30s" },
        { "target": 20, "duration": "1m" },
        { "target": 0, "duration": "30s" }
      ]
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"]
  }
}

### 3. Generate workload scripts
Create a `workloads/` directory with a JS file for each test type.

Each script must:
- Import http from 'k6/http'
- Import check, sleep, group from 'k6'
- Make HTTP requests to the target API
- Use check() to validate response status
- Use sleep() between requests (1-2 seconds)
- Tag requests with operation labels

### 4. Generate a Makefile
Create a Makefile with targets for each test type.

Each target must run k6 with:
  k6 run -o experimental-prometheus-rw \
    -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
    configs/<type>.json workloads/<type>.js

### 5. Validate
Confirm all generated files are syntactically valid.
```

### 5. Add conventions

```markdown
## Key conventions

- Default thresholds: p(95)<500ms, rate<0.01
- Executor: ramping-arrival-rate (not constant-vus)
- All HTTP requests tagged with operation label
- Environment variable: ENVIRONMENT (default: dev)
- Max VUs: 30 for local execution
```

### 6. Add usage examples

```markdown
## Usage

Prompt examples:

- "Generate a k6 test suite for https://api.example.com"
- "Create load and stress tests for the Petstore API"
- "Build a k6 suite with Prometheus output for Grafana"
```

### 7. Test the skill

1. Save the file.
2. Ask the agent: *"What skills are available?"*
3. Verify `k6-my-custom-suite` appears.
4. Ask the agent: *"Generate a k6 test suite for https://petstore3.swagger.io/api/v3"*
5. Observe that the agent loads the skill and follows its conventions.

### 8. Clean up

Once you have verified the skill works, remove it:

```bash
rm -rf .opencode/skills/k6-my-custom-suite
```

The reference `k6-test-suite` skill in the repo is the polished version.

---

## Key takeaways

- The skill is a **contract**: it defines what the agent should produce and how.
- Conventions in the skill ensure consistency across runs and team members.
- The agent follows the workflow steps in order, asking for missing information.

---

## Next

Proceed to Exercise 3: [Grafana Stack Setup](03-grafana-stack.md)
