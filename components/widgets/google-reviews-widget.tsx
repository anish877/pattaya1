"use client"

import { useState, useEffect } from "react"
import { Star, ExternalLink, RefreshCw, MapPin, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buildApiUrl } from "@/lib/strapi-config"
import { ReviewCard } from "./review-card"

interface Review {
  id: number
  source_platform: string
  author_name: string
  rating: number
  review_text: string
  review_timestamp: string
  author_profile_url?: string
  author_profile_photo_url?: string
  business_name: string
  business_address?: string
  verified: boolean
  business?: {
    name: string
    slug: string
    rating: number
    reviewCount: number
  }
}

interface ReviewsData {
  data: Review[]
  meta: {
    total: number
    limit: number
    platform: string
    timestamp: string
  }
}

interface ReviewsStats {
  data: {
    total_reviews: number
    platforms: Record<string, number>
    average_rating: number
    rating_distribution: Record<number, number>
    recent_reviews_24h: number
  }
  meta: {
    business_id: string
    timestamp: string
  }
}

export function GoogleReviewsWidget() {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [statsData, setStatsData] = useState<ReviewsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [isLive, setIsLive] = useState(true)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  /* ------------------------------------------------------------------ */
  /*                             EFFECTS                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    loadReviews()
    loadStats()

    // Auto-rotate reviews every 6 seconds when auto-play is enabled
    const interval = setInterval(() => {
      if (!isAutoPlay) return
      const total = reviewsData?.data?.length ?? 0
      if (!total) return
      nextReview()
    }, 6000)

    // Live polling every 30 seconds
    const liveInterval = setInterval(() => {
      if (isLive) {
        loadReviews()
      }
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(liveInterval)
    }
  }, [reviewsData?.data?.length, isLive, isAutoPlay])

  /* ------------------------------------------------------------------ */
  /*                        DATA FETCH / FALLBACK                       */
  /* ------------------------------------------------------------------ */
  const loadReviews = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log('Fetching latest reviews from Strapi...')
      
      const response = await fetch(buildApiUrl("google-reviews/latest?limit=10"))
      
      if (response.ok) {
        const data: ReviewsData = await response.json()
        setReviewsData(data)
      } else {
        console.error("Failed to load reviews from Strapi:", response.status)
        setReviewsData(getFallbackReviewsData())
      }
    } catch (err) {
      console.error("Reviews loading error:", err)
      setError("Unable to load reviews")
      setReviewsData(getFallbackReviewsData())
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(buildApiUrl("google-reviews/stats"))
      
      if (response.ok) {
        const data: ReviewsStats = await response.json()
        setStatsData(data)
      }
    } catch (err) {
      console.error("Stats loading error:", err)
    }
  }

  const getFallbackReviewsData = (): ReviewsData => ({
    data: sampleReviews,
    meta: {
      total: sampleReviews.length,
      limit: 10,
      platform: 'all',
      timestamp: new Date().toISOString()
    }
  })

  const toggleLive = () => {
    setIsLive(!isLive)
  }

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay)
  }

  const nextReview = () => {
    if (isTransitioning || !reviewsData?.data?.length) return
    setIsTransitioning(true)
    const total = reviewsData.data.length
    setCurrentReviewIndex((prev) => (prev + 1) % total)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const prevReview = () => {
    if (isTransitioning || !reviewsData?.data?.length) return
    setIsTransitioning(true)
    const total = reviewsData.data.length
    setCurrentReviewIndex((prev) => (prev - 1 + total) % total)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const goToReview = (index: number) => {
    if (isTransitioning || !reviewsData?.data?.length || index === currentReviewIndex) return
    setIsTransitioning(true)
    setCurrentReviewIndex(index)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  /* ------------------------------------------------------------------ */
  /*                            HELPERS                                 */
  /* ------------------------------------------------------------------ */
  const getPlatformStats = () => {
    if (!statsData?.data?.platforms) return null
    
    const platforms = Object.entries(statsData.data.platforms)
    if (platforms.length === 0) return null
    
    return platforms.map(([platform, count]) => (
      <span key={platform} className="text-xs text-gray-600">
        {platform}: {count}
      </span>
    )).reduce((prev, curr, index) => [
      prev,
      <span key={`sep-${index}`} className="text-gray-400">•</span>,
      curr
    ] as any)
  }

  /* ------------------------------------------------------------------ */
  /*                          RENDER STATES                             */
  /* ------------------------------------------------------------------ */
  if (loading) return <SkeletonCard />

  if (!reviewsData || (reviewsData.data?.length ?? 0) === 0) return <EmptyCard />

  const current = reviewsData.data[currentReviewIndex]

  return (
    <Card className="top-row-widget reviews-widget bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2 text-yellow-800">
            <Star className="w-4 h-4 text-yellow-600 animate-pulse" />
            <span>Latest Reviews</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAutoPlay}
              className={`h-6 w-6 p-0 ${isAutoPlay ? 'text-green-600' : 'text-gray-500'}`}
              aria-label={isAutoPlay ? 'Pause auto-play' : 'Start auto-play'}
            >
              {isAutoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadReviews}
              className="h-6 w-6 p-0"
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full">
        {/* Carousel Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Current review with transition */}
          <div 
            className={`transition-all duration-300 ease-in-out ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <ReviewCard review={current} />
          </div>
        </div>

        {/* Carousel Navigation */}
        <div className="flex items-center justify-between mt-4">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={prevReview}
            disabled={isTransitioning || reviewsData?.data?.length <= 1}
            className="h-8 w-8 p-0 hover:bg-yellow-100"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Indicators */}
          <div className="flex items-center space-x-1">
            {reviewsData?.data?.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => goToReview(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentReviewIndex
                    ? 'bg-yellow-600 w-4'
                    : 'bg-yellow-300 hover:bg-yellow-400'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
            {reviewsData?.data?.length > 5 && (
              <span className="text-xs text-gray-500 ml-1">
                +{reviewsData.data.length - 5}
              </span>
            )}
          </div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={nextReview}
            disabled={isTransitioning || reviewsData?.data?.length <= 1}
            className="h-8 w-8 p-0 hover:bg-yellow-100"
            aria-label="Next review"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats and Info */}
        <div className="flex items-center justify-between text-xs text-yellow-600 mt-3 pt-2 border-t border-yellow-200">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>Pattaya Reviews</span>
            {statsData?.data?.average_rating && (
              <span className="ml-2">
                Avg: {statsData.data.average_rating.toFixed(1)}⭐
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              {currentReviewIndex + 1}/{reviewsData.data.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-yellow-100"
              onClick={() => window.open("https://www.google.com/maps/search/pattaya+reviews", "_blank")}
              aria-label="Open in Google Maps"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Platform stats */}
        {getPlatformStats() && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
            {getPlatformStats()}
          </div>
        )}

        {error && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded text-center mt-2">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*               SMALL SUB-COMPONENTS & SAMPLE DATA                    */
/* ------------------------------------------------------------------ */
function SkeletonCard() {
  return (
    <Card className="top-row-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Star className="w-4 h-4" />
          <span>Google Reviews</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyCard() {
  return (
    <Card className="top-row-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Star className="w-4 h-4" />
          <span>Google Reviews</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Star className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm">No reviews available</p>
        </div>
      </CardContent>
    </Card>
  )
}

/* Demo fallback reviews shown if API fails */
const sampleReviews: Review[] = [
  {
    id: 1,
    source_platform: "Google",
    author_name: "Sarah Johnson",
    rating: 5,
    review_text: "Amazing atmosphere and great live music! The food was delicious and the staff was very friendly. Highly recommend for a night out in Pattaya.",
    review_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author_profile_photo_url: "",
    business_name: "Hard Rock Cafe Pattaya",
    business_address: "Beach Road, Pattaya",
    verified: true,
  },
  {
    id: 2,
    source_platform: "Yelp",
    author_name: "Mike Chen",
    rating: 4,
    review_text: "Great location right on the beach. Service was good and the drinks were reasonably priced. Will definitely come back!",
    review_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    author_profile_photo_url: "",
    business_name: "Beachside Bar & Grill",
    business_address: "Jomtien Beach, Pattaya",
    verified: true,
  },
  {
    id: 3,
    source_platform: "Facebook",
    author_name: "Emma Wilson",
    rating: 5,
    review_text: "Perfect family restaurant with amazing Thai food. The kids loved it and the service was excellent. Will be back soon!",
    review_timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    author_profile_photo_url: "",
    business_name: "Thai Garden Restaurant",
    business_address: "Central Pattaya",
    verified: false,
  },
]
