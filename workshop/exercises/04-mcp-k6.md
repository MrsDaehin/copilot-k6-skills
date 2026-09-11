# Exercise 4: MCP for k6 — Script Generation, Validation, and Execution

**Objective:** Use the `mcp-k6` MCP server ([github.com/grafana/mcp-k6](https://github.com/grafana/mcp-k6)) to generate, validate, and run k6 scripts directly from your AI agent — no filesystem workflow required.

**Time:** 20 minutes

---

## What you will learn

- What `mcp-k6` is and how it differs from `mcp-grafana`
- How to configure `mcp-k6` as a local MCP server
- How to browse the official k6 docs through MCP (`list_sections`, `get_documentation`)
- How to generate a k6 script from a natural-language prompt (`generate_script`)
- How to validate and run scripts through the agent (`validate_script`, `run_script`)

---

## Background: two MCP servers, two jobs

By now you have seen `mcp-grafana` in Exercise 3. It is the **read** side: it queries your Grafana/Prometheus data.

`mcp-k6` (also from Grafana) is the **write** side. It is an experimental MCP server written in Go that puts k6's script lifecycle in the agent's hands:

| Component | What it does |
|-----------|--------------|
| `validate_script` tool | Runs a script with minimal config (1 VU, 1 iteration) and returns actionable errors |
| `run_script` tool | Runs a k6 test locally with optional `vus`/`duration`/`iterations` overrides and returns metrics |
| `list_sections` tool | Browses the official k6 docs as a pruneable tree |
| `get_documentation` tool | Fetches the full markdown of a specific docs section |
| `generate_script` prompt | Generates production-ready k6 scripts from plain-English requirements, guided by embedded best practices |
| `prompts://k6/generate_script` resource | The best-practices template that powers script generation |

Combined with `mcp-grafana`, they close the loop: **generate -> run -> observe -> validate**, all from chat.

```text
AI agent
   |   mcp-k6 (tools + prompt)
   v
k6 engine (validates + runs scripts)
   |
   |   (script output)
   v
AI agent analyzes metrics
   |
   |   mcp-grafana (queries)
   v
Prometheus / Grafana (persisted metrics)
```

---

## Steps

### 1. Verify `mcp-k6` is configured

In Exercise 3 you copied `workshop/stack/opencode.json.example` to `opencode.json`. It already contains a `k6` MCP server block:

```json
{
  "mcp": {
    "grafana": {
      "type": "local",
      "command": ["uvx", "mcp-grafana"],
      "env": {
        "GRAFANA_URL": "http://localhost:3000",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "<your-grafana-service-account-token>"
      }
    },
    "k6": {
      "type": "local",
      "command": ["docker", "run", "-i", "--rm", "grafana/mcp-k6:latest"],
      "env": {}
    }
  }
}
```

The `grafana/mcp-k6` image bundles k6, so no separate k6 install is needed for this exercise.

To let mcp-k6 write generated scripts into your working directory, add a volume mount. OpenCode does **not** expand VSCode-style variables, so use an absolute path:

```json
"command": [
  "docker", "run", "-i", "--rm",
  "-v", "<absolute-path-to-your-repo>:/work",
  "-w", "/work",
  "grafana/mcp-k6:latest"
]
```

Replace `<absolute-path-to-your-repo>` with the full path to the folder where you want mcp-k6 to read and write scripts (e.g. `C:\Users\<you>\projects\copilot-k6-skills` on Windows, or `/home/<you>/projects/copilot-k6-skills` on Linux/macOS).

If you prefer a native install instead of Docker, see the [mcp-k6 README](https://github.com/grafana/mcp-k6) (Homebrew `brew install mcp-k6`, Linux packages, or `go build ./cmd/mcp-k6`).

### 2. Confirm the server is connected

Ask the agent:

```
What tools does the k6 MCP server provide?
```

The agent should list `validate_script`, `run_script`, `list_sections`, and `get_documentation`.

### 3. Browse the k6 docs through MCP

Ask the agent:

```
Use the k6 MCP server to get the top-level k6 documentation sections.
```

Then drill into a topic:

```
Use the k6 MCP server to fetch the docs for the scenarios section (root_slug "using-k6").
```

Finally, fetch a specific page:

```
Use the k6 MCP server to get the documentation for javascript-api/k6-http.
```

Notice the agent only loads the branches and pages it needs — that is the point of `list_sections`' depth-limited tree.

### 4. Generate a k6 script from natural language

Ask the agent:

```
Use the mcp-k6 generate_script prompt to create a k6 load test for
https://petstore3.swagger.io/api/v3 that gets a pet by ID.
```

The agent should follow the `prompts://k6/generate_script` template: research the docs, apply best practices, write the script, then propose validating it.

### 5. Validate the script

Ask the agent:

```
Validate the generated k6 script using the mcp-k6 validate_script tool.
```

`validate_script` runs the script with 1 VU and 1 iteration and returns `valid`, `exit_code`, `stderr`, and any errors. If validation fails, ask the agent to fix the script and re-validate.

### 6. Run a quick test entirely through MCP

Ask the agent:

```
Run the script with the mcp-k6 run_script tool using 10 VUs for 30 seconds.
```

The `run_script` tool accepts `vus`, `duration` (max `5m`), and `iterations` overrides on top of anything the script defines. It returns `success`, `exit_code`, `duration`, `metrics`, and a `summary`.

Check the returned metrics:

- `http_req_duration` (p95, p99)
- `http_req_failed` (error rate)
- `http_reqs` (throughput)

### 7. Ask the agent to analyze the results

Ask:

```
Analyze the run results. Did the test meet p(95)<500ms and error rate<1%? Summarize the metrics and tell me which latency component dominates.
```

The agent should translate the raw metrics into a plain-language verdict — no dashboard required. For deeper interpretation of percentiles and the request duration breakdown, it can load the `k6-grafana-validation` skill and its `reference/bottleneck-patterns.md` reference (used fully in Exercise 5).

### 8. Where this fits (bridge to Exercise 5)

`mcp-k6` is great for **ad-hoc runs**. For repeatable, convention-following suites that stream to Grafana, the `k6-test-suite` skill (Exercise 2) generates a full project with `configs/`, `workloads/`, and Prometheus remote write — which you will run and validate in Exercise 5.

Tip: you can generate a script with `mcp-k6`, then drop it into the skill-generated suite as a new `tests/<endpoint>.js` file.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent says the k6 MCP server is not available | Confirm the `k6` block is in `opencode.json` and Docker is running; pull the image first with `docker pull grafana/mcp-k6:latest` |
| `validate_script` returns k6 not found | Use the Docker image (k6 bundled); for native installs verify `k6 version` |
| Script writes fail mid-generation | Add the volume mount with an absolute path (see Step 1) |
| Version mismatch errors | `mcp-k6` is experimental — `docker pull grafana/mcp-k6:latest` to update |
| `run_script` duration rejected | `duration` is capped at `5m` by the tool |

---

## Key takeaways

- `mcp-k6` is the execution side of the MCP story; `mcp-grafana` is the observation side.
- Script **generate -> validate -> run -> analyze** happens entirely in chat.
- Docs are browsable through MCP, so the agent reads the *current* official k6 docs.
- For reusable, Grafana-ready suites, pair `mcp-k6` ad-hoc runs with the `k6-test-suite` skill.

---

## Next

Proceed to Exercise 5: [Run and Validate](05-run-and-validate.md)