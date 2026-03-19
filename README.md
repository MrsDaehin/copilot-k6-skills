# Copilot K6 Skills

A shared repository of GitHub Copilot skills focused on k6 performance testing automation.

## Overview

This repo contains reusable skills that can be integrated into GitHub Copilot to assist with k6 load testing configurations and workflows. Skills are stored under `.github/skills/` and follow the standard Copilot skill format.

## Available Skills

### k6-config-generator
Generates JSON configuration files for k6 performance tests based on test type (Load, Stress, Spike, Soak). Includes standard thresholds for request duration and failure rate.

- **Location**: `.github/skills/k6-config-generator/`
- **Examples**: See `examples/` folder for sample configs

### k6-auth-generators
Generates authentication helper files for k6 tests, including JWT token generator and HMAC signature calculator.

- **Location**: `.github/skills/k6-auth-generators/`
- **Templates**: See `templates/` folder for the source files

### k6-documentation
Helps you navigate and apply the official Grafana k6 documentation, including core concepts, the JavaScript HTTP API, and example patterns.

- **Location**: `.github/skills/k6-documentation/`
- **Sources**:
  - https://grafana.com/docs/k6/latest/
  - https://grafana.com/docs/k6/latest/javascript-api/k6-http/
  - https://grafana.com/docs/k6/latest/examples/

## How to Use in Your Repo

1. Add this repo as a submodule:
   ```bash
   git submodule add https://github.com/<your-org>/copilot-k6-skills.git .github/skills
   git commit -m "Add shared Copilot skills submodule"
   ```

2. Update submodule when new skills are added:
   ```bash
   git submodule update --remote
   ```

3. Skills will be automatically available in Copilot for that repo.

## Adding New Skills

1. Create a new folder under `.github/skills/`
2. Add a `SKILL.md` file with YAML frontmatter and documentation
3. Optionally add supporting files (examples, templates, etc.)
4. Commit and push to share with all consuming repos

## Contributing

- Follow the skill naming convention: lowercase-with-hyphens
- Include clear descriptions and usage examples
- Test skills in a consuming repo before committing

## License

[Add your license here]