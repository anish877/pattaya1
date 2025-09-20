// "use client"

// import { useState, useEffect } from 'react'
// import { 
//   Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, 
//   Eye, Sunrise, Sunset, AlertTriangle, MapPin, Clock,
//   ChevronDown, ChevronUp, RefreshCw, CloudDrizzle, Zap, CloudSnow,
//   Target, Activity, Waves, Gauge
// } from 'lucide-react'
// import { Card, CardContent, CardHeader } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// import { Separator } from '@/components/ui/separator'
// import { LocateMeButton } from '@/components/location/locate-me-button'
// import { useLocation } from '@/components/location/location-provider'
// import { buildApiUrl } from '@/lib/strapi-config'
// import { SponsorshipBanner } from '@/components/widgets/sponsorship-banner'

// interface WeatherData {
//   location: {
//     name: string
//     lat: number
//     lon: number
//   }
//   current: {
//     temperature: number
//     feelsLike: number
//     condition: string
//     description: string
//     humidity: number
//     windSpeed: number
//     pressure: number
//     visibility: number
//     uvIndex: number
//     icon: string
//     sunrise: string
//     sunset: string
//   }
//   hourly: Array<{
//     time: string
//     temp: number
//     icon: string
//   }>
//   daily: Array<{
//     date: string
//     high: number
//     low: number
//     icon: string
//     description: string
//   }>
//   airQuality?: {
//     index: number
//     level: string
//     pm25: number
//     pm10: number
//   }
//   alerts?: Array<{
//     event: string
//     severity: string
//     start: string
//     end: string
//     description: string
//   }>
//   marine?: {
//     tideTimes?: Array<{
//       type: 'High' | 'Low'
//       time: string
//     }>
//     seaState?: 'Calm' | 'Moderate' | 'Rough'
//     waveHeightM?: number
//   }
//   suggestions?: Array<{
//     title: string
//     description?: string
//     link: string
//     icon: string
//     priority?: boolean // Added for Strapi source indicator
//   }>
//   units: 'metric' | 'imperial'
//   lastUpdated: string
//   source: string
// }

// interface WeatherSettings {
//   defaultCityName: string
//   defaultLatitude: number
//   defaultLongitude: number
//   units: 'metric' | 'imperial'
//   updateFrequencyMinutes: number
//   widgetEnabled: boolean
//   sponsoredEnabled: boolean
//   sponsorName?: string
//   sponsorLogo?: string
// }

// export function EnhancedWeatherWidget() {
//   const { location, units, setUnits } = useLocation()
//   const [weather, setWeather] = useState<WeatherData | null>(null)
//   const [settings, setSettings] = useState<WeatherSettings | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [suggestionsLoading, setSuggestionsLoading] = useState(false)
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     loadSettings()
//   }, [])

//   useEffect(() => {
//     if (settings) {
//       loadWeather()
//     }
//   }, [settings, location])

//   // Refresh weather when units change
//   useEffect(() => {
//     if (weather && settings) {
//       loadWeather()
//     }
//   }, [units])

//   // Fetch suggestions when weather condition changes
//   useEffect(() => {
//     if (weather && weather.current.condition) {
//       fetchWeatherSuggestions(weather.current.condition)
//     }
//   }, [weather?.current.condition])

//   const fetchWeatherSuggestions = async (condition: string) => {
//     try {
//       setSuggestionsLoading(true)
//       const suggestionsResponse = await fetch(buildApiUrl(`weather/suggestions?condition=${condition}`))
//       if (suggestionsResponse.ok) {
//         const suggestionsData = await suggestionsResponse.json()
//         if (suggestionsData.data && suggestionsData.data.length > 0) {
//           // Process and validate suggestions data to ensure consistent structure
//           const processedSuggestions = suggestionsData.data.map((suggestion: any) => ({
//             title: suggestion.title || 'Activity Suggestion',
//             description: suggestion.description || '',
//             link: suggestion.link || '#',
//             icon: suggestion.icon || '💡',
//             priority: suggestion.priority || false
//           }))
          
//           // Update weather with real suggestions from Strapi
//           setWeather(prev => prev ? {
//             ...prev,
//             suggestions: processedSuggestions
//           } : null)
//           return
//         }
//       }
//     } catch (error) {
//       console.warn('Failed to fetch weather suggestions from Strapi:', error)
//     } finally {
//       setSuggestionsLoading(false)
//     }
    
//     // Fallback to intelligent suggestions if Strapi API fails or returns no data
//     if (weather) {
//       const fallbackSuggestions = getFallbackSuggestions(
//         weather.current.condition, 
//         weather.current.temperature, 
//         weather.current.uvIndex
//       )
//       setWeather(prev => prev ? {
//         ...prev,
//         suggestions: fallbackSuggestions
//       } : null)
//     }
//   }

//   const loadSettings = async () => {
//     try {
//       const response = await fetch(buildApiUrl('weather/settings'))
      
//       if (response.ok) {
//         const data = await response.json()
//         setSettings(data.data)
//       } else {
//         // Fallback to default settings if API fails
//         setSettings({
//           defaultCityName: 'Pattaya City',
//           defaultLatitude: 12.9236,
//           defaultLongitude: 100.8825,
//           units: 'metric',
//           updateFrequencyMinutes: 30,
//           widgetEnabled: true,
//           sponsoredEnabled: false
//         })
//       }
//     } catch (error) {
//       console.error('Failed to load weather settings:', error)
//       // Fallback to default settings
//       setSettings({
//         defaultCityName: 'Pattaya City',
//         defaultLatitude: 12.9236,
//         defaultLongitude: 100.8825,
//         units: 'metric',
//         updateFrequencyMinutes: 30,
//         widgetEnabled: true,
//         sponsoredEnabled: false
//       })
//     }
//   }

//   const loadWeather = async () => {
//     try {
//       setLoading(true)
//       setError(null)
      
//       // Determine coordinates to use
//       const lat = location?.lat || settings?.defaultLatitude || 12.9236
//       const lon = location?.lon || settings?.defaultLongitude || 100.8825
//       const currentUnits = units || settings?.units || 'metric'
      
//       // Build API URL with parameters
//       const apiUrl = buildApiUrl(`weather/current?lat=${lat}&lon=${lon}&units=${currentUnits}`)
      
//       console.log('🌤️ Fetching weather from:', apiUrl)
      
//       // Test if Strapi server is running
//       try {
//         const healthCheck = await fetch(buildApiUrl(''), { method: 'HEAD' })
//         console.log('🔍 Strapi server status:', healthCheck.status)
//       } catch (healthError) {
//         console.error('🚨 Strapi server appears to be down:', healthError)
//         throw new Error('Weather service is currently unavailable. Please check if the server is running.')
//       }
      
//       const response = await fetch(apiUrl)
      
//       if (!response.ok) {
//         // Try to get more detailed error information
//         let errorMessage = `Weather API error: ${response.status} ${response.statusText}`
//         try {
//           const errorData = await response.text()
//           console.error('Weather API error details:', errorData)
//           errorMessage += ` - ${errorData}`
//         } catch (e) {
//           console.error('Could not parse error response:', e)
//         }
//         throw new Error(errorMessage)
//       }
      
//       const data = await response.json()
      
//       if (data.data) {
//         console.log('✅ Weather data received:', data.data)
        
//         // Validate and normalize the weather data structure
//         const validatedWeather = validateWeatherData(data.data)
//         setWeather(validatedWeather)
//       } else {
//         throw new Error('Invalid weather data format')
//       }
      
