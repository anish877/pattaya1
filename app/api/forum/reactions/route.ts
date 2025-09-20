import { NextRequest, NextResponse } from "next/server"
import { buildApiUrl } from "@/lib/strapi-config"

export async function POST(request: NextRequest) {
  try {
    const { topicId, type } = await request.json()

    if (!topicId || !type) {
      return NextResponse.json(
        { error: "Topic ID and reaction type are required" },
        { status: 400 }
      )
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Call the Strapi forum-reaction API
    const strapiUrl = buildApiUrl("forum-reactions/add-reaction")
    const response = await fetch(strapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        topicId: topicId,
        type: type
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || "Failed to add reaction" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Forum reaction error:", error)
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    )
  }
}
