#!/usr/bin/env node

/**
 * Currency Converter Widget Test Script
 * Tests the complete currency converter functionality
 */

const axios = require('axios');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || ' https://api.pattaya1.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test functions
async function testStrapiConnection() {
  logTest('Strapi Backend Connection');
  
  try {
    const response = await axios.get(`${STRAPI_URL}/api/currency-converter/currencies`, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('Strapi backend is accessible');
      logInfo(`Found ${response.data.data.currencies.length} supported currencies`);
      return true;
    } else {
      logError('Strapi backend returned unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Strapi backend connection failed: ${error.message}`);
    return false;
  }
}

async function testGetCurrencies() {
  logTest('Get Supported Currencies');
  
  try {
    const response = await axios.get(`${STRAPI_URL}/api/currency-converter/currencies`);
    
    if (response.data.success && response.data.data.currencies) {
      const currencies = response.data.data.currencies;
      logSuccess(`Retrieved ${currencies.length} currencies`);
      
      // Check for key currencies
      const keyCurrencies = ['THB', 'USD', 'EUR', 'GBP', 'JPY'];
      const foundCurrencies = keyCurrencies.filter(code => 
        currencies.some(c => c.code === code)
      );
      
      if (foundCurrencies.length === keyCurrencies.length) {
        logSuccess('All key currencies are supported');
      } else {
        logWarning(`Missing currencies: ${keyCurrencies.filter(c => !foundCurrencies.includes(c)).join(', ')}`);
      }
      
      return true;
    } else {
      logError('Failed to retrieve currencies');
      return false;
    }
  } catch (error) {
    logError(`Get currencies failed: ${error.message}`);
    return false;
  }
}

async function testGetExchangeRates() {
  logTest('Get Exchange Rates');
  
  try {
    const response = await axios.get(`${STRAPI_URL}/api/currency-converter/rates`);
    
    if (response.data.success && response.data.data.rates) {
      const rates = response.data.data.rates;
      logSuccess(`Retrieved exchange rates for ${Object.keys(rates).length} currencies`);
      logInfo(`Source: ${response.data.data.source}`);
      logInfo(`Last updated: ${response.data.data.timestamp}`);
      
      // Check for key rates
      const keyRates = ['USD', 'EUR', 'GBP'];
      const foundRates = keyRates.filter(code => rates[code] !== undefined);
      
      if (foundRates.length === keyRates.length) {
        logSuccess('All key exchange rates are available');
        keyRates.forEach(code => {
          logInfo(`1 THB = ${rates[code]} ${code}`);
        });
      } else {
        logWarning(`Missing rates: ${keyRates.filter(c => !foundRates.includes(c)).join(', ')}`);
      }
      
      return true;
    } else {
      logError('Failed to retrieve exchange rates');
      return false;
    }
  } catch (error) {
    logError(`Get exchange rates failed: ${error.message}`);
    return false;
  }
}

async function testCurrencyConversion() {
  logTest('Currency Conversion');
  
  const testCases = [
    { from: 'THB', to: 'USD', amount: 100 },
    { from: 'USD', to: 'THB', amount: 10 },
    { from: 'EUR', to: 'USD', amount: 50 },
    { from: 'THB', to: 'THB', amount: 1000 }
  ];
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    try {
      const params = new URLSearchParams({
        from: testCase.from,
        to: testCase.to,
        amount: testCase.amount.toString()
      });
      
      const response = await axios.get(`${STRAPI_URL}/api/currency-converter/convert?${params}`);
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        logSuccess(`${testCase.amount} ${testCase.from} = ${result.to.amount} ${testCase.to}`);
        successCount++;
      } else {
        logError(`Conversion failed for ${testCase.from} to ${testCase.to}`);
      }
    } catch (error) {
      logError(`Conversion error for ${testCase.from} to ${testCase.to}: ${error.message}`);
    }
  }
  
  if (successCount === testCases.length) {
    logSuccess('All currency conversions successful');
    return true;
  } else {
    logWarning(`${successCount}/${testCases.length} conversions successful`);
    return false;
  }
}

