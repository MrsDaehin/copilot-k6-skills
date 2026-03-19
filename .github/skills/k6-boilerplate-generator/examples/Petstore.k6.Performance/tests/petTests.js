import http from 'k6/http';
import { check, group } from 'k6';
import { getEnvironmentUrl, ENDPOINTS, HTTP_STATUS, PET_STATUS } from '../constants/baseurls.js';
import { getAuthenticatedParams } from '../shared/auth.js';
import { generatePet } from '../shared/dataGenerator.js';

/**
 * Test: Add a new pet to the store
 * @param {string} environment - Target environment
 * @returns {object} Test result with pet data
 */
export function addPet(environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.PET}`;
  const petData = generatePet();

  const params = getAuthenticatedParams(environment);

  const response = http.post(url, JSON.stringify(petData), params);

  const result = check(response, {
    'Add pet - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Add pet - response time < 500ms': (r) => r.timings.duration < 500,
    'Add pet - response contains pet data': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.id && jsonResponse.name;
    }
  });

  return {
    success: result,
    petId: result ? response.json().id : null,
    response: response
  };
}

/**
 * Test: Get pet by ID
 * @param {number} petId - Pet ID to retrieve
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function getPetById(petId, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.PET_BY_ID.replace('{petId}', petId)}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Get pet by ID - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Get pet by ID - response time < 300ms': (r) => r.timings.duration < 300,
    'Get pet by ID - returns correct pet': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.id === petId;
    }
  });

  return {
    success: result,
    response: response
  };
}

/**
 * Test: Find pets by status
 * @param {string} status - Pet status to search for
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function findPetsByStatus(status = PET_STATUS.AVAILABLE, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.PET_FIND_BY_STATUS}?status=${status}`;
  const params = getAuthenticatedParams(environment);

  const response = http.get(url, params);

  const result = check(response, {
    'Find pets by status - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Find pets by status - response time < 500ms': (r) => r.timings.duration < 500,
    'Find pets by status - returns array': (r) => Array.isArray(r.json()),
    'Find pets by status - all pets have correct status': (r) => {
      const pets = r.json();
      return Array.isArray(pets) && pets.every(pet => pet.status === status);
    }
  });

  return {
    success: result,
    petCount: result ? response.json().length : 0,
    response: response
  };
}

/**
 * Test: Update pet with form data
 * @param {number} petId - Pet ID to update
 * @param {string} name - New pet name
 * @param {string} status - New pet status
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function updatePetWithForm(petId, name, status, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.PET_BY_ID.replace('{petId}', petId)}`;

  const formData = {
    name: name,
    status: status
  };

  const params = getAuthenticatedParams(environment, {
    'Content-Type': 'application/x-www-form-urlencoded'
  });

  const response = http.post(url, formData, params);

  const result = check(response, {
    'Update pet with form - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Update pet with form - response time < 500ms': (r) => r.timings.duration < 500,
    'Update pet with form - returns updated pet': (r) => {
      const jsonResponse = r.json();
      return jsonResponse && jsonResponse.id === petId;
    }
  });

  return {
    success: result,
    response: response
  };
}

/**
 * Test: Delete pet
 * @param {number} petId - Pet ID to delete
 * @param {string} environment - Target environment
 * @returns {object} Test result
 */
export function deletePet(petId, environment = 'dev') {
  const url = `${getEnvironmentUrl(environment)}${ENDPOINTS.PET_BY_ID.replace('{petId}', petId)}`;
  const params = getAuthenticatedParams(environment);

  const response = http.del(url, null, params);

  const result = check(response, {
    'Delete pet - status is 200': (r) => r.status === HTTP_STATUS.OK,
    'Delete pet - response time < 500ms': (r) => r.timings.duration < 500
  });

  return {
    success: result,
    response: response
  };
}