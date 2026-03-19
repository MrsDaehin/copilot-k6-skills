import { check } from 'k6';
import http from 'k6/http';
import { group } from 'k6';
import { getInventory, placeOrder, getOrderById, deleteOrder } from '../tests/storeTests.js';

/**
 * Store Operations Test Scenario
 * Tests store inventory and order management operations
 */

const ENVIRONMENT = __ENV.ENVIRONMENT || 'dev';

export let options = {
  scenarios: {
    store_operations_scenario: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 3,
      maxVUs: 20
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.1'],
    'http_req_duration{operation:get_inventory}': ['p(95)<400'],
    'http_req_duration{operation:place_order}': ['p(95)<600'],
    'http_req_duration{operation:get_order}': ['p(95)<400']
  }
};

// Shared variables across VUs
let createdOrderIds = [];
let testIteration = 0;

export function setup() {
  console.log(`Setting up store operations test for environment: ${ENVIRONMENT}`);

  // Test initial inventory
  const inventoryResult = getInventory(ENVIRONMENT);
  if (inventoryResult.success) {
    console.log(`Initial inventory loaded with ${Object.keys(inventoryResult.inventory || {}).length} status categories`);
  }

  return {};
}

export default function (data) {
  testIteration++;

  group('Store Operations Workflow', function () {
    // Step 1: Check inventory (read operation - should be fast)
    const inventoryResult = getInventory(ENVIRONMENT);

    // Step 2: Place a new order
    const orderResult = placeOrder(null, ENVIRONMENT);
    if (orderResult.success) {
      createdOrderIds.push(orderResult.orderId);

      // Step 3: Get the order we just created
      getOrderById(orderResult.orderId, ENVIRONMENT);

      // Step 4: Occasionally delete old orders to avoid accumulation
      if (Math.random() < 0.2 && createdOrderIds.length > 5) {
        const orderToDelete = createdOrderIds.shift();
        deleteOrder(orderToDelete, ENVIRONMENT);
      }
    }

    // Step 5: Always check inventory again (read operation)
    getInventory(ENVIRONMENT);
  });
}

export function teardown(data) {
  console.log(`Tearing down store operations test. Created ${createdOrderIds.length} orders during test`);

  // Clean up any remaining orders created during the test
  createdOrderIds.forEach(orderId => {
    try {
      deleteOrder(orderId, ENVIRONMENT);
    } catch (error) {
      console.warn(`Failed to delete order ${orderId}:`, error.message);
    }
  });

  console.log('Store operations test teardown complete');
}