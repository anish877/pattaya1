import { NextResponse } from "next/server"
import { buildApiUrl } from "@/lib/strapi-config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isBreaking = searchParams.get('IsBreaking')
    
    let newsData: any[] = []
    let pinnedNewsData: any[] = []
    
    try {
      // Fetch regular breaking news
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
      
      // Fetch pinned news from Strapi backend
      const pinnedApiUrl = ` https://api.pattaya1.com/api/breaking-news-plural?populate=*&filters[isPinned][$eq]=true&sort=PublishedTimestamp:desc`
      console.log('Fetching pinned news from:', pinnedApiUrl)
      const pinnedResponse = await fetch(pinnedApiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        ...(process.env.NODE_ENV === 'development' && {
          agent: false
        })
      })
      
      if (pinnedResponse.ok) {
        const pinnedResult = await pinnedResponse.json()
        pinnedNewsData = pinnedResult.data?.map((item: any) => ({
          id: item.id.toString(),
          title: item.Title || item.attributes?.Title,
          summary: item.Summary || item.attributes?.Summary,
          category: item.Category || item.attributes?.Category,
          severity: item.Severity || item.attributes?.Severity,
          timestamp: item.PublishedTimestamp || item.attributes?.PublishedTimestamp,
          source: item.Source || item.attributes?.Source,
          url: item.URL || item.attributes?.URL,
          isBreaking: item.IsBreaking || item.attributes?.IsBreaking,
          type: 'news',
          image: item.ImageURL || item.attributes?.ImageURL || item.image,
          imageAlt: item.imageAlt || item.attributes?.imageAlt || '',
          imageCaption: item.imageCaption || item.attributes?.imageCaption || '',
          upvotes: item.upvotes || item.attributes?.upvotes || 0,
          downvotes: item.downvotes || item.attributes?.downvotes || 0,
          isPinned: true
        })) || []
        
        console.log(`Fetched ${pinnedNewsData.length} pinned news items from Strapi`)
        if (pinnedNewsData.length > 0) {
          console.log('Live pinned news from Strapi:', pinnedNewsData.map((item: any) => ({ id: item.id, title: item.title })))
        }
      }
      
      // Keep pinned news separate - don't add to regular newsData
      // pinnedNewsData will be handled separately in the response
      
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
          downvotes: 2,
          isPinned: false
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
          imageCaption: "",
          upvotes: 3,
          downvotes: 1,
          isPinned: true
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
          downvotes: 0,
          isPinned: false
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
          downvotes: 0,
          isPinned: false
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
          downvotes: 3,
          isPinned: false
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
          downvotes: 0,
          isPinned: false
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
          clickCount: item.ClickCount || 0,
          isPinned: false
        })) || []
      }
    } catch (error) {
      // Sponsored posts not available
    }
    
    // Mix content based on display positions - only regular news, no pinned
    const regularContent = [...newsData]
    
    // Insert sponsored posts at specified positions in regular content only
    sponsoredData.forEach((sponsoredPost: any) => {
      const position = sponsoredPost.displayPosition
      if (position === 'top') {
        regularContent.unshift(sponsoredPost)
      } else if (position === 'bottom') {
        regularContent.push(sponsoredPost)
      } else if (position.startsWith('position-')) {
        const pos = parseInt(position.split('-')[1]) - 1
        if (pos >= 0 && pos < regularContent.length) {
          regularContent.splice(pos, 0, sponsoredPost)
        } else {
          regularContent.push(sponsoredPost)
        }
      }
    })
    
    // Get pinned news separately from the fetch above
    let pinnedNewsFromApi = []
    try {
      const pinnedApiUrl = ` https://api.pattaya1.com/api/breaking-news-plural?populate=*&filters[isPinned][$eq]=true&sort=PublishedTimestamp:desc`
      const pinnedResponse = await fetch(pinnedApiUrl, {
        headers: { 'Accept': 'application/json' },
        ...(process.env.NODE_ENV === 'development' && { agent: false })
      })
      
      if (pinnedResponse.ok) {
        const pinnedResult = await pinnedResponse.json()
        pinnedNewsFromApi = pinnedResult.data?.map((item: any) => ({
          id: item.id.toString(),
          title: item.Title,
          summary: item.Summary,
          category: item.Category,
          severity: item.Severity,
          timestamp: item.PublishedTimestamp,
          source: item.Source,
          url: item.URL,
          isBreaking: item.IsBreaking,
          type: 'news',
          image: item.ImageURL || item.image,
          imageAlt: item.imageAlt || '',
          imageCaption: item.imageCaption || '',
          upvotes: item.upvotes || 0,
          downvotes: item.downvotes || 0,
          isPinned: true
        })) || []
      }
    // Use live pinned news data from Strapi if available
    let pinnedNewsFromApi = pinnedNewsData;
    console.log(`Using live Strapi pinned news data: ${pinnedNewsFromApi.length} items`)
    
    // Fallback to hardcoded data only if no live pinned news exists
    if (pinnedNewsFromApi.length === 0) {
      console.log('No live pinned news found, using fallback data');
      pinnedNewsFromApi = [
        {
          id: "117",
          documentId: "abmyrcoej1eqt2la4241u4y1",
          title: "Legal Corner: Turn Your UK Pension Into a Thai Retirement Visa. Here's The Blueprint",
          summary: "Comprehensive guide on converting UK pension benefits into Thai retirement visa requirements, including legal procedures and documentation needed.",
          category: "Law, Legal, Courts",
          severity: "medium",
          timestamp: new Date().toISOString(),
          source: "The Pattaya News",
          url: "https://thepattayanews.com/2025/09/06/legal-corner-turn-your-uk-pension-into-a-thai-retirement-visa-heres-the-blueprint/",
          isBreaking: false,
          type: "news",
          image: "https://thepattayanews.com/wp-content/uploads/2025/09/IMG20250904161657-300x226.jpg?v=1757104888",
          imageAlt: "UK Pension Thai Visa Guide",
          imageCaption: "Legal documentation for UK pension visa conversion",
          upvotes: 6,
          downvotes: 1,
          isPinned: true
        },
        {
          id: "pinned-2", 
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
          imageCaption: "",
          upvotes: 3,
          downvotes: 1,
          isPinned: true
        }
      ]
    }

    console.log(`API Response: ${regularContent.length} regular news, ${pinnedNewsFromApi.length} pinned news`);
    
    // Log which specific news items are pinned
    if (pinnedNewsFromApi.length > 0) {
      console.log('Pinned news items:');
      pinnedNewsFromApi.forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${item.id} - "${item.title}" (Category: ${item.category})`);
      });
    } else {
      console.log('No pinned news items found');
    }

    // Merge pinned news into regular content at the beginning
    const allContent = [...pinnedNewsFromApi, ...regularContent];
    
    return NextResponse.json({
      data: allContent,
      pinnedNews: pinnedNewsFromApi,
      meta: {
        total: allContent.length,
        newsCount: allContent.filter((item: any) => item.type === 'news').length,
        sponsoredCount: allContent.filter((item: any) => item.type === 'sponsored').length,
        breakingCount: allContent.filter((item: any) => item.isBreaking).length,
        pinnedCount: pinnedNewsFromApi.length,
        pinnedItems: pinnedNewsFromApi.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category
        }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching mixed content:", error)
    return NextResponse.json({ error: "Failed to fetch mixed content" }, { status: 500 })
  }
}
