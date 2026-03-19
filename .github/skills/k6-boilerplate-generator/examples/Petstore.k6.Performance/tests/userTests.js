import http from 'k6/http';
import { check } from 'k6';
import { getEnvironmentUrl, ENDPOINTS, HTTP_STATUS } from '../constants/baseurls.js';
import { getAuthenticatedParams } from '../shared/auth.js';
import { generateUser } from '../shared/dataGenerator.js';

/**
 * Test: Create user
 * @param {object} userData - User data (optional, will generate if not provided)
 * @param {string} environment - Target environment
 * @returns {object} Test result with user data
 */
export function createUser(userData = null, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.USER}`;
  const data = userData || generateUser();

  const params = getAuthenticatedParams(environment);

  const response = http.post(url, JSON.stringify(data), params);

  const result = check(response, {
    'Create user - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Create user - response time < 500ms': (r) => r.timings.duration < 500,
    'Create user - response contains user data': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.username;
    }
  });

  return {
    success: result,
    username: result ? response.json().username : null,
    response: response
  };
}

/**
 * Test: Get user by username
 * @param {string} username - Username to retrieve
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function getUserByName(username, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.USER_BY_NAME.replace('{username}', username)}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Get user by name - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Get user by name - response time < 300ms': (r) => r.timings.duration < 300,
    'Get user by name - returns correct user': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.username === username;
    }
  });

  return {
    success: result,
    response: response
  };
}

/**
 * Test: Update user
 * @param {string} username - Username to update
 * @param {object} updateData - Updated user data
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function updateUser(username, updateData, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.USER_BY_NAME.replace('{username}', username)}`;

  const params = getAuthenticatedParams(environment);

  const response = http.put(url, JSON.stringify(updateData), params);

  const result = check(response, {
    'Update user - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Update user - response time < 500ms': (r) => r.timings.duration < 500,
    'Update user - returns updated user': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.username === username;
    }
  });

  return {
    success: result,
    response: response
  };
}

/**
 * Test: Delete user
 * @param {string} username - Username to delete
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function deleteUser(username, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.USER_BY_NAME.replace('{username}', username)}`;
  const params = getAuthenticatedParams(environment);

  const response = http.del(url, null, params);

  const result = check(response, {
    'Delete user - status is 200 or 404': (r) => [HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND].includes(r.status),
    'Delete user - response time < 500ms': (r) => r.timings.duration < 500
  });

  return {
    success: result,
    response: response
  };
}

/**
 * Test: Login user
 * @param {string} username - Username for login
 * @param {string} password - Password for login
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function loginUser(username, password, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.USER_LOGIN}?username=${username}&password=${password}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Login user - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Login user - response time < 500ms': (r) => r.timings.duration < 500,
    'Login user - returns session info': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && typeof jsonResponse === 'string';
    }
  });

  return {
    success: result,
    sessionInfo: result ? response.json() : null,
    response: response
  };
}

/**
 * Test: Logout user
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function logoutUser(environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.USER_LOGOUT}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Logout user - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Logout user - response time < 300ms': (r) => r.timings.duration < 300
  });

  return {
    success: result,
    response: response
  };
}