//     } catch (error) {
//       console.error('Weather loading error:', error)
      
//       // Provide specific error messages based on the error type
//       let errorMessage = 'Unable to load weather data'
//       const errorMsg = error instanceof Error ? error.message : String(error)
//       if (errorMsg.includes('Weather service is currently unavailable')) {
//         errorMessage = 'Weather service is currently unavailable. Please check if the server is running.'
//       } else if (errorMsg.includes('500')) {
//         errorMessage = 'Weather API configuration error. Please check server logs for details.'
//       } else if (errorMsg.includes('OpenWeatherMap API key not configured')) {
//         errorMessage = 'Weather API key not configured. Please contact administrator.'
//       }
      
//       setError(errorMessage)
      
//       // Set fallback weather data for better UX
//       const currentUnits = units || settings?.units || 'metric'
//       const fallbackWeatherData = {
//         location: {
//           name: 'Pattaya, Thailand',
//           lat: 12.9236,
//           lon: 100.8825
//         },
//         current: {
//           temperature: 32,
//           feelsLike: 39,
//           condition: 'broken clouds',
//           description: 'Broken Clouds',
//           humidity: 65,
//           windSpeed: 3,
//           pressure: 1013,
//           visibility: 10,
//           uvIndex: 6,
//           icon: '04d',
//           sunrise: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//           sunset: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
//         },
//         hourly: [
//           { time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), temp: 31, icon: '04d' },
//           { time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), temp: 30, icon: '04d' },
//           { time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), temp: 29, icon: '01n' },
//           { time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), temp: 28, icon: '01n' }
//         ],
//         daily: [
//           { date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), high: 33, low: 26, icon: '01d', description: 'clear sky' },
//           { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), high: 32, low: 25, icon: '02d', description: 'few clouds' },
//           { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), high: 31, low: 24, icon: '03d', description: 'scattered clouds' }
//         ],
//         airQuality: {
//           index: 2,
//           level: 'Fair',
//           pm25: 15,
//           pm10: 25
//         },
//         alerts: [],
//         marine: {
//           tideTimes: [
//             { type: 'High', time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() },
//             { type: 'Low', time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() }
//           ],
//           seaState: 'Moderate',
//           waveHeightM: 0.8
//         },
//         suggestions: [],
//         units: currentUnits,
//         lastUpdated: new Date().toISOString(),
//         source: 'Fallback Data'
//       }
      
//       // Validate and normalize the fallback data
//       const validatedFallbackWeather = validateWeatherData(fallbackWeatherData)
//       setWeather(validatedFallbackWeather)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Validate and normalize weather data structure
//   const validateWeatherData = (data: any): WeatherData => {
//     return {
//       location: {
//         name: data.location?.name || 'Unknown Location',
//         lat: data.location?.lat || 12.9236,
//         lon: data.location?.lon || 100.8825
//       },
//       current: {
//         temperature: data.current?.temperature || 0,
//         feelsLike: data.current?.feelsLike || 0,
//         condition: data.current?.condition || 'unknown',
//         description: data.current?.description || 'Unknown',
//         humidity: data.current?.humidity || 0,
//         windSpeed: data.current?.windSpeed || 0,
//         pressure: data.current?.pressure || 0,
//         visibility: data.current?.visibility || 0,
//         uvIndex: data.current?.uvIndex || 0,
//         icon: data.current?.icon || '01d',
//         sunrise: data.current?.sunrise || new Date().toISOString(),
//         sunset: data.current?.sunset || new Date().toISOString()
//       },
//       hourly: data.hourly || [],
//       daily: data.daily || [],
//       airQuality: data.airQuality || null,
//       alerts: data.alerts || [],
//       marine: data.marine || null,
//       suggestions: data.suggestions ? data.suggestions.map((suggestion: any) => ({
//         title: suggestion.title || 'Activity Suggestion',
//         description: suggestion.description || '',
//         link: suggestion.link || '#',
//         icon: suggestion.icon || '💡',
//         priority: suggestion.priority || false
//       })) : [],
//       units: data.units || 'metric',
//       lastUpdated: data.lastUpdated || new Date().toISOString(),
//       source: data.source || 'Unknown'
//     }
//   }

//   // Fallback suggestions based on weather conditions and temperature
//   const getFallbackSuggestions = (condition: string, temperature: number, uvIndex: number) => {
//     const suggestions = []
    
//     // Temperature-based suggestions
//     if (temperature >= 30) {
//       suggestions.push({
//         title: 'Stay Hydrated!',
//         description: 'High temperature - drink plenty of water and seek shade',
//         link: '/safety',
//         icon: '💧',
//         priority: true
//       })
//     } else if (temperature >= 25) {
//       suggestions.push({
//         title: 'Perfect Outdoor Weather!',
//         description: 'Great temperature for outdoor activities and beach visits',
//         link: '/beaches',
//         icon: '🏖️',
//         priority: false
//       })
//     } else if (temperature < 20) {
//       suggestions.push({
//         title: 'Bring a Jacket',
//         description: 'Cooler weather - consider bringing warm clothing',
//         link: '/travel',
//         icon: '🧥',
//         priority: false
//       })
//     }
    
//     // UV Index suggestions
//     if (uvIndex >= 8) {
//       suggestions.push({
//         title: 'High UV Protection Needed',
//         description: 'Very high UV index - use sunscreen SPF 50+ and seek shade',
//         link: '/safety',
//         icon: '☀️',
//         priority: true
//       })
//     } else if (uvIndex >= 6) {
//       suggestions.push({
//         title: 'UV Protection Recommended',
//         description: 'High UV index - use sunscreen and limit sun exposure',
//         link: '/safety',
//         icon: '🕶️',
//         priority: false
//       })
//     }
    
//     // Weather condition-based suggestions
//     if (condition.includes('rain') || condition.includes('drizzle')) {
//       suggestions.push({
//         title: 'Indoor Activities',
//         description: 'Rainy weather - perfect for indoor shopping and dining',
//         link: '/shopping',
//         icon: '🛍️',
//         priority: false
//       })
//     } else if (condition.includes('clear') || condition.includes('sun')) {
//       suggestions.push({
//         title: 'Beach Day!',
//         description: 'Clear skies - perfect for beach activities and water sports',
//         link: '/beaches',
//         icon: '🏄‍♂️',
//         priority: false
//       })
//     } else if (condition.includes('cloud')) {
//       suggestions.push({
//         title: 'Comfortable Outdoor Time',
//         description: 'Cloudy weather - great for outdoor activities without intense sun',
//         link: '/outdoor',
//         icon: '🌤️',
//         priority: false
//       })
//     }
    
//     return suggestions.slice(0, 4) // Return max 4 suggestions
//   }

//   const getWeatherIcon = (condition: string, size = 'h-12 w-12') => {
//     const conditionLower = condition.toLowerCase()
    
