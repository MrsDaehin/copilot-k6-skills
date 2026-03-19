/**
 * Base URLs for different environments
 * Configure these URLs according to your deployment environments
 */

export const BASE_URLS = {
  // Development environment
  dev: 'https://petstore3.swagger.io/api/v3',

  // Staging environment (configure as needed)
  staging: 'https://petstore-staging.example.com/api/v3',

  // Production environment (configure as needed)
  prod: 'https://petstore-prod.example.com/api/v3'
};

/**
 * Get environment URL based on environment name
 * @param {string} environment - Environment name (dev, staging, prod)
 * @returns {string} Base URL for the environment
 */
export function getEnvironmentUrl(environment = 'dev') {
  const url = BASE_URLS[environment];
  if (!url) {
    throw new Error(`Unknown environment: ${environment}. Available environments: ${Object.keys(BASE_URLS).join(', ')}`);
  }
  return url;
}

/**
 * API endpoints configuration
 */
export const ENDPOINTS = {
  // Pet endpoints
  PET: '/pet',
  PET_BY_ID: '/pet/{petId}',
  PET_FIND_BY_STATUS: '/pet/findByStatus',
  PET_FIND_BY_TAGS: '/pet/findByTags',
  PET_UPLOAD_IMAGE: '/pet/{petId}/uploadImage',

  // Store endpoints
  STORE_INVENTORY: '/store/inventory',
  STORE_ORDER: '/store/order',
  STORE_ORDER_BY_ID: '/store/order/{orderId}',

  // User endpoints
  USER: '/user',
  USER_BY_NAME: '/user/{username}',
  USER_LOGIN: '/user/login',
  USER_LOGOUT: '/user/logout',
  USER_CREATE_WITH_LIST: '/user/createWithList'
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Pet statuses
 */
export const PET_STATUS = {
  AVAILABLE: 'available',
  PENDING: 'pending',
  SOLD: 'sold'
};

/**
 * Order statuses
 */
export const ORDER_STATUS = {
  PLACED: 'placed',
  APPROVED: 'approved',
  DELIVERED: 'delivered'
};