# Workshop Requirements

## The Performance Copilot Awakens
### Teaching AI to Test with k6, MCP, and Grafana

This document lists everything you should install or prepare **before the workshop** so we can spend the session building, testing, and experimenting instead of troubleshooting local environments.

> **Recommended setup:** VS Code + GitHub Copilot + Git + k6 + Docker.
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

## 4. AI coding assistant

You need access to an **AI coding assistant that can work with your source code**.

### Recommended

**GitHub Copilot** is recommended because part of the workshop focuses specifically on creating and using **Copilot / Agent Skills** stored in the repository.

Recommended environment:

- Visual Studio Code
- GitHub Copilot extension
- Copilot Chat / Agent mode enabled

https://code.visualstudio.com/

https://github.com/features/copilot

### Other possible AI assistants

You can also experiment with MCP using clients such as:

- Claude Code
- Claude Desktop
- Cursor
- OpenAI Codex CLI
- Other MCP-compatible coding assistants

> **Important:** The Skills exercises will use the GitHub Copilot Agent Skills structure. Other assistants may use different formats for reusable instructions or skills. If you want to follow the tutorial exactly, use GitHub Copilot.

### Verify

Before the workshop, open your AI assistant and confirm that you can:

1. Open a local repository.
2. Ask the assistant questions about files in that repository.
3. Use its agent or coding mode.
4. Configure MCP servers.

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

The exercises will use a repository following the same approach as:

https://github.com/MrsDaehin/copilot-k6-skills

Example:

```bash
git clone <WORKSHOP_REPOSITORY_URL>
cd <WORKSHOP_REPOSITORY>
```

The repository will contain examples of reusable AI skills for k6, such as:

```text
.github/
└── skills/
    ├── k6-config-generator/
    │   └── SKILL.md
    ├── k6-auth-generators/
    │   └── SKILL.md
    ├── k6-documentation/
    │   └── SKILL.md
    ├── k6-html-report/
    │   └── SKILL.md
    └── k6-boilerplate-generator/
        └── SKILL.md
```

During the tutorial we will examine this structure and create or modify a skill ourselves.

---

## 11. MCP support in your AI assistant

Before the workshop, verify that your chosen AI assistant supports **Model Context Protocol servers**.

We will configure two MCP servers:

```text
AI Coding Assistant
        |
        +---- Copilot / Agent Skills
        |
        +---- mcp-k6
        |       |
        |       +---- k6 documentation
        |       +---- script validation
        |       +---- local test execution
        |
        +---- mcp-grafana
                |
                +---- Grafana
                +---- dashboards
                +---- metrics / observability context
```

The exact MCP configuration format depends on the client you use.

Examples of clients with MCP support include:

- GitHub Copilot / VS Code
- Claude Code
- Claude Desktop
- Cursor
- Codex CLI

Check your client's current documentation before the workshop because MCP configuration can evolve quickly.

---

## 12. Nice to have

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

Not required for basic k6 usage, because k6 does not run scripts through Node.js.

However, Node.js may be useful if you want to experiment with additional JavaScript tooling around the workshop repository.

```bash
node --version
npm --version
```

---

## 13. Knowledge prerequisites

You do **not** need to be a k6 expert.

Basic familiarity with the following will help:

- HTTP APIs
- JavaScript or TypeScript syntax
- Performance-testing concepts such as virtual users, throughput, response time, and thresholds
- Git
- Command-line tools

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
- [ ] If I want to follow the Skills exercises exactly, I have GitHub Copilot available.
- [ ] `k6 version` works.
- [ ] I can execute a simple local k6 test.
- [ ] `docker version` works, or I have chosen native installation alternatives.
- [ ] I have installed or pulled `grafana/mcp-k6`.
- [ ] I have installed or pulled `grafana/mcp-grafana`.
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
```

If using Homebrew-installed `mcp-k6`:

```bash
mcp-k6 --version
```

If using Docker:

```bash
docker images | grep -E "grafana/(k6|mcp-k6|mcp-grafana)"
```

Finally:

1. Open the workshop repository in your editor.
2. Open your AI coding assistant.
3. Ask it to explain one file from the repository.
4. Confirm that your MCP configuration can be edited.

If all four steps work, you are ready.

---

## Useful links

- k6 documentation: https://grafana.com/docs/k6/latest/
- Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
- mcp-k6: https://github.com/grafana/mcp-k6
- mcp-grafana: https://github.com/grafana/mcp-grafana
- Copilot k6 Skills example: https://github.com/MrsDaehin/copilot-k6-skills
- GitHub Copilot Agent Skills documentation: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills

---

> **Tip:** Install and verify everything before the workshop. We want to spend our time teaching AI how to become a performance engineer — not teaching laptops how to find Docker.