//     if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
//       return (
//         <div className="relative group">
//           <Sun className={`${size} text-amber-500 animate-pulse group-hover:animate-spin transition-all duration-700`} />
//           <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping group-hover:animate-bounce"></div>
//           <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-bounce delay-300 group-hover:animate-ping"></div>
//           <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-300 rounded-full animate-pulse delay-500 group-hover:animate-bounce"></div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-yellow-200/30 to-orange-200/30 rounded-full animate-pulse group-hover:scale-150 transition-all duration-1000"></div>
//         </div>
//       )
//     } else if (conditionLower.includes('cloud')) {
//       return (
//         <div className="relative group">
//           <Cloud className={`${size} text-gray-400 animate-bounce group-hover:animate-pulse transition-all duration-700`} />
//           <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-300 rounded-full animate-pulse group-hover:animate-bounce delay-100"></div>
//           <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gray-300 rounded-full animate-pulse group-hover:animate-bounce delay-300"></div>
//           <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-200 rounded-full animate-bounce group-hover:animate-ping delay-200"></div>
//           <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 w-1.5 h-1.5 bg-blue-100 rounded-full animate-pulse group-hover:animate-bounce delay-400"></div>
//           <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
//         </div>
//       )
//     } else if (conditionLower.includes('rain')) {
//       return (
//         <div className="relative group">
//           <CloudRain className={`${size} text-blue-500 animate-bounce group-hover:animate-pulse transition-all duration-700`} />
//           <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
//             <div className="flex space-x-1">
//               <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce group-hover:animate-ping delay-75"></div>
//               <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce group-hover:animate-ping delay-150"></div>
//               <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce group-hover:animate-ping delay-225"></div>
//             </div>
//           </div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full animate-pulse group-hover:scale-150 transition-all duration-1000"></div>
//           <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-200 rounded-full animate-bounce group-hover:animate-ping delay-100"></div>
//         </div>
//       )
//     } else if (conditionLower.includes('thunder')) {
//       return (
//         <div className="relative group">
//           <Zap className={`${size} text-yellow-600 animate-pulse group-hover:animate-bounce transition-all duration-700`} />
//           <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping group-hover:animate-pulse"></div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-yellow-200/40 to-orange-200/40 rounded-full animate-pulse group-hover:scale-150 transition-all duration-1000"></div>
//           <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full animate-bounce group-hover:animate-ping delay-200"></div>
//           <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-300 rounded-full animate-pulse group-hover:animate-bounce delay-400"></div>
//         </div>
//       )
//     } else if (conditionLower.includes('drizzle')) {
//       return (
//         <div className="relative group">
//           <CloudDrizzle className={`${size} text-gray-500 animate-bounce group-hover:animate-pulse transition-all duration-700`} />
//           <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
//             <div className="flex space-x-1">
//               <div className="w-0.5 h-2 bg-gray-400 rounded-full animate-bounce group-hover:animate-ping delay-100"></div>
//               <div className="w-0.5 h-1.5 bg-gray-400 rounded-full animate-bounce group-hover:animate-ping delay-200"></div>
//             </div>
//           </div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-gray-200/30 to-blue-200/30 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
//         </div>
//       )
//     } else if (conditionLower.includes('snow')) {
//       return (
//         <div className="relative group">
//           <CloudSnow className={`${size} text-gray-300 animate-bounce group-hover:animate-pulse transition-all duration-700`} />
//           <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
//             <div className="flex space-x-1">
//               <div className="w-1 h-1 bg-white rounded-full animate-ping group-hover:animate-bounce delay-75"></div>
//               <div className="w-1 h-1 bg-white rounded-full animate-ping group-hover:animate-bounce delay-150"></div>
//             </div>
//           </div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-white/30 to-blue-100/30 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
//           <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-bounce group-hover:animate-ping delay-100"></div>
//         </div>
//       )
//     } else {
//       return (
//         <div className="relative group">
//           <Cloud className={`${size} text-gray-400 animate-pulse group-hover:animate-bounce transition-all duration-700`} />
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-gray-200/30 to-blue-200/30 rounded-full animate-pulse group-hover:scale-125 transition-all duration-1000"></div>
//         </div>
//       )
//     }
//   }

//   const getAirQualityColor = (index: number) => {
//     if (index <= 2) return 'bg-green-100 text-green-800 border-green-200'
//     if (index <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
//     if (index <= 4) return 'bg-orange-100 text-orange-800 border-orange-200'
//     return 'bg-red-100 text-red-800 border-red-200'
//   }

//   const getSeaStateColor = (state: string) => {
//     switch (state) {
//       case 'Calm': return 'bg-blue-100 text-blue-800 border-blue-200'
//       case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
//       case 'Rough': return 'bg-red-100 text-red-800 border-red-200'
//       default: return 'bg-gray-100 text-gray-800 border-gray-200'
//     }
//   }

//   const formatTime = (timeString: string) => {
//     return new Date(timeString).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: false
//     })
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric'
//     })
//   }

//   if (!settings?.widgetEnabled) {
//     return null
//   }

//   if (loading) {
//     return (
//       <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-sm overflow-hidden">
//         <CardContent className="p-6">
//           <div className="animate-pulse space-y-4">
//             <div className="flex items-center justify-between">
//               <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
//               <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
//             </div>
//             <div className="flex items-center gap-4">
//               <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
//               <div className="space-y-2">
//                 <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 animate-pulse"></div>
//                 <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse"></div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   if (!weather) {
//     return (
//       <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-sm">
//         <CardContent className="p-6 text-center">
//           <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
//           <p className="text-sm font-medium text-gray-500">Weather unavailable</p>
//           <Button onClick={loadWeather} variant="outline" size="sm" className="mt-3 hover:bg-gray-50 transition-colors">
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Retry
//           </Button>
//         </CardContent>
//       </Card>
//     )
//   }

//   const hasAlerts = weather.alerts && weather.alerts.length > 0
//   const isSponsored = settings.sponsoredEnabled && settings.sponsorName

//   return (
//     <>
//       <Card
//         className={`group transition-all duration-700 ease-out hover:shadow-2xl hover:scale-[1.02] cursor-pointer overflow-hidden h-full min-h-[400px] ${
//           hasAlerts 
//             ? 'bg-gradient-to-br from-red-500/10 via-red-400/20 to-red-600/10 border-red-300/50 shadow-lg' 
//             : 'bg-gradient-to-br from-blue-500/10 via-indigo-500/15 to-purple-500/10 border-blue-200/50 shadow-lg'
//         } shadow-xl backdrop-blur-xl relative flex flex-col`}
//         onClick={() => setIsModalOpen(true)}
//       >
//         {/* Global Sponsorship Banner */}
//         <SponsorshipBanner widgetType="weather" />
        
//         {/* Vibrant animated background with Lucide icons */}
//         <div className="absolute inset-0 overflow-hidden">
//           {/* Primary gradient overlay */}
//           <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-500/8 to-purple-600/5 animate-pulse"></div>
          
//           {/* Floating animated icons */}
//           <div className="absolute top-4 right-4 opacity-20">
//             <Cloud className="w-8 h-8 text-blue-400 animate-bounce delay-100" />
//           </div>
//           <div className="absolute top-8 left-6 opacity-15">
//             <Sun className="w-6 h-6 text-yellow-400 animate-spin" style={{animationDuration: '8s'}} />
//           </div>
//           <div className="absolute bottom-6 right-8 opacity-20">
//             <Wind className="w-7 h-7 text-cyan-400 animate-pulse delay-300" />
//           </div>
//           <div className="absolute bottom-4 left-4 opacity-15">
//             <Droplets className="w-5 h-5 text-blue-300 animate-bounce delay-500" />
//           </div>
//           <div className="absolute top-1/2 left-2 opacity-10">
//             <Thermometer className="w-6 h-6 text-red-400 animate-pulse delay-700" />
//           </div>
//           <div className="absolute top-1/3 right-2 opacity-15">
//             <Eye className="w-5 h-5 text-green-400 animate-bounce delay-900" />
//           </div>
          
