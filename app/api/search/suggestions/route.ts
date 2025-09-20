import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const limit = parseInt(searchParams.get("limit") || "5")
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: "Query must be at least 2 characters" 
      }, { status: 400 })
    }

    // Fetch data from both breaking news and sponsored posts
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || ' http://localhost:1337'
    const [newsResponse, sponsoredResponse] = await Promise.all([
      fetch(`${apiBase}/api/breaking-news-plural?populate=*&sort=PublishedTimestamp:desc&pagination[limit]=50`, {
        headers: { 'Accept': 'application/json' }
      }),
      fetch(`${apiBase}/api/sponsored-posts?populate=*&filters[IsActive][$eq]=true`, {
        headers: { 'Accept': 'application/json' }
      })
    ])

    let allSuggestions: any[] = []

    // Process news data
    if (newsResponse.ok) {
      const newsResult = await newsResponse.json()
      const newsData = newsResult.data || []
      
      newsData.forEach((item: any) => {
        const title = item.Title || item.attributes?.Title
        const source = item.Source || item.attributes?.Source
        const category = item.Category || item.attributes?.Category
        
        if (title && title.toLowerCase().includes(query.toLowerCase())) {
          allSuggestions.push({
            text: title,
            type: "breaking-news",
            source: source,
            category: category
          })
        }
        
        if (source && source.toLowerCase().includes(query.toLowerCase())) {
          allSuggestions.push({
            text: source,
            type: "news-source",
            source: source,
            category: "Source"
          })
        }
        
        if (category && category.toLowerCase().includes(query.toLowerCase())) {
          allSuggestions.push({
            text: category,
            type: "category",
            source: source,
            category: category
          })
        }
      })
    }

    // Process sponsored posts
    if (sponsoredResponse.ok) {
      const sponsoredResult = await sponsoredResponse.json()
      const sponsoredData = sponsoredResult.data || []
      
      sponsoredData.forEach((item: any) => {
        const title = item.Title || item.attributes?.Title
        const sponsor = item.Sponsor || item.attributes?.Sponsor
        
        if (title && title.toLowerCase().includes(query.toLowerCase())) {
          allSuggestions.push({
            text: title,
            type: "sponsored-post",
            source: sponsor,
            category: "Sponsored"
          })
        }
        
        if (sponsor && sponsor.toLowerCase().includes(query.toLowerCase())) {
          allSuggestions.push({
            text: sponsor,
            type: "sponsor",
            source: sponsor,
            category: "Sponsor"
          })
        }
      })
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = allSuggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text && s.type === suggestion.type)
      )
      .slice(0, limit)

    return NextResponse.json({
      data: uniqueSuggestions,
      meta: {
        query,
        count: uniqueSuggestions.length
      }
    })

  } catch (error) {
    console.error("Suggestions error:", error)
    return NextResponse.json({ 
      error: "Suggestions failed" 
    }, { status: 500 })
  }
}
