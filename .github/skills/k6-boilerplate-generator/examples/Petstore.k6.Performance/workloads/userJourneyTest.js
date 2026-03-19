import { check } from 'k6';
import http from 'k6/http';
import { group, sleep } from 'k6';
import { createUser, getUserByName, updateUser, deleteUser, loginUser, logoutUser } from '../tests/userTests.js';
import { generateUser } from '../shared/dataGenerator.js';

/**
 * User Journey Test Scenario
 * Tests complete user lifecycle: registration, login, profile management, logout
 */

const ENVIRONMENT = __ENV.ENVIRONMENT || 'dev';

export let options = {
  scenarios: {
    user_journey_scenario: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 3 },
        { duration: '1m', target: 8 },
        { duration: '1m', target: 15 },
        { duration: '30s', target: 3 },
        { duration: '30s', target: 1 }
      ],
      preAllocatedVUs: 3,
      maxVUs: 30
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
    'http_req_duration{operation:create_user}': ['p(95)<800'],
    'http_req_duration{operation:login}': ['p(95)<600'],
    'http_req_duration{operation:get_user}': ['p(95)<400']
  }
};

// Shared variables across VUs
let createdUsernames = [];
let testIteration = 0;

export function setup() {
  console.log(`Setting up user journey test for environment: ${ENVIRONMENT}`);
  return {};
}

export default function (data) {
  testIteration++;

  group('User Journey Workflow', function () {
    let currentUsername = null;

    // Step 1: User Registration
    const userData = generateUser();
    const createResult = createUser(userData, ENVIRONMENT);

    if (createResult.success) {
      currentUsername = createResult.username;
      createdUsernames.push(currentUsername);

      // Small delay to simulate user thinking time
      sleep(Math.random() * 2 + 0.5);

      // Step 2: User Login
      const loginResult = loginUser(userData.username, userData.password, ENVIRONMENT);

      // Small delay
      sleep(Math.random() * 1 + 0.5);

      // Step 3: Get User Profile
      if (currentUsername) {
        getUserByName(currentUsername, ENVIRONMENT);
      }

      // Small delay
      sleep(Math.random() * 1 + 0.5);

      // Step 4: Update User Profile (occasionally)
      if (Math.random() < 0.4 && currentUsername) {
        const updateData = {
          firstName: `Updated${userData.firstName}`,
          email: `updated.${userData.email}`
        };
        updateUser(currentUsername, updateData, ENVIRONMENT);
      }

      // Small delay
      sleep(Math.random() * 1 + 0.5);

      // Step 5: User Logout
      logoutUser(ENVIRONMENT);

      // Step 6: Clean up - delete user (only occasionally to maintain some test data)
      if (Math.random() < 0.3 && createdUsernames.length > 3) {
        const userToDelete = createdUsernames.shift();
        deleteUser(userToDelete, ENVIRONMENT);
      }
    }

    // Step 7: Anonymous user operations (get user by name without auth)
    // This tests public profile viewing
    if (createdUsernames.length > 0) {
      const randomUsername = createdUsernames[Math.floor(Math.random() * createdUsernames.length)];
      getUserByName(randomUsername, ENVIRONMENT);
    }
  });
}

export function teardown(data) {
  console.log(`Tearing down user journey test. Created ${createdUsernames.length} users during test`);

  // Clean up any remaining users created during the test
  createdUsernames.forEach(username => {
    try {
      deleteUser(username, ENVIRONMENT);
    } catch (error) {
      console.warn(`Failed to delete user ${username}:`, error.message);
    }
  });

  console.log('User journey test teardown complete');
}