//           {/* Geometric shapes with gradients */}
//           <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full animate-pulse"></div>
//           <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full animate-pulse delay-300"></div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full animate-pulse delay-500"></div>
          
//           {/* Subtle grid pattern */}
//           <div className="absolute inset-0 opacity-5" style={{
//             backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
//             backgroundSize: '20px 20px'
//           }}></div>
          
//           {/* Animated border glow */}
//           <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-indigo-400/20 animate-pulse opacity-50"></div>
//         </div>

//         <CardHeader className="pb-4 relative z-10 flex-shrink-0">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="relative">
//                 <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
//                 <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-ping opacity-75"></div>
//               </div>
//               <span className="text-sm font-semibold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                 Weather
//               </span>
//               {hasAlerts && (
//                 <Badge variant="destructive" className="ml-2 animate-pulse bg-gradient-to-r from-red-500 to-red-600 border-red-400">
//                   <AlertTriangle className="w-3 h-3 mr-1 animate-bounce" />
//                   Alert
//                 </Badge>
//               )}
//             </div>
//             <div className="flex items-center gap-2">
//               <div onClick={(e) => e.stopPropagation()}>
//                 <LocateMeButton />
//               </div>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={(e) => {
//                   e.stopPropagation()
//                   loadWeather()
//                 }}
//                 className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-indigo-100/80 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
//                 disabled={loading}
//               >
//                 <RefreshCw className={`w-4 h-4 transition-transform duration-300 text-blue-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
//               </Button>
//             </div>
//           </div>

//           {/* Location */}
//           <div className="flex items-center gap-2 text-xs font-medium">
//             <div className="relative">
//               <MapPin className="w-3 h-3 text-blue-500 animate-pulse" />
//               <div className="absolute inset-0 w-3 h-3 text-blue-400 animate-ping opacity-50"></div>
//             </div>
//             <span className="tracking-wide uppercase bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
//               {weather.location.name || 'Pattaya, Thailand'}
//             </span>
//           </div>

//           {/* Sponsor Badge */}
//           {isSponsored && (
//             <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
//               <span className="text-xs text-blue-600 font-medium">Sponsored by</span>
//               {settings.sponsorLogo && (
//                 <img 
//                   src={settings.sponsorLogo} 
//                   alt={settings.sponsorName}
//                   className="h-4 w-auto"
//                 />
//               )}
//               <span className="text-xs font-semibold text-blue-900">{settings.sponsorName}</span>
//             </div>
//           )}
//         </CardHeader>

//         <CardContent className="pt-0 relative z-10 flex flex-col flex-1 justify-between">
//           {/* Main Content Area */}
//           <div className="flex flex-col space-y-4 flex-1">
//             {/* Main Weather Display - Enhanced with vibrant styling */}
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4 flex-1">
//                 <div className="transform hover:scale-110 transition-transform duration-300 flex-shrink-0 relative">
//                   {getWeatherIcon(weather.current.condition)}
//                   {/* Glow effect around weather icon */}
//                   <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-lg animate-pulse"></div>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="text-4xl sm:text-5xl font-light bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-500">
//                     {Math.round(weather.current.temperature)}°{units === 'metric' ? 'C' : 'F'}
//                   </div>
//                   <div className="text-sm font-semibold text-gray-700 capitalize group-hover:text-blue-700 transition-colors duration-500 truncate">
//                     {weather.current.description}
//                   </div>
//                   <div className="text-xs text-gray-500 font-medium group-hover:text-indigo-600 transition-colors duration-500">
//                     Feels like {Math.round(weather.current.feelsLike)}°{units === 'metric' ? 'C' : 'F'}
//                   </div>
//                 </div>
//               </div>

//               {/* Units Toggle - Enhanced */}
//               <div className="flex items-center gap-1 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm rounded-lg p-1 border border-blue-200/50 flex-shrink-0 shadow-sm">
//                 <Button
//                   variant={units === 'metric' ? 'default' : 'ghost'}
//                   size="sm"
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     setUnits('metric')
//                   }}
//                   className={`h-6 px-2 text-xs transition-all duration-300 hover:scale-105 ${
//                     units === 'metric' 
//                       ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
//                       : 'hover:bg-blue-200/50 text-blue-700'
//                   }`}
//                 >
//                   °C
//                 </Button>
//                 <Button
//                   variant={units === 'imperial' ? 'default' : 'ghost'}
//                   size="sm"
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     setUnits('imperial')
//                   }}
//                   className={`h-6 px-2 text-xs transition-all duration-300 hover:scale-105 ${
//                     units === 'imperial' 
//                       ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
//                       : 'hover:bg-blue-200/50 text-blue-700'
//                   }`}
//                 >
//                   °F
//                 </Button>
//               </div>
//             </div>

//             {/* Weather Details - Enhanced vibrant grid with better height utilization */}
//             <div className="grid grid-cols-2 gap-3 flex-1">
//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-100/60 to-cyan-100/40 backdrop-blur-sm rounded-xl border border-blue-300/40 hover:from-blue-200/60 hover:to-cyan-200/40 transition-all duration-300 hover:scale-105 group shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-blue-200/60 to-cyan-200/60 rounded-full group-hover:from-blue-300/60 group-hover:to-cyan-300/60 transition-all duration-300 flex-shrink-0">
//                   <Droplets className="w-4 h-4 text-blue-700 animate-pulse" />
//                   <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping opacity-50"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{weather.current.humidity}%</div>
//                   <div className="text-xs text-gray-600 font-semibold group-hover:text-blue-700 transition-colors duration-300">Humidity</div>
//                 </div>
//               </div>
              
//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-100/60 to-teal-100/40 backdrop-blur-sm rounded-xl border border-cyan-300/40 hover:from-cyan-200/60 hover:to-teal-200/40 transition-all duration-300 hover:scale-105 group shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-cyan-200/60 to-teal-200/60 rounded-full group-hover:from-cyan-300/60 group-hover:to-teal-300/60 transition-all duration-300 flex-shrink-0">
//                   <Wind className="w-4 h-4 text-cyan-700 animate-bounce" />
//                   <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping opacity-50 delay-100"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-sm font-bold text-gray-900 group-hover:text-cyan-900 transition-colors duration-300">
//                     {Math.round(weather.current.windSpeed)} {units === 'metric' ? 'km/h' : 'mph'}
//                   </div>
//                   <div className="text-xs text-gray-600 font-semibold group-hover:text-cyan-700 transition-colors duration-300">Wind</div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-100/60 to-indigo-100/40 backdrop-blur-sm rounded-xl border border-purple-300/40 hover:from-purple-200/60 hover:to-indigo-200/40 transition-all duration-300 hover:scale-105 group shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-purple-200/60 to-indigo-200/60 rounded-full group-hover:from-purple-300/60 group-hover:to-indigo-300/60 transition-all duration-300 flex-shrink-0">
//                   <Gauge className="w-4 h-4 text-purple-700 animate-pulse delay-200" />
//                   <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping opacity-50 delay-200"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-sm font-bold text-gray-900 group-hover:text-purple-900 transition-colors duration-300">{weather.current.pressure} hPa</div>
//                   <div className="text-xs text-gray-600 font-semibold group-hover:text-purple-700 transition-colors duration-300">Pressure</div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-100/60 to-emerald-100/40 backdrop-blur-sm rounded-xl border border-green-300/40 hover:from-green-200/60 hover:to-emerald-200/40 transition-all duration-300 hover:scale-105 group shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-green-200/60 to-emerald-200/60 rounded-full group-hover:from-green-300/60 group-hover:to-emerald-300/60 transition-all duration-300 flex-shrink-0">
//                   <Eye className="w-4 h-4 text-green-700 animate-bounce delay-300" />
//                   <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping opacity-50 delay-300"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-sm font-bold text-gray-900 group-hover:text-green-900 transition-colors duration-300">{weather.current.visibility} km</div>
//                   <div className="text-xs text-gray-600 font-semibold group-hover:text-green-700 transition-colors duration-300">Visibility</div>
//                 </div>
//               </div>
//             </div>

