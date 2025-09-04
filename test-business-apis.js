// Test script for Business APIs
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

async function testBusinessAPIs() {
  console.log('🧪 Testing Business APIs...\n');

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

  // Test 2: Get single business (public)
  console.log('\n2. Testing GET /api/businesses/:id (public)...');
  const response2 = await makeRequest('/api/businesses/1?populate=*');
  if (response2.ok) {
    console.log('✅ Successfully fetched single business');
    console.log(`📋 Business: ${response2.data.data?.attributes?.name || 'N/A'}`);
  } else {
    console.log(`❌ Failed to fetch single business: ${response2.status}`);
    console.log('Error:', response2.data);
  }

  // Test 3: Get user's businesses (authenticated) - should fail without token
  console.log('\n3. Testing GET /api/businesses/me (authenticated - no token)...');
  const response3 = await makeRequest('/api/businesses/me');
  if (!response3.ok && response3.status === 401) {
    console.log('✅ Correctly rejected unauthenticated request');
  } else {
    console.log(`❌ Unexpected response: ${response3.status}`);
    console.log('Response:', response3.data);
  }

  // Test 4: Create business (authenticated) - should fail without token
  console.log('\n4. Testing POST /api/businesses (authenticated - no token)...');
  const testBusiness = {
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
  };

  const response4 = await makeRequest('/api/businesses', 'POST', testBusiness);
  if (!response4.ok && response4.status === 401) {
    console.log('✅ Correctly rejected unauthenticated create request');
  } else {
    console.log(`❌ Unexpected response: ${response4.status}`);
    console.log('Response:', response4.data);
  }

  // Test 5: Test with mock token (should still fail but differently)
  console.log('\n5. Testing with invalid token...');
  const response5 = await makeRequest('/api/businesses/me', 'GET', null, 'invalid-token');
  if (!response5.ok && response5.status === 401) {
    console.log('✅ Correctly rejected invalid token');
  } else {
    console.log(`❌ Unexpected response: ${response5.status}`);
    console.log('Response:', response5.data);
  }

  // Test 6: Test categories endpoint
  console.log('\n6. Testing GET /api/categories...');
  const response6 = await makeRequest('/api/categories?populate=*');
  if (response6.ok) {
    console.log('✅ Successfully fetched categories');
    console.log(`📊 Found ${response6.data.data?.length || 0} categories`);
    if (response6.data.data?.length > 0) {
      console.log('📋 Sample categories:');
      response6.data.data.slice(0, 3).forEach(cat => {
        console.log(`   - ${cat.attributes?.name || 'N/A'}`);
      });
    }
  } else {
    console.log(`❌ Failed to fetch categories: ${response6.status}`);
    console.log('Error:', response6.data);
  }

  // Test 7: Test business schema validation
  console.log('\n7. Testing business schema validation...');
  const invalidBusiness = {
    name: "", // Empty name should fail
    address: [{
      address: "" // Empty address should fail
    }]
  };

  const response7 = await makeRequest('/api/businesses', 'POST', invalidBusiness, 'mock-token');
  if (!response7.ok) {
    console.log('✅ Correctly rejected invalid business data');
    console.log('Validation errors:', response7.data);
  } else {
    console.log('❌ Should have rejected invalid data');
  }

  console.log('\n🎉 Business API tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Public endpoints should work without authentication');
  console.log('- Authenticated endpoints should require valid token');
  console.log('- Business creation should validate required fields');
  console.log('- Owner-based access control should be in place');
}

// Run the tests
testBusinessAPIs().catch(console.error); 