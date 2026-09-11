# Exercise 3: Grafana Stack Setup

**Objective:** Start a local Prometheus + Grafana stack, configure MCP servers in OpenCode, and verify the connection.

**Time:** 20 minutes

---

## What you will learn

- How k6 streams metrics to Prometheus via remote write
- How Grafana visualizes Prometheus data
- How to configure MCP servers in `opencode.json`

---

## Architecture

```text
k6 test run
    |
    v
Prometheus (remote write receiver)
    |
    v
Grafana (dashboard + PromQL queries)
    |
    v
mcp-grafana (MCP server)
    |
    v
OpenCode agent (validation skill)
```

---

## Steps

### 1. Start the stack

Navigate to the stack directory:

```bash
cd workshop/stack
```

Start all services:

```bash
docker-compose up -d
```

Verify:

```bash
docker-compose ps
```

You should see:

| Service | Port |
|---------|------|
| Prometheus | 9090 |
| Grafana | 3000 |

### 2. Verify Prometheus

Open `http://localhost:9090` in your browser.

Go to **Status > Targets** and confirm the Prometheus instance is up.

Run a test query:

```
up
```

Should return `1` for Prometheus itself.

### 3. Verify Grafana

Open `http://localhost:3000` in your browser.

- Username: `admin`
- Password: `admin`

Go to **Connections > Data sources** and confirm the Prometheus datasource is provisioned automatically.

Go to **Dashboards** and confirm the **k6 Results** dashboard exists (it will be empty until k6 sends data).

### 4. Configure MCP servers

Copy the example configuration:

```bash
cp workshop/stack/opencode.json.example opencode.json
```

Edit `opencode.json` and fill in your Grafana credentials:

```json
{
  "mcp": {
    "grafana": {
      "type": "local",
      "command": ["uvx", "mcp-grafana"],
      "env": {
        "GRAFANA_URL": "http://localhost:3000",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "<your-token>"
      }
    }
  }
}
```

To create a Grafana service account token:

1. Go to **Administration > Service accounts** in Grafana.
2. Create a new service account with **Editor** role.
3. Generate a token and paste it into `opencode.json`.

The example file also includes a `k6` MCP server. If you want it usable in the next exercise, replace the `<absolute-path-to-your-repo>` placeholder in the `-v` flag with the absolute path to this repository (OpenCode does not expand `${workspaceFolder}`-style variables). See Exercise 4 for a step-by-step setup.

### 5. Verify MCP connection

Ask the agent:

```
What datasources are available in Grafana?
```

The agent should use the `mcp-grafana` tool to list datasources and return the Prometheus datasource.

### 6. Quick k6 test run

Run a short k6 test to send data to Prometheus:

```bash
k6 run -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  -e PROMETHEUS_RW_TREND_STATS=p(95),p(99),min,max \
  --duration 30s \
  - <<'EOF'
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('https://test.k6.io');
  sleep(1);
}
EOF
```

After the test completes, query Prometheus at `http://localhost:9090`:

```
k6_http_reqs_total
```

You should see time series data from the test.

### 7. Check Grafana dashboard

Open the **k6 Results** dashboard in Grafana.

You should see panels with data from the test run.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `docker-compose up` fails | Ensure Docker is running and ports 3000/9090 are free |
| k6 cannot reach Prometheus | Verify Prometheus remote write receiver is enabled (compose config handles this) |
| Grafana shows no data | Wait 10-15 seconds after k6 finishes; check Prometheus has data first |
| MCP server fails to start | Check `uvx` is installed (`pip install uv` or `brew install uv`) |
| Agent says no datasources | Verify `opencode.json` is in the project root and `GRAFANA_SERVICE_ACCOUNT_TOKEN` is set |

---

## Next

Proceed to Exercise 4: [MCP for k6: Script Generation, Validation, and Execution](04-mcp-k6.md)
