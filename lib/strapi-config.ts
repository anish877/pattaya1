// Strapi configuration and URL utilities
export const STRAPI_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_STRAPI_URL || "https://api.pattaya1.com",
  apiUrl: process.env.NEXT_PUBLIC_STRAPI_URL 
    ? `${process.env.NEXT_PUBLIC_STRAPI_URL}/api` 
    : "https://api.pattaya1.com/api",
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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${STRAPI_CONFIG.apiUrl}/${cleanEndpoint}`
} 