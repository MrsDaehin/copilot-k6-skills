# Workshop: The Performance Copilot Awakens

## Teaching AI to Test with k6 Skills and Grafana

---

## Overview

This workshop teaches you to create **Agent Skills** that generate a **k6 performance test suite** and **validate the results against Grafana** — using OpenCode, the k6 load testing tool, and the Model Context Protocol (MCP).

You will learn to:

1. Explain the difference between `AGENTS.md` and Agent Skills.
2. Understand and author `SKILL.md` files for OpenCode.
3. Build a k6 test suite skill that generates scenario scripts, configs, thresholds, and Prometheus remote write output.
4. Set up a local Grafana + Prometheus stack to receive and visualize k6 metrics.
5. Use the `mcp-k6` MCP server to generate, validate, and run k6 scripts directly from the agent.
6. Use the `mcp-grafana` MCP server to query stored metrics, validate SLO thresholds, and verify dashboard panels.
7. Close the feedback loop: **generate -> run -> validate**.

---

## Target audience

- Developers, QA engineers, and performance engineers interested in AI-assisted testing.
- Participants comfortable with JavaScript, HTTP APIs, and the terminal.
- No prior k6 or MCP experience required.

## Duration

Approximately **5 hours** (including breaks).

## Prerequisites

See `REQUIREMENTS.md` for the full pre-workshop checklist. The minimum:

- Git
- Docker
- k6
- An AI coding assistant with MCP support (OpenCode recommended)
- Access to the workshop repository

---

## Schedule

### Module 1: Foundations (45 min)

**What are Agent Skills?**

**Preparation:** Read the root `AGENTS.md` and the primer in `01-What-is-a-skill/README.md`.

- The `SKILL.md` format: frontmatter, naming rules, discovery paths
- How OpenCode loads skills on demand
- `AGENTS.md` vs. `SKILL.md`: project-wide instructions vs. on-demand capability
- Existing k6 skills in this repository

**Hands-on:** Inspect the root `AGENTS.md` and existing skills, modify a `SKILL.md`, verify discovery.

> Exercise: `exercises/01-skill-anatomy.md`

---

### Module 2: Build the k6 Test Suite Skill (60 min)

**Creating a skill from scratch**

- Requirements gathering workflow
- Folder structure: `configs/`, `constants/`, `shared/`, `tests/`, `workloads/`
- Configuration patterns: `ramping-arrival-rate`, thresholds, scenario definitions
- Workload scripts: `check()`, `sleep()`, `group()`, operation tags
- Prometheus remote write output (`experimental-prometheus-rw`)
- Makefile conventions

**Hands-on:** Write `k6-test-suite` SKILL.md step by step.

> Exercise: `exercises/02-create-test-suite-skill.md`

---

### Break (15 min)

---

### Module 3: Grafana Stack Setup (30 min)

**The observability half**

- k6 to Prometheus via `experimental-prometheus-rw`
- Prometheus remote write receiver setup
- Grafana datasource provisioning
- k6 dashboard: custom panels with PromQL
- MCP configuration: `mcp-grafana` in `opencode.json`

**Hands-on:** Start the local stack, configure MCP.

> Exercise: `exercises/03-grafana-stack.md`

---

### Module 4: MCP for k6 (30 min)

**The execution half**

- The `mcp-k6` MCP server (github.com/grafana/mcp-k6): what it adds beyond `mcp-grafana`
- Tools: `validate_script`, `run_script`, `list_sections`, `get_documentation`
- The `generate_script` prompt and the `prompts://k6/generate_script` best-practices resource
- Browsing the official k6 docs through MCP
- The full script lifecycle in chat: **generate -> validate -> run -> analyze**
- Combining ad-hoc MCP runs with the skill-generated suite

**Hands-on:** Generate, validate, and run a k6 script via the agent.

> Exercise: `exercises/04-mcp-k6.md`

---

### Module 5: Run and Validate (60 min)

**The feedback loop**

- Generate a test suite using the skill
- Run k6 with Prometheus output
- Query metrics via `mcp-grafana` (PromQL)
- Validate SLO thresholds (p95 latency, error rate)
- Analyze latency distribution and the HTTP duration breakdown to find bottlenecks
- Verify dashboard panels are populated
- Diagnose failures

**Hands-on:** Full generate -> run -> validate cycle.

> Exercise: `exercises/05-run-and-validate.md`

---

### Break (10 min)

---

### Module 6: Extend and Share (30 min)

**Taking it further**

- Custom thresholds and operation tags
- Permissions and per-agent overrides
- Mirroring skills across agents (`.opencode/skills/` and `.github/skills/`)
- Sharing skills via submodule
- CI/CD integration patterns

**Hands-on:** Extend the skill, add permissions, test in a consuming repo.

> Exercise: `exercises/06-extend-and-share.md`

---

### Wrap-up (10 min)

- Recap the feedback loop
- Q and A
- Next steps: CI gates, custom dashboards, distributed testing

---

## Workshop repository layout

```
copilot-k6-skills/
├── AGENTS.md                          # Repository instructions for coding agents
├── SKILLS.md                          # What is an OpenCode Skill?
├── REQUIREMENTS.md                    # Pre-workshop checklist
├── .opencode/skills/                  # OpenCode skills
│   ├── k6-test-suite/SKILL.md
│   └── k6-grafana-validation/SKILL.md
├── .github/skills/                    # GitHub Copilot mirror
│   ├── k6-test-suite/SKILL.md
│   └── k6-grafana-validation/SKILL.md
└── workshop/
    ├── AGENDA.md                      # This file
    ├── FACILITATOR.md                 # Facilitator guide
    ├── 01-What-is-a-skill/            # Agent Skills primer
    │   └── README.md
    ├── exercises/                     # Hands-on guides
    │   ├── 01-skill-anatomy.md
    │   ├── 02-create-test-suite-skill.md
    │   ├── 03-grafana-stack.md
    │   ├── 04-mcp-k6.md
    │   ├── 05-run-and-validate.md
    │   └── 06-extend-and-share.md
    └── stack/                         # Local Grafana + Prometheus
        ├── docker-compose.yml
        ├── opencode.json.example
        ├── prometheus/prometheus.yml
        └── grafana/provisioning/...
```

---

## Learning objectives

By the end of this workshop, participants will be able to:

| Objective | Module |
|-----------|--------|
| Explain what an Agent Skill is and how `SKILL.md` works | 1 |
| Explain how `AGENTS.md` complements an Agent Skill | 1 |
| Write a `SKILL.md` with correct frontmatter and naming | 1, 2 |
| Generate a k6 test suite using a skill | 2 |
| Configure k6 to stream results to Prometheus | 2, 3 |
| Set up a local Grafana + Prometheus stack | 3 |
| Configure MCP servers in OpenCode | 3 |
| Generate, validate, and run k6 scripts via `mcp-k6` | 4 |
| Browse the official k6 docs through `mcp-k6` | 4 |
| Query Prometheus metrics via `mcp-grafana` | 5 |
| Validate k6 SLO thresholds against Grafana data | 5 |
| Analyze test results and identify bottlenecks | 5 |
| Verify dashboard panels via MCP | 5 |
| Extend and share skills across AI assistants | 6 |
