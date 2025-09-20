import { NextRequest, NextResponse } from 'next/server';

const EXCHANGE_RATE_API_KEY = '0c5c6bd5a7c35064a089762e';
const EXCHANGE_RATE_BASE_URL = 'https://v6.exchangerate-api.com/v6';

// Currency metadata with flags and symbols
const CURRENCY_METADATA: Record<string, { name: string; symbol: string; flag: string }> = {
  'THB': { name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  'USD': { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  'EUR': { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  'GBP': { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  'JPY': { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  'KRW': { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  'SGD': { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  'MYR': { name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  'IDR': { name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  'PHP': { name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  'VND': { name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  'CNY': { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  'TWD': { name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  'AUD': { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  'CAD': { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  'CHF': { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  'INR': { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  'RUB': { name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  'BRL': { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  'MXN': { name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  'ZAR': { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  'TRY': { name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  'PLN': { name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  'CZK': { name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  'HUF': { name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  'SEK': { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  'NOK': { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  'DKK': { name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  'ILS': { name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  'AED': { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  'SAR': { name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  'QAR': { name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
  'KWD': { name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  'BHD': { name: 'Bahraini Dinar', symbol: 'د.ب', flag: '🇧🇭' },
  'OMR': { name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲' },
  'JOD': { name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴' },
  'LBP': { name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧' },
  'EGP': { name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' },
  'MAD': { name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦' },
  'TND': { name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳' },
  'DZD': { name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿' },
  'LYD': { name: 'Libyan Dinar', symbol: 'ل.د', flag: '🇱🇾' },
  'ETB': { name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹' },
  'KES': { name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  'UGX': { name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  'TZS': { name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿' },
  'RWF': { name: 'Rwandan Franc', symbol: 'RF', flag: '🇷🇼' },
  'GHS': { name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  'NGN': { name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  'XOF': { name: 'West African CFA Franc', symbol: 'CFA', flag: '🇸🇳' },
  'XAF': { name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🇨🇲' },
  'MUR': { name: 'Mauritian Rupee', symbol: '₨', flag: '🇲🇺' },
  'SCR': { name: 'Seychellois Rupee', symbol: '₨', flag: '🇸🇨' },
  'MVR': { name: 'Maldivian Rufiyaa', symbol: 'Rf', flag: '🇲🇻' },
  'LKR': { name: 'Sri Lankan Rupee', symbol: '₨', flag: '🇱🇰' },
  'NPR': { name: 'Nepalese Rupee', symbol: '₨', flag: '🇳🇵' },
  'BDT': { name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  'PKR': { name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  'AFN': { name: 'Afghan Afghani', symbol: '؋', flag: '🇦🇫' },
  'IRR': { name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷' },
  'IQD': { name: 'Iraqi Dinar', symbol: 'د.ع', flag: '🇮🇶' },
  'SYP': { name: 'Syrian Pound', symbol: '£', flag: '🇸🇾' },
  'YER': { name: 'Yemeni Rial', symbol: '﷼', flag: '🇾🇪' },
  'KZT': { name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿' },
  'UZS': { name: 'Uzbekistani Som', symbol: 'лв', flag: '🇺🇿' },
  'KGS': { name: 'Kyrgyzstani Som', symbol: 'лв', flag: '🇰🇬' },
  'TJS': { name: 'Tajikistani Somoni', symbol: 'SM', flag: '🇹🇯' },
  'TMT': { name: 'Turkmenistani Manat', symbol: 'T', flag: '🇹🇲' },
  'AZN': { name: 'Azerbaijani Manat', symbol: '₼', flag: '🇦🇿' },
  'AMD': { name: 'Armenian Dram', symbol: '֏', flag: '🇦🇲' },
  'GEL': { name: 'Georgian Lari', symbol: '₾', flag: '🇬🇪' },
  'MDL': { name: 'Moldovan Leu', symbol: 'L', flag: '🇲🇩' },
  'UAH': { name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  'BYN': { name: 'Belarusian Ruble', symbol: 'Br', flag: '🇧🇾' },
  'RSD': { name: 'Serbian Dinar', symbol: 'дин', flag: '🇷🇸' },
  'BAM': { name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'КМ', flag: '🇧🇦' },
  'MKD': { name: 'Macedonian Denar', symbol: 'ден', flag: '🇲🇰' },
  'ALL': { name: 'Albanian Lek', symbol: 'L', flag: '🇦🇱' },
  'BGN': { name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬' },
  'RON': { name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴' },
  'HRK': { name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷' },
  'ISK': { name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸' },
  'LTL': { name: 'Lithuanian Litas', symbol: 'Lt', flag: '🇱🇹' },
  'LVL': { name: 'Latvian Lats', symbol: 'Ls', flag: '🇱🇻' },
  'EEK': { name: 'Estonian Kroon', symbol: 'kr', flag: '🇪🇪' },
  'MTL': { name: 'Maltese Lira', symbol: '₤', flag: '🇲🇹' },
  'CYP': { name: 'Cypriot Pound', symbol: '£', flag: '🇨🇾' },
  'SIT': { name: 'Slovenian Tolar', symbol: 'SIT', flag: '🇸🇮' },
  'SKK': { name: 'Slovak Koruna', symbol: 'Sk', flag: '🇸🇰' },
  'BWP': { name: 'Botswana Pula', symbol: 'P', flag: '🇧🇼' },
  'ZMW': { name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲' },
  'ZWL': { name: 'Zimbabwean Dollar', symbol: '$', flag: '🇿🇼' },
  'NAD': { name: 'Namibian Dollar', symbol: '$', flag: '🇳🇦' },
  'SZL': { name: 'Swazi Lilangeni', symbol: 'L', flag: '🇸🇿' },
  'LSL': { name: 'Lesotho Loti', symbol: 'L', flag: '🇱🇸' },
  'AOA': { name: 'Angolan Kwanza', symbol: 'Kz', flag: '🇦🇴' },
  'MZN': { name: 'Mozambican Metical', symbol: 'MT', flag: '🇲🇿' },
  'MWK': { name: 'Malawian Kwacha', symbol: 'MK', flag: '🇲🇼' },
  'BIF': { name: 'Burundian Franc', symbol: 'FBu', flag: '🇧🇮' },
  'DJF': { name: 'Djiboutian Franc', symbol: 'Fdj', flag: '🇩🇯' },
  'ERN': { name: 'Eritrean Nakfa', symbol: 'Nfk', flag: '🇪🇷' },
  'SOS': { name: 'Somali Shilling', symbol: 'S', flag: '🇸🇴' },
  'SSP': { name: 'South Sudanese Pound', symbol: '£', flag: '🇸🇸' },
  'SDG': { name: 'Sudanese Pound', symbol: 'ج.س.', flag: '🇸🇩' },
  'CDF': { name: 'Congolese Franc', symbol: 'FC', flag: '🇨🇩' },
  'CVE': { name: 'Cape Verdean Escudo', symbol: '$', flag: '🇨🇻' },
  'STN': { name: 'São Tomé and Príncipe Dobra', symbol: 'Db', flag: '🇸🇹' },
  'GMD': { name: 'Gambian Dalasi', symbol: 'D', flag: '🇬🇲' },
  'GNF': { name: 'Guinean Franc', symbol: 'FG', flag: '🇬🇳' },
  'LRD': { name: 'Liberian Dollar', symbol: '$', flag: '🇱🇷' },
  'SLL': { name: 'Sierra Leonean Leone', symbol: 'Le', flag: '🇸🇱' },
  'CDF': { name: 'Congolese Franc', symbol: 'FC', flag: '🇨🇩' },
  'RWF': { name: 'Rwandan Franc', symbol: 'RF', flag: '🇷🇼' },
  'BIF': { name: 'Burundian Franc', symbol: 'FBu', flag: '🇧🇮' },
  'DJF': { name: 'Djiboutian Franc', symbol: 'Fdj', flag: '🇩🇯' },
  'ERN': { name: 'Eritrean Nakfa', symbol: 'Nfk', flag: '🇪🇷' },
  'SOS': { name: 'Somali Shilling', symbol: 'S', flag: '🇸🇴' },
  'SSP': { name: 'South Sudanese Pound', symbol: '£', flag: '🇸🇸' },
  'SDG': { name: 'Sudanese Pound', symbol: 'ج.س.', flag: '🇸🇩' },
  'CDF': { name: 'Congolese Franc', symbol: 'FC', flag: '🇨🇩' },
  'CVE': { name: 'Cape Verdean Escudo', symbol: '$', flag: '🇨🇻' },
  'STN': { name: 'São Tomé and Príncipe Dobra', symbol: 'Db', flag: '🇸🇹' },
  'GMD': { name: 'Gambian Dalasi', symbol: 'D', flag: '🇬🇲' },
  'GNF': { name: 'Guinean Franc', symbol: 'FG', flag: '🇬🇳' },
  'LRD': { name: 'Liberian Dollar', symbol: '$', flag: '🇱🇷' },
  'SLL': { name: 'Sierra Leonean Leone', symbol: 'Le', flag: '🇸🇱' }
};

export async function GET(request: NextRequest) {
  try {
    // Fetch supported currencies from ExchangeRate-API
    const response = await fetch(`${EXCHANGE_RATE_BASE_URL}/${EXCHANGE_RATE_API_KEY}/codes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'success') {
      // Map API response to our format with metadata
      const currencies = data.supported_codes.map(([code, name]: [string, string]) => ({
        code,
        name: CURRENCY_METADATA[code]?.name || name,
        symbol: CURRENCY_METADATA[code]?.symbol || code,
        flag: CURRENCY_METADATA[code]?.flag || '🏳️'
      }));

      return NextResponse.json({
        success: true,
        data: {
          currencies
        }
      });
    } else {
      throw new Error(data['error-type'] || 'API returned error');
    }
  } catch (error) {
    console.error('Error fetching currencies from API:', error);
    
    // Return fallback currencies if API fails
    const fallbackCurrencies = Object.entries(CURRENCY_METADATA).map(([code, metadata]) => ({
      code,
      name: metadata.name,
      symbol: metadata.symbol,
      flag: metadata.flag
    }));

    return NextResponse.json({
      success: true,
      data: {
        currencies: fallbackCurrencies
      },
      warning: 'Using fallback currencies due to API error'
    });
  }
}
