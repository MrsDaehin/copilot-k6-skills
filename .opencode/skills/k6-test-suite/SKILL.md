---
name: k6-test-suite
description: Generates a complete k6 performance test suite with scenario scripts, configuration files, thresholds, and Prometheus remote write output targeting Grafana.
---

# k6 Test Suite Skill

## Description

Creates a production-ready k6 performance test suite that follows team conventions for project structure, workload modeling, threshold definitions, and Grafana-compatible output.

The generated suite streams results to Prometheus via remote write so they appear in a Grafana dashboard, enabling the `k6-grafana-validation` skill to verify SLOs against the stored metrics.

## Outputs

Generates a project structure like:

```
<project>/
├── configs/
│   ├── smoke.json
│   ├── load.json
│   ├── stress.json
│   └── soak.json
├── constants/
│   └── baseurls.js
├── shared/
│   ├── auth.js
│   └── dataGenerator.js
├── tests/
│   └── <endpoint>.js
├── workloads/
│   ├── smoke.js
│   ├── load.js
│   └── stress.js
└── Makefile
```

## Workflow

### 1. Gather requirements

- **Target URL**: The API or endpoint to test.
- **Test type**: Smoke, Load, Stress, Soak, Spike, or all.
- **Auth method**: None, Bearer token, API key, HMAC, OAuth2.
- **Thresholds**: Request duration target (default p(95)<500ms), failure rate cap (default rate<0.01).
- **Grafana output**: Always include Prometheus remote write output.

### 2. Create project structure

Generate all directories:

- `configs/` — scenario and threshold definitions per test type
- `constants/` — base URLs, environment variables
- `shared/` — auth helpers, data generators
- `tests/` — individual endpoint test modules
- `workloads/` — combined scenario scripts

### 3. Generate configuration files

Each config JSON follows this pattern:

```json
{
  "scenarios": {
    "<name>": {
      "executor": "ramping-arrival-rate",
      "startRate": 1,
      "timeUnit": "1s",
      "preAllocatedVUs": 3,
      "maxVUs": 30,
      "stages": [
        { "target": 10, "duration": "30s" },
        { "target": 10, "duration": "1m" },
        { "target": 0,  "duration": "30s" }
      ]
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"]
  }
}
```

Config names by test type:

| Type | Executor | Pattern |
|------|----------|---------|
| Smoke | `constant-arrival-rate` | 1 iter/s, 30s |
| Load | `ramping-arrival-rate` | ramp 1 to 50 iter/s, hold, ramp down |
| Stress | `ramping-arrival-rate` | ramp to beyond expected, hold, recover |
| Soak | `ramping-arrival-rate` | ramp to target, hold 30m+ |
| Spike | `ramping-arrival-rate` | ramp, sudden burst, recovery |

### 4. Generate workload scripts

Each workload script:

- Imports `http` from `k6/http`
- Imports `check`, `sleep`, `group` from `k6`
- Reads `options` from `../configs/<type>.json` via `open()` or embeds inline
- Includes `check()` assertions on HTTP status and response time
- Includes `sleep()` between requests to simulate think time
- Tags requests with `operation` label for Prometheus breakdowns
- Reads the environment via `__ENV.ENVIRONMENT` for base URL selection

### 5. Generate Makefile

```makefile
SMOKE    := k6 run configs/smoke.json workloads/smoke.js
LOAD     := k6 run configs/load.json workloads/load.js
STRESS   := k6 run configs/stress.json workloads/stress.js
SOAK     := k6 run configs/soak.json workloads/soak.js

.PHONY: smoke load stress soak

smoke:   $(SMOKE)
load:    $(LOAD)
stress:  $(STRESS)
soak:    $(SOAK)
```

### 6. Ensure Prometheus remote write output

Every Makefile target and manual run must include:

```bash
k6 run -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  configs/<type>.json workloads/<type>.js
```

The `experimental-prometheus-rw` output writes `k6_` prefixed time series to Prometheus.

### 7. Validate

- Confirm all JSON configs are syntactically valid
- Confirm all `.js` files contain `export default function`
- Confirm all thresholds reference valid k6 metric names
- Confirm Makefile targets are consistent with generated scripts

## Key conventions

- Default thresholds: `p(95)<500ms`, `rate<0.01`
- Executor preference: `ramping-arrival-rate` (arrival rate model) over `constant-vus`
- Tag all HTTP requests with `operation` for Grafana breakdowns
- Environment variable `ENVIRONMENT` selects base URL (default: `dev`)
- Maximum VUs capped at 30 for local execution; scalable via config

## Usage

Prompt examples:

- *"Generate a k6 test suite for https://api.example.com with load and stress tests"*
- *"Create k6 load tests for the Petstore API with JWT auth and p(95)<300ms thresholds"*
- *"Build a k6 suite that outputs to Prometheus for Grafana dashboards"*

## Related skills

- **k6-grafana-validation** — Validates the test results against Grafana after running the suite
- **k6-config-generator** — Generates individual configuration files
- **k6-auth-generators** — Generates auth helper utilities
- **k6-html-report** — Adds custom HTML report output
- **k6-boilerplate-generator** — Generates full project structure from an OpenAPI spec
