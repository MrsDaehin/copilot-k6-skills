# k6 Boilerplate Generator Skill

## Description

Generates a complete k6 performance test project boilerplate from an OpenAPI specification. This skill creates a production-ready folder structure with all necessary configuration files, test templates, shared utilities, and data generation tools.

## Primary Outputs

Generates a complete project structure like:
```
ProjectName.k6.Performance/
├── README.md
├── Makefile
├── configs/
│   ├── constants/
│   │   └── [load-profiles].json
│   └── rampings/
│       └── [load-profiles].json
├── constants/
│   └── baseurls.js
├── shared/
│   ├── token-generator.js
│   ├── hmacGenerator.js
│   ├── compressor.js
│   └── [utilities].js
├── tests/
│   └── [endpoint-test].js
├── tools/
│   └── dataGenerator/
│       └── [generators].js
└── workloads/
    └── [scenario-test].js
```

## Workflow

### 1. **Gather Requirements**
   - **OpenAPI spec source**: File path, URL, or paste spec
   - **Project name**: Used for folder and file naming
   - **Base URLs**: API endpoints (dev, staging, prod)
   - **Authentication type**: None, Bearer token, HMAC, JWT, API Key
   - **Load profiles**: Define scenarios (constant load, ramp-up, spike, soak)
   - **Target endpoints**: Specific operations to test or all endpoints

### 2. **Parse OpenAPI Specification**
   - Extract all endpoints from the spec
   - Identify HTTP methods, parameters, request/response schemas
   - Group endpoints by tags/resources
   - Extract authentication requirements
   - Note required headers and content types
   - Identify data models for payload generation

### 3. **Generate Project Folder Structure**
   Create directories:
   - `configs/constants/` — for constant load configurations
   - `configs/rampings/` — for progressive load configurations
   - `constants/` — for base URLs and global constants
   - `shared/` — for authentication and utility functions
   - `tests/` — for individual endpoint test modules
   - `tools/dataGenerator/` — for test data generation
   - `workloads/` — for combined scenario tests
   - `pipelines/` — for CI/CD integration

### 4. **Create Configuration Files**

   **Load Profile Configurations** (`configs/*/`):
   - Constant load: `1reqpersecondconf.json`, `20reqpersecondconf.json`
   - Ramp-up: progressive load configurations
   - Include thresholds for p95, p99, error rates

   **Base URLs** (`constants/baseurls.js`):
   ```javascript
   export const BASE_URLS = {
     dev: 'https://dev.api.example.com',
     staging: 'https://staging.api.example.com',
     prod: 'https://api.example.com'
   };
   ```

### 5. **Generate Authentication Utilities** (`shared/`)

   Based on authentication type:
   - **Bearer Token**: `token-generator.js`
   - **HMAC**: `hmacGenerator.js`
   - **JWT**: Token generation with signing
   - **API Key**: Header injection utilities
   - Create helper functions for each

### 6. **Generate Test Templates** (`tests/`)

   For each endpoint:
   - Create `[endpoint-name].js` test file
   - Include HTTP method, URL construction, headers
   - Template for request body based on OpenAPI schema
   - Response validation checks
   - Error handling scenarios
   - Example: `getachievements.js`, `patchvisualize.js`

### 7. **Create Test Workloads** (`workloads/`)

   Define combined scenarios:
   - **Single endpoint test**: Basic load on individual endpoint
   - **Combined interaction test**: Multi-endpoint user journey
   - **Real-world workflow**: Realistic user behavior sequence
   - Include `setup()`, `teardown()`, and `default()` functions
   - Example: `userInteractionTest.js`, `utmIngestionTest.js`

### 8. **Generate Shared Utilities** (`shared/`)

   Create helper functions:
   - Data compression/decompression (pako.js)
   - URL encoding utilities (btoa.js, atob.js)
   - Request builders with common headers
   - Response validators
   - Error handlers

### 9. **Create Data Generator Tools** (`tools/dataGenerator/`)

   Generate realistic test data:
   - Random user data generators
   - Payload builders matching OpenAPI schemas
   - Edge case data for boundary testing
   - Load data files for bulk operations

### 10. **Generate Makefile**

   Common commands:
   ```makefile
   make test-local          # Run tests locally
   make test-constant       # Run constant load test
   make test-ramp          # Run ramp-up test
   make test-spike         # Run spike test
   make test-soak          # Run soak test
   make report             # Generate HTML report
   ```

### 11. **Create README Documentation**

   Include:
   - Project overview and purpose
   - API reference
   - How to run tests locally
   - Load profile descriptions
   - Configuration guide
   - Result interpretation
   - Troubleshooting

## Prompts to Invoke This Skill

- *"Generate a k6 boilerplate from this OpenAPI spec: [paste-spec]"*
- *"Create a k6 performance test project for [api-name] with JWT authentication"*
- *"Build k6 project structure from [url-to-openapi-spec]"*
- *"Generate k6 tests for [endpoint-list] with HMAC signing"*

## Related Skills

- **k6-config-generator**: Fine-tune load profile configurations
- **k6-auth-generators**: Advanced authentication setups
- **k6-html-report**: Add custom reporting to generated tests
- **k6-documentation**: Reference for k6 capabilities while building tests

## Key Decisions During Generation

1. **Endpoint Selection**: All endpoints vs. critical path only
2. **Load Profiles**: Which scenarios to include (constant, ramp, spike, soak)
3. **Test Data**: Real data vs. synthetic/random data
4. **Authentication Flow**: How to handle tokens/credentials
5. **Reporting**: Which metrics to track and thresholds

## Quality Checklist

- [ ] All OpenAPI endpoints have corresponding test modules
- [ ] Authentication setup matches API requirements
- [ ] Configuration files have realistic thresholds
- [ ] Data generators produce valid payloads
- [ ] Workloads represent realistic user flows
- [ ] Makefile targets are functional
- [ ] README is complete with examples
- [ ] Error scenarios are tested
