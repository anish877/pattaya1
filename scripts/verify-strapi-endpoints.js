// Comprehensive test for all required Strapi endpoints
require('dotenv').config();

async function verifyAllEndpoints() {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://api.pattaya1.com';
  const API_BASE = `${STRAPI_URL}/api`;
  
  console.log('🔍 Verifying All Required Strapi Endpoints...\n');

  const tests = [
    {
      name: 'Articles (with population)',
      url: '/articles?populate=*&sort=publishedAt:desc',
      expected: 'articles array'
    },
    {
      name: 'Authors',
      url: '/authors',
      expected: 'authors array'
    },
    {
      name: 'Categories', 
      url: '/categories',
      expected: 'categories array'
    },
    {
      name: 'Single Article (if exists)',
      url: '/articles/1?populate=*',
      expected: 'single article object'
    },
    {
      name: 'Breaking News Live',
      url: '/breaking-news/live',
      expected: 'breaking news array'
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const response = await fetch(`${API_BASE}${test.url}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${response.status}`);
        if (data.data) {
          const count = Array.isArray(data.data) ? data.data.length : 1;
          console.log(`   Found: ${count} item(s)`);
        }
      } else {
        console.log(`⚠️  ${test.name}`);
        console.log(`   Status: ${response.status} - ${data.error?.message || 'Unknown error'}`);
        if (response.status === 404) {
          console.log(`   Note: Content type may need to be created in Strapi admin`);
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Connection failed: ${error.message}`);
      allPassed = false;
    }
    console.log('');
  }

  console.log('📊 Summary:');
  console.log(`Backend URL: ${API_BASE}`);
  console.log(`Frontend URL: http://localhost:3000`);
  console.log(`Admin Panel: ${STRAPI_URL}/admin`);
  
  console.log('\n🎯 Available Frontend Routes:');
  console.log('• /news - Complete news hub with all feeds');
  console.log('• /breaking-news - Breaking news only');
  console.log('• /admin/news - News moderation dashboard');
  console.log('• /articles/[id] - Individual article pages');
}

verifyAllEndpoints().catch(console.error);
