---
name: k6-html-report
description: Adds a custom HTML summary report and text summary output to your k6 test script using the k6-reporter and k6-summary libraries.
argument-hint: "Provide the test file path (e.g., test.js) where the custom summary should be added (optional)."
---

# k6 HTML Report Skill

## Description
This skill helps you add a custom end-of-test summary to a k6 script, producing:

- An HTML report file (`html_summary_concount1.html`)
- A console text summary (stdout)

It follows the official k6 custom summary pattern described here:
https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/

## Workflow
1. **Identify the target script**: Determine which test file should get the custom summary function.
2. **Add imports**: Ensure the script imports `htmlReport` and `textSummary`.
3. **Add `handleSummary`**: Add the `handleSummary(data)` export to write the report and print a summary.
4. **Validate**: Ensure the script runs successfully and produces `html_summary_concount1.html` in the working folder.

## Example
See `examples/custom-summary.js` for a complete example that includes a simple HTTP request and the `handleSummary` function.

## Usage
Ask something like:
- "Add an HTML summary report to my k6 script."
- "Generate a k6 test file with `handleSummary` output."