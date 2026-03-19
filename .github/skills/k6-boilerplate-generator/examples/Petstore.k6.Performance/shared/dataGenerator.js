/**
 * Test data generation utilities for Petstore API
 */

import { randomIntBetween, randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

/**
 * Generate a random pet object
 * @param {object} overrides - Properties to override in the generated pet
 * @returns {object} Pet object
 */
export function generatePet(overrides = {}) {
  const categories = [
    { id: 1, name: 'Dogs' },
    { id: 2, name: 'Cats' },
    { id: 3, name: 'Birds' },
    { id: 4, name: 'Fish' }
  ];

  const tags = [
    { id: 1, name: 'friendly' },
    { id: 2, name: 'playful' },
    { id: 3, name: 'lazy' },
    { id: 4, name: 'energetic' }
  ];

  const petNames = ['Buddy', 'Max', 'Bella', 'Charlie', 'Lucy', 'Daisy', 'Bailey', 'Sadie', 'Molly', 'Maggie'];

  const basePet = {
    id: randomIntBetween(1000, 999999),
    name: randomItem(petNames),
    category: randomItem(categories),
    photoUrls: [
      `https://example.com/photos/${randomString(10)}.jpg`,
      `https://example.com/photos/${randomString(10)}.jpg`
    ],
    tags: [randomItem(tags)],
    status: randomItem(['available', 'pending', 'sold'])
  };

  return { ...basePet, ...overrides };
}

/**
 * Generate a random user object
 * @param {object} overrides - Properties to override in the generated user
 * @returns {object} User object
 */
export function generateUser(overrides = {}) {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  const baseUser = {
    id: randomIntBetween(1000, 999999),
    username: `${randomItem(firstNames).toLowerCase()}${randomItem(lastNames).toLowerCase()}${randomIntBetween(1, 999)}`,
    firstName: randomItem(firstNames),
    lastName: randomItem(lastNames),
    email: `${randomString(8)}@example.com`,
    password: randomString(12),
    phone: `+1-${randomIntBetween(100, 999)}-${randomIntBetween(100, 999)}-${randomIntBetween(1000, 9999)}`,
    userStatus: randomIntBetween(0, 2)
  };

  return { ...baseUser, ...overrides };
}

/**
 * Generate a random order object
 * @param {number} petId - Pet ID for the order (optional)
 * @param {object} overrides - Properties to override in the generated order
 * @returns {object} Order object
 */
export function generateOrder(petId = null, overrides = {}) {
  const baseOrder = {
    id: randomIntBetween(1, 10000),
    petId: petId || randomIntBetween(1000, 999999),
    quantity: randomIntBetween(1, 10),
    shipDate: new Date(Date.now() + randomIntBetween(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    status: randomItem(['placed', 'approved', 'delivered']),
    complete: randomItem([true, false])
  };

  return { ...baseOrder, ...overrides };
}

/**
 * Generate multiple pets
 * @param {number} count - Number of pets to generate
 * @returns {Array} Array of pet objects
 */
export function generatePets(count = 10) {
  return Array.from({ length: count }, () => generatePet());
}

/**
 * Generate multiple users
 * @param {number} count - Number of users to generate
 * @returns {Array} Array of user objects
 */
export function generateUsers(count = 10) {
  return Array.from({ length: count }, () => generateUser());
}

/**
 * Generate multiple orders
 * @param {number} count - Number of orders to generate
 * @param {Array} petIds - Array of pet IDs to use for orders
 * @returns {Array} Array of order objects
 */
export function generateOrders(count = 10, petIds = []) {
  return Array.from({ length: count }, () => {
    const petId = petIds.length > 0 ? randomItem(petIds) : null;
    return generateOrder(petId);
  });
}

/**
 * Generate test data for a complete user journey
 * @returns {object} Complete test data set
 */
export function generateTestDataSet() {
  const users = generateUsers(5);
  const pets = generatePets(20);
  const petIds = pets.map(pet => pet.id);
  const orders = generateOrders(15, petIds);

  return {
    users,
    pets,
    orders
  };
}