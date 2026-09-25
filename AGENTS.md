# AGENTS.md

## Repository shape

- This is a workshop/documentation and Agent Skill repository, not an application. It has no root build, test, lint, typecheck, formatter, or CI configuration; do not invent `npm test` or similar commands.
- `.opencode/package.json` and its lockfile are ignored local OpenCode plugin setup, not project scripts. The checked-in example `package.json` and `Makefile` belong only to the Petstore example under `.github/skills/`.
- Read `README.md`, `SKILLS.md`, `REQUIREMENTS.md`, and the relevant `workshop/` guide before changing behavior. `workshop/01-What-is-a-skill/README.md` is the Agent Skills primer.

## Repository map

- `.opencode/skills/` is the OpenCode skill location; `.github/skills/` is the GitHub Copilot location.
- Only `k6-test-suite` and `k6-grafana-validation` currently exist in both locations. The other `.github/skills/` entries are Copilot-only; do not assume they are OpenCode-discoverable.
- `workshop/stack/` contains the local Prometheus/Grafana stack and its MCP template; `workshop/exercises/` contains the workshop sequence.

## Skill editing rules

- Keep the entry point named exactly `SKILL.md`. Its directory name must match the frontmatter `name`, which must be lowercase hyphen-separated and match `^[a-z0-9]+(-[a-z0-9]+)*$`; `name` and `description` are required.
- The description controls skill discovery, so make it state both what the skill does and when it should be used.
- If editing either mirrored skill, update the corresponding file under both `.opencode/skills/` and `.github/skills/`; the current mirrored copies are byte-for-byte identical.
- Preserve the `k6-test-suite` workflow conventions when changing it: `ramping-arrival-rate`, default `p(95)<500ms` and error rate `<0.01`, `operation` tags, `ENVIRONMENT` default `dev`, and Prometheus remote-write output.
- For validation changes, keep the workflow centered on Prometheus/SLO checks, latency-component analysis, and Grafana panel verification; the detailed metric and bottleneck material is in that skill's `reference/` files.
- Agent Skills provide team instructions; `mcp-k6` provides k6 execution/validation and `mcp-grafana` provides observability queries. Do not confuse documentation instructions with MCP capabilities.

## Workshop stack

- Run the stack from `workshop/stack/`: `docker-compose up -d`; stop it with `docker-compose down`.
- Prometheus is exposed on `9090`, Grafana on `3000` with `admin` / `admin`. The Compose file already enables Prometheus's remote-write receiver and Grafana provisions the Prometheus datasource and `k6 Results` dashboard.
- The remote-write endpoint is `http://localhost:9090/api/v1/write`; k6 runs that emit Grafana data must use `-o experimental-prometheus-rw`.

## OpenCode and MCP configuration

- There is currently no checked-in active root `opencode.json`; `workshop/stack/opencode.json.example` is a template. Keep real tokens and service-account credentials out of the repository.
- Current OpenCode JSON uses `environment` for local MCP environment variables and accepts a top-level `$schema`; the checked-in example still uses `env`, so reconcile it with the current schema instead of copying it blindly.
- The `mcp-k6` Docker command needs an absolute repository path in its volume mount because OpenCode does not expand `${workspaceFolder}`-style variables.
- Restart OpenCode after changing `opencode.json`, an agent instruction file, or a skill so the new configuration is loaded.

## Focused verification

- There is no automated test suite. For documentation or skill changes, run `git diff --check`, inspect the frontmatter, and compare mirrored skill files before finishing.
- For stack changes, use `docker-compose ps` and the Prometheus/Grafana health endpoints from `REQUIREMENTS.md`; do not diagnose missing metrics until the remote-write receiver and run output are verified.
