"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Repeat2, Share, MapPin, CheckCircle, ExternalLink, Hash, Users, Shield, Sparkles, RefreshCw } from "lucide-react"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"
import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"

interface SocialPost {
  id: string
  platform: "twitter" | "threads" | "instagram" | "bluesky"
  author: string
  handle: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  location?: string
  verified?: boolean
  hashtags: string[]
  image?: string
}

interface StrapiSocialMediaPost {
  id: number
  Platform: "twitter" | "threads" | "instagram" | "bluesky" | "facebook" | "tiktok"
  Author: string
  Handle: string
  Content: string
  Timestamp: string
  Likes: number
  Comments: number
  Shares: number
  Location: string
  Verified: boolean
  Hashtags: string[]
  URL: string
  IsActive: boolean
  Featured: boolean
  Category: string
  Avatar?: {
    id: number
    name: string
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  Image?: {
    id: number
    name: string
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  createdAt: string
  updatedAt: string
  publishedAt: string
}

interface SocialFeedWidgetProps {
  theme?: "primary" | "nightlife"
}

export function SocialFeedWidget({ theme = "primary" }: SocialFeedWidgetProps) {
  const isPrimary = theme === "primary"
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  })

  useEffect(() => {
    fetchSocialPosts()
    const interval = setInterval(fetchSocialPosts, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  const fetchSocialPosts = async () => {
    try {
      setLoading(true)
      console.log('Fetching social media posts from Strapi...')
      
      // Call Strapi API to fetch 1 post directly from Twitter (no caching)
      const response = await fetch(buildApiUrl("social-feed/fetch-one"))
      
      if (response.ok) {
        const data = await response.json()
        console.log('Strapi social feed response:', data)
        
        if (data.data && data.data.posts && data.data.posts.length > 0) {
          // Transform Strapi data to match component interface
          const transformedPosts: SocialPost[] = data.data.posts.map((strapiPost: any) => {
            // Get avatar URL with fallback
            let avatarUrl = "/placeholder.svg?height=40&width=40"
            if (strapiPost.Avatar) {
              avatarUrl = buildStrapiUrl(strapiPost.Avatar.url)
            }

            // Get image URL with fallback
            let imageUrl = undefined
            if (strapiPost.Image) {
              imageUrl = buildStrapiUrl(strapiPost.Image.url)
            }

            return {
              id: strapiPost.id.toString(),
              platform: strapiPost.Platform as any,
              author: strapiPost.Author,
              handle: strapiPost.Handle,
              avatar: avatarUrl,
              content: strapiPost.Content,
              timestamp: strapiPost.Timestamp || strapiPost.publishedAt,
              likes: strapiPost.Likes,
              comments: strapiPost.Comments,
              shares: strapiPost.Shares,
              location: strapiPost.Location,
              verified: strapiPost.Verified,
              hashtags: strapiPost.Hashtags || [],
              image: imageUrl,
            }
          })
          
          console.log('Transformed social media posts:', transformedPosts)
          setSocialPosts(transformedPosts)
          
          // Calculate stats
          const totalPosts = transformedPosts.length
          const totalLikes = transformedPosts.reduce((sum, post) => sum + post.likes, 0)
          const totalComments = transformedPosts.reduce((sum, post) => sum + post.comments, 0)
          setStats({ totalPosts, totalLikes, totalComments })
        } else {
          console.log('No social media posts found, using fallback data')
          // Use fallback data if no posts found
          const fallbackData = getFallbackSocialPosts()
          setSocialPosts(fallbackData)
          
          // Calculate stats for fallback data
          const totalPosts = fallbackData.length
          const totalLikes = fallbackData.reduce((sum, post) => sum + post.likes, 0)
          const totalComments = fallbackData.reduce((sum, post) => sum + post.comments, 0)
          setStats({ totalPosts, totalLikes, totalComments })
        }
      } else {
        console.error("Failed to fetch social media posts from Strapi:", response.status)
        // Use fallback data on error
        const fallbackData = getFallbackSocialPosts()
        setSocialPosts(fallbackData)
        
        // Calculate stats for fallback data
        const totalPosts = fallbackData.length
        const totalLikes = fallbackData.reduce((sum, post) => sum + post.likes, 0)
        const totalComments = fallbackData.reduce((sum, post) => sum + post.comments, 0)
        setStats({ totalPosts, totalLikes, totalComments })
      }
    } catch (error) {
      console.error("Failed to load social media posts:", error)
      // Use fallback data on error
      const fallbackData = getFallbackSocialPosts()
      setSocialPosts(fallbackData)
      
      // Calculate stats for fallback data
      const totalPosts = fallbackData.length
      const totalLikes = fallbackData.reduce((sum, post) => sum + post.likes, 0)
      const totalComments = fallbackData.reduce((sum, post) => sum + post.comments, 0)
      setStats({ totalPosts, totalLikes, totalComments })
    } finally {
      setLoading(false)
    }
  }

  const getFallbackSocialPosts = (): SocialPost[] => [
    {
      id: "1",
      platform: "twitter",
      author: "Pattaya Explorer",
      handle: "@pattayaexplorer",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "Just discovered this amazing rooftop bar in Central Pattaya! The sunset views are incredible 🌅 #PattayaNightlife #Thailand",
      timestamp: "2m",
      likes: 124,
      comments: 18,
      shares: 32,
      location: "Central Pattaya",
      verified: true,
      hashtags: ["#PattayaNightlife", "#Thailand"],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "2",
      platform: "instagram",
      author: "Jomtien Beach Life",
      handle: "@jomtienbeachlife",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "Morning yoga session at Jomtien Beach 🧘‍♀️ Perfect way to start the day! The water is crystal clear today ✨",
      timestamp: "15m",
      likes: 89,
      comments: 12,
      shares: 8,
      location: "Jomtien Beach",
      verified: false,
      hashtags: ["#JomtienBeach", "#Yoga", "#MorningVibes"],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "3",
      platform: "threads",
      author: "Pattaya Foodie",
      handle: "@pattayafoodie",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "This street food vendor near Walking Street serves the BEST pad thai I've ever had! 🍜 Only 60 baht too!",
      timestamp: "32m",
      likes: 156,
      comments: 24,
      shares: 19,
      location: "Walking Street",
      verified: true,
      hashtags: ["#PattayaFood", "#StreetFood", "#PadThai"],
    },
    {
      id: "4",
      platform: "bluesky",
      author: "Digital Nomad Pattaya",
      handle: "@nomadpattaya.bsky.social",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "Working from this co-working space in Pattaya with fiber internet and amazing coffee ☕ Perfect for remote work!",
      timestamp: "1h",
      likes: 67,
      comments: 9,
      shares: 15,
      location: "Central Pattaya",
      verified: false,
      hashtags: ["#DigitalNomad", "#RemoteWork", "#Pattaya"],
    },
    {
      id: "5",
      platform: "twitter",
      author: "Pattaya Events",
      handle: "@pattayaevents",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "🎉 TONIGHT: Beach party at Bali Hai Pier! Live DJ, fire shows, and amazing cocktails. Starts at 8PM! #PattayaParty",
      timestamp: "2h",
      likes: 203,
      comments: 45,
      shares: 78,
      location: "Bali Hai Pier",
      verified: true,
      hashtags: ["#PattayaParty", "#BeachParty", "#Tonight"],
    },
  ]

  const refreshFeed = async () => {
    await fetchSocialPosts()
  }

  const handleViewAll = () => {
    window.location.href = "/social"
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "from-blue-400 to-blue-600"
      case "threads":
        return "from-gray-800 to-black"
      case "instagram":
        return "from-purple-500 to-pink-500"
      case "bluesky":
        return "from-sky-400 to-sky-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "𝕏"
      case "threads":
        return "@"
      case "instagram":
        return "📷"
      case "bluesky":
        return "🦋"
      default:
        return "📱"
    }
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <Card
        className={`h-full transition-all duration-500  cursor-pointer widget-card glow-border ${
          isPrimary
            ? "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200 hover:shadow-xl hover:shadow-pink-200/50"
            : "bg-gradient-to-br from-purple-800 via-pink-800 to-red-800 border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/30"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={`flex items-center justify-between text-lg ${isPrimary ? "text-pink-800" : "text-white"}`}
          >
            <div className="flex items-center space-x-2">
              <Hash className="h-5 w-5 animate-pulse" />
              <span>Social Feed</span>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse"
              >
                Live
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
                  isPrimary ? "border-pink-600" : "border-pink-400"
                }`}
              ></div>
              <p className={`text-sm ${isPrimary ? "text-pink-600" : "text-purple-300"}`}>Loading social feed...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if we have posts and current post exists
  if (!socialPosts || socialPosts.length === 0) {
    return (
      <Card
        className={`h-full transition-all duration-500  cursor-pointer widget-card glow-border ${
          isPrimary
            ? "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200 hover:shadow-xl hover:shadow-pink-200/50"
            : "bg-gradient-to-br from-purple-800 via-pink-800 to-red-800 border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/30"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={`flex items-center justify-between text-lg ${isPrimary ? "text-pink-800" : "text-white"}`}
          >
            <div className="flex items-center space-x-2">
              <Hash className="h-5 w-5 animate-pulse" />
              <span>Social Feed</span>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse"
              >
                Live
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center h-32">
            <p className={`text-sm font-medium ${isPrimary ? "text-pink-600" : "text-purple-300"}`}>No social media posts available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`h-full transition-all duration-500 cursor-pointer widget-card glow-border ${
        isPrimary
          ? "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200 hover:shadow-xl hover:shadow-pink-200/50"
          : "bg-gradient-to-br from-purple-800 via-pink-800 to-red-800 border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/30"
      }`}
      onClick={handleViewAll}
    >
      {/* Global Sponsorship Banner */}
      <SponsorshipBanner widgetType="social" />
      <CardHeader className="pb-3">
        <CardTitle
          className={`flex items-center justify-between text-lg ${isPrimary ? "text-pink-800" : "text-white"}`}
        >
          <div className="flex items-center space-x-2">
            <Hash className="h-5 w-5 animate-pulse" />
            <span>Social Feed</span>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse"
            >
              Live
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-500 animate-pulse" />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                refreshFeed()
              }}
              disabled={loading}
              className={`h-6 w-6 ${isPrimary ? "hover:bg-pink-200" : "hover:bg-purple-700"}`}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                window.open("/social", "_blank")
              }}
              className={`h-6 w-6 ${isPrimary ? "hover:bg-pink-200" : "hover:bg-purple-700"}`}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Moderation Status */}
        <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-purple-700">Native + Gemini AI</span>
          </div>
          <Badge variant="outline" className="text-xs border-green-500 text-green-700">
            Filtering: Pattaya Content
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
          <div
            className={`text-center p-2 rounded-lg ${
              isPrimary ? "bg-white/60" : "bg-purple-900/50"
            } animate-bounce-subtle`}
          >
            <Users className={`h-4 w-4 mx-auto mb-1 ${isPrimary ? "text-pink-600" : "text-pink-300"}`} />
            <div className={`text-xs font-bold ${isPrimary ? "text-pink-800" : "text-white"}`}>{stats.totalPosts}</div>
            <div className={`text-xs ${isPrimary ? "text-pink-600" : "text-purple-300"}`}>Posts</div>
          </div>
          <div
            className={`text-center p-2 rounded-lg ${
              isPrimary ? "bg-white/60" : "bg-purple-900/50"
            } animate-bounce-subtle`}
            style={{ animationDelay: "0.1s" }}
          >
            <Heart className={`h-4 w-4 mx-auto mb-1 text-red-500 animate-pulse`} />
            <div className={`text-xs font-bold ${isPrimary ? "text-pink-800" : "text-white"}`}>
              {stats.totalLikes.toLocaleString()}
            </div>
            <div className={`text-xs ${isPrimary ? "text-pink-600" : "text-purple-300"}`}>Likes</div>
          </div>
          <div
            className={`text-center p-2 rounded-lg ${
              isPrimary ? "bg-white/60" : "bg-purple-900/50"
            } animate-bounce-subtle`}
            style={{ animationDelay: "0.2s" }}
          >
            <MessageCircle className={`h-4 w-4 mx-auto mb-1 ${isPrimary ? "text-blue-500" : "text-blue-300"}`} />
            <div className={`text-xs font-bold ${isPrimary ? "text-pink-800" : "text-white"}`}>
              {stats.totalComments}
            </div>
            <div className={`text-xs ${isPrimary ? "text-pink-600" : "text-purple-300"}`}>Comments</div>
          </div>
        </div>

        {/* Social Feed Posts */}
        <div className="space-y-3 max-h-80 overflow-y-auto social-feed-scroll" onClick={(e) => e.stopPropagation()}>
          {socialPosts.slice(0, 3).map((post) => (
            <div
              key={post.id}
              className={`p-3 rounded-lg transition-all duration-300 ${
                isPrimary ? "bg-white/50 hover:bg-white/70" : "bg-purple-900/30 hover:bg-purple-900/50"
              }`}
            >
              <div className="flex items-start space-x-2">
                <img
                  src={post.avatar || "/placeholder.svg"}
                  alt={post.author}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-semibold truncate ${isPrimary ? "text-gray-800" : "text-white"}`}>
                      {post.author}
                    </span>
                    <Badge
                      className={`text-xs px-1 py-0 bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}
                    >
                      {post.platform}
                    </Badge>
                    <span className={`text-xs ${isPrimary ? "text-gray-500" : "text-purple-300"}`}>
                      {post.timestamp}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 line-clamp-2 ${isPrimary ? "text-gray-700" : "text-purple-100"}`}>
                    {post.content}
                  </p>
                  <div className="flex items-center space-x-3 text-xs">
                    <span
                      className={`flex items-center space-x-1 ${isPrimary ? "text-gray-500" : "text-purple-300"}`}
                    >
                      <Heart className="h-3 w-3" />
                      <span>{post.likes}</span>
                    </span>
                    <span
                      className={`flex items-center space-x-1 ${isPrimary ? "text-gray-500" : "text-purple-300"}`}
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-pink-200/30">
          <span className={`text-xs ${isPrimary ? "text-pink-600" : "text-purple-300"}`}>
            Native social aggregation
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleViewAll()
            }}
            className={`text-xs h-6 px-2 ${
              isPrimary
                ? "text-pink-600 hover:text-pink-800 hover:bg-pink-100"
                : "text-purple-300 hover:text-pink-300 hover:bg-purple-700"
            }`}
          >
            View All →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
