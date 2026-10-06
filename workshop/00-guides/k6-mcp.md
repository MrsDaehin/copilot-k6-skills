[<- Back to Workshop overview](../../workshop.md)

# 00 — Using the k6 MCP Server

This guide shows how to start **mcp-k6**, Grafana's Model Context Protocol server for k6, connect it to your AI coding assistant, and use it to generate, validate, and run load tests without leaving the chat.

> **Reference:** [mcp-k6 on GitHub](https://github.com/grafana/mcp-k6) · [Configure your AI assistant — k6 docs](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/) · [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers)

---

## What is mcp-k6?

`mcp-k6` is an **experimental** MCP server, written in Go, that exposes the k6 script lifecycle as tools:

- **Script validation** — `validate_script` runs a script with minimal configuration (1 VU, 1 iteration) and returns actionable errors.
- **Test execution** — `run_script` runs a test locally, with optional `vus`, `duration` (max `5m`), and `iterations` overrides, and returns metrics and a summary.
- **Documentation browsing** — `list_sections` returns a depth-limited tree of the official k6 docs; `get_documentation` fetches the full markdown of one section.
- **Best-practice resources** — the `prompts://k6/generate_script` resource that powers the `generate_script` prompt.

In this workshop it is the **execution** half of the loop: the `k6-test-suite` skill writes the suite, `mcp-k6` runs it, the metrics stream to Prometheus, and [`mcp-grafana`](./grafana-mcp.md) lets the agent read the results back.

---

## How it fits the workshop

```text
AI coding assistant
   |
   +-- Agent Skills  -> how the team works (k6-test-suite, k6-grafana-validation)
   |
   +-- mcp-grafana   -> dashboards / Prometheus / Loki
   |
   +-- mcp-k6        -> validate and run k6 tests                <- this guide
                        |
                        v
                   the k6 engine (inside the container)
```

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Docker | Required for the container path used in this guide |
| An MCP-capable client | VS Code (this workshop), OpenCode, Cursor, or Claude |
| A target to test | The workshop uses `https://petstore3.swagger.io/api/v3` for ad-hoc runs |
| *No* Grafana token | `mcp-k6` executes locally and needs no credentials — unlike `mcp-grafana` |

The Docker image bundles k6 itself, so a native k6 install is **not** required. If you prefer a native install, see [REQUIREMENTS.md](../../REQUIREMENTS.md), section 8.

---

## 1. Install the server

Pull the image once so the first MCP connection is not blocked on a download:

```bash
docker pull grafana/mcp-k6:latest
```

Alternatives, if you would rather not use the container:

| Method | Command |
|--------|---------|
| Homebrew (macOS) | `brew tap grafana/grafana && brew install mcp-k6` |
| Linux packages | `.deb` / `.rpm` from the [latest release](https://github.com/grafana/mcp-k6/releases/latest), installed to `/usr/bin/mcp-k6` |
| Native build | `git clone https://github.com/grafana/mcp-k6 && cd mcp-k6 && make install` (needs Go 1.24.4+ and k6 on `PATH`) |

---

## 2. Decide where scripts live

`mcp-k6` receives the script as text, so it can run a test without touching your disk. To let the agent *write* generated scripts into your project, mount the project folder into the container and run the server from it:

```text
-v <absolute-path-to-your-repo>:/work
-w /work
```

OpenCode does not expand `${workspaceFolder}`-style variables inside a command array, so on Windows and Linux use the full path — for example `C:\Users\<you>\projects\copilot-k6-skills` or `/home/<you>/projects/copilot-k6-skills`. VS Code does expand `${workspaceFolder}`, so its config can stay generic.

---

## 3. Connect the server

### Option A — VS Code (workshop default)

The workshop ships a ready-made config at `.vscode/mcp.json`. The k6 entry:

```json
{
  "servers": {
    "k6": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "${workspaceFolder}:/work",
        "-w",
        "/work",
        "grafana/mcp-k6:latest"
      ]
    }
  }
}
```

To activate it:

1. Open VS Code at the repository root and **trust** the workspace MCP servers.
2. Open the Command Palette (**Ctrl+Shift+P**) and run **MCP: List Servers**. VS Code lists the servers from `.vscode/mcp.json` and asks you to enable them.
3. Select **k6** and start it (**MCP: Start Server**). No token prompt appears — `mcp-k6` needs no credentials.
4. In chat, scope the tools by mentioning `@k6`.

Unlike the `grafana` entry, this one has no `env` block, so nothing secret is written to `mcp.json` and the file stays safe to commit.

### Option B — OpenCode

OpenCode loads `.env` from the project root and interpolates `{env:VAR}` in config strings. Copy the template and adjust it:

```bash
cp workshop/stack/opencode.json.example opencode.json
```

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "k6": {
      "type": "local",
      "command": [
        "docker", "run", "-i", "--rm",
        "-e", "K6_PATH=/usr/bin/k6",
        "-v", "<absolute-path-to-your-repo>:/work",
        "-w", "/work",
        "grafana/mcp-k6:latest"
      ],
      "timeout": 30000,
      "enabled": true,
      "environment": {}
    }
  }
}
```

| Key | Why it matters |
|-----|----------------|
| `environment` | The current schema uses `environment`, not `env`. The checked-in example still says `env` — reconcile it rather than copying it blind. |
| `-v <absolute path>` | OpenCode does not expand variables in the command array, so a literal absolute path is required. |
| `timeout: 30000` | The default is `5000` ms. A cold `docker run` start-up can exceed that; raise it rather than debugging a phantom failure. |
| `enabled: true` | Optional. Set it to `false` to keep the server configured but switched off. |

Restart OpenCode after saving so the servers are reconnected.

### Option C — any stdio client

Without a client config you can still test the container by hand:

```bash
docker run -i --rm \
  -v "$(pwd)":/work \
  -w /work \
  grafana/mcp-k6:latest
