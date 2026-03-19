# Petstore Performance Tests Makefile

.PHONY: help test-local test-constant test-ramp test-spike test-soak report clean

# Default target
help:
	@echo "Petstore k6 Performance Tests"
	@echo ""
	@echo "Available targets:"
	@echo "  test-local      - Run tests locally without external services"
	@echo "  test-constant   - Run constant load tests"
	@echo "  test-ramp       - Run ramp-up load tests"
	@echo "  test-spike      - Run spike load tests"
	@echo "  test-soak       - Run soak/endurance tests"
	@echo "  report          - Generate HTML performance report"
	@echo "  clean           - Clean up generated files"
	@echo ""
	@echo "Environment variables:"
	@echo "  ENVIRONMENT    - Target environment (dev/staging/prod) [default: dev]"
	@echo "  K6_CLOUD_TOKEN - k6 Cloud token for cloud execution"

# Environment configuration
ENVIRONMENT ?= dev
K6_OPTIONS ?= --tag environment=$(ENVIRONMENT)

# Local test execution (no external dependencies)
test-local:
	k6 run $(K6_OPTIONS) workloads/petManagementTest.js

# Constant load tests
test-constant:
	k6 run $(K6_OPTIONS) --config configs/constants/1reqpersecondconf.json workloads/petManagementTest.js
	k6 run $(K6_OPTIONS) --config configs/constants/20reqpersecondconf.json workloads/storeOperationsTest.js

# Ramp-up load tests
test-ramp:
	k6 run $(K6_OPTIONS) --config configs/rampings/ramp-up-test.json workloads/petManagementTest.js
	k6 run $(K6_OPTIONS) --config configs/rampings/ramp-up-test.json workloads/userJourneyTest.js

# Spike load tests
test-spike:
	k6 run $(K6_OPTIONS) --config configs/rampings/spike-test.json workloads/petManagementTest.js

# Soak/endurance tests
test-soak:
	k6 run $(K6_OPTIONS) --config configs/rampings/soak-test.json workloads/storeOperationsTest.js

# Generate HTML report
report:
	k6 run --out json=results.json workloads/petManagementTest.js
	k6 run --out json=results.json workloads/storeOperationsTest.js
	k6 run --out json=results.json workloads/userJourneyTest.js
	k6-html-report -o report.html results.json

# Clean up generated files
clean:
	rm -f results.json report.html
	rm -rf reports/

# Cloud execution (requires K6_CLOUD_TOKEN)
cloud-test:
	@if [ -z "$(K6_CLOUD_TOKEN)" ]; then \
		echo "Error: K6_CLOUD_TOKEN environment variable is required for cloud execution"; \
		exit 1; \
	fi
	k6 cloud $(K6_OPTIONS) --config configs/constants/20reqpersecondconf.json workloads/petManagementTest.js

# Data generation
generate-test-data:
	node tools/dataGenerator/generatePets.js
	node tools/dataGenerator/generateUsers.js
	node tools/dataGenerator/generateOrders.js

# Setup development environment
setup:
	npm install
	@echo "Setup complete. Run 'make generate-test-data' to create test data."

# Run all tests sequentially
test-all: test-constant test-ramp test-spike test-soak