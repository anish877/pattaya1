"use client"

import { useState, useEffect, useRef } from "react"
import {
  Flame, Percent, Clock, MapPin, Star, Users, ExternalLink, X, 
  ShoppingBag, Tag, Timer, TrendingUp, Heart, Share2, Eye,
  ChevronRight, ChevronLeft, RefreshCw, Zap, Gift, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"
import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"
import { DealCard } from "@/components/deals/deal-card"

interface Deal {
  id: string
  title: string
  business: string
  location: string
  discount: string
  originalPrice: number
  salePrice: number
  timeLeft: string
  category: string
  urgent: boolean
  image: string
  rating?: number
  reviews?: number
  featured?: boolean
  views?: number
  clicks?: number
  slug?: string
  description?: string
  businessWebsite?: string
  dealUrl?: string
}

interface StrapiDeal {
  id: number
  deal_title: string
  slug: string
  description: string
  original_price: number
  sale_price: number
  isActive: boolean
  featured: boolean
  views: number
  clicks: number
  conversions: number
  image_gallery?: any[]
  business?: {
    data: {
      id: number
      attributes: {
        name: string
        address: string
        rating: number
        reviewCount: number
        website?: string
        logo?: {
          data: {
            attributes: {
              url: string
            }
          }
        }
      }
    }
  }
  deal_category?: {
    data: {
      id: number
      attributes: {
        name: string
        slug: string
      }
    }
  }
  createdAt: string
  updatedAt: string
  publishedAt: string
}

interface SponsoredWidgetBanner {
  isSponsored: boolean
  sponsorName?: string
  sponsorLogo?: string
  sponsorMessage?: string
  sponsorWebsite?: string
  sponsorColor?: string
  bannerPosition: "top" | "bottom" | "overlay"
}

export function EnhancedHotDealsWidget({ className }: { className?: string }) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sponsoredBanner, setSponsoredBanner] = useState<SponsoredWidgetBanner>({
    isSponsored: false,
    bannerPosition: "top"
  })
  const [logoLoadingStates, setLogoLoadingStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadDeals()
    loadSponsoredBanner()
  }, [])

  const loadDeals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Try to fetch from Strapi first
      const response = await fetch(buildApiUrl("deals?populate=*"))
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          const activeDeals = data.data
            .filter((strapiDeal: StrapiDeal) => strapiDeal.isActive)
            .sort((a: StrapiDeal, b: StrapiDeal) => {
              if (a.featured && !b.featured) return -1
              if (!a.featured && b.featured) return 1
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
            .map((strapiDeal: StrapiDeal) => ({
              id: strapiDeal.id.toString(),
              title: strapiDeal.deal_title || 'Untitled Deal',
              business: strapiDeal.business?.data?.attributes?.name || 'Business Name',
              location: strapiDeal.business?.data?.attributes?.address || 'Pattaya, Thailand',
              discount: calculateDiscount(strapiDeal.original_price, strapiDeal.sale_price),
              originalPrice: strapiDeal.original_price || 0,
              salePrice: strapiDeal.sale_price || 0,
              timeLeft: generateTimeLeft(),
              category: strapiDeal.deal_category?.data?.attributes?.name || 'Activity',
              urgent: strapiDeal.featured || false,
              image: strapiDeal.image_gallery?.[0]?.url ? buildStrapiUrl(strapiDeal.image_gallery[0].url) : "/placeholder.svg?height=120&width=200&text=Deal",
              rating: strapiDeal.business?.data?.attributes?.rating || 4.5,
              reviews: strapiDeal.business?.data?.attributes?.reviewCount || 0,
              featured: strapiDeal.featured || false,
              views: strapiDeal.views || 0,
              clicks: strapiDeal.clicks || 0,
              slug: strapiDeal.slug || '',
              description: strapiDeal.description || '',
              businessWebsite: strapiDeal.business?.data?.attributes?.website || '',
              dealUrl: `/deals/${strapiDeal.slug || strapiDeal.id}`
            }))
          
          setDeals(activeDeals)
        } else {
          // Fallback to sample data
          setDeals(getSampleDeals())
        }
      } else {
        // Fallback to sample data
        setDeals(getSampleDeals())
      }
    } catch (error) {
      console.error('Error loading deals:', error)
      setError('Failed to load deals')
      // Fallback to sample data
      setDeals(getSampleDeals())
    } finally {
      setIsLoading(false)
    }
  }

  const getSampleDeals = (): Deal[] => [
    {
      id: "1",
      title: "Thai Massage Special",
      business: "Luxury Spa Center",
      location: "Central Pattaya",
      discount: "50%",
      originalPrice: 1000,
      salePrice: 500,
      timeLeft: "2h 15m",
      category: "Wellness",
      urgent: true,
      image: "/placeholder.svg?height=120&width=200&text=Massage",
      rating: 4.8,
      reviews: 127,
      featured: true,
      views: 245,
      clicks: 89,
      slug: "thai-massage-special",
      description: "Relaxing Thai massage with professional therapists",
      businessWebsite: "https://luxuryspa.com",
      dealUrl: "/deals/thai-massage-special"
    },
    {
      id: "2",
      title: "Seafood Buffet",
      business: "Ocean View Restaurant",
      location: "Beach Road",
      discount: "30%",
      originalPrice: 899,
      salePrice: 629,
      timeLeft: "1 day",
      category: "Dining",
      urgent: false,
      image: "/placeholder.svg?height=120&width=200&text=Seafood",
      rating: 4.6,
      reviews: 203,
      featured: false,
      views: 189,
      clicks: 67,
      slug: "seafood-buffet",
      description: "Fresh seafood buffet with ocean view",
      businessWebsite: "https://oceanview.com",
      dealUrl: "/deals/seafood-buffet"
    },
    {
      id: "3",
      title: "Diving Course",
      business: "Adventure Dive Center",
      location: "Jomtien Beach",
      discount: "25%",
      originalPrice: 2400,
      salePrice: 1800,
      timeLeft: "3 days",
      category: "Adventure",
      urgent: false,
      image: "/placeholder.svg?height=120&width=200&text=Diving",
      rating: 4.9,
      reviews: 89,
      featured: true,
      views: 156,
      clicks: 45,
      slug: "diving-course",
      description: "Professional diving course with certified instructors",
      businessWebsite: "https://adventuredive.com",
      dealUrl: "/deals/diving-course"
    },
    {
      id: "4",
      title: "Sunset Cruise",
      business: "Pattaya Yacht Club",
      location: "Bali Hai Pier",
      discount: "40%",
      originalPrice: 1500,
      salePrice: 900,
      timeLeft: "6h 30m",
      category: "Tours",
      urgent: true,
      image: "/placeholder.svg?height=120&width=200&text=Cruise",
      rating: 4.7,
      reviews: 156,
      featured: false,
      views: 298,
      clicks: 112,
      slug: "sunset-cruise",
      description: "Romantic sunset cruise with dinner",
      businessWebsite: "https://pattayayacht.com",
      dealUrl: "/deals/sunset-cruise"
    }
  ]

  const calculateDiscount = (original: number, sale: number): string => {
    if (original <= 0 || sale <= 0) return "0%"
    const discount = Math.round(((original - sale) / original) * 100)
    return `${discount}%`
  }

  const generateTimeLeft = (): string => {
    const hours = Math.floor(Math.random() * 24)
    const minutes = Math.floor(Math.random() * 60)
    if (hours === 0) return `${minutes}m`
    if (hours < 24) return `${hours}h ${minutes}m`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''}`
  }

  const loadSponsoredBanner = async () => {
    try {
      const response = await fetch('/api/homepage-configs/widget/hot-deals')
      if (response.ok) {
        const data = await response.json()
        if (data.data?.sponsoredWidgetBanner) {
          setSponsoredBanner(data.data.sponsoredWidgetBanner)
        }
      }
    } catch (error) {
      console.error('Error loading sponsorship:', error)
    }
  }

  const handleWidgetClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="button"]')) {
      return
    }
    setIsExpanded(true)
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "wellness":
        return "bg-green-500/10 text-green-600 border-green-200"
      case "dining":
        return "bg-orange-500/10 text-orange-600 border-orange-200"
      case "adventure":
        return "bg-blue-500/10 text-blue-600 border-blue-200"
      case "tours":
        return "bg-purple-500/10 text-purple-600 border-purple-200"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200"
    }
  }


  const handleViewDeal = (deal: Deal) => {
    // Track the view action
    console.log('Viewing deal:', deal.title)
    
    // Open the deal page
    if (deal.dealUrl) {
      window.open(deal.dealUrl, '_blank')
    } else {
      // Fallback to business website if no deal URL
      if (deal.businessWebsite) {
        window.open(deal.businessWebsite, '_blank')
      }
    }
  }

  const handleBuyNow = (deal: Deal) => {
    // Track the buy now action
    console.log('Buy now clicked for deal:', deal.title)
    
    // Open the deal page for purchase
    if (deal.dealUrl) {
      window.open(deal.dealUrl, '_blank')
    } else {
      // Fallback to business website if no deal URL
      if (deal.businessWebsite) {
        window.open(deal.businessWebsite, '_blank')
      }
    }
  }

  const handleShareDeal = (deal: Deal) => {
    // Track the share action
    console.log('Sharing deal:', deal.title)
    
    // Use Web Share API if available, otherwise fallback to copying URL
    if (navigator.share) {
      navigator.share({
        title: deal.title,
        text: `Check out this amazing deal: ${deal.title} - ${deal.discount} OFF!`,
        url: deal.dealUrl || window.location.href
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      const shareText = `Check out this amazing deal: ${deal.title} - ${deal.discount} OFF! ${deal.dealUrl || window.location.href}`
      navigator.clipboard.writeText(shareText).then(() => {
        // You could show a toast notification here
        console.log('Deal link copied to clipboard!')
      }).catch(console.error)
    }
  }

  if (isLoading) {
    return (
      <Card className={`top-row-widget bg-gradient-to-tr from-orange-400 via-red-300 to-pink-400 rounded-[28px] shadow-xl border-0 backdrop-blur-xl transition-all duration-300 ${className || ""}`}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-2xl rounded-[28px]"></div>
          <div className="absolute top-6 left-8 animate-bounce-slow">
            <Flame className="w-10 h-10 text-orange-300 opacity-60" />
          </div>
          <div className="absolute top-8 right-8 animate-spin-slow">
            <Percent className="w-8 h-8 text-red-300 opacity-60" />
          </div>
          <div className="absolute bottom-10 left-10 animate-pulse">
            <ShoppingBag className="w-8 h-8 text-pink-300 opacity-60" />
          </div>
        </div>
        <CardHeader className="pb-4 sm:pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <span className="text-[15px] font-medium text-gray-900">Hot Deals</span>
            </div>
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (deals.length === 0) {
    return (
      <Card className={`top-row-widget bg-gradient-to-tr from-orange-400 via-red-300 to-pink-400 rounded-[28px] shadow-xl border-0 backdrop-blur-xl transition-all duration-300 ${className || ""}`}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-2xl rounded-[28px]"></div>
          <div className="absolute top-6 left-8 animate-bounce-slow">
            <Flame className="w-10 h-10 text-orange-300 opacity-60" />
          </div>
          <div className="absolute top-8 right-8 animate-spin-slow">
            <Percent className="w-8 h-8 text-red-300 opacity-60" />
          </div>
          <div className="absolute bottom-10 left-10 animate-pulse">
            <ShoppingBag className="w-8 h-8 text-pink-300 opacity-60" />
          </div>
        </div>
        <CardHeader className="pb-4 sm:pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <span className="text-[15px] font-medium text-gray-900">Hot Deals</span>
                </div>
              </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto">
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            No deals available right now.
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <>
      <Card
        className={`
          top-row-widget overflow-y-auto
          bg-gradient-to-tr from-orange-400 via-red-300 to-pink-400
          rounded-[28px] shadow-xl border-0 backdrop-blur-xl
          transition-all duration-300
          ${className || ""}
          relative cursor-pointer
        `}
        onClick={handleWidgetClick}
        data-hot-deals-widget="true"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-2xl rounded-[28px]"></div>
          <div className="absolute top-6 left-8 animate-bounce-slow">
            <Flame className="w-10 h-10 text-orange-300 opacity-60" />
          </div>
          <div className="absolute top-8 right-8 animate-spin-slow">
            <Percent className="w-8 h-8 text-red-300 opacity-60" />
          </div>
          <div className="absolute bottom-10 left-10 animate-pulse">
            <ShoppingBag className="w-8 h-8 text-pink-300 opacity-60" />
          </div>
          <div className="absolute bottom-8 right-8 animate-bounce delay-300">
            <Sparkles className="w-6 h-6 text-yellow-300 opacity-60" />
          </div>
        </div>

        <div className="relative z-50">
      <SponsorshipBanner widgetType="hot-deals" />
        </div>

        {sponsoredBanner.isSponsored && (
          <div className="w-full p-4 text-center text-white font-semibold shadow-lg absolute top-0 left-0 z-10 bg-gradient-to-r from-orange-700 via-red-700 to-pink-700 border-b-2 border-white/20 rounded-t-[18px]">
            <div className="flex items-center justify-center gap-3">
              {sponsoredBanner.sponsorLogo && (
                <img
                  src={sponsoredBanner.sponsorLogo}
                  alt={sponsoredBanner.sponsorName || "Sponsor"}
                  className="h-8 w-8 object-contain rounded-full bg-white/20 p-1 animate-badge-glow"
                />
              )}
              <span className="text-lg font-bold animate-gradient-x">
                {sponsoredBanner.sponsorMessage || `Brought to you by ${sponsoredBanner.sponsorName}`}
              </span>
              {sponsoredBanner.sponsorWebsite && (
                <a
                  href={sponsoredBanner.sponsorWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 underline px-3 py-1 rounded-full hover:bg-white/30 font-medium bg-white/20"
                >
                  Visit Site
                </a>
              )}
            </div>
          </div>
        )}

        <CardHeader className="pb-4 sm:pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-[15px] font-medium text-gray-900">Hot Deals</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 font-medium">
                {deals.length} deals
              </span>
            </div>
          </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 flex-1 overflow-y-auto">
        {/* Scrolling Deals List */}
        <div className="space-y-2">
          {deals.map((deal, index) => (
            <div
              key={deal.id}
              className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-2">
                <div className="relative flex-shrink-0">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                    onLoad={() => setLogoLoadingStates(prev => ({ ...prev, [deal.id]: false }))}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=48&width=48&text=Deal"
                    }}
                  />
                  {deal.urgent && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate text-xs">
                      {deal.title}
                    </h3>
                    {deal.featured && (
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-[10px] text-gray-600 truncate mb-1">
                    {deal.business} • {deal.location}
                  </p>
                  
                  <div className="flex items-center gap-1 mb-1">
                    <Badge className={`text-[10px] px-1.5 py-0.5 ${getCategoryColor(deal.category)} border-none rounded-md`}>
                      {deal.category}
                    </Badge>
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white border-none rounded-md">
                      {deal.discount} OFF
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-red-600">
                        ฿{deal.salePrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-500 line-through">
                        ฿{deal.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{deal.timeLeft}</span>
                    </div>
                  </div>
                  
                  {/* Compact Action Buttons */}
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-6 text-[10px] bg-white/80 hover:bg-white border-white/40 text-gray-700 hover:text-gray-900 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDeal(deal)
                      }}
                    >
                      <Eye className="w-2.5 h-2.5 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-6 text-[10px] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBuyNow(deal)
                      }}
                    >
                      <ShoppingBag className="w-2.5 h-2.5 mr-1" />
                      Buy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 w-6 p-0 bg-white/80 hover:bg-white border-white/40 text-gray-700 hover:text-gray-900 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShareDeal(deal)
                      }}
                    >
                      <Share2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

      {/* Expanded Modal */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 border-0 shadow-2xl [&>button]:hidden">
          <DialogHeader className="relative pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-orange-800">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <Flame className="h-6 w-6 text-white" />
              </div>
              Hot Deals
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)} 
              className="absolute top-0 right-0 h-10 w-10 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* All Deals Section */}
            <div>
              <h4 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                All Hot Deals
              </h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
                  >
                    <div className="flex items-start gap-4 p-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={deal.image}
                          alt={deal.title}
                          className="w-20 h-20 object-cover rounded-lg shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=80&width=80&text=Deal"
                          }}
                        />
                        {deal.urgent && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                        )}
                        {deal.featured && (
                          <div className="absolute -top-1 -left-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold text-gray-900 truncate">{deal.title}</h5>
                          {deal.featured && (
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 truncate">
                          {deal.business} • {deal.location}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`text-xs px-2 py-0.5 ${getCategoryColor(deal.category)} border-none rounded-lg`}>
                            {deal.category}
                          </Badge>
                          <Badge className="text-xs px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white border-none rounded-lg">
                            {deal.discount} OFF
                          </Badge>
                          {deal.urgent && (
                            <Badge className="text-xs px-2 py-0.5 bg-red-600 text-white border-none rounded-lg animate-pulse">
                              URGENT
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-600">
                              ฿{deal.salePrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ฿{deal.originalPrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{deal.timeLeft}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleViewDeal(deal)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Deal
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-200"
                            onClick={() => handleBuyNow(deal)}
                          >
                            <ShoppingBag className="w-3 h-3 mr-1" />
                            Buy Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleShareDeal(deal)}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        /* Animations */
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        @keyframes spin-slow {
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes badge-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.6);
          }
        }
        .animate-badge-glow {
          animation: badge-glow 2s ease-in-out infinite;
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background: linear-gradient(-45deg, #fff, #f0f0f0, #fff, #f0f0f0);
          background-size: 400% 400%;
          animation: gradient-x 3s ease infinite;
        }

        @keyframes shine-once {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shine-once {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shine-once 2s ease-in-out;
        }
      `}</style>
    </>
  )
}