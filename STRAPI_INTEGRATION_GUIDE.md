# Firebase + Strapi Integration Guide for Pattaya1

## Overview

This guide explains how to integrate your Pattaya1 frontend with the Strapi backend that has Firebase Authentication enabled.

## 🔧 **Setup Instructions**

### 1. Environment Variables

Create a `.env.local` file in your `pattaya1` directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Strapi Configuration
NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com

# JWT Secret (for email verification)
JWT_SECRET=your-jwt-secret-key
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Copy the configuration values to your `.env.local` file

### 3. Strapi Configuration

1. Make sure your Strapi backend is running
2. For production, replace `https://api.pattaya1.com` with your Strapi Cloud URL
3. Ensure the Firebase Authentication middleware is properly configured

## 🔄 **How It Works**

### Authentication Flow

1. **User Login**: User logs in via Firebase (Email/Password, Google, Facebook, Apple, Line)
2. **Firebase Token**: Firebase provides an ID token
3. **Strapi Sync**: Frontend automatically syncs with Strapi using the Firebase UID
4. **User Creation**: If user doesn't exist in Strapi, they're automatically created
5. **Token Storage**: Firebase ID token is stored for authenticated API calls

### API Calls

- **Authenticated Requests**: Use the `useStrapiAPI` hook for protected endpoints
- **Token Management**: Tokens are automatically refreshed and managed
- **Error Handling**: Automatic retry and error handling for failed requests

## 🚀 **Usage Examples**

### Basic Authentication

```tsx
import { useAuth } from "@/components/auth/auth-provider"

function MyComponent() {
  const { user, loginWithGoogle, logout } = useAuth()

  if (!user) {
    return <button onClick={loginWithGoogle}>Login with Google</button>
  }

  return (
    <div>
      <p>Welcome, {user.displayName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from "@/components/auth/protected-route"

function ProtectedPage() {
  return (
    <ProtectedRoute requireAuth={true} requireStrapi={true}>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  )
}
```

### API Calls

```tsx
import { useStrapiAPI } from "@/hooks/use-strapi-api"

function ApiComponent() {
  const { testProtectedEndpoint, loading, error } = useStrapiAPI()

  const handleTest = async () => {
    const result = await testProtectedEndpoint()
    console.log(result)
  }

  return (
    <div>
      <button onClick={handleTest} disabled={loading}>
        Test API
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

## 🧪 **Testing**

### Test Page

Visit `/test-strapi` to test the integration:

1. **Login**: Use any authentication method
2. **Sync**: Click "Sync with Strapi" to ensure user exists in Strapi
3. **Test Endpoints**: Use the test buttons to verify API calls work
4. **Check Status**: Monitor Firebase and Strapi authentication status

### Manual Testing

```bash
# Start your frontend
npm run dev

# Start your Strapi backend (in another terminal)
cd ../strapi-cloud-template-blog-e51185d3a4
npm run develop

# Visit http://localhost:3000/test-strapi
```

## 🔒 **Security Features**

- **Token Validation**: Firebase ID tokens are validated on every request
- **Automatic Refresh**: Tokens are automatically refreshed when needed
- **Error Handling**: Graceful handling of authentication failures
- **User Sync**: Automatic synchronization between Firebase and Strapi

## 🚨 **Troubleshooting**

### Common Issues

1. **"No authentication token available"**
   - Ensure user is logged in with Firebase
   - Check if Strapi sync completed successfully

2. **"User not found"**
   - User doesn't exist in Strapi
   - Click "Sync with Strapi" to create the user

3. **CORS Errors**
   - Ensure Strapi CORS is configured for your frontend domain
   - Check environment variables are correct

4. **Firebase Configuration Errors**
   - Verify Firebase config in `.env.local`
   - Check Firebase project settings

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test Firebase authentication separately
4. Test Strapi API endpoints directly
5. Check network tab for failed requests

## 📱 **Production Deployment**

### Environment Variables

For production, update your environment variables:

```env
NEXT_PUBLIC_STRAPI_URL=https://your-strapi-cloud-url.com
```

### Build and Deploy

```bash
# Build the application
npm run build

# Deploy to your hosting platform
npm run start
```

## 🔄 **API Reference**

### StrapiAPI Methods

- `registerUser(userData)`: Register user in Strapi
- `loginUser(firebaseUid)`: Login user in Strapi
- `getCurrentUser(token)`: Get current user from Strapi
- `testProtectedEndpoint(token)`: Test protected endpoint
- `getServerStatus()`: Get server status

### Auth Context Methods

- `loginWithEmail(email, password)`: Email/password login
- `loginWithGoogle()`: Google OAuth login
- `loginWithFacebook()`: Facebook OAuth login
- `loginWithApple()`: Apple OAuth login
- `loginWithLine()`: Line OAuth login
- `logout()`: Logout user
- `syncWithStrapi()`: Sync user with Strapi
- `getStrapiToken()`: Get current Strapi token

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Test the integration using the test page
4. Check browser console and network tab for errors
5. Ensure both Firebase and Strapi are properly configured 