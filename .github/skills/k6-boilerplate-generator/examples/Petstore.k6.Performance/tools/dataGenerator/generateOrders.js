#!/usr/bin/env node

/**
 * Order data generator for Petstore API
 * Generates test data for store order operations
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

// Data generators
function generateOrder(petId = null, overrides = {}) {
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

function generateOrders(count = 100, petIds = []) {
  console.log(`Generating ${count} orders...`);
  const orders = [];
  for (let i = 0; i < count; i++) {
    const petId = petIds.length > 0 ? randomItem(petIds) : null;
    orders.push(generateOrder(petId));
  }
  return orders;
}

// Load pet IDs from existing data if available
function loadPetIds() {
  try {
    const petsFile = path.join(__dirname, '..', '..', 'test-data', 'pets.json');
    if (fs.existsSync(petsFile)) {
      const pets = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
      return pets.map(pet => pet.id);
    }
  } catch (error) {
    console.warn('Could not load pet IDs from pets.json:', error.message);
  }
  return [];
}

// Main execution
function main() {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 100;
  const outputDir = path.join(__dirname, '..', '..', 'test-data');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Try to load pet IDs from existing data
  const petIds = loadPetIds();
  console.log(`Loaded ${petIds.length} pet IDs for order generation`);

  const orders = generateOrders(count, petIds);

  // Write to JSON file
  const outputFile = path.join(outputDir, 'orders.json');
  fs.writeFileSync(outputFile, JSON.stringify(orders, null, 2));

  console.log(`Generated ${count} orders and saved to ${outputFile}`);

  // Also create a smaller sample file
  const sampleOrders = orders.slice(0, 10);
  const sampleFile = path.join(outputDir, 'orders-sample.json');
  fs.writeFileSync(sampleFile, JSON.stringify(sampleOrders, null, 2));

  console.log(`Created sample file with 10 orders: ${sampleFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { generateOrder, generateOrders };