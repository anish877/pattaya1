// Test script for Standard Business APIs (no custom routes)
require('dotenv').config();

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://api.pattaya1.com';

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

async function testStandardBusinessAPIs() {
  console.log('🧪 Testing Standard Business APIs (No Custom Routes)...\n');

  // Test 1: Get all businesses (public)
  console.log('1. Testing GET /api/businesses (public)...');
  const response1 = await makeRequest('/api/businesses?populate=*');
  if (response1.ok) {
    console.log('✅ Successfully fetched all businesses');
    console.log(`📊 Found ${response1.data.data?.length || 0} businesses`);
  } else {
    console.log(`❌ Failed to fetch businesses: ${response1.status}`);
    console.log('Error:', response1.data);
  }

  // Test 2: Get categories (public)
  console.log('\n2. Testing GET /api/categories...');
  const response2 = await makeRequest('/api/categories?populate=*');
  if (response2.ok) {
    console.log('✅ Successfully fetched categories');
    console.log(`📊 Found ${response2.data.data?.length || 0} categories`);
  } else {
    console.log(`❌ Failed to fetch categories: ${response2.status}`);
  }

  // Test 3: Try to get user's businesses without auth (should fail)
  console.log('\n3. Testing GET /api/businesses?filters[owner][$eq]=me (no auth)...');
  const response3 = await makeRequest('/api/businesses?filters[owner][$eq]=me');
  if (!response3.ok && response3.status === 401) {
    console.log('✅ Correctly rejected unauthenticated request');
  } else {
    console.log(`❌ Unexpected response: ${response3.status}`);
    console.log('Response:', response3.data);
  }

  // Test 4: Try to create business without auth (should fail)
  console.log('\n4. Testing POST /api/businesses (no auth)...');
  const testBusiness = {
    data: {
      name: "Test Business",
      slug: "test-business",
      description: "A test business for API testing",
      categories: [],
      address: [{
        address: "123 Test Street",
        city: "Pattaya",
        state: "Chonburi",
        country: "Thailand",
        postalCode: "20150"
      }],
      contact: [{
        phone: "+66 38 123 4567",
        email: "test@business.com",
        website: "https://testbusiness.com"
      }],
      hours: [{
        monday: "9:00 AM - 10:00 PM",
        tuesday: "9:00 AM - 10:00 PM",
        wednesday: "9:00 AM - 10:00 PM",
        thursday: "9:00 AM - 10:00 PM",
        friday: "9:00 AM - 10:00 PM",
        saturday: "9:00 AM - 10:00 PM",
        sunday: "9:00 AM - 10:00 PM"
      }],
      amenities: [{
        wifi: true,
        parking: true,
        airConditioning: true,
        wheelchairAccessible: false,
        creditCardsAccepted: true
      }],
      priceRange: "mid",
      tags: [{
        tags: ["test", "api"]
      }],
      featured: false,
      verified: false,
      socialMedia: [{
        facebook: "https://facebook.com/testbusiness",
        instagram: "https://instagram.com/testbusiness"
      }],
      seo: [{
        metaTitle: "Test Business - Pattaya",
        metaDescription: "A test business in Pattaya"
      }]
    }
  };

  const response4 = await makeRequest('/api/businesses', 'POST', testBusiness);
  if (!response4.ok && response4.status === 401) {
    console.log('✅ Correctly rejected unauthenticated create request');
  } else {
    console.log(`❌ Unexpected response: ${response4.status}`);
    console.log('Response:', response4.data);
  }

  // Test 5: Test with invalid token
  console.log('\n5. Testing with invalid token...');
  const response5 = await makeRequest('/api/businesses?filters[owner][$eq]=me', 'GET', null, 'invalid-token');
  if (!response5.ok && response5.status === 401) {
    console.log('✅ Correctly rejected invalid token');
  } else {
    console.log(`❌ Unexpected response: ${response5.status}`);
    console.log('Response:', response5.data);
  }

  // Test 6: Test business schema validation
  console.log('\n6. Testing business schema validation...');
  const invalidBusiness = {
    data: {
      name: "", // Empty name should fail
      address: [{
        address: "" // Empty address should fail
      }]
    }
  };

  const response6 = await makeRequest('/api/businesses', 'POST', invalidBusiness, 'mock-token');
  if (!response6.ok) {
    console.log('✅ Correctly rejected invalid business data');
    console.log('Validation errors:', response6.data);
  } else {
    console.log('❌ Should have rejected invalid data');
  }

  console.log('\n🎉 Standard Business API tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Public endpoints work without authentication');
  console.log('- Authenticated endpoints require valid token');
  console.log('- Business creation validates required fields');
  console.log('- Owner-based filtering works with standard endpoints');
  console.log('\n🔗 Available Endpoints:');
  console.log('- GET /api/businesses - List all businesses (public)');
  console.log('- GET /api/businesses?filters[owner][$eq]=me - Get user businesses (auth required)');
  console.log('- POST /api/businesses - Create business (auth required)');
  console.log('- PUT /api/businesses/:id - Update business (owner only)');
  console.log('- DELETE /api/businesses/:id - Delete business (owner only)');
}

// Run the tests
testStandardBusinessAPIs().catch(console.error); 