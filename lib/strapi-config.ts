// Strapi configuration and URL utilities
// Prefer env vars; fallback to sensible defaults
const FALLBACK_BASE = process.env.NODE_ENV === 'production' ? "https://api.pattaya1.com" : "http://localhost:1337"
const FALLBACK_API = `${FALLBACK_BASE}/api`

export const STRAPI_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_STRAPI_BASE_URL || FALLBACK_BASE,
  apiUrl: process.env.NEXT_PUBLIC_STRAPI_API_URL || FALLBACK_API,
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