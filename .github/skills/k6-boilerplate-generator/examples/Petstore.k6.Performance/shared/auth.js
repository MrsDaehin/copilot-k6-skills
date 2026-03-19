/**
 * OAuth2 Authentication Helper for Petstore API
 * Handles token acquisition and refresh for OAuth2 flows
 */

import http from 'k6/http';
import { check } from 'k6';
import { getEnvironmentUrl } from '../constants/baseurls.js';

/**
 * OAuth2 token cache to avoid repeated token requests
 */
let tokenCache = {
  access_token: null,
  expires_at: null,
  token_type: 'Bearer'
};

/**
 * Get OAuth2 access token
 * @param {string} environment - Target environment
 * @returns {string} Access token
 */
export function getAccessToken(environment = 'dev') {
  const now = new Date().getTime();

  // Return cached token if still valid (with 5 minute buffer)
  if (tokenCache.access_token && tokenCache.expires_at && (tokenCache.expires_at - now) > 300000) {
    return tokenCache.access_token;
  }

  // Get OAuth2 credentials from environment variables
  const clientId = __ENV.PETSTORE_CLIENT_ID;
  const clientSecret = __ENV.PETSTORE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PETSTORE_CLIENT_ID and PETSTORE_CLIENT_SECRET environment variables are required');
  }

  // OAuth2 token endpoint (this would need to be configured based on your OAuth provider)
  const tokenUrl = `${getEnvironmentUrl(environment)}/oauth/token`;

  const payload = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'read:pets write:pets'
  };

  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const response = http.post(tokenUrl, payload, params);

  const result = check(response, {
    'OAuth2 token request successful': (r) => r.status === 200,
    'Token response contains access_token': (r) => r.json().access_token !== undefined,
  });

  if (!result) {
    console.error(`OAuth2 token request failed: ${response.status} ${response.body}`);
    throw new Error('Failed to obtain OAuth2 access token');
  }

  const tokenData = response.json();

  // Cache the token
  tokenCache.access_token = tokenData.access_token;
  tokenCache.token_type = tokenData.token_type || 'Bearer';

  // Calculate expiration time (default to 1 hour if not specified)
  const expiresIn = tokenData.expires_in || 3600;
  tokenCache.expires_at = now + (expiresIn * 1000);

  return tokenCache.access_token;
}

/**
 * Get authorization header for API requests
 * @param {string} environment - Target environment
 * @returns {object} Headers object with authorization
 */
export function getAuthHeaders(environment = 'dev') {
  const token = getAccessToken(environment);
  return {
    'Authorization': `${tokenCache.token_type} ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Create authenticated request parameters
 * @param {string} environment - Target environment
 * @param {object} additionalHeaders - Additional headers to include
 * @returns {object} Request parameters with authentication
 */
export function getAuthenticatedParams(environment = 'dev', additionalHeaders = {}) {
  const authHeaders = getAuthHeaders(environment);
  return {
    headers: {
      ...authHeaders,
      ...additionalHeaders
    }
  };
}

/**
 * API Key authentication (alternative to OAuth2)
 * @param {string} apiKey - API key value
 * @returns {object} Headers object with API key
 */
export function getApiKeyHeaders(apiKey) {
  return {
    'api_key': apiKey,
    'Content-Type': 'application/json'
  };
}