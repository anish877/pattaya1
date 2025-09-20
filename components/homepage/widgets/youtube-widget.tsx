"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { 
  Play, 
  ThumbsUp, 
  Eye, 
  MessageCircle, 
  TrendingUp, 
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"

interface StrapiYouTubeVideo {
  id: number
  title: string
  description: string
  videoId: string
  thumbnailUrl: string | null
  duration: string
  viewCount: number
  likeCount: number
  publishedAt: string
  channelName: string
  category: string
  promoted: boolean
  featured: boolean
  comments: number
}

export function YouTubeWidget() {
  const [videos, setVideos] = useState<StrapiYouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
    const interval = setInterval(fetchVideos, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl("youtube-videos?populate=*"))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('YouTube videos data received:', data)
      
      if (data.data && Array.isArray(data.data)) {
        const mappedData = data.data.map((item: any) => ({
          id: item.id,
          title: item.Title,
          description: item.Description,
          videoId: item.VideoId,
          thumbnailUrl: item.Thumbnail,
          duration: item.Duration,
          viewCount: item.Views,
          likeCount: item.Likes,
          publishedAt: item.publishedAt,
          channelName: item.ChannelName,
          category: item.Category,
          promoted: item.Promoted,
          featured: item.Featured,
          comments: item.Comments,
        }))
        setVideos(mappedData)
      } else {
        console.warn('No YouTube videos data found or invalid format')
        setVideos([])
      }
    } catch (error) {
      console.error("Failed to fetch YouTube videos from Strapi:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) {
      return '0'
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const handleVideoClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
  }

  if (loading) {
    return (
      <Card className="h-full bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <div className="h-6 w-6 bg-red-500/20 rounded-lg"></div>
              </div>
              <div className="h-6 bg-gray-100 rounded-xl w-32"></div>
            </div>
            <div className="h-5 bg-gray-100 rounded-lg w-16"></div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-100 rounded-lg w-20"></div>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-40 bg-gray-100 rounded-2xl"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded-xl w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
                    <div className="h-3 bg-gray-100 rounded-lg w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (videos.length === 0) {
    return (
      <Card className="h-full bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100/60 p-6">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Play className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Featured Videos</h3>
              <p className="text-sm text-gray-500 font-medium">Discover amazing content</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="p-6 bg-gray-50 rounded-2xl mb-6">
              <Play className="h-16 w-16 text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-600 mb-2">No videos available</p>
            <p className="text-sm text-gray-500 text-center">Check back later for new content</p>
            <div className="mt-6 flex gap-1.5">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-white border border-neutral-200/60 shadow-sm rounded-xl overflow-hidden flex flex-col">
      <CardHeader className="p-3 flex-shrink-0 border-b border-neutral-200/60 bg-neutral-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 rounded-md">
              <Play className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Featured Videos</h3>
              <p className="text-[11px] text-neutral-500">Latest from YouTube</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 rounded-md">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span className="text-[11px] font-medium text-neutral-700">{videos.length}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 space-y-3 flex-1 overflow-hidden">
        {/* Featured Video Section - Shows first 2 videos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-red-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-neutral-900">Featured</h3>
          </div>
          <div className="space-y-3">
            {videos.slice(0, 2).map((video, index) => (
              <div
                key={video.id}
                className="group cursor-pointer bg-white rounded-lg overflow-hidden border border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => handleVideoClick(video.videoId)}
              >
                <div className="relative">
                  <img
                    src={video.thumbnailUrl ? buildStrapiUrl(video.thumbnailUrl) : "https://via.placeholder.com/320x180/1f2937/ffffff?text=Pattaya+Video"}
                    alt={video.title}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                      <Play className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                    {video.duration}
                  </div>
                </div>
                
                <div className="p-2.5">
                  <h4 className="font-semibold text-[13px] text-neutral-900 line-clamp-2 mb-1 group-hover:text-red-600 transition-colors leading-tight">
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                    <span className="font-medium text-neutral-700 truncate">{video.channelName}</span>
                    <span className="font-medium whitespace-nowrap">{video.publishedAt}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 rounded">
                      <Eye className="w-3 h-3 text-neutral-600" />
                      <span className="font-medium text-neutral-700">{formatNumber(video.viewCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 rounded">
                      <ThumbsUp className="w-3 h-3 text-neutral-700" />
                      <span className="font-medium text-neutral-700">{formatNumber(video.likeCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 rounded">
                      <MessageCircle className="w-3 h-3 text-neutral-700" />
                      <span className="font-medium text-neutral-700">{formatNumber(video.comments)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <Button 
          className="w-full text-[11px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-md py-1.5"
          onClick={() => window.open('https://www.youtube.com/results?search_query=pattaya', '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View on YouTube
        </Button>
      </CardContent>
    </Card>
  )
}
