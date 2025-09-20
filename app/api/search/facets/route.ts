import { NextResponse } from 'next/server'

export async function GET() {
  // Minimal facets so Site search UI can render filters without 405s
  const data = {
    categories: ['News', 'Safety', 'Events', 'Business', 'Travel'],
    sources: ['Pattaya1 News', 'Community', 'Official'],
    contentTypes: ['breaking-news', 'article', 'event', 'sponsored-post'],
    severities: ['low', 'medium', 'high'],
  }
  return NextResponse.json({ data })
}



