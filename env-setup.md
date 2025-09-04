# Environment Setup for Breaking News Integration

Create a `.env.local` file in your project root with the following content:

```env
# Strapi Backend API Configuration
NEXT_PUBLIC_API_URL=https://api.pattaya1.com/api

# Firebase Configuration (if needed)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Other existing environment variables...
```

## Quick Setup Commands

1. Create the environment file:
```bash
echo "NEXT_PUBLIC_API_URL=https://api.pattaya1.com/api" > .env.local
```

2. Start the development server:
```bash
npm run dev
```

3. Test the connection:
```bash
node scripts/test-news-connection.js
```

## Available Routes After Setup

- `http://localhost:3000/news` - Enhanced news with breaking news integration
- `http://localhost:3000/breaking-news` - Dedicated breaking news page  
- `http://localhost:3000/admin/news` - Admin dashboard for news moderation
