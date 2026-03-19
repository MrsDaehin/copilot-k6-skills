---
name: k6-documentation
description: Guides the user through common k6 topics using the official Grafana k6 documentation and example patterns.
argument-hint: "Ask a question about k6 usage, APIs, or examples and get pointers to the official documentation."
---

# k6 Documentation Skill

## Description
This skill helps users navigate and apply the official Grafana k6 documentation for writing and running load tests. It provides direct guidance and references for:

- k6 core concepts (scenarios, thresholds, executors)
- k6 JavaScript APIs (http, check, sleep, group, etc.)
- k6 examples and best practices

## Sources
- https://grafana.com/docs/k6/latest/
- https://grafana.com/docs/k6/latest/javascript-api/k6-http/
- https://grafana.com/docs/k6/latest/examples/

## Workflow
1. **Understand the question**: Determine what part of k6 the user needs help with (e.g., scripting HTTP requests, setting thresholds, running in CI).
2. **Map to documentation**: Point to the exact section(s) in the Grafana k6 documentation and optionally provide a short, practical snippet.
3. **Provide next steps**: Suggest concrete actions (e.g., “Use `http.get()` in a default function”, or “Define a `thresholds` object in your options”).

## Examples
This skill includes a small set of example k6 scripts (mirroring the official examples) to help you get started quickly.

- `examples/get-started-with-k6.js`
- `examples/single-request.js`
- `examples/http-authentication.js`
- `examples/data-parameterization.js`

## Usage
Ask anything like:
- "How do I set a custom metric in k6?"
- "What is the difference between `ramping-arrival-rate` and `constant-vus`?"
- "Show me an example of `k6/http` POST request with JSON body."