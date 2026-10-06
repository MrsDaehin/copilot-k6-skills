[<- Back to Workshop overview](../../workshop.md)

# 00 — Installing OpenCode

This guide installs **OpenCode**, the AI coding agent used throughout the workshop, and **k6**, the load testing tool it drives, on Windows and macOS. It then connects OpenCode to a model provider.

> **Reference:** [OpenCode documentation](https://opencode.ai/docs) · [Windows (WSL) guide](https://opencode.ai/docs/windows-wsl) · [Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)

---

## What is OpenCode?

OpenCode is an open source AI coding agent that runs in your terminal. It reads your repository, follows project instructions such as `AGENTS.md`, loads **Agent Skills** on demand, and calls **MCP servers** to reach external tools.

For this workshop you need it because:

- It discovers the skills in `.opencode/skills/`.
- It runs the `mcp-k6` and `mcp-grafana` MCP servers.
- It reads the root `AGENTS.md` so it follows the repository conventions.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| A modern terminal | Windows Terminal, WezTerm, Alacritty, Ghostty, or Kitty |
| An LLM provider account | You will need an API key or a subscription |
| WSL (Windows only) | Recommended; see below |
| Node.js (optional) | Only if you prefer the npm installation method |
| Homebrew (macOS only) | Recommended; needed for the k6 installation |

Docker and Grafana are not needed to complete this module. They are covered in [`REQUIREMENTS.md`](../../REQUIREMENTS.md).

---

## Install on macOS

Pick one method. They all produce the same `opencode` command.

### Option A — Install script (recommended)

```bash
curl -fsSL https://opencode.ai/install | bash
```

Restart your terminal afterwards so the new PATH entry is loaded.

### Option B — Homebrew

```bash
brew install anomalyco/tap/opencode
```

> The `anomalyco/tap` tap tracks the newest releases. The plain `brew install opencode` formula is maintained by the Homebrew team and is updated less frequently.

### Option C — Node.js package managers

```bash
npm install -g opencode-ai
```

Other package managers work too:

```bash
bun install -g opencode-ai
pnpm install -g opencode-ai
yarn global add opencode-ai
```

### Verify

```bash
opencode --version
```

---

## Install on Windows

OpenCode runs on Windows natively, but **WSL is the recommended path**: better file system performance, full terminal feature support, and fewer surprises with the tools the agent shells out to.

### Option A — WSL (recommended)

1. Install WSL using the official Microsoft guide:

   ```powershell
   wsl --install
   ```

   Reboot if prompted, then open your WSL terminal.

2. Install OpenCode inside WSL:

   ```bash
   curl -fsSL https://opencode.ai/install | bash
   ```

3. Navigate to the workshop repository. Windows drives are mounted under `/mnt`:

   ```bash
   cd /mnt/c/Users/YourName/path/to/copilot-k6-skills
   opencode
   ```

> **Tip:** For the smoothest experience, clone the repository into the WSL filesystem (for example `~/code/copilot-k6-skills`) instead of running it from `/mnt/c/`. The `/mnt` mount is slower.

### Option B — Native Windows

If you prefer to stay in PowerShell or Windows Terminal:

```powershell
choco install opencode
```

```powershell
scoop install opencode
```

```powershell
npm install -g opencode-ai
```

Or download the binary directly from the [Releases](https://github.com/anomalyco/opencode/releases) page.

> Bun-based installation on Windows is not supported yet.

### Verify

In whichever shell you installed into:

```powershell
opencode --version
```

### Optional: desktop app or browser UI from WSL

If you installed in WSL but want the desktop app or browser interface, run the server in WSL and connect from Windows:

```bash
opencode serve --hostname 0.0.0.0 --port 4096
```

Then point the desktop app at `http://localhost:4096`. If `localhost` does not resolve, get the WSL IP with `hostname -I` and use `http://<wsl-ip>:4096`.

> **Caution:** When binding to `0.0.0.0`, set a password so the server is not open to your local network:
>
> ```bash
> OPENCODE_SERVER_PASSWORD=your-password opencode serve --hostname 0.0.0.0
> ```

`opencode web` works the same way: run it in WSL, then open the printed URL in your Windows browser.

---

## Install k6

The workshop generates, validates, and runs performance tests with **Grafana k6**. The agent writes the scripts, but k6 itself runs on your machine (or in the `mcp-k6` Docker container).

### On macOS

Using [Homebrew](https://brew.sh/):

```bash
brew install k6
```

That is the only method needed on macOS. If you prefer not to use a package manager, download the standalone binary from the [k6 releases](https://github.com/grafana/k6/releases) and put `k6` on your `PATH`.

### On Windows

Pick one:

```powershell
winget install k6 --source winget
```

```powershell
choco install k6
```

Or download and run [the official MSI installer](https://dl.k6.io/msi/k6-latest-amd64.msi).

> The Chocolatey package is community-maintained. The `winget` manifests come from the k6 community, and the MSI is the official Grafana installer.

### Running k6 in WSL

If you run OpenCode from WSL, install k6 inside WSL too so the agent finds it on the same `PATH`:

```bash
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Verify

```bash
k6 version
```

Then run a first test against the public k6 endpoint to confirm end-to-end execution:

```bash
k6 run https://test.k6.io
```

You should see a completed execution with latency and check metrics in the terminal.

### Docker alternative

If you would rather not install k6 on the host:

```bash
docker pull grafana/k6
```

Then run tests with:

```bash
docker run --rm -i grafana/k6 run - <script.js
```

> **Note:** The workshop also uses the experimental Prometheus remote write output. Confirm your version supports it, since it is required for the Grafana exercises:
>
> ```bash
> k6 run \
>   -o experimental-prometheus-rw \
>   -e PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
>   --duration 10s \
>   --vus 1 \
>   https://test.k6.io
> ```
>
> See [`REQUIREMENTS.md`](../../REQUIREMENTS.md) for the full k6 checklist.

---

## Connect a model provider

OpenCode needs credentials for the model you want to use.

### Option A — OpenCode Zen (easiest)

[OpenCode Zen](https://opencode.ai/zen) is a curated list of models tested by the OpenCode team.

1. Start OpenCode and run:

   ```text
   /connect
   ```

2. Select **opencode**, then sign in at [opencode.ai/auth](https://opencode.ai/auth).
3. Add billing details and copy the API key.
4. Paste the key back into the prompt.

### Option B — Another provider

Select your provider from the same `/connect` list and paste its API key. The full list of options is in the [providers documentation](https://opencode.ai/docs/providers).

---

## Initialize the workshop project

OpenCode reads project instructions and skills from the folder you launch it in, so launch it at the repository root.

1. Clone or open the repository:

   ```bash
   cd /path/to/copilot-k6-skills
   ```

2. Start OpenCode:

   ```bash
   opencode
   ```

3. Run `/init` to let OpenCode analyze the project.

   > This repository already ships an `AGENTS.md`, so `/init` is optional. Run it only if you want OpenCode to refresh or extend those instructions.

4. Confirm the workshop skills are discovered. Ask:

   ```text
   Which skills are available in this project?
   ```

   You should see `k6-test-suite` and `k6-grafana-validation`, which live in `.opencode/skills/`.

### Project configuration

Global settings live in `~/.config/opencode/opencode.json`. Project-level settings, such as MCP servers, live in `opencode.json` at the repository root. This repository keeps a template at [`workshop/stack/opencode.json.example`](../stack/opencode.json.example) instead of a live config, so MCP configuration is covered in Module 3.

> Restart OpenCode after changing `opencode.json`, `AGENTS.md`, or any skill so the new configuration is loaded.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `opencode: command not found` | The installer adds a PATH entry; restart the terminal or reopen the tab. |
| Slow file reads on Windows | Run OpenCode from WSL against a repo inside `~/code/` rather than `/mnt/c/`. |
| `localhost` refused by the desktop app | Use the WSL IP from `hostname -I` instead. |
| Skills are not listed | Confirm you launched OpenCode at the repository root and that the skills are under `.opencode/skills/`. |
| A change to a skill has no effect | Restart OpenCode so the skill is re-read. |
| Provider auth errors | Re-run `/connect` and paste a fresh key. |
| `k6: command not found` in WSL | Install k6 inside WSL, not just on the Windows side. |
| `unknown output: experimental-prometheus-rw` | Update k6; the Prometheus remote write output is experimental. |

---

## Key takeaways

- macOS: install script, Homebrew tap, or a Node.js package manager.
- Windows: WSL is recommended; native install is available via Chocolatey, Scoop, or npm.
- k6: `brew install k6` on macOS, `winget`/Chocolatey/MSI on Windows, or Docker as an alternative.
- Install k6 inside WSL if that is where OpenCode runs, so both share one `PATH`.
- `/connect` links a model provider.
- Skills are discovered from the directory you launch OpenCode in, so start at the repository root.
- Restart OpenCode after changing `opencode.json`, `AGENTS.md`, or a skill.

## Next

Continue with [01 — What Is an Agent Skill?](../01-What-is-a-skill/README.md), which explains the `SKILL.md` format used by the skills installed in this repository.

## References

- [OpenCode — Intro and installation](https://opencode.ai/docs)
- [OpenCode — Windows (WSL)](https://opencode.ai/docs/windows-wsl)
- [OpenCode — Agent Skills](https://opencode.ai/docs/skills)
- [OpenCode — MCP servers](https://opencode.ai/docs/mcp-servers)
- [OpenCode — Releases](https://github.com/anomalyco/opencode/releases)
- [k6 — Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)
- [k6 — Releases](https://github.com/grafana/k6/releases)