async function testHistoricalRates() {
  logTest('Historical Exchange Rates');
  
  try {
    const params = new URLSearchParams({
      currency: 'USD',
      days: '7'
    });
    
    const response = await axios.get(`${STRAPI_URL}/api/currency-converter/history?${params}`);
    
    if (response.data.success && response.data.data.history) {
      const history = response.data.data.history;
      logSuccess(`Retrieved ${history.length} days of historical data for USD`);
      logInfo(`Current rate: ${response.data.data.currentRate}`);
      logInfo(`Period: ${response.data.data.period}`);
      return true;
    } else {
      logError('Failed to retrieve historical rates');
      return false;
    }
  } catch (error) {
    logError(`Historical rates failed: ${error.message}`);
    return false;
  }
}

async function testWidgetSettings() {
  logTest('Widget Settings');
  
  try {
    const response = await axios.get(`${STRAPI_URL}/api/currency-converter/settings`);
    
    if (response.data.success && response.data.data) {
      const settings = response.data.data;
      logSuccess('Widget settings retrieved successfully');
      logInfo(`Default from currency: ${settings.defaultFromCurrency}`);
      logInfo(`Default to currency: ${settings.defaultToCurrency}`);
      logInfo(`Update frequency: ${settings.updateFrequencyMinutes} minutes`);
      logInfo(`Supported currencies: ${settings.supportedCurrencies.length}`);
      return true;
    } else {
      logError('Failed to retrieve widget settings');
      return false;
    }
  } catch (error) {
    logError(`Widget settings failed: ${error.message}`);
    return false;
  }
}

async function testFrontendConnection() {
  logTest('Frontend Connection');
  
  try {
    const response = await axios.get(`${FRONTEND_URL}/test-currency-converter`, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      logSuccess('Frontend test page is accessible');
      return true;
    } else {
      logError('Frontend test page returned unexpected status');
      return false;
    }
  } catch (error) {
    logError(`Frontend connection failed: ${error.message}`);
    logInfo('Make sure the frontend is running on the correct port');
    return false;
  }
}

async function runPerformanceTest() {
  logTest('Performance Test');
  
  const startTime = Date.now();
  const promises = [];
  
  // Test concurrent requests
  for (let i = 0; i < 10; i++) {
    promises.push(axios.get(`${STRAPI_URL}/api/currency-converter/rates`));
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.data.success).length;
    
    if (successCount === results.length) {
      logSuccess(`All ${results.length} concurrent requests successful`);
      logInfo(`Total time: ${duration}ms`);
      logInfo(`Average time per request: ${(duration / results.length).toFixed(2)}ms`);
      return true;
    } else {
      logWarning(`${successCount}/${results.length} concurrent requests successful`);
      return false;
    }
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log(`${colors.bold}🚀 Starting Currency Converter Widget Tests${colors.reset}`);
  log(`Backend URL: ${STRAPI_URL}`);
  log(`Frontend URL: ${FRONTEND_URL}`);
  
  const tests = [
    { name: 'Strapi Connection', fn: testStrapiConnection },
    { name: 'Get Currencies', fn: testGetCurrencies },
    { name: 'Get Exchange Rates', fn: testGetExchangeRates },
    { name: 'Currency Conversion', fn: testCurrencyConversion },
    { name: 'Historical Rates', fn: testHistoricalRates },
    { name: 'Widget Settings', fn: testWidgetSettings },
    { name: 'Frontend Connection', fn: testFrontendConnection },
    { name: 'Performance Test', fn: runPerformanceTest }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      if (result) passedTests++;
    } catch (error) {
      logError(`Test ${test.name} crashed: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log(`\n${colors.bold}📊 Test Results Summary${colors.reset}`);
  log(`Passed: ${passedTests}/${tests.length} tests`);
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  if (passedTests === tests.length) {
    log(`\n${colors.bold}${colors.green}🎉 All tests passed! Currency converter is working correctly.${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.bold}${colors.red}❌ Some tests failed. Please check the issues above.${colors.reset}`);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});
