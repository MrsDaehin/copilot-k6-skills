---
name: k6-grafana-validation
description: Validates and analyzes k6 test results against Grafana by querying Prometheus metrics via mcp-grafana, checking SLO thresholds, diagnosing bottlenecks (percentile health, HTTP duration breakdown, root-cause patterns), and verifying dashboard panels.
---

# k6 Test Result Analysis & Grafana Validation Skill

## Description

After a k6 test run streams results to Prometheus via `experimental-prometheus-rw`, this skill drives the `mcp-grafana` and `mcp-k6` MCP servers to:

1. Capture the results (k6 console/summary output and Prometheus time series)
2. Validate them against defined SLO thresholds
3. **Analyze** the results: percentile health, HTTP request duration breakdown, and bottleneck identification
4. Verify Grafana dashboard panels are populated
5. Produce a pass/fail report with findings and optimization recommendations

This closes the feedback loop: **Skill generates suite -> k6 runs -> Prometheus stores -> Grafana validates & analyzes**.

## Prerequisites

- Grafana instance running with a Prometheus datasource
- k6 test results written to Prometheus via `experimental-prometheus-rw`
- `mcp-grafana` MCP server configured and reachable
- `mcp-k6` MCP server available for optional run/validate commands and console output

## Sources of test results

Combined results with two complementary sources:

| Source | Provided by | Good for |
|--------|-------------|----------|
| k6 console/summary output | `mcp-k6` `run_script` / `validate_script`, or the k6 CLI | Exact run picture: `avg`/`min`/`med`/`max`/`p(95)` per metric, threshold ✓/✗ |
| Prometheus time series | `mcp-grafana` `query_prometheus` / `query_prometheus_histogram` | Time-boxed queries, operation-level breakdowns, dashboard panels |

Use the console output for the fix on the run; use Prometheus for deeper, repeatable analysis.

## Analysis workflow

### 1. Gather results

Confirm data is available in Prometheus:

```promql
k6_http_reqs_total
```

If this returns time series data, the run has been recorded. If not, report that the test has not run or remote write output was not configured.

If the run was executed through `mcp-k6`, also read the `metrics` and `summary` from the `run_script` response — they mirror the k6 end-of-test summary.

### 2. Review the summary output

From the end-of-test summary, note:

- Threshold verdicts per metric (`✓` passed, `✗` failed)
- `iterations` and `http_reqs` rate (requests per second) — did we hit the target load?
- `vus` — did the load profile reach the intended concurrency?
- `http_req_failed` — overall error rate
- `checks` — assertion pass rate

### 3. Analyze response time percentiles

Centiles tell you the distribution of user experience:

| Percentile | Meaning |
|------------|---------|
| `p(50)` / `med` | Half of requests are faster. Typical user experience. |
| `p(90)` | 90% of requests are faster. Most users' experience. |
| `p(95)` | 95% of requests are faster. Common SLO target. |
| `p(99)` | 99% of requests are faster. Worst case for most users. |

**Ratio rule of thumb** (see `reference/bottleneck-patterns.md`):

| Ratio | Healthy | Warning | Critical |
|-------|---------|---------|----------|
| p95 / p50 | < 2x | 2–5x | > 5x |
| p99 / p50 | < 3x | 3–10x | > 10x |
| Error rate | < 0.1% | 0.1–1% | > 1% |

If p95 is 2x+ the median, some requests are significantly slower — look at tail latency, not just the average.

### 4. Break down HTTP request duration

The total `http_req_duration` is composed of:

```
blocked → connecting → tls_handshaking → sending → waiting → receiving
                                                      ↑
                                              (TTFB / server time)
```

Query each component's average time in Prometheus (bucket-based remote write output):

```promql
sum(rate(k6_http_req_blocked_sum[1m])) / sum(rate(k6_http_req_blocked_count[1m]))
```

Repeat for `connecting`, `tls_handshaking`, `sending`, `waiting`, `receiving`.

Or for p95 of any component:

```promql
histogram_quantile(0.95,
  sum(rate(k6_http_req_waiting_bucket[1m])) by (le)
)
```

| Component | What it measures | Typical cause of high values |
|-----------|------------------|------------------------------|
| `http_req_blocked` | Time in queue before request starts | Connection pool exhaustion, DNS lookup |
| `http_req_connecting` | TCP connection time | Network latency, server far away |
| `http_req_tls_handshaking` | TLS/SSL handshake | Missing keep-alive, new connections per request |
| `http_req_sending` | Time to send request body | Large request body, slow upload |
| `http_req_waiting` | Server processing time (TTFB) | Slow backend, DB queries, server overload |
| `http_req_receiving` | Time to download response | Large response body, slow network |

Identify the dominant component — that is usually where the bottleneck lives.

### 5. Identify the bottleneck

Use `reference/bottleneck-patterns.md` and map the observed signals to a pattern:

- **Connection pool exhaustion** — blocked p95 > 100ms, connecting stays low
- **TLS overhead** — TLS handshake consistently > 50ms, first request much slower
- **Server-side bottleneck** — waiting (TTFB) grows as VUs increase
- **Response size** — receiving is high relative to total duration
- **Gradual degradation** — metrics worsen over time (soak)
- **Sudden failure** — spike at a specific VU/RPS threshold

