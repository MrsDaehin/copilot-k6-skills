[<- Back to Workshop overview](../../workshop.md)

# 00 — Using the Grafana MCP Server

This guide shows how to start **mcp-grafana**, Grafana's Model Context Protocol server, connect it to the local workshop stack, and use it from an AI coding assistant to query dashboards, Prometheus metrics, and the rest of the observability ecosystem.

> **Reference:** [mcp-grafana on GitHub](https://github.com/grafana/mcp-grafana) · [Grafana MCP docs](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/ai-assistant/mcp-server/) · [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers)

---

## What is mcp-grafana?

`mcp-grafana` is an official Grafana MCP server. It gives an MCP-capable assistant tools to interact with a Grafana instance:

- **Dashboards** — search, open, summarize, and extract panel queries.
- **Prometheus** — run PromQL queries, list metric names and labels, compute percentiles with `histogram_quantile`.
- **Loki** — query logs and metrics with LogQL.
- **Alerting, annotations, snapshots, incidents, OnCall** — manage and inspect the rest of the stack.
- **`user_info`** — confirm which service account the server is talking to Grafana as.

In this workshop it is the **observability** half of the loop: `mcp-k6` runs the test, metrics land in Prometheus via remote write, and `mcp-grafana` lets the agent inspect the results and diagnose bottlenecks.

---

## How it fits the workshop

```text
AI coding assistant
   |
   +-- Agent Skills  -> how the team works (k6-test-suite, k6-grafana-validation)
   |
   +-- mcp-k6        -> validate and run k6 tests
   |
   +-- mcp-grafana   -> dashboards / Prometheus / Loki     <- this guide
                        |
                        v
                   workshop/stack  (Grafana + Prometheus in Docker)
```

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Docker | Required for the container path used in this guide |
| The workshop stack | `workshop/stack/docker-compose.yml`, started first |
| A Grafana service account token | See [REQUIREMENTS.md](../../REQUIREMENTS.md), section 14 |
| An MCP-capable client | VS Code (this workshop), OpenCode, Cursor, or Claude |

---

## 1. Start the stack

Grafana and Prometheus run as Docker containers defined in `workshop/stack/`. Start them before the MCP server, because the container for mcp-grafana joins the same network and will exit if the network does not exist yet.

```bash
cd workshop/stack
docker-compose up -d
```

Verify both services are healthy:

```bash
curl -s http://localhost:3000/api/health
curl -s http://localhost:9090/-/healthy
```

> Prometheus is on `9090`, Grafana on `3000`, sign in with `admin` / `admin`.

---

## 2. Create a service account token

1. Open Grafana at http://localhost:3000 and sign in.
2. Go to **Administration → Service accounts**.
3. Add a service account (e.g. `workshop`), role **Editor**.
4. Add a token and copy it.

Full steps are in [REQUIREMENTS.md](../../REQUIREMENTS.md). Keep the token out of this repository; only the placeholder file is tracked.

## 3. Store the token in `.env`

The repository root keeps a git-ignored `.env` for local secrets. Copy the template and paste your token:

```text
# .env (git-ignored)
GRAFANA_URL=http://localhost:3000
GRAFANA_SERVICE_ACCOUNT_TOKEN=glsa_<paste-token>
```

`.env.example` holds empty placeholders and is safe to commit. The templates in section 4 show how each client (VS Code or OpenCode) reads these values.

---

## 4. Connect the server

### Option A — VS Code (workshop default)

The workshop ships a ready-made config at `.vscode/mcp.json`. The Grafana entry:

```json
{
  "servers": {
    "grafana": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--network",
        "stack_workshop",
        "--entrypoint",
        "/app/mcp-grafana",
        "-e",
        "GRAFANA_URL",
        "-e",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN",
        "grafana/mcp-grafana:latest",
        "--transport",
        "stdio"
      ],
      "env": {
        "GRAFANA_URL": "http://grafana:3000",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "${input:grafanaServiceAccountToken}"
      }
    }
  },
  "inputs": [
    {
      "id": "grafanaServiceAccountToken",
      "type": "promptString",
      "description": "Grafana service account token",
      "password": true
    }
  ]
}
```

To activate it:

1. Open VS Code at the repository root. When asked, **trust** the workspace MCP servers.
2. Open the Command Palette (**Ctrl+Shift+P**) and run **MCP: List Servers**. VS Code lists the servers from `.vscode/mcp.json` and asks you to enable them.
3. Select **grafana** and start it (**MCP: Start Server**). VS Code prompts for the service account token once, then stores it in its secret storage for the session.
4. In chat, scope the tools by mentioning `@grafana`.

The token is a masked input of type `password` and is never written into `mcp.json`, so the file is safe to commit. Paste the token *value*, not the token *name* — the `glsa_...` value and the token name are distinct strings.

### Option B — OpenCode

OpenCode loads `.env` from the project root and interpolates `{env:VAR}` in config strings. Copy `workshop/stack/opencode.json.example` to `opencode.json` at the repository root and fill in the absolute path to this repository in the k6 Docker volume mount:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "grafana": {
      "type": "local",
      "command": ["uvx", "mcp-grafana"],
      "timeout": 30000,
      "environment": {
        "GRAFANA_URL": "{env:GRAFANA_URL}",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "{env:GRAFANA_SERVICE_ACCOUNT_TOKEN}"
      }
    }
  }
}
```

Optionally add the `k6` server from the same example file. Restart OpenCode after saving.

### Option C — any stdio client

Without a client config you can still test the container manually; login again so the token is set in the shell:

```bash
docker pull grafana/mcp-grafana:latest
docker run -i --rm \
  --network stack_workshop \
  --entrypoint /app/mcp-grafana \
  -e GRAFANA_URL=http://grafana:3000 \
  -e GRAFANA_SERVICE_ACCOUNT_TOKEN=$GRAFANA_SERVICE_ACCOUNT_TOKEN \
  grafana/mcp-grafana:latest \
  --transport stdio
