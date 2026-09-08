# Exercise 1: Skill Anatomy

**Objective:** Understand the structure of a `SKILL.md` file, how skills are discovered, and how to modify one.

**Time:** 15 minutes

---

## What you will learn

- The anatomy of a `SKILL.md` file (frontmatter, body)
- Where OpenCode looks for skills
- How the agent discovers and loads skills on demand

---

## Steps

### 1. Find the existing skills

Look at the skill directories in this repository:

```text
.opencode/skills/            # OpenCode
.github/skills/              # GitHub Copilot
```

List the available skill folders:

```bash
ls -la .opencode/skills/
```

You should see:

- `k6-test-suite/`
- `k6-grafana-validation/`

And in `.github/skills/`:

- `k6-auth-generators/`
- `k6-boilerplate-generator/`
- `k6-config-generator/`
- `k6-documentation/`
- `k6-html-report/`
- `k6-test-suite/`
- `k6-grafana-validation/`

### 2. Inspect a SKILL.md

Open `.opencode/skills/k6-test-suite/SKILL.md` and identify:

1. **YAML frontmatter** (between the `---` lines):
   - `name`: must be 1-64 characters, lowercase alphanumeric with single hyphens
   - `description`: 1-1024 characters, helps the agent decide when to load this skill
2. **Body**: markdown instructions the agent receives when the skill is loaded

### 3. Ask the agent about available skills

In your AI assistant, ask:

```
What skills are available?
```

The agent should list them with their names and descriptions. This comes from the `skill` tool description that OpenCode builds from discovered `SKILL.md` files.

### 4. Load a skill

Ask the agent:

```
Load the k6-test-suite skill
```

The agent calls `skill({ name: "k6-test-suite" })` and receives the full `SKILL.md` content as instructions.

### 5. Modify the description

Edit `.opencode/skills/k6-test-suite/SKILL.md` and change the description to something more specific:

```yaml
description: Generates a complete k6 load and stress test suite with ramping-arrival-rate scenarios, threshold configs, and Prometheus remote write output for Grafana visualization.
```

Ask the agent again: *"What skills are available?"*

Verify the updated description appears.

---

## Key rules to remember

| Rule | Detail |
|------|--------|
| File name | Must be `SKILL.md` (all caps) |
| Directory name | Must match the `name` field in frontmatter |
| Name format | Lowercase, hyphens only (`^[a-z0-9]+(-[a-z0-9]+)*$`) |
| Required fields | `name` and `description` |
| Optional fields | `license`, `compatibility`, `metadata` |

---

## Next

Proceed to Exercise 2: [Create the k6 Test Suite Skill](02-create-test-suite-skill.md)
