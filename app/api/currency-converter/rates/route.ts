import { NextRequest, NextResponse } from 'next/server';

const EXCHANGE_RATE_API_KEY = '0c5c6bd5a7c35064a089762e';
const EXCHANGE_RATE_BASE_URL = 'https://v6.exchangerate-api.com/v6';

// Fallback rates in case API fails
const FALLBACK_RATES = {
  THB: 1.0,
  USD: 0.027,
  EUR: 0.025,
  GBP: 0.021,
  JPY: 4.2,
  KRW: 36.5,
  SGD: 0.037,
  MYR: 0.13,
  IDR: 430,
  PHP: 1.5,
  VND: 670,
  CNY: 0.19,
  HKD: 0.21,
  TWD: 0.87,
  AUD: 0.041,
  CAD: 0.037,
  CHF: 0.024,
  NZD: 0.044,
  INR: 2.25,
  RUB: 2.5
};

export async function GET(request: NextRequest) {
  try {
    // Fetch real-time rates from ExchangeRate-API
    const response = await fetch(`${EXCHANGE_RATE_BASE_URL}/${EXCHANGE_RATE_API_KEY}/latest/THB`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'success') {
      const rates = {
        rates: data.conversion_rates,
        timestamp: new Date().toISOString(),
        source: 'exchangerate-api',
        baseCurrency: 'THB'
      };

      return NextResponse.json({
        success: true,
        data: rates
      });
    } else {
      throw new Error(data['error-type'] || 'API returned error');
    }
  } catch (error) {
    console.error('Error fetching exchange rates from API:', error);
    
    // Return fallback rates if API fails
    const fallbackRates = {
      rates: FALLBACK_RATES,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      baseCurrency: 'THB'
    };

    return NextResponse.json({
      success: true,
      data: fallbackRates,
      warning: 'Using fallback rates due to API error'
    });
  }
}
