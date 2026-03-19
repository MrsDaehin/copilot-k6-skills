#!/usr/bin/env node

/**
 * User data generator for Petstore API
 * Generates test data for user-related operations
 */

const fs = require('fs');
const path = require('path');

// Simple random utilities
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Data generators
function generateUser(overrides = {}) {
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

function generateUsers(count = 100) {
  console.log(`Generating ${count} users...`);
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateUser());
  }
  return users;
}

// Main execution
function main() {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 100;
  const outputDir = path.join(__dirname, '..', '..', 'test-data');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const users = generateUsers(count);

  // Write to JSON file
  const outputFile = path.join(outputDir, 'users.json');
  fs.writeFileSync(outputFile, JSON.stringify(users, null, 2));

  console.log(`Generated ${count} users and saved to ${outputFile}`);

  // Also create a smaller sample file
  const sampleUsers = users.slice(0, 10);
  const sampleFile = path.join(outputDir, 'users-sample.json');
  fs.writeFileSync(sampleFile, JSON.stringify(sampleUsers, null, 2));

  console.log(`Created sample file with 10 users: ${sampleFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { generateUser, generateUsers };