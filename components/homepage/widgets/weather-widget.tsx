"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Cloud, Sun, CloudRain, Wind, Droplets, CloudDrizzle, CloudSnow, Zap, 
  RefreshCw, MapPin, Clock, AlertTriangle, Navigation, Waves, 
  Thermometer, Eye, Gauge, Sunrise, Sunset, X, Target, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { buildApiUrl } from "@/lib/strapi-config"
import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"

interface WeatherData {
  location: {
    name: string
    lat: number
    lon: number
  }
  current: {
    temperature: number
    condition: string
    description: string
    humidity: number
    windSpeed: number
    pressure: number
    visibility: number
    uvIndex: number
    feelsLike: number
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
    condition: string
    description: string
    icon: string
    humidity: number
    windSpeed: number
  }>
  airQuality: {
    index: number
    level: string
    pm25: number
    pm10: number
    o3: number
    no2: number
  } | null
  alerts: Array<{
    event: string
    description: string
    start: string
    end: string
  }>
  marine: {
    tideTimes: Array<{
      type: string
      time: string
    }>
    seaState: string
    waveHeightM: number
  }
  suggestions: Array<{
    title: string
    description: string
    link: string
    icon: string
  }>
  units: string
  lastUpdated: string
  source: string
}

interface WeatherSettings {
  defaultCityName: string
  defaultLatitude: number
  defaultLongitude: number
  units: string
  updateFrequencyMinutes: number
  widgetEnabled: boolean
  sponsoredEnabled: boolean
  sponsorName?: string
  sponsorLogo?: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [settings, setSettings] = useState<WeatherSettings | null>(null)

  // Load weather settings on component mount
  useEffect(() => {
    loadWeatherSettings()
  }, [])

  // Load weather data when component mounts or location changes
  useEffect(() => {
    if (settings) {
      loadWeather()
    }
  }, [settings, userLocation])

  // Refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(loadWeather, 600000)
    return () => clearInterval(interval)
  }, [settings, userLocation])

  const loadWeatherSettings = async () => {
    try {
      const response = await fetch(buildApiUrl("weathers/settings"))
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
      }
    } catch (error) {
      console.error("Failed to load weather settings:", error)
    }
  }

  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        })
      })

      const { latitude, longitude } = position.coords
      setUserLocation({ lat: latitude, lon: longitude })
      setLocationPermission('granted')
      console.log('Location permission granted:', latitude, longitude)
    } catch (error: any) {
      console.error('Location permission denied:', error)
      setLocationPermission('denied')
      setError("Location access denied. Using default location.")
    }
  }, [])

  const loadWeather = async () => {
    if (!settings) return

    try {
      setError(null)
      setLoading(true)

      let apiUrl = buildApiUrl("weathers/current")
      const params = new URLSearchParams()

      if (userLocation) {
        params.append('lat', userLocation.lat.toString())
        params.append('lon', userLocation.lon.toString())
      } else {
        params.append('lat', settings.defaultLatitude.toString())
        params.append('lon', settings.defaultLongitude.toString())
      }
      
      params.append('units', settings.units)
      apiUrl += `?${params.toString()}`

      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const data = await response.json()
        setWeather(data.data)
        setLastRefresh(new Date())
        console.log('Weather data loaded:', data.data.location.name)
      } else {
        throw new Error("Failed to fetch weather data")
      }
    } catch (err) {
      console.error("Weather loading error:", err)
      setError("Unable to load weather data")
      
      // Set fallback data
      setWeather({
        location: {
          name: settings.defaultCityName,
          lat: settings.defaultLatitude,
          lon: settings.defaultLongitude
        },
        current: {
          temperature: 32,
          condition: "broken clouds",
          description: "Broken Clouds",
          humidity: 65,
          windSpeed: 3,
          pressure: 1013,
          visibility: 10,
          uvIndex: 6,
          feelsLike: 39,
          icon: "04d",
          sunrise: new Date().toISOString(),
          sunset: new Date().toISOString()
        },
        hourly: [],
        daily: [],
        airQuality: null,
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
        units: settings.units,
        lastUpdated: new Date().toISOString(),
        source: "OpenWeatherMap"
      })
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition?: string, size: string = "h-12 w-12") => {
    const conditionLower = condition?.toLowerCase() ?? "unknown"

    switch (conditionLower) {
      case "clear":
      case "clear sky":
      case "sunny":
        return <Sun className={`${size} text-amber-500`} />
      case "clouds":
      case "cloudy":
      case "partly cloudy":
      case "few clouds":
      case "scattered clouds":
      case "broken clouds":
        return <Cloud className={`${size} text-gray-400`} />
      case "rain":
      case "light rain":
      case "moderate rain":
      case "shower rain":
        return <CloudRain className={`${size} text-gray-500`} />
      case "drizzle":
      case "light intensity drizzle":
        return <CloudDrizzle className={`${size} text-gray-500`} />
      case "thunderstorm":
        return <Zap className={`${size} text-amber-600`} />
      case "snow":
        return <CloudSnow className={`${size} text-gray-300`} />
      default:
        return <Cloud className={`${size} text-gray-400`} />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    })
  }

  const getAirQualityColor = (aqi: number) => {
    switch (aqi) {
      case 1: return "text-green-600 bg-green-100"
      case 2: return "text-blue-600 bg-blue-100"
      case 3: return "text-yellow-600 bg-yellow-100"
      case 4: return "text-orange-600 bg-orange-100"
      case 5: return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getSeverityColor = (alertEvent: string) => {
    const event = alertEvent.toLowerCase()
    if (event.includes('warning') || event.includes('severe')) return 'text-red-600 bg-red-100 border-red-200'
    if (event.includes('advisory')) return 'text-orange-600 bg-orange-100 border-orange-200'
    return 'text-blue-600 bg-blue-100 border-blue-200'
  }

  if (loading && !weather) {
    return (
      <Card className="top-row-widget bg-white/95 backdrop-blur-xl border-0 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
            </div>
            <div className="w-8 h-4 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gray-100 rounded w-12"></div>
                <div className="h-3 bg-gray-100 rounded w-20"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-8 bg-gray-100 rounded"></div>
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className="top-row-widget bg-white/95 backdrop-blur-xl border-0 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-[15px] font-medium text-gray-900">Weather</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <Cloud className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">Weather unavailable</p>
            <p className="text-[11px] text-gray-400 mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasAlerts = weather.alerts && weather.alerts.length > 0
  const isSevereWeather = hasAlerts && weather.alerts.some(alert => 
    alert.event.toLowerCase().includes('severe') || 
    alert.event.toLowerCase().includes('warning')
  )

  const handleCardClick = () => {
    console.log('Weather card clicked, opening modal...')
    setIsModalOpen(true)
  }

  return (
    <>
      {/* Debug info - remove this later */}
      <div className="fixed top-4 right-4 z-[9999] bg-black text-white p-2 text-xs rounded">
        Modal State: {isModalOpen ? 'OPEN' : 'CLOSED'}
      </div>

      <Card 
        className={`top-row-widget bg-white/95 backdrop-blur-xl border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${
          isSevereWeather ? 'ring-2 ring-red-500 bg-red-50/95' : ''
        }`}
        onClick={handleCardClick}
      >
        {/* Global Sponsorship Banner */}
        <SponsorshipBanner widgetType="weather" />
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-[15px] font-medium text-gray-900">Weather</span>
              {hasAlerts && (
                <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-medium">
                  ⚠️ Alert
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-600 text-[11px] px-2 py-0.5 font-medium border border-blue-200 rounded-full">
                Live
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  loadWeather()
                }} 
                className="h-7 w-7 p-0 hover:bg-gray-100/80 rounded-full transition-colors" 
                disabled={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Location with locate me button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <MapPin className="w-3 h-3" />
              <span className="tracking-wide uppercase">
                {userLocation ? 'Your Location' : weather.location.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                requestLocationPermission()
              }}
              className="h-6 w-6 p-0 hover:bg-gray-100/80 rounded-full transition-colors"
              title={locationPermission === 'granted' ? 'Update location' : 'Locate me'}
            >
              <Target className={`w-3 h-3 ${locationPermission === 'granted' ? 'text-green-600' : 'text-gray-400'}`} />
            </Button>
          </div>

          {/* Severe Weather Alert Banner */}
          {hasAlerts && (
            <div className={`p-3 rounded-lg border ${getSeverityColor(weather.alerts[0].event)}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold">{weather.alerts[0].event}</div>
                  <div className="text-[11px] opacity-80">{weather.alerts[0].description}</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Weather Display */}
          <div className="weather-main">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getWeatherIcon(weather.current.condition)}
                <div className="space-y-1">
                  <div className="temperature text-3xl font-light text-gray-900 tracking-tight">
                    {Math.round(weather.current.temperature)}°
                  </div>
                  <div className="text-[13px] font-medium text-gray-600 capitalize">
                    {weather.current.description}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Feels like {Math.round(weather.current.feelsLike)}°
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg">
              <div className="p-1.5 bg-blue-50 rounded-full">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-gray-900">{weather.current.humidity}%</div>
                <div className="text-[11px] text-gray-500 font-medium">Humidity</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg">
              <div className="p-1.5 bg-gray-50 rounded-full">
                <Wind className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-gray-900">
                  {Math.round(weather.current.windSpeed)} {weather.units === 'metric' ? 'km/h' : 'mph'}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">Wind Speed</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <Clock className="w-3 h-3" />
              <span>Updated {formatTime(lastRefresh)}</span>
            </div>
            {error && (
              <div className="flex items-center gap-1 text-[11px] text-amber-600">
                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                <span className="font-medium">Connection issue</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weather Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        console.log('Modal state changing to:', open)
        setIsModalOpen(open)
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getWeatherIcon(weather.current.condition, "h-8 w-8")}
                <span>Weather Details</span>
              </div>
              {hasAlerts && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                  ⚠️ Weather Alert
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Weather Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-light text-gray-900">
                  {Math.round(weather.current.temperature)}°
                </div>
                <div className="text-sm text-gray-600 capitalize">{weather.current.description}</div>
                <div className="text-xs text-gray-500">Feels like {Math.round(weather.current.feelsLike)}°</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-medium text-gray-900">{weather.location.name}</div>
                <div className="text-sm text-gray-600">
                  {userLocation ? 'Your Current Location' : 'Default Location'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestLocationPermission}
                  className="mt-2 text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  {locationPermission === 'granted' ? 'Update Location' : 'Locate Me'}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Sunrise className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{formatTime(new Date(weather.current.sunrise))}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sunset className="w-4 h-4 text-red-500" />
                  <span className="text-sm">{formatTime(new Date(weather.current.sunset))}</span>
                </div>
              </div>
            </div>

            {/* Severe Weather Alerts */}
            {hasAlerts && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Weather Alerts
                </h3>
                {weather.alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.event)}`}>
                    <div className="font-semibold text-sm">{alert.event}</div>
                    <div className="text-sm mt-1">{alert.description}</div>
                    <div className="text-xs mt-2 opacity-80">
                      {formatTime(new Date(alert.start))} - {formatTime(new Date(alert.end))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hourly Forecast */}
            {weather.hourly.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Hourly Forecast</h3>
                <div className="grid grid-cols-6 gap-3">
                  {weather.hourly.map((hour, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-2">
                        {formatTime(new Date(hour.time))}
                      </div>
                      {getWeatherIcon(hour.icon, "h-8 w-8 mx-auto mb-2")}
                      <div className="text-sm font-medium">{hour.temp}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Forecast */}
            {weather.daily.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">5-Day Forecast</h3>
                <div className="space-y-2">
                  {weather.daily.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getWeatherIcon(day.icon, "h-6 w-6")}
                        <div>
                          <div className="font-medium">{formatDate(day.date)}</div>
                          <div className="text-sm text-gray-600 capitalize">{day.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{day.high}°</div>
                        <div className="text-sm text-gray-500">{day.low}°</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Air Quality */}
            {weather.airQuality && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Air Quality</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-lg font-bold ${getAirQualityColor(weather.airQuality.index)}`}>
                      {weather.airQuality.index}
                    </div>
                    <div className="text-xs text-gray-600">AQI</div>
                    <div className="text-xs font-medium">{weather.airQuality.level}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{weather.airQuality.pm25}</div>
                    <div className="text-xs text-gray-600">PM2.5</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{weather.airQuality.pm10}</div>
                    <div className="text-xs text-gray-600">PM10</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{weather.airQuality.o3}</div>
                    <div className="text-xs text-gray-600">O₃</div>
                  </div>
                </div>
              </div>
            )}

            {/* Marine Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Waves className="w-5 h-5 text-blue-600" />
                Beach & Marine Conditions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Tide Times</h4>
                  {weather.marine.tideTimes.map((tide, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-blue-700">{tide.type} Tide:</span>
                      <span className="font-medium">{formatTime(new Date(tide.time))}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Sea Conditions</h4>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">State:</span>
                      <span className="font-medium">{weather.marine.seaState}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-blue-700">Wave Height:</span>
                      <span className="font-medium">{weather.marine.waveHeightM}m</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">UV Index</h4>
                  <div className="text-2xl font-bold text-orange-600">{weather.current.uvIndex}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {weather.current.uvIndex >= 8 ? 'Very High - Seek shade!' : 
                     weather.current.uvIndex >= 6 ? 'High - Use protection' : 
                     weather.current.uvIndex >= 3 ? 'Moderate' : 'Low'}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Activity Suggestions */}
            {weather.suggestions && weather.suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Smart Suggestions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weather.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <div className="font-medium text-green-900">{suggestion.title}</div>
                      </div>
                      <div className="text-sm text-green-700 mb-2">{suggestion.description}</div>
                      <Button variant="outline" size="sm" className="text-xs">
                        Learn More
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Weather Stats */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Detailed Conditions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Thermometer className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <div className="text-sm font-medium">Pressure</div>
                  <div className="text-xs text-gray-600">{weather.current.pressure} hPa</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-sm font-medium">Visibility</div>
                  <div className="text-xs text-gray-600">{weather.current.visibility} km</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Gauge className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-sm font-medium">Humidity</div>
                  <div className="text-xs text-gray-600">{weather.current.humidity}%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Wind className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                  <div className="text-sm font-medium">Wind</div>
                  <div className="text-xs text-gray-600">
                    {Math.round(weather.current.windSpeed)} {weather.units === 'metric' ? 'km/h' : 'mph'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <Separator />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>Data from {weather.source}</div>
              <div>Last updated: {formatTime(new Date(weather.lastUpdated))}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
