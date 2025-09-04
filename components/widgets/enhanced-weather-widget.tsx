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
import { Separator } from '@/components/ui/separator'
import { LocateMeButton } from '@/components/location/locate-me-button'
import { useLocation } from '@/components/location/location-provider'
import { buildApiUrl } from '@/lib/strapi-config'

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
    priority?: boolean
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

export function EnhancedWeatherWidget({ isExpanded = false, onToggleExpand }: { isExpanded?: boolean; onToggleExpand?: () => void }) {
  const { location, units, setUnits } = useLocation()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [settings, setSettings] = useState<WeatherSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (settings) {
      loadWeather()
    }
  }, [settings, location])

  useEffect(() => {
    if (weather && settings) {
      loadWeather()
    }
  }, [units])

  useEffect(() => {
    if (weather && weather.current.condition) {
      fetchWeatherSuggestions(weather.current.condition)
    }
  }, [weather?.current.condition])

  const loadSettings = async () => {
    try {
      const response = await fetch(buildApiUrl('/weather-settings'))
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data.attributes)
      } else {
        // Use default settings if API fails
        setSettings({
          defaultCityName: 'Pattaya, Thailand',
          defaultLatitude: 12.9236,
          defaultLongitude: 100.8824,
          units: 'metric',
          updateFrequencyMinutes: 15,
          widgetEnabled: true,
          sponsoredEnabled: false
        })
      }
    } catch (error) {
      console.error('Error loading weather settings:', error)
      // Use default settings
      setSettings({
        defaultCityName: 'Pattaya, Thailand',
        defaultLatitude: 12.9236,
        defaultLongitude: 100.8824,
        units: 'metric',
        updateFrequencyMinutes: 15,
        widgetEnabled: true,
        sponsoredEnabled: false
      })
    }
  }

  const loadWeather = async () => {
    if (!settings) return
    
    setLoading(true)
    try {
      const lat = location?.lat || settings.defaultLatitude
      const lon = location?.lon || settings.defaultLongitude
      
      // Try to fetch from the weather API endpoint
      const response = await fetch(buildApiUrl(`/weather?lat=${lat}&lon=${lon}&units=${units}`))
      if (response.ok) {
        const data = await response.json()
        setWeather(data)
        setError(null)
      } else {
        // Fallback to mock data if API fails
        console.warn('Weather API failed, using fallback data')
        setWeather(getFallbackWeatherData())
        setError(null)
      }
    } catch (error) {
      console.error('Error loading weather:', error)
      // Use fallback data on error
      setWeather(getFallbackWeatherData())
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  // Fallback weather data for when API is unavailable
  const getFallbackWeatherData = (): WeatherData => {
    const currentUnits = units || 'metric'
    return {
      location: {
        name: 'Pattaya, Thailand',
        lat: 12.9236,
        lon: 100.8824
      },
      current: {
        temperature: 32,
        feelsLike: 39,
        condition: 'clear',
        description: 'Clear Sky',
        humidity: 65,
        windSpeed: 3,
        pressure: 1013,
        visibility: 10,
        uvIndex: 6,
        icon: '01d',
        sunrise: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sunset: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      },
      hourly: [
        { time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), temp: 31, icon: '01d' },
        { time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), temp: 30, icon: '01d' },
        { time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), temp: 29, icon: '01n' },
        { time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), temp: 28, icon: '01n' }
      ],
      daily: [
        { date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), high: 33, low: 26, icon: '01d', description: 'clear sky' },
        { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), high: 32, low: 25, icon: '02d', description: 'few clouds' },
        { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), high: 31, low: 24, icon: '03d', description: 'scattered clouds' }
      ],
      airQuality: {
        index: 2,
        level: 'Fair',
        pm25: 15,
        pm10: 25
      },
      alerts: [],
      marine: {
        tideTimes: [
          { type: 'High', time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() },
          { type: 'Low', time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() }
        ],
        seaState: 'Moderate',
        waveHeightM: 0.8
      },
      suggestions: [],
      units: currentUnits,
      lastUpdated: new Date().toISOString(),
      source: 'Fallback Data'
    }
  }

  const fetchWeatherSuggestions = async (condition: string) => {
    if (!settings) return
    
    setSuggestionsLoading(true)
    try {
      const response = await fetch(buildApiUrl('/weather-suggestions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weatherCondition: condition,
          location: location?.name || settings.defaultCityName,
          units: units
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setWeather(prev => prev ? {
            ...prev,
            suggestions: data.data.map((item: any) => ({
              title: item.attributes.title,
              description: item.attributes.description,
              link: item.attributes.link,
              icon: item.attributes.icon,
              priority: item.attributes.priority
            }))
          } : null)
        }
      }
    } catch (error) {
      console.error('Error fetching weather suggestions:', error)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const getWeatherIcon = (condition: string, size = "h-12 w-12") => {
    const iconMap: { [key: string]: any } = {
      'clear': Sun,
      'cloudy': Cloud,
      'rain': CloudRain,
      'drizzle': CloudDrizzle,
      'snow': CloudSnow,
      'thunder': Zap,
      'windy': Wind,
      'foggy': Eye,
      'hazy': Eye
    }
    
    const IconComponent = iconMap[condition.toLowerCase()] || Cloud
    return <IconComponent className={`${size} text-blue-600`} />
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAirQualityColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-100 text-green-800'
    if (aqi <= 100) return 'bg-yellow-100 text-yellow-800'
    if (aqi <= 150) return 'bg-orange-100 text-orange-800'
    if (aqi <= 200) return 'bg-red-100 text-red-800'
    return 'bg-purple-100 text-purple-800'
  }

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-gray-500">Loading weather...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-300" />
          <p className="text-sm font-medium text-gray-500">Weather unavailable</p>
          <Button onClick={loadWeather} variant="outline" size="sm" className="mt-3 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
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
  const isSponsored = settings?.sponsoredEnabled && settings?.sponsorName

  return (
    <>
      {!isExpanded ? (
        // Compact Weather View
        <Card
          className={`group transition-all duration-700 ease-out hover:shadow-2xl hover:scale-[1.02] overflow-hidden ${
            hasAlerts 
              ? 'bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-red-200 shadow-lg' 
              : 'bg-gradient-to-br from-white via-blue-50/30 to-white border-gray-100/50 shadow-sm'
          } shadow-sm backdrop-blur-xl`}
        >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-100/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-blue-100/20 rounded-full animate-pulse delay-300"></div>
        </div>

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900">Weather</span>
              {hasAlerts && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" />
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
                className="h-8 w-8 p-0 hover:bg-gray-100/80 rounded-full transition-all duration-300 hover:scale-110"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 transition-transform duration-300 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {onToggleExpand && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpand()
                  }}
                  className="h-8 px-3 text-xs font-medium bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-105 shadow-sm"
                  title={isExpanded ? "Collapse widget" : "Expand widget"}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      More
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <MapPin className="w-3 h-3 animate-pulse" />
            <span className="tracking-wide uppercase">
              {weather.location.name || 'Pattaya, Thailand'}
            </span>
          </div>

          {/* Sponsor Badge */}
          {isSponsored && (
            <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
              <span className="text-xs text-blue-600 font-medium">Sponsored by</span>
              {settings?.sponsorLogo && (
                <img 
                  src={settings.sponsorLogo} 
                  alt={settings.sponsorName}
                  className="h-4 w-auto"
                />
              )}
              <span className="text-xs font-semibold text-blue-900">{settings?.sponsorName}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 space-y-4 relative z-10">
          {/* Main Weather Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="transform hover:scale-110 transition-transform duration-300">
                {getWeatherIcon(weather.current.condition)}
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-light text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors duration-500">
                  {Math.round(weather.current.temperature)}°{units === 'metric' ? 'C' : 'F'}
                </div>
                <div className="text-sm font-medium text-gray-600 capitalize group-hover:text-gray-700 transition-colors duration-500">
                  {weather.current.description}
                </div>
                <div className="text-xs text-gray-400 font-medium group-hover:text-gray-500 transition-colors duration-500">
                  Feels like {Math.round(weather.current.feelsLike)}°{units === 'metric' ? 'C' : 'F'}
                </div>
              </div>
            </div>

            {/* Units Toggle */}
            <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50">
              <Button
                variant={units === 'metric' ? 'default' : 'ghost'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setUnits('metric')
                }}
                className="h-6 px-2 text-xs transition-all duration-300 hover:scale-105"
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
                className="h-6 px-2 text-xs transition-all duration-300 hover:scale-105"
              >
                °F
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
              <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <div className="text-xs text-gray-600">Humidity</div>
              <div className="text-sm font-semibold text-gray-900">{weather.current.humidity}%</div>
            </div>
            <div className="text-center p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
              <Wind className="w-4 h-4 mx-auto mb-1 text-gray-600" />
              <div className="text-xs text-gray-600">Wind</div>
              <div className="text-sm font-semibold text-gray-900">
                {Math.round(weather.current.windSpeed)}
              </div>
              <div className="text-xs text-gray-500">{units === 'metric' ? 'km/h' : 'mph'}</div>
            </div>
            <div className="text-center p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
              <Eye className="w-4 h-4 mx-auto mb-1 text-purple-600" />
              <div className="text-xs text-gray-600">Visibility</div>
              <div className="text-sm font-semibold text-gray-900">
                {Math.round(weather.current.visibility / 1000)}
              </div>
              <div className="text-xs text-gray-500">km</div>
            </div>
          </div>

          {/* Sun Times */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-200/30">
            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-600">Sunrise</span>
              <span className="text-sm font-medium text-gray-900">{formatTime(weather.current.sunrise)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-600">Sunset</span>
              <span className="text-sm font-medium text-gray-900">{formatTime(weather.current.sunset)}</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-xs text-gray-400">
            Last updated: {formatTime(weather.lastUpdated)}
          </div>



          {/* Custom Scrollbar Styles */}
          <style jsx>{`
            .scrollbar-thin::-webkit-scrollbar {
              width: 6px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 3px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 3px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>
        </CardContent>
        </Card>
      ) : (
        // Expanded Weather View (Full Modal-like Experience)
        <Card className="h-full bg-gradient-to-br from-white via-blue-50/30 to-white border-gray-100/50 shadow-lg backdrop-blur-xl">
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">Weather Details</span>
                {hasAlerts && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" />
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
                  className="h-8 w-8 p-0 hover:bg-gray-100/80 rounded-full transition-all duration-300 hover:scale-110"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 transition-transform duration-300 ${loading ? 'animate-spin' : ''}`} />
                </Button>
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

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <MapPin className="w-3 h-3 animate-pulse" />
              <span className="tracking-wide uppercase">
                {weather.location.name || 'Pattaya, Thailand'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-4 relative z-10 overflow-y-auto h-full">
          {/* Hero Section - Current weather prominently displayed */}
          <div className="text-center p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-2xl">
            <div className="text-5xl font-thin text-gray-900 mb-2 tracking-tight">
              {Math.round(weather.current.temperature)}°
            </div>
            <div className="text-lg text-gray-700 mb-1 font-medium capitalize">
              {weather.current.description}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Feels like {Math.round(weather.current.feelsLike)}°{units === 'metric' ? 'C' : 'F'}
            </div>
            
            {/* Sponsor section - Right below temperature */}
            {isSponsored && (
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50">
                <span className="text-xs text-gray-500">Powered by</span>
                {settings?.sponsorLogo && (
                  <img 
                    src={settings.sponsorLogo} 
                    alt={settings.sponsorName}
                    className="h-4 w-auto"
                  />
                )}
                <span className="text-xs font-semibold text-gray-700">{settings?.sponsorName}</span>
              </div>
            )}
          </div>

          {/* Key metrics in cards - Apple card style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Humidity</div>
                  <div className="text-xl font-semibold text-gray-900">{weather.current.humidity}%</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center">
                  <Wind className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Wind</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Math.round(weather.current.windSpeed)}
                  </div>
                  <div className="text-xs text-gray-500">{units === 'metric' ? 'km/h' : 'mph'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Sun className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">UV Index</div>
                  <div className="text-xl font-semibold text-gray-900">{weather.current.uvIndex}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Visibility</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Math.round(weather.current.visibility / 1000)}
                  </div>
                  <div className="text-xs text-gray-500">km</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Forecast */}
          {weather.hourly && weather.hourly.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Hourly Forecast</h3>
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {weather.hourly.slice(0, 8).map((hour, index) => (
                  <div key={index} className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xs text-gray-500 mb-1">{formatTime(hour.time)}</span>
                    {getWeatherIcon(hour.icon, "w-6 h-6")}
                    <span className="text-sm font-medium text-gray-900 mt-1">{Math.round(hour.temp)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather Alerts */}
          {hasAlerts && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-semibold text-red-900">Weather Alerts</h3>
              </div>
              {weather.alerts?.map((alert, index) => (
                <div key={index} className="text-xs text-red-700 mb-1">
                  <strong>{alert.event}:</strong> {alert.description}
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

