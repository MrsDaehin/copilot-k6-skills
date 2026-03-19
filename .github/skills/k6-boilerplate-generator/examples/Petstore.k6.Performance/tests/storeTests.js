import http from 'k6/http';
import { check } from 'k6';
import { getEnvironmentUrl, ENDPOINTS, HTTP_STATUS } from '../constants/baseurls.js';
import { getAuthenticatedParams } from '../shared/auth.js';
import { generateOrder } from '../shared/dataGenerator.js';

/**
 * Test: Get store inventory
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function getInventory(environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.STORE_INVENTORY}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Get inventory - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Get inventory - response time < 300ms': (r) => r.timings.duration < 300,
    'Get inventory - returns inventory object': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && typeof jsonResponse === 'object';
    }
  });

  return {
    success: result,
    inventory: result ? response.json() : null,
    response: response
  };
}

/**
 * Test: Place an order for a pet
 * @param {number} petId - Pet ID to order (optional)
 * @param {string} environment - Target environment
 * @returns {object} Test result with order data
 */
export function placeOrder(petId = null, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.STORE_ORDER}`;
  const orderData = generateOrder(petId);

  const params = getAuthenticatedParams(environment);

  const response = http.post(url, JSON.stringify(orderData), params);

  const result = check(response, {
    'Place order - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Place order - response time < 500ms': (r) => r.timings.duration < 500,
    'Place order - response contains order data': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.id && jsonResponse.petId;
    }
  });

  return {
    success: result,
    orderId: result ? response.json().id : null,
    response: response
  };
}

/**
 * Test: Get order by ID
 * @param {number} orderId - Order ID to retrieve
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function getOrderById(orderId, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.STORE_ORDER_BY_ID.replace('{orderId}', orderId)}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Get order by ID - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Get order by ID - response time < 300ms': (r) => r.timings.duration < 300,
    'Get order by ID - returns correct order': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.id === orderId;
    }
  });

  return {
    success: result,
    response: response
  };
}

/**
 * Test: Delete order by ID
 * @param {number} orderId - Order ID to delete
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function deleteOrder(orderId, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.STORE_ORDER_BY_ID.replace('{orderId}', orderId)}`;
  const params = getAuthenticatedParams(environment);

  const response = http.del(url, null, params);

  const result = check(response, {
    'Delete order - status is 200 or 404': (r) => [HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND].includes(r.status),
    'Delete order - response time < 500ms': (r) => r.timings.duration < 500
  });

  return {
    success: result,
    response: response
  };
}