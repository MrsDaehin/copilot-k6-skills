---
name: k6-config-generator
description: Generates a JSON configuration file for k6 performance tests based on the specified test type, including standard thresholds for request duration and failure rate.
argument-hint: "Please specify the type of performance test (Load, Stress, Spike, Soak) and the request duration threshold (optional, default p(95)<500ms)."
---

# k6 Config Generator Skill

## Description
This skill automates the creation of k6 configuration files in JSON format for different types of performance tests (Load, Stress, Spike, Soak). It allows user input for the request duration threshold and sets a standard failure rate of rate<0.1, following project standards.

## Workflow
1. **Determine Test Type**: If not specified, ask the user for the test type (Load, Stress, Spike, or Soak).
2. **Define Scenario**: Based on the test type, configure the appropriate k6 executor and stages:
   - **Load**: Steady load with ramping-arrival-rate.
   - **Stress**: Gradual increase to find breaking point.
   - **Spike**: Sudden high load bursts.
   - **Soak**: Prolonged steady load.
3. **Add Thresholds**: Ask the user for the request duration threshold (default p(95)<500ms if not specified), and set failure rate to rate<0.1.
4. **Generate JSON**: Create the config file in the `configs/` folder with the naming convention `<type_of_test>.json` (e.g., `stress.json` for a Stress Test).
5. **Validate**: Ensure the JSON is valid and follows k6 syntax.

## Usage
Invoke this skill when the user requests a k6 config file. Example prompt: "Create a config.json for a Stress Test."

## Assets
- Template JSON structures for each test type.
- Standard failure rate threshold: rate<0.1.
- Customizable duration threshold via user input.