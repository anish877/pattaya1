"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Heart, Radio, MoreVertical, Users, Music, Star, RefreshCw, ExternalLink, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"

interface RadioStation {
  id: string
  name: string
  frequency: string
  genre: string
  streamUrl: string
  logo: string
  isLive: boolean
  listeners: number
  nowPlaying: string
  featured: boolean
  description: string
  displayOrder: number
  website?: string
  social?: {
    facebook?: string
    twitter?: string
    instagram?: string
  }
  isSponsored?: boolean
  sponsoredLabel?: string
  sponsoredUntil?: string
  audioPreRollAd?: string
  preRollAdText?: string
  preRollAdDuration?: number
  preRollAdActive?: boolean
}

interface StrapiRadioStation {
  id: number
  Name: string
  Frequency: string
  Genre: string
  Description: string
  StreamURL: string
  Logo?: {
    id: number
    name: string
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  CoverImage?: {
    id: number
    name: string
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  IsLive: boolean
  Featured: boolean
  Verified: boolean
  Listeners: number
  CurrentTrack: string
  DisplayOrder: number
  Website: string
  Facebook: string
  Instagram: string
  Twitter: string
  IsSponsored?: boolean
  SponsoredLabel?: string
  SponsoredUntil?: string
  AudioPreRollAd?: {
    id: number
    name: string
    url: string
    formats?: {
      mp3?: { url: string }
    }
  }
  PreRollAdText?: string
  PreRollAdDuration?: number
  PreRollAdActive?: boolean
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

interface GlobalSponsorship {
  id: number
  title: string
  isActive: boolean
  sponsoredWidgets: string[]
  sponsorColor: string
}

export function RadioWidget({ className, isExpanded = false, onToggleExpand }: { className?: string; isExpanded?: boolean; onToggleExpand?: () => void }) {
  const [stations, setStations] = useState<RadioStation[]>([])
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([70])
  const [isMuted, setIsMuted] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [sponsoredBanner, setSponsoredBanner] = useState<SponsoredWidgetBanner>({
    isSponsored: false,
    bannerPosition: "top"
  })
  const [globalSponsorship, setGlobalSponsorship] = useState<GlobalSponsorship | null>(null)
  const [globalSponsorshipLoading, setGlobalSponsorshipLoading] = useState(true)
  const [isPlayingPreRollAd, setIsPlayingPreRollAd] = useState(false)
  const [preRollAdProgress, setPreRollAdProgress] = useState(0)
  const [logoLoadingStates, setLogoLoadingStates] = useState<Record<string, boolean>>({})
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [shouldAutoplay, setShouldAutoplay] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const preRollAdRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    loadStations()
    loadFavorites()
    loadSponsoredBanner()
    loadGlobalSponsorship()
    // Refresh every 5 minutes
    const interval = setInterval(loadStations, 300000)
    
    // Cleanup function
    return () => {
      clearInterval(interval)
      // Stop any playing audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Debug effect for global sponsorship
  useEffect(() => {
    console.log('🎨 Global sponsorship state changed:', {
      globalSponsorship: !!globalSponsorship,
      isActive: globalSponsorship?.isActive,
      title: globalSponsorship?.title,
      fullData: globalSponsorship
    })
  }, [globalSponsorship])

  // Update audio volume when volume or mute state changes
  useEffect(() => {
    updateAudioVolume()
  }, [volume, isMuted])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when widget is focused or expanded
      if (event.target instanceof HTMLElement && 
          (event.target.closest('[data-radio-widget]') || isExpanded)) {
        
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault()
            if (canPlayPrevious()) {
              playPreviousStation()
            }
            break
          case 'ArrowRight':
            event.preventDefault()
            if (canPlayNext()) {
              playNextStation()
            }
            break
          case ' ':
            event.preventDefault()
            if (currentStation) {
              playStation(currentStation)
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentStation, stations.length, isExpanded])

  const loadStations = async () => {
    try {
      setError(null)
      console.log('Fetching radio stations from Strapi...')
      
      // Call Strapi API to get radio stations with populated media including Logo
      // Try different populate strategies to ensure Logo field is included
      const response = await fetch(buildApiUrl("radio-stations?populate[0]=Logo&populate[1]=AudioPreRollAd&populate[2]=CoverImage&sort=DisplayOrder:asc"))
      
      if (response.ok) {
        const data = await response.json()
        console.log('Strapi radio stations response:', data)
        
        if (data.data && data.data.length > 0) {
          // Debug: Log the first station to see all available fields
          console.log('First station raw data:', data.data[0])
          console.log('Available fields in first station:', Object.keys(data.data[0]))
          
          // Check if data is nested under attributes (common in Strapi v4)
          if (data.data[0].attributes) {
            console.log('First station attributes:', data.data[0].attributes)
            console.log('Available fields in attributes:', Object.keys(data.data[0].attributes))
          }
          
          // Transform Strapi data to match component interface
          const stationList: RadioStation[] = data.data.map((strapiStation: any) => {
            // Handle Strapi v4 nested structure if present
            const stationData = strapiStation.attributes || strapiStation
            
            // Debug: Log the logo data from Strapi
            console.log(`Station ${stationData.Name || stationData.name} logo data:`, stationData.Logo || stationData.logo)
            console.log(`Station ${stationData.Name || stationData.name} all fields:`, Object.keys(stationData))
            
            // Get logo URL using the helper function for best quality
            // Try different possible field names for logo, with fallback to CoverImage
            const logoData = stationData.Logo || stationData.logo || stationData.LogoImage || stationData.logoImage || stationData.CoverImage
            const logoUrl = getBestLogoUrl(logoData, stationData.Name || stationData.name)
            console.log(`Station ${stationData.Name || stationData.name} logo data:`, logoData)
            console.log(`Station ${stationData.Name || stationData.name} logo URL:`, logoUrl)

            // Get pre-roll ad URL if available
            let preRollAdUrl = ""
            if (stationData.AudioPreRollAd) {
              preRollAdUrl = buildStrapiUrl(stationData.AudioPreRollAd.url)
            }

            return {
              id: strapiStation.id.toString(),
              name: stationData.Name || stationData.name || "Unknown Station",
              frequency: stationData.Frequency || stationData.frequency || "0.0",
              genre: stationData.Genre || stationData.genre || "Unknown",
              streamUrl: stationData.StreamURL || stationData.streamUrl || "",
              logo: logoUrl,
              isLive: stationData.IsLive || stationData.isLive || false,
              listeners: stationData.Listeners || stationData.listeners || 0,
              nowPlaying: stationData.CurrentTrack || stationData.currentTrack || "Live Stream",
              featured: stationData.Featured || stationData.featured || false,
              description: stationData.Description || stationData.description || "",
              website: stationData.Website || stationData.website || "",
              social: {
                facebook: stationData.Facebook || stationData.facebook || "",
                twitter: stationData.Twitter || stationData.twitter || "",
                instagram: stationData.Instagram || stationData.instagram || "",
              },
              displayOrder: stationData.DisplayOrder || stationData.displayOrder || 999,
              isSponsored: stationData.IsSponsored || stationData.isSponsored || false,
              sponsoredLabel: stationData.SponsoredLabel || stationData.sponsoredLabel || "",
              sponsoredUntil: stationData.SponsoredUntil || stationData.sponsoredUntil || "",
              audioPreRollAd: preRollAdUrl,
              preRollAdText: stationData.PreRollAdText || stationData.preRollAdText || "",
              preRollAdDuration: stationData.PreRollAdDuration || stationData.preRollAdDuration || 5,
              preRollAdActive: stationData.PreRollAdActive || stationData.preRollAdActive || false,
            }
          }).sort((a: RadioStation, b: RadioStation) => {
            // Sort sponsored stations first, then by display order
            if (a.isSponsored && !b.isSponsored) return -1
            if (!a.isSponsored && b.isSponsored) return 1
            return a.displayOrder - b.displayOrder
          })
          
          console.log('Transformed radio stations from Strapi (sorted by display order):', stationList)
          setStations(stationList)
          setError(null) // Clear any previous errors

          // Set first sponsored station as default and auto-play, or first featured station, or first station by display order
          const firstSponsoredStation = stationList.find((s: RadioStation) => s.isSponsored)
          const firstFeaturedStation = stationList.find((s: RadioStation) => s.featured)
          const defaultStation = firstSponsoredStation || firstFeaturedStation || stationList[0]
          
          if (defaultStation) {
            setCurrentStation(defaultStation)
            console.log('Set default station from Strapi:', defaultStation.name, 'with stream URL:', defaultStation.streamUrl)
            
            // Log sponsored station details
            if (firstSponsoredStation) {
              console.log('Found sponsored station:', firstSponsoredStation.name)
              console.log('Sponsored station details:', {
                name: firstSponsoredStation.name,
                frequency: firstSponsoredStation.frequency,
                isSponsored: firstSponsoredStation.isSponsored,
                sponsoredLabel: firstSponsoredStation.sponsoredLabel
              })
            }
          }
        } else {
          throw new Error("No radio stations available")
        }
      } else {
        console.error("Failed to fetch radio stations from Strapi:", response.status)
        throw new Error("Failed to fetch radio stations")
      }
    } catch (error) {
      console.error("Failed to load radio stations:", error)
      setError("Unable to load radio stations")
      
      // Fallback to hardcoded stations (already sorted by display order)
      console.log('Using fallback stations due to Strapi fetch error')
      const fallbackStations = getAllStations()
      setStations(fallbackStations)
      
      // Check for sponsored stations in fallback data
      const firstSponsoredFallback = fallbackStations.find((s: RadioStation) => s.isSponsored)
      const firstFeaturedFallback = fallbackStations.find((s: RadioStation) => s.featured)
      const defaultFallbackStation = firstSponsoredFallback || firstFeaturedFallback || fallbackStations[0]
      
      setCurrentStation(defaultFallbackStation)
      console.log('Set fallback station:', defaultFallbackStation.name, 'with stream URL:', defaultFallbackStation.streamUrl)
      
      // Log sponsored fallback station details
      if (firstSponsoredFallback) {
        console.log('Found sponsored fallback station:', firstSponsoredFallback.name)
        console.log('Sponsored fallback station details:', {
          name: firstSponsoredFallback.name,
          frequency: firstSponsoredFallback.frequency,
          isSponsored: firstSponsoredFallback.isSponsored,
          sponsoredLabel: firstSponsoredFallback.sponsoredLabel
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getAllStations = (): RadioStation[] => [
    {
      id: "1",
      name: "Fabulas 103 FM",
      frequency: "103.0",
      genre: "Pop/Rock",
      streamUrl: "https://stream.radiojar.com/4ywdgup3bnzuv",
      logo: "/placeholder.svg?height=40&width=40&text=F103",
      isLive: true,
      listeners: 1250,
      nowPlaying: "Live Stream",
      featured: true,
      description: "Pattaya's premier radio station playing the best pop and rock hits",
      website: "https://fabulous103.com",
      social: {
        facebook: "fabulous103",
        instagram: "fabulous103_official",
      },
      displayOrder: 1,
    },
    {
      id: "2",
      name: "Beach Radio",
      frequency: "95.7",
      genre: "Chill/Lounge",
      streamUrl: "http://163.172.158.94:8048/;stream.mp3",
      logo: "/placeholder.svg?height=40&width=40&text=BR",
      isLive: true,
      listeners: 890,
      nowPlaying: "Live Stream",
      featured: false,
      description: "Relaxing beach vibes and chill music for your perfect day",
      website: "https://beachradio.co.th",
      displayOrder: 2,
    },
    {
      id: "3",
      name: "Thai Hits",
      frequency: "101.2",
      genre: "Thai Pop",
      streamUrl: "https://stream.example.com/thai-hits",
      logo: "/placeholder.svg?height=40&width=40&text=TH",
      isLive: true,
      listeners: 2100,
      nowPlaying: "ลูกทุ่งใหม่",
      featured: true,
      description: "The best of Thai pop and traditional music",
      social: {
        facebook: "thaihitsradio",
      },
      displayOrder: 3,
    },
    {
      id: "4",
      name: "Radio Mirchi",
      frequency: "98.3",
      genre: "International",
      streamUrl: "https://stream.radiojar.com/4ywdgup3bnzuv",
      logo: "/placeholder.svg?height=40&width=40&text=RM",
      isLive: true,
      listeners: 650,
      nowPlaying: "Live Stream",
      featured: false,
      description: "News, music and entertainment for the international community",
      displayOrder: 4,
    },
    {
      id: "5",
      name: "Dance FM",
      frequency: "107.1",
      genre: "Electronic/Dance",
      streamUrl: "https://stream.example.com/dance-fm",
      logo: "/placeholder.svg?height=40&width=40&text=DFM",
      isLive: true,
      listeners: 1800,
      nowPlaying: "Club Anthems 2024",
      featured: false,
      description: "Non-stop electronic dance music and club hits",
      displayOrder: 5,
    },
    {
      id: "6",
      name: "Classic Rock",
      frequency: "92.3",
      genre: "Classic Rock",
      streamUrl: "https://stream.example.com/classic-rock",
      logo: "/placeholder.svg?height=40&width=40&text=CR",
      isLive: true,
      listeners: 1100,
      nowPlaying: "Led Zeppelin - Stairway to Heaven",
      featured: false,
      description: "The greatest rock classics from the 60s, 70s, and 80s",
      displayOrder: 6,
    },
    {
      id: "7",
      name: "Jazz Lounge",
      frequency: "99.5",
      genre: "Jazz",
      streamUrl: "https://stream.example.com/jazz-lounge",
      logo: "/placeholder.svg?height=40&width=40&text=JL",
      isLive: true,
      listeners: 420,
      nowPlaying: "Miles Davis - Kind of Blue",
      featured: false,
      description: "Smooth jazz and contemporary instrumental music",
      displayOrder: 7,
    },
    {
      id: "8",
      name: "News Talk",
      frequency: "106.7",
      genre: "News/Talk",
      streamUrl: "https://stream.example.com/news-talk",
      logo: "/placeholder.svg?height=40&width=40&text=NT",
      isLive: true,
      listeners: 980,
      nowPlaying: "Morning News Briefing",
      featured: false,
      description: "Local and international news, talk shows, and current affairs",
      displayOrder: 8,
    },
    {
      id: "9",
      name: "Reggae Vibes",
      frequency: "94.1",
      genre: "Reggae",
      streamUrl: "https://stream.example.com/reggae-vibes",
      logo: "/placeholder.svg?height=40&width=40&text=RV",
      isLive: true,
      listeners: 750,
      nowPlaying: "Bob Marley - Three Little Birds",
      featured: false,
      description: "Classic and modern reggae music from around the world",
      displayOrder: 9,
    },
    {
      id: "10",
      name: "Country Roads",
      frequency: "91.7",
      genre: "Country",
      streamUrl: "https://stream.example.com/country-roads",
      logo: "/placeholder.svg?height=40&width=40&text=CR",
      isLive: true,
      listeners: 580,
      nowPlaying: "Johnny Cash - Ring of Fire",
      featured: false,
      description: "Classic and contemporary country music hits",
      displayOrder: 10,
    },
  ].sort((a, b) => a.displayOrder - b.displayOrder)

  const loadFavorites = () => {
    const saved = localStorage.getItem("pattaya1-radio-favorites")
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }

  const loadGlobalSponsorship = async () => {
    try {
      setGlobalSponsorshipLoading(true)
      console.log('🔄 Loading global sponsorship...')
      // Load all global sponsorships from Strapi and filter for radio widget
      const response = await fetch('/api/global-sponsorships')
      if (response.ok) {
        const data = await response.json()
        console.log('📡 Global sponsorship API response:', data)
        
        if (data.data && data.data.length > 0) {
          console.log('📊 Found', data.data.length, 'sponsorship records')
          
          // Find active sponsorship for radio widget
          const radioSponsorship = data.data.find((sponsorship: any) => {
            console.log('🔍 Checking sponsorship:', {
              id: sponsorship.id,
              title: sponsorship.title,
              isActive: sponsorship.isActive,
              sponsoredWidgets: sponsorship.sponsoredWidgets,
              type: typeof sponsorship.sponsoredWidgets
            })
            
            const isActive = sponsorship.isActive
            const hasWidgets = sponsorship.sponsoredWidgets
            const isRadioWidget = Array.isArray(sponsorship.sponsoredWidgets) 
              ? sponsorship.sponsoredWidgets.includes('radio')
              : sponsorship.sponsoredWidgets === 'radio'
            
            console.log('🔍 Sponsorship check result:', { isActive, hasWidgets, isRadioWidget })
            
            return isActive && hasWidgets && isRadioWidget
          })
          
          if (radioSponsorship) {
            setGlobalSponsorship(radioSponsorship)
            console.log('✅ Loaded global sponsorship for radio widget:', radioSponsorship)
          } else {
            console.log('❌ No active global sponsorship found for radio widget')
            setGlobalSponsorship(null)
          }
        } else {
          console.log('❌ No global sponsorships found')
          setGlobalSponsorship(null)
        }
      } else {
        console.log('❌ Failed to fetch global sponsorships:', response.status)
        setGlobalSponsorship(null)
      }
    } catch (error) {
      console.error('❌ Error loading global sponsorship:', error)
      setGlobalSponsorship(null)
    } finally {
      setGlobalSponsorshipLoading(false)
    }
  }

  const loadSponsoredBanner = async () => {
    try {
      // Load global homepage sponsorship configuration from Strapi
      const response = await fetch(buildApiUrl('/homepage-configs/active'))
      if (response.ok) {
        const data = await response.json()
        if (data.data?.globalSponsorship) {
          setSponsoredBanner(data.data.globalSponsorship)
          console.log('Loaded global sponsorship from API:', data.data.globalSponsorship)
        } else {
          console.log('No global sponsorship found, trying widget-specific config...')
          // Try widget-specific configuration as fallback
          const widgetResponse = await fetch('/api/homepage-configs/widget/radio')
          if (widgetResponse.ok) {
            const widgetData = await widgetResponse.json()
            if (widgetData.data?.sponsoredWidgetBanner) {
              setSponsoredBanner(widgetData.data.sponsoredWidgetBanner)
              console.log('Loaded widget sponsorship from API:', widgetData.data.sponsoredWidgetBanner)
            } else {
              setDefaultSponsoredBanner()
            }
          } else {
            setDefaultSponsoredBanner()
          }
        }
      } else {
        console.log('No active homepage config found, using default')
        setDefaultSponsoredBanner()
      }
    } catch (error) {
      console.error('Error loading sponsorship:', error)
      setDefaultSponsoredBanner()
    }
  }

  const setDefaultSponsoredBanner = () => {
    setSponsoredBanner({
      isSponsored: false,
      sponsorName: "Singha Beer",
      sponsorLogo: "/placeholder.svg?height=24&width=24&text=SB",
      sponsorMessage: "Pattaya's Radio, brought to you by Singha Beer",
      sponsorWebsite: "https://singha.com",
      sponsorColor: "#1e40af",
      bannerPosition: "top"
    })
  }

  const getBestLogoUrl = (logo: any, stationName: string) => {
    // If no logo, return placeholder
    if (!logo) {
      console.log(`No logo found for station ${stationName}, using placeholder`)
      return `/placeholder.svg?height=64&width=64&text=${stationName.charAt(0)}`
    }
    
    console.log(`Processing logo for station ${stationName}:`, logo)
    
    // If logo has formats, try to get the best quality
    if (logo.formats) {
      if (logo.formats.large?.url) {
        const url = buildStrapiUrl(logo.formats.large.url)
        console.log(`Using large format logo: ${url}`)
        return url
      } else if (logo.formats.medium?.url) {
        const url = buildStrapiUrl(logo.formats.medium.url)
        console.log(`Using medium format logo: ${url}`)
        return url
      } else if (logo.formats.small?.url) {
        const url = buildStrapiUrl(logo.formats.small.url)
        console.log(`Using small format logo: ${url}`)
        return url
      } else if (logo.formats.thumbnail?.url) {
        const url = buildStrapiUrl(logo.formats.thumbnail.url)
        console.log(`Using thumbnail format logo: ${url}`)
        return url
      }
    }
    
    // Fallback to original URL if no formats or if formats don't have URLs
    if (logo.url) {
      const url = buildStrapiUrl(logo.url)
      console.log(`Using original logo URL: ${url}`)
      return url
    }
    
    // If nothing works, return placeholder
    console.log(`Could not extract logo URL for station ${stationName}, using placeholder`)
    return `/placeholder.svg?height=64&width=64&text=${stationName.charAt(0)}`
  }

  const handleLogoLoad = (stationId: string) => {
    console.log(`Logo loaded successfully for station ${stationId}`)
    setLogoLoadingStates(prev => ({ ...prev, [stationId]: false }))
  }

  const handleLogoError = (stationId: string, stationName: string) => {
    console.log(`Logo failed to load for station ${stationId} (${stationName}), using placeholder`)
    setLogoLoadingStates(prev => ({ ...prev, [stationId]: false }))
    // Logo error is handled by onError in img tag
  }

  const setLogoLoading = (stationId: string) => {
    setLogoLoadingStates(prev => ({ ...prev, [stationId]: true }))
  }

  const hasSponsoredStations = () => {
    return stations.some(station => station.isSponsored)
  }

  const getSponsoredStationsCount = () => {
    return stations.filter(station => station.isSponsored).length
  }

  const testAudioPlayback = () => {
    console.log('=== Testing Audio Playback ===')
    
    // Test with a simple, reliable stream URL
    const testUrl = 'https://ice1.somafm.com/groovesalad-128-mp3'
    console.log('Testing with URL:', testUrl)
    
    try {
      const testAudio = new Audio(testUrl)
      
      testAudio.addEventListener('loadstart', () => {
        console.log('✅ Test audio loading started')
      })
      
      testAudio.addEventListener('canplay', () => {
        console.log('✅ Test audio can play')
      })
      
      testAudio.addEventListener('play', () => {
        console.log('✅ Test audio started playing')
      })
      
      testAudio.addEventListener('error', (e) => {
        console.error('❌ Test audio error:', e)
        const audioElement = e.target as HTMLAudioElement
        if (audioElement.error) {
          console.error('Error code:', audioElement.error.code)
          console.error('Error message:', audioElement.error.message)
        }
      })
      
      // Try to play
      console.log('Attempting to play test audio...')
      testAudio.play().then(() => {
        console.log('✅ Test audio play promise resolved')
        // Stop after 3 seconds
        setTimeout(() => {
          testAudio.pause()
          console.log('✅ Test audio stopped')
        }, 3000)
      }).catch((error) => {
        console.error('❌ Test audio play promise rejected:', error)
      })
      
    } catch (error) {
      console.error('❌ Error creating test audio:', error)
    }
  }

  const handleUserInteraction = () => {
    if (!hasUserInteracted) {
      console.log('🎵 User first interaction detected - enabling autoplay!')
      setHasUserInteracted(true)
      setShouldAutoplay(true)
      
      // Trigger autoplay after a short delay
      setTimeout(() => {
        if (currentStation && !isPlaying) {
          console.log('🚀 Autoplaying current station:', currentStation.name)
          playStation(currentStation)
        } else if (stations.length > 0 && !isPlaying) {
          console.log('🚀 Autoplaying first available station:', stations[0].name)
          playStation(stations[0])
        }
      }, 500)
    }
  }

  const handleWidgetClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons or interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="button"]')) {
      return
    }
    
    // Expand the widget
    if (onToggleExpand) {
      onToggleExpand()
    }
  }

  const refreshStations = () => {
    loadStations()
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleFavorite = (stationId: string) => {
    const updated = favorites.includes(stationId)
      ? favorites.filter((id) => id !== stationId)
      : [...favorites, stationId]
    setFavorites(updated)
    localStorage.setItem("pattaya1-radio-favorites", JSON.stringify(updated))
  }

  const playStation = async (station: RadioStation) => {
    console.log('=== playStation called ===')
    console.log('Station:', station.name)
    console.log('Stream URL:', station.streamUrl)
    console.log('Current station ID:', currentStation?.id)
    console.log('Station ID:', station.id)
    console.log('Is currently playing:', isPlaying)
    console.log('Audio ref exists:', !!audioRef.current)
    
    // If clicking the same station, toggle play/pause
    if (currentStation?.id === station.id) {
      console.log('Same station clicked, toggling play/pause')
      if (isPlaying) {
        // Pause current station
        console.log('Pausing current station')
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          console.log('No audio ref to pause')
        }
      } else {
        // Resume current station
        console.log('Resuming current station')
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.error('Play failed:', err)
            setError(`Playback failed: ${err.message}`)
          })
          setIsPlaying(true)
        } else {
          console.log('No audio ref to resume')
        }
      }
      return
    }
    
    console.log('Different station, checking for pre-roll ad')
    // Check if station has pre-roll ad
    if (station.preRollAdActive && station.audioPreRollAd) {
      console.log('Pre-roll ad detected, playing ad first')
      await playPreRollAd(station)
    } else {
      console.log('No pre-roll ad, playing station directly')
      // No pre-roll ad, play station directly
      playStationDirectly(station)
    }
  }

  const playPreRollAd = async (station: RadioStation) => {
    if (!station.audioPreRollAd || !preRollAdRef.current) return

    setIsPlayingPreRollAd(true)
    setPreRollAdProgress(0)

    try {
      preRollAdRef.current.src = station.audioPreRollAd
      preRollAdRef.current.load()
      
      // Play pre-roll ad
      await preRollAdRef.current.play()
      
      // Update progress bar
      const duration = station.preRollAdDuration || 5
      const interval = setInterval(() => {
        if (preRollAdRef.current) {
          const progress = (preRollAdRef.current.currentTime / duration) * 100
          setPreRollAdProgress(progress)
        }
      }, 100)

      // Wait for pre-roll ad to finish
      setTimeout(() => {
        clearInterval(interval)
        setIsPlayingPreRollAd(false)
        setPreRollAdProgress(0)
        
        // Now play the actual station
        playStationDirectly(station)
      }, duration * 1000)

    } catch (error) {
      console.error('Failed to play pre-roll ad:', error)
      // If pre-roll fails, play station directly
      playStationDirectly(station)
    }
  }

  const playStationDirectly = (station: RadioStation) => {
    console.log('=== playStationDirectly called ===')
    console.log('Station:', station.name)
    console.log('Stream URL:', station.streamUrl)
    
    // Stop any currently playing audio
    if (audioRef.current) {
      console.log('Stopping current audio')
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // Create new Audio object for the new station
    try {
      console.log('Creating new Audio object')
      const audio = new Audio(station.streamUrl)
      audioRef.current = audio
      
      console.log('Setting audio properties')
      // Set initial volume and mute state
      audio.volume = volume[0] / 100
      audio.muted = isMuted
      
      // Ensure volume is applied correctly
      if (isMuted) {
        audio.muted = true
      } else {
        audio.volume = volume[0] / 100
        audio.muted = false
      }
      
      // Add event listeners
      audio.addEventListener('play', () => {
        console.log('Audio started playing:', station.name)
        setIsPlaying(true)
        setError(null)
      })
      
      audio.addEventListener('pause', () => {
        console.log('Audio paused:', station.name)
        setIsPlaying(false)
      })
      
      audio.addEventListener('ended', () => {
        console.log('Audio ended:', station.name)
        setIsPlaying(false)
      })
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error for station:', station.name, e)
        const audioElement = e.target as HTMLAudioElement
        
        let errorMessage = `Unable to play ${station.name}. `
        
        if (audioElement.error) {
          switch (audioElement.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage += "Playback was aborted."
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage += "Network error occurred (stream may be offline)."
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage += "Audio format not supported."
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage += "Stream URL not supported or stream is offline."
              break
            default:
              errorMessage += `Error code: ${audioElement.error.code}`
          }
        } else {
          // Check if it's a network error (like 404)
          if (audioElement.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
            errorMessage += "Stream URL not accessible (404 or offline)."
          } else {
            errorMessage += "Unknown error occurred."
          }
        }
        
        setError(errorMessage)
        setIsPlaying(false)
      })
      
      audio.addEventListener('canplay', () => {
        console.log('Audio can play:', station.name)
        setError(null)
      })
      
      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started:', station.name)
      })
      
      // Update current station and start playing
      setCurrentStation(station)
      setIsPlaying(true)
      
      // Start playback
      audio.play().catch((err) => {
        console.error('Failed to start playback:', err)
        setError(`Failed to start playback: ${err.message}`)
        setIsPlaying(false)
      })
      
    } catch (error) {
      console.error('Error creating audio object:', error)
      setError(`Error creating audio: ${String(error)}`)
      setIsPlaying(false)
    }
  }

