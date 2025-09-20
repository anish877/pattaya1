import { NextResponse } from "next/server"
import { buildApiUrl } from "@/lib/strapi-config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isBreaking = searchParams.get('IsBreaking')
    const limit = parseInt(searchParams.get('limit') || '10')
    
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
        newsData = newsResult.data?.map((item: any) => ({
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
          isPinned: item.isPinned || item.attributes?.isPinned || false
        })) || []
      }
      
      // Fetch pinned news from Strapi backend - check both isPinned and pinnedAt fields
      const pinnedApiUrl = ` https://api.pattaya1.com/api/breaking-news-plural?populate=*&filters[$or][0][isPinned][$eq]=true&filters[$or][1][pinnedAt][$notNull]=true&sort=PublishedTimestamp:desc`
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
          userVote: item.userVotes?.['anonymous'] || null,
          isPinned: true
        })) || []
        
        console.log(`Fetched ${pinnedNewsData.length} pinned news items from Strapi`)
        if (pinnedNewsData.length > 0) {
          console.log('Live pinned news from Strapi:', pinnedNewsData.map((item: any) => ({ id: item.id, title: item.title })))
        }
      }
      
    } catch (error) {
      console.error('Error fetching breaking news:', error)
      newsData = []
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
        ...(process.env.NODE_ENV === 'development' && {
          agent: false
        })
      })
      if (sponsoredResponse.ok) {
        const sponsoredResult = await sponsoredResponse.json()
        sponsoredData = sponsoredResult.data?.map((item: any) => ({
          id: `sponsored-${item.id}`,
          title: item.Title || item.attributes?.Title,
          summary: item.Content || item.attributes?.Content,
          category: "Sponsored",
          severity: "low",
          timestamp: new Date().toISOString(),
          source: item.Sponsor || item.attributes?.Sponsor,
          url: item.URL || item.attributes?.URL,
          isBreaking: false,
          type: "sponsored",
          image: item.Image?.url || item.attributes?.Image?.data?.attributes?.url,
          imageAlt: item.Image?.alternativeText || item.attributes?.Image?.data?.attributes?.alternativeText || "",
          imageCaption: "",
          upvotes: 0,
          downvotes: 0,
          isPinned: false,
          sponsorName: item.Sponsor || item.attributes?.Sponsor,
          sponsorLogo: null,
          displayPosition: `position-${item.id}`
        })) || []
      }
    } catch (error) {
      console.error('Error fetching sponsored posts:', error)
    }

    // Mix regular content with sponsored posts
    const regularContent = [...newsData, ...sponsoredData]

    // Use live pinned news data from Strapi if available
    let pinnedNewsFromApi = pinnedNewsData;
    console.log(`Using live Strapi pinned news data: ${pinnedNewsFromApi.length} items`)
    
    // No fallback data - use only live Strapi data
    if (pinnedNewsFromApi.length === 0) {
      console.log('No live pinned news found');
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
    // DO NOT merge pinned news into regular content - keep them separate
    // The frontend will handle displaying them in separate rows
    
    return NextResponse.json({
      data: regularContent, // Only regular news (non-pinned)
      pinnedNews: pinnedNewsFromApi, // Only pinned news
      meta: {
        total: regularContent.length + pinnedNewsFromApi.length,
        newsCount: regularContent.filter((item: any) => item.type === 'news').length,
        sponsoredCount: regularContent.filter((item: any) => item.type === 'sponsored').length,
        breakingCount: regularContent.filter((item: any) => item.isBreaking).length,
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
