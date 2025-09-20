import { NextResponse } from "next/server"

interface SearchHit {
  title: string
  content: string
  source: string
  category: string
  url: string
  contentType: string
  publishedAt: string
  featuredImage?: string
  isBreaking?: boolean
  severity?: string
  sponsorName?: string
  type?: string
}

// All supported content types
const CONTENT_TYPES = [
  // News & Content
  'breaking-news', 'news-article', 'sponsored-post', 'social-media-post',
  
  // Business & Commerce  
  'business', 'business-spotlight', 'deal', 'advertisement', 'review', 'google-review',
  
  // Events & Entertainment
  'event', 'event-calendar', 'live-event', 'radio-station', 'youtube-video',
  
  // Travel & Local
  'booking', 'traffic-incident', 'traffic-route', 'weather', 'weather-activity-suggestion',
  
  // Content Organization
  'author', 'category', 'photo-gallery', 'trending-topic',
  
  // System & Configuration
  'about', 'global', 'global-sponsorship', 'quick-link', 'widget-control',
  
  // Community
  'forum-activity'
]

// Map content types to Strapi collection names
const STRAPI_COLLECTIONS = {
  'breaking-news': 'breaking-news-plural',
  'sponsored-post': 'sponsored-posts',
  'business': 'businesses',
  'event': 'events',
  'review': 'reviews',
  'deal': 'deals',
  'booking': 'bookings',
  'photo-gallery': 'photo-galleries',
  'youtube-video': 'youtube-videos',
  'radio-station': 'radio-stations',
  'live-event': 'live-events',
  'traffic-incident': 'traffic-incidents',
  'weather': 'weather-data',
  'forum-activity': 'forum-activities',
  'google-review': 'google-reviews',
  'quick-link': 'quick-links',
  'trending-topic': 'trending-topics'
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ' http://localhost:1337'

async function fetchFromStrapi(collection: string, contentType: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/api/${collection}?populate=*&pagination[limit]=100`, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (!response.ok) return []
    
    const result = await response.json()
    return result.data?.map((item: any) => normalizeItem(item, contentType)) || []
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error)
    return []
  }
}

function normalizeItem(item: any, contentType: string): SearchHit {
  const attrs = item.attributes || item
  
  // Common field mappings
  const baseItem = {
    title: attrs.Title || attrs.Name || attrs.title || attrs.name || 'Untitled',
    content: attrs.Summary || attrs.Content || attrs.Description || attrs.content || '',
    source: attrs.Source || attrs.Sponsor || attrs.Author || attrs.source || 'Unknown',
    category: attrs.Category || attrs.Type || attrs.category || contentType,
    url: attrs.URL || attrs.Link || attrs.url || '#',
    contentType,
    publishedAt: attrs.PublishedTimestamp || attrs.createdAt || attrs.publishedAt || new Date().toISOString(),
    featuredImage: attrs.ImageURL || attrs.Image?.url || attrs.featuredImage || attrs.image,
    type: contentType
  }

  // Content-type specific mappings
  switch (contentType) {
    case 'breaking-news':
      return {
        ...baseItem,
        isBreaking: attrs.IsBreaking || false,
        severity: attrs.Severity || 'medium'
      }
    case 'sponsored-post':
      return {
        ...baseItem,
        sponsorName: attrs.Sponsor || attrs.sponsorName,
        severity: 'low'
      }
    case 'business':
      return {
        ...baseItem,
        content: attrs.Description || attrs.Summary || '',
        category: 'Business'
      }
    case 'event':
      return {
        ...baseItem,
        content: attrs.Description || attrs.Summary || '',
        category: 'Event'
      }
    default:
      return baseItem
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const page = parseInt(searchParams.get("page") || "0")
    const hitsPerPage = parseInt(searchParams.get("hitsPerPage") || "10")
    const filters = searchParams.get("filters") || ""

    if (!query.trim()) {
      return NextResponse.json({
        data: [],
        meta: {
          pagination: {
            page: 0,
            pageSize: hitsPerPage,
            pageCount: 0,
            total: 0
          }
        }
      })
    }

    // Parse filters
    const filterMap: Record<string, string> = {}
    if (filters) {
      filters.split(',').forEach(filter => {
        const [key, value] = filter.split(':')
        if (key && value) {
          filterMap[key] = value
        }
      })
    }

    let allResults: any[] = []

    // Try to search breaking news from Strapi
    try {
      const newsResponse = await fetch(`${API_BASE}/api/breaking-news-plural?populate=*&pagination[limit]=50`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      })
      
      if (newsResponse.ok) {
        const newsResult = await newsResponse.json()
        const newsItems = newsResult.data || []
        
        // Filter and transform news items
        const newsResults = newsItems
          .filter((item: any) => {
            const title = item.Title || item.attributes?.Title || ""
            const content = item.Content || item.attributes?.Content || ""
            const category = item.Category || item.attributes?.Category || ""
            const source = item.Source || item.attributes?.Source || ""
            
            // Apply search query filter
            const searchText = `${title} ${content} ${category} ${source}`.toLowerCase()
            const matchesQuery = searchText.includes(query.toLowerCase())
            
            // Apply additional filters
            if (filterMap.category && category !== filterMap.category) return false
            if (filterMap.source && source !== filterMap.source) return false
            if (filterMap.contentType && filterMap.contentType !== 'breaking-news') return false
            
            return matchesQuery
          })
          .map((item: any) => {
            const title = item.Title || item.attributes?.Title || ""
            const content = item.Content || item.attributes?.Content || ""
            const category = item.Category || item.attributes?.Category || ""
            const source = item.Source || item.attributes?.Source || ""
            const publishedAt = item.PublishedTimestamp || item.attributes?.PublishedTimestamp || new Date().toISOString()
            const featuredImage = item.FeaturedImage?.url || item.attributes?.FeaturedImage?.data?.attributes?.url
            const isBreaking = item.IsBreaking || item.attributes?.IsBreaking || false
            const severity = item.Severity || item.attributes?.Severity || "medium"
            
            return {
              title: highlightText(title, query),
              content: highlightText(content.substring(0, 200) + "...", query),
              source: source || "Pattaya1 News",
              category: category || "News",
              url: `/articles/${item.id}`,
              contentType: "breaking-news",
              publishedAt,
              featuredImage,
              isBreaking,
              severity
            }
          })
        
        allResults.push(...newsResults)
      }
    } catch (error) {
      console.log('Breaking news fetch failed, using fallback data')
    }

    // Try to search sponsored posts from Strapi
    try {
      const sponsoredResponse = await fetch(`${API_BASE}/api/breaking-news-plural?populate=*&filters[type][$eq]=sponsored&pagination[limit]=20`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      })
      
      if (sponsoredResponse.ok) {
        const sponsoredResult = await sponsoredResponse.json()
        const sponsoredItems = sponsoredResult.data || []
        
        const sponsoredResults = sponsoredItems
          .filter((item: any) => {
            const title = item.Title || item.attributes?.Title || ""
            const content = item.Content || item.attributes?.Content || ""
            const sponsorName = item.sponsorName || item.attributes?.sponsorName || ""
            
            const searchText = `${title} ${content} ${sponsorName}`.toLowerCase()
            const matchesQuery = searchText.includes(query.toLowerCase())
            
            if (filterMap.contentType && filterMap.contentType !== 'sponsored-post') return false
            
            return matchesQuery
          })
          .map((item: any) => {
            const title = item.Title || item.attributes?.Title || ""
            const content = item.Content || item.attributes?.Content || ""
            const sponsorName = item.sponsorName || item.attributes?.sponsorName || ""
            const publishedAt = item.PublishedTimestamp || item.attributes?.PublishedTimestamp || new Date().toISOString()
            const featuredImage = item.FeaturedImage?.url || item.attributes?.FeaturedImage?.data?.attributes?.url
            
            return {
              title: highlightText(title, query),
              content: highlightText(content.substring(0, 200) + "...", query),
              source: "Sponsored Content",
              category: "Sponsored",
              url: `/articles/${item.id}`,
              contentType: "sponsored-post",
              publishedAt,
              featuredImage,
              sponsorName,
              type: "sponsored"
            }
          })
        
        allResults.push(...sponsoredResults)
      }
    } catch (error) {
      console.log('Sponsored posts fetch failed, using fallback data')
    }

    // No fallback demo data. Only return real API results.

    // Remove duplicates based on title
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.title === item.title)
    )

    // Sort by relevance and date
    uniqueResults.sort((a, b) => {
      // Prioritize breaking news
      if (a.isBreaking && !b.isBreaking) return -1
      if (!a.isBreaking && b.isBreaking) return 1
      
      // Then by date
      const aDate = new Date(a.publishedAt).getTime()
      const bDate = new Date(b.publishedAt).getTime()
      return bDate - aDate
    })

    // Pagination
    const startIndex = page * hitsPerPage
    const endIndex = startIndex + hitsPerPage
    const paginatedResults = uniqueResults.slice(startIndex, endIndex)

    return NextResponse.json({
      data: paginatedResults,
      meta: {
        pagination: {
          page,
          pageSize: hitsPerPage,
          pageCount: Math.ceil(uniqueResults.length / hitsPerPage),
          total: uniqueResults.length
        },
        query,
        filters: filterMap,
        hasApiData: allResults.length > 0
      }
    })

  } catch (error) {
    console.error("Unified search error:", error)
    return NextResponse.json({ 
      error: "Search failed",
      data: [],
      meta: {
        pagination: {
          page: 0,
          pageSize: 10,
          pageCount: 0,
          total: 0
        }
      }
    }, { status: 500 })
  }
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
