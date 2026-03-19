import { check } from 'k6';
import http from 'k6/http';
import { group } from 'k6';
import { addPet, getPetById, findPetsByStatus, updatePetWithForm, deletePet } from '../tests/petTests.js';
import { PET_STATUS } from '../constants/baseurls.js';

/**
 * Pet Management Test Scenario
 * Tests the complete lifecycle of pet management operations
 */

const ENVIRONMENT = __ENV.ENVIRONMENT || 'dev';

export let options = {
  scenarios: {
    pet_management_scenario: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 5 },
        { duration: '30s', target: 1 }
      ],
      preAllocatedVUs: 5,
      maxVUs: 50
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
    'http_req_duration{operation:add_pet}': ['p(95)<800'],
    'http_req_duration{operation:get_pet}': ['p(95)<500'],
    'http_req_duration{operation:find_pets}': ['p(95)<600']
  }
};

// Shared variables across VUs
let createdPetIds = [];
let testIteration = 0;

export function setup() {
  console.log(`Setting up pet management test for environment: ${ENVIRONMENT}`);

  // Pre-create some pets for testing
  const initialPets = [];
  for (let i = 0; i < 5; i++) {
    const result = addPet(ENVIRONMENT);
    if (result.success) {
      initialPets.push(result.petId);
    }
  }

  console.log(`Pre-created ${initialPets.length} pets for testing`);
  return { initialPets };
}

export default function (data) {
  testIteration++;

  group('Pet Management Workflow', function () {
    // Step 1: Add a new pet
    const addResult = addPet(ENVIRONMENT);
    if (addResult.success) {
      createdPetIds.push(addResult.petId);

      // Step 2: Get the pet we just created
      getPetById(addResult.petId, ENVIRONMENT);

      // Step 3: Update the pet
      updatePetWithForm(addResult.petId, `UpdatedPet${testIteration}`, PET_STATUS.SOLD, ENVIRONMENT);

      // Step 4: Find pets by status
      findPetsByStatus(PET_STATUS.AVAILABLE, ENVIRONMENT);

      // Step 5: Clean up - delete the pet (only occasionally to avoid too many deletions)
      if (Math.random() < 0.3 && createdPetIds.length > 3) {
        const petToDelete = createdPetIds.shift();
        deletePet(petToDelete, ENVIRONMENT);
      }
    }

    // Step 6: Always test finding pets (read operation)
    findPetsByStatus(PET_STATUS.AVAILABLE, ENVIRONMENT);
  });
}

export function teardown(data) {
  console.log(`Tearing down pet management test. Created ${createdPetIds.length} pets during test`);

  // Clean up any remaining pets created during the test
  createdPetIds.forEach(petId => {
    try {
      deletePet(petId, ENVIRONMENT);
    } catch (error) {
      console.warn(`Failed to delete pet ${petId}:`, error.message);
    }
  });

  console.log('Pet management test teardown complete');
}