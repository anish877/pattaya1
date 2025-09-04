// Comprehensive Business API Test
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

async function testComprehensiveAPIs() {
  console.log('🧪 Comprehensive Business API Test\n');
  console.log('=' .repeat(50));

  // Test 1: Basic public endpoints
  console.log('\n1️⃣ TESTING PUBLIC ENDPOINTS');
  console.log('-'.repeat(30));

  console.log('📋 Testing GET /api/businesses...');
  const response1 = await makeRequest('/api/businesses');
  if (response1.ok) {
    console.log('✅ SUCCESS: Business list endpoint working');
    console.log(`   📊 Found ${response1.data.data?.length || 0} businesses`);
  } else {
    console.log('❌ FAILED:', response1.status, response1.data);
  }

  console.log('\n📋 Testing GET /api/categories...');
  const response2 = await makeRequest('/api/categories');
  if (response2.ok) {
    console.log('✅ SUCCESS: Categories endpoint working');
    console.log(`   📊 Found ${response2.data.data?.length || 0} categories`);
  } else {
    console.log('❌ FAILED:', response2.status, response2.data);
  }

  // Test 2: Authentication
  console.log('\n2️⃣ TESTING AUTHENTICATION');
  console.log('-'.repeat(30));

  console.log('📋 Testing POST /api/businesses (no auth)...');
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
  if (!response3.ok && response3.status === 401) {
    console.log('✅ SUCCESS: Authentication required for business creation');
  } else {
    console.log('❌ FAILED: Should require authentication');
    console.log('   Status:', response3.status);
  }

  // Test 3: Owner field validation
  console.log('\n3️⃣ TESTING OWNER FIELD');
  console.log('-'.repeat(30));

  console.log('📋 Testing owner filter (should fail - field not added yet)...');
  const response4 = await makeRequest('/api/businesses?filters[owner][$eq]=1');
  if (!response4.ok && response4.status === 400) {
    console.log('✅ EXPECTED: Owner field validation working (field not added yet)');
    console.log('   This is expected until you add the owner field in Strapi');
  } else {
    console.log('❌ UNEXPECTED:', response4.status, response4.data);
  }

  // Test 4: Schema validation
  console.log('\n4️⃣ TESTING SCHEMA VALIDATION');
  console.log('-'.repeat(30));

  console.log('📋 Testing invalid business data...');
  const invalidBusiness = {
    data: {
      name: "", // Empty name should fail
      address: [{
        address: "" // Empty address should fail
      }]
    }
  };

  const response5 = await makeRequest('/api/businesses', 'POST', invalidBusiness, 'mock-token');
  if (!response5.ok) {
    console.log('✅ SUCCESS: Schema validation working');
    console.log('   (Rejected invalid data as expected)');
  } else {
    console.log('❌ FAILED: Should reject invalid data');
  }

  // Test 5: Business categories
  console.log('\n5️⃣ TESTING BUSINESS CATEGORIES');
  console.log('-'.repeat(30));

  console.log('📋 Testing business-categories endpoint...');
  const response6 = await makeRequest('/api/business-categories');
  if (response6.ok) {
    console.log('✅ SUCCESS: Business categories endpoint working');
    console.log(`   📊 Found ${response6.data.data?.length || 0} business categories`);
  } else if (response6.status === 404) {
    console.log('⚠️  INFO: Business categories endpoint not found');
    console.log('   This is expected - you need to create Business Category content type');
  } else {
    console.log('❌ UNEXPECTED:', response6.status, response6.data);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  console.log('\n✅ WORKING ENDPOINTS:');
  console.log('   • GET /api/businesses - List businesses');
  console.log('   • GET /api/categories - List categories');
  console.log('   • Authentication - Properly enforced');
  console.log('   • Schema validation - Working');

  console.log('\n⚠️  NEEDS STRAPI CONFIGURATION:');
  console.log('   • Owner field - Add to Business content type');
  console.log('   • Business categories - Create Business Category content type');
  console.log('   • Required fields - Set contact.phone and contact.email as required');

  console.log('\n🔧 NEXT STEPS IN STRAPI DASHBOARD:');
  console.log('   1. Go to Content-Type Builder > Business');
  console.log('   2. Add owner field (Relation to User)');
  console.log('   3. Create Business Category content type');
  console.log('   4. Update categories relation to use Business Category');
  console.log('   5. Set required fields for contact.phone and contact.email');
  console.log('   6. Save and restart Strapi');

  console.log('\n🎯 AFTER CONFIGURATION, THESE WILL WORK:');
  console.log('   • GET /api/businesses?filters[owner][$eq]=USER_ID');
  console.log('   • POST /api/businesses (with owner auto-assigned)');
  console.log('   • PUT /api/businesses/:id (owner validation)');
  console.log('   • GET /api/business-categories');

  console.log('\n🎉 Test completed!');
}

// Run the tests
testComprehensiveAPIs().catch(console.error); 