### 6. Validate SLO thresholds via PromQL

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

Report only; confirms the load profile was applied.

**Checks:**

```promql
k6_checks
```

Report only; cross-check the assertion pass rate against the k6 console summary (`checks` metric).

### 7. Validate operation-level breakdowns

If the test tagged requests with `operation`, query per-operation metrics:

```promql
histogram_quantile(0.95,
  sum(rate(k6_http_req_duration_bucket{operation!=""}[1m])) by (operation, le)
)
```

And per-operation error rate:

```promql
sum(rate(k6_http_req_failed_total{operation!=""}[1m])) by (operation) /
sum(rate(k6_http_reqs_total{operation!=""}[1m])) by (operation)
```

Verify each operation individually against its specific threshold and identify which operation drives the overall bottleneck.

### 8. Verify Grafana dashboard panels

Use `mcp-grafana` to:

- `search_dashboards` for a k6-related dashboard
- `get_dashboard_summary` to confirm panels exist and have data
- `run_panel_query` on key panels (request rate, latency, error ratio, active VUs) to verify they return non-empty results

Report which panels are populated and which are empty.

### 9. Produce the validation report

Output a structured summary including the **analysis findings**, not just pass/fail:

```
k6 Test Result Analysis & Validation Report
============================================

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

Latency Distribution
--------------------
p50: 118ms   p90: 231ms   p95: 342ms   p99: 812ms
p95 / p50 = 2.9x  →  WARNING (2–5x tails)

Duration Breakdown
------------------
Component               Avg        Share of total
------------------------------------------------
blocked                 4ms        3%
connecting              8ms        6%
tls_handshaking         9ms        7%
sending                 0.1ms      0%
waiting (TTFB)          98ms       75%   ← dominant
receiving               13ms       10%

Suspected bottleneck: server-side processing (waiting/TTFB).
Recommendations: profile backend, check DB queries, review cache strategy.

Dashboard Panels
----------------
Panel                      Status
---------------------------
Request Rate               Populated
p95 Latency                Populated
Error Ratio                Populated
Active VUs                 Populated

Overall: PASS (2/2 SLO checks passed) with 1 warning (tail latency + waiting time).
```

### 10. On failure: diagnose

If an SLO check fails:

- Query the failing metric with a narrower time window
- Query by operation or endpoint to isolate the culprit (`operation` tag)
- Query the duration breakdown to locate the latency component (blocked vs waiting vs receiving)
- Correlate with Grafana application metrics (server CPU, memory, latency) if available
- Suggest a likely root cause pattern and practical next steps (see `reference/bottleneck-patterns.md`)
- Re-run the test with adjusted parameters and compare

## Grafana metric mapping (k6 -> Prometheus)

| k6 Metric | Prometheus Metric |
|-----------|-------------------|
| `http_reqs` | `k6_http_reqs_total` |
| `http_req_failed` | `k6_http_req_failed_total` |
| `http_req_duration` | `k6_http_req_duration_bucket` / `_sum` / `_count` |
| `http_req_blocked` | `k6_http_req_blocked_bucket` / `_sum` / `_count` |
| `http_req_connecting` | `k6_http_req_connecting_bucket` / `_sum` / `_count` |
| `http_req_tls_handshaking` | `k6_http_req_tls_handshaking_bucket` / `_sum` / `_count` |
| `http_req_sending` | `k6_http_req_sending_bucket` / `_sum` / `_count` |
| `http_req_waiting` | `k6_http_req_waiting_bucket` / `_sum` / `_count` |
| `http_req_receiving` | `k6_http_req_receiving_bucket` / `_sum` / `_count` |
| `vus` | `k6_vus` |
| `iterations` | `k6_iterations_total` |
| `data_sent` | `k6_data_sent_total` |
| `data_received` | `k6_data_received_total` |
| `checks` | `k6_checks_total` |

Custom k6 metrics (e.g., `Trend`, `Counter`) with `operation` tags are also written to Prometheus.

## References

- **`reference/bottleneck-patterns.md`** — diagnostic matrix, six bottleneck patterns, and performance ratio guidelines
- **`reference/metrics.md`** — full k6 metrics reference and custom metric types

## Usage

Prompt examples:

- *"Validate the latest k6 test run against our Grafana dashboard"*
- *"Query Prometheus for the p95 latency from the last load test and check if it passed the 500ms SLO"*
- *"Analyze the last load test: what is the dominant latency component and where is the bottleneck?"*
- *"Check which panels on the k6 dashboard have data from the stress test"*
- *"Compare the p95/p50 ratio of the last two runs and tell me which had healthier tail latency"*
- *"Why did p99 spike during the soak test? Check the duration breakdown by operation."*

## Related skills

- **k6-test-suite** — Generates the test suite that feeds data to this validation workflow
- **k6-config-generator** — Generates threshold definitions checked by this skill
- **k6-html-report** — Alternative local reporting without Grafana
- **mcp-k6** (MCP server) — Provides console/summary output for runs executed through the agent