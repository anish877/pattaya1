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
    <Card className="h-full bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 border-0 shadow-lg rounded-2xl overflow-hidden flex flex-col">
      <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Play className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Featured Videos</h3>
              <p className="text-sm text-red-100 font-medium">Discover amazing content</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">{videos.length} Videos</span>
          </div>
        </CardTitle>
      </CardHeader>
    
      <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-100/50 max-h-96">
        {/* Featured Video Section - Shows first 2 videos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Featured Content</h3>
          </div>
          <div className="space-y-4">
            {videos.slice(0, 2).map((video, index) => (
              <div
                key={video.id}
                className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 shadow-lg hover:shadow-xl hover:border-white/80 transition-all duration-200 hover:scale-[1.01]"
                onClick={() => handleVideoClick(video.videoId)}
              >
                <div className="relative">
                  <img
                    src={video.thumbnailUrl ? buildStrapiUrl(video.thumbnailUrl) : "https://via.placeholder.com/320x180/1f2937/ffffff?text=Pattaya+Video"}
                    alt={video.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white bg-opacity-95 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-6 h-6 text-red-500 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-xs px-3 py-1.5 rounded-xl font-medium">
                    {video.duration}
                  </div>
                  {video.promoted && (
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-xl shadow-sm">
                        <TrendingUp className="w-3 h-3" />
                        Promoted
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h4 className="font-semibold text-base text-gray-900 line-clamp-2 mb-3 group-hover:text-red-600 transition-colors leading-tight">
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="font-semibold text-gray-700">{video.channelName}</span>
                    <span className="font-medium">{video.publishedAt}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl shadow-sm">
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">{formatNumber(video.viewCount)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow-sm">
                      <ThumbsUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-700">{formatNumber(video.likeCount)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow-sm">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">{formatNumber(video.comments)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <Button 
          className="w-full text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl py-3 transform hover:-translate-y-0.5"
          onClick={() => window.open('https://www.youtube.com/results?search_query=pattaya', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View All Pattaya Videos
        </Button>
      </CardContent>
    </Card>
  )
}