```

On Windows PowerShell continue lines with a backtick instead of a backslash, and pass the mount as `-v "C:\path\to\repo:/work"`.

`mcp-k6` also speaks Streamable HTTP, which is how you would share one instance with a team:

```bash
docker run -p 8080:8080 grafana/mcp-k6 -transport=http -addr=:8080
```

Other flags: `-endpoint` (default `/mcp`), `-stateless`, and `-preload` to download all doc bundles at start-up instead of on first use. The server has **no built-in authentication**, so keep it on a trusted network.

---

## 4. Verify the connection

```bash
opencode mcp list
```

Then confirm from inside the agent, naming the server so it does not guess:

```text
What tools does the k6 MCP server provide?
```

You should see `validate_script`, `run_script`, `list_sections`, and `get_documentation`. Docs are downloaded on first use and cached locally, so the first documentation call can take a few seconds.

---

## 5. Use mcp-k6

The assistant reaches the tools through MCP, so you do not type tool names directly — you describe the outcome and mention `@k6` (VS Code) or `use k6` (OpenCode).

### Browse the official docs

```text
Use the k6 MCP server to get the top-level k6 documentation sections.
Fetch the docs for the scenarios section (root_slug "using-k6").
Get the documentation for javascript-api/k6-http.
```

Only the branches you ask for are loaded — that is the point of `list_sections`' depth-limited tree.

### Generate a script from plain English

```text
Use the k6 MCP server to create a k6 load test for
https://petstore3.swagger.io/api/v3 that gets a pet by ID.
```

The agent follows the `prompts://k6/generate_script` template: research the docs, apply the embedded best practices, write the script, then offer to validate it.

### Validate before you run

```text
Validate this script with the k6 MCP server.
```

`validate_script` returns `valid`, `exit_code`, `stdout`, and `stderr`. If it fails, ask for a fix and validate again — cheap compared with a failed load test.

### Run a quick test

```text
Run it with 10 VUs for 30 seconds using the k6 MCP server.
```

`run_script` returns `success`, `exit_code`, `duration`, `metrics`, and `summary`. Ask for the verdict explicitly:

```text
Did the run meet p(95)<500ms and error rate<1%? Summarize the metrics.
```

### Pair it with the skills

| Skill | What it adds on top of `mcp-k6` |
|-------|----------------------------------|
| `k6-test-suite` | Generates a full project — `configs/`, `workloads/`, thresholds, Prometheus remote write — instead of a single ad-hoc script. |
| `k6-grafana-validation` | Judges the run against the SLO and names the dominant latency component, then queries the stored metrics through `mcp-grafana`. |

```text
Use the k6-test-suite skill to generate a suite for the petstore API.
Then use the k6 MCP server to validate and run the smoke scenario.
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Server never starts | Image not pulled | `docker pull grafana/mcp-k6:latest` |
| Agent says the server is not available | OpenCode was not restarted, or the `k6` block is missing | Restart OpenCode, then `opencode mcp list` |
| `Tool discovery timed out` | Cold `docker run` start-up exceeds the 5s default | Add `"timeout": 30000` to the server entry |
| Script writes fail mid-generation | No volume mount, or a relative/`${workspaceFolder}` path | Add `-v <absolute path>:/work -w /work` |
| `k6 not found` inside the container | Native install without k6 on `PATH` | Use the Docker image (k6 is bundled) or add k6 to `PATH` |
| `run_script` rejects the duration | `duration` is capped at `5m` by the tool | Split the run, or use the CLI for long tests |
| Docs call hangs on first use | Downloading the docs bundle | Not a failure — wait, then retry |
| Version mismatch or unexpected tool schema | `mcp-k6` is experimental | `docker pull grafana/mcp-k6:latest` to update |

---

## Key takeaways

- `mcp-k6` is the execution side of the workshop: `validate_script`, `run_script`, and the official k6 docs, plus a `generate_script` prompt backed by best-practice resources.
- The Docker image bundles k6, so no native k6 install is needed; it needs **no credentials**.
- Mount the project with an absolute path so the agent can write generated scripts into your repo.
- In `opencode.json`, use `environment`, an absolute `-v` path, and a `timeout` above the 5s default.
- Together with `mcp-grafana` and the two skills it closes the **generate → run → validate → fix** loop.

---

## Next

Run a test with `mcp-k6`, then hand the stored metrics to [`mcp-grafana`](./grafana-mcp.md) and the `k6-grafana-validation` skill. Exercise [`04-mcp-k6.md`](../exercises/04-mcp-k6.md) walks the same steps as a hands-on lab.

## References

- [mcp-k6 — GitHub](https://github.com/grafana/mcp-k6)
- [k6 — Configure your AI assistant](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/)
- [How to Install OpenCode](./HowtoInstall.md)
- [OpenCode — MCP servers](https://opencode.ai/docs/mcp-servers)
- [VS Code — Model Context Protocol](https://code.visualstudio.com/docs/copilot/Copilot.MCP)
- [k6 — Prometheus remote write output](https://grafana.com/docs/k6/latest/results-output/real-time/prometheus-remote-write/)
