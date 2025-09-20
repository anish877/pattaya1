'use client';

import { useState, useEffect, useCallback } from 'react';
import { currencyTrendingAPI, CurrencyTrending } from '@/lib/currency-favorites-api';

export function useCurrencyTrending() {
  const [trendingCurrencies, setTrendingCurrencies] = useState<CurrencyTrending[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrendingCurrencies = useCallback(async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await currencyTrendingAPI.getTrendingCurrencies(limit);
      setTrendingCurrencies(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending currencies');
      console.error('Failed to fetch trending currencies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrencyTrend = useCallback(async (currencyCode: string) => {
    try {
      const data = await currencyTrendingAPI.getCurrencyTrend(currencyCode);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch currency trend:', err);
      throw err;
    }
  }, []);

  // Fetch trending currencies on mount
  useEffect(() => {
    fetchTrendingCurrencies();
  }, [fetchTrendingCurrencies]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrendingCurrencies();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchTrendingCurrencies]);

  return {
    trendingCurrencies,
    loading,
    error,
    lastUpdated,
    fetchTrendingCurrencies,
    getCurrencyTrend,
    refetch: fetchTrendingCurrencies
  };
}

