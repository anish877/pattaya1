import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // In production, you would track actual search queries and their frequency
    // For now, we'll return popular topics based on recent news content
    const trendingTopics = [
      "Thailand news",
      "Pattaya breaking news", 
      "Bangkok politics",
      "Tourism updates",
      "Crime news",
      "Weather alerts",
      "Traffic updates",
      "Local events",
      "Business news",
      "Sports news",
      "Restaurant reviews",
      "Hotel deals",
      "Beach safety",
      "Immigration news",
      "Festival events"
    ]

    // Try to get dynamic trending topics from recent news
    try {
      const newsResponse = await fetch(` http://localhost:1337/api/breaking-news-plural?populate=*&sort=PublishedTimestamp:desc&pagination[limit]=20`, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (newsResponse.ok) {
        const newsResult = await newsResponse.json()
        const recentNews = newsResult.data || []
        
        // Extract keywords from recent news titles and categories
        const dynamicTopics = new Set<string>()
        recentNews.forEach((item: any) => {
          const title = item.Title || item.attributes?.Title || ""
          const category = item.Category || item.attributes?.Category || ""
          
          // Extract meaningful keywords from titles
          const titleWords = title.split(' ').filter((word: string) => 
            word.length > 3 && !['news', 'the', 'and', 'for', 'with'].includes(word.toLowerCase())
          )
          
          titleWords.forEach((word: string) => {
            if (word.length > 4) {
              dynamicTopics.add(word)
            }
          })
          
          if (category) {
            dynamicTopics.add(category)
          }
        })
        
        // Add dynamic topics to the beginning of trending list
        const dynamicArray = Array.from(dynamicTopics).slice(0, 5)
        trendingTopics.unshift(...dynamicArray)
      }
    } catch (error) {
      console.log('Using static trending topics due to fetch error:', error)
    }

    // Remove duplicates and limit results
    const uniqueTopics = [...new Set(trendingTopics)].slice(0, limit)

    const trendingData = uniqueTopics.map((topic, index) => ({
      query: topic,
      rank: index + 1,
      category: "trending",
      searchCount: Math.floor(Math.random() * 1000) + 100 // Simulated search count
    }))

    return NextResponse.json({
      data: trendingData,
      meta: {
        count: trendingData.length,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Trending search error:", error)
    return NextResponse.json({ 
      error: "Trending search failed" 
    }, { status: 500 })
  }
}
