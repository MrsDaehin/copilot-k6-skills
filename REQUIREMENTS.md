# Workshop Requirements

## The Performance Copilot Awakens
### Teaching AI to Test with k6, MCP, and Grafana

This document lists everything you should install or prepare **before the workshop** so we can spend the session building, testing, and experimenting instead of troubleshooting local environments.

> **Recommended setup:** VS Code + GitHub Copilot + Git + k6 + Docker + Make + Prometheus/Grafana stack.
>
> Other AI coding assistants can also be used for parts of the workshop, especially if they support the **Model Context Protocol (MCP)**.

---

## 1. Laptop and terminal access

Bring a laptop where you can:

- Install software.
- Run commands from a terminal.
- Clone Git repositories.
- Run local applications and Docker containers.
- Access GitHub and Grafana from your network.

Supported operating systems:

- macOS
- Linux
- Windows 10/11

For Windows users, **PowerShell**, **Windows Terminal**, or **WSL2** are recommended.

---

## 2. Git

We will use Git to clone the workshop repository and work with the example projects and Copilot Skills.

### Verify

```bash
git --version
```

If Git is not installed, download it from:

https://git-scm.com/downloads

---

## 3. GitHub account

You should have a GitHub account because the workshop repository and example Copilot Skills are hosted on GitHub.

Create an account if needed:

https://github.com/

Make sure you can sign in before the workshop.

---

## 4. AI coding assistant with Agent Skills and MCP support

You need access to an **AI coding assistant that can work with your source code**.

This workshop is designed around two complementary ideas:

- **Agent Skills** — reusable instructions, examples, templates, and project knowledge stored in `SKILL.md` files.
- **MCP (Model Context Protocol)** — external tools that give the assistant access to capabilities such as k6 execution and Grafana observability data.

The workshop is **not tied to a single AI vendor**. You can follow the concepts with different coding agents, although the exact Skills directory and MCP configuration will vary.

### Recommended options

#### GitHub Copilot

GitHub Copilot is a good choice if you already use VS Code and want to work with repository-level Agent Skills.

A typical project structure is:

```text
.github/
└── skills/
    └── k6-load-test/
        └── SKILL.md
```

https://github.com/features/copilot

#### OpenCode

OpenCode supports reusable Agent Skills through `SKILL.md`.

Project-local skills can be stored under:

```text
.opencode/
└── skills/
    └── k6-load-test/
        └── SKILL.md
```

OpenCode can also discover compatible skills from:

```text
.claude/skills/
.agents/skills/
```

Documentation:

https://opencode.ai/docs/skills

#### Qwen Code + Qwen3-Coder

Qwen Code supports Agent Skills and can be used with Qwen coding models such as Qwen3-Coder.

Project skills are stored under:

```text
.qwen/
└── skills/
    └── k6-load-test/
        └── SKILL.md
```

Qwen Code can automatically select a Skill when relevant, and user-invocable Skills can also be run explicitly using:

```text
/<skill-name>
```

Documentation:

https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/

### Other possible AI assistants

You can also use MCP-capable assistants such as:

- Claude Code
- Claude Desktop
- Cursor
- OpenAI Codex CLI
- Other coding agents that support MCP

Some of these tools may use their own conventions for reusable instructions or Agent Skills.

> **Important:** The workshop will focus on the portable concept of **Agent Skills**, not on one vendor-specific implementation. Where useful, examples will show how the same k6 knowledge can be exposed to different agents.

### Verify

Before the workshop, open your chosen AI assistant and confirm that you can:

1. Open a local repository.
2. Ask the assistant questions about files in that repository.
3. Use its agent or coding mode.
4. Configure MCP servers.
5. Load or invoke a repository-level Skill, if your assistant supports Agent Skills.

---

## 5. Visual Studio Code or another MCP-capable editor

The examples will primarily use **Visual Studio Code**.

Download:

https://code.visualstudio.com/

You may use another editor such as Cursor if you already have an MCP setup you prefer.

---

## 6. k6

We will create, validate, and execute performance tests using **Grafana k6**.

Official installation documentation:

https://grafana.com/docs/k6/latest/set-up/install-k6/

### macOS

```bash
brew install k6
```

### Windows

Using Winget:

```powershell
winget install k6 --source winget
```

Chocolatey is also available.

### Ubuntu / Debian

Follow the current Grafana installation instructions:

https://grafana.com/docs/k6/latest/set-up/install-k6/

