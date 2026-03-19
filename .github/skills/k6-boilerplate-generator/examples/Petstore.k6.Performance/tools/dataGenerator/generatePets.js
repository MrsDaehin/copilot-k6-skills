#!/usr/bin/env node

/**
 * Pet data generator for Petstore API
 * Generates test data for pet-related operations
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
function generatePet(overrides = {}) {
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

function generatePets(count = 100) {
  console.log(`Generating ${count} pets...`);
  const pets = [];
  for (let i = 0; i < count; i++) {
    pets.push(generatePet());
  }
  return pets;
}

// Main execution
function main() {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 100;
  const outputDir = path.join(__dirname, '..', 'test-data');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pets = generatePets(count);

  // Write to JSON file
  const outputFile = path.join(outputDir, 'pets.json');
  fs.writeFileSync(outputFile, JSON.stringify(pets, null, 2));

  console.log(`Generated ${count} pets and saved to ${outputFile}`);

  // Also create a smaller sample file
  const samplePets = pets.slice(0, 10);
  const sampleFile = path.join(outputDir, 'pets-sample.json');
  fs.writeFileSync(sampleFile, JSON.stringify(samplePets, null, 2));

  console.log(`Created sample file with 10 pets: ${sampleFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { generatePet, generatePets };