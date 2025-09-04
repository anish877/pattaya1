import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_STRAPI_URL ? `${process.env.NEXT_PUBLIC_STRAPI_URL}/api` : 'https://api.pattaya1.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface NewsArticle {
  id: string;
  Title: string;
  Description: string;
  URL: string;
  ImageURL?: string;
  PublishedAt: string;
  apiSource: string;
  upvotes: number;
  downvotes: number;
  isPinned: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  isHidden: boolean;
}

export interface DashboardData {
  totalArticles: number;
  pendingApproval: number;
  approvedArticles: number;
  pinnedArticles: number;
  recentActivity: any[];
}

export const newsApi = {
  // Get live breaking news (approved articles only)
  getLiveNews: async (): Promise<{ data: NewsArticle[] }> => {
    try {
      const response = await api.get('/breaking-news/live');
      return response.data;
    } catch (error) {
      console.warn('Breaking news endpoint not available:', error);
      return { data: [] };
    }
  },

  // Get all breaking news for admin dashboard
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const response = await api.get('/breaking-news/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Dashboard endpoint not available:', error);
      return { totalArticles: 0, pendingApproval: 0, approvedArticles: 0, pinnedArticles: 0, recentActivity: [] };
    }
  },

  // Get paginated breaking news
  getBreakingNewsPlural: async (params?: { page?: number; pageSize?: number; sort?: string }): Promise<{ data: NewsArticle[]; meta: any }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('pagination[page]', params.page.toString());
      if (params?.pageSize) queryParams.set('pagination[pageSize]', params.pageSize.toString());
      if (params?.sort) queryParams.set('sort', params.sort);
      
      const response = await api.get(`/breaking-news-plural?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('Breaking news plural endpoint not available:', error);
      return { data: [], meta: {} };
    }
  },

  // Get all breaking news (admin view)
  getAllNews: async (): Promise<{ data: NewsArticle[] }> => {
    try {
      const response = await api.get('/breaking-news');
      return response.data;
    } catch (error) {
      console.warn('All news endpoint not available:', error);
      return { data: [] };
    }
  },

  // Get specific article
  getArticle: async (id: string): Promise<{ data: NewsArticle }> => {
    const response = await api.get(`/breaking-news/${id}`);
    return response.data;
  },

  // Pin/unpin article
  pinArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/pin`);
    return response.data;
  },

  unpinArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/unpin`);
    return response.data;
  },

  // Vote on article
  upvoteArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/upvote`);
    return response.data;
  },

  downvoteArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/downvote`);
    return response.data;
  },

  // Admin moderation actions
  approveArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/approve`);
    return response.data;
  },

  rejectArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/reject`);
    return response.data;
  },

  hideArticle: async (id: string): Promise<any> => {
    const response = await api.post(`/breaking-news/${id}/hide`);
    return response.data;
  },

  // Manual news fetch
  fetchNews: async (): Promise<any> => {
    try {
      const response = await api.post('/breaking-news/fetch-news');
      return response.data;
    } catch (error) {
      console.warn('Manual fetch endpoint not available:', error);
      return { success: false, message: 'Endpoint not available' };
    }
  },

  // Widget controls
  getWidgetControls: async (): Promise<any> => {
    try {
      const response = await api.get('/widget-controls');
      return response.data;
    } catch (error) {
      console.warn('Widget controls endpoint not available:', error);
      return { data: [] };
    }
  },

  // Sponsored posts
  getSponsoredPosts: async (): Promise<any> => {
    try {
      const response = await api.get('/sponsored-posts');
      return response.data;
    } catch (error) {
      console.warn('Sponsored posts endpoint not available:', error);
      return { data: [] };
    }
  },

  // News sources management
  getNewsSources: async (): Promise<any> => {
    const response = await api.get('/news-sources');
    return response.data;
  },

  createNewsSource: async (data: any): Promise<any> => {
    const response = await api.post('/news-sources', { data });
    return response.data;
  },

  updateNewsSource: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/news-sources/${id}`, { data });
    return response.data;
  },

  deleteNewsSource: async (id: string): Promise<any> => {
    const response = await api.delete(`/news-sources/${id}`);
    return response.data;
  },

  // Global settings
  getSettings: async (): Promise<any> => {
    const response = await api.get('/news-settings');
    return response.data;
  },

  updateSettings: async (data: any): Promise<any> => {
    const response = await api.put('/news-settings', { data });
    return response.data;
  },
};

export default newsApi;
