# Facilitator Guide

## Before the workshop

### Room setup

- Ensure all participants have the prerequisites installed (see `REQUIREMENTS.md`).
- Test the Grafana stack (`docker-compose up`) at least once on the demo machine.
- Have the `opencode.json.example` ready to copy.
- Confirm Grafana is accessible at `http://localhost:3000` (admin/admin).
- Confirm Prometheus is accessible at `http://localhost:9090`.

### Demo machine preparation

1. Clone the workshop repository.
2. Pre-configure MCP servers in `opencode.json` with valid Grafana credentials if a shared Grafana is used.
3. Run `docker-compose up -d` from `workshop/stack/` before the session starts.
4. Open a Grafana browser tab with the k6 Results dashboard loaded.

---

## Module 1: Foundations (45 min)

### Timing

- Introduction and agenda: 5 min
- What are Agent Skills: 15 min
- Existing k6 skills walkthrough: 15 min
- Hands-on: inspect and modify a skill: 10 min

### Talking points

- Skills are **not** code — they are structured instructions for the AI agent.
- The `name` must match the directory name. Lowercase, hyphens only.
- Discovery paths differ per assistant (`.opencode/skills/`, `.github/skills/`, `.claude/skills/`, `.agents/skills/`).
- Skills are loaded **on demand** via the `skill` tool — the agent sees only names and descriptions until it loads one.

### Demo

1. Open an existing skill (e.g., `k6-config-generator`).
2. Show the frontmatter.
3. Ask the AI agent: *"What skills are available?"* — show the `<available_skills>` block.
4. Load a skill and show the instructions injected into context.

### Hands-on

Have participants:
1. Read the `k6-documentation` skill.
2. Ask the agent a question that should trigger the skill.
3. Modify the description and verify the agent sees the change.

### Common pitfalls

- `SKILL.md` must be all caps. Files named `skill.md` or `Skill.md` will not be discovered.
- Skill names must be unique across all directories.
- Description too vague: the agent won't know when to load it.

---

## Module 2: Build the k6 Test Suite Skill (60 min)

### Timing

- Requirements gathering: 10 min
- Folder structure and conventions: 10 min
- Config and workload patterns: 15 min
- Prometheus output: 10 min
- Hands-on: write the skill: 15 min

### Talking points

- Start with **what the skill should produce**, not the SKILL.md syntax.
- The conventions (thresholds, executors, tags) are team decisions encoded in the skill.
- `ramping-arrival-rate` models real-world traffic better than `constant-vus`.
- Operation tags in k6 enable per-endpoint breakdowns in Grafana.

### Demo

1. Ask the AI agent: *"Generate a k6 test suite for https://petstore3.swagger.io/api/v3"* — without the skill, the output will be generic.
2. Load the `k6-test-suite` skill.
3. Ask the same prompt — the output now follows conventions.

### Hands-on

Have participants:
1. Create a new `SKILL.md` for a custom scenario type (e.g., `k6-spike-test`).
2. Define frontmatter, description, and workflow.
3. Ask the agent to use it.

### Key reference files

- `.github/skills/k6-config-generator/examples/load.json` — config pattern
- `.github/skills/k6-boilerplate-generator/examples/Petstore.k6.Performance/workloads/userJourneyTest.js` — workload pattern
- `.opencode/skills/k6-test-suite/SKILL.md` — reference solution

---

## Module 3: Grafana Stack Setup (30 min)

### Timing

- Architecture overview: 5 min
- Start the stack: 5 min
- Explore Grafana: 5 min
- MCP configuration: 10 min
- Verify MCP connection: 5 min

### Talking points

- k6 writes time series with `k6_` prefix to Prometheus via the `experimental-prometheus-rw` output.
- Prometheus must be started with `--web.enable-remote-write-receiver` to accept writes.
- Grafana provisions its datasource and dashboard automatically from the `provisioning/` directory.
- The MCP server is a bridge: the AI agent talks to Grafana through it.

### Demo

