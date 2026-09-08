# What is an OpenCode Skill?

An **OpenCode Skill** is a reusable, self-contained instruction definition that tells the AI agent how to perform a specific task. Skills are discovered on-demand and loaded by agents via the native `skill` tool.

---

## How it works

Each skill is a `SKILL.md` file placed inside a folder named after the skill. OpenCode searches specific locations to discover them:

- **Project-level:** `.opencode/skills/<name>/SKILL.md`
- **Global:** `~/.config/opencode/skills/<name>/SKILL.md`
- **Claude-compatible:** `.claude/skills/<name>/SKILL.md` or `~/.claude/skills/<name>/SKILL.md`
- **Agent-compatible:** `.agents/skills/<name>/SKILL.md` or `~/.agents/skills/<name>/SKILL.md`

---

## Structure of a SKILL.md

Every `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: skill-name          # Required. Lowercase alphanumeric, hyphens allowed. 1-64 chars.
description: Short text    # Required. 1-1024 chars. Helps the agent decide when to load it.
license: MIT               # Optional.
compatibility: opencode    # Optional.
metadata:                  # Optional. String-to-string map.
  audience: developers
  workflow: ci-cd
---

## What I do
- Step-by-step instructions for the agent.
- Code patterns, conventions, examples.

## When to use me
- Specific scenarios that trigger this skill.
```

---

## Naming rules

- Lowercase alphanumeric with single hyphen separators (`^[a-z0-9]+(-[a-z0-9]+)*$`)
- Must match the directory name containing `SKILL.md`
- Cannot start or end with `-`, no consecutive `--`

---

## Discovery and loading

1. OpenCode lists available skills in the `skill` tool description sent to the agent.
2. The agent calls `skill({ name: "skill-name" })` to load the full content.
3. The skill instructions are injected into the conversation context.

---

## Permissions

Control access via `opencode.json`:

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
| `allow` | Skill loads immediately |
| `deny` | Skill hidden, access rejected |
| `ask` | User prompted for approval |

---

## Per-agent overrides

Custom agents can declare their own skill permissions in frontmatter:

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

---

## Disabling the skill tool

Disable entirely for a specific agent:

```yaml
---
tools:
  skill: false
---
```

---

## Troubleshooting

If a skill doesn't appear:

1. `SKILL.md` must be **all caps**
2. Frontmatter must include `name` and `description`
3. Skill names must be **unique** across all locations
4. Check permissions -- skills with `deny` are hidden

---

*Reference: [OpenCode Agent Skills docs](https://opencode.ai/docs/skills/)*
