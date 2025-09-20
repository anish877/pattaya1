import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const page = parseInt(searchParams.get("page") || "0")
    const hitsPerPage = parseInt(searchParams.get("hitsPerPage") || "20")
    
    if (!query) {
      return NextResponse.json({ 
        error: "Query parameter is required" 
      }, { status: 400 })
    }

    // Fetch breaking news to extract unique sources
    const newsResponse = await fetch(` http://localhost:1337/api/breaking-news-plural?populate=*&sort=PublishedTimestamp:desc&pagination[limit]=100`, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news sources')
    }

    const newsResult = await newsResponse.json()
    const newsData = newsResult.data || []

    // Extract unique sources with their metadata
    const sourcesMap = new Map()
    newsData.forEach((item: any) => {
      const source = item.Source || item.attributes?.Source
      if (source && !sourcesMap.has(source)) {
        sourcesMap.set(source, {
          name: source,
          contentType: "news-source",
          category: "News Source",
          articleCount: newsData.filter((n: any) => 
            (n.Source || n.attributes?.Source) === source
          ).length,
          lastPublished: item.PublishedTimestamp || item.attributes?.PublishedTimestamp,
          url: `#source=${encodeURIComponent(source)}`
        })
      }
    })

    // Convert to array and filter by query
    const allSources = Array.from(sourcesMap.values())
    const filteredSources = allSources.filter((source: any) => {
      return source.name.toLowerCase().includes(query.toLowerCase())
    })

    // Add highlighting
    const highlightedData = filteredSources.map((source: any) => ({
      ...source,
      title: highlightText(source.name, query),
      content: `News source with ${source.articleCount} articles`,
      source: source.name,
      publishedAt: source.lastPublished
    }))

    // Apply pagination
    const startIndex = page * hitsPerPage
    const endIndex = startIndex + hitsPerPage
    const paginatedData = highlightedData.slice(startIndex, endIndex)

    return NextResponse.json({
      data: paginatedData,
      meta: {
        pagination: {
          page,
          pageSize: hitsPerPage,
          pageCount: Math.ceil(highlightedData.length / hitsPerPage),
          total: highlightedData.length
        },
        processingTimeMS: 1
      }
    })

  } catch (error) {
    console.error("News sources search error:", error)
    return NextResponse.json({ 
      error: "News sources search failed" 
    }, { status: 500 })
  }
}

function highlightText(text: string, query: string): string {
  if (!text || !query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
