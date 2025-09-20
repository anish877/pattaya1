import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    // Fetch trending topics from Strapi videos
    const strapiUrl = ` http://localhost:1337/api/videos?pagination[page]=1&pagination[pageSize]=50&populate=*&sort[0]=view_count:desc&sort[1]=createdAt:desc`;

    console.log('Fetching trending topics from Strapi:', strapiUrl);

    const response = await fetch(strapiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const strapiData = await response.json();

    // Extract trending topics from video data
    const videos = strapiData.data || [];
    const topicCounts = new Map<string, { count: number; totalViews: number; latestVideo: any }>();

    // Process videos to extract trending topics
    videos.forEach((video: any) => {
      const title = video.title || video.attributes?.title || '';
      const description = video.description || video.attributes?.description || '';
      const viewCount = video.view_count || video.attributes?.view_count || 0;
      const channelName = video.channel_name || video.attributes?.channel_name || '';
      
      // Extract keywords from title and description
      const text = `${title} ${description} ${channelName}`.toLowerCase();
      const keywords = text
        .split(/[\s,.-]+/)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'what', 'there', 'when', 'where', 'more', 'some', 'like', 'into', 'time', 'very', 'only', 'just', 'also', 'than', 'over', 'such', 'even', 'most', 'after', 'first', 'well', 'year', 'work', 'good', 'much', 'many', 'long', 'great', 'little', 'right', 'still', 'should', 'could', 'would', 'might', 'must', 'shall', 'video', 'videos', 'watch', 'youtube'].includes(word));

      keywords.forEach(keyword => {
        if (topicCounts.has(keyword)) {
          const existing = topicCounts.get(keyword)!;
          existing.count += 1;
          existing.totalViews += viewCount;
        } else {
          topicCounts.set(keyword, {
            count: 1,
            totalViews: viewCount,
            latestVideo: {
              id: video.id,
              title: title,
              videoId: video.video_id || video.attributes?.video_id,
              thumbnailUrl: video.thumbnail_url || video.attributes?.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`
            }
          });
        }
      });
    });

    // Sort topics by engagement score (combination of frequency and total views)
    const trendingTopics = Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        count: data.count,
        totalViews: data.totalViews,
        engagementScore: data.count * Math.log(data.totalViews + 1),
        latestVideo: data.latestVideo
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, parseInt(limit));

    // Add some Pattaya-specific trending topics if not enough found
    if (trendingTopics.length < 5) {
      const defaultTopics = [
        { topic: 'Pattaya', count: 25, totalViews: 150000, engagementScore: 1000, latestVideo: null },
        { topic: 'Beach', count: 18, totalViews: 120000, engagementScore: 900, latestVideo: null },
        { topic: 'Thailand', count: 22, totalViews: 180000, engagementScore: 950, latestVideo: null },
        { topic: 'Travel', count: 15, totalViews: 90000, engagementScore: 800, latestVideo: null },
        { topic: 'Food', count: 12, totalViews: 75000, engagementScore: 700, latestVideo: null },
        { topic: 'Nightlife', count: 10, totalViews: 60000, engagementScore: 650, latestVideo: null },
        { topic: 'Hotels', count: 8, totalViews: 45000, engagementScore: 600, latestVideo: null },
        { topic: 'Shopping', count: 6, totalViews: 30000, engagementScore: 550, latestVideo: null }
      ];

      // Fill remaining slots with default topics
      const remainingSlots = parseInt(limit) - trendingTopics.length;
      trendingTopics.push(...defaultTopics.slice(0, remainingSlots));
    }

    return NextResponse.json({
      success: true,
      data: trendingTopics,
      meta: {
        total: trendingTopics.length,
        limit: parseInt(limit),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Trending topics API error:', error);
    
    // Fallback trending topics
    const fallbackTopics = [
      { topic: 'Pattaya', count: 25, totalViews: 150000, engagementScore: 1000, latestVideo: null },
      { topic: 'Beach', count: 18, totalViews: 120000, engagementScore: 900, latestVideo: null },
      { topic: 'Thailand', count: 22, totalViews: 180000, engagementScore: 950, latestVideo: null },
      { topic: 'Travel', count: 15, totalViews: 90000, engagementScore: 800, latestVideo: null },
      { topic: 'Food', count: 12, totalViews: 75000, engagementScore: 700, latestVideo: null },
      { topic: 'Nightlife', count: 10, totalViews: 60000, engagementScore: 650, latestVideo: null },
      { topic: 'Hotels', count: 8, totalViews: 45000, engagementScore: 600, latestVideo: null },
      { topic: 'Shopping', count: 6, totalViews: 30000, engagementScore: 550, latestVideo: null }
    ];

    return NextResponse.json({
      success: true,
      data: fallbackTopics.slice(0, parseInt(request.nextUrl.searchParams.get('limit') || '10')),
      meta: {
        total: fallbackTopics.length,
        limit: parseInt(request.nextUrl.searchParams.get('limit') || '10'),
        generatedAt: new Date().toISOString(),
        fallback: true
      }
    });
  }
}
