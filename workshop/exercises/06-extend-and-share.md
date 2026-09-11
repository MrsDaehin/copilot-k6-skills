# Exercise 6: Extend and Share

**Objective:** Extend the skills with custom thresholds and operation tags, configure permissions, mirror skills across agents, and share via Git submodule.

**Time:** 20 minutes

---

## What you will learn

- How to extend skills with team-specific conventions
- How to control skill access via permissions
- How to mirror skills for multiple AI assistants
- How to share skills across repositories

---

## Steps

### 1. Add custom operation tags

Open the `k6-test-suite` skill and add a section about operation tags:

```markdown
## Operation tags

All HTTP requests must be tagged with an operation label:

  http.get(url, { tags: { operation: 'get_pet_by_id' } });

Common operation names:
- create_pet, get_pet, update_pet, delete_pet
- get_inventory, create_order, get_order
- login, logout, create_user, get_user

These tags appear in Grafana as breakdown dimensions.
```

Ask the agent to regenerate the test suite and verify the new tags appear in the generated workload scripts.

### 2. Add custom thresholds

Extend the skill to support business-specific thresholds:

```markdown
## Custom thresholds

Ask the user for business-specific thresholds:

- API response time: p(95) < Xms (default 500ms)
- Error rate: rate < X (default 0.01)
- Throughput: iterations > X per second (no default)
- Custom metrics: user-defined Trend or Counter thresholds

Always include all four threshold types in the config.
```

### 3. Configure permissions

Open `opencode.json` and add permission rules:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "k6-test-suite": "allow",
      "k6-grafana-validation": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

Test the permissions:

- Load `k6-test-suite` — should work immediately
- Load a hypothetical `internal-docs` skill — should be denied
- Load a hypothetical `experimental-new-feature` skill — should prompt for approval

### 4. Mirror skills across agents

The same `SKILL.md` works in multiple locations:

| Agent | Location |
|-------|----------|
| OpenCode | `.opencode/skills/<name>/SKILL.md` |
| GitHub Copilot | `.github/skills/<name>/SKILL.md` |
| Claude-compatible | `.claude/skills/<name>/SKILL.md` |
| Agent-compatible | `.agents/skills/<name>/SKILL.md` |

Verify the mirror exists in this repo:

```bash
ls .opencode/skills/k6-test-suite/SKILL.md
ls .github/skills/k6-test-suite/SKILL.md
```

Both files should exist with identical content.

### 5. Share via Git submodule

To share skills across repositories, add this repo as a submodule:

```bash
# In a consuming repository:
git submodule add https://github.com/MrsDaehin/copilot-k6-skills.git .github/skills
```

Then symlink or copy the skills into the consuming repo's agent directory:

```bash
# For OpenCode:
ln -s .github/skills/k6-test-suite .opencode/skills/k6-test-suite
ln -s .github/skills/k6-grafana-validation .opencode/skills/k6-grafana-validation
```

Update the submodule when new skills are added:

```bash
git submodule update --remote
```

### 6. Test in a consuming repository

1. Create a new directory outside this repo:

```bash
mkdir -p /tmp/test-project && cd /tmp/test-project
git init
```

2. Add the skills as a submodule:

```bash
git submodule add <repo-url> .github/skills
```

3. Open the project in your AI assistant.
4. Ask: *"What skills are available?"*
5. Verify the k6 skills appear.

---

## CI/CD integration pattern

Skills can be used in CI pipelines:

```yaml
# .github/workflows/performance.yml
- name: Generate test suite
  uses: github/copilot-workflow@v1
  with:
    prompt: "Load k6-test-suite skill and generate tests for ${{ env.API_URL }}"

- name: Run k6 tests
  run: |
    k6 run -o experimental-prometheus-rw \
      -e PROMETHEUS_RW_SERVER_URL=${{ env.PROMETHEUS_URL }} \
      configs/load.json workloads/load.js

- name: Validate results
  uses: github/copilot-workflow@v1
  with:
    prompt: "Load k6-grafana-validation skill and validate the test results against Grafana"
```

---

## Key takeaways

- Skills encode **team knowledge**, not just code templates.
- Permissions control which skills agents can access.
- The same `SKILL.md` works across multiple AI assistants.
- Git submodules enable skill sharing across repositories.
- Skills + MCP create a complete AI-driven testing workflow.

---

## Workshop complete

You now know how to:

1. Write `SKILL.md` files for OpenCode
2. Create a k6 test suite skill with Prometheus output
3. Set up a local Grafana + Prometheus stack
4. Configure MCP servers in OpenCode
5. Validate k6 results against Grafana via MCP
6. Extend, share, and mirror skills

**Next steps:**

- Add more skills to the repository
- Set up CI/CD gates with k6 thresholds
- Explore distributed testing with k6-operator
- Build custom Grafana dashboards for your team
