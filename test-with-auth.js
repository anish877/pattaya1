const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://api.pattaya1.com';

async function testWithAuth() {
  console.log('🔍 Testing with Authentication...\n');

  // First, let's try to authenticate
  const authData = {
    identifier: "test@example.com", // You'll need to use a real user
    password: "password123"
  };

  try {
    console.log('1. Testing authentication...');
    const authResponse = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData)
    });

    console.log(`Auth Status: ${authResponse.status}`);
    const authResult = await authResponse.json();
    
    if (authResponse.ok && authResult.jwt) {
      console.log('✅ Authentication successful!');
      const token = authResult.jwt;
      
      // Test creating a business with the token
      console.log('\n2. Testing POST /api/businesses with auth token...');
      const businessData = {
        data: {
          name: "Test Business with Auth",
          slug: "test-business-auth",
          description: "A test business with authentication",
          address: [{
            address: "123 Test Street",
            city: "Pattaya",
            state: "Chonburi",
            country: "Thailand",
            postalCode: "20150"
          }],
          contact: [{
            phone: "+66123456789",
            email: "test@business.com"
          }],
          priceRange: "mid"
        }
      };

      const createResponse = await fetch(`${STRAPI_URL}/api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(businessData)
      });

      console.log(`Create Status: ${createResponse.status}`);
      const createResult = await createResponse.json();
      console.log('Create Response:', JSON.stringify(createResult, null, 2));

      if (createResponse.ok) {
        console.log('\n✅ Business created successfully!');
        
        // Test owner filtering
        console.log('\n3. Testing owner filter with auth...');
        const filterResponse = await fetch(`${STRAPI_URL}/api/businesses?filters[owner][$eq]=me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log(`Filter Status: ${filterResponse.status}`);
        const filterResult = await filterResponse.json();
        console.log('Filter Response:', JSON.stringify(filterResult, null, 2));
      }

    } else {
      console.log('❌ Authentication failed:', authResult);
      console.log('\n💡 You need to create a user first or use existing credentials');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWithAuth(); 