# Workshop: The Performance Copilot Awakens

**Teaching AI to Test with k6 Skills and Grafana**

A hands-on workshop (~5 hours) that teaches you to create **Agent Skills** that generate a **k6 performance test suite** and **validate the results against Grafana** — using OpenCode, k6, and the Model Context Protocol (MCP).

You will learn to:

1. Explain the difference between `AGENTS.md` and Agent Skills.
2. Understand and author `SKILL.md` files for OpenCode.
3. Build a k6 test suite skill (scenarios, configs, thresholds, Prometheus remote write).
4. Set up a local Grafana + Prometheus stack to receive and visualize k6 metrics.
5. Use `mcp-k6` to generate, validate, and run k6 scripts from the agent.
6. Use `mcp-grafana` to query metrics, validate SLO thresholds, and verify dashboards.
7. Close the feedback loop: **generate -> run -> validate**.

---

## Reading order

Follow the documents in this order.

### 1. Before you start (root)

| # | Document | Purpose |
|---|----------|---------|
| 1 | [README.md](README.md) | Repository overview and available skills |
| 2 | [REQUIREMENTS.md](REQUIREMENTS.md) | Pre-workshop checklist (Git, Docker, k6, MCP) |
| 3 | [SKILLS.md](SKILLS.md) | What is an OpenCode Skill? |
| 4 | [AGENTS.md](AGENTS.md) | Repository instructions for coding agents |

### 2. Workshop setup (guides)

| # | Document | Purpose |
|---|----------|---------|
| 5 | [workshop/00-guides/HowtoInstall.md](workshop/00-guides/HowtoInstall.md) | Installing OpenCode |
| 6 | [workshop/00-guides/k6-mcp.md](workshop/00-guides/k6-mcp.md) | Using the k6 MCP server |
| 7 | [workshop/00-guides/grafana-mcp.md](workshop/00-guides/grafana-mcp.md) | Using the Grafana MCP server |

### 3. Workshop planning

| # | Document | Purpose |
|---|----------|---------|
| 8 | [workshop/AGENDA.md](workshop/AGENDA.md) | Full agenda, schedule, and learning objectives |
| 9 | [workshop/FACILITATOR.md](workshop/FACILITATOR.md) | Facilitator guide |

### 4. Modules (concepts)

| # | Document | Purpose |
|---|----------|---------|
| 10 | [workshop/00-Installing-Opencode/README.md](workshop/00-Installing-Opencode/README.md) | Module 00: Installing OpenCode |
| 11 | [workshop/01-What-is-a-skill/README.md](workshop/01-What-is-a-skill/README.md) | Module 01: What is an Agent Skill? |
| 12 | [workshop/02-How-to-validate-Skills/README.md](workshop/02-How-to-validate-Skills/README.md) | Module 02: How to validate Agent Skills |
| 13 | [workshop/02-How-to-validate-Skills/eval/README.md](workshop/02-How-to-validate-Skills/eval/README.md) | Eval suite for the k6-test-suite skill |
| 14 | [workshop/03-What-is-MCP/README.md](workshop/03-What-is-MCP/README.md) | Module 03: What is MCP? |

### 5. Exercises (hands-on, in order)

| # | Document | Module |
|---|----------|--------|
| 15 | [workshop/exercises/01-skill-anatomy.md](workshop/exercises/01-skill-anatomy.md) | Exercise 1: Skill Anatomy |
| 16 | [workshop/exercises/02-create-test-suite-skill.md](workshop/exercises/02-create-test-suite-skill.md) | Exercise 2: Create the k6 Test Suite Skill |
| 17 | [workshop/exercises/03-grafana-stack.md](workshop/exercises/03-grafana-stack.md) | Exercise 3: Grafana Stack Setup |
| 18 | [workshop/exercises/04-mcp-k6.md](workshop/exercises/04-mcp-k6.md) | Exercise 4: MCP for k6 |
| 19 | [workshop/exercises/05-run-and-validate.md](workshop/exercises/05-run-and-validate.md) | Exercise 5: Run and Validate |
| 20 | [workshop/exercises/06-extend-and-share.md](workshop/exercises/06-extend-and-share.md) | Exercise 6: Extend and Share |

### 6. Local stack and demo app

| # | Document | Purpose |
|---|----------|---------|
| 21 | [workshop/stack/](workshop/stack/) | Docker Compose Prometheus + Grafana stack (see `docker-compose.yml`) |
| 22 | [workshop/quickpizza/README.md](workshop/quickpizza/README.md) | QuickPizza demo application |

#### QuickPizza reference docs

| Document | Purpose |
|----------|---------|
| [workshop/quickpizza/docs/send-k6-test-results.md](workshop/quickpizza/docs/send-k6-test-results.md) | Send k6 test results to Prometheus |
| [workshop/quickpizza/docs/metrics.md](workshop/quickpizza/docs/metrics.md) | QuickPizza Prometheus metrics |
| [workshop/quickpizza/docs/inject-errors.md](workshop/quickpizza/docs/inject-errors.md) | Injecting delays and errors |
| [workshop/quickpizza/docs/otel.md](workshop/quickpizza/docs/otel.md) | OpenTelemetry tracing |
| [workshop/quickpizza/docs/development.md](workshop/quickpizza/docs/development.md) | QuickPizza development |
| [workshop/quickpizza/docs/configure-database.md](workshop/quickpizza/docs/configure-database.md) | Configure the database |
| [workshop/quickpizza/docs/deploy-quickpizza-docker-image.md](workshop/quickpizza/docs/deploy-quickpizza-docker-image.md) | Deploy the Docker image |
| [workshop/quickpizza/CLAUDE.md](workshop/quickpizza/CLAUDE.md) | Agent instructions for QuickPizza |
| [workshop/quickpizza/k6/extensions/README.md](workshop/quickpizza/k6/extensions/README.md) | k6 extensions |
| [workshop/quickpizza/deployments/docker-compose/README.md](workshop/quickpizza/deployments/docker-compose/README.md) | Docker Compose deployment |
| [workshop/quickpizza/deployments/kubernetes/README.md](workshop/quickpizza/deployments/kubernetes/README.md) | Kubernetes deployment |
| [workshop/quickpizza/deployments/kubernetes/cloud/monitoring.md](workshop/quickpizza/deployments/kubernetes/cloud/monitoring.md) | Grafana Kubernetes monitoring |
| [workshop/quickpizza/deployments/terraform/README.md](workshop/quickpizza/deployments/terraform/README.md) | Terraform deployment |
| [workshop/quickpizza/.github/workflows/README.md](workshop/quickpizza/.github/workflows/README.md) | GitHub Actions workflows |

---

## Quick start

1. Complete the [REQUIREMENTS.md](REQUIREMENTS.md) checklist.
2. Read [workshop/AGENDA.md](workshop/AGENDA.md) for the schedule.
3. Start the stack: `cd workshop/stack && docker-compose up -d` (Prometheus on `9090`, Grafana on `3000`, `admin` / `admin`).
4. Work through [Exercise 1](workshop/exercises/01-skill-anatomy.md) to [Exercise 6](workshop/exercises/06-extend-and-share.md) in order.
