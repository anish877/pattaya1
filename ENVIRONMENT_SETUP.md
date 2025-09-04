# Environment Setup Guide

## Overview
All hardcoded `localhost:1337` URLs have been replaced with environment variables for better configuration management and deployment flexibility.

## Environment Variables Required

### Required Variables
```bash
# Strapi Configuration
NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com

# For production, use your Strapi Cloud URL:
# NEXT_PUBLIC_STRAPI_URL=https://your-strapi-app.strapiapp.com
```

### Optional Variables (for additional features)
```bash
# Strapi API Token (for server-side operations)
STRAPI_API_TOKEN=your-strapi-api-token

# Cloudinary (for image uploads)
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-api-key
CLOUDINARY_SECRET=your-cloudinary-api-secret

# SendGrid (for email)
SENDGRID_API_KEY=your-sendgrid-api-key
ADMIN_EMAIL=admin@yourdomain.com

# Admin URL (for Strapi admin panel)
ADMIN_URL=https://api.pattaya1.com
```

## Files Updated

### New Configuration Files
- `lib/strapi-config.ts` - Centralized Strapi URL configuration and helper functions

### Updated Files
- `lib/firebase.ts` - Now uses centralized Strapi configuration
- `app/api/weather/update/route.ts` - Uses `buildApiUrl()` helper
- `app/api/forum/categories/route.ts` - Uses `buildApiUrl()` helper
- `app/api/forum/topics/route.ts` - Uses `buildApiUrl()` helper
- `components/widgets/google-reviews-widget.tsx` - Uses `buildApiUrl()` helper
- `components/homepage/widgets/*.tsx` - All widget components updated
- `test-strapi-integration.js` - Already using environment variables
- `test-business-spotlight-widget.js` - Updated to use environment variables
- `strapi-cloud-template-blog-e51185d3a4/config/plugins.js` - Updated admin URL

## Helper Functions

### `buildStrapiUrl(path: string)`
Builds full URLs for Strapi assets (images, files, etc.)
```typescript
import { buildStrapiUrl } from "@/lib/strapi-config"

// Example usage
const imageUrl = buildStrapiUrl("/uploads/image.jpg")
// Result: "https://api.pattaya1.com/uploads/image.jpg" (or your production URL)
```

### `buildApiUrl(endpoint: string)`
Builds full URLs for Strapi API endpoints
```typescript
import { buildApiUrl } from "@/lib/strapi-config"

// Example usage
const apiUrl = buildApiUrl("news-articles?populate=*")
// Result: "https://api.pattaya1.com/api/news-articles?populate=*" (or your production URL)
```

## Setup Instructions

### 1. Create Environment File
Create a `.env.local` file in your project root:
```bash
# Development
NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com

# Production (replace with your actual Strapi URL)
# NEXT_PUBLIC_STRAPI_URL=https://your-strapi-app.strapiapp.com
```

### 2. Update Strapi Configuration
In your Strapi project, update the admin URL in `config/plugins.js`:
```javascript
'admin-url': env('ADMIN_URL', 'https://api.pattaya1.com'),
```

### 3. Restart Development Server
After adding environment variables, restart your Next.js development server:
```bash
npm run dev
```

## Benefits

1. **Environment Flexibility**: Easy switching between development and production URLs
2. **Security**: No hardcoded URLs in source code
3. **Maintainability**: Centralized configuration management
4. **Deployment Ready**: Works seamlessly across different environments
5. **Type Safety**: TypeScript support for URL building functions

## Migration Notes

- All existing functionality remains unchanged
- Widget sizes and content are preserved
- Only the URL configuration has been updated
- Backward compatibility maintained with fallback to localhost:1337

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env.local` is in the project root
   - Restart the development server
   - Check that variable names start with `NEXT_PUBLIC_` for client-side access

2. **Images not loading**
   - Verify `NEXT_PUBLIC_STRAPI_URL` is set correctly
   - Check that Strapi is running and accessible
   - Ensure image paths in Strapi are correct

3. **API calls failing**
   - Verify the Strapi API is accessible
   - Check network connectivity
   - Review browser console for CORS errors

### Debug Mode
Enable debug logging by adding to your environment:
```bash
DEBUG_STRAPI=true
```

This will log all Strapi API calls to the console for debugging purposes. 