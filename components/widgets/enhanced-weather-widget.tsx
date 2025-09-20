"use client"

import { useState, useEffect } from 'react'
import { 
  Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, 
  Eye, Sunrise, Sunset, AlertTriangle, MapPin, Clock,
  ChevronDown, ChevronUp, RefreshCw, CloudDrizzle, Zap, CloudSnow,
  Target, Activity, Waves, Gauge
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { LocateMeButton } from '@/components/location/locate-me-button'
import { useLocation } from '@/components/location/location-provider'
import { buildApiUrl } from '@/lib/strapi-config'
import { SponsorshipBanner } from '@/components/widgets/sponsorship-banner'

interface WeatherData {
  location: {
    name: string
    lat: number
    lon: number
  }
  current: {
    temperature: number
    feelsLike: number
    condition: string
    description: string
    humidity: number
    windSpeed: number
    pressure: number
    visibility: number
    uvIndex: number
    icon: string
    sunrise: string
    sunset: string
  }
  hourly: Array<{
    time: string
    temp: number
    icon: string
  }>
  daily: Array<{
    date: string
    high: number
    low: number
    icon: string
    description: string
  }>
  airQuality?: {
    index: number
    level: string
    pm25: number
    pm10: number
  }
  alerts?: Array<{
    event: string
    severity: string
    start: string
    end: string
    description: string
  }>
  marine?: {
    tideTimes?: Array<{
      type: 'High' | 'Low'
      time: string
    }>
    seaState?: 'Calm' | 'Moderate' | 'Rough'
    waveHeightM?: number
  }
  suggestions?: Array<{
    title: string
    description?: string
    link: string
    icon: string
    priority?: boolean // Added for Strapi source indicator
  }>
  units: 'metric' | 'imperial'
  lastUpdated: string
  source: string
}

interface WeatherSettings {
  defaultCityName: string
  defaultLatitude: number
  defaultLongitude: number
  units: 'metric' | 'imperial'
  updateFrequencyMinutes: number
  widgetEnabled: boolean
  sponsoredEnabled: boolean
  sponsorName?: string
  sponsorLogo?: string
}

export function EnhancedWeatherWidget() {
  const { location, units, setUnits, requestLocation, locationPermission } = useLocation()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [settings, setSettings] = useState<WeatherSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  // Prompt for geolocation access on first visit
  useEffect(() => {
    if (locationPermission === 'prompted') {
      requestLocation().catch(() => {})
    }
  }, [locationPermission, requestLocation])

  useEffect(() => {
    if (settings) {
      loadWeather()
    }
  }, [settings, location])

  // Refresh weather when units change
  useEffect(() => {
    if (weather && settings) {
      loadWeather()
    }
  }, [units])

  // Fetch suggestions when weather condition changes
  useEffect(() => {
    if (weather && weather.current.condition) {
      fetchWeatherSuggestions(weather.current.condition)
    }
  }, [weather?.current.condition])

  const fetchWeatherSuggestions = async (condition: string) => {
    try {
      setSuggestionsLoading(true)
      const suggestionsResponse = await fetch(buildApiUrl(`weather/suggestions?condition=${condition}`))
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json()
        if (suggestionsData.data && suggestionsData.data.length > 0) {
          // Process and validate suggestions data to ensure consistent structure
          const processedSuggestions = suggestionsData.data.map((suggestion: any) => ({
            title: suggestion.title || 'Activity Suggestion',
            description: suggestion.description || '',
            link: suggestion.link || '#',
            icon: suggestion.icon || '💡',
            priority: suggestion.priority || false
          }))
          
          // Update weather with real suggestions from Strapi
          setWeather(prev => prev ? {
            ...prev,
            suggestions: processedSuggestions
          } : null)
          return
        }
      }
    } catch (error) {
      console.warn('Failed to fetch weather suggestions from Strapi:', error)
    } finally {
      setSuggestionsLoading(false)
    }
    // Do not generate synthetic suggestions; leave empty if API fails
  }

  const loadSettings = async () => {
    try {
      const response = await fetch(buildApiUrl('weather/settings'))
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
      } else {
        // Fallback to default settings if API fails
        setSettings({
          defaultCityName: 'Pattaya City',
          defaultLatitude: 12.9236,
          defaultLongitude: 100.8825,
          units: 'metric',
          updateFrequencyMinutes: 30,
          widgetEnabled: true,
          sponsoredEnabled: false
        })
      }
    } catch (error) {
      console.error('Failed to load weather settings:', error)
      // Fallback to default settings
      setSettings({
        defaultCityName: 'Pattaya City',
        defaultLatitude: 12.9236,
        defaultLongitude: 100.8825,
        units: 'metric',
        updateFrequencyMinutes: 30,
        widgetEnabled: true,
        sponsoredEnabled: false
      })
    }
  }

  const loadWeather = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Determine coordinates to use
      const lat = location?.lat || settings?.defaultLatitude || 12.9236
      const lon = location?.lon || settings?.defaultLongitude || 100.8825
      const currentUnits = units || settings?.units || 'metric'
      
      // Build API URL with parameters
      const apiUrl = buildApiUrl(`weather/current?lat=${lat}&lon=${lon}&units=${currentUnits}`)
      
      console.log('🌤️ Fetching weather from:', apiUrl)
      
      // Test if Strapi server is running
      try {
        const healthCheck = await fetch(buildApiUrl(''), { method: 'HEAD' })
        console.log('🔍 Strapi server status:', healthCheck.status)
      } catch (healthError) {
        console.error('🚨 Strapi server appears to be down:', healthError)
        throw new Error('Weather service is currently unavailable. Please check if the server is running.')
      }
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `Weather API error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.text()
          console.error('Weather API error details:', errorData)
          errorMessage += ` - ${errorData}`
        } catch (e) {
          console.error('Could not parse error response:', e)
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (data.data) {
        console.log('✅ Weather data received:', data.data)
        
        // Validate and normalize the weather data structure
        const validatedWeather = validateWeatherData(data.data)
        setWeather(validatedWeather)
      } else {
        throw new Error('Invalid weather data format')
      }
      
    } catch (error) {
      console.error('Weather loading error:', error)
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Unable to load weather data'
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (errorMsg.includes('Weather service is currently unavailable')) {
        errorMessage = 'Weather service is currently unavailable. Please check if the server is running.'
      } else if (errorMsg.includes('500')) {
        errorMessage = 'Weather API configuration error. Please check server logs for details.'
      } else if (errorMsg.includes('OpenWeatherMap API key not configured')) {
        errorMessage = 'Weather API key not configured. Please contact administrator.'
      }
      
      setError(errorMessage)
      // Do not populate synthetic fallback weather data
    } finally {
      setLoading(false)
    }
  }

  // Validate and normalize weather data structure
  const validateWeatherData = (data: any): WeatherData => {
    return {
      location: {
        name: data.location?.name || 'Unknown Location',
        lat: data.location?.lat || 12.9236,
        lon: data.location?.lon || 100.8825
      },
      current: {
        temperature: data.current?.temperature || 0,
        feelsLike: data.current?.feelsLike || 0,
        condition: data.current?.condition || 'unknown',
        description: data.current?.description || 'Unknown',
        humidity: data.current?.humidity || 0,
        windSpeed: data.current?.windSpeed || 0,
        pressure: data.current?.pressure || 0,
        visibility: data.current?.visibility || 0,
        uvIndex: data.current?.uvIndex || 0,
        icon: data.current?.icon || '01d',
        sunrise: data.current?.sunrise || new Date().toISOString(),
        sunset: data.current?.sunset || new Date().toISOString()
      },
      hourly: data.hourly || [],
      daily: data.daily || [],
      airQuality: data.airQuality || null,
      alerts: data.alerts || [],
      marine: data.marine || null,
      suggestions: data.suggestions ? data.suggestions.map((suggestion: any) => ({
        title: suggestion.title || 'Activity Suggestion',
        description: suggestion.description || '',
        link: suggestion.link || '#',
        icon: suggestion.icon || '💡',
        priority: suggestion.priority || false
      })) : [],
      units: data.units || 'metric',
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      source: data.source || 'Unknown'
    }
  }

  // Removed synthetic fallback suggestions – only show API-provided suggestions

  // Map OpenWeather icon code or text to category and colors
  const getConditionCategory = (value: string) => {
    const v = String(value || '').toLowerCase()
    const codeMatch = v.match(/^(\d{2})[dn]?$/)
    const code = codeMatch ? codeMatch[1] : ''
    if (code) {
      if (code === '01') return 'sunny'
      if (['02','03','04'].includes(code)) return 'cloudy'
      if (['09','10'].includes(code)) return 'rain'
      if (code === '11') return 'thunder'
      if (code === '13') return 'snow'
      if (code === '50') return 'drizzle'
    }
    if (v.includes('clear') || v.includes('sun')) return 'sunny'
    if (v.includes('cloud')) return 'cloudy'
    if (v.includes('thunder')) return 'thunder'
    if (v.includes('drizzle')) return 'drizzle'
    if (v.includes('snow')) return 'snow'
    if (v.includes('rain')) return 'rain'
    return 'other'
  }

  const getWeatherIcon = (condition: string, size = 'h-12 w-12', animated: boolean = true) => {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
      return (
        <div className="relative group">
          <Sun className={`${size} text-amber-500 ${animated ? 'animate-pulse group-hover:animate-spin' : ''} transition-all duration-700`} />
          {animated && (
            <>
              <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping group-hover:animate-bounce"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-bounce delay-300 group-hover:animate-ping"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-300 rounded-full animate-pulse delay-500 group-hover:animate-bounce"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-yellow-200/30 to-orange-200/30 rounded-full animate-pulse group-hover:scale-150 transition-all duration-1000"></div>
            </>
          )}
        </div>
      )
    } else if (conditionLower.includes('cloud')) {
      return (
        <div className="relative group">
          <Cloud className={`${size} text-gray-400 ${animated ? 'animate-bounce group-hover:animate-pulse' : ''} transition-all duration-700`} />
          {animated && (
            <>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-300 rounded-full animate-pulse group-hover:animate-bounce delay-100"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gray-300 rounded-full animate-pulse group-hover:animate-bounce delay-300"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-200 rounded-full animate-bounce group-hover:animate-ping delay-200"></div>
              <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 w-1.5 h-1.5 bg-blue-100 rounded-full animate-pulse group-hover:animate-bounce delay-400"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
            </>
          )}
        </div>
      )
    } else if (conditionLower.includes('rain')) {
      return (
        <div className="relative group">
          <CloudRain className={`${size} text-blue-500 ${animated ? 'animate-bounce group-hover:animate-pulse' : ''} transition-all duration-700`} />
          {animated && (
            <>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce group-hover:animate-ping delay-75"></div>
                  <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce group-hover:animate-ping delay-150"></div>
                  <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce group-hover:animate-ping delay-225"></div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full animate-pulse group-hover:scale-150 transition-all duration-1000"></div>
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-200 rounded-full animate-bounce group-hover:animate-ping delay-100"></div>
            </>
          )}
        </div>
      )
    } else if (conditionLower.includes('thunder')) {
      return (
        <div className="relative group">
          <Zap className={`${size} text-yellow-600 ${animated ? 'animate-pulse group-hover:animate-bounce' : ''} transition-all duration-700`} />
          {animated && (
            <>
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping group-hover:animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-yellow-200/40 to-orange-200/40 rounded-full animate-pulse group-hover:scale-150 transition-all duration-1000"></div>
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full animate-bounce group-hover:animate-ping delay-200"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-300 rounded-full animate-pulse group-hover:animate-bounce delay-400"></div>
            </>
          )}
        </div>
      )
    } else if (conditionLower.includes('drizzle')) {
      return (
        <div className="relative group">
          <CloudDrizzle className={`${size} text-gray-500 ${animated ? 'animate-bounce group-hover:animate-pulse' : ''} transition-all duration-700`} />
          {animated && (
            <>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-0.5 h-2 bg-gray-400 rounded-full animate-bounce group-hover:animate-ping delay-100"></div>
                  <div className="w-0.5 h-1.5 bg-gray-400 rounded-full animate-bounce group-hover:animate-ping delay-200"></div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-gray-200/30 to-blue-200/30 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
            </>
          )}
        </div>
      )
    } else if (conditionLower.includes('snow')) {
      return (
        <div className="relative group">
          <CloudSnow className={`${size} text-gray-300 ${animated ? 'animate-bounce group-hover:animate-pulse' : ''} transition-all duration-700`} />
          {animated && (
            <>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-ping group-hover:animate-bounce delay-75"></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-ping group-hover:animate-bounce delay-150"></div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-white/30 to-blue-100/30 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-bounce group-hover:animate-ping delay-100"></div>
            </>
          )}
        </div>
      )
    } else {
      return (
        <div className="relative group">
          <Cloud className={`${size} text-gray-400 ${animated ? 'animate-pulse group-hover:animate-bounce' : ''} transition-all duration-700`} />
          {animated && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-gray-200/30 to-blue-200/30 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
          )}
        </div>
      )
    }
  }

  const getAirQualityColor = (index: number) => {
    if (index <= 2) return 'bg-green-100 text-green-800 border-green-200'
    if (index <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (index <= 4) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getTimeRemaining = (endTimeIso: string) => {
    const diffMs = new Date(endTimeIso).getTime() - Date.now()
    if (diffMs <= 0) return 'now'
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }

  const getSeaStateColor = (state: string) => {
    switch (state) {
      case 'Calm': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Rough': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!settings?.widgetEnabled) {
    return null
  }

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
              <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
          <p className="text-sm font-medium text-gray-500">Weather unavailable</p>
          <Button onClick={loadWeather} variant="outline" size="sm" className="mt-3 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasAlerts = weather.alerts && weather.alerts.length > 0
  const isSponsored = settings.sponsoredEnabled && settings.sponsorName

  return (
    <>
      <Card
        className={`group transition-all duration-700 ease-out hover:shadow-2xl hover:scale-[1.02] cursor-pointer overflow-hidden h-full min-h-[220px] ${
          hasAlerts 
            ? 'bg-gradient-to-br from-red-500/10 via-red-400/20 to-red-600/10 border-red-300/50 shadow-lg' 
            : 'bg-gradient-to-br from-blue-500/10 via-indigo-500/15 to-purple-500/10 border-blue-200/50 shadow-lg'
        } shadow-xl backdrop-blur-xl relative flex flex-col`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Global Sponsorship Banner */}
        <SponsorshipBanner widgetType="weather" />
        
        {/* Vibrant animated background with Lucide icons */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-500/8 to-purple-600/5 animate-pulse"></div>
          
          {/* Floating animated icons */}
          <div className="absolute top-4 right-4 opacity-20">
            <Cloud className="w-8 h-8 text-blue-400 animate-bounce delay-100" />
          </div>
          <div className="absolute top-8 left-6 opacity-15">
            <Sun className="w-6 h-6 text-yellow-400 animate-spin" style={{animationDuration: '8s'}} />
          </div>
          <div className="absolute bottom-6 right-8 opacity-20">
            <Wind className="w-7 h-7 text-cyan-400 animate-pulse delay-300" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-15">
            <Droplets className="w-5 h-5 text-blue-300 animate-bounce delay-500" />
          </div>
          <div className="absolute top-1/2 left-2 opacity-10">
            <Thermometer className="w-6 h-6 text-red-400 animate-pulse delay-700" />
          </div>
          <div className="absolute top-1/3 right-2 opacity-15">
            <Eye className="w-5 h-5 text-green-400 animate-bounce delay-900" />
          </div>
          
          {/* Geometric shapes with gradients */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full animate-pulse delay-500"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-indigo-400/20 animate-pulse opacity-50"></div>
        </div>

        <CardHeader className="pb-4 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-semibold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Weather
              </span>
              {hasAlerts && (
                <Badge variant="destructive" className="ml-2 animate-pulse bg-gradient-to-r from-red-500 to-red-600 border-red-400">
                  <AlertTriangle className="w-3 h-3 mr-1 animate-bounce" />
                  Alert
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div onClick={(e) => e.stopPropagation()}>
                <LocateMeButton />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  loadWeather()
                }}
                className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-indigo-100/80 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 transition-transform duration-300 text-blue-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              </Button>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="relative">
              <MapPin className="w-3 h-3 text-blue-500 animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 text-blue-400 animate-ping opacity-50"></div>
            </div>
            <span className="tracking-wide uppercase bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
              {weather.location.name || 'Pattaya, Thailand'}
            </span>
          </div>

          {/* Sponsor Badge */}
          {isSponsored && (
            <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
              <span className="text-xs text-blue-600 font-medium">Sponsored by</span>
              {settings.sponsorLogo && (
                <img 
                  src={settings.sponsorLogo} 
                  alt={settings.sponsorName}
                  className="h-4 w-auto"
                />
              )}
              <span className="text-xs font-semibold text-blue-900">{settings.sponsorName}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 relative z-10 flex flex-col flex-1 justify-between">
          {/* Main Content Area (Compact) */}
          <div className="flex flex-col justify-between flex-1">
            {hasAlerts && weather.alerts && weather.alerts.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 shadow-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {weather.alerts[0].event}
                  </div>
                  <div className="text-xs opacity-90">
                    For next {getTimeRemaining(weather.alerts[0].end)}
                  </div>
                </div>
              </div>
            )}
            {/* Main Weather Display - Enhanced with vibrant styling */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="transform hover:scale-110 transition-transform duration-300 flex-shrink-0 relative">
                  {getWeatherIcon(weather.current.condition)}
                  {/* Glow effect around weather icon */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-lg animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-4xl sm:text-5xl font-light bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-500">
                    {Math.round(weather.current.temperature)}°{units === 'metric' ? 'C' : 'F'}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 capitalize group-hover:text-blue-700 transition-colors duration-500 truncate">
                    {weather.current.description}
                  </div>
                  <div className="text-xs text-gray-500 font-medium group-hover:text-indigo-600 transition-colors duration-500">
                    Feels like {Math.round(weather.current.feelsLike)}°{units === 'metric' ? 'C' : 'F'}
                  </div>
                  
                </div>
              </div>

              {/* Units Toggle - Enhanced */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm rounded-lg p-1 border border-blue-200/50 flex-shrink-0 shadow-sm">
                <Button
                  variant={units === 'metric' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUnits('metric')
                  }}
                  className={`h-6 px-2 text-xs transition-all duration-300 hover:scale-105 ${
                    units === 'metric' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                      : 'hover:bg-blue-200/50 text-blue-700'
                  }`}
                >
                  °C
                </Button>
                <Button
                  variant={units === 'imperial' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUnits('imperial')
                  }}
                  className={`h-6 px-2 text-xs transition-all duration-300 hover:scale-105 ${
                    units === 'imperial' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                      : 'hover:bg-blue-200/50 text-blue-700'
                  }`}
                >
                  °F
                </Button>
              </div>
            </div>

            {/* Inline quick chips (bottom-aligned, larger) */}
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap w-full">
              {/* Sun (sunrise) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs text-orange-700">
                <Sunrise className="w-4 h-4" />
                <span>{formatTime(weather.current.sunrise)}</span>
              </div>
              {/* UV Index */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <Gauge className="w-4 h-4" />
                <span>UV {weather.current.uvIndex ?? '-'}</span>
              </div>
              {/* Beach (sea state) */}
              {weather.marine?.seaState && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs text-cyan-700">
                  <Waves className="w-4 h-4" />
                  <span>{weather.marine.seaState}</span>
                </div>
              )}
              {/* Air quality */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                <Activity className="w-4 h-4" />
                <span>{weather.airQuality ? weather.airQuality.level : 'Air'}</span>
              </div>
              {/* Visibility */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs text-purple-800">
                <Eye className="w-4 h-4" />
                <span>{weather.current.visibility} km</span>
              </div>
              {/* Humidity */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800">
                <Droplets className="w-4 h-4" />
                <span>{weather.current.humidity}%</span>
              </div>
              {/* Wind */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs text-cyan-800">
                <Wind className="w-4 h-4" />
                <span>{Math.round(weather.current.windSpeed)} {units === 'metric' ? 'km/h' : 'mph'}</span>
              </div>
            </div>

            {/* Key secondary stats removed (wind/humidity tiles) to keep layout minimal */}
          </div>
          {/* Footer removed in compact to reduce height */}
        </CardContent>
      </Card>

      {/* Weather Modal - Apple Design Inspired */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[75vh] overflow-hidden rounded-3xl border border-gray-100 shadow-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50">
          {/* Header - Clean and minimal */}
          <DialogHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-2xl flex items-center justify-center">
                  {getWeatherIcon(weather.current.condition, "h-8 w-8", false)}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-semibold text-gray-900 mb-1">
                    {weather.location.name}
                  </DialogTitle>
                  <p className="text-sm text-gray-500">
                    {formatTime(weather.lastUpdated)} • {weather.source}
                  </p>
                </div>
              </div>
              
              {/* Alert badge - minimal */}
              {hasAlerts && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                  <span className="text-sm font-medium text-red-700">Weather Alert</span>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Main content - Single scroll area */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(75vh-120px)]">
            
            {/* Hero Section - Current weather prominently displayed */}
            <div className="text-center mb-6 p-6 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
              <div className="text-7xl font-thin text-gray-900 mb-2 tracking-tight">
                {Math.round(weather.current.temperature)}°
              </div>
              <div className="text-xl text-gray-700 mb-1 font-medium capitalize">
                {weather.current.description}
              </div>
              <div className="text-base text-gray-500 mb-4">
                Feels like {Math.round(weather.current.feelsLike)}°{units === 'metric' ? 'C' : 'F'}
              </div>
              {/* Primary suggestion - big text below temperature */}
              {weather.suggestions && weather.suggestions.length > 0 && (
                <div className="mt-2">
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {weather.suggestions[0].title}
                  </div>
                  {weather.suggestions[0].description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {weather.suggestions[0].description}
                    </div>
                  )}
                  {weather.suggestions[0].link && weather.suggestions[0].link !== '#' && (
                    <div className="mt-3">
                      <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
                        <a href={weather.suggestions[0].link}>Learn more</a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Sponsor section - Right below temperature */}
              {isSponsored && (
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50">
                  <span className="text-xs text-gray-500">Powered by</span>
                  {settings.sponsorLogo && (
                    <img 
                      src={settings.sponsorLogo} 
                      alt={settings.sponsorName}
                      className="h-4 w-auto"
                    />
                  )}
                  <span className="text-xs font-semibold text-gray-700">{settings.sponsorName}</span>
                </div>
              )}
            </div>

            {/* Severe Weather Alerts */}
            {hasAlerts && (
              <div className="mb-6 bg-red-50/70 border border-red-200/70 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Government Weather Alerts
                </h3>
                <div className="space-y-3">
                  {weather.alerts!.slice(0, 2).map((alert, idx) => (
                    <div key={idx} className="bg-white/70 rounded-xl p-3 border border-red-100/70">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-red-800 truncate pr-2">{alert.event}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                          {alert.severity || 'alert'}
                        </span>
                      </div>
                      <div className="text-xs text-red-700 mt-1">
                        {formatTime(alert.start)} - {formatTime(alert.end)}
                      </div>
                      {alert.description && (
                        <div className="text-xs text-red-800/90 mt-2 line-clamp-3 whitespace-pre-wrap">
                          {alert.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-6 bg-gray-200" />

            {/* Key metrics in cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl p-6 border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Humidity</div>
                    <div className="text-2xl font-semibold text-gray-900">{weather.current.humidity}%</div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-6 border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <Wind className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Wind</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {Math.round(weather.current.windSpeed)}
                    </div>
                    <div className="text-xs text-gray-500">{units === 'metric' ? 'km/h' : 'mph'}</div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-6 border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Sun className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">UV Index</div>
                    <div className="text-2xl font-semibold text-gray-900">{weather.current.uvIndex}</div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-6 border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Visibility</div>
                    <div className="text-2xl font-semibold text-gray-900">{weather.current.visibility}</div>
                    <div className="text-xs text-gray-500">km</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly Forecast - Horizontal scroll */}
            {weather.hourly.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Next 24 Hours</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {weather.hourly.map((hour, index) => (
                    <div key={index} className="flex-shrink-0 text-center p-4 bg-white/80 rounded-2xl border border-gray-200 min-w-[80px] hover:border-blue-200">
                      <div className="text-sm text-gray-500 mb-3 font-medium">
                        {formatTime(hour.time)}
                      </div>
                      <div className="mb-3">
                        {getWeatherIcon(hour.icon, "h-8 w-8 mx-auto", false)}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{hour.temp}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Forecast - Compact list */}
            {weather.daily.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">5-Day Forecast</h3>
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-slate-50 to-white">
                  {weather.daily.map((day, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 ${index !== weather.daily.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {index === 0 ? 'Today' : formatDate(day.date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <div>{getWeatherIcon((day as any).icon || (day as any).description, "h-6 w-6", false)}</div>
                          <div className="text-sm text-gray-600 capitalize">{day.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-8 text-right">{day.low}°</span>
                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8">{day.high}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info - Clean sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Sun & Air Quality */}
              <div className="space-y-4">
                {/* Sun times */}
                <div className="rounded-2xl p-6 border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
                  <h4 className="text-base font-semibold text-orange-900 mb-4">Sun</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sunrise className="w-5 h-5 text-orange-500" />
                        <span className="text-sm text-gray-600">Sunrise</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatTime(weather.current.sunrise)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sunset className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-600">Sunset</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatTime(weather.current.sunset)}</span>
                    </div>
                  </div>
                </div>

                {/* Air Quality */}
                {weather.airQuality && (
                  <div className="rounded-2xl p-6 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50">
                    <h4 className="text-base font-semibold text-emerald-900 mb-4">Air Quality</h4>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">AQI</span>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAirQualityColor(weather.airQuality.index)}`}>
                        {weather.airQuality.level}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">PM2.5</span>
                        <span className="font-medium text-gray-900">{weather.airQuality.pm25}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">PM10</span>
                        <span className="font-medium text-gray-900">{weather.airQuality.pm10}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Marine & Suggestions */}
              <div className="space-y-4">
                {/* Marine conditions */}
                {weather.marine && (
                  <div className="rounded-2xl p-6 border border-cyan-100 bg-gradient-to-br from-cyan-50 to-sky-50">
                    <h4 className="text-base font-semibold text-cyan-900 mb-4">Beach Conditions</h4>
                    
                    {weather.marine.seaState && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">Sea State</span>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeaStateColor(weather.marine.seaState)}`}>
                          {weather.marine.seaState}
                        </div>
                      </div>
                    )}
                    
                    {weather.marine.waveHeightM && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">Wave Height</span>
                        <span className="text-sm font-semibold text-gray-900">{weather.marine.waveHeightM}m</span>
                      </div>
                    )}
                    
                    {weather.marine.tideTimes && (
                      <div className="pt-4 border-t border-gray-200/50">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Today's Tides</div>
                        <div className="space-y-2">
                          {weather.marine.tideTimes.map((tide, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{tide.type} Tide</span>
                              <span className="font-medium text-gray-900">{formatTime(tide.time)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Smart suggestions - Professional list */}
                {weather.suggestions && weather.suggestions.length > 1 && (
                  <div className="rounded-2xl p-6 border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <h4 className="text-base font-semibold text-indigo-900 mb-4">Recommendations</h4>
                    <div className="space-y-3">
                      {weather.suggestions.slice(1).map((suggestion, index) => (
                        <div key={index} className="p-4 bg-white rounded-xl border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 mb-1">
                                {suggestion.title}
                                {suggestion.priority && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Priority</span>
                                )}
                              </div>
                              {suggestion.description && (
                                <div className="text-xs text-gray-600 leading-relaxed">
                                  {suggestion.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional metrics - Clean grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
              <div className="text-center p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Pressure</div>
                <div className="text-2xl font-semibold text-gray-900">{weather.current.pressure}</div>
                <div className="text-xs text-gray-500">hPa</div>
              </div>
              
              <div className="text-center p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Visibility</div>
                <div className="text-2xl font-semibold text-gray-900">{weather.current.visibility}</div>
                <div className="text-xs text-gray-500">km</div>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