//             {/* UV Index & Air Quality - Enhanced vibrant row */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-100/60 to-amber-100/40 backdrop-blur-sm rounded-xl border border-yellow-300/40 shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-yellow-200/60 to-amber-200/60 rounded-full flex-shrink-0">
//                   <Sun className="w-4 h-4 text-yellow-700 animate-spin" style={{animationDuration: '10s'}} />
//                   <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping opacity-50"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-xs text-gray-600 font-semibold">UV Index</div>
//                   <div className="text-sm font-bold text-gray-900">{weather.current.uvIndex}</div>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-100/60 to-green-100/40 backdrop-blur-sm rounded-xl border border-emerald-300/40 shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-emerald-200/60 to-green-200/60 rounded-full flex-shrink-0">
//                   <Activity className="w-4 h-4 text-emerald-700 animate-pulse" />
//                   <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping opacity-50 delay-200"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-xs text-gray-600 font-semibold">Air Quality</div>
//                   <div className="text-sm font-bold text-gray-900">
//                     {weather.airQuality ? weather.airQuality.level : 'Good'}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Sunrise/Sunset - Enhanced vibrant display */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-100/60 to-yellow-100/40 backdrop-blur-sm rounded-xl border border-orange-300/40 shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-orange-200/60 to-yellow-200/60 rounded-full flex-shrink-0">
//                   <Sunrise className="w-4 h-4 text-orange-700 animate-bounce" />
//                   <div className="absolute inset-0 bg-orange-400/20 rounded-full animate-ping opacity-50 delay-100"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-xs text-gray-600 font-semibold">Sunrise</div>
//                   <div className="text-sm font-bold text-gray-900">{formatTime(weather.current.sunrise)}</div>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-100/60 to-pink-100/40 backdrop-blur-sm rounded-xl border border-red-300/40 shadow-sm">
//                 <div className="relative p-2 bg-gradient-to-r from-red-200/60 to-pink-200/60 rounded-full flex-shrink-0">
//                   <Sunset className="w-4 h-4 text-red-700 animate-bounce delay-300" />
//                   <div className="absolute inset-0 bg-red-400/20 rounded-full animate-ping opacity-50 delay-300"></div>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="text-xs text-gray-600 font-semibold">Sunset</div>
//                   <div className="text-sm font-bold text-gray-900">{formatTime(weather.current.sunset)}</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer - Enhanced */}
//           <div className="flex items-center justify-between pt-4 border-t border-gradient-to-r from-blue-200/30 to-purple-200/30 flex-shrink-0">
//             <div className="flex items-center gap-2 text-xs font-semibold">
//               <div className="relative">
//                 <Clock className="w-3 h-3 text-blue-500 animate-pulse" />
//                 <div className="absolute inset-0 w-3 h-3 text-blue-400 animate-ping opacity-50"></div>
//               </div>
//               <span className="bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
//                 Updated {formatTime(weather.lastUpdated)}
//               </span>
//               {weather.source !== 'Fallback Data' && (
//                 <span className="text-green-600 font-bold animate-pulse">• Live</span>
//               )}
//             </div>
//             {error && (
//               <div className="flex items-center gap-2 text-xs text-amber-600">
//                 <div className="relative">
//                   <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
//                   <span className="absolute inset-0 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-50"></span>
//                 </div>
//                 <span className="font-semibold">Connection issue</span>
//               </div>
//             )}
//             {weather.source === 'Fallback Data' && (
//               <div className="flex items-center gap-2 text-xs text-orange-600">
//                 <div className="relative">
//                   <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
//                   <span className="absolute inset-0 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-50"></span>
//                 </div>
//                 <span className="font-semibold">Offline mode</span>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Weather Modal - Apple Design Inspired */}
//       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//         <DialogContent className="max-w-4xl max-h-[75vh] overflow-hidden bg-white/95 backdrop-blur-2xl border-0 shadow-2xl rounded-3xl">
//           {/* Header - Clean and minimal */}
//           <DialogHeader className="px-6 pt-6 pb-0">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center gap-4">
//                 <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-2xl flex items-center justify-center">
//                   {getWeatherIcon(weather.current.condition, "h-8 w-8")}
//                 </div>
//                 <div>
//                   <DialogTitle className="text-2xl font-semibold text-gray-900 mb-1">
//                     {weather.location.name}
//                   </DialogTitle>
//                   <p className="text-sm text-gray-500">
//                     {formatTime(weather.lastUpdated)} • {weather.source}
//                   </p>
//                 </div>
//               </div>
              
//               {/* Alert badge - minimal */}
//               {hasAlerts && (
//                 <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-full">
//                   <span className="text-sm font-medium text-red-700">Weather Alert</span>
//                 </div>
//               )}
//             </div>
//           </DialogHeader>

//           {/* Main content - Single scroll area */}
//           <div className="px-6 pb-6 overflow-y-auto max-h-[calc(75vh-120px)]">
            
//             {/* Hero Section - Current weather prominently displayed */}
//             <div className="text-center mb-6 p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-2xl">
//               <div className="text-7xl font-thin text-gray-900 mb-2 tracking-tight">
//                 {Math.round(weather.current.temperature)}°
//               </div>
//               <div className="text-xl text-gray-700 mb-1 font-medium capitalize">
//                 {weather.current.description}
//               </div>
//               <div className="text-base text-gray-500 mb-4">
//                 Feels like {Math.round(weather.current.feelsLike)}°{units === 'metric' ? 'C' : 'F'}
//               </div>
              
//               {/* Sponsor section - Right below temperature */}
//               {isSponsored && (
//                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50">
//                   <span className="text-xs text-gray-500">Powered by</span>
//                   {settings.sponsorLogo && (
//                     <img 
//                       src={settings.sponsorLogo} 
//                       alt={settings.sponsorName}
//                       className="h-4 w-auto"
//                     />
//                   )}
//                   <span className="text-xs font-semibold text-gray-700">{settings.sponsorName}</span>
//                 </div>
//               )}
//             </div>

//             {/* Key metrics in cards - Apple card style */}
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//               <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
//                     <Droplets className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Humidity</div>
//                     <div className="text-2xl font-semibold text-gray-900">{weather.current.humidity}%</div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
//                     <Wind className="w-5 h-5 text-gray-600" />
//                   </div>
//                   <div>
//                     <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Wind</div>
//                     <div className="text-2xl font-semibold text-gray-900">
//                       {Math.round(weather.current.windSpeed)}
//                     </div>
//                     <div className="text-xs text-gray-500">{units === 'metric' ? 'km/h' : 'mph'}</div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
//                     <Sun className="w-5 h-5 text-orange-500" />
//                   </div>
//                   <div>
//                     <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">UV Index</div>
//                     <div className="text-2xl font-semibold text-gray-900">{weather.current.uvIndex}</div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
//                     <Eye className="w-5 h-5 text-purple-600" />
//                   </div>
//                   <div>
//                     <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Visibility</div>
//                     <div className="text-2xl font-semibold text-gray-900">{weather.current.visibility}</div>
//                     <div className="text-xs text-gray-500">km</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Hourly Forecast - Horizontal scroll */}
//             {weather.hourly.length > 0 && (
//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Next 24 Hours</h3>
//                 <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
//                   {weather.hourly.map((hour, index) => (
//                     <div key={index} className="flex-shrink-0 text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 min-w-[80px] group hover:scale-110 transition-all duration-300 relative overflow-hidden">
//                       {/* Cute time indicators */}
//                       <div className="absolute top-1 right-1 text-xs animate-pulse delay-100">🕐</div>
//                       <div className="absolute bottom-1 left-1 text-xs animate-bounce delay-300">⏰</div>
                      
