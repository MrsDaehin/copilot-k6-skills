---
name: k6-auth-generators
description: Generates authentication helper files for k6 performance tests, including JWT token generator and HMAC signature calculator.
argument-hint: "Specify the target folder for the auth files (optional, default: shared/)."
---

# k6 Auth Generators Skill

## Description
This skill creates two essential authentication utility files for k6 performance testing:

- `token-generator.js`: JWT token generator for bearer authentication
- `hmac-generator.js`: HMAC signature calculator for API authentication

These files provide reusable functions for handling authentication in k6 scripts, following common patterns used in load testing scenarios.

## Workflow
1. **Determine Target Folder**: Use the specified folder (default: `shared/`) or ask user if not provided.
2. **Generate Files**: Create `token-generator.js` and `hmac-generator.js` with standard implementations.
3. **Validate**: Ensure files are created and contain valid JavaScript code.

## Usage
Invoke this skill when you need authentication utilities in your k6 project. Example prompt: "Generate auth helpers for my k6 tests."

## Assets
- `templates/token-generator.js`: JWT encoding/decoding functions
- `templates/hmac-generator.js`: HMAC-SHA256 and HMAC-SHA512 signature functions