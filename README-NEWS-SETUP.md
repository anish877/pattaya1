# Breaking News Frontend Integration Setup

## Environment Configuration

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_API_URL=https://api.pattaya1.com/api
```

## Available Routes

- `/breaking-news` - Public breaking news feed
- `/admin/news` - Admin dashboard for news moderation
- `/news` - Enhanced news page with breaking news + existing aggregator

## API Service

The news API service is available at `lib/news-api.ts` with full TypeScript support.

## Components Created

- `BreakingNewsCard` - Individual news article card with voting/pinning
- `BreakingNewsFeed` - Complete news feed with refresh functionality  
- `NewsAdminDashboard` - Admin interface for moderation

## Testing

Run the connection test:
```bash
node scripts/test-news-connection.js
```

## Next Steps

1. Ensure Strapi backend is running on `https://api.pattaya1.com`
2. Set up the breaking news content type in Strapi admin
3. Add the environment variable
4. Start the frontend: `npm run dev`
5. Visit the news routes to test integration

## Backend Requirements

The backend should have these endpoints configured:
- `GET /api/breaking-news/live` - Live approved articles
- `GET /api/breaking-news/dashboard` - Admin dashboard data
- `POST /api/breaking-news/:id/pin` - Pin/unpin functionality
- `POST /api/breaking-news/:id/upvote` - Voting system
- `POST /api/breaking-news/fetch-news` - Manual news fetching
