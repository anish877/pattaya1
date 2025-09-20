'use client';

import { useState, useEffect, useCallback } from 'react';
import { currencyFavoritesAPI, CurrencyFavorite } from '@/lib/currency-favorites-api';
import { useAuth } from '@/components/auth/auth-provider';

export function useCurrencyFavorites() {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<CurrencyFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await currencyFavoritesAPI.getUserFavorites(token);
      setFavorites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch favorites');
      console.error('Failed to fetch currency favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addToFavorites = useCallback(async (
    currencyCode: string,
    currencyName: string,
    currencySymbol?: string,
    currencyFlag?: string
  ) => {
    try {
      const newFavorite = await currencyFavoritesAPI.addToFavorites(
        currencyCode,
        currencyName,
        currencySymbol,
        currencyFlag,
        token
      );
      setFavorites(prev => [...prev, newFavorite]);
      return newFavorite;
    } catch (err: any) {
      setError(err.message || 'Failed to add to favorites');
      throw err;
    }
  }, [token]);

  const removeFromFavorites = useCallback(async (currencyCode: string) => {
    try {
      await currencyFavoritesAPI.removeFromFavorites(currencyCode, token);
      setFavorites(prev => prev.filter(fav => fav.attributes.currencyCode !== currencyCode));
    } catch (err: any) {
      setError(err.message || 'Failed to remove from favorites');
      throw err;
    }
  }, [token]);

  const updateSortOrder = useCallback(async (sortedFavorites: CurrencyFavorite[]) => {
    try {
      const favoritesData = sortedFavorites.map((fav, index) => ({
        id: fav.id,
        sortOrder: index
      }));
      
      await currencyFavoritesAPI.updateSortOrder(favoritesData, token);
      setFavorites(sortedFavorites);
    } catch (err: any) {
      setError(err.message || 'Failed to update sort order');
      throw err;
    }
  }, [token]);

  const isFavorite = useCallback((currencyCode: string) => {
    return favorites.some(fav => fav.attributes.currencyCode === currencyCode);
  }, [favorites]);

  // Fetch favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    updateSortOrder,
    isFavorite,
    refetch: fetchFavorites
  };
}