//                       <div className="text-sm text-gray-500 mb-3 font-medium group-hover:text-blue-600 transition-colors duration-300">
//                         {formatTime(hour.time)}
//                       </div>
//                       <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
//                         {getWeatherIcon(hour.icon, "h-8 w-8 mx-auto")}
//                       </div>
//                       <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{hour.temp}°</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Daily Forecast - Compact list */}
//             {weather.daily.length > 0 && (
//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <span className="text-2xl animate-pulse">📅</span>
//                   5-Day Forecast
//                   <span className="text-xl animate-bounce delay-200">🗓️</span>
//                 </h3>
//                 <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
//                   {weather.daily.map((day, index) => (
//                     <div key={index} className={`flex items-center justify-between p-4 group hover:bg-gray-50/50 transition-all duration-300 ${index !== weather.daily.length - 1 ? 'border-b border-gray-200/30' : ''}`}>
//                       {/* Cute day indicators */}
//                       <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs animate-pulse delay-100">
//                         {index === 0 ? '🌟' : '⭐'}
//                       </div>
                      
//                       <div className="flex items-center gap-4 flex-1">
//                         <div className="w-12 text-left">
//                           <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
//                             {index === 0 ? 'Today' : formatDate(day.date)}
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-3 flex-1">
//                           <div className="transform group-hover:scale-110 transition-transform duration-300">
//                             {getWeatherIcon(day.icon, "h-6 w-6")}
//                           </div>
//                           <div className="text-sm text-gray-600 capitalize group-hover:text-gray-800 transition-colors duration-300">{day.description}</div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-3">
//                         <span className="text-sm text-gray-500 w-8 text-right group-hover:text-blue-500 transition-colors duration-300">{day.low}°</span>
//                         <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
//                           <div className="h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full group-hover:from-blue-500 group-hover:to-red-500 transition-all duration-300" style={{width: '60%'}}></div>
//                         </div>
//                         <span className="text-sm font-semibold text-gray-900 w-8 group-hover:text-red-600 transition-colors duration-300">{day.high}°</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Additional Info - Clean sections */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
//               {/* Sun & Air Quality */}
//               <div className="space-y-4">
//                 {/* Sun times */}
//                 <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 group hover:scale-105 transition-all duration-300 relative overflow-hidden">
//                   {/* Cute sun animations */}
//                   <div className="absolute top-2 right-2 text-lg animate-ping delay-100">🌅</div>
//                   <div className="absolute bottom-2 left-2 text-sm animate-bounce delay-300">🌇</div>
                  
//                   <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <span className="text-xl animate-pulse">☀️</span>
//                     Sun
//                     <span className="text-lg animate-bounce delay-200">🌞</span>
//                   </h4>
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between group/item hover:bg-orange-50/50 p-2 rounded-lg transition-all duration-300">
//                       <div className="flex items-center gap-3">
//                         <Sunrise className="w-5 h-5 text-orange-500 animate-pulse group-hover/item:animate-bounce" />
//                         <span className="text-sm text-gray-600 group-hover/item:text-orange-600 transition-colors duration-300">Sunrise</span>
//                       </div>
//                       <span className="text-sm font-semibold text-gray-900 group-hover/item:text-orange-700 transition-colors duration-300">{formatTime(weather.current.sunrise)}</span>
//                     </div>
//                     <div className="flex items-center justify-between group/item hover:bg-red-50/50 p-2 rounded-lg transition-all duration-300">
//                       <div className="flex items-center gap-3">
//                         <Sunset className="w-5 h-5 text-red-500 animate-pulse group-hover/item:animate-bounce" />
//                         <span className="text-sm text-gray-600 group-hover/item:text-red-600 transition-colors duration-300">Sunset</span>
//                       </div>
//                       <span className="text-sm font-semibold text-gray-900 group-hover/item:text-red-700 transition-colors duration-300">{formatTime(weather.current.sunset)}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Air Quality */}
//                 {weather.airQuality && (
//                   <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
//                     <h4 className="text-base font-semibold text-gray-900 mb-4">Air Quality</h4>
//                     <div className="flex items-center justify-between mb-4">
//                       <span className="text-sm text-gray-600">AQI</span>
//                       <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAirQualityColor(weather.airQuality.index)}`}>
//                         {weather.airQuality.level}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <div className="flex justify-between text-sm">
//                         <span className="text-gray-600">PM2.5</span>
//                         <span className="font-medium text-gray-900">{weather.airQuality.pm25}</span>
//                       </div>
//                       <div className="flex justify-between text-sm">
//                         <span className="text-gray-600">PM10</span>
//                         <span className="font-medium text-gray-900">{weather.airQuality.pm10}</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Marine & Suggestions */}
//               <div className="space-y-4">
//                 {/* Marine conditions */}
//                 {weather.marine && (
//                   <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
//                     <h4 className="text-base font-semibold text-gray-900 mb-4">Beach Conditions</h4>
                    
//                     {weather.marine.seaState && (
//                       <div className="flex items-center justify-between mb-4">
//                         <span className="text-sm text-gray-600">Sea State</span>
//                         <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeaStateColor(weather.marine.seaState)}`}>
//                           {weather.marine.seaState}
//                         </div>
//                       </div>
//                     )}
                    
//                     {weather.marine.waveHeightM && (
//                       <div className="flex items-center justify-between mb-4">
//                         <span className="text-sm text-gray-600">Wave Height</span>
//                         <span className="text-sm font-semibold text-gray-900">{weather.marine.waveHeightM}m</span>
//                       </div>
//                     )}
                    
//                     {weather.marine.tideTimes && (
//                       <div className="pt-4 border-t border-gray-200/50">
//                         <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Today's Tides</div>
//                         <div className="space-y-2">
//                           {weather.marine.tideTimes.map((tide, index) => (
//                             <div key={index} className="flex justify-between text-sm">
//                               <span className="text-gray-600">{tide.type} Tide</span>
//                               <span className="font-medium text-gray-900">{formatTime(tide.time)}</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Smart suggestions - Simplified */}
//                 {weather.suggestions && weather.suggestions.length > 0 && (
//                   <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 group hover:scale-105 transition-all duration-300 relative overflow-hidden">
//                     {/* Cute recommendation animations */}
//                     <div className="absolute top-2 right-2 text-lg animate-pulse delay-100">💡</div>
//                     <div className="absolute bottom-2 left-2 text-sm animate-bounce delay-300">✨</div>
                    
