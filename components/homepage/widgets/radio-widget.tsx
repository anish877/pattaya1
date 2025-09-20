"use client"

import React, { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Heart, Radio, MoreVertical, Users, Music, Star, RefreshCw, ExternalLink, X, ChevronDown, ChevronUp, Activity, Zap, Headphones, Signal, Clock, TrendingUp, Globe, Wifi, WifiOff, SkipBack, SkipForward, Plus, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
// removed dropdown menu in compact view
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"
import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"

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
  isActive?: boolean
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
  IsActive: boolean
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


export const RadioWidget = React.memo(function RadioWidget({ className }: { className?: string }) {
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlayingPreRollAd, setIsPlayingPreRollAd] = useState(false)
  const [preRollAdProgress, setPreRollAdProgress] = useState(0)
  const [logoLoadingStates, setLogoLoadingStates] = useState<Record<string, boolean>>({})
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [shouldAutoplay, setShouldAutoplay] = useState(false)
  const [preloadedAudio, setPreloadedAudio] = useState<HTMLAudioElement | null>(null)
  const [isPreloading, setIsPreloading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isStationsOpen, setIsStationsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const preRollAdRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    loadStations()
    loadFavorites()
    loadSponsoredBanner()
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
              handleUserInteraction()
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
      // Filter for active stations only and sort by display order
      const response = await fetch(buildApiUrl("radio-stations?filters[IsActive][$eq]=true&populate[0]=Logo&populate[1]=AudioPreRollAd&populate[2]=CoverImage&sort=DisplayOrder:asc"))

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
              isActive: stationData.IsActive !== undefined ? stationData.IsActive : true,
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

            // Preload the default station for immediate playback
            preloadStationAudio(defaultStation)

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


  const loadSponsoredBanner = async () => {
    try {
      // Load global homepage sponsorship configuration from Strapi
      const response = await fetch('/api/homepage-configs/active')
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
      const testAudio = new Audio()
      testAudio.crossOrigin = 'anonymous'
      testAudio.preload = 'none'
      testAudio.volume = 0.3 // Low volume for testing

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

      // Set source and try to play
      testAudio.src = testUrl
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
    }
  }

  // Preload audio for immediate playback
  const preloadStationAudio = async (station: RadioStation) => {
    if (!station.streamUrl || !validateStreamUrl(station.streamUrl)) {
      console.log('Skipping preload for invalid stream URL:', station.streamUrl)
      return
    }

    try {
      setIsPreloading(true)
      console.log('🔄 Preloading audio for:', station.name)

      // Create new audio element for preloading
      const audio = new Audio()

      // Configure for preloading
      try {
        audio.crossOrigin = 'anonymous'
      } catch (corsError) {
        console.log('CORS anonymous failed during preload, trying use-credentials:', corsError)
        try {
          audio.crossOrigin = 'use-credentials'
        } catch (corsError2) {
          console.log('CORS use-credentials failed during preload, using no CORS:', corsError2)
          audio.crossOrigin = null
        }
      }

      audio.preload = 'metadata'
      audio.volume = 0 // Keep volume at 0 during preload
      audio.muted = true // Keep muted during preload
      audio.controls = false

      // Set up event listeners for preloading
      const handleCanPlay = () => {
        console.log('✅ Audio preloaded successfully for:', station.name)
        setPreloadedAudio(audio)
        setIsPreloading(false)
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('loadstart', handleLoadStart)
      }

      const handleError = (e: any) => {
        console.warn('⚠️ Preload failed for:', station.name, e)
        setIsPreloading(false)
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('loadstart', handleLoadStart)
      }

      const handleLoadStart = () => {
        console.log('🔄 Preload started for:', station.name)
      }

      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('error', handleError)
      audio.addEventListener('loadstart', handleLoadStart)

      // Set source and start loading
      audio.src = station.streamUrl
      audio.load()

    } catch (error) {
      console.error('Error preloading audio:', error)
      setIsPreloading(false)
    }
  }

  const handleWidgetClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons or interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="button"]')) {
      return
    }

    // Expand the widget
    setIsExpanded(true)
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
      console.log('Current playing state:', isPlaying)
      console.log('Audio ref current time:', audioRef.current?.currentTime)
      console.log('Audio ref paused:', audioRef.current?.paused)
      console.log('Audio ref ready state:', audioRef.current?.readyState)

      if (isPlaying && audioRef.current && !audioRef.current.paused) {
        // Pause current station
        console.log('Pausing current station')
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        // Resume or start current station
        console.log('Resuming/starting current station')
        if (audioRef.current && audioRef.current.readyState >= 2) {
          // Audio is loaded, try to play
          audioRef.current.play().catch((err) => {
            console.error('Resume play failed:', err)
            setError(`Playback failed: ${err.message}`)
            // If resume fails, try to restart the station
            console.log('Resume failed, restarting station...')
            playStationDirectly(station)
          })
          setIsPlaying(true)
        } else {
          // Audio not ready, restart the station
          console.log('Audio not ready, restarting station...')
          playStationDirectly(station)
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

  const playStationDirectly = async (station: RadioStation) => {
    console.log('=== playStationDirectly called ===')
    console.log('Station:', station.name)
    console.log('Stream URL:', station.streamUrl)
    console.log('Has user interacted:', hasUserInteracted)

    // Stop any currently playing audio and clean up
    if (audioRef.current) {
      console.log('Stopping current audio')
      try {
        // Call cleanup function if it exists
        if ((audioRef.current as any).__cleanup) {
          (audioRef.current as any).__cleanup()
        }

        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.src = ''
        audioRef.current.load() // Reset the audio element
      } catch (cleanupError) {
        console.log('Error during audio cleanup:', cleanupError)
      }
      audioRef.current = null
    }

    // Clear any existing error and set loading state
    setError(null)
    setIsLoading(true)
    setIsSwitching(true)

    try {
      console.log('Creating new Audio object')
      const audio = new Audio()

      // Configure audio element for streaming
      // Try different CORS settings for better compatibility
      try {
        audio.crossOrigin = 'anonymous'
      } catch (corsError) {
        console.log('CORS anonymous failed, trying use-credentials:', corsError)
        try {
          audio.crossOrigin = 'use-credentials'
        } catch (corsError2) {
          console.log('CORS use-credentials failed, using no CORS:', corsError2)
          audio.crossOrigin = null
        }
      }

      audio.preload = 'none' // Don't preload for streaming
      audio.controls = false

      // Additional audio configuration for better streaming support
      audio.loop = false
      audio.autoplay = false

      // Set initial volume and mute state
      audio.volume = isMuted ? 0 : volume[0] / 100
      audio.muted = isMuted

      console.log('Setting audio properties - Volume:', audio.volume, 'Muted:', audio.muted)

      // Add comprehensive event listeners
      const handlePlay = () => {
        console.log('✅ Audio started playing:', station.name)
        setIsPlaying(true)
        setIsLoading(false)
        setTimeout(() => setIsSwitching(false), 120)
        setError(null)
      }

      const handlePause = () => {
        console.log('⏸️ Audio paused:', station.name)
        setIsPlaying(false)
        setIsLoading(false)
      }

      const handleEnded = () => {
        console.log('⏹️ Audio ended:', station.name)
        setIsPlaying(false)
        setIsLoading(false)
        setIsSwitching(false)
      }

      const handleError = (e: Event) => {
        console.error('❌ Audio error for station:', station.name, e)
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
          // Check network state
          if (audioElement.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
            errorMessage += "Stream URL not accessible (404 or offline)."
          } else if (audioElement.networkState === HTMLMediaElement.NETWORK_LOADING) {
            errorMessage += "Stream is loading but may be slow or offline."
          } else {
            errorMessage += "Unknown error occurred."
          }
        }

        console.error('Audio error details:', {
          error: audioElement.error,
          networkState: audioElement.networkState,
          readyState: audioElement.readyState,
          src: audioElement.src
        })

        setError(errorMessage)
        setIsPlaying(false)
        setIsLoading(false)
        setIsSwitching(false)
      }

      const handleCanPlay = () => {
        console.log('✅ Audio can play:', station.name)
        setError(null)
        setIsLoading(false)
      }

      const handleLoadStart = () => {
        console.log('🔄 Audio loading started:', station.name)
        setError(null)
      }

      const handleLoadedMetadata = () => {
        console.log('📊 Audio metadata loaded:', station.name)
      }

      const handleWaiting = () => {
        console.log('⏳ Audio waiting for data:', station.name)
      }

      const handleStalled = () => {
        console.log('⚠️ Audio stalled:', station.name)
      }

      // Add all event listeners
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('loadstart', handleLoadStart)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('waiting', handleWaiting)
      audio.addEventListener('stalled', handleStalled)

      // Store cleanup function for later use
      const cleanup = () => {
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('loadstart', handleLoadStart)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('waiting', handleWaiting)
        audio.removeEventListener('stalled', handleStalled)
      }

      // Store cleanup function on the audio element for later use
      ;(audio as any).__cleanup = cleanup

      // Set the audio source
      audio.src = station.streamUrl
      audioRef.current = audio
      // Avoid triggering large re-renders on parent by not changing other state here

      // Update current station
      setCurrentStation(station)

      console.log('🎵 Attempting to play audio...')

      // Try to play the audio
      try {
        await audio.play()
        console.log('✅ Audio play() promise resolved')
        setIsPlaying(true)
      } catch (playError: any) {
        console.error('❌ Audio play() promise rejected:', playError)

        // Handle specific autoplay policy errors
        if (playError.name === 'NotAllowedError') {
          setError('Audio playback blocked by browser. Please click the play button again.')
          console.log('🔒 Autoplay blocked - user interaction required')
        } else if (playError.name === 'NotSupportedError') {
          setError('Audio format not supported by your browser.')
        } else if (playError.name === 'AbortError') {
          setError('Audio playback was interrupted.')
        } else {
          setError(`Playback failed: ${playError.message}`)
        }

        setIsPlaying(false)
        setIsLoading(false)
      }

    } catch (error) {
      console.error('❌ Error creating audio object:', error)
      setError(`Error creating audio: ${String(error)}`)
      setIsPlaying(false)
      setIsLoading(false)
    }
  }

  const validateStreamUrl = (url: string): boolean => {
    // Check if URL is not a placeholder
    if (url.includes('example.com') || url.includes('placeholder') || !url || url.trim() === '') {
      return false
    }

    // Check if URL has a valid protocol and is a real streaming URL
    try {
      const urlObj = new URL(url)
      const isValidProtocol = urlObj.protocol === 'http:' || urlObj.protocol === 'https:'

      if (!isValidProtocol) {
        return false
      }

      // Check for actual streaming URLs (not webpage URLs)
      const isStreamingUrl = (
        // Audio file extensions
        url.includes('.mp3') || 
        url.includes('.aac') || 
        url.includes('.ogg') || 
        url.includes('.wav') ||
        url.includes('.flac') ||
        url.includes('.m4a') ||
        // Streaming protocols
        url.includes('.m3u8') ||
        url.includes('.pls') ||
        // Common streaming paths
        url.includes('/stream') ||
        url.includes('/live') ||
        url.includes('/listen') ||
        url.includes('/audio') ||
        url.includes('/radio') ||
        // Common streaming domains
        url.includes('ice.infomaniak.ch') ||
        url.includes('stream.') ||
        url.includes('radio.') ||
        url.includes('live.') ||
        url.includes('listen.') ||
        url.includes('audio.') ||
        // Common streaming ports
        url.includes(':8000') ||
        url.includes(':8048') ||
        url.includes(':9050') ||
        url.includes(':8080') ||
        url.includes(':8001') ||
        url.includes(':8002') ||
        // Shoutcast/Icecast streams
        url.includes('shoutcast') ||
        url.includes('icecast') ||
        // Radio streaming services
        url.includes('radiojar.com') ||
        url.includes('somafm.com') ||
        url.includes('tunein.com') ||
        url.includes('radionomy.com') ||
        // Direct streaming URLs with common patterns
        url.includes(';stream') ||
        url.includes('stream.mp3') ||
        url.includes('stream.aac') ||
        url.includes('stream.ogg') ||
        url.includes('live.mp3') ||
        url.includes('live.aac') ||
        url.includes('listen.mp3') ||
        url.includes('listen.aac')
      )

      // Exclude webpage URLs and non-streaming content
      const isNotWebpage = !(
        url.includes('/stations/') ||
        url.includes('/radio/') ||
        url.includes('/station/') ||
        url.includes('.html') ||
        url.includes('.php') ||
        url.includes('.aspx') ||
        url.includes('.jsp') ||
        url.includes('onlineradiofm.in') ||
        url.includes('tunein.com/radio/') ||
        url.includes('radionomy.com/radio/') ||
        // Exclude URLs that are clearly web pages
        (url.includes('.com/') && !url.includes('stream') && !url.includes('live') && !url.includes('listen') && !url.includes('audio'))
      )

      const isValid = isValidProtocol && isStreamingUrl && isNotWebpage

      if (!isValid) {
        console.log('Stream URL validation failed:', {
          url,
          isValidProtocol,
          isStreamingUrl,
          isNotWebpage
        })
      }

      return isValid
    } catch (error) {
      console.log('Stream URL validation error:', error, 'for URL:', url)
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

  const testCurrentStation = async () => {
    if (!currentStation) {
      console.log('No current station to test')
      return
    }

    console.log('🧪 Testing current station:', currentStation.name)
    console.log('Stream URL:', currentStation.streamUrl)
    console.log('URL validation:', validateStreamUrl(currentStation.streamUrl))

    // Test the stream URL
    const testResult = await testStreamUrl(currentStation.streamUrl)
    console.log('Stream test result:', testResult)

    // Test audio playback
    testAudioPlayback()
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
      // Preload the next station for immediate playback
      preloadStationAudio(nextStation)
      playStation(nextStation)
    }
  }

  const playPreviousStation = () => {
    if (!currentStation || stations.length === 0) return

    const currentIndex = stations.findIndex(station => station.id === currentStation.id)
    const previousIndex = currentIndex === 0 ? stations.length - 1 : currentIndex - 1
    const previousStation = stations[previousIndex]

    if (previousStation) {
      // Preload the previous station for immediate playback
      preloadStationAudio(previousStation)
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
      <Card className="top-row-widget bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 backdrop-blur-xl border-0 shadow-sm relative overflow-hidden">
        {/* Animated Music Background Elements for Loading */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 animate-bounce delay-100">
            <Music className="w-5 h-5 text-orange-400/60" />
          </div>
          <div className="absolute top-8 right-6 animate-bounce delay-300">
            <Radio className="w-4 h-4 text-red-400/60" />
          </div>
          <div className="absolute bottom-6 left-8 animate-bounce delay-500">
            <Headphones className="w-3 h-3 text-pink-400/60" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-200/20 rounded-full animate-ping"></div>
          <div className="absolute -bottom-6 -left-6 w-8 h-8 bg-pink-200/20 rounded-full animate-ping delay-500"></div>
        </div>

        <CardHeader className="pb-6 relative z-10">
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
      <Card 
        className="top-row-widget overflow-y-auto bg-gradient-to-br from-purple-500/10 via-pink-500/15 to-indigo-500/10 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 relative cursor-pointer backdrop-blur-xl"
        onClick={handleWidgetClick}
        data-radio-widget="true"
      >
        {/* Animated Music Background Elements (subtle) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Musical Notes */}
          <div className="absolute top-4 left-4 animate-bounce delay-100">
            <Music className="w-5 h-5 text-orange-400/50" />
          </div>
          <div className="absolute top-8 right-6 animate-bounce delay-300">
            <Radio className="w-4 h-4 text-red-400/50" />
          </div>
          <div className="absolute bottom-6 left-8 animate-bounce delay-500">
            <Headphones className="w-3.5 h-3.5 text-pink-400/50" />
          </div>
          <div className="absolute bottom-4 right-4 animate-bounce delay-700">
            <Volume2 className="w-4 h-4 text-orange-400/50" />
          </div>

          {/* Sound Waves */}
          <div className="absolute top-1/2 left-2 w-0.5 h-6 bg-orange-300/25 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-4 w-0.5 h-4 bg-red-300/25 rounded-full animate-pulse delay-100"></div>
          <div className="absolute top-1/2 left-6 w-0.5 h-6 bg-pink-300/25 rounded-full animate-pulse delay-200"></div>
          <div className="absolute top-1/2 left-8 w-0.5 h-3 bg-orange-300/25 rounded-full animate-pulse delay-300"></div>

          {/* Floating Music Elements */}
          <div className="absolute top-1/4 right-8 animate-ping delay-1000">
            <Activity className="w-4 h-4 text-red-400/50" />
          </div>
          <div className="absolute bottom-1/4 left-12 animate-ping delay-1500">
            <Signal className="w-3 h-3 text-pink-400/50" />
          </div>
          <div className="absolute top-3/4 right-12 animate-ping delay-2000">
            <Zap className="w-4 h-4 text-orange-400/50" />
          </div>

          {/* Pulsing Circles */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-200/20 rounded-full animate-ping"></div>
          <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-pink-200/20 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-red-200/20 rounded-full animate-ping delay-1000"></div>
        </div>

        {/* Global Sponsorship Banner - At the very top */}
        <SponsorshipBanner widgetType="radio" />

        {/* Vibrant animated background with music-related Lucide icons */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-pink-500/8 to-indigo-600/5 animate-pulse"></div>

          {/* Floating animated music icons */}
          <div className="absolute top-4 right-4 opacity-15">
            <Music className="w-6 h-6 text-purple-400 animate-bounce delay-100" />
          </div>
          <div className="absolute top-8 left-6 opacity-10">
            <Radio className="w-5 h-5 text-pink-400 animate-spin" style={{animationDuration: '8s'}} />
          </div>
          <div className="absolute bottom-6 right-8 opacity-15">
            <Headphones className="w-5 h-5 text-indigo-400 animate-pulse delay-300" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-10">
            <Volume2 className="w-4 h-4 text-purple-300 animate-bounce delay-500" />
          </div>
          <div className="absolute top-1/2 left-2 opacity-10">
            <Zap className="w-5 h-5 text-pink-400 animate-pulse delay-700" />
          </div>
          <div className="absolute top-1/3 right-2 opacity-10">
            <Activity className="w-4 h-4 text-indigo-400 animate-bounce delay-900" />
          </div>
          <div className="absolute top-1/4 left-1/3 opacity-10">
            <Signal className="w-3.5 h-3.5 text-purple-500 animate-pulse delay-400" />
          </div>
          <div className="absolute bottom-1/3 right-1/4 opacity-10">
            <TrendingUp className="w-4 h-4 text-pink-500 animate-bounce delay-600" />
          </div>

          {/* Geometric shapes with gradients */}
          <div className="absolute -top-12 -right-12 w-20 h-20 bg-gradient-to-br from-purple-400/15 to-pink-500/15 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-indigo-400/15 to-purple-500/15 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-pink-400/10 to-indigo-500/10 rounded-full animate-pulse delay-500"></div>

          {/* Subtle musical note pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>

          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/15 via-pink-500/15 to-indigo-400/15 animate-pulse opacity-30"></div>
        </div>

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



      <CardHeader className="pb-2 sm:pb-3 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-[15px] font-semibold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Radio
            </span>

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

          {/* Actions - Top Right */}
          <div className="flex items-center gap-2">
            {error && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Connection issue"
              >
                <WifiOff className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleUserInteraction()
                toggleMute()
              }}
              className={`h-8 w-8 rounded-full transition-all duration-300 hover:scale-110 ${
                isMuted 
                  ? "bg-red-100 hover:bg-red-200 text-red-600" 
                  : "bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-600"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4 animate-bounce" />
              )}
            </Button>
          </div>
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
          <div className="bg-gradient-to-r from-purple-50/60 to-pink-50/40 backdrop-blur-sm rounded-xl p-3 border border-purple-200/40 shadow-sm relative z-10 transition-opacity duration-200 min-h-[96px]" style={{opacity: isSwitching ? 0.6 : 1}}>
            {/* Playing indicator for sponsored stations */}
            {/* Compact: omit sponsored playing banner to save space */}

            <div className="flex items-center gap-3 sm:gap-3">
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
                {!validateStreamUrl(currentStation.streamUrl) && (
                  <div className="absolute -bottom-1 -left-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                    OFFLINE
                  </div>
                )}
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
                {/* Title and badges row with fixed height to prevent shifts */}
                <div className="flex items-center gap-2 mb-0.5 min-h-[18px]">
                  <h3 className="font-semibold text-gray-900 text-[15px] truncate max-w-[12rem] sm:max-w-[16rem] md:max-w-[20rem]" title={currentStation.name}>{currentStation.name}</h3>
                  <div className="flex items-center gap-1 min-h-[16px]">
                    {currentStation.isSponsored ? (
                      <>
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                        SPONSORED
                      </Badge>
                        {currentStation.sponsoredLabel ? (
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 truncate max-w-[8rem]" title={currentStation.sponsoredLabel}>
                          {currentStation.sponsoredLabel}
                        </Badge>
                        ) : (
                          <span className="invisible text-[8px] px-1.5 py-0.5">placeholder</span>
                      )}
                      </>
                    ) : (
                      // Reserve space when no badges present
                      <span className="invisible text-[8px] px-1.5 py-0.5">placeholder</span>
                  )}
                </div>
                </div>
                {/* Meta row with fixed height */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-1.5 min-h-[16px]">
                  <span className="font-mono font-medium text-purple-600">{currentStation.frequency} FM</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-medium">{currentStation.genre}</span>
                </div>
                {/* Info row with fixed height (allow truncation) */}
                <div className="flex items-center gap-2 text-[11px] text-gray-500 min-h-[16px] min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Users className="w-3 h-3" />
                    <span className="truncate max-w-[8rem] sm:max-w-[12rem]" title={String(currentStation.listeners)}>{currentStation.listeners.toLocaleString()} listeners</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                    <Music className="w-3 h-3" />
                    <span className="block truncate overflow-hidden whitespace-nowrap max-w-full" title={currentStation.nowPlaying}>{currentStation.nowPlaying}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact: omit large sponsored highlight block to fit height */}

        {/* Main Controls - Enhanced with vibrant styling */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 relative z-10">
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
            className={`h-10 w-10 rounded-full transition-all duration-300 ${
              canPlayPrevious()
                ? "bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-600 hover:scale-110 shadow-sm"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <SkipBack className="w-4 h-4 animate-pulse" />
          </Button>
          {isPlaying && (
            <div className="hidden sm:flex items-end gap-0.5 h-6 ml-1" aria-hidden>
              <span className="w-0.5 bg-purple-400 animate-[pulse_1.1s_ease-in-out_infinite]" style={{height: '40%'}} />
              <span className="w-0.5 bg-pink-400 animate-[pulse_1.3s_ease-in-out_infinite]" style={{height: '80%'}} />
              <span className="w-0.5 bg-indigo-400 animate-[pulse_0.9s_ease-in-out_infinite]" style={{height: '55%'}} />
              <span className="w-0.5 bg-purple-400 animate-[pulse_1.5s_ease-in-out_infinite]" style={{height: '70%'}} />
              <span className="w-0.5 bg-pink-400 animate-[pulse_1.1s_ease-in-out_infinite]" style={{height: '50%'}} />
            </div>
          )}

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
                handleUserInteraction()
                playStation(currentStation)
              } else {
                console.log('No current station available')
              }
            }}
            className={`h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 relative ${
              currentStation && validateStreamUrl(currentStation.streamUrl)
                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:scale-110"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={!currentStation || !validateStreamUrl(currentStation.streamUrl)}
          >
            {/* Glow effect for play button */}
            {currentStation && validateStreamUrl(currentStation.streamUrl) && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full animate-ping"></div>
            )}
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 animate-pulse" />
            ) : (
              <Play className="w-6 h-6 ml-0.5 animate-bounce" />
            )}
            {isSwitching && (
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white/80 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-pink-500 animate-ping"></div>
              </div>
            )}
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
            className={`h-10 w-10 rounded-full transition-all duration-300 ${
              canPlayNext()
                ? "bg-gradient-to-r from-pink-100 to-indigo-100 hover:from-pink-200 hover:to-indigo-200 text-pink-600 hover:scale-110 shadow-sm"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <SkipForward className="w-4 h-4 animate-pulse" />
          </Button>
        </div>


      <Separator className="my-1.5" />

        <div className="relative z-10">
          <div className="w-full grid place-items-center min-h-[48px] py-0">
            <Button
              onClick={() => setIsStationsOpen(true)}
              className="h-9 px-4 rounded-full text-[12px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 max-w-[90%]"
            >
              <Plus className="w-4 h-4" />
              <span className="font-light">More Stations</span>
            </Button>
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
        preload="metadata"
        crossOrigin="anonymous"
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

    {isStationsOpen && (
      <div className="absolute inset-0 z-[9999999999999]" onClick={() => setIsStationsOpen(false)}>
        {/* Exact compact widget background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-pink-500/8 to-indigo-600/5 animate-pulse"></div>

          {/* Floating animated music icons */}
          <div className="absolute top-4 right-4 opacity-15">
            <Music className="w-6 h-6 text-purple-400 animate-bounce delay-100" />
                  </div>
          <div className="absolute top-8 left-6 opacity-10">
            <Radio className="w-5 h-5 text-pink-400 animate-spin" style={{animationDuration: '8s'}} />
                  </div>
          <div className="absolute bottom-6 right-8 opacity-15">
            <Headphones className="w-5 h-5 text-indigo-400 animate-pulse delay-300" />
                </div>
          <div className="absolute bottom-4 left-4 opacity-10">
            <Volume2 className="w-4 h-4 text-purple-300 animate-bounce delay-500" />
                </div>
          <div className="absolute top-1/2 left-2 opacity-10">
            <Zap className="w-5 h-5 text-pink-400 animate-pulse delay-700" />
              </div>
          <div className="absolute top-1/3 right-2 opacity-10">
            <Activity className="w-4 h-4 text-indigo-400 animate-bounce delay-900" />
          </div>
          <div className="absolute top-1/4 left-1/3 opacity-10">
            <Signal className="w-3.5 h-3.5 text-purple-500 animate-pulse delay-400" />
        </div>
          <div className="absolute bottom-1/3 right-1/4 opacity-10">
            <TrendingUp className="w-4 h-4 text-pink-500 animate-bounce delay-600" />
        </div>

          {/* Geometric shapes with gradients */}
          <div className="absolute -top-12 -right-12 w-20 h-20 bg-gradient-to-br from-purple-400/15 to-pink-500/15 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-indigo-400/15 to-purple-500/15 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-pink-400/10 to-indigo-500/10 rounded-full animate-pulse delay-500"></div>

          {/* Subtle musical note pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>

          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/15 via-pink-500/15 to-indigo-400/15 animate-pulse opacity-30"></div>
              </div>
        {/* Foreground panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative h-full w-full flex flex-col rounded-xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-transparent bg-transparent">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-purple-600" />
              <span className="font-semibold text-gray-900 text-xs tracking-wide">All Stations ({stations.length})</span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700" onClick={() => setIsStationsOpen(false)}>
              <X className="h-3.5 w-3.5" />
              </Button>
                </div>
          <div className="p-2.5 sm:p-3 overflow-y-auto flex-1">
            <div className="grid gap-1.5">
                  {stations.map((station) => (
                <div
                      key={station.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentStation?.id === station.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => { handleUserInteraction(); playStation(station); setIsStationsOpen(false) }}
                >
                        <div className="relative">
                          <img
                            src={station.logo || "/placeholder.svg"}
                            alt={station.name}
                      className="w-9 h-9 rounded-lg object-cover shadow-sm"
                            onLoad={() => handleLogoLoad(station.id)}
                            onError={(e) => {
                              handleLogoError(station.id, station.name)
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=40&width=40&text=" + station.name.charAt(0)
                            }}
                          />
                          {station.featured && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full flex items-center justify-center shadow">
                              <Star className="w-1.5 h-1.5 text-white fill-white" />
                            </div>
                          )}
                        </div>
                  <div className="flex-1 min-w-0 text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-semibold text-gray-900 truncate max-w-[12rem]" title={station.name}>{station.name}</h5>
                            {station.isSponsored && (
                        <Badge variant="outline" className="text-[10px] leading-none px-1 py-0.5 bg-green-50 text-green-700 border-green-200">
                                  SPONSORED
                                  </Badge>
                                )}
                      {station.isLive && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>}
                              </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-600">
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-100">
                        <Radio className="w-3 h-3" />
                        <span className="font-mono font-medium">{station.frequency} FM</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded-md border border-gray-100 truncate">
                        <Music className="w-3 h-3" />
                        <span className="truncate max-w-[6rem] sm:max-w-[10rem]">{station.genre}</span>
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-100">
                        <Users className="w-3 h-3" />
                        <span>{station.listeners.toLocaleString()}</span>
                      </span>
                          </div>
                    <div className="mt-0.5 text-[11px] text-gray-500 flex items-center gap-1 min-w-0">
                      <Music className="w-3 h-3" />
                      <span className="truncate" title={station.nowPlaying}>{station.nowPlaying}</span>
                          </div>
                        </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleUserInteraction(); playStation(station); setIsStationsOpen(false) }}
                      className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700"
                      title={currentStation?.id === station.id && isPlaying ? 'Pause' : 'Play'}
                    >
                      {currentStation?.id === station.id && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </Button>
                      </div>
                </div>
                  ))}
                </div>
              </div>
        </div>
      </div>
    )}

    {/* Expanded Radio Widget Modal - compact, matching UI */}
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden p-0 [&>button]:hidden">
        <div className="relative rounded-xl overflow-hidden">
          {/* Exact compact widget background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-pink-500/8 to-indigo-600/5 animate-pulse"></div>

            {/* Floating animated music icons */}
            <div className="absolute top-4 right-4 opacity-15">
              <Music className="w-6 h-6 text-purple-400 animate-bounce delay-100" />
            </div>
            <div className="absolute top-8 left-6 opacity-10">
              <Radio className="w-5 h-5 text-pink-400 animate-spin" style={{animationDuration: '8s'}} />
            </div>
            <div className="absolute bottom-6 right-8 opacity-15">
              <Headphones className="w-5 h-5 text-indigo-400 animate-pulse delay-300" />
            </div>

            {/* Subtle sound wave patterns */}
            <div className="absolute top-12 right-12 opacity-8">
              <div className="flex items-end gap-1">
                <div className="w-1 h-2 bg-purple-300 rounded-full animate-pulse delay-100"></div>
                <div className="w-1 h-3 bg-pink-300 rounded-full animate-pulse delay-200"></div>
                <div className="w-1 h-1 bg-indigo-300 rounded-full animate-pulse delay-300"></div>
                <div className="w-1 h-4 bg-purple-300 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-2 bg-pink-300 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>

            {/* Pulsing circles */}
            <div className="absolute bottom-4 left-4 opacity-10">
              <div className="w-8 h-8 border border-purple-400 rounded-full animate-ping"></div>
            </div>
            <div className="absolute top-16 left-12 opacity-8">
              <div className="w-4 h-4 border border-pink-400 rounded-full animate-ping delay-500"></div>
            </div>

            {/* Geometric shapes */}
            <div className="absolute top-20 right-16 opacity-8">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rotate-45 animate-spin" style={{animationDuration: '6s'}}></div>
            </div>

            {/* Subtle dot pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.3) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}></div>

            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/15 via-pink-500/15 to-indigo-400/15 animate-pulse opacity-30"></div>
          </div>
          <div className="relative">
            {/* Header - matching compact widget style */}
            <div className="px-4 py-3 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-[15px] font-semibold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Radio Stations
                  </span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium border-gray-200 rounded-full">
                    {stations.length} stations
                  </Badge>
                </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
                  <X className="w-4 h-4" />
            </Button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Current Station Card - Enhanced with icons and colors */}
          {currentStation && (
                <div className="bg-gradient-to-r from-white/95 to-purple-50/95 backdrop-blur-sm rounded-xl border border-purple-200/60 shadow-lg p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={currentStation.logo || "/placeholder.svg"}
                    alt={currentStation.name}
                        className="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-purple-100"
                    onLoad={() => currentStation && handleLogoLoad(currentStation.id)}
                    onError={(e) => {
                      if (currentStation) {
                        handleLogoError(currentStation.id, currentStation.name)
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=64&width=64&text=" + currentStation.name.charAt(0)
                      }
                    }}
                  />
                  {currentStation?.featured && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <Star className="w-2 h-2 text-white fill-white" />
                    </div>
                  )}
                      {!validateStreamUrl(currentStation.streamUrl) && (
                        <div className="absolute -bottom-1 -left-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                          OFFLINE
                </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-purple-600" />
                          <h3 className="text-base font-semibold text-gray-900 truncate">{currentStation?.name}</h3>
                        </div>
                        {currentStation?.isSponsored && (
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 rounded-full">
                            <DollarSign className="w-2.5 h-2.5 mr-1" />
                            {currentStation.sponsoredLabel || "SPONSORED"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                        <div className="flex items-center gap-1">
                          <Signal className="w-3.5 h-3.5 text-purple-500" />
                    <span className="font-mono font-medium text-purple-600">{currentStation?.frequency} FM</span>
                  </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Music className="w-3.5 h-3.5 text-pink-500" />
                          <span className="text-pink-600">{currentStation?.genre}</span>
                  </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-blue-600">{currentStation?.listeners.toLocaleString()}</span>
                </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 truncate" title={currentStation?.nowPlaying}>
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate">{currentStation?.nowPlaying}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playPreviousStation()}
                    disabled={!canPlayPrevious()}
                    title="Previous station"
                        className="h-9 w-9 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-600 transition-all duration-200 shadow-sm"
                  >
                        <SkipBack className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    onClick={() => {handleUserInteraction();currentStation && playStation(currentStation)}}
                    disabled={!currentStation || !validateStreamUrl(currentStation?.streamUrl || '')}
                        className="h-11 w-11 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 relative"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                        {isSwitching && (
                          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white/80 flex items-center justify-center">
                            <RefreshCw className="w-2 h-2 text-purple-600 animate-spin" />
                          </div>
                        )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playNextStation()}
                    disabled={!canPlayNext()}
                    title="Next station"
                        className="h-9 w-9 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-600 transition-all duration-200 shadow-sm"
                  >
                        <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

              {/* Volume Control - Enhanced with colors and icons */}
              <div className="bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm rounded-xl border border-blue-200/60 shadow-lg p-3">
            <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-red-500" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">Volume</span>
                  </div>
              <div className="flex-1">
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600 min-w-[2.5rem]">{volume[0]}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                      className="h-7 w-7 p-0 rounded-full hover:bg-red-50 transition-all duration-200"
              >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
              </Button>
            </div>
            </div>
          </div>

              {/* All Stations List - Enhanced with icons and colors */}
          <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-600" />
                    <h4 className="text-base font-semibold text-gray-900">All Stations</h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                    {stations.length} stations
                  </Badge>
                </div>
                <div className="grid gap-2 max-h-80 overflow-y-auto scrollbar-thin pb-2">
              {stations.map((station) => (
                <div
                  key={station.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                        currentStation?.id === station.id 
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-sm ring-1 ring-purple-100' 
                          : 'bg-white/90 border-gray-200/60 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50'
                  }`}
                  onClick={() => {
                    handleUserInteraction()
                    playStation(station)
                  }}
                >
                  <div className="relative">
                    <img
                      src={station.logo || "/placeholder.svg"}
                      alt={station.name}
                          className="w-10 h-10 rounded-lg object-cover shadow-sm ring-1 ring-gray-100"
                      onLoad={() => handleLogoLoad(station.id)}
                      onError={(e) => {
                        handleLogoError(station.id, station.name)
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=48&width=48&text=" + station.name.charAt(0)
                      }}
                    />
                    {station.featured && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                        <Star className="w-1.5 h-1.5 text-white fill-white" />
                      </div>
                    )}
                    {station.isLive && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                        {!validateStreamUrl(station.streamUrl) && (
                          <div className="absolute -bottom-1 -left-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                            OFFLINE
                          </div>
                        )}
                  </div>

                  <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-1">
                            <Radio className="w-3 h-3 text-purple-500" />
                            <h5 className="text-sm font-medium text-gray-900 truncate">{station.name}</h5>
                          </div>
                      {station.isSponsored && (
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 rounded-full">
                              <DollarSign className="w-2 h-2 mr-1" />
                              {station.sponsoredLabel || "SPONSORED"}
                        </Badge>
                      )}
                    </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <div className="flex items-center gap-1">
                            <Signal className="w-3 h-3 text-purple-500" />
                            <span className="font-mono font-medium text-purple-600">{station.frequency} FM</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1">
                            <Music className="w-3 h-3 text-pink-500" />
                            <span className="text-pink-600">{station.genre}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-500" />
                            <span className="text-blue-600">{station.listeners.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 truncate" title={station.nowPlaying}>
                          <Activity className="w-3 h-3 text-indigo-500" />
                          <span className="truncate">{station.nowPlaying}</span>
                        </div>
                  </div>

                      <div className="flex items-center gap-1">
                    {station.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(station.website, '_blank')
                        }}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                      >
                            <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Custom Scrollbar Styles */}
    <style jsx>{`
      .scrollbar-thin {
        scrollbar-width: thin;
      }

      .scrollbar-thin::-webkit-scrollbar {
        width: 4px;
      }

      .scrollbar-thin::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 2px;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `}</style>
    </>
  )
})


