# Exercise 5: Run and Validate

**Objective:** Generate a k6 test suite using the skill, run it, and validate the results against Grafana via MCP.

**Time:** 30 minutes

---

## What you will learn

- How the agent uses a skill to generate a test suite
- How to run k6 with Prometheus remote write output
- How to query metrics via `mcp-grafana`
- How to validate SLO thresholds and verify dashboard panels

---

## Steps

### 1. Generate a test suite

Ask the agent:

```
Load the k6-test-suite skill and generate a load test suite for https://petstore3.swagger.io/api/v3 with p(95)<800ms and error rate<1%.
```

The agent should:

1. Load the `k6-test-suite` skill
2. Create a project structure with configs, workloads, constants, and a Makefile
3. Follow the conventions defined in the skill

Verify the generated structure:

```bash
ls -R <generated-directory>/
```

You should see:

```text
configs/
  load.json
  smoke.json
  stress.json
constants/
  baseurls.js
workloads/
  load.js
  smoke.js
  stress.js
Makefile
```

### 2. Inspect the generated config

Open `configs/load.json` and verify:

- Uses `ramping-arrival-rate` executor
- Has `thresholds` for `http_req_duration` and `http_req_failed`
- Threshold values match your requirements (p(95)<800ms, rate<0.01)

### 3. Inspect the generated workload

Open `workloads/load.js` and verify:

- Imports `http` from `k6/http`
- Imports `check` and `sleep` from `k6`
- Includes `check()` assertions
- Includes `sleep()` calls
- Tags requests with `operation`

### 4. Run the test with Prometheus output

```bash
k6 run -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  -e PROMETHEUS_RW_TREND_STATS=p(95),p(99),min,max \
  configs/load.json workloads/load.js
```

Wait for the test to complete. k6 will stream metrics to Prometheus throughout the run.

### 5. Verify data in Prometheus

Open `http://localhost:9090` and query:

```promql
k6_http_reqs_total
```

You should see time series from the test run.

Try:

```promql
k6_vus
```

You should see the virtual user count over time matching the load profile.

### 6. Validate and analyze via the agent

Ask the agent:

```
Validate the k6 test results against Grafana. Check if the p(95) latency was under 800ms and the error rate was under 1%, then analyze the latency distribution and duration breakdown to identify any bottleneck.
```

The agent should:

1. Load the `k6-grafana-validation` skill
2. Use `mcp-grafana` to query Prometheus:
   - `query_prometheus` for `k6_http_reqs_total`
   - `query_prometheus_histogram` for p95 latency
   - `query_prometheus` for error rate
3. Analyze response-time percentiles (p50/p90/p95/p99) and the p95/p50 ratio
4. Break down `http_req_duration` into its components via the `k6_http_req_*_sum/count` metrics and flag the dominant component
5. Match the signals against `reference/bottleneck-patterns.md` in the skill
6. Produce a validation report with pass/fail results plus analysis findings and recommendations

### 7. Check the dashboard

Open Grafana at `http://localhost:3000` and open the **k6 Results** dashboard.

Verify the panels are populated:

- Request Rate
- p95 Latency
- Error Ratio
- Active VUs

### 8. Query a specific panel via MCP

Ask the agent:

```
Run the p95 latency panel query on the k6 Results dashboard for the last 5 minutes.
```

The agent should use `mcp-grafana`'s `run_panel_query` tool to execute the panel's PromQL and return the result.

### 9. Diagnose a failure (optional)

Adjust the threshold in `configs/load.json` to an impossible value:

```json
"thresholds": {
  "http_req_duration": ["p(95)<1"],
  "http_req_failed": ["rate<0.01"]
}
```

Re-run the test:

```bash
k6 run -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  configs/load.json workloads/load.js
```

k6 will report threshold failures in its output.

Ask the agent:

```
The last test run failed. Query Grafana to find which operations had the highest p(95) latency.
```

The agent should query per-operation metrics and identify the slowest endpoints.

Then dig into the cause:

```
Break down the request duration into blocked, connecting, tls_handshaking, sending, waiting, and receiving for the slowest operation. Which component dominates and what does it suggest?
```

The agent should use the `k6_http_req_*_sum/count` metrics per `operation` and map the dominant component to a bottleneck pattern (e.g., `waiting` = server-side processing, `blocked` = connection pool exhaustion).

---

## Key takeaways

- The skill ensures consistency: every generated suite follows the same conventions.
- Prometheus remote write stores metrics durably for post-run analysis.
- `mcp-grafana` turns Grafana into a queryable data source for the AI agent.
- The `k6-grafana-validation` skill goes beyond pass/fail: it analyzes percentile distribution and the HTTP duration breakdown to pinpoint bottlenecks.
- The feedback loop (generate -> run -> validate -> analyze) is fully AI-driven.

---

## Next

Proceed to Exercise 6: [Extend and Share](06-extend-and-share.md)
