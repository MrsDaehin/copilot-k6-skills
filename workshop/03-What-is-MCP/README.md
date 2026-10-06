# 03 — What Is MCP?

This guide introduces the **Model Context Protocol (MCP)** and explains what we will use it for during this workshop: letting the agent actually *run* k6 and *read* Grafana/Prometheus, not just write files.

> **References:** [Model Context Protocol](https://modelcontextprotocol.io/) · [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) · [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers/)

---

## What is MCP?

**MCP** is an open standard for connecting an AI application to external systems. It is often described as a "USB-C port for AI": one agreed way to plug a tool, a data source, or a workflow into any MCP-capable assistant.

Without a protocol like MCP, every assistant has to be taught each system individually — a bespoke integration per model, per vendor, per tool. MCP replaces that with a shared contract, so a server built once works in OpenCode, Claude Code, VS Code, Cursor, and others.

MCP defines only the protocol for exchanging context. It does not dictate how an assistant uses the model or manages that context.

---

## The moving parts

Three roles, and one connection per server:

| Role | What it is | In this workshop |
|------|------------|------------------|
| **Host** | The AI application that manages the connections. | OpenCode |
| **Client** | One connection inside the host, dedicated to a single server. | OpenCode's client for `k6`, its client for `grafana` |
| **Server** | A program that exposes capabilities and context. | `grafana/mcp-k6`, `mcp-grafana` |

The host does not talk to a server directly. It creates one client per server, and each client keeps its own connection. That is why adding a second server does not interfere with the first.

```text
                    MCP Host  (OpenCode)
                            |
              +-------------+-------------+
              |                           |
        MCP Client                    MCP Client
        (k6 only)                     (grafana only)
              |                           |
     mcp-k6 server                mcp-grafana server
   (k6 engine + docs)            (Grafana + Prometheus)
```

---

## What a server can expose

MCP defines three primitives that servers expose. This is the vocabulary the rest of this guide uses.

| Primitive | What it is | `mcp-k6` example |
|-----------|------------|------------------|
| **Tools** | Executable functions the model can invoke to take an action. | `run_script`, `validate_script` |
| **Resources** | Readable context the application can fetch. | `prompts://k6/generate_script` (the best-practices template) |
| **Prompts** | Reusable templates that structure an interaction with the model. | `generate_script` |

Tools are the part you will see most in the transcript, because they do the work. Resources and prompts shape how the work is requested.

Each primitive has a discovery method and, where applicable, an execution method: `tools/list` then `tools/call`, `resources/list` then `resources/read`, `prompts/list` then `prompts/get`. A client lists what exists before it calls anything.

---

## How the connection works

The wire format is **JSON-RPC 2.0**. The transport is either:

| Transport | How it works | Used for |
|-----------|--------------|----------|
| **stdio** | The client launches the server as a child process and speaks over its standard input/output. No network. | `mcp-k6` in this workshop, launched with `docker run` |
| **Streamable HTTP** | The client sends HTTP requests to a URL, with optional streaming for long operations. Carries normal HTTP auth. | Remote or hosted servers |

"Same machine" and "somewhere else" describe where the server *runs*; stdio vs. Streamable HTTP describes how it is *reached*. A `docker run` command in `opencode.json` is a local server over stdio, even though Docker is involved.

### The lifecycle you will observe

1. **Start** — OpenCode launches the command from `opencode.json` and reads the tool list the server advertises.
2. **Call** — You ask for something; the model calls a tool, with arguments validated against the tool's declared input schema.
3. **Respond** — The server returns content (text, structured data) that goes back into the conversation.
4. **Repeat** — The model uses that result for the next step.

For k6 that loop is visible in the transcript: *"validate this script"* → `k6_validate_script` → an error → *"fix it"* → `k6_validate_script` again → `k6_run_script` → metrics → analysis. MCP is what makes each of those steps a single request instead of a copy-pasted command.

---

## Why use MCP?

| Benefit | In practice |
|---------|-------------|
| **One integration, many clients** | The same `mcp-k6` server works in OpenCode, Claude Code, Cursor, or VS Code. |
| **Real capabilities, not guesses** | The agent runs k6 and reads live metrics instead of reasoning from memory. |
| **Sensible context cost** | The server describes its own tools; the model loads only the ones the task needs. |
| **Data stays where it is** | A local server talks to a local Grafana. Nothing extra is copied out. |

The counterweight is context: every enabled server adds its tool definitions to the model's context. Be deliberate about which servers are enabled. The workshop enables exactly two.

---

## Agent Skills vs. MCP

Module [`01-What-is-a-skill`](../01-What-is-a-skill/README.md) covered Agent Skills. The distinction matters, because the two are used together in every exercise:

| | Agent Skill | MCP server |
|---|---|---|
| **Purpose** | Teaches *how your team works*. | Provides *what the agent can do*. |
| **Format** | A folder with `SKILL.md`. | A running program the agent connects to. |
| **Content** | Conventions, workflows, thresholds, folder layouts, examples. | Tools, resources, prompts, and the data behind them. |
| **Load model** | Progressive disclosure: description at startup, body on activation. | Tools are advertised on connection and offered to the model. |
| **Failure mode** | The agent follows the wrong instructions. | The server is misconfigured, unreachable, or misbehaving. |

Concretely, in this repository:

```text
k6-test-suite skill      -> "Use ramping-arrival-rate, tag every request with
                            operation, default ENVIRONMENT=dev, write thresholds
                            p(95)<500ms and rate<0.01, stream to Prometheus."

mcp-k6 server            -> "Validate this script." / "Run it with 10 VUs for 30s."

mcp-grafana server       -> "What is the current p95 per operation?" /
                            "Which panels on the k6 dashboard have data?"

k6-grafana-validation    -> "Interpret that p95 against the SLO and name the
skill                       dominant latency component."
```

A skill without MCP is a well-written document. MCP without a skill is a powerful tool used without house rules. You need both.

---

## What we use MCP for in this workshop

Two Grafana-built servers, split by job:

| | `mcp-k6` | `mcp-grafana` |
|---|---|---|
| **Side** | Execution — make things happen | Observation — read what happened |
| **Repo** | [grafana/mcp-k6](https://github.com/grafana/mcp-k6) | [grafana/mcp-grafana](https://github.com/grafana/mcp-grafana) |
| **Runs where** | Local process (`docker run`) | Local process (`uvx mcp-grafana`) |
| **Reaches** | The k6 engine and the official k6 docs | Your Grafana instance and its Prometheus datasource |
| **Tools used here** | `validate_script`, `run_script`, `list_sections`, `get_documentation` | `query_prometheus`, `query_prometheus_histogram`, `search_dashboards`, `get_dashboard_summary`, `run_panel_query` |

The `mcp-k6` Docker image bundles k6 itself, so it can validate and run scripts even where k6 is not installed natively.

### The loop this creates

```text
   requirement
        |
        v
   k6-test-suite skill ......... generates suite
        |
        v
   mcp-k6 (run_script) ......... executes the test
        |
        v
   Prometheus (remote write) .... stores the metrics
        |
        v
   mcp-grafana (query_*) ....... reads them back
        |
        v
   k6-grafana-validation skill .. judges SLO, names the bottleneck
        |
        +------ fix and re-run ------------------^
```

Two servers, two skills, one loop. MCP supplies the connections; the skills supply the judgement about what good looks like.

**Where each is used in the agenda:**

| Module | Server | What you do |
|--------|--------|-------------|
| 3 — Grafana stack setup | `mcp-grafana` | Configure it and confirm it can list datasources. |
| 4 — MCP for k6 | `mcp-k6` | Generate, validate, and run a script entirely in chat. |
| 5 — Run and validate | both | Query stored metrics, check the SLOs, verify dashboard panels. |
| 6 — Extend and share | both | Discuss enabling them per agent, and keeping tokens out of git. |

---

## Configuring MCP in OpenCode

Servers are declared under `mcp` in `opencode.json`, each with a unique name. That name becomes the prefix of every tool the server exposes, which is how you point the agent at one specifically.

The workshop ships a template at [`workshop/stack/opencode.json.example`](../stack/opencode.json.example):

```bash
cp workshop/stack/opencode.json.example opencode.json
```

Then fill in your own values. The two things people most often get wrong are the environment variable key and the volume path:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "grafana": {
      "type": "local",
      "command": ["uvx", "mcp-grafana"],
      "environment": {
        "GRAFANA_URL": "http://localhost:3000",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "<your-grafana-service-account-token>"
      }
    },
    "k6": {
      "type": "local",
      "command": [
        "docker", "run", "-i", "--rm",
        "-e", "K6_PATH=/usr/bin/k6",
        "-v", "<absolute-path-to-your-repo>:/work",
        "-w", "/work",
        "grafana/mcp-k6:latest"
      ],
      "environment": {}
    }
  }
}
```

| Gotcha | Why | Fix |
|--------|-----|-----|
| `env` instead of `environment` | The current schema uses `environment`. The checked-in example still says `env`; reconcile it rather than copying it blind. | Rename the key to `environment`. |
| `${workspaceFolder}` in `-v` | OpenCode does not expand editor-style variables inside the command array. | Write the absolute path: `C:\Users\<you>\...\copilot-k6-skills` or `/home/<you>/...`. |
| Placeholder token left in place | The Grafana client fails to authenticate and every query errors. | Replace `<your-grafana-service-account-token>` with a real service account token. |
| Docker image missing | The server never starts. | `docker pull grafana/mcp-k6:latest` before the session. |

Restart OpenCode after editing `opencode.json` so the servers are reconnected.

### Useful knobs

| Option | Effect |
|--------|--------|
| `enabled: false` | Keep the server configured but switch it off without deleting it. |
| `timeout` | Milliseconds to wait when fetching the tool list. Defaults to `5000`; raise it for a slow cold start such as `docker run`. |
| `tools: { "k6*": false }` | Hide a server's tools from the model, globally or per agent. Useful for cutting context cost. |
| `cwd` | Working directory for the server process. |

Verify the setup before relying on it:

```bash
opencode mcp list
```

Then confirm from inside the agent, naming the server so it does not guess:

```text
What tools does the k6 MCP server provide?
What datasources are available in Grafana?
```

---

## Handling credentials

MCP servers usually need credentials, and MCP grants real access. Treat each server as a production dependency:

- **Never commit tokens.** Keep `GRAFANA_SERVICE_ACCOUNT_TOKEN` and any API keys out of the repository and out of `opencode.json` if that file is tracked. Use a `.gitignore`d local config or an environment reference.
- **Prefer `{env:VAR}` over literals** in `opencode.json` so the secret lives in your shell, not in the file.
- **Use the narrowest role that works.** For the workshop stack, `admin`/`admin` on a throwaway local Grafana is fine; anything shared deserves a dedicated service account with Editor rights.
- **Know what each server can do.** `mcp-k6` executes code and writes files into the mounted volume. `mcp-grafana` can read and modify dashboards, depending on the token's role. Neither is risk-free.

---

## Key takeaways

- MCP is an open standard that lets an AI application connect to external tools and data through one agreed contract.
- A host manages one client per server; servers expose **tools**, **resources**, and **prompts**.
- Local servers usually speak stdio; remote servers use Streamable HTTP. Both use JSON-RPC 2.0.
- MCP servers consume context, so enable deliberately.
- Agent Skills supply *how*; MCP supplies *what is possible*. This workshop needs both.
- Here, `mcp-k6` executes and `mcp-grafana` observes, and together with the two skills they close the **generate → run → validate** loop.
- In `opencode.json`, use `environment`, absolute paths in volume mounts, and never commit tokens.

---

## Next

Continue with the hands-on work:

- [Exercise 3: Grafana Stack Setup](../exercises/03-grafana-stack.md) — start Prometheus and Grafana, configure `mcp-grafana`, verify it.
- [Exercise 4: MCP for k6](../exercises/04-mcp-k6.md) — configure `mcp-k6`, then generate, validate, and run a script in chat.

## References

- [Model Context Protocol — introduction](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Model Context Protocol — architecture overview](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP specification](https://modelcontextprotocol.io/specification/latest)
- [OpenCode — MCP servers](https://opencode.ai/docs/mcp-servers/)
- [grafana/mcp-k6](https://github.com/grafana/mcp-k6)
- [grafana/mcp-grafana](https://github.com/grafana/mcp-grafana)
