"use client"

import { useState, useEffect } from "react"
import { buildApiUrl } from "@/lib/strapi-config"

interface SponsorshipTitle {
  id?: number
  title: string
  color: string
  isActive: boolean
  displayOrder: number
}

interface GlobalSponsorship {
  id: number
  sponsorshipTitles: SponsorshipTitle[]
  isActive: boolean
  sponsoredWidgets: string[]
  defaultColor: string
  animationSpeed: 'slow' | 'normal' | 'fast'
  sponsorWebsite?: string
  sponsorLogo?: string
  sponsorStartDate?: string
  sponsorEndDate?: string
}

interface SponsorshipBannerProps {
  widgetType: string
  className?: string
}

export function SponsorshipBanner({ widgetType, className = "" }: SponsorshipBannerProps) {
  const [sponsorship, setSponsorship] = useState<GlobalSponsorship | null>(null)
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    loadSponsorship()
  }, [widgetType])

  const loadSponsorship = async () => {
    try {
      setLoading(true)
      
      // Fetch all sponsorships and filter on frontend
      const response = await fetch(`${buildApiUrl('')}/global-sponsorships?sort=createdAt:desc&populate=*`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          // Find active sponsorship that includes this widget type
          const matchingSponsorship = data.data.find((sponsorship: any) => {
            const isActive = sponsorship.isActive
            const sponsoredWidgets = sponsorship.sponsoredWidgets || []
            return isActive && Array.isArray(sponsoredWidgets) && sponsoredWidgets.includes(widgetType)
          })
          
          if (matchingSponsorship) {
            setSponsorship({
              id: matchingSponsorship.id,
              sponsorshipTitles: matchingSponsorship.sponsorshipTitles || [],
              isActive: matchingSponsorship.isActive,
              sponsoredWidgets: matchingSponsorship.sponsoredWidgets || [],
              defaultColor: matchingSponsorship.defaultColor || "#1e40af",
              animationSpeed: matchingSponsorship.animationSpeed || "normal",
              sponsorWebsite: matchingSponsorship.sponsorWebsite,
              sponsorLogo: matchingSponsorship.sponsorLogo,
              sponsorStartDate: matchingSponsorship.sponsorStartDate,
              sponsorEndDate: matchingSponsorship.sponsorEndDate
            })
          } else {
            setSponsorship(null)
          }
        } else {
          setSponsorship(null)
        }
      } else {
        setSponsorship(null)
      }
    } catch (error) {
      setSponsorship(null)
    } finally {
      setLoading(false)
    }
  }

  // Check if sponsorship is within date range
  const isWithinDateRange = () => {
    if (!sponsorship) return false
    
    const now = new Date()
    const startDate = sponsorship.sponsorStartDate ? new Date(sponsorship.sponsorStartDate) : null
    const endDate = sponsorship.sponsorEndDate ? new Date(sponsorship.sponsorEndDate) : null
    
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    
    return true
  }

  // Don't render if loading, no sponsorship, or not within date range
  if (loading || !sponsorship || !sponsorship.isActive || !isWithinDateRange()) {
    return null
  }

  // Filter active titles and sort by display order
  const activeTitles = sponsorship.sponsorshipTitles
    .filter(title => title.isActive && title.title.trim())
    .sort((a, b) => a.displayOrder - b.displayOrder)

  if (activeTitles.length === 0) {
    return null
  }

  // Get animation duration based on speed
  const getAnimationDuration = () => {
    switch (sponsorship.animationSpeed) {
      case 'slow': return '20s'
      case 'fast': return '8s'
      default: return '12s'
    }
  }

  return (
    <div 
      className={`w-full p-2 text-center text-white font-semibold shadow-lg bg-gradient-to-r from-blue-700 to-purple-700 border-b-2 border-white/20 ${className}`}
      style={{
        backgroundColor: sponsorship.defaultColor || undefined
      }}
    >
      <div className="flex items-center justify-center gap-1.5 max-w-screen-md mx-auto px-2">
        {sponsorship.sponsorLogo && (
          <img 
            src={sponsorship.sponsorLogo} 
            alt="Sponsor Logo" 
            className="h-3.5 w-3.5 object-contain"
          />
        )}
        
        {activeTitles.length === 1 ? (
          // Single title - static display
          <span 
            className="text-xs font-bold text-white"
            style={{ color: 'white' }}
          >
            {activeTitles[0].title}
          </span>
        ) : (
          // Multiple titles - marquee animation
          <div className="overflow-hidden w-full relative">
            <div 
              className="flex whitespace-nowrap"
              style={{
                animationName: 'sponsor-marquee',
                animationDuration: getAnimationDuration(),
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                width: '200%'
              }}
            >
              {/* First set of titles */}
              {activeTitles.map((title, index) => (
                <span
                  key={index}
                  className="text-xs font-bold mr-6 flex-shrink-0 text-white"
                  style={{ color: 'white' }}
                >
                  {title.title}
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {activeTitles.map((title, index) => (
                <span
                  key={`duplicate-${index}`}
                  className="text-xs font-bold mr-6 flex-shrink-0 text-white"
                  style={{ color: 'white' }}
                >
                  {title.title}
                </span>
              ))}
            </div>
            <style jsx>{`
              @keyframes sponsor-marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}