### Docker alternative

```bash
docker pull grafana/k6
```

### Verify

```bash
k6 version
```

Then optionally run:

```bash
k6 new smoke-test.js
k6 run smoke-test.js
```

You should see a completed k6 execution and its metrics in the terminal.

### Remote write output

The workshop uses k6's **experimental Prometheus remote write** output to stream metrics to the local Prometheus instance. This requires the `--out` flag:

```bash
k6 run \
  -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  -e PROMETHEUS_RW_TREND_STATS=p(95),p(99),min,max \
  smoke-test.js
```

Test remote write connectivity:

```bash
k6 run \
  -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  --duration 10s \
  --vus 1 \
  https://test.k6.io
```

Then open Grafana at http://localhost:3000 and check the **k6 Results** dashboard for incoming metrics.

---

## 7. Docker

Docker is **strongly recommended**, although not every exercise requires it.

We may use Docker to simplify:

- Running `mcp-k6`
- Running `mcp-grafana`
- Running supporting workshop services
- Running a local Grafana environment

Install Docker Desktop:

https://www.docker.com/products/docker-desktop/

### Verify

```bash
docker version
docker run --rm hello-world
```

---

## 8. k6 MCP Server

The workshop uses Grafana's experimental **mcp-k6** server:

https://github.com/grafana/mcp-k6

It gives an MCP-capable AI assistant tools for:

- Generating k6 scripts from natural-language requirements.
- Validating a k6 script with a minimal execution.
- Running local k6 tests.
- Overriding VUs, duration, or iterations for test execution.
- Browsing the official k6 documentation.
- Retrieving specific k6 documentation sections.
- Using embedded k6 best-practice resources.
- Returning execution output, metrics, summaries, and validation errors that the assistant can use in the next iteration.

### Recommended installation: Docker

```bash
docker pull grafana/mcp-k6:latest
```

### macOS alternative: Homebrew

```bash
brew tap grafana/grafana
brew install mcp-k6
```

Verify:

```bash
mcp-k6 --version
```

### Native installation

Native installation is also possible, but it requires a compatible Go environment and a local k6 installation. See the repository for current instructions.

> `mcp-k6` is currently an experimental project. Install or update it shortly before the workshop.

---

## 9. Grafana MCP Server

We will also use the official Grafana MCP server:

https://github.com/grafana/mcp-grafana

It allows an AI assistant to interact with a Grafana instance and its observability ecosystem.

Depending on the workshop exercise and the permissions available, this can include working with dashboards, data sources, queries, alerts, incidents, annotations, and other Grafana resources.

### Option A — Docker

```bash
docker pull grafana/mcp-grafana
```

### Option B — uv / uvx

The Grafana MCP server can also be launched using `uvx`.

Install `uv` by following:

https://docs.astral.sh/uv/

Then the MCP client can launch:

```bash
uvx mcp-grafana
```

### Grafana access

To connect the MCP server you will need:

- A Grafana instance URL.
- Credentials supported by the workshop environment.
- Usually a Grafana service account token.

For example:

```text
GRAFANA_URL=https://your-grafana-instance
GRAFANA_SERVICE_ACCOUNT_TOKEN=your-token
```

> Do **not** commit Grafana tokens, API keys, passwords, or other secrets to the workshop repository.

The instructor may provide a shared or temporary Grafana environment for the exercises. If so, connection details will be provided separately.

---

## 10. Workshop repository

Before the workshop, make sure you can clone repositories from GitHub.

The exercises will use a repository inspired by:

https://github.com/MrsDaehin/copilot-k6-skills

The repository contains reusable performance-engineering knowledge that can be exposed to different coding agents.

A portable source layout could look like:

```text
skills/
├── k6-config-generator/
│   └── SKILL.md
├── k6-auth-generator/
│   └── SKILL.md
├── k6-documentation/
│   └── SKILL.md
├── k6-html-report/
│   └── SKILL.md
└── k6-boilerplate-generator/
    └── SKILL.md
```

Depending on the assistant, those Skills can then be placed or synchronized into the appropriate project directory:

```text
.github/skills/     # GitHub Copilot
.opencode/skills/   # OpenCode
.qwen/skills/       # Qwen Code
.claude/skills/     # Claude-compatible agents
.agents/skills/     # Portable/shared convention supported by some agents
```

The important idea is:

