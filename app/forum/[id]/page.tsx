"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Heart, Share2, Flag, MoreHorizontal, Reply, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"

interface ForumTopic {
  id: string
  title: string
  content: string
  excerpt: string
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
  createdAt: string
  lastActivity: string
  reactionCounts: {
    like: number
    love: number
    laugh: number
    wow: number
    sad: number
    angry: number
  }
  userReactions: Record<string, string>
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
  createdAt: string
  isBestAnswer: boolean
  isEdited: boolean
  editedAt?: string
  reactionCounts: {
    like: number
    love: number
    laugh: number
    wow: number
    sad: number
    angry: number
  }
  userReactions: Record<string, string>
}

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, firebaseUser } = useAuth()
  const [topic, setTopic] = useState<ForumTopic | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadTopicData()
    }
  }, [params.id])

  const loadTopicData = async () => {
    try {
      setLoading(true)
      const [topicRes, postsRes] = await Promise.all([
        fetch(`/api/forum/topics/${params.id}`),
        fetch(`/api/forum/posts?topic=${params.id}`)
      ])

      if (topicRes.ok && postsRes.ok) {
        const topicData = await topicRes.json()
        const postsData = await postsRes.json()
        
        setTopic(topicData.data)
        setPosts(postsData.data || [])
      } else {
        console.error("Failed to load topic data")
      }
    } catch (error) {
      console.error("Failed to load topic data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || !topic) return

    try {
      setSubmitting(true)
      const response = await fetch("/api/forum/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await firebaseUser?.getIdToken()}`
        },
        body: JSON.stringify({
          data: {
            content: newComment,
            topic: topic.id
          }
        })
      })

      if (response.ok) {
        setNewComment("")
        loadTopicData() // Reload to get the new comment
      } else {
        console.error("Failed to create comment")
      }
    } catch (error) {
      console.error("Failed to create comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (targetId: string, reactionType: string, isTopic: boolean = false) => {
    if (!user) {
      console.log("No user found, cannot add reaction")
      return
    }

    
    console.log("Adding reaction:", { targetId, reactionType, isTopic, user: user.uid })

    try {
      const token = await firebaseUser?.getIdToken()
      console.log("Firebase token:", token ? "Present" : "Missing")
      
      const requestBody: any = {
        type: reactionType
      };
      
      if (isTopic) {
        requestBody.topicId = targetId;
      } else {
        requestBody.postId = targetId;
      }
      
      const response = await fetch("/api/forum-reactions/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log("Reaction response status:", response.status)
      
      if (response.ok) {
        console.log("Reaction added successfully")
        loadTopicData() // Reload to get updated reaction counts
      } else {
        const errorData = await response.json()
        console.error("Failed to add reaction:", errorData)
      }
    } catch (error) {
      console.error("Failed to add reaction:", error)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Topic not found</h1>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
          
          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="outline">{topic.category?.name || 'Uncategorized'}</Badge>
            {topic.isPinned && <Badge variant="secondary">Pinned</Badge>}
            {topic.isLocked && <Badge variant="destructive">Locked</Badge>}
          </div>
        </div>

        {/* Topic */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{topic.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{topic.author.username[0]}</AvatarFallback>
                    </Avatar>
                    <span>{topic.author.username}</span>
                  </div>
                  <span>•</span>
                  <span>{formatTimeAgo(topic.createdAt)}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{posts.length} replies</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
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
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: topic.content }} />
            </div>
            
            {/* Topic Reactions */}
            <div className="flex items-center space-x-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(topic.id, "like", true)}
                className="flex items-center space-x-1"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{topic.reactionCounts?.like || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(topic.id, "love", true)}
                className="flex items-center space-x-1"
              >
                <Heart className="h-4 w-4" />
                <span>{topic.reactionCounts?.love || 0}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Comments ({posts.length})</h2>
          
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{post.author.username[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{post.author.username}</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                      {post.isBestAnswer && <Badge variant="secondary">Best Answer</Badge>}
                      {post.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
                    </div>
                    
                    <div className="prose max-w-none mb-4">
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>
                    
                    {/* Post Reactions */}
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(post.id, "like")}
                        className="flex items-center space-x-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.reactionCounts?.like || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(post.id, "love")}
                        className="flex items-center space-x-1"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{post.reactionCounts?.love || 0}</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Comment */}
        {user && !topic.isLocked && (
          <Card>
            <CardHeader>
              <CardTitle>Add a Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComment}>
                <Textarea
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-4"
                  rows={4}
                />
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  {submitting ? "Posting..." : "Post Comment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">Please log in to comment on this topic.</p>
              <Button onClick={() => router.push("/auth/login")}>
                Log In
              </Button>
            </CardContent>
          </Card>
        )}

        {topic.isLocked && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">This topic is locked and no longer accepting comments.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
