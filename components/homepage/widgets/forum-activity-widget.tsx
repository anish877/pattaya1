"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Users, TrendingUp, Clock, Eye, ThumbsUp, MessageCircle, Star, Zap, Users2, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buildApiUrl } from "@/lib/strapi-config"
import { ForumThreadItem } from "./forum-thread-item"

interface EnhancedForumTopic {
  id: string | number
  title: string
  url: string
  category_id: number
  author: {
    username: string
    name: string
    avatar_template?: string
  }
  reply_count: number
  view_count: number
  like_count: number
  last_activity: string
  created_at: string
  is_hot: boolean
  is_pinned: boolean
  tags: string[]
  excerpt: string
  category_info: {
    name: string
    icon: string
    color: string
  }
  avatar_url?: string | null
}

interface ForumStats {
  totalPosts: number
  activeUsers: number
  newPostsToday: number
  hotTopics: number
}

export function ForumActivityWidget() {
  const [topics, setTopics] = useState<EnhancedForumTopic[]>([])
  const [stats, setStats] = useState<ForumStats>({
    totalPosts: 0,
    activeUsers: 0,
    newPostsToday: 0,
    hotTopics: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadForumData()
    const interval = setInterval(loadForumData, 120000) // Refresh every 2 minutes
    return () => clearInterval(interval)
  }, [])

  const loadForumData = async () => {
    try {
      setLoading(true)
      console.log('Fetching enhanced forum activities from Strapi...')
      
      // Use the new enhanced endpoint
      const response = await fetch(buildApiUrl("forum-activity/enhanced?limit=5"))
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          setTopics(data.data)
          
          // Calculate stats from the data
          const totalPosts = data.data.length
          const activeUsers = new Set(data.data.map((topic: EnhancedForumTopic) => topic.author.username)).size
          const newPostsToday = data.data.filter((topic: EnhancedForumTopic) => {
            const postDate = new Date(topic.last_activity)
            const today = new Date()
            return postDate.toDateString() === today.toDateString()
          }).length
          const hotTopics = data.data.filter((topic: EnhancedForumTopic) => topic.is_hot).length
          
          setStats({
            totalPosts,
            activeUsers,
            newPostsToday,
            hotTopics,
          })
        } else {
          setTopics([])
          setStats({
            totalPosts: 0,
            activeUsers: 0,
            newPostsToday: 0,
            hotTopics: 0,
          })
        }
      } else {
        console.error('Failed to fetch forum activities:', response.status)
        setTopics([])
      }
    } catch (error) {
      console.error('Error loading forum data:', error)
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100/60 p-6">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Community Forum</h3>
              <p className="text-sm text-gray-500 font-medium">Loading discussions...</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-80 overflow-hidden">
            <div className="space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-2xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-100 rounded-xl w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
                      <div className="h-3 bg-gray-100 rounded-lg w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
      {/* Apple-style Header */}
      <CardHeader className="bg-white border-b border-gray-100/60 p-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Community Forum</h3>
              <p className="text-sm text-gray-500 font-medium">Live discussions & insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">Live</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Apple-style Stats Grid */}
        <div className="bg-gray-50/50 border-b border-gray-100/60 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.hotTopics}</div>
              <div className="text-xs font-medium text-gray-500">Hot Topics</div>
            </div>
            <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.newPostsToday}</div>
              <div className="text-xs font-medium text-gray-500">New Today</div>
            </div>
            <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Users2 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeUsers}</div>
              <div className="text-xs font-medium text-gray-500">Active Users</div>
            </div>
            <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Star className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalPosts}</div>
              <div className="text-xs font-medium text-gray-500">Total Posts</div>
            </div>
          </div>
        </div>

        {/* Apple-style Scrollable Content */}
        <div className="min-h-64 max-h-80 md:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="space-y-1 p-6">
            {topics.length > 0 ? (
              topics.map((topic, index) => (
                <div key={topic.id} className="group">
                  <div className="bg-white rounded-2xl border border-gray-100/60 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
                    <ForumThreadItem topic={topic} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="p-6 bg-gray-50 rounded-2xl mb-6">
                  <MessageCircle className="h-16 w-16 text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-600 mb-2">No forum activity available</p>
                <p className="text-sm text-gray-500 text-center">Check back later for new discussions</p>
                <div className="mt-6 flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apple-style Footer */}
        {topics.length > 0 && (
          <div className="bg-white border-t border-gray-100/60 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live updates every 2 minutes</span>
              </div>
              <a
                href="/forum"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <TrendingUp className="h-4 w-4" />
                View All Discussions
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}