# Petstore.k6.Performance

Performance testing suite for the Swagger Petstore API using k6.

## Overview

This project contains k6 performance tests for the Petstore API (https://petstore3.swagger.io/api/v3/openapi.json). The tests cover all major endpoints including pet management, store operations, and user management.

## API Endpoints Tested

### Pet Operations
- `POST /pet` - Add new pet
- `PUT /pet` - Update existing pet
- `GET /pet/findByStatus` - Find pets by status
- `GET /pet/findByTags` - Find pets by tags
- `GET /pet/{petId}` - Get pet by ID
- `POST /pet/{petId}` - Update pet with form data
- `DELETE /pet/{petId}` - Delete pet
- `POST /pet/{petId}/uploadImage` - Upload pet image

### Store Operations
- `GET /store/inventory` - Get inventory
- `POST /store/order` - Place order
- `GET /store/order/{orderId}` - Get order by ID
- `DELETE /store/order/{orderId}` - Delete order

### User Operations
- `POST /user` - Create user
- `POST /user/createWithList` - Create users with list
- `GET /user/login` - Login user
- `GET /user/logout` - Logout user
- `GET /user/{username}` - Get user by name
- `PUT /user/{username}` - Update user
- `DELETE /user/{username}` - Delete user

## Getting Started

### Prerequisites
- k6 installed (https://k6.io/docs/get-started/installation/)
- Node.js (for data generation tools)

### Environment Setup
1. Clone this repository
2. Install dependencies: `npm install` (if using data generators)
3. Configure environment URLs in `constants/baseurls.js`

### Running Tests

#### Local Execution
```bash
# Run constant load test
make test-constant

# Run ramp-up test
make test-ramp

# Run spike test
make test-spike

# Run soak test
make test-soak

# Run specific workload
k6 run workloads/petManagementTest.js
```

## Load Profiles

### Constant Load (`configs/constants/`)
- `1reqpersecondconf.json` - Basic load testing
- `20reqpersecondconf.json` - Moderate load testing

### Ramp-up Load (`configs/rampings/`)
- Progressive load increase to find breaking points
- Configurable stages with different VU counts

## Test Scenarios

### Individual Endpoint Tests (`tests/`)
Each API endpoint has a dedicated test file with:
- Request construction
- Response validation
- Error handling
- Performance checks

### Combined Workloads (`workloads/`)
Realistic user journey scenarios:
- `petManagementTest.js` - Complete pet lifecycle
- `storeOperationsTest.js` - Order management flow
- `userJourneyTest.js` - User registration and login flow

## Configuration

### Base URLs
Configure API endpoints in `constants/baseurls.js`:
```javascript
export const BASE_URLS = {
  dev: 'https://petstore3.swagger.io/api/v3',
  staging: 'https://petstore-staging.example.com/api/v3',
  prod: 'https://petstore-prod.example.com/api/v3'
};
```

### Authentication
The API uses OAuth2 authentication. Configure credentials in environment variables:
```bash
export PETSTORE_CLIENT_ID="your-client-id"
export PETSTORE_CLIENT_SECRET="your-client-secret"
```

## Data Generation

Use the data generator tools to create test data:
```bash
node tools/dataGenerator/generatePets.js
node tools/dataGenerator/generateUsers.js
node tools/dataGenerator/generateOrders.js
```

## Monitoring & Reporting

### Thresholds
All tests include performance thresholds:
- Response time: p95 < 500ms
- Error rate: < 1%
- HTTP status: 200-299 for success

### Reports
- HTML reports generated automatically
- k6 Cloud integration for detailed analytics
- Custom metrics for business KPIs

## Troubleshooting

### Common Issues
1. **Authentication errors**: Check OAuth2 credentials
2. **Rate limiting**: Reduce VU count or add delays
3. **Data dependencies**: Ensure test data exists before running dependent tests

### Debug Mode
Run tests with verbose output:
```bash
k6 run --verbose workloads/petManagementTest.js
```

## Contributing

1. Add new test scenarios in `workloads/`
2. Update configurations in `configs/`
3. Add data generators in `tools/dataGenerator/`
4. Update this README with new features

## License

This project is licensed under the Apache 2.0 License.