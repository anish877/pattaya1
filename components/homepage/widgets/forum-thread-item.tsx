"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, Eye, ThumbsUp } from "lucide-react"

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
  }
}

export function ForumThreadItem({ topic }: ForumThreadItemProps) {
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

  return (
    <a
      href={topic.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-5 transition-all duration-200"
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

          {/* Author Info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span>by </span>
              <span className="font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                {topic.author.username}
              </span>
            </div>

            {/* Additional Stats (Optional) */}
            {(topic.view_count > 0 || topic.like_count > 0) && (
              <div className="flex items-center gap-2">
                {topic.view_count > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs text-gray-600 font-medium">{topic.view_count}</span>
                  </div>
                )}
                {topic.like_count > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-100 rounded-lg">
                    <ThumbsUp className="h-3.5 w-3.5 text-pink-500" />
                    <span className="text-xs text-pink-600 font-medium">{topic.like_count}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}
