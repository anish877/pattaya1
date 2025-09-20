import { NextRequest, NextResponse } from 'next/server';

const EXCHANGE_RATE_API_KEY = '0c5c6bd5a7c35064a089762e';
const EXCHANGE_RATE_BASE_URL = 'https://v6.exchangerate-api.com/v6';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = parseFloat(searchParams.get('amount') || '0');

    // Validate parameters
    if (!from || !to || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters. from, to, and amount are required.'
        },
        { status: 400 }
      );
    }

    // If same currency, return the same amount
    if (from === to) {
      const result = {
        from: {
          currency: from,
          amount: amount
        },
        to: {
          currency: to,
          amount: amount
        },
        rate: 1,
        timestamp: new Date().toISOString(),
        source: 'exchangerate-api'
      };

      return NextResponse.json({
        success: true,
        data: result
      });
    }

    // Use ExchangeRate-API pair conversion endpoint
    const response = await fetch(
      `${EXCHANGE_RATE_BASE_URL}/${EXCHANGE_RATE_API_KEY}/pair/${from}/${to}/${amount}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'success') {
      const result = {
        from: {
          currency: from,
          amount: amount
        },
        to: {
          currency: to,
          amount: Math.round(data.conversion_result * 100) / 100
        },
        rate: Math.round(data.conversion_rate * 10000) / 10000,
        timestamp: new Date().toISOString(),
        source: 'exchangerate-api'
      };

      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
      throw new Error(data['error-type'] || 'API returned error');
    }
  } catch (error) {
    console.error('Error converting currency:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to convert currency'
      },
      { status: 500 }
    );
  }
}
