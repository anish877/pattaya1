// Test script to check owner field functionality
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

async function testOwnerField() {
  console.log('🔍 Testing Owner Field Functionality...\n');

  // Test 1: Check if we can get businesses without owner filter
  console.log('1. Testing GET /api/businesses (basic)...');
  const response1 = await makeRequest('/api/businesses');
  console.log('Status:', response1.status);
  console.log('Response:', JSON.stringify(response1.data, null, 2));

  // Test 2: Try to create a business with owner field
  console.log('\n2. Testing POST /api/businesses with owner field...');
  const testBusiness = {
    data: {
      name: "Test Business with Owner",
      slug: "test-business-owner",
      description: "A test business with owner field",
      address: [{
        address: "123 Test Street",
        city: "Pattaya"
      }],
      contact: [{
        phone: "+66 38 123 4567",
        email: "test@business.com"
      }],
      owner: 1 // Try to set owner directly
    }
  };

  const response2 = await makeRequest('/api/businesses', 'POST', testBusiness);
  console.log('Status:', response2.status);
  console.log('Response:', JSON.stringify(response2.data, null, 2));

  // Test 3: Try different owner filter syntax
  console.log('\n3. Testing different owner filter syntax...');
  
  // Test 3a: Direct owner filter
  const response3a = await makeRequest('/api/businesses?filters[owner]=1');
  console.log('3a. filters[owner]=1 - Status:', response3a.status);
  console.log('Response:', JSON.stringify(response3a.data, null, 2));

  // Test 3b: Owner with $eq
  const response3b = await makeRequest('/api/businesses?filters[owner][$eq]=1');
  console.log('3b. filters[owner][$eq]=1 - Status:', response3b.status);
  console.log('Response:', JSON.stringify(response3b.data, null, 2));

  // Test 3c: Owner with $in
  const response3c = await makeRequest('/api/businesses?filters[owner][$in][0]=1');
  console.log('3c. filters[owner][$in][0]=1 - Status:', response3c.status);
  console.log('Response:', JSON.stringify(response3c.data, null, 2));

  // Test 4: Check if owner field is in the schema
  console.log('\n4. Testing if owner field exists in schema...');
  const response4 = await makeRequest('/api/businesses?populate=*');
  console.log('Status:', response4.status);
  console.log('Response structure:', Object.keys(response4.data));

  console.log('\n🎉 Owner field tests completed!');
  console.log('\n📝 Analysis:');
  console.log('- If owner field exists in schema, POST should accept it');
  console.log('- If owner field exists, filters should work');
  console.log('- If all tests fail, owner field might not be properly configured');
}

// Run the tests
testOwnerField().catch(console.error); 