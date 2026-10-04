# 01 — What Is an Agent Skill?

This guide introduces **Agent Skills** and shows how they connect an AI agent to reusable knowledge, workflows, and supporting resources.

> **References:** [AGENTS.md](https://agents.md/) · [Agent Skills](https://agentskills.io/home)

---

## What is an Agent Skill?

An **Agent Skill** is a lightweight, open format for extending an AI agent's capabilities with specialized knowledge and workflows.

A skill is a folder that contains a required `SKILL.md` file. The file provides:

- **Metadata** that identifies the skill and explains when it is relevant.
- **Instructions** that tell the agent how to perform a specific task.
- **Optional resources** such as scripts, reference material, templates, and other project files.

In short, a skill packages repeatable instructions so an agent can apply them consistently across tasks and compatible tools.

### A skill is more than a prompt

A one-time prompt gives the agent an instruction for one request. A skill is a reusable package that can contain:

- A clear purpose and activation description
- A step-by-step workflow
- Domain-specific conventions
- Examples and templates
- Scripts or other supporting files

The agent can load the skill when the task calls for it, then follow the same guidance again in future tasks.

---

## Why use Agent Skills?

AI agents are capable, but they may not know a team's tools, terminology, standards, or preferred process. Agent Skills make that context available in a portable and version-controlled form.

They help with three common needs:

| Need | How a skill helps |
|------|-------------------|
| **Domain expertise** | Encodes specialized knowledge for a particular domain, system, or workflow. |
| **Repeatable workflows** | Turns a multi-step process into a consistent, auditable procedure. |
| **Cross-product reuse** | Allows a skill to be shared across compatible AI agents instead of being rewritten for each one. |

A performance-testing skill, for example, can preserve requirements such as the preferred k6 executor, threshold defaults, folder layout, and Prometheus integration. The agent can apply those requirements without being told about them from scratch every time.

---

## How an agent uses a skill

Agent Skills use **progressive disclosure** so the agent can keep many skills available without loading every instruction at once.

### 1. Discovery

At startup, the agent sees the name and description of each available skill. This lightweight information is enough to know which skills might be relevant to a request.

### 2. Activation

When a request matches a skill's description, the agent reads the full `SKILL.md` instructions into its working context.

### 3. Execution

The agent follows the instructions. When needed, it can also run bundled scripts or open files such as references, templates, and examples.

This means a large collection of skills can remain discoverable while detailed instructions are loaded only for the task that needs them.

---

## Anatomy of a skill

A typical skill folder looks like this:

```text
my-skill/
├── SKILL.md          # Required: metadata and instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates and resources
└── ...               # Other supporting files or directories
```

Only the folder and its `SKILL.md` file are required. Supporting resources are optional and should be added only when they make the workflow clearer or more reliable.

### The `SKILL.md` file

A minimal skill contains a name, a description, and instructions:

```markdown
---
name: k6-test-suite
description: Generates a k6 performance test suite with scenario scripts, configuration files, thresholds, and Prometheus output for Grafana.
---

# k6 Test Suite

## Workflow

1. Ask for the target API and test requirements.
2. Generate the agreed project structure.
3. Add k6 scenarios, workloads, and thresholds.
4. Configure Prometheus remote write output.
5. Validate the generated files before handing them to the user.
```

The `description` is especially important: it helps the agent decide whether the skill should be activated for a particular request. The body should make the expected workflow explicit and actionable.

---

## How custom skills work with the AI workflow

The sections above describe the format. This section describes the runtime: what the agent actually reads, what happens to the rest of the skill folder, how skills reach custom agents, and what the interaction looks like from your side.

### What the agent reads from a skill folder

Only the frontmatter is read up front. For every skill it discovers, the agent receives the `name` and `description` — roughly 100 tokens — and nothing more. The body of `SKILL.md`, and every other file in the folder, stay out of context until something asks for them.

| Part of the skill | When it is read | Purpose |
|-------------------|-----------------|---------|
| `name` and `description` in the frontmatter | At startup, for every discovered skill | Lets the agent decide whether the skill is relevant |
| `SKILL.md` body | When the skill is activated | The workflow the agent follows |
| `reference/`, `examples/`, `assets/`, `scripts/` | Only when the instructions point at them and the agent opens the file | Detail kept out of context until it is needed |

Two consequences follow for authoring:

- The `description` is the only text the agent sees when it chooses, so it must contain the words a person would actually type — "k6", "load test", "p95", "Grafana" — not just a label.
- Anything the agent should read must be named in `SKILL.md` with a path relative to the skill root. A bundled file that no instruction references is never opened.

### Are the bundled resources loaded automatically?

No. They are *available*, not loaded. GitHub Copilot documents this explicitly: when a skill is invoked, Copilot discovers the files in the skill's directory and makes them available alongside the instructions. Their contents enter the context only when the agent reads a specific file.

That makes resource loading demand-driven, and it has practical rules:

- Reference resources explicitly, for example: *"Use `reference/metrics.md` for the full k6 metric list."*
- Keep references one level deep from `SKILL.md`, and keep each file focused. Several small reference files cost less context than one long one.
- Keep the `SKILL.md` body short; the specification recommends fewer than 500 lines and roughly 5,000 tokens, moving detail into `reference/` files. `k6-grafana-validation` follows this by keeping its metric catalog and diagnostic matrix in `reference/metrics.md` and `reference/bottleneck-patterns.md`.
- Scripts are never executed on their own. The skill must state the command and its arguments, or the agent has no reason to run it.

### Do custom agents get the skills too?

Yes. Skills are a shared catalog, and every agent can activate them unless you restrict that per agent. In `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| Permission | Behavior |
|------------|----------|
| `allow` | The skill loads immediately |
| `ask` | The user is prompted before the skill loads |
| `deny` | The skill is hidden from the agent and cannot be loaded |

Patterns accept wildcards, so `internal-*` covers a family of skills. Overrides are also available per agent — in agent frontmatter for custom agents, or under `agent.<name>.permission` in `opencode.json` for built-in agents. Setting `tools.skill: false` removes the skill tool entirely for that agent, and the skill list disappears from what it sees.

This repository defines no custom agents, so both workshop skills are available to every OpenCode agent.

### Where each agent looks for skills

| | OpenCode | GitHub Copilot |
|---|---|---|
| Project | `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` | `.github/skills/`, `.claude/skills/`, `.agents/skills/` |
| Personal, all projects | `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | `~/.copilot/skills/`, `~/.agents/skills/` |

OpenCode walks up from the directory you launched it in until it reaches the git worktree root, so start it at the repository root. Neither tool reads the other's private directory, which is exactly why this repository mirrors `k6-test-suite` and `k6-grafana-validation` into both locations. `.claude/skills/` and `.agents/skills/` are read by both, which is the option for authoring once instead of mirroring twice.

Skill names must also be unique across all locations, or the skill is not discovered.

> **Client difference:** OpenCode recognizes only `name`, `description`, `license`, `compatibility`, and `metadata` in frontmatter, and ignores anything else. The specification's experimental `allowed-tools` field is honored by Copilot, where it pre-approves tools so they do not prompt; anything not listed still asks for permission.

### The workflow you interact with

1. **You ask in natural language.** *"Generate a k6 load test for the Petstore API with p(95) < 300ms."* No command or slash command is involved.
2. **The agent matches the description.** The `description` is the trigger. Being explicit — *"Use the k6-test-suite skill to…"* — produces the same activation with fewer surprises.
3. **The skill activates.** In OpenCode this is a visible `skill({ name: "k6-test-suite" })` tool call in the transcript; in Copilot the `SKILL.md` is injected into the agent's context. Permissions apply at this moment: `ask` prompts you, `deny` fails.
4. **The agent gathers what the instructions require.** It reads `reference/metrics.md` if the workflow needs it, and asks you the questions the skill says to ask — target URL, test types, authentication method, thresholds.
5. **The agent executes.** Skills supply the instructions; tools do the work. Here that means file reads and writes, shell commands, and the `mcp-k6` and `mcp-grafana` MCP servers for running k6 and querying Prometheus.
6. **The result feeds the next skill.** The generated suite is run, Prometheus stores the metrics, and a second request loads `k6-grafana-validation` to check the SLOs and diagnose bottlenecks. Skills compose into the loop:

   ```text
   skill generates -> k6 runs -> Prometheus stores -> skill validates -> findings
   ```

You can watch each stage happen:

| Stage | What to look for |
|-------|------------------|
| Discovery | Ask "What skills are available?" and see names with descriptions |
| Activation | A `skill` tool call naming the skill |
| Resource loading | A read of a file under `reference/`, `examples/`, or `assets/` |
| Execution | `mcp-k6` or `mcp-grafana` calls, or shell commands |

Restart the agent after editing a skill so the change is picked up.

---

## `AGENTS.md` vs. Agent Skills

Both formats give coding agents reusable instructions, but they solve different problems. [AGENTS.md](https://agents.md/) is project guidance; [Agent Skills](https://agentskills.io/home) is a task-specific capability package.

| | `AGENTS.md` | Agent Skill |
|---|---|---|
| **Purpose** | Help an agent work effectively in a project | Give an agent a specialized capability or workflow |
| **Scope** | Repository- or subproject-wide context | One focused task or domain |
| **When it is used** | Generally available as project instructions for the applicable scope | Loaded on demand when a task matches its description |
| **Format** | Standard Markdown; no required frontmatter or fields | A folder containing `SKILL.md`, with `name` and `description` at minimum, plus optional resources |
| **Typical content** | Setup commands, architecture, conventions, testing, and security guidance | Domain expertise, repeatable steps, scripts, references, templates, and examples |
| **Granularity** | Usually one root file, with nested files for subprojects | Many independent skill folders that can be composed as needed |
| **Context model** | Ambient project orientation | Progressive disclosure: discover metadata, then load full instructions when activated |

### How they work together

Use the formats for different kinds of knowledge:

- Put stable, always-relevant project rules in `AGENTS.md`: repository layout, commands, local conventions, and verification steps.
- Put specialized, repeatable procedures in skills: for example, how to generate a k6 suite or how to validate a k6 run.
- Keep detailed domain guidance in a skill so it is loaded only when that capability is relevant.
- Keep the two files from duplicating each other: `AGENTS.md` explains the project; a skill explains a particular job.

In this repository, the root `AGENTS.md` describes the skill locations, mirror rules, workshop stack, and OpenCode configuration. The `k6-test-suite` and `k6-grafana-validation` skills provide the task-specific k6 workflows.

Neither format provides an external tool by itself. Skills describe procedures; MCP servers such as `mcp-k6` and `mcp-grafana` provide execution and observability capabilities.

---

## Designing a useful skill

Use these questions when creating one:

1. **What specific task does the skill support?**
2. **What should cause an agent to load it?**
3. **What steps and decisions belong in the workflow?**
4. **Which conventions must be followed every time?**
5. **What files, examples, or scripts make the instructions easier to execute?**
6. **How will someone verify that the result is correct?**

Keep the description specific, make the workflow actionable, and keep supporting material close to the instructions that use it. The goal is not to add more text; it is to give the agent the right context at the right time.

---

## Skills in this workshop

This repository uses skills for the performance-testing workflow:

- [`k6-test-suite`](../../.opencode/skills/k6-test-suite/SKILL.md) generates k6 scenarios, configuration files, thresholds, and Prometheus remote write output.
- [`k6-grafana-validation`](../../.opencode/skills/k6-grafana-validation/SKILL.md) queries stored metrics, checks SLOs, diagnoses bottlenecks, and verifies Grafana panels.

The same skills are also organized for GitHub Copilot under [`.github/skills`](../../.github/skills). The workshop starts with the structure of a `SKILL.md` in [Exercise 1: Skill Anatomy](../exercises/01-skill-anatomy.md), then moves on to building a skill in [Exercise 2](../exercises/02-create-test-suite-skill.md).

---

## Key takeaways

- An Agent Skill is a reusable folder, not just a prompt.
- `SKILL.md` is the required entry point for metadata and instructions.
- Skills can add scripts, references, templates, and other resources.
- Discovery, activation, and execution happen progressively.
- Only `name` and `description` are read at startup; bundled resources are read on demand.
- Skills are triggered by the request, and permissions can allow, gate, or hide them per agent.
- Well-written skills encode expertise and make workflows repeatable.

## References

- [AGENTS.md — project instructions for coding agents](https://agents.md/)
- [Agent Skills — format overview](https://agentskills.io/home)
- [Agent Skills — specification](https://agentskills.io/specification)
- [OpenCode — Agent Skills](https://opencode.ai/docs/skills/)
- [GitHub Copilot — About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [GitHub Copilot — Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