  const validateStreamUrl = (url: string): boolean => {
    // Check if URL is not a placeholder
    if (url.includes('example.com') || url.includes('placeholder')) {
      return false
    }
    
    // Check if URL has a valid protocol and is a real streaming URL
    try {
      const urlObj = new URL(url)
      const isValidProtocol = urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
      
      // Check for actual streaming URLs (not webpage URLs)
      const isStreamingUrl = (
        url.includes('.mp3') || 
        url.includes('.aac') || 
        url.includes('.ogg') || 
        url.includes('.m3u8') ||
        url.includes('/stream') ||
        url.includes('/live') ||
        url.includes('ice.infomaniak.ch') ||
        url.includes('stream.') ||
        url.includes('radio.') ||
        url.includes(':8000') ||
        url.includes(':8048') ||
        url.includes(':9050')
      )
      
      // Exclude webpage URLs
      const isNotWebpage = !(
        url.includes('/stations/') ||
        url.includes('/radio/') ||
        url.includes('.html') ||
        url.includes('.php') ||
        url.includes('onlineradiofm.in')
      )
      
      return isValidProtocol && isStreamingUrl && isNotWebpage
    } catch {
      return false
    }
  }

  const getStationStatus = (station: RadioStation) => {
    if (!validateStreamUrl(station.streamUrl)) {
      return { status: 'offline', message: 'Stream URL not configured' }
    }
    return { status: 'online', message: 'Live' }
  }