//                     <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                       <span className="text-xl animate-pulse">🎯</span>
//                       Recommendations
//                       <span className="text-lg animate-bounce delay-200">🌟</span>
//                     </h4>
//                     <div className="space-y-3">
//                       {weather.suggestions.map((suggestion, index) => (
//                         <div key={index} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/30 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/50 transition-all duration-300 group/item hover:scale-105 relative overflow-hidden">
//                           {/* Individual suggestion sparkles */}
//                           <div className="absolute top-1 right-1 text-xs animate-ping delay-100">⭐</div>
//                           <div className="absolute bottom-1 left-1 text-xs animate-bounce delay-300">💫</div>
                          
//                           <div className="flex items-start gap-3">
//                             <span className="text-2xl transform group-hover/item:scale-110 transition-transform duration-300">{suggestion.icon}</span>
//                             <div className="flex-1 min-w-0">
//                               <div className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-blue-600 transition-colors duration-300">
//                                 {suggestion.title}
//                                 {suggestion.priority && (
//                                   <span className="ml-2 text-xs bg-gradient-to-r from-pink-200 to-purple-200 text-pink-800 px-2 py-1 rounded-full animate-pulse">🔥 Priority</span>
//                                 )}
//                               </div>
//                               {suggestion.description && (
//                                 <div className="text-xs text-gray-600 leading-relaxed group-hover/item:text-gray-700 transition-colors duration-300">
//                                   {suggestion.description}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Additional metrics - Clean grid */}
//             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
//               <div className="text-center p-4">
//                 <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Pressure</div>
//                 <div className="text-2xl font-semibold text-gray-900">{weather.current.pressure}</div>
//                 <div className="text-xs text-gray-500">hPa</div>
//               </div>
              
//               <div className="text-center p-4">
//                 <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Visibility</div>
//                 <div className="text-2xl font-semibold text-gray-900">{weather.current.visibility}</div>
//                 <div className="text-xs text-gray-500">km</div>
//               </div>
//             </div>

//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }


"use client"
import { useState, useEffect } from 'react'
import { 
  Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, 
  Eye, Sunrise, Sunset, AlertTriangle, MapPin, Clock,
  RefreshCw, CloudDrizzle, Zap, CloudSnow,
  Activity, Waves, Gauge
} from 'lucide-react'
import { useLocation } from '@/components/location/location-provider'
import { buildApiUrl } from '@/lib/strapi-config'