```text
Performance Engineering Knowledge
              |
              v
          SKILL.md
              |
      +-------+-------+
      |       |       |
   Copilot  OpenCode  Qwen Code
      |       |       |
      +-------+-------+
              |
              v
        MCP capabilities
```

The **valuable asset is the engineering knowledge encoded in the Skill**, not the specific AI assistant used to consume it.

During the tutorial we will inspect existing k6 Skills, create or modify one ourselves, and use it together with MCP tools.

Example:

```bash
git clone <WORKSHOP_REPOSITORY_URL>
cd <WORKSHOP_REPOSITORY>
```

---

## 11. MCP support in your AI assistant

Before the workshop, verify that your chosen AI assistant supports **Model Context Protocol servers**.

We will combine Agent Skills with two MCP servers:

```text
                 AI Coding Assistant
                        |
              +---------+---------+
              |                   |
         Agent Skills             MCP
              |                   |
   k6 conventions,          +-----+------+
   templates, examples      |            |
                            v            v
                         mcp-k6     mcp-grafana
                            |            |
                      validate/run   dashboards/
                      k6 tests       observability
```

The exact configuration depends on the client you use.

Examples of clients that can be used in the workshop include:

- GitHub Copilot / VS Code
- OpenCode
- Qwen Code
- Claude Code
- Claude Desktop
- Cursor
- Codex CLI

### Skills and MCP are different

This distinction is important:

**Agent Skills** teach the assistant **how your team works**.

Examples:

- How your k6 projects are structured.
- Which thresholds you normally use.
- How authentication helpers should be created.
- How workload models should be defined.
- Which reusable templates or conventions your team follows.

**MCP servers** give the assistant **tools and external capabilities**.

For example:

```text
Skill:
"Build k6 projects using our workload / scenario / behaviour architecture."

mcp-k6:
"Validate this script."
"Run this test with 10 VUs."
"Find the official documentation for scenarios."

mcp-grafana:
"Find the relevant dashboard."
"Inspect telemetry during the test."
"Help correlate a latency increase with application metrics."
```

Together, they create the feedback loop we want to demonstrate:

```text
Requirements
     |
     v
Agent Skill
     |
     v
Generate k6 test
     |
     v
mcp-k6 validate
     |
     +---- error ----> AI fixes test ----+
     |                                   |
     +-----------------------------------+
     |
     v
Run performance test
     |
     v
mcp-grafana
     |
     v
Investigate system behaviour
```

Check your client's current documentation before the workshop because MCP and Agent Skills support evolves quickly.

---

## 12. Make

The workshop projects use **Make** to run common tasks such as test execution, report generation, and test data creation.

### macOS

```bash
brew install make
```

### Windows

Using Winget:

```powershell
winget install GnuWin32.Make
```

Or using Chocolatey:

```powershell
choco install make
```

### Ubuntu / Debian

```bash
sudo apt update && sudo apt install make
```

### Verify

```bash
make --version
```

---

## 13. Prometheus and Grafana stack

A local **Prometheus + Grafana** stack is required for the observability exercises. This stack receives k6 metrics via remote write and provides dashboards for validation.

The stack is defined in the workshop repository at `workshop/stack/docker-compose.yml`:

```text
workshop/stack/
├── docker-compose.yml
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml
        └── dashboards/
            ├── dashboards.yml
            └── k6-results.json
```

### Start the stack

```bash
cd workshop/stack
docker-compose up -d
```

### Verify

- **Grafana**: http://localhost:3000 (admin / admin)
- **Prometheus**: http://localhost:9090

```bash
curl -s http://localhost:9090/-/healthy
curl -s http://localhost:3000/api/health
```

### Stop the stack

```bash
cd workshop/stack
docker-compose down
```

---

## 14. Grafana service account token

To connect the **mcp-grafana** server to your local Grafana instance, you need a **service account token**.

### Create a service account token

1. Open Grafana at http://localhost:3000.
2. Sign in with admin / admin.
3. Go to **Administration > Service accounts**.
4. Click **Add service account**.
5. Name it `workshop` (or any name you prefer).
6. Set role to **Editor** or **Admin**.
7. Click **Add**.
8. Under **Tokens**, click **Add service account token**.
9. Copy the token and store it securely.

### Use the token

Set these environment variables before starting your AI assistant:

```bash
export GRAFANA_URL=http://localhost:3000
export GRAFANA_SERVICE_ACCOUNT_TOKEN=<your-token>
```

On Windows PowerShell:

