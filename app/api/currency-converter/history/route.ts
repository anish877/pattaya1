import { NextRequest, NextResponse } from 'next/server';

// Mock historical data generator
const generateHistoricalData = (currency: string, days: number) => {
  const history = [];
  const baseRate = currency === 'THB' ? 1 : (currency === 'USD' ? 0.027 : Math.random() * 0.1 + 0.01);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic rate variations (±5%)
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const rate = baseRate * (1 + variation);
    
    history.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(rate * 10000) / 10000,
      timestamp: date.toISOString()
    });
  }
  
  return history;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const days = parseInt(searchParams.get('days') || '7');

    // Validate parameters
    if (!currency) {
      return NextResponse.json(
        {
          success: false,
          error: 'Currency parameter is required'
        },
        { status: 400 }
      );
    }

    if (days < 1 || days > 365) {
      return NextResponse.json(
        {
          success: false,
          error: 'Days must be between 1 and 365'
        },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const history = generateHistoricalData(currency, days);
    const currentRate = history[history.length - 1]?.rate || 1;

    const result = {
      currency,
      baseCurrency: 'THB',
      history,
      currentRate,
      period: `${days} days`
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching historical rates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch historical rates'
      },
      { status: 500 }
    );
  }
}

