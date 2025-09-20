"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Star,
  Clock,
  MapPin,
  Users,
  Zap,
  TrendingUp,
  Music,
  Utensils,
  Waves,
  Camera,
  Heart,
  FlameIcon as Fire,
  Crown,
  Sparkles,
  Timer,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MarqueeItem {
  id: string
  type: "deal" | "event" | "trending" | "live" | "news" | "achievement"
  title: string
  subtitle: string
  rating?: number
  discount?: string
  location?: string
  time?: string
  status: "live" | "hot" | "new" | "trending" | "ending" | "featured"
  icon: React.ReactNode
  color: string
  gradient: string
  participants?: number
  views?: number
  likes?: number
  comments?: number
  urgency?: "high" | "medium" | "low"
  category: string
  image?: string
  countdown?: number
  url: string
}

export function ScrollingMarquee() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const [activeItem, setActiveItem] = useState<string | null>(null)

  // Real-time data simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      updateMarqueeData()
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const updateMarqueeData = () => {
    const items: MarqueeItem[] = [
      {
        id: "massage-deal",
        type: "deal",
        title: "50% Off Thai Massage",
        subtitle: "Limited time offer at Spa Paradise",
        rating: 4.8,
        discount: "50%",
        location: "Central Pattaya",
        time: "Until midnight",
        status: "ending",
        icon: <Heart className="w-5 h-5" />,
        color: "from-pink-500 to-rose-600",
        gradient: "bg-gradient-to-r from-pink-500/20 to-rose-600/20",
        participants: 127,
        urgency: "high",
        category: "Wellness",
        countdown: 180,
        url: "/events/thai-massage-deal",
      },
      {
        id: "night-market",
        type: "event",
        title: "New Night Market Opens Tonight",
        subtitle: "Grand opening celebration at Central Pattaya",
        location: "Central Pattaya",
        time: "6:00 PM",
        status: "new",
        icon: <Utensils className="w-5 h-5" />,
        color: "from-orange-500 to-amber-600",
        gradient: "bg-gradient-to-r from-orange-500/20 to-amber-600/20",
        participants: 2340,
        views: 15600,
        urgency: "medium",
        category: "Food & Dining",
        url: "/events/night-market-opening",
      },
      {
        id: "rooftop-bar",
        type: "trending",
        title: "Rooftop Bar Trending #1",
        subtitle: "Sky Lounge packed tonight - 4.9★ reviews",
        rating: 4.9,
        location: "Beach Road",
        status: "hot",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "from-purple-500 to-indigo-600",
        gradient: "bg-gradient-to-r from-purple-500/20 to-indigo-600/20",
        participants: 890,
        likes: 3420,
        comments: 156,
        urgency: "medium",
        category: "Nightlife",
        url: "/events/rooftop-bar-trending",
      },
      {
        id: "volleyball",
        type: "event",
        title: "Beach Volleyball Tournament",
        subtitle: "Registration open now - Tomorrow 9:00 AM at Jomtien Beach",
        location: "Jomtien Beach",
        time: "Tomorrow 9:00 AM",
        status: "featured",
        icon: <Waves className="w-5 h-5" />,
        color: "from-cyan-500 to-blue-600",
        gradient: "bg-gradient-to-r from-cyan-500/20 to-blue-600/20",
        participants: 64,
        urgency: "low",
        category: "Sports",
        url: "/events/beach-volleyball",
      },
      {
        id: "happy-hour",
        type: "deal",
        title: "Happy Hour 2-for-1 Cocktails",
        subtitle: "Until midnight at Sunset Bar",
        rating: 4.7,
        discount: "2-for-1",
        location: "Sunset Bar",
        time: "Until midnight",
        status: "live",
        icon: <Music className="w-5 h-5" />,
        color: "from-green-500 to-emerald-600",
        gradient: "bg-gradient-to-r from-green-500/20 to-emerald-600/20",
        participants: 234,
        urgency: "high",
        category: "Nightlife",
        countdown: 420,
        url: "/events/happy-hour-cocktails",
      },
      {
        id: "jazz-night",
        type: "live",
        title: "Live Jazz Night at Ocean View",
        subtitle: "Starting in 30 minutes - Premium beachfront dining",
        location: "Beach Road",
        time: "8:00 PM",
        status: "live",
        icon: <Music className="w-5 h-5" />,
        color: "from-red-500 to-pink-600",
        gradient: "bg-gradient-to-r from-red-500/20 to-pink-600/20",
        participants: 156,
        views: 8900,
        urgency: "high",
        category: "Entertainment",
        url: "/events/jazz-night",
      },
      {
        id: "photography",
        type: "achievement",
        title: "50% More Photo Uploads Today",
        subtitle: "Community sharing at all-time high",
        status: "trending",
        icon: <Camera className="w-5 h-5" />,
        color: "from-violet-500 to-purple-600",
        gradient: "bg-gradient-to-r from-violet-500/20 to-purple-600/20",
        participants: 1890,
        likes: 12400,
        urgency: "low",
        category: "Community",
        url: "/events/photo-uploads",
      },
      {
        id: "street-food",
        type: "trending",
        title: "Street Food Festival This Weekend",
        subtitle: "50+ vendors confirmed - Walking Street",
        location: "Walking Street",
        time: "Sat-Sun",
        status: "featured",
        icon: <Utensils className="w-5 h-5" />,
        color: "from-yellow-500 to-orange-600",
        gradient: "bg-gradient-to-r from-yellow-500/20 to-orange-600/20",
        participants: 3200,
        urgency: "medium",
        category: "Food & Events",
        url: "/events/street-food-festival",
      },
    ]

    setMarqueeItems(items)
  }

  useEffect(() => {
    updateMarqueeData()
  }, [])

  const getStatusBadge = (status: string, urgency?: string) => {
    const badges = {
      live: {
        text: "LIVE",
        class:
          "bg-red-600 text-white font-black text-xs px-2 py-0.5 shadow-2xl border-2 border-white ring-2 ring-red-600/50",
      },
      hot: {
        text: "HOT",
        class:
          "bg-orange-600 text-white font-black text-xs px-2 py-0.5 shadow-2xl border-2 border-white ring-2 ring-orange-600/50",
      },
      new: {
        text: "NEW",
        class:
          "bg-green-600 text-white font-black text-xs px-2 py-0.5 shadow-2xl border-2 border-white ring-2 ring-green-600/50",
      },
      trending: {
        text: "TRENDING",
        class:
          "bg-purple-600 text-white font-black text-xs px-2 py-0.5 shadow-2xl border-2 border-white ring-2 ring-purple-600/50",
      },
      ending: {
        text: "ENDING SOON",
        class:
          "bg-red-700 text-white font-black text-xs px-2 py-0.5 shadow-2xl border-2 border-white ring-2 ring-red-700/50 animate-pulse",
      },
      featured: {
        text: "FEATURED",
        class:
          "bg-blue-600 text-white font-black text-xs px-2 py-0.5 shadow-2xl border-2 border-white ring-2 ring-blue-600/50",
      },
    }

    return badges[status as keyof typeof badges] || badges.featured
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  const handleItemClick = (item: MarqueeItem) => {
    setActiveItem(item.id)
    // Add click tracking or navigation logic here
    console.log(`Clicked on ${item.title}`)
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/30">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-gradient"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Marquee Container */}
      <div
        className="relative py-4 max-w-[80%] mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Time and Stats Header */}
        <div className="flex justify-between items-center px-6 mb-2">
          <div className="flex items-center space-x-4 text-white/80 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>12,847 online</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>156K views today</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white/60 text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Live Updates</span>
          </div>
        </div>

        {/* Scrolling Marquee */}
        <div className="relative overflow-hidden">
          <div
            className={`flex space-x-4 ${isHovered ? "animate-none" : "animate-scroll"}`}
            style={{
              width: "max-content",
              animationDuration: "60s",
            }}
          >
            {/* Duplicate items for seamless loop */}
            {[...marqueeItems, ...marqueeItems].map((item, index) => {
              const statusBadge = getStatusBadge(item.status, item.urgency)
              const isActive = activeItem === item.id

              return (
                <Link
                  key={`${item.id}-${index}`}
                  href={item.url}
                  className={`
                    relative group cursor-pointer transform transition-all duration-300 hover:scale-105
                    ${isActive ? "scale-105 z-10" : ""}
                    block
                  `}
                  onClick={() => handleItemClick(item)}
                >
                  {/* Main Card */}
                  <div
                    className={`
                    relative w-[308px] h-[140px] p-3 pt-4 rounded-2xl border backdrop-blur-xl
                    ${item.gradient} border-white/20 hover:border-white/40
                    shadow-2xl hover:shadow-3xl transition-all duration-300
                    ${isActive ? "ring-2 ring-white/50" : ""}
                    mt-4 mb-2
                  `}
                  >
                    {/* Glow Effect */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                    />

                    {/* Status Badge - Fixed positioning with proper spacing */}
                    <div className="absolute top-1 right-1 z-30">
                      <div className="relative">
                        <Badge
                          className={`${statusBadge.class} rounded-lg transform rotate-3 hover:rotate-0 transition-transform duration-200`}
                        >
                          {statusBadge.text}
                        </Badge>
                      </div>
                    </div>

                    {/* Urgency Indicator */}
                    {item.urgency === "high" && (
                      <div className="absolute top-3 left-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className={`p-1.5 rounded-xl bg-gradient-to-r ${item.color} text-white shadow-lg flex-shrink-0`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-sm leading-tight truncate">{item.title}</h3>
                            <p className="text-white/80 text-xs truncate">{item.subtitle}</p>
                          </div>
                        </div>

                        {item.discount && (
                          <div className="bg-yellow-400 text-black font-black text-sm px-2 py-1 rounded-full shadow-lg flex-shrink-0 ml-2">
                            {item.discount}
                          </div>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 text-white/70 text-xs flex-1 min-w-0">
                          {item.rating && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{item.rating}</span>
                            </div>
                          )}

                          {item.location && (
                            <div className="flex items-center space-x-1 min-w-0">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}

                          {item.time && (
                            <div className="flex items-center space-x-1 min-w-0">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{item.time}</span>
                            </div>
                          )}
                        </div>

                        <Badge variant="outline" className="text-white/60 border-white/30 text-xs flex-shrink-0">
                          {item.category}
                        </Badge>
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 text-white/60 text-xs">
                          {item.participants && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{item.participants.toLocaleString()}</span>
                            </div>
                          )}

                          {item.views && (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{item.views.toLocaleString()}</span>
                            </div>
                          )}

                          {item.likes && (
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{item.likes.toLocaleString()}</span>
                            </div>
                          )}

                          {item.comments && (
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{item.comments}</span>
                            </div>
                          )}
                        </div>

                        {/* Countdown Timer */}
                        {item.countdown && (
                          <div className="flex items-center space-x-1 bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">
                            <Timer className="w-3 h-3" />
                            <span>{formatTime(item.countdown)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/20">
                        <Button
                          size="sm"
                          className={`bg-gradient-to-r ${item.color} hover:opacity-90 text-white shadow-lg text-xs px-3 py-1 h-7`}
                        >
                          {item.type === "deal"
                            ? "Claim Deal"
                            : item.type === "event"
                              ? "Join Event"
                              : item.type === "live"
                                ? "Watch Live"
                                : "Learn More"}
                        </Button>

                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-white p-1 h-7 w-7">
                            <Heart className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-white p-1 h-7 w-7">
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow */}
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 -z-10`}
                  />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="flex justify-center items-center mt-2 space-x-8 text-white/60 text-xs">
          <div className="flex items-center space-x-1">
            <Fire className="w-4 h-4 text-orange-400" />
            <span>8 Hot Deals</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>12 Live Events</span>
          </div>
          <div className="flex items-center space-x-1">
            <Crown className="w-4 h-4 text-purple-400" />
            <span>5 Featured</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>23 Trending</span>
          </div>
        </div>
      </div>

      {/* Pause Indicator */}
      {isHovered && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
          Paused - Hover to explore
        </div>
      )}
    </div>
  )
}
