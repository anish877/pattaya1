import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 30));

    const settings = {
      enabled: true,
      defaultFromCurrency: 'THB',
      defaultToCurrency: 'USD',
      updateFrequencyMinutes: 5,
      supportedCurrencies: [
        'THB', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'SGD', 'MYR', 
        'IDR', 'PHP', 'VND', 'CNY', 'HKD', 'TWD', 'AUD', 'CAD', 
        'CHF', 'NZD', 'INR', 'RUB'
      ],
      sponsoredEnabled: false
    };

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings'
      },
      { status: 500 }
    );
  }
}