  const testStreamUrl = async (url: string) => {
    try {
      console.log('Testing stream URL:', url)
      
      // Try HEAD request first
      try {
        const response = await fetch(url, { method: 'HEAD' })
        console.log('Stream test HEAD response:', response.status, response.statusText)
        
        if (response.ok) {
          console.log('Stream URL is accessible via HEAD request')
          return { success: true, method: 'HEAD', status: response.status }
        }
      } catch (headError) {
        console.log('HEAD request failed, trying GET:', headError)
      }
      
      // If HEAD fails, try GET request
      try {
        const response = await fetch(url, { method: 'GET' })
        console.log('Stream test GET response:', response.status, response.statusText)
        
        if (response.ok) {
          console.log('Stream URL is accessible via GET request')
          return { success: true, method: 'GET', status: response.status }
        } else {
          console.log('Stream URL returned status:', response.status)
          return { success: false, method: 'GET', status: response.status, error: 'HTTP Error' }
        }
              } catch (getError) {
          console.error('GET request also failed:', getError)
          return { success: false, method: 'GET', error: String(getError) }
        }
      } catch (error) {
        console.error('Stream test failed:', error)
        return { success: false, error: String(error) }
      }
  }

  const getDataSourceInfo = () => {
    if (stations.length === 0) return 'Loading...'
    if (stations[0].streamUrl.includes('example.com')) return 'Fallback Data'
    return 'Strapi Backend'
  }

