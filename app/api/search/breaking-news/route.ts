import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const filters = searchParams.get("filters") || ""
    const page = parseInt(searchParams.get("page") || "0")
    const hitsPerPage = parseInt(searchParams.get("hitsPerPage") || "20")
    
    if (!query) {
      return NextResponse.json({ 
        error: "Query parameter is required" 
      }, { status: 400 })
    }

    // Fetch breaking news data
    const newsResponse = await fetch(` https://api.pattaya1.com/api/breaking-news-plural?populate=*&sort=PublishedTimestamp:desc&pagination[limit]=100`, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (!newsResponse.ok) {
      throw new Error('Failed to fetch breaking news')
    }

    const newsResult = await newsResponse.json()
    const newsData = newsResult.data?.map((item: any) => ({
      title: item.Title || item.attributes?.Title,
      content: item.Summary || item.attributes?.Summary,
      source: item.Source || item.attributes?.Source,
      category: item.Category || item.attributes?.Category,
      url: item.URL || item.attributes?.URL,
      contentType: "breaking-news",
      publishedAt: item.PublishedTimestamp || item.attributes?.PublishedTimestamp,
      featuredImage: item.ImageURL || item.attributes?.ImageURL,
      isBreaking: item.IsBreaking || item.attributes?.IsBreaking,
      severity: item.Severity || item.attributes?.Severity
    })) || []

    // Filter based on query
    const filteredData = newsData.filter((item: any) => {
      const searchableText = `${item.title} ${item.content} ${item.source} ${item.category}`.toLowerCase()
      return searchableText.includes(query.toLowerCase())
    })

    // Apply additional filters
    let finalData = filteredData
    if (filters) {
      const filterPairs = filters.split(',').map(f => f.split(':'))
      finalData = filteredData.filter((item: any) => {
        return filterPairs.every(([key, value]) => {
          switch (key.toLowerCase()) {
            case 'severity':
              return item.severity?.toLowerCase() === value.toLowerCase()
            case 'category':
              return item.category?.toLowerCase() === value.toLowerCase()
            case 'source':
              return item.source?.toLowerCase().includes(value.toLowerCase())
            default:
              return true
          }
        })
      })
    }

    // Add highlighting
    const highlightedData = finalData.map((item: any) => ({
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
    console.error("Breaking news search error:", error)
    return NextResponse.json({ 
      error: "Breaking news search failed" 
    }, { status: 500 })
  }
}

function highlightText(text: string, query: string): string {
  if (!text || !query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