```

On Windows PowerShell continue lines with a backtick instead of a backslash.

> **Why these flags?** Both are easy to miss:
>
> - **`--network stack_workshop` + `GRAFANA_URL=http://grafana:3000`** — Grafana is a container, so `localhost:3000` from inside the new container points at the container itself, not the host. The compose network resolves the Grafana *service name*. Find the network name with `docker network ls | findstr workshop`.
> - **`--entrypoint /app/mcp-grafana ... --transport stdio`** — the image entrypoint hardcodes the SSE transport, so without the override the server binds a port (`0.0.0.0:8000`) and never speaks MCP over stdin/stdout. An explicit `--transport stdio` restores the stdio handshake most clients expect.

---

## 5. Verify the connection

Ask your assistant to confirm which identity it is talking to Grafana as:

```text
Use grafana's user_info tool and tell me which account you are connected as.
```

You should see the service account login (e.g. `sa-1-grafana-mcp`) and its organization. If you instead see an HTTP error, Grafana is unreachable from the container; see Troubleshooting.

---

## 6. Use mcp-grafana

The assistant reaches the tools through MCP, so you do not type tool names directly — you describe the outcome and mention `@grafana` (VS Code) or `use grafana` (OpenCode).

### Understand the stack first

```text
Use grafana to list our Prometheus datasource and the k6 Results dashboard.
Get a compact summary of the k6 Results dashboard (without dumping all the JSON).
```

### Monitor a running or just-finished k6 test

```text
Query Prometheus for k6_http_req_duration p50/p95 over the last hour.
Compare the p95 to the <500ms SLO and show me the error rate as a percentage.
```

PromQL examples you can reuse:

```text
show me the metric names matching "k6_*"
query: rate(k6_http_req_duration_seconds_count[5m])
list the label values for "operation" on k6_http_reqs_total
```

### Diagnose a slow endpoint

```text
Find the operation tag with the highest p95 in the last 30 minutes and its top requests.
```

### Pair it with the validation skill

For a full loop, invoke the local skill **k6-grafana-validation** (`.opencode/skills/` or `.github/skills/`):

```text
Run the k6-grafana-validation skill against the last test run: check SLO thresholds,
break down http duration by operation, and tell me what to fix first.
```

The skill drives mcp-grafana (Prometheus/SLO checks, latency breakdowns) and mcp-k6, which is exactly the loop this workshop demonstrates.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Server exits immediately: `network stack_workshop not found` | The stack is not running | `cd workshop/stack && docker-compose up -d` |
| `connection refused` on `localhost:3000` | Casing `localhost` from inside the container | Use `http://grafana:3000` on the compose network |
| Tools are never listed; process binds `0.0.0.0:8000` | Image entrypoint defaults to SSE | Add `--entrypoint /app/mcp-grafana` + `--transport stdio` |
| `401` / `invalid token` | Wrong token pasted, or you supplied the token name | Paste the `glsa_...` value from the service account |
| Token prompt returns after every restart | `inputs` values are per-session | Use `${env:GRAFANA_SERVICE_ACCOUNT_TOKEN}` and launch VS Code from a shell with `.env` loaded |
| Slow first start | `uvx` still downloading the package | Not a failure; give it up to ~30s (`timeout: 30000`) |
| Assistant says the tool is missing | Server not started or not enabled | **MCP: List Servers** → enable and start `grafana` |

---

## Key takeaways

- Start `workshop/stack` with `docker-compose up -d` before the MCP server.
- `mcp-grafana` runs in Docker on the same compose network and reaches Grafana by service name, not `localhost`.
- The image entrypoint forces SSE; override it with `--entrypoint /app/mcp-grafana --transport stdio`.
- The token lives in the git-ignored `.env` or in VS Code secret storage via an `inputs` prompt — never in `mcp.json` or a committed file.
- Use it to inspect dashboards, run PromQL/SLO checks, and, together with `mcp-k6` and `k6-grafana-validation`, to close the generate → run → validate → fix loop.

## Next

Run a k6 test, then drive `k6-grafana-validation` to see the loop in action. See also [REQUIREMENTS.md](../../REQUIREMENTS.md) for the full stack checklist.

## References

- [mcp-grafana — GitHub](https://github.com/grafana/mcp-grafana)
- [Grafana MCP server — docs](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/ai-assistant/mcp-server/)
- [Using the k6 MCP Server](./k6-mcp.md)
- [How to Install OpenCode](./HowtoInstall.md)
- [OpenCode — MCP servers](https://opencode.ai/docs/mcp-servers)
- [VS Code — Model Context Protocol](https://code.visualstudio.com/docs/copilot/Copilot.MCP)
- [k6 — Prometheus remote write output](https://grafana.com/docs/k6/latest/results-output/real-time/prometheus-remote-write/)
