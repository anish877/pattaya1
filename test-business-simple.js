// Simple test script for Business APIs
require('dotenv').config();

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://api.pattaya1.com';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${STRAPI_URL}${endpoint}`, config);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function testBasicAPIs() {
  console.log('🧪 Testing Basic Business APIs...\n');

  // Test 1: Get all businesses
  console.log('1. Testing GET /api/businesses...');
  const response1 = await makeRequest('/api/businesses');
  console.log('Status:', response1.status);
  console.log('Response:', JSON.stringify(response1.data, null, 2));

  // Test 2: Get categories
  console.log('\n2. Testing GET /api/categories...');
  const response2 = await makeRequest('/api/categories');
  console.log('Status:', response2.status);
  console.log('Response:', JSON.stringify(response2.data, null, 2));

  // Test 3: Try to create business without auth
  console.log('\n3. Testing POST /api/businesses (no auth)...');
  const testBusiness = {
    data: {
      name: "Test Business",
      slug: "test-business",
      description: "A test business",
      address: [{
        address: "123 Test Street",
        city: "Pattaya"
      }],
      contact: [{
        phone: "+66 38 123 4567",
        email: "test@business.com"
      }],
      hours: [{
        monday: "9:00 AM - 10:00 PM"
      }],
      amenities: [{
        wifi: true,
        parking: true
      }],
      priceRange: "mid",
      tags: [{
        tags: ["test"]
      }],
      socialMedia: [{
        facebook: "https://facebook.com/test"
      }],
      seo: [{
        metaTitle: "Test Business"
      }]
    }
  };

  const response3 = await makeRequest('/api/businesses', 'POST', testBusiness);
  console.log('Status:', response3.status);
  console.log('Response:', JSON.stringify(response3.data, null, 2));

  // Test 4: Check if /me endpoint exists
  console.log('\n4. Testing GET /api/businesses/me...');
  const response4 = await makeRequest('/api/businesses/me');
  console.log('Status:', response4.status);
  console.log('Response:', JSON.stringify(response4.data, null, 2));

  console.log('\n🎉 Basic API tests completed!');
}

// Run the tests
testBasicAPIs().catch(console.error); 