1. Start the stack: `docker-compose up -d`
2. Open Grafana at `http://localhost:3000`.
3. Open Prometheus at `http://localhost:9090`.
4. Copy `opencode.json.example` to `opencode.json` and fill in Grafana token.
5. Ask the agent: *"What datasources are available in Grafana?"* via `mcp-grafana`.

### Hands-on

Have participants:
1. Start the stack.
2. Verify Grafana and Prometheus are running.
3. Configure MCP in `opencode.json`.
4. Ask the agent to list Grafana datasources.

### Common pitfalls

- Prometheus not started with remote write receiver: k6 will fail silently.
- Grafana token not set: MCP server will fail to connect.
- Docker not running or port conflicts.

---

## Module 4: Run and Validate (60 min)

### Timing

- Generate a test suite: 10 min
- Run k6 with Prometheus output: 10 min
- Query metrics via MCP: 15 min
- Validate SLOs: 10 min
- Diagnose a failure scenario: 10 min
- Hands-on: full cycle: 5 min

### Talking points

- The skill generates the suite; the human runs it; the validation skill queries Grafana.
- SLO checks are PromQL queries: `histogram_quantile` for latency, ratio for error rate.
- Dashboard panels are just PromQL visualizations — MCP can query them directly.
- The pass/fail report is the output of the validation skill.

### Demo

1. Ask the agent: *"Generate a k6 load test suite for https://petstore3.swagger.io/api/v3"*
2. Run the generated test with Prometheus output:
   ```bash
   k6 run -o experimental-prometheus-rw \
     -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
     configs/load.json workloads/load.js
   ```
3. Wait for data to appear in Prometheus (query `k6_http_reqs_total`).
4. Ask the agent: *"Validate the k6 test results against Grafana"* — show the validation report.
5. Show the Grafana dashboard with populated panels.
6. Simulate a failure: adjust threshold to a very tight value, re-run, show the failed validation.

### Hands-on

Have participants:
1. Generate a test suite.
2. Run it against the public Petstore API.
3. Validate results via the agent.
4. Try diagnosing a failure.

### Key reference files

- `.opencode/skills/k6-grafana-validation/SKILL.md` — validation workflow
- `workshop/stack/opencode.json.example` — MCP config

---

## Module 5: Extend and Share (30 min)

### Timing

- Custom thresholds and tags: 5 min
- Permissions and overrides: 10 min
- Sharing via submodule: 10 min
- Q and A: 5 min

### Talking points

- Skills can be extended with custom metrics and operation tags.
- Permissions in `opencode.json` control which skills agents can load.
- The same `SKILL.md` works across Copilot, OpenCode, and compatible agents — just place it in the right directory.
- The submodule pattern lets teams share skills across repositories.

### Demo

1. Show permission configuration in `opencode.json`.
2. Show the same skill under `.opencode/skills/` and `.github/skills/`.
3. Demonstrate adding a skill as a Git submodule.

### Hands-on

Have participants:
1. Add a permission rule for their custom skill.
2. Mirror their skill to `.github/skills/`.
3. Ask the agent to load it from both locations.

---

## Wrap-up (10 min)

- Recap the feedback loop: **Skill -> Generate -> Run -> Validate**.
- Recap what was built: two skills, a Grafana stack, a validation workflow.
- Q and A.
- Next steps: CI gates, custom dashboards, distributed testing, team skill libraries.

---

## Troubleshooting guide

| Issue | Solution |
|-------|----------|
| Skill not discovered | Check `SKILL.md` is all caps, `name` and `description` are present, name matches directory |
| k6 fails to write to Prometheus | Ensure Prometheus is started with `--web.enable-remote-write-receiver` |
| MCP server won't start | Check Grafana URL and service account token in `opencode.json` |
| Grafana shows no data | Verify Prometheus received data at `http://localhost:9090` first |
| Agent doesn't load the skill | Description may be too vague; refine it to describe when the skill should be used |
| Port conflict on 3000 or 9090 | Stop other services or adjust ports in `docker-compose.yml` |
