import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'https://api.pattaya1.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface StrapiArticle {
  id: number;
  documentId: string;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  cover?: any;
  author?: any;
  category?: any;
  blocks?: any[];
}

export interface Author {
  id: number;
  documentId: string;
  name: string;
  email?: string;
  bio?: string;
}

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ArticleResponse {
  data: StrapiArticle[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface SingleArticleResponse {
  data: StrapiArticle;
  meta: {};
}

export const strapiArticlesApi = {
  // Get all articles with pagination and population
  getArticles: async (params?: {
    page?: number;
    pageSize?: number;
    sort?: string;
    filters?: any;
  }): Promise<ArticleResponse> => {
    const queryParams = new URLSearchParams({
      'populate': '*',
      'sort': params?.sort || 'publishedAt:desc',
      'pagination[page]': String(params?.page || 1),
      'pagination[pageSize]': String(params?.pageSize || 25),
      ...(params?.filters && { 'filters': JSON.stringify(params.filters) })
    });

    const response = await api.get(`/articles?${queryParams}`);
    return response.data;
  },

  // Get single article by ID
  getArticle: async (id: string | number): Promise<SingleArticleResponse> => {
    const response = await api.get(`/articles/${id}?populate=*`);
    return response.data;
  },

  // Get all authors
  getAuthors: async (): Promise<{ data: Author[] }> => {
    const response = await api.get('/authors?populate=*');
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<{ data: Category[] }> => {
    const response = await api.get('/categories?populate=*');
    return response.data;
  },

  // Get articles by category
  getArticlesByCategory: async (categorySlug: string): Promise<ArticleResponse> => {
    const response = await api.get(`/articles?populate=*&filters[category][slug][$eq]=${categorySlug}&sort=publishedAt:desc`);
    return response.data;
  },

  // Get articles by author
  getArticlesByAuthor: async (authorId: number): Promise<ArticleResponse> => {
    const response = await api.get(`/articles?populate=*&filters[author][id][$eq]=${authorId}&sort=publishedAt:desc`);
    return response.data;
  },

  // Search articles
  searchArticles: async (query: string): Promise<ArticleResponse> => {
    const response = await api.get(`/articles?populate=*&filters[$or][0][title][$containsi]=${query}&filters[$or][1][description][$containsi]=${query}&sort=publishedAt:desc`);
    return response.data;
  },

  // Create article (authenticated)
  createArticle: async (articleData: any, token?: string): Promise<SingleArticleResponse> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post('/articles', { data: articleData }, { headers });
    return response.data;
  },

  // Update article (authenticated)
  updateArticle: async (id: string | number, articleData: any, token?: string): Promise<SingleArticleResponse> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.put(`/articles/${id}`, { data: articleData }, { headers });
    return response.data;
  },

  // Delete article (authenticated)
  deleteArticle: async (id: string | number, token?: string): Promise<void> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await api.delete(`/articles/${id}`, { headers });
  },
};

// Helper function to transform Strapi v5 article to frontend format
export const transformStrapiArticle = (strapiArticle: StrapiArticle) => ({
  id: strapiArticle.id.toString(),
  title: strapiArticle.title,
  description: strapiArticle.description,
  slug: strapiArticle.slug,
  publishedAt: strapiArticle.publishedAt,
  author: strapiArticle.author?.name || null,
  category: strapiArticle.category?.name || null,
  categorySlug: strapiArticle.category?.slug || null,
  featuredImage: strapiArticle.cover?.url || null,
  imageAlt: strapiArticle.cover?.alternativeText || null,
});

export default strapiArticlesApi;
