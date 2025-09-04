const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://api.pattaya1.com';

async function testCreateBusiness() {
  console.log('🔍 Testing Business Creation...\n');

  const businessData = {
    data: {
      name: "Test Business",
      slug: "test-business",
      description: "A test business for API testing",
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

  try {
    console.log('1. Testing POST /api/businesses (without owner field)...');
    const response = await fetch(`${STRAPI_URL}/api/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData)
    });

    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Business created successfully!');
      
      // Try to fetch the created business
      console.log('\n2. Testing GET /api/businesses to see created business...');
      const getResponse = await fetch(`${STRAPI_URL}/api/businesses`);
      const getResult = await getResponse.json();
      console.log('GET Response:', JSON.stringify(getResult, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCreateBusiness(); 