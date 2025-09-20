"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  MapPin,
  Star,
  Users,
  Zap,
  ExternalLink,
  Heart,
  Share2,
  Calendar,
  DollarSign,
  Percent,
  Timer,
  TrendingUp,
  CheckCircle,
  Flame,
} from "lucide-react"
import Image from "next/image"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"
import { DealCard } from "@/components/deals/deal-card"
import { useToast } from "@/hooks/use-toast"
import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"

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

export function EnhancedHotDealsWidget() {
  const [deals, setDeals] = useState<StrapiDeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching deals from Strapi...')
      
      // Call Strapi API to get deals with populated relations
      const response = await fetch(buildApiUrl("deals?populate=*"))
      
      if (response.ok) {
        const data = await response.json()
        console.log('Strapi deals response:', data)
        
        if (data.data && data.data.length > 0) {
          // Filter active deals and sort by featured first
          const activeDeals = data.data
            .filter((strapiDeal: StrapiDeal) => strapiDeal.isActive)
            .sort((a: StrapiDeal, b: StrapiDeal) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
          
          setDeals(activeDeals)
        } else {
          console.log('No active deals found')
          setDeals([])
        }
      } else {
        console.error("Failed to fetch deals from Strapi:", response.status)
        setDeals([])
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error)
      setDeals([])
    } finally {
      setIsLoading(false)
    }
  }

    const filteredDeals = deals

  if (isLoading) {
    return (
      <Card className="min-h-[24rem] max-h-[24rem] bg-white/80 backdrop-blur-sm border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col overflow-hidden">
        <CardHeader className="pb-3 px-5 pt-5">
          <CardTitle className="text-[15px] font-semibold text-gray-900 tracking-tight">Hot Deals</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-100 rounded-2xl mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-h-[18rem] max-h-[18rem] bg-white/80 backdrop-blur-sm border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] transition-all duration-300 ease-out flex flex-col">
      {/* Global Sponsorship Banner */}
      <SponsorshipBanner widgetType="hot-deals" />
      <CardHeader className="pb-2 px-4 pt-4 flex-shrink-0">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between tracking-tight">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>Hot Deals</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-red-500/90 backdrop-blur-sm">
            <span className="text-xs font-semibold text-white tracking-wide">
              {deals.filter(d => d.featured).length} Featured
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto">


        {/* Deals List */}
        <div className="space-y-2 pt-1">
          {filteredDeals.slice(0, 3).map((deal) => (
            <div key={deal.id} className="transform scale-95 hover:scale-100 transition-transform duration-200">
              <DealCard
                deal={{
                  id: deal.id.toString(),
                  deal_title: deal.deal_title || 'Untitled Deal',
                  description: deal.description || 'No description available',
                  original_price: deal.original_price || 0,
                  sale_price: deal.sale_price || 0,
                  deal_category: deal.deal_category?.data?.attributes?.name || 'Activity',
                  slug: deal.slug || '',
                  isActive: deal.isActive || false,
                  featured: deal.featured || false,
                  views: deal.views || 0,
                  clicks: deal.clicks || 0,
                  conversions: deal.conversions || 0,
                  business: deal.business?.data?.attributes ? {
                    name: deal.business.data.attributes.name || 'Business Name',
                    address: deal.business.data.attributes.address || 'Pattaya, Thailand'
                  } : undefined,
                  image_gallery: deal.image_gallery?.map(img => ({
                    url: buildStrapiUrl(img.url)
                  })) || []
                }}
                variant="default"
                showActions={true}
                showCountdown={false}
              />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs font-medium h-7 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200 mt-2"
          onClick={() => window.open('/deals', '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-2" />
          View All Deals
        </Button>
      </CardContent>
    </Card>
  )
}

export default EnhancedHotDealsWidget
