import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '12';
    const status = searchParams.get('status') || 'active';
    const sourceKeyword = searchParams.get('filters[source_keyword][$eq]');

    // Construct Strapi API URL - handle null videostatus as active
    let strapiUrl;
    let filterParams = [];

    // Add status filters
    if (status === 'active') {
      // For active status, get videos where videostatus is null or doesn't exist (default state)
      filterParams.push('filters[$or][0][videostatus][$null]=true');
      filterParams.push('filters[$or][1][videostatus][$eq]=active');
    } else {
      filterParams.push(`filters[videostatus][$eq]=${status}`);
    }

    // Add source_keyword filter if provided
    if (sourceKeyword) {
      const decodedKeyword = decodeURIComponent(sourceKeyword);
      filterParams.push(`filters[source_keyword][$eq]=${encodeURIComponent(decodedKeyword)}`);
    }

    // Add pagination and populate
    filterParams.push(`pagination[page]=${page}`);
    filterParams.push(`pagination[pageSize]=${pageSize}`);
    filterParams.push('populate=*');

    strapiUrl = ` http://localhost:1337/api/videos?${filterParams.join('&')}`;

    console.log('Fetching from Strapi:', strapiUrl);

    const response = await fetch(strapiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const strapiData = await response.json();

    // Transform Strapi data to our video format
    const transformedVideos = strapiData.data?.map((video: any) => ({
      id: video.id.toString(),
      videoId: video.video_id || video.attributes?.video_id || '',
      title: video.title || video.attributes?.title || 'Untitled Video',
      description: video.description || video.attributes?.description || '',
      thumbnailUrl: video.thumbnail_url || video.attributes?.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
      channelName: video.channel_name || video.attributes?.channel_name || 'Unknown Channel',
      viewCount: video.view_count || video.attributes?.view_count || 0,
      publishedAt: video.video_published_at || video.attributes?.video_published_at || video.createdAt || video.attributes?.createdAt,
      duration: video.duration || video.attributes?.duration || '',
      isPromoted: video.is_promoted || video.attributes?.is_promoted || false,
      sponsorName: video.sponsor_name || video.attributes?.sponsor_name || null,
      promotionBudget: video.promotion_cost || video.attributes?.promotion_cost || null,
      promotionStartDate: video.promotion_start || video.attributes?.promotion_start || null,
      promotionEndDate: video.promotion_expiry || video.attributes?.promotion_expiry || null,
      videoStatus: video.videostatus || video.attributes?.videostatus || 'active'
    })) || [];

    // Sort promoted videos first
    const sortedVideos = transformedVideos.sort((a: any, b: any) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Count sponsored videos
    const sponsoredCount = sortedVideos.filter((video: any) => video.isPromoted).length;

    return NextResponse.json({
      success: true,
      data: sortedVideos,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: strapiData.meta?.pagination?.total || sortedVideos.length,
        totalPages: strapiData.meta?.pagination?.pageCount || 1,
        sponsoredCount: sponsoredCount
      }
    });

  } catch (error) {
    console.error('Videos API error:', error);
    
    // Fallback to mock data if Strapi is unavailable
    const mockVideos = [
      {
        id: "1",
        videoId: "YIbbFLRd3cY",
        title: "Pattaya Beach Paradise - Ultimate Travel Guide 2024",
        description: "Discover the most beautiful beaches in Pattaya with our comprehensive travel guide.",
        thumbnailUrl: "https://img.youtube.com/vi/YIbbFLRd3cY/maxresdefault.jpg",
        channelName: "Pattaya1 Official",
        viewCount: 125000,
        publishedAt: "2024-01-15T10:00:00Z",
        duration: "12:45",
        isPromoted: true,
        sponsorName: "Tourism Authority of Thailand",
        videoStatus: "active"
      },
      {
        id: "2", 
        videoId: "07JgDy7-zaM",
        title: "Best Street Food in Pattaya - Local Hidden Gems",
        description: "Join us as we explore the most authentic street food spots that locals love.",
        thumbnailUrl: "https://img.youtube.com/vi/07JgDy7-zaM/maxresdefault.jpg",
        channelName: "Pattaya Food Tours",
        viewCount: 89000,
        publishedAt: "2024-01-10T14:30:00Z",
        duration: "15:20",
        isPromoted: false,
        videoStatus: "active"
      }
    ];

    // Count sponsored videos in mock data
    const mockSponsoredCount = mockVideos.filter((video: any) => video.isPromoted).length;

    return NextResponse.json({
      success: true,
      data: mockVideos,
      meta: {
        page: 1,
        pageSize: 12,
        total: mockVideos.length,
        totalPages: 1,
        sponsoredCount: mockSponsoredCount
      }
    });
  }
}