// Interface Definitions
// ... (same as your original: WeatherData, WeatherSettings)
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
// --- UI Component Below ---
export function EnhancedWeatherWidget() {
  const { location, units, setUnits } = useLocation()
  const [weather, setWeather] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState(null)

  // Data & effect hooks
  useEffect(() => { loadSettings() }, [])
  useEffect(() => { if (settings) loadWeather() }, [settings, location, units])
  useEffect(() => { if (weather?.current.condition) fetchWeatherSuggestions(weather.current.condition) }, [weather?.current.condition])

  // API fetchers (unchanged functionality)
  const fetchWeatherSuggestions = async (condition) => {
    try {
      setSuggestionsLoading(true)
      const suggestionsResponse = await fetch(buildApiUrl(`weather/suggestions?condition=${condition}`))
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json()
        if (suggestionsData.data?.length) {
          setWeather(prev => prev ? { ...prev, suggestions: suggestionsData.data.map(suggestion => ({
            title: suggestion.title || 'Activity Suggestion', description: suggestion.description || '', link: suggestion.link || '#', icon: suggestion.icon || '💡', priority: suggestion.priority || false
          })) } : null)
          return
        }
      }
    } catch { /* fallback below */ }
    finally { setSuggestionsLoading(false) }

    if (weather) {
      const fallbackSuggestions = getFallbackSuggestions(weather.current.condition, weather.current.temperature, weather.current.uvIndex)
      setWeather(prev => prev ? { ...prev, suggestions: fallbackSuggestions } : null)
    }
  }
  const loadSettings = async () => {
    try {
      const response = await fetch(buildApiUrl('weather/settings'))
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
      } else throw new Error('API failed to return settings')
    } catch {
      setSettings({
        defaultCityName: 'Pattaya City',
        defaultLatitude: 12.9236,
        defaultLongitude: 100.8825,
        units: 'metric', updateFrequencyMinutes: 30,
        widgetEnabled: true, sponsoredEnabled: false
      })
    }
  }
  const loadWeather = async () => {
    try {
      setLoading(true)
      setError(null)
      const lat = location?.lat || settings?.defaultLatitude || 12.9236
      const lon = location?.lon || settings?.defaultLongitude || 100.8825
      const currentUnits = units || settings?.units || 'metric'
      const apiUrl = buildApiUrl(`weather/current?lat=${lat}&lon=${lon}&units=${currentUnits}`)
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
      const data = await response.json()
      if (data.data) setWeather(validateWeatherData(data.data))
      else throw new Error('Invalid weather data format')
    } catch (error) {
      setError(error?.message || 'Unable to load weather data')
      setWeather(getFallbackWeatherData(units || settings?.units || 'metric'))
    } finally {
      setLoading(false)
    }
  }
  // Helper utilities
  const getFallbackWeatherData = (currentUnits) => ({
    location: { name: 'Pattaya, Thailand', lat: 12.9236, lon: 100.8825 },
    current: { temperature: 32, feelsLike: 39, condition: 'broken clouds', description: 'Broken Clouds', humidity: 65, windSpeed: 3, pressure: 1013, visibility: 10, uvIndex: 6, icon: '04d', sunrise: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), sunset: new Date(Date.now() + 6 * 3600 * 1000).toISOString() },
    hourly: Array.from({ length: 4 }, (_, i) => ({ time: new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString(), temp: 31 - i, icon: '04d' })),
    daily: Array.from({ length: 3 }, (_, i) => ({ date: new Date(Date.now() + (i + 1) * 86400 * 1000).toISOString(), high: 33 - i, low: 26 - i, icon: `0${i+1}d`, description: ['clear sky', 'few clouds', 'scattered clouds'][i] })),
    airQuality: { index: 2, level: 'Fair', pm25: 15, pm10: 25 },
    alerts: [],
    marine: { tideTimes: [{ type: 'High', time: new Date(Date.now() + 6 * 3600 * 1000).toISOString() }, { type: 'Low', time: new Date(Date.now() + 12 * 3600 * 1000).toISOString() }], seaState: 'Moderate', waveHeightM: 0.8 },
    suggestions: [],
    units: currentUnits,
    lastUpdated: new Date().toISOString(),
    source: 'Fallback Data'
  })
  const validateWeatherData = (data) => ({
    location: { name: data.location?.name || 'Unknown Location', lat: data.location?.lat || 0, lon: data.location?.lon || 0 },
    current: { temperature: data.current?.temperature || 0, feelsLike: data.current?.feelsLike || 0, condition: data.current?.condition || 'unknown', description: data.current?.description || 'Unknown', humidity: data.current?.humidity || 0, windSpeed: data.current?.windSpeed || 0, pressure: data.current?.pressure || 0, visibility: data.current?.visibility || 0, uvIndex: data.current?.uvIndex || 0, icon: data.current?.icon || '01d', sunrise: data.current?.sunrise || new Date().toISOString(), sunset: data.current?.sunset || new Date().toISOString() },
    hourly: data.hourly || [],
    daily: data.daily || [],
    airQuality: data.airQuality,
    alerts: data.alerts || [],
    marine: data.marine,
    suggestions: data.suggestions?.map((s) => ({ ...s })) || [],
    units: data.units || 'metric',
    lastUpdated: data.lastUpdated || new Date().toISOString(),
    source: data.source || 'Unknown'
  })
  const getFallbackSuggestions = (condition, temperature, uvIndex) => {
    const suggestions = []
    if (temperature >= 30) suggestions.push({ title: 'Stay Hydrated!', description: 'High temperature - drink plenty of water.', link: '/safety', icon: '💧', priority: true })
    if (uvIndex >= 8) suggestions.push({ title: 'High UV Protection Needed', description: 'Use sunscreen SPF 50+.', link: '/safety', icon: '☀️', priority: true })
    if (condition.includes('rain')) suggestions.push({ title: 'Indoor Activities', description: 'Perfect for shopping and dining.', link: '/shopping', icon: '🛍️', priority: false })
    else if (condition.includes('clear')) suggestions.push({ title: 'Beach Day!', description: 'Great for water sports.', link: '/beaches', icon: '🏄‍♂️', priority: false })
    return suggestions.slice(0, 4)
  }
  const getWeatherIcon = (condition, size = 'h-12 w-12') => {
    const iconProps = { className: `${size} group-hover:scale-105 transition-transform duration-200` }
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('clear') || conditionLower.includes('sun')) return <Sun {...iconProps} style={{ color: '#FBBF24' }} />
    if (conditionLower.includes('cloud')) return <Cloud {...iconProps} style={{ color: '#9CA3AF' }} />
    if (conditionLower.includes('rain')) return <CloudRain {...iconProps} style={{ color: '#60A5FA' }} />
    if (conditionLower.includes('thunder')) return <Zap {...iconProps} style={{ color: '#F59E0B' }} />
    if (conditionLower.includes('drizzle')) return <CloudDrizzle {...iconProps} style={{ color: '#A5B4FC' }} />
    if (conditionLower.includes('snow')) return <CloudSnow {...iconProps} style={{ color: '#E5E7EB' }} />
    return <Cloud {...iconProps} style={{ color: '#9CA3AF' }} />
  }
  const formatTime = (timeString) => new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString([], { weekday: 'short' })
  if (!settings?.widgetEnabled) return null
  if (loading) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center bg-gradient-animated border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-sky-300 animate-spin" />
          <p className="text-base font-medium text-white/80">Forecasting the skies...</p>
        </div>
        <style jsx global>{`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .bg-gradient-animated {
            background: linear-gradient(-45deg, #fbbf24, #e73c7e, #23a6d5, #7c3aed, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 16s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }
  if (error || !weather) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center bg-gradient-animated border border-white/10 rounded-2xl p-6 text-center">
        <div>
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="font-semibold text-white mb-4">{error || 'Weather data unavailable.'}</p>
          <button onClick={loadWeather} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-base rounded-lg transition-all">
            Retry
          </button>
        </div>
        <style jsx global>{`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .bg-gradient-animated {
            background: linear-gradient(-45deg, #fbbf24, #e73c7e, #23a6d5, #7c3aed, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 16s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }
  const hasAlerts = weather.alerts && weather.alerts.length > 0
  return (
    <>
      <div
        className="group bg-gradient-animated transition-shadow duration-500 hover:shadow-sky-400/20 cursor-pointer h-full min-h-[400px] border border-white/10 relative flex flex-col shadow-xl rounded-2xl"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="p-5 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-sky-300" />
            <span className="font-semibold text-white text-lg">{weather.location.name}</span>
            {hasAlerts && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); loadWeather(); }}
            className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-full group/btn transition-all duration-300"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-white/70 group-hover/btn:text-white transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
        <div className="px-5 pt-0 pb-5 relative flex flex-col flex-1 justify-between">
          <div className="flex flex-col space-y-4 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="text-6xl font-thin text-white tracking-tighter">
                {Math.round(weather.current.temperature)}°
              </div>
              <div className="transform transition-transform duration-200">
                {getWeatherIcon(weather.current.condition, "w-20 h-20")}
              </div>
            </div>
            <div className="text-left">
              <div className="text-xl font-medium text-white/90 capitalize">{weather.current.description}</div>
              <div className="text-base text-white/60">Feels like {Math.round(weather.current.feelsLike)}°</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pt-4 pb-2 scrollbar-hide">
              {weather.hourly.map((hour, index) => (
                <div key={index} className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 min-w-[60px]">
                  <div className="text-xs text-white/60 font-medium">{formatTime(hour.time)}</div>
                  {getWeatherIcon(hour.icon, "w-6 h-6")}
                  <div className="text-md font-semibold text-white">{hour.temp}°</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {weather.daily.slice(0, 3).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(day.icon, "w-5 h-5")}
                    <span className="text-sm font-medium text-white/80 w-16">{index === 0 ? 'Today' : formatDate(day.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/60">{day.low}°</span>
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full" style={{ width: `${((day.high - 20) / 15) * 100}%` }}></div>
                    </div>
                    <span className="font-semibold text-white">{day.high}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .bg-gradient-animated {
            background: linear-gradient(-45deg, #fbbf24, #e73c7e, #23a6d5, #7c3aed, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 16s ease-in-out infinite;
          }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] bg-gradient-animated border border-white/20 shadow-2xl rounded-2xl flex flex-col"
          >
            <div className="p-6 relative border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">{weather.location.name}</h2>
                <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"> &times; </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 relative scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                    <div className="text-8xl font-thin text-white tracking-tighter">{Math.round(weather.current.temperature)}°</div>
                    <div className="text-xl text-white/90 capitalize">{weather.current.description}</div>
                    <div className="text-base text-white/60">Feels like {Math.round(weather.current.feelsLike)}°</div>
                  </div>
                  {weather.hourly.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h3 className="text-base font-semibold text-white mb-3 px-2">Hourly Forecast</h3>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {weather.hourly.map((hour, index) => (
                          <div key={index} className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/20 min-w-[65px] transition-colors">
                            <div className="text-xs text-white/60 font-medium">{formatTime(hour.time)}</div>
                            {getWeatherIcon(hour.icon, "w-7 h-7")}
                            <div className="text-lg font-semibold text-white">{hour.temp}°</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Droplets, label: 'Humidity', value: `${weather.current.humidity}%` },
                      { icon: Wind, label: 'Wind', value: `${Math.round(weather.current.windSpeed)} ${units === 'metric' ? 'km/h' : 'mph'}` },
                      { icon: Sun, label: 'UV Index', value: `${weather.current.uvIndex}` },
                      { icon: Activity, label: 'Air Quality', value: weather.airQuality?.level || 'N/A' },
                    ].map((item, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-sky-300" />
                          <div>
                            <div className="text-xs text-white/60">{item.label}</div>
                            <div className="text-lg font-semibold text-white">{item.value}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {weather.daily.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h3 className="text-base font-semibold text-white mb-2 px-2">Daily Forecast</h3>
                      <div className="space-y-1">
                        {weather.daily.map((day, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              {getWeatherIcon(day.icon, "w-6 h-6")}
                              <span className="text-sm font-medium text-white/80 w-20">{index === 0 ? 'Today' : formatDate(day.date)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-white/60">{day.low}°</span>
                              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full" style={{ width: `${((day.high - 20) / 15) * 100}%` }}></div>
                              </div>
                              <span className="font-semibold text-white">{day.high}°</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <style jsx global>{`
              @keyframes gradientBG {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .bg-gradient-animated {
                background: linear-gradient(-45deg, #fbbf24, #e73c7e, #23a6d5, #7c3aed, #23d5ab);
                background-size: 400% 400%;
                animation: gradientBG 16s ease-in-out infinite;
              }
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
          </div>
        </div>
      )}
    </>
  )
}
