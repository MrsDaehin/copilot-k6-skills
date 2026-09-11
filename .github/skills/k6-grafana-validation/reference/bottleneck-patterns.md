# k6 Bottleneck Patterns Reference

Use this to map observed k6 metrics to root causes and actions during result analysis.

## Diagnostic Matrix

| Symptom | Primary Metric | Root Cause | Action |
|---------|---------------|------------|--------|
| High blocked time | `http_req_blocked` > 100ms | Connection pool exhaustion, DNS issues | Increase connection pool, use HTTP keep-alive |
| High connecting time | `http_req_connecting` > 50ms | Server distance, TCP overhead | Use closer servers, CDN, connection reuse |
| High TLS time | `http_req_tls_handshaking` > 100ms | New TLS connection per request | Enable keep-alive, TLS session resumption |
| High waiting time | `http_req_waiting` > 500ms | Slow server processing | Optimize backend, DB queries, caching |
| High receiving time | `http_req_receiving` > 100ms | Large response body | Compress responses, paginate, reduce payload |
| High error rate | `http_req_failed` > 1% | Server overload, bugs | Check error codes, server logs, capacity |
| Low throughput | `http_reqs` rate declining | Resource saturation | Scale infrastructure, optimize code |
| Dropped iterations | `dropped_iterations` > 0 | Not enough VUs for target rate | Increase `preAllocatedVUs` or `maxVUs` |

## Pattern 1: Connection Pool Exhaustion

**Symptoms:**
- `http_req_blocked` p95 > 100ms (often > 1s)
- `http_req_blocked` increases over time
- `http_req_connecting` stays low

**Diagnosis:** Requests queue waiting for available connections before they start.

**Solutions:**
- Check target server connection limits
- Reduce concurrent VU count
- Add think time (`sleep()`) between requests
- Check if server supports HTTP/2 (multiplexing)

## Pattern 2: TLS Overhead

**Symptoms:**
- `http_req_tls_handshaking` consistently > 50ms
- First requests much slower than subsequent ones
- `http_req_blocked` correlates with TLS timing

**Diagnosis:** New TLS connections established per request instead of being reused.

**Solutions:**
- k6 reuses connections by default within an iteration
- Ensure server supports TLS session resumption
- Check if `noConnectionReuse` is accidentally set
- Consider HTTP/2 for multiplexing over a single connection

## Pattern 3: Server-Side Bottleneck

**Symptoms:**
- `http_req_waiting` (TTFB) increases as VUs increase
- `http_req_waiting` is the dominant component of duration
- `http_req_sending` and `http_req_receiving` remain low

**Diagnosis:** Server struggling under load — CPU, memory, database, or application bottleneck.

**Solutions:**
- Profile server-side code
- Optimize database queries (indexes, caching)
- Scale horizontally (add servers)
- Implement caching (Redis, CDN)
- Check thread/connection pool limits

## Pattern 4: Response Size Bottleneck

**Symptoms:**
- `http_req_receiving` high relative to total duration
- `data_received` very high
- Throughput drops as response sizes increase

**Diagnosis:** Large response payloads consuming bandwidth and processing time.

**Solutions:**
- Enable response compression (gzip, brotli)
- Implement pagination for list endpoints
- Return only necessary fields (field selection)
- Use `discardResponseBodies: true` in k6 options if the body is not needed for checks

## Pattern 5: Gradual Degradation (Soak Test)

**Symptoms:**
- Metrics gradually worsen over time
- `http_req_duration` slowly increases during a soak test
- Error rate slowly creeps up

**Diagnosis:** Memory leak, connection leak, or resource exhaustion in the server.

**Solutions:**
- Monitor server-side memory usage
- Check for connection/handle leaks
- Verify database connection pool sizing
- Check log file growth and disk space

## Pattern 6: Sudden Failure (Breakpoint)

**Symptoms:**
- Metrics suddenly spike at a specific VU count or RPS
- Error rate jumps from ~0% to a high percentage
- `http_req_duration` increases dramatically

**Diagnosis:** System hit a hard limit (connection limit, thread pool, memory).

**Solutions:**
- Identify the exact threshold where failure begins
- Check server error logs at that timestamp
- Common limits: max connections, max threads, memory, file descriptors
- Tune the specific limit or scale infrastructure

## Correlation Between Metrics

**Healthy test:**
- `http_req_duration` stable across all percentiles
- `http_req_failed` near 0%
- `http_reqs` rate matches expected throughput
- `dropped_iterations` = 0

**Signs of trouble:**
- p99 >> p50 (high variance = inconsistent performance)
- `http_req_failed` increasing over time
- `http_reqs` rate declining while VUs stay constant
- `http_req_blocked` growing (connection issues)
- `dropped_iterations` increasing (cannot keep up with arrival rate)

## Performance Ratio Guidelines

| Ratio | Healthy | Warning | Critical |
|-------|---------|---------|----------|
| p95 / p50 | < 2x | 2–5x | > 5x |
| p99 / p50 | < 3x | 3–10x | > 10x |
| Error rate | < 0.1% | 0.1–1% | > 1% |
| TTFB / Duration | < 80% | 80–95% | > 95% |