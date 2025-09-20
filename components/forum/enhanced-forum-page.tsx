"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Pin,
  Lock,
  Eye,
  Reply,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Calendar,
  Award,
  MessageCircle,
  Heart,
  Share2,
  Flag,
  MoreHorizontal,
  MapPin,
  Utensils,
  Music,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateTopicModal } from "./create-topic-modal"

interface ForumCategory {
  id: string
  name: string
  description: string
  topicCount: number
  postCount: number
  lastPost: {
    title: string
    author: string
    timestamp: string
  }
  icon: string
  color: string
}

interface ForumTopic {
  id: string
  title: string
  author: {
    id: number
    username: string
    email: string
    firebaseUid: string
  }
  category: {
    id: number
    name: string
    slug: string
    description: string
    icon: string
    color: string
  }
  replies: number
  views: number
  likes: number
  isPinned: boolean
  isLocked: boolean
  lastReply?: {
    author: string
    timestamp: string
  }
  createdAt: string
  tags?: string[]
  excerpt: string
}

interface ForumPost {
  id: string
  content: string
  author: {
    id: number
    username: string
    email: string
    firebaseUid: string
  }
  timestamp: string
  likes: number
  isLiked: boolean
  replies: ForumPost[]
  isEdited: boolean
  editedAt?: string
}

export function EnhancedForumPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("latest")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("topics")
  const [showCreateTopic, setShowCreateTopic] = useState(false)

  useEffect(() => {
    loadForumData()
  }, [selectedCategory, sortBy])

  const loadForumData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, topicsRes] = await Promise.all([
        fetch("/api/forum/categories"),
        fetch(`/api/forum/topics?category=${selectedCategory}&sort=${sortBy}&search=${searchTerm}`),
      ])

      if (categoriesRes.ok && topicsRes.ok) {
        const categoriesData = await categoriesRes.json()
        const topicsData = await topicsRes.json()
        
        if (categoriesData.error) {
          console.error("Categories API error:", categoriesData.error)
        }
        if (topicsData.error) {
          console.error("Topics API error:", topicsData.error)
        }
        
        setCategories(categoriesData.data || [])
        setTopics(topicsData.data || [])
      } else {
        console.error("Failed to load forum data:", {
          categories: categoriesRes.status,
          topics: topicsRes.status
        })
      }
    } catch (error) {
      console.error("Failed to load forum data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadForumData()
  }

  const handleTopicCreated = (newTopic: any) => {
    // Add the new topic to the list
    setTopics(prev => [newTopic, ...prev])
    setShowCreateTopic(false)
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: React.ElementType } = {
      general: MessageSquare,
      travel: MapPin,
      food: Utensils,
      nightlife: Music,
      business: Briefcase,
      events: Calendar,
      help: Users,
    }
    return icons[iconName] || MessageSquare
  }

  const getTopicStatusIcon = (topic: ForumTopic) => {
    if (topic.isPinned) return <Pin className="h-4 w-4 text-blue-500" />
    if (topic.isLocked) return <Lock className="h-4 w-4 text-gray-500" />
    return <MessageSquare className="h-4 w-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Forum</h1>
              <p className="text-gray-600">Connect with locals, travelers, and business owners in Pattaya</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowCreateTopic(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Topic
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search topics, posts, or users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>

              <div className="flex items-center space-x-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Activity</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="replies">Most Replies</SelectItem>
                    <SelectItem value="views">Most Views</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Topic Modal */}
        <CreateTopicModal
          isOpen={showCreateTopic}
          onClose={() => setShowCreateTopic(false)}
          categories={categories}
          onTopicCreated={handleTopicCreated}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>

              <TabsContent value="topics" className="space-y-4">
                {topics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">{getTopicStatusIcon(topic)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 
                                className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-1"
                                onClick={() => window.location.href = `/forum/${topic.id}`}
                              >
                                {topic.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">{topic.excerpt}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src="/placeholder.svg" />
                                    <AvatarFallback>
                                      {topic.author?.username?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{topic.author?.username || 'Unknown User'}</span>
                                </div>
                                <span>•</span>
                                <span>{formatTimeAgo(topic.createdAt)}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {topic.category?.name || 'Uncategorized'}
                                </Badge>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Reply className="h-4 w-4" />
                                <span>{topic.replies} replies</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{topic.views} views</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="h-4 w-4" />
                                <span>{topic.likes} likes</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {(topic.tags || []).slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {topic.lastReply && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <span>Last reply by</span>
                                  <span className="font-medium">{topic.lastReply.author}</span>
                                </div>
                                <span>{formatTimeAgo(topic.lastReply.timestamp)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {topics.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No topics found</h3>
                      <p className="text-gray-500 mb-4">Be the first to start a conversation!</p>
                      <Button onClick={() => setShowCreateTopic(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Topic
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => {
                    const IconComponent = getCategoryIcon(category.icon)
                    return (
                      <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg bg-${category.color}-100`}>
                              <IconComponent className={`h-6 w-6 text-${category.color}-600`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                              <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span>{category.topicCount} topics</span>
                                  <span>{category.postCount} posts</span>
                                </div>
                                <ChevronRight className="h-4 w-4" />
                              </div>
                              {category.lastPost && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="text-xs text-gray-500">
                                    Last: <span className="font-medium">{category.lastPost.title}</span> by{" "}
                                    {category.lastPost.author}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="trending" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Trending Topics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topics.slice(0, 5).map((topic, index) => (
                        <div key={topic.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                          <div className="flex-shrink-0">
                            <Badge
                              variant="secondary"
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                              {topic.title}
                            </h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                              <span>{topic.replies} replies</span>
                              <span>{topic.views} views</span>
                              <span>{topic.likes} likes</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{formatTimeAgo(topic.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Forum Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Forum Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Total Topics</span>
                    </div>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Total Posts</span>
                    </div>
                    <span className="font-semibold">8,934</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Active Members</span>
                    </div>
                    <span className="font-semibold">2,156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Online Now</span>
                    </div>
                    <span className="font-semibold">89</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Sarah Johnson",
                      posts: 234,
                      reputation: 1250,
                      avatar: "/placeholder.svg?height=32&width=32",
                    },
                    { name: "Mike Chen", posts: 189, reputation: 980, avatar: "/placeholder.svg?height=32&width=32" },
                    {
                      name: "Anna Rodriguez",
                      posts: 156,
                      reputation: 875,
                      avatar: "/placeholder.svg?height=32&width=32",
                    },
                    { name: "David Kim", posts: 134, reputation: 720, avatar: "/placeholder.svg?height=32&width=32" },
                  ].map((user, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {user.posts} posts • {user.reputation} rep
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      action: "New topic",
                      title: "Best Thai restaurants in Pattaya",
                      user: "FoodLover123",
                      time: "2m ago",
                    },
                    { action: "Reply", title: "Walking Street safety tips", user: "LocalGuide", time: "5m ago" },
                    { action: "New topic", title: "Visa extension process", user: "ExpatHelper", time: "12m ago" },
                    { action: "Reply", title: "Beach volleyball tournaments", user: "SportsFan", time: "18m ago" },
                  ].map((activity, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.action}
                        </Badge>
                        <span className="text-gray-500">{activity.time}</span>
                      </div>
                      <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        {activity.title}
                      </div>
                      <div className="text-gray-500">by {activity.user}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
