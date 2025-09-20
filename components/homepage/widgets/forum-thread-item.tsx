"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, Eye, ThumbsUp, Heart, Smile, Frown, Angry, Laugh } from "lucide-react"

interface ForumThreadItemProps {
  topic: {
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
    _originalTopic?: any // Store original topic data for reactions
  }
}

export function ForumThreadItem({ topic }: ForumThreadItemProps) {
  const router = useRouter()
  const [isReacting, setIsReacting] = useState(false)
  const [reactionCounts, setReactionCounts] = useState({
    like: topic.like_count || 0,
    love: topic._originalTopic?.reactionCounts?.love || 0,
    laugh: topic._originalTopic?.reactionCounts?.laugh || 0,
    wow: topic._originalTopic?.reactionCounts?.wow || 0,
    sad: topic._originalTopic?.reactionCounts?.sad || 0,
    angry: topic._originalTopic?.reactionCounts?.angry || 0
  })

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleTopicClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Navigate to the forum topic page
    router.push(`/forum/${topic.id}`)
  }

  const handleReaction = async (reactionType: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isReacting) return
    
    setIsReacting(true)
    
    try {
      const response = await fetch('/api/forum/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: topic.id,
          type: reactionType
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local reaction counts
        setReactionCounts(prev => ({
          ...prev,
          [reactionType]: (prev[reactionType as keyof typeof prev] || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    } finally {
      setIsReacting(false)
    }
  }

  const reactions = [
    { type: 'like', icon: ThumbsUp, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { type: 'love', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-100' },
    { type: 'laugh', icon: Laugh, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
    { type: 'wow', icon: Smile, color: 'text-purple-500', bgColor: 'bg-purple-100' },
    { type: 'sad', icon: Frown, color: 'text-gray-500', bgColor: 'bg-gray-100' },
    { type: 'angry', icon: Angry, color: 'text-orange-500', bgColor: 'bg-orange-100' }
  ]

  return (
    <div 
      className="block p-5 transition-colors duration-200 cursor-pointer hover:bg-gray-50 rounded-lg"
      onClick={handleTopicClick}
    >
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <Avatar className="h-12 w-12 flex-shrink-0 shadow-sm">
          <AvatarImage 
            src={topic.avatar_url || undefined} 
            alt={topic.author.name}
          />
          <AvatarFallback className="text-sm bg-blue-500 text-white font-semibold">
            {getAuthorInitials(topic.author.name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start gap-3 mb-4">
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 flex-1 hover:text-blue-600 transition-colors">
              {topic.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {topic.is_hot && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-xl shadow-sm">
                  <span className="text-sm">🔥</span>
                  <span>Hot</span>
                </div>
              )}
              {topic.is_pinned && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-xl shadow-sm">
                  <span className="text-sm">📌</span>
                  <span>Pinned</span>
                </div>
              )}
            </div>
          </div>

          {/* Excerpt */}
          {topic.excerpt && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {topic.excerpt}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Category */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl">
              <span 
                className="text-base"
                style={{ color: topic.category_info.color }}
              >
                {topic.category_info.icon}
              </span>
              <span className="font-medium text-gray-700 text-sm">
                {topic.category_info.name}
              </span>
            </div>

            {/* Engagement Metrics */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-xl">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium text-sm">{topic.reply_count} Replies</span>
            </div>

            {/* Last Activity */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-xl">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium text-sm">
                {formatTimeAgo(topic.last_activity)}
              </span>
            </div>
          </div>

          {/* Author Info and Reactions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span>by </span>
              <span className="font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                {topic.author.username}
              </span>
            </div>

            {/* Reaction Buttons */}
            <div className="flex items-center gap-1">
              {reactions.map(({ type, icon: Icon, color, bgColor }) => {
                const count = reactionCounts[type as keyof typeof reactionCounts] || 0
                if (count === 0) return null
                
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 ${bgColor} hover:opacity-80 transition-opacity`}
                    onClick={(e) => handleReaction(type, e)}
                    disabled={isReacting}
                  >
                    <Icon className={`h-3.5 w-3.5 ${color} mr-1`} />
                    <span className={`text-xs font-medium ${color}`}>{count}</span>
                  </Button>
                )
              })}
              
              {/* Quick Like Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 bg-blue-100 hover:bg-blue-200 transition-colors"
                onClick={(e) => handleReaction('like', e)}
                disabled={isReacting}
              >
                <ThumbsUp className="h-3.5 w-3.5 text-blue-500 mr-1" />
                <span className="text-xs font-medium text-blue-500">Like</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