  const checkAudioSupport = () => {
    const audio = document.createElement('audio')
    const canPlayMP3 = audio.canPlayType('audio/mpeg')
    const canPlayAAC = audio.canPlayType('audio/aac')
    const canPlayOGG = audio.canPlayType('audio/ogg')
    
    console.log('Browser audio support:', {
      mp3: canPlayMP3,
      aac: canPlayAAC,
      ogg: canPlayOGG
    })
    
    return { canPlayMP3, canPlayAAC, canPlayOGG }
  }

  const getWorkingStreamExamples = () => {
    console.log('🎵 Working Streaming URL Examples:')
    console.log('MP3 Streams:')
    console.log('- https://stream.radiojar.com/4ywdgup3bnzuv (Radio Mirchi)')
    console.log('- http://163.172.158.94:8048/;stream.mp3 (Beach Radio)')
    console.log('')
    console.log('🎵 Additional Reliable Streams:')
    console.log('- https://ice1.somafm.com/groovesalad-128-mp3 (SomaFM Groove Salad)')
    console.log('- https://ice1.somafm.com/dronezone-128-mp3 (SomaFM Drone Zone)')
    console.log('- https://stream.radiojar.com/7csmg9f5c8quv (Another RadioJar stream)')
    console.log('')
    console.log('❌ Broken/Offline URLs:')
    console.log('- http://fabulous103.ice.infomaniak.ch/fabulous103-128.mp3 (404 - offline)')
    console.log('- https://radio.siaminterhost.com:9050/stream (may be offline)')
    console.log('')
    console.log('❌ Non-working URLs (webpages, not streams):')
    console.log('- https://onlineradiofm.in/stations/mirchi (webpage)')
    console.log('- https://example.com/radio (webpage)')
    console.log('- https://radio.com/stations (webpage)')
    console.log('')
    console.log('💡 Tips:')
    console.log('- Use URLs ending in .mp3, .aac, .ogg')
    console.log('- Use URLs with /stream, /live endpoints')
    console.log('- Avoid URLs with /stations/, /radio/ paths')
    console.log('- Test URLs in browser first to ensure they play audio')
    console.log('- Stream URLs can become inactive - always have backups')
    console.log('- SomaFM and RadioJar are generally reliable sources')
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
      audioRef.current.muted = false // Unmute when volume is changed
      setIsMuted(false)
    }
  }

  const updateAudioVolume = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.muted = true
      } else {
        audioRef.current.volume = volume[0] / 100
        audioRef.current.muted = false
      }
    }
  }

  const playNextStation = () => {
    if (!currentStation || stations.length === 0) return
    
    const currentIndex = stations.findIndex(station => station.id === currentStation.id)
    const nextIndex = (currentIndex + 1) % stations.length
    const nextStation = stations[nextIndex]
    
    if (nextStation) {
      playStation(nextStation)
    }
  }

  const playPreviousStation = () => {
    if (!currentStation || stations.length === 0) return
    
    const currentIndex = stations.findIndex(station => station.id === currentStation.id)
    const previousIndex = currentIndex === 0 ? stations.length - 1 : currentIndex - 1
    const previousStation = stations[previousIndex]
    
    if (previousStation) {
      playStation(previousStation)
    }
  }

  const canPlayNext = () => {
    return currentStation && stations.length > 1
  }

  const canPlayPrevious = () => {
    return currentStation && stations.length > 1
  }

  if (loading) {
    return (
      <Card className="top-row-widget bg-white/95 backdrop-blur-xl border-0 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
            </div>
            <div className="w-8 h-4 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
              <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
              <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {!isExpanded ? (
        // Compact Radio View
        <Card 
          className="top-row-widget overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-sm hover:shadow-md transition-all duration-300 relative cursor-pointer"
          onClick={handleWidgetClick}
          data-radio-widget="true"
        >
      {/* Global Sponsorship Banner - At the very top */}
      {globalSponsorshipLoading && (
        <div className="w-full p-3 text-center text-white font-semibold shadow-lg bg-gradient-to-r from-blue-700 to-purple-700 border-b-2 border-white/20">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold">Loading sponsorship...</span>
          </div>
        </div>
      )}
      {!globalSponsorshipLoading && globalSponsorship && globalSponsorship.isActive && (
        <div 
          className="w-full p-3 text-center text-white font-semibold shadow-lg bg-gradient-to-r from-blue-700 to-purple-700 border-b-2 border-white/20"
          style={{
            backgroundColor: globalSponsorship.sponsorColor || undefined
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold">
              {globalSponsorship.title}
            </span>
          </div>
        </div>
      )}

      {/* Widget-Level Sponsor Banner - Always Visible */}
      {sponsoredBanner.isSponsored && (
        <div 
          className={`w-full p-4 text-center text-white font-semibold shadow-lg ${
            sponsoredBanner.bannerPosition === 'overlay' 
              ? 'absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-85' 
              : 'bg-gradient-to-r from-blue-700 to-purple-700 border-b-2 border-white/20'
          }`}
          style={{
            backgroundColor: sponsoredBanner.sponsorColor || undefined
          }}
        >
          <div className="flex items-center justify-center gap-3">
            {sponsoredBanner.sponsorLogo && (
              <img 
                src={sponsoredBanner.sponsorLogo} 
                alt={sponsoredBanner.sponsorName || 'Sponsor'} 
                className="h-8 w-8 object-contain rounded-full bg-white/20 p-1"
              />
            )}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-lg font-bold">
                {sponsoredBanner.sponsorMessage || `Pattaya's Radio, brought to you by ${sponsoredBanner.sponsorName}`}
              </span>
              {sponsoredBanner.sponsorWebsite && (
                <a 
                  href={sponsoredBanner.sponsorWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white underline text-sm font-medium bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all"
                >
                  Visit Site
                </a>
              )}
            </div>
          </div>
        </div>
      )}



      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span className="text-[15px] font-medium text-gray-900">Radio</span>
            
            {/* Current Station Indicator */}
            {currentStation && stations.length > 1 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium border-gray-200 rounded-full">
                {stations.findIndex(s => s.id === currentStation.id) + 1}/{stations.length}
              </Badge>
            )}
            
            {/* Widget-Level Sponsor Indicator */}
            {sponsoredBanner.isSponsored && (
              <Badge className="bg-blue-500/10 text-blue-600 text-[10px] px-2 py-0.5 font-medium border border-blue-200 rounded-full">
                Sponsored Widget
              </Badge>
            )}
            
            {/* Offline Fallback Indicator */}
            {stations.length > 0 && stations[0].streamUrl.includes('example.com') && (
              <Badge className="bg-orange-500/10 text-orange-600 text-[10px] px-2 py-0.5 font-medium border border-orange-200 rounded-full">
                Offline Mode
              </Badge>
            )}
          </div>
          
          {/* More Button */}
          {onToggleExpand && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className="h-8 px-3 text-xs font-medium bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-105 shadow-sm"
              title="Expand widget"
            >
              <ChevronDown className="w-3 h-3 mr-1" />
              More
            </Button>
          )}
        </div>
      </CardHeader>



      <CardContent className="pt-0 space-y-4">
        {/* Pre-Roll Ad Display */}
        {isPlayingPreRollAd && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-800">Playing Advertisement</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              {currentStation?.preRollAdText && (
                <p className="text-xs text-blue-700">{currentStation.preRollAdText}</p>
              )}
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${preRollAdProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600">
                Radio will start in {Math.ceil((currentStation?.preRollAdDuration || 5) - (preRollAdProgress / 100) * (currentStation?.preRollAdDuration || 5))} seconds
              </p>
            </div>
          </div>
        )}



        {/* Simple Sponsored Label Heading */}
        {sponsoredBanner.isSponsored && (
          <div className="text-center py-2">
            <p className="text-sm text-blue-600 font-medium">
              {sponsoredBanner.sponsorMessage || `Pattaya's Radio, brought to you by ${sponsoredBanner.sponsorName}`}
            </p>
          </div>
        )}

        {/* Current Station Display */}
        {currentStation && (
          <div className="bg-gray-50/50 rounded-lg p-4">
            {/* Playing indicator for sponsored stations */}
            {currentStation.isSponsored && isPlaying && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">
                    Playing sponsored station
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                {logoLoadingStates[currentStation.id] !== false && (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
                    <Radio className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <img
                  src={currentStation.logo || "/placeholder.svg"}
                  alt={currentStation.name}
                  className={`w-16 h-16 rounded-lg object-cover shadow-sm transition-opacity duration-200 ${
                    logoLoadingStates[currentStation.id] === false ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoadStart={() => setLogoLoading(currentStation.id)}
                  onLoad={() => handleLogoLoad(currentStation.id)}
                  onError={(e) => {
                    handleLogoError(currentStation.id, currentStation.name)
                    // Fallback to placeholder if logo fails to load
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=64&width=64&text=" + currentStation.name.charAt(0)
                  }}
                />
                {currentStation.featured && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                    <Star className="w-2 h-2 text-white fill-white" />
                  </div>
                )}
                {currentStation.isSponsored && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                    SPONSORED
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-[15px] truncate">{currentStation.name}</h3>
                  {currentStation.isSponsored && (
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                        SPONSORED
                      </Badge>
                      {currentStation.sponsoredLabel && (
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                          {currentStation.sponsoredLabel}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mb-2">
                  <span className="font-mono font-medium text-purple-600">{currentStation.frequency} FM</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-medium">{currentStation.genre}</span>
                  {!validateStreamUrl(currentStation.streamUrl) && (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                      Station Offline
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{currentStation.listeners.toLocaleString()} listeners</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    <span className="truncate max-w-32">{currentStation.nowPlaying}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Sponsored Station Highlight */}
        {currentStation?.isSponsored && currentStation.sponsoredLabel && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">
                Currently Playing: {currentStation.sponsoredLabel}
              </span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Main Controls - Responsive Layout */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleUserInteraction()
              playPreviousStation()
            }}
            disabled={!canPlayPrevious()}
            title={canPlayPrevious() ? "Previous station" : "No previous station available"}
            className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
              canPlayPrevious()
                ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleUserInteraction() // Enable autoplay on first interaction
              console.log('Play button clicked!')
              console.log('Current station:', currentStation)
              console.log('Is playing:', isPlaying)
              console.log('Audio ref:', audioRef.current)
              if (currentStation) {
                console.log('Calling playStation with:', currentStation)
                playStation(currentStation)
              } else {
                console.log('No current station available')
              }
            }}
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-sm hover:shadow-md transition-all duration-200 ${
              currentStation && validateStreamUrl(currentStation.streamUrl)
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={!currentStation || !validateStreamUrl(currentStation.streamUrl)}
          >
            {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />}
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleUserInteraction()
              playNextStation()
            }}
            disabled={!canPlayNext()}
            title={canPlayNext() ? "Next station" : "No next station available"}
            className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
              canPlayNext()
                ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

                 {/* Volume Control - Only in collapsed view */}
         <div className="flex items-center justify-center">
           <div className="relative">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => {
                 handleUserInteraction()
                 toggleMute()
               }}
               className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
             >
               {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 sm:w-4 sm:h-4" />}
             </Button>
           </div>
         </div>

      <Separator className="my-2" />

              {/* Station Selector - Responsive Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-700">Quick Select:</span>
            <div className="flex gap-1 flex-wrap">
              {stations.slice(0, 3).map((station) => (
                <Button
                  key={station.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => playStation(station)}
                  className={`h-7 px-2 rounded-full text-[11px] transition-all duration-200 ${
                    currentStation?.id === station.id
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {station.frequency}
                </Button>
              ))}
            </div>
          </div>

        <div className="flex items-center gap-2">
          {/* Error indicator */}
          {error && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600">
              <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
              <span className="font-medium">Connection issue</span>
            </div>
          )}

          {/* All Stations Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 rounded-full text-[11px]">
                <MoreVertical className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">All Stations</span>
                <span className="sm:hidden">Stations</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="p-3">
                                  <div className="text-[13px] font-semibold text-gray-700 mb-3">
                    <span>All Stations ({stations.length})</span>
                  </div>
                <div className="space-y-1">
                  {stations.map((station) => (
                    <DropdownMenuItem
                      key={station.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        currentStation?.id === station.id
                          ? "bg-purple-50 border border-purple-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => playStation(station)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="relative">
                          {logoLoadingStates[station.id] !== false && (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
                              <Radio className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <img
                            src={station.logo || "/placeholder.svg"}
                            alt={station.name}
                            className={`w-10 h-10 rounded-lg object-cover shadow-sm transition-opacity duration-200 ${
                              logoLoadingStates[station.id] === false ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoadStart={() => setLogoLoading(station.id)}
                            onLoad={() => handleLogoLoad(station.id)}
                            onError={(e) => {
                              handleLogoError(station.id, station.name)
                              // Fallback to placeholder if logo fails to load
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=40&width=40&text=" + station.name.charAt(0)
                            }}
                          />
                          {station.featured && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                              <Star className="w-1.5 h-1.5 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[13px] truncate">{station.name}</p>
                            {station.isSponsored && (
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-[8px] px-1 py-0.5 bg-green-50 text-green-700 border-green-200">
                                  SPONSORED
                                </Badge>
                                {station.sponsoredLabel && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                    {station.sponsoredLabel}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {station.isLive && (
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                            <span className="font-mono font-medium text-purple-600">{station.frequency} FM</span>
                            <span>•</span>
                            <span>{station.genre}</span>
                            <span>•</span>
                            <span>{station.listeners.toLocaleString()} listeners</span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-1">{station.nowPlaying}</p>
                        </div>
                        
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </CardContent>

      {/* Hidden audio element for pre-roll ads */}
      <audio
        ref={preRollAdRef}
        preload="none"
        onError={(e) => {
          console.error('Pre-roll ad error:', e)
          setIsPlayingPreRollAd(false)
        }}
      />

      {/* Hidden audio element for radio streams */}
      <audio
        ref={audioRef}
        preload="none"
        onError={(e) => {
          console.error('Radio stream error:', e)
          setError('Radio stream error occurred')
          setIsPlaying(false)
        }}
      />

      {/* Widget Sponsor Watermark */}
      {sponsoredBanner.isSponsored && (
        <div className="absolute bottom-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded-full shadow-sm">
            <Radio className="h-3 w-3 text-gray-500" />
            <span className="font-medium">Sponsored by {sponsoredBanner.sponsorName}</span>
          </div>
        </div>
      )}
        </Card>
      ) : (
        // Expanded Radio View (Full Content in Widget)
        <Card className="h-full bg-white/95 backdrop-blur-xl border-0 shadow-lg overflow-y-auto">
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span className="text-[15px] font-medium text-gray-900">Radio Stations</span>
              </div>
              <div className="flex items-center gap-2">
                {onToggleExpand && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleExpand()
                    }}
                    className="h-8 px-3 text-xs font-medium bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-105 shadow-sm"
                    title="Collapse widget"
                  >
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Less
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-6">
            {/* Current Station Info */}
            {currentStation && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={currentStation.logo || "/placeholder.svg"}
                      alt={currentStation.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onLoad={() => handleLogoLoad(currentStation.id)}
                      onError={(e) => {
                        handleLogoError(currentStation.id, currentStation.name)
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=64&width=64&text=" + currentStation.name.charAt(0)
                      }}
                    />
                    {currentStation.featured && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <Star className="w-2 h-2 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{currentStation.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-mono font-medium text-purple-600">{currentStation.frequency} FM</span>
                      <span>•</span>
                      <span>{currentStation.genre}</span>
                      <span>•</span>
                      <span>{currentStation.listeners.toLocaleString()} listeners</span>
                    </div>
                    <p className="text-sm text-gray-700">{currentStation.nowPlaying}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        Station {stations.findIndex(s => s.id === currentStation.id) + 1} of {stations.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playPreviousStation()}
                      disabled={!canPlayPrevious()}
                      title="Previous station"
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    
                    <Button
                      onClick={() => currentStation && playStation(currentStation)}
                      disabled={!currentStation || !validateStreamUrl(currentStation.streamUrl)}
                      className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playNextStation()}
                      disabled={!canPlayNext()}
                      title="Next station"
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Volume Control */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 min-w-[3rem]">{volume[0]}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-8 w-8 p-0"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Volume: {volume[0]}% {isMuted && "• Muted"}
              </div>
            </div>

            {/* All Stations List */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900">All Stations</h4>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                      currentStation?.id === station.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                    onClick={() => playStation(station)}
                  >
                    <div className="relative">
                      <img
                        src={station.logo || "/placeholder.svg"}
                        alt={station.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        onLoad={() => handleLogoLoad(station.id)}
                        onError={(e) => {
                          handleLogoError(station.id, station.name)
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=48&width=48&text=" + station.name.charAt(0)
                        }}
                      />
                      {station.featured && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                          <Star className="w-1.5 h-1.5 text-white fill-white" />
                        </div>
                      )}
                      {station.isLive && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900 truncate">{station.name}</h5>
                        {station.isSponsored && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                            SPONSORED
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-mono font-medium text-purple-600">{station.frequency} FM</span>
                        <span>•</span>
                        <span>{station.genre}</span>
                        <span>•</span>
                        <span>{station.listeners.toLocaleString()} listeners</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{station.nowPlaying}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {station.website && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(station.website, '_blank')
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