```powershell
$env:GRAFANA_URL="http://localhost:3000"
$env:GRAFANA_SERVICE_ACCOUNT_TOKEN="<your-token>"
```

> **Important:** Never commit tokens, API keys, or passwords to the repository.

---

## 15. Nice to have

These tools are not mandatory but can make the exercises easier.

### GitHub CLI

```bash
gh --version
```

https://cli.github.com/

### jq

Useful for inspecting JSON:

```bash
jq --version
```

### curl

Useful for testing APIs:

```bash
curl --version
```

### Node.js

Required for running test data generators used in the workshop projects (e.g., `generatePets.js`, `generateUsers.js`).

```bash
node --version
npm --version
```

Install from: https://nodejs.org/

---

## 16. Knowledge prerequisites

You do **not** need to be a k6 expert.

Basic familiarity with the following will help:

- HTTP APIs
- JavaScript or TypeScript syntax
- Performance-testing concepts such as virtual users, throughput, response time, and thresholds
- Git
- Command-line tools
- Docker basics (pulling images, running containers, using Docker Compose)

No previous MCP development experience is required.

---

# Pre-workshop checklist

Please complete this checklist before arriving.

- [ ] I can access GitHub.
- [ ] `git --version` works.
- [ ] I have cloned a GitHub repository successfully.
- [ ] I have an AI coding assistant available.
- [ ] My AI assistant can work with a local repository.
- [ ] My AI assistant supports MCP, or I have installed an MCP-capable client.
- [ ] I know where my chosen assistant stores project-level Agent Skills.
- [ ] I can load or invoke a simple `SKILL.md` with my chosen assistant.
- [ ] `k6 version` works.
- [ ] I can execute a simple local k6 test.
- [ ] My k6 installation supports the `experimental-prometheus-rw` output.
- [ ] `docker version` works, or I have chosen native installation alternatives.
- [ ] I have installed or pulled `grafana/mcp-k6`.
- [ ] I have installed or pulled `grafana/mcp-grafana`.
- [ ] `make --version` works (or I have installed a Make equivalent).
- [ ] I can start the Prometheus + Grafana stack with `docker-compose up -d` in `workshop/stack/`.
- [ ] Grafana is reachable at http://localhost:3000.
- [ ] Prometheus is reachable at http://localhost:9090.
- [ ] I have created a Grafana service account token and stored it securely.
- [ ] I can verify the `k6 Results` dashboard receives remote-write metrics.
- [ ] My corporate laptop/network allows Docker and MCP processes to run.
- [ ] I have access to the workshop repository.
- [ ] I have checked that no secrets or company credentials are stored in my test repository.

---

# Five-minute sanity check

Run the following commands before the workshop:

```bash
git --version
k6 version
docker version
make --version
```

If using Homebrew-installed `mcp-k6`:

```bash
mcp-k6 --version
```

If using Docker:

```bash
docker images | grep -E "grafana/(k6|mcp-k6|mcp-grafana)"
```

Start the observability stack:

```bash
cd workshop/stack
docker-compose up -d
curl -s http://localhost:9090/-/healthy
curl -s http://localhost:3000/api/health
```

Verify k6 remote write reaches Prometheus:

```bash
k6 run \
  -o experimental-prometheus-rw \
  -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  --duration 10s \
  --vus 1 \
  https://test.k6.io
```

Then open the **k6 Results** dashboard in Grafana (http://localhost:3000) and confirm metrics are appearing.

Finally:

1. Open the workshop repository in your editor.
2. Open your AI coding assistant.
3. Ask it to explain one file from the repository.
4. Confirm that it can discover or invoke a project Skill.
5. Confirm that your MCP configuration can be edited.
6. Confirm the Grafana service account token is available via `GRAFANA_SERVICE_ACCOUNT_TOKEN`.

If all six steps work, you are ready.

---

## Useful links

- k6 documentation: https://grafana.com/docs/k6/latest/
- Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- mcp-k6: https://github.com/grafana/mcp-k6
- mcp-grafana: https://github.com/grafana/mcp-grafana
- k6 Agent Skills example repository: https://github.com/MrsDaehin/copilot-k6-skills
- GitHub Copilot Agent Skills: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills
- OpenCode Agent Skills: https://opencode.ai/docs/skills
- Qwen Code Agent Skills: https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/

---

> **Tip:**** Install and verify everything before the workshop. We want to spend our time teaching AI how to become a performance engineer — not teaching laptops how to find Docker.
