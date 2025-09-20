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

    // Fetch sponsored posts
    const sponsoredResponse = await fetch(` http://localhost:1337/api/sponsored-posts?populate=*&filters[IsActive][$eq]=true`, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (!sponsoredResponse.ok) {
      throw new Error('Failed to fetch sponsored posts')
    }

    const sponsoredResult = await sponsoredResponse.json()
    const sponsoredData = sponsoredResult.data?.map((item: any) => ({
      title: item.Title || item.attributes?.Title,
      content: item.Content || item.attributes?.Content,
      source: item.Sponsor || item.attributes?.Sponsor,
      category: "Sponsored",
      url: item.URL || item.attributes?.URL,
      contentType: "sponsored-post",
      publishedAt: new Date().toISOString(),
      featuredImage: item.Image?.url || item.attributes?.Image?.data?.attributes?.url,
      isBreaking: false,
      severity: "low",
      sponsorName: item.Sponsor || item.attributes?.Sponsor,
      type: "sponsored"
    })) || []

    // Filter based on query
    const filteredData = sponsoredData.filter((item: any) => {
      const searchableText = `${item.title} ${item.content} ${item.source} ${item.sponsorName}`.toLowerCase()
      return searchableText.includes(query.toLowerCase())
    })

    // Add highlighting
    const highlightedData = filteredData.map((item: any) => ({
      ...item,
      title: highlightText(item.title, query),
      content: highlightText(item.content, query)
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
    console.error("Sponsored posts search error:", error)
    return NextResponse.json({ 
      error: "Sponsored posts search failed" 
    }, { status: 500 })
  }
}

function highlightText(text: string, query: string): string {
  if (!text || !query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
