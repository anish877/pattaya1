const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || ' https://api.pattaya1.com';

export const trivagoAPI = {
  // Search flights via Trivago
  async searchFlights(params) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${STRAPI_URL}/api/travel-widget/flight-search?${queryParams}`);
    return response.json();
  },

  // Search hotels via Trivago  
  async searchHotels(params) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${STRAPI_URL}/api/travel-widget/hotel-search?${queryParams}`);
    return response.json();
  },

  // Get popular destinations
  async getDestinations() {
    const response = await fetch(`${STRAPI_URL}/api/travel-widget/destinations`);
    return response.json();
  },

  // Track search analytics
  async trackSearch(type, searchParams) {
    try {
      await fetch(`${STRAPI_URL}/api/travel-widget/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'search',
          provider: 'Trivago',
          type,
          searchParams
        })
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
};

// Usage helper function
export const handleTravelSearch = async (type, searchParams) => {
  try {
    const response = type === 'flights' 
      ? await trivagoAPI.searchFlights(searchParams)
      : await trivagoAPI.searchHotels(searchParams);
      
    if (response.success && response.data.searchUrl) {
      // Track the search
      await trivagoAPI.trackSearch(type, searchParams);
      
      // Open Trivago search results
      window.open(response.data.searchUrl, '_blank');
      return true;
    } else {
      console.error('Search failed:', response);
      return false;
    }
  } catch (error) {
    console.error('Search error:', error);
    return false;
  }
};
