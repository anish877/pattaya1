# Environment Configuration Guide

This document outlines all the environment variables that should be used instead of hardcoded `localhost:1337` URLs in the frontend application.

## Required Environment Variables

### Strapi Configuration
```bash
# Replace localhost:1337 with your actual Strapi backend URL
NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com
STRAPI_URL=https://api.pattaya1.com

# API Configuration
NEXT_PUBLIC_API_URL=https://api.pattaya1.com/api

# Strapi Admin Configuration
ADMIN_URL=https://api.pattaya1.com
```

### Firebase Configuration
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Stripe Configuration
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### JWT Configuration
```bash
JWT_SECRET=your-jwt-secret-key
```

### External API Keys
```bash
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
YOUTUBE_API_KEY=your_youtube_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
EVENTBRITE_API_TOKEN=your_eventbrite_api_token
```

### SMTP Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

### Strapi API Token
```bash
STRAPI_API_TOKEN=your_strapi_api_token
```

### Development vs Production
```bash
NODE_ENV=development
```

## Setup Instructions

1. **Create `.env.local` file** in your project root:
   ```bash
   cp environment-config.md .env.local
   ```

2. **Update the values** with your actual configuration

3. **Restart your development server** after making changes

## Files Updated

The following files have been updated to use environment variables instead of hardcoded URLs:

### Components
- `components/news/strapi-articles-feed.tsx` - Uses `buildStrapiUrl()` function
- `components/widgets/enhanced-weather-widget.tsx` - Uses `buildApiUrl()` function
- `app/articles/[id]/page.tsx` - Uses `buildStrapiUrl()` function

### API Routes
- `app/api/global-sponsorships/route.ts` - Uses `buildApiUrl()` function
- `app/api/forum/categories/route.ts` - Already using `buildApiUrl()` function
- `app/api/forum/topics/route.ts` - Already using `buildApiUrl()` function
- `app/api/weather/update/route.ts` - Already using `buildApiUrl()` function

### Test Scripts
- `test-with-auth.js` - Uses environment variables
- `test-business-apis.js` - Uses environment variables
- `test-business-comprehensive.js` - Uses environment variables
- `test-create-business.js` - Uses environment variables
- `test-business-simple.js` - Uses environment variables
- `test-business-standard.js` - Uses environment variables
- `test-owner-field.js` - Uses environment variables
- `scripts/verify-strapi-endpoints.js` - Uses environment variables

### Configuration Files
- `lib/strapi-config.ts` - Already properly configured with environment variables

## Usage Examples

### In Components
```typescript
import { buildStrapiUrl, buildApiUrl } from '@/lib/strapi-config';

// For images and assets
const imageUrl = buildStrapiUrl(article.featuredImage);

// For API calls
const apiUrl = buildApiUrl('weather/settings');
```

### In Test Scripts
```javascript
require('dotenv').config();

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 
                   process.env.STRAPI_URL || 
                   'https://api.pattaya1.com';

const response = await fetch(`${STRAPI_URL}/api/businesses`);
```

## Benefits

1. **Environment Flexibility**: Easy to switch between development, staging, and production
2. **Security**: Sensitive URLs and keys are not hardcoded in source code
3. **Maintainability**: Single place to update backend URLs
4. **Deployment Ready**: Works with different deployment environments
5. **Team Collaboration**: Developers can use different backend URLs

## Troubleshooting

If you encounter issues:

1. **Check environment variables**: Ensure `.env.local` is properly configured
2. **Restart server**: Environment changes require server restart
3. **Verify fallbacks**: Check that fallback URLs are working
4. **Check console logs**: Look for environment variable loading errors 