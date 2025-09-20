// Strapi configuration and URL utilities
// Prefer env vars; fallback to sensible defaults
const FALLBACK_BASE = process.env.NODE_ENV === 'production' ? "https://api.pattaya1.com" : "http://localhost:1337"

// Support both NEXT_PUBLIC_STRAPI_BASE_URL and legacy NEXT_PUBLIC_STRAPI_URL
const ENV_BASE = process.env.NEXT_PUBLIC_STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_URL
const BASE_URL = ENV_BASE || FALLBACK_BASE

// If explicit API URL provided, use it; otherwise derive from base
const ENV_API = process.env.NEXT_PUBLIC_STRAPI_API_URL
const API_URL = ENV_API || `${BASE_URL}/api`

export const STRAPI_CONFIG = {
  baseUrl: BASE_URL,
  apiUrl: API_URL,
}

// Helper function to build full URLs for Strapi assets
export function buildStrapiUrl(path: string): string {
  if (!path) return ""
  
  // If path is already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  return `${STRAPI_CONFIG.baseUrl}/${cleanPath}`
}

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
  if (!endpoint) return STRAPI_CONFIG.apiUrl
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${STRAPI_CONFIG.apiUrl}/${cleanEndpoint}`
}