import { NextResponse } from "next/server"
import { buildApiUrl } from "@/lib/strapi-config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isBreaking = searchParams.get('IsBreaking')
    
    let newsData: any[] = []
    
    try {
      // Use real Strapi breaking-news/live endpoint
      const localApiUrl = ` https://api.pattaya1.com/api/breaking-news/live`
      console.log('Fetching breaking news from:', localApiUrl)
      const newsResponse = await fetch(localApiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        ...(process.env.NODE_ENV === 'development' && {
          agent: false
        })
      })
      
      if (newsResponse.ok) {
        const newsResult = await newsResponse.json()
        // Use the data directly from Strapi's breaking-news/live endpoint
        newsData = newsResult.data || []
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error)
      // Fallback to mock data with mix of images and no images for testing
      newsData = [
        {
          id: "1",
          title: "Breaking: Local Strapi Backend Test",
          summary: "Testing image display functionality with mock data",
          category: "Technology",
          severity: "medium",
          timestamp: new Date().toISOString(),
          source: "Test Source",
          url: "#",
          isBreaking: true,
          type: "news",
          image: "https://picsum.photos/400/300?random=1",
          imageAlt: "Test image for breaking news",
          imageCaption: "This is a test image caption",
          upvotes: 5,
          downvotes: 2
        },
        {
          id: "2", 
          title: "Weather Update: Sunny Skies Ahead",
          summary: "Beautiful weather expected for the weekend with clear blue skies and perfect conditions for outdoor activities",
          category: "Weather",
          severity: "low",
          timestamp: new Date().toISOString(),
          source: "Weather Service",
          url: "#",
          isBreaking: false,
          type: "news",
          image: null,
          imageAlt: "",
          imageCaption: ""
        },
        {
          id: "3",
          title: "Pattaya Police Chief Proposes Modern 24-Storey Police Station",
          summary: "New police headquarters will feature modern facilities and housing complex for officers",
          category: "Government",
          severity: "medium",
          timestamp: new Date().toISOString(),
          source: "The Pattaya News",
          url: "#",
          isBreaking: false,
          type: "news",
          image: "https://thepattayanews.com/wp-content/uploads/2025/09/1757096816725-300x169.jpg?v=1757097327",
          imageAlt: "Police station architectural plans",
          imageCaption: "Proposed 24-storey police station design",
          upvotes: 8,
          downvotes: 0
        },
        {
          id: "4",
          title: "City Council Meeting Scheduled for Next Week",
          summary: "Important municipal decisions to be discussed including budget allocations and infrastructure projects for the upcoming fiscal year",
          category: "Government",
          severity: "low",
          timestamp: new Date().toISOString(),
          source: "City Hall",
          url: "#",
          isBreaking: false,
          type: "news",
          image: null,
          imageAlt: "",
          imageCaption: "",
          upvotes: 2,
          downvotes: 0
        },
        {
          id: "5",
          title: "Transgender Woman Attacks Indian Tourist with High Heel",
          summary: "Incident occurred on Pattaya Beach involving dispute over tourist services",
          category: "Crime",
          severity: "high",
          timestamp: new Date().toISOString(),
          source: "The Pattaya News",
          url: "#",
          isBreaking: true,
          type: "news",
          image: "https://thepattayanews.com/wp-content/uploads/2025/09/IMG_20250906_014505-300x169.jpg?v=1757097972",
          imageAlt: "Pattaya Beach incident scene",
          imageCaption: "Location where the incident took place",
          upvotes: 12,
          downvotes: 3
        },
        {
          id: "6",
          title: "Local Business Association Announces New Initiatives",
          summary: "Chamber of Commerce reveals plans to support small businesses with new funding opportunities and networking events throughout the region",
          category: "Business",
          severity: "low",
          timestamp: new Date().toISOString(),
          source: "Business Weekly",
          url: "#",
          isBreaking: false,
          type: "news",
          image: null,
          imageAlt: "",
          imageCaption: "",
          upvotes: 1,
          downvotes: 0
        }
      ]
    }
    
    // Create sponsored posts with proper sponsor names
    let sponsoredData = []
    try {
      const localSponsoredUrl = ` https://api.pattaya1.com/api/sponsored-posts?populate=*&filters[IsActive][$eq]=true`
      console.log('Fetching sponsored posts from:', localSponsoredUrl)
      const sponsoredResponse = await fetch(localSponsoredUrl, {
        headers: {
          'Accept': 'application/json',
        },
        // Ignore SSL certificate errors in development
        ...(process.env.NODE_ENV === 'development' && {
          agent: false
        })
      })
      if (sponsoredResponse.ok) {
        const sponsoredResult = await sponsoredResponse.json()
        sponsoredData = sponsoredResult.data?.map((item: any) => ({
          id: item.id.toString(),
          title: item.Title,
          summary: item.Summary,
          category: "Sponsored",
          severity: 'medium',
          timestamp: item.publishedAt,
          source: item.Sponsor || item.SponsorName || 'Sponsored Content',
          url: item.URL || '#',
          isBreaking: false,
          type: 'sponsored',
          image: item.FeaturedImage || item.Image || item.ImageURL,
          imageAlt: item.ImageAlt || '',
          imageCaption: item.ImageCaption || '',
          sponsorName: item.Sponsor || item.SponsorName || 'Sponsored',
          sponsorLogo: item.SponsorLogo,
          displayPosition: item.DisplayPosition || 'position-3',
          impressionCount: item.ImpressionCount || 0,
          clickCount: item.ClickCount || 0
        })) || []
      }
    } catch (error) {
      // Sponsored posts not available
    }
    
    
    // Mix content based on display positions
    const mixedContent = [...newsData]
    
    // Insert sponsored posts at specified positions
    sponsoredData.forEach((sponsoredPost: any) => {
      const position = sponsoredPost.displayPosition
      if (position === 'top') {
        mixedContent.unshift(sponsoredPost)
      } else if (position === 'bottom') {
        mixedContent.push(sponsoredPost)
      } else if (position.startsWith('position-')) {
        const pos = parseInt(position.split('-')[1]) - 1
        if (pos >= 0 && pos < mixedContent.length) {
          mixedContent.splice(pos, 0, sponsoredPost)
        } else {
          mixedContent.push(sponsoredPost)
        }
      }
    })
    
  }
} catch (error) {
  console.error('Error fetching breaking news:', error)
  // Fallback to mock data with mix of images and no images for testing
  newsData = [
    {
      id: "1",
      title: "Breaking: Local Strapi Backend Test",
      summary: "Testing image display functionality with mock data",
      category: "Technology",
      severity: "medium",
      timestamp: new Date().toISOString(),
      source: "Test Source",
      url: "#",
      isBreaking: true,
      type: "news",
      image: "https://picsum.photos/400/300?random=1",
      imageAlt: "Test image for breaking news",
      imageCaption: "This is a test image caption",
      upvotes: 5,
      downvotes: 2
    },
    {
      id: "2", 
      title: "Weather Update: Sunny Skies Ahead",
      summary: "Beautiful weather expected for the weekend with clear blue skies and perfect conditions for outdoor activities",
      category: "Weather",
      severity: "low",
      timestamp: new Date().toISOString(),
      source: "Weather Service",
      url: "#",
      isBreaking: false,
      type: "news",
      image: null,
      imageAlt: "",
      imageCaption: ""
    },
    {
      id: "3",
      title: "Pattaya Police Chief Proposes Modern 24-Storey Police Station",
      summary: "New police headquarters will feature modern facilities and housing complex for officers",
      category: "Government",
      severity: "medium",
      timestamp: new Date().toISOString(),
      source: "The Pattaya News",
      url: "#",
      isBreaking: false,
      type: "news",
      image: "https://thepattayanews.com/wp-content/uploads/2025/09/1757096816725-300x169.jpg?v=1757097327",
      imageAlt: "Police station architectural plans",
      imageCaption: "Proposed 24-storey police station design",
      upvotes: 8,
      downvotes: 0
    },
    {
      id: "4",
      title: "City Council Meeting Scheduled for Next Week",
      summary: "Important municipal decisions to be discussed including budget allocations and infrastructure projects for the upcoming fiscal year",
      category: "Government",
      severity: "low",
      timestamp: new Date().toISOString(),
      source: "City Hall",
      url: "#",
      isBreaking: false,
      type: "news",
      image: null,
      imageAlt: "",
      imageCaption: "",
      upvotes: 2,
      downvotes: 0
    },
    {
      id: "5",
      title: "Transgender Woman Attacks Indian Tourist with High Heel",
      summary: "Incident occurred on Pattaya Beach involving dispute over tourist services",
      category: "Crime",
      severity: "high",
      timestamp: new Date().toISOString(),
      source: "The Pattaya News",
      url: "#",
      isBreaking: true,
      type: "news",
      image: "https://thepattayanews.com/wp-content/uploads/2025/09/IMG_20250906_014505-300x169.jpg?v=1757097972",
      imageAlt: "Pattaya Beach incident scene",
      imageCaption: "Location where the incident took place",
      upvotes: 12,
      downvotes: 3
    },
    {
      id: "6",
      title: "Local Business Association Announces New Initiatives",
      summary: "Chamber of Commerce reveals plans to support small businesses with new funding opportunities and networking events throughout the region",
      category: "Business",
      severity: "low",
      timestamp: new Date().toISOString(),
      source: "Business Weekly",
      url: "#",
      isBreaking: false,
      type: "news",
      image: null,
      imageAlt: "",
      imageCaption: "",
      upvotes: 1,
      downvotes: 0
    }
  ]
}
    
// Create sponsored posts with proper sponsor names
let sponsoredData = []
try {
  const localSponsoredUrl = ` https://api.pattaya1.com/api/sponsored-posts?populate=*&filters[IsActive][$eq]=true`
  console.log('Fetching sponsored posts from:', localSponsoredUrl)
  const sponsoredResponse = await fetch(localSponsoredUrl, {
    headers: {
      'Accept': 'application/json',
    },
    // Ignore SSL certificate errors in development
    ...(process.env.NODE_ENV === 'development' && {
      agent: false
    })
  })
  if (sponsoredResponse.ok) {
    const sponsoredResult = await sponsoredResponse.json()
    sponsoredData = sponsoredResult.data?.map((item: any) => ({
      id: item.id.toString(),
      title: item.Title,
      summary: item.Summary,
      category: "Sponsored",
      severity: 'medium',
      timestamp: item.publishedAt,
      source: item.Sponsor || item.SponsorName || 'Sponsored Content',
      url: item.URL || '#',
      isBreaking: false,
      type: 'sponsored',
      image: item.FeaturedImage || item.Image || item.ImageURL,
      imageAlt: item.ImageAlt || '',
      imageCaption: item.ImageCaption || '',
      sponsorName: item.Sponsor || item.SponsorName || 'Sponsored',
      sponsorLogo: item.SponsorLogo,
      displayPosition: item.DisplayPosition || 'position-3',
      impressionCount: item.ImpressionCount || 0,
      clickCount: item.ClickCount || 0
    })) || []
  }
} catch (error) {
  // Sponsored posts not available
}
    
    
// Mix content based on display positions
const mixedContent = [...newsData]
    
// Insert sponsored posts at specified positions
sponsoredData.forEach((sponsoredPost: any) => {
  const position = sponsoredPost.displayPosition
  if (position === 'top') {
    mixedContent.unshift(sponsoredPost)
  } else if (position === 'bottom') {
    mixedContent.push(sponsoredPost)
  } else if (position.startsWith('position-')) {
    const pos = parseInt(position.split('-')[1]) - 1
    if (pos >= 0 && pos < mixedContent.length) {
      mixedContent.splice(pos, 0, sponsoredPost)
    } else {
      mixedContent.push(sponsoredPost)
    }
  }
})
    
// Calculate metadata
const newsCount = mixedContent.filter(item => item.type === 'news').length
const sponsoredCount = mixedContent.filter(item => item.type === 'sponsored').length
const breakingCount = mixedContent.filter(item => item.isBreaking).length

// Separate regular and pinned news
const regularNews = mixedContent.filter(item => !item.isPinned);
const pinnedNews = mixedContent.filter(item => item.isPinned);

return NextResponse.json({
  data: regularNews,
  pinnedNews: pinnedNews,
  meta: {
    total: mixedContent.length,
    newsCount: newsCount,
    sponsoredCount: sponsoredCount,
    breakingCount: breakingCount,
    pinnedCount: pinnedNews.length
  }
});  
} catch (error) {
  console.error("Error fetching mixed content:", error)
  return NextResponse.json({ error: "Failed to fetch mixed content" }, { status: 500 })
}
