# Build Fix Guide - Environment Variables

## 🚨 Build Error Fixed

The build was failing with this error:
```
Error: Neither apiKey nor config.authenticator provided
```

This was caused by missing environment variables during the build process, specifically `STRIPE_SECRET_KEY`.

## ✅ What Was Fixed

### 1. Stripe API Routes
- **`app/api/create-payment-intent/route.ts`** - Added conditional Stripe initialization
- **`app/api/webhooks/stripe/route.ts`** - Added conditional Stripe initialization

### 2. Error Handling
- Added checks for missing Stripe configuration
- Added graceful fallbacks when environment variables are not available
- Prevents build-time crashes due to missing API keys

## 🔧 Required Environment Variables for Build

Create a `.env.local` file in your `pattaya1` directory with these variables:

### Essential for Build Success
```bash
# Stripe Configuration (Required for build)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Strapi Configuration
NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com
STRAPI_URL=https://api.pattaya1.com
NEXT_PUBLIC_API_URL=https://api.pattaya1.com/api

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Strapi API Token
STRAPI_API_TOKEN=your_strapi_api_token
```

### Optional (for full functionality)
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# External API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
YOUTUBE_API_KEY=your_youtube_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
EVENTBRITE_API_TOKEN=your_eventbrite_api_token

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

## 🚀 Quick Fix Steps

1. **Create `.env.local` file**:
   ```bash
   cd pattaya1
   touch .env.local
   ```

2. **Add minimum required variables**:
   ```bash
   echo "STRIPE_SECRET_KEY=sk_test_placeholder" >> .env.local
   echo "STRIPE_WEBHOOK_SECRET=whsec_placeholder" >> .env.local
   echo "NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com" >> .env.local
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## 🔍 How the Fix Works

### Before (Causing Build Failure)
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});
```

### After (Build-Safe)
```typescript
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// Check before using
if (!stripe) {
  return NextResponse.json(
    { error: 'Stripe is not configured. Please check your environment variables.' },
    { status: 500 }
  );
}
```

## 🧪 Testing the Fix

1. **Local Development**:
   ```bash
   npm run build  # Should now succeed
   npm run dev    # Should work with proper error handling
   ```

2. **Production Build**:
   ```bash
   npm run build  # Should complete without Stripe errors
   ```

3. **API Testing**:
   - Payment intent creation will return proper error if Stripe not configured
   - Webhooks will return proper error if not configured
   - No more build-time crashes

## 🚨 Common Issues & Solutions

### Issue: "Stripe is not configured" error
**Solution**: Add `STRIPE_SECRET_KEY` to your `.env.local` file

### Issue: Build still fails
**Solution**: Ensure all required environment variables are set

### Issue: API returns 500 errors
**Solution**: Check that your environment variables have valid values

### Issue: Stripe webhooks not working
**Solution**: Verify `STRIPE_WEBHOOK_SECRET` is set correctly

## 📋 Environment Variable Priority

1. **`.env.local`** (highest priority - for local development)
2. **`.env`** (for default values)
3. **System environment variables** (for production)
4. **Hardcoded fallbacks** (lowest priority - for development)

## 🔒 Security Notes

- **Never commit `.env.local`** to version control
- **Use test keys** for development
- **Rotate production keys** regularly
- **Use environment-specific configurations** for different deployments

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) 