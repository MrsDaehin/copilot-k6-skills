---
name: k6-grafana-validation
description: Validates k6 test results against Grafana by querying Prometheus metrics via mcp-grafana, checking SLO thresholds, and verifying dashboard panels.
---

# k6 Grafana Validation Skill

## Description

After a k6 test run streams results to Prometheus via `experimental-prometheus-rw`, this skill drives the `mcp-grafana` MCP server to:

1. Query the stored metrics with PromQL
2. Validate them against defined SLO thresholds
3. Verify Grafana dashboard panels are populated
4. Produce a pass/fail report

This closes the feedback loop: **Skill generates suite -> k6 runs -> Prometheus stores -> Grafana validates**.

## Prerequisites

- Grafana instance running with a Prometheus datasource
- k6 test results written to Prometheus via `experimental-prometheus-rw`
- `mcp-grafana` MCP server configured and reachable
- `mcp-k6` MCP server available for optional run/validate commands

## Workflow

### 1. Confirm data is available

Use `mcp-grafana` to query a basic metric to confirm Prometheus received k6 data:

```promql
k6_http_reqs_total
```

If this returns time series data, the k6 run has been recorded. If not, report the test has not yet run or output was not configured.

### 2. Validate SLO thresholds via PromQL

Run the following Prometheus queries through `mcp-grafana`'s `query_prometheus` or `query_prometheus_histogram` tool:

**Request duration (p95):**

```promql
histogram_quantile(0.95,
  sum(rate(k6_http_req_duration_bucket[1m])) by (le)
)
```

SLO check: result < threshold (e.g., 500ms).

**Error rate:**

```promql
sum(rate(k6_http_req_failed_total[1m])) /
sum(rate(k6_http_reqs_total[1m]))
```

SLO check: result < 0.01 (1%).

**Request throughput:**

```promql
sum(rate(k6_http_reqs_total[1m]))
```

Report only; no threshold check by default.

**Active virtual users:**

```promql
k6_vus
```

Report only; useful for confirming the load profile was applied.

### 3. Validate operation-level breakdowns

If the test tagged requests with `operation`, query per-operation metrics:

```promql
histogram_quantile(0.95,
  sum(rate(k6_http_req_duration_bucket{operation!=""}[1m])) by (operation, le)
)
```

Verify each operation individually against its specific threshold.

### 4. Verify Grafana dashboard panels

Use `mcp-grafana` to:

- `search_dashboards` for a k6-related dashboard
- `get_dashboard_summary` to confirm panels exist and have data
- `run_panel_query` on key panels (request rate, latency, error ratio) to verify they return non-empty results

Report which panels are populated and which are empty.

### 5. Produce validation report

Output a structured summary:

```
k6 Grafana Validation Report
=============================

Data source:  Prometheus (http://localhost:9090)
Dashboard:    k6 Results (uid: k6-results)
Test run:     <timestamp range>

SLO Checks
----------
Metric                    Actual      Threshold   Result
---------------------------------------------------------
p(95) request duration    342ms       < 500ms     PASS
Error rate                0.003       < 0.01      PASS
Throughput (req/s)        47.2        (info)      ---

Dashboard Panels
----------------
Panel                      Status
---------------------------
Request Rate               Populated
p95 Latency                Populated
Error Ratio                Populated
Active VUs                 Populated

Overall: PASS (2/2 SLO checks passed)
```

### 6. On failure: diagnose

If an SLO check fails:

- Query the failing metric with a narrower time window
- Query by operation or endpoint to isolate the culprit
- Query Grafana application metrics (if available) to correlate (e.g., CPU, memory, latency spikes)
- Suggest possible causes and re-run the test with adjusted parameters

## Grafana metric mapping (k6 -> Prometheus)

| k6 Metric | Prometheus Metric |
|-----------|-------------------|
| `http_reqs` | `k6_http_reqs_total` |
| `http_req_duration` | `k6_http_req_duration_bucket/sum/count` |
| `http_req_failed` | `k6_http_req_failed_total` |
| `vus` | `k6_vus` |
| `data_sent` | `k6_data_sent_total` |
| `data_received` | `k6_data_received_total` |
| `iterations` | `k6_iterations_total` |

Custom k6 metrics (e.g., `Trend`, `Counter`) with `operation` tags are also written to Prometheus.

## Usage

Prompt examples:

- *"Validate the latest k6 test run against our Grafana dashboard"*
- *"Query Prometheus for the p95 latency from the last load test and check if it passed the 500ms SLO"*
- *"Check which panels on the k6 dashboard have data from the stress test"*
- *"Compare the last two test runs in Grafana and tell me which had better latency"*

## Related skills

- **k6-test-suite** — Generates the test suite that feeds data to this validation workflow
- **k6-config-generator** — Generates threshold definitions checked by this skill
- **k6-html-report** — Alternative local reporting without Grafana
