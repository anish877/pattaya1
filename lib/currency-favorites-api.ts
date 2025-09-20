import { buildApiUrl } from './strapi-config';

export interface CurrencyFavorite {
  id: number;
  attributes: {
    currencyCode: string;
    currencyName: string;
    currencySymbol?: string;
    currencyFlag?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CurrencyTrending {
  id: number;
  attributes: {
    currencyCode: string;
    currencyName: string;
    currencySymbol?: string;
    currencyFlag?: string;
    rateToTHB: number;
    previousRateToTHB?: number;
    change24h: number;
    changePercent24h: number;
    trend: 'up' | 'down' | 'stable';
    rank: number;
    volume24h?: number;
    marketCap?: number;
    lastUpdated: string;
    dataSource: string;
    isActive: boolean;
  };
}

class CurrencyFavoritesAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = buildApiUrl('/currency-favorites');
  }

  private getLocalFavorites(): CurrencyFavorite[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('currency-favorites');
    return stored ? JSON.parse(stored) : [];
  }

  private setLocalFavorites(favorites: CurrencyFavorite[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('currency-favorites', JSON.stringify(favorites));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CurrencyFavoritesAPI request failed:', error);
      throw error;
    }
  }

  // Get user's favorite currencies
  async getUserFavorites(token?: string): Promise<CurrencyFavorite[]> {
    if (!token) {
      return this.getLocalFavorites();
    }

    const response = await this.request<{ data: CurrencyFavorite[] }>('/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  // Add currency to favorites
  async addToFavorites(
    currencyCode: string,
    currencyName: string,
    currencySymbol?: string,
    currencyFlag?: string,
    token?: string
  ): Promise<CurrencyFavorite> {
    // For now, store favorites in localStorage when no token is provided
    if (!token) {
      const favorites = this.getLocalFavorites();
      const newFavorite: CurrencyFavorite = {
        id: Date.now(),
        attributes: {
          currencyCode,
          currencyName,
          currencySymbol,
          currencyFlag,
          isActive: true,
          sortOrder: favorites.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
      favorites.push(newFavorite);
      localStorage.setItem('currency-favorites', JSON.stringify(favorites));
      return newFavorite;
    }

    const headers: Record<string, string> = {};
    headers['Authorization'] = `Bearer ${token}`;

    const response = await this.request<{ data: CurrencyFavorite }>('/add', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          currencyCode,
          currencyName,
          currencySymbol,
          currencyFlag,
        },
      }),
    });
    return response.data;
  }

  // Remove currency from favorites
  async removeFromFavorites(currencyCode: string, token?: string): Promise<void> {
    if (!token) {
      const favorites = this.getLocalFavorites();
      const filtered = favorites.filter(fav => fav.attributes.currencyCode !== currencyCode);
      this.setLocalFavorites(filtered);
      return;
    }

    const headers: Record<string, string> = {};
    headers['Authorization'] = `Bearer ${token}`;

    await this.request(`/remove/${currencyCode}`, {
      method: 'DELETE',
      headers,
    });
  }

  // Update sort order of favorites
  async updateSortOrder(favorites: Array<{ id: number; sortOrder: number }>, token?: string): Promise<void> {
    if (!token) {
      // For localStorage, we don't need to update sort order as it's handled by the array order
      return;
    }

    const headers: Record<string, string> = {};
    headers['Authorization'] = `Bearer ${token}`;

    await this.request('/sort', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        data: { favorites },
      }),
    });
  }
}

class CurrencyTrendingAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = buildApiUrl('/currency-trending');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CurrencyTrendingAPI request failed:', error);
      throw error;
    }
  }

  // Get all trending currencies
  async getTrendingCurrencies(limit: number = 50): Promise<CurrencyTrending[]> {
    try {
      const response = await this.request<{ data: CurrencyTrending[] }>(`/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trending currencies from API, using fallback data:', error);
      // Return fallback data with real currency rates
      return this.getFallbackTrendingData(limit);
    }
  }

  private getFallbackTrendingData(limit: number): CurrencyTrending[] {
    const fallbackData: CurrencyTrending[] = [
      {
        id: 1,
        attributes: {
          currencyCode: 'USD',
          currencyName: 'US Dollar',
          currencySymbol: '$',
          currencyFlag: '🇺🇸',
          rateToTHB: 35.50,
          previousRateToTHB: 35.45,
          change24h: 0.05,
          changePercent24h: 0.14,
          trend: 'up',
          rank: 1,
          volume24h: null,
          marketCap: null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback',
          isActive: true
        }
      },
      {
        id: 2,
        attributes: {
          currencyCode: 'EUR',
          currencyName: 'Euro',
          currencySymbol: '€',
          currencyFlag: '🇪🇺',
          rateToTHB: 38.75,
          previousRateToTHB: 38.80,
          change24h: -0.05,
          changePercent24h: -0.13,
          trend: 'down',
          rank: 2,
          volume24h: null,
          marketCap: null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback',
          isActive: true
        }
      },
      {
        id: 3,
        attributes: {
          currencyCode: 'GBP',
          currencyName: 'British Pound',
          currencySymbol: '£',
          currencyFlag: '🇬🇧',
          rateToTHB: 45.20,
          previousRateToTHB: 45.18,
          change24h: 0.02,
          changePercent24h: 0.04,
          trend: 'stable',
          rank: 3,
          volume24h: null,
          marketCap: null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback',
          isActive: true
        }
      },
      {
        id: 4,
        attributes: {
          currencyCode: 'JPY',
          currencyName: 'Japanese Yen',
          currencySymbol: '¥',
          currencyFlag: '🇯🇵',
          rateToTHB: 0.24,
          previousRateToTHB: 0.23,
          change24h: 0.01,
          changePercent24h: 4.35,
          trend: 'up',
          rank: 4,
          volume24h: null,
          marketCap: null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback',
          isActive: true
        }
      },
      {
        id: 5,
        attributes: {
          currencyCode: 'SGD',
          currencyName: 'Singapore Dollar',
          currencySymbol: 'S$',
          currencyFlag: '🇸🇬',
          rateToTHB: 26.30,
          previousRateToTHB: 26.25,
          change24h: 0.05,
          changePercent24h: 0.19,
          trend: 'up',
          rank: 5,
          volume24h: null,
          marketCap: null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback',
          isActive: true
        }
      },
      {
        id: 6,
        attributes: {
          currencyCode: 'AUD',
          currencyName: 'Australian Dollar',
          currencySymbol: 'A$',
          currencyFlag: '🇦🇺',
          rateToTHB: 23.80,
          previousRateToTHB: 23.75,
          change24h: 0.05,
          changePercent24h: 0.21,
          trend: 'up',
          rank: 6,
          volume24h: null,
          marketCap: null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback',
          isActive: true
        }
      }
    ];

    return fallbackData.slice(0, limit);
  }

  // Get specific currency trend
  async getCurrencyTrend(currencyCode: string): Promise<CurrencyTrending> {
    const response = await this.request<{ data: CurrencyTrending }>(`/trend/${currencyCode}`);
    return response.data;
  }
}

export const currencyFavoritesAPI = new CurrencyFavoritesAPI();
export const currencyTrendingAPI = new CurrencyTrendingAPI();

