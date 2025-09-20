"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Plane, Hotel, MapPin, Calendar, Users, Search, ExternalLink, Waves, Sun, TreePine, Umbrella, Ship, Fish, Circle, Camera, Compass, Mountain, Cloud, Star, Heart, Zap, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TravelWidget {
  id: number
  Title: string
  Description: string
  IsActive: boolean
  WidgetType: string
  DefaultOrigin: string
  DefaultDestination: string
  PopularDestinations: Array<{
    name: string
    code: string
    country: string
  }>
  SkyscannerConfig: {
    AffiliateId: string
    DefaultCurrency: string
    DefaultLocale: string
    DefaultCabinClass: string
  }
  TrivagoConfig: {
    ScriptUrl: string
    AffiliateId: string
    DefaultCurrency: string
  }
  Styling: {
    Theme: string
    PrimaryColor: string
    BackgroundColor: string
  }
}

interface FlightSearchData {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  passengers: number
  cabinClass: string
}

export default function TravelSearchWidget() {
  const [widget, setWidget] = useState<TravelWidget | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('flights')
  const [popularDestinations, setPopularDestinations] = useState<Array<{name: string, code: string, country: string}>>([])
  const [showExpandedModal, setShowExpandedModal] = useState(false)
  
  // Flight search state
  const [flightSearch, setFlightSearch] = useState<FlightSearchData>({
    origin: '',
    destination: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy'
  })

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  })

  const trivagoScriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    loadWidgetConfiguration()
    loadPopularDestinations()
  }, [])

  useEffect(() => {
    if (widget && activeTab === 'hotels') {
      loadTrivagoScript()
    }
    return () => {
      // Cleanup Trivago script when component unmounts or tab changes
      if (trivagoScriptRef.current) {
        document.head.removeChild(trivagoScriptRef.current)
        trivagoScriptRef.current = null
      }
    }
  }, [widget, activeTab])

  const loadWidgetConfiguration = async () => {
    try {
      const response = await fetch(' https://api.pattaya1.com/api/travel-widget/config')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const widgetConfig = data.data
          setWidget(widgetConfig)
          
          // Set default values from widget config
          setFlightSearch(prev => ({
            ...prev,
            origin: widgetConfig.DefaultOrigin || 'Bangkok',
            destination: widgetConfig.DefaultDestination || 'Phuket'
          }))
          
          setHotelSearch(prev => ({
            ...prev,
            destination: widgetConfig.DefaultDestination || ''
          }))
        }
      } else {
        // Fallback: Create a default widget config if API returns 404
        const defaultWidget = {
          id: 1,
          Title: "Travel Search",
          Description: "Search flights and hotels with Skyscanner & Trivago",
          IsActive: true,
          WidgetType: "travel",
          DefaultOrigin: "Bangkok",
          DefaultDestination: "Phuket",
          PopularDestinations: [],
          SkyscannerConfig: {
            AffiliateId: "default",
            DefaultCurrency: "THB",
            DefaultLocale: "th-TH",
            DefaultCabinClass: "economy"
          },
          TrivagoConfig: {
            ScriptUrl: "https://www.trivago.com/",
            AffiliateId: "default",
            DefaultCurrency: "THB"
          },
          Styling: {
            Theme: "light",
            PrimaryColor: "#3b82f6",
            BackgroundColor: "#ffffff"
          }
        }
        setWidget(defaultWidget)
        
        setFlightSearch(prev => ({
          ...prev,
          origin: defaultWidget.DefaultOrigin,
          destination: defaultWidget.DefaultDestination
        }))
        
        setHotelSearch(prev => ({
          ...prev,
          destination: defaultWidget.DefaultDestination
        }))
      }
    } catch (error) {
      console.error('Error loading widget configuration:', error)
      // Set a minimal default widget to prevent loading state
      setWidget({
        id: 1,
        Title: "Travel Search",
        Description: "Search flights and hotels",
        IsActive: true,
        WidgetType: "travel",
        DefaultOrigin: "Bangkok",
        DefaultDestination: "Phuket",
        PopularDestinations: [],
        SkyscannerConfig: { AffiliateId: "default", DefaultCurrency: "THB", DefaultLocale: "th-TH", DefaultCabinClass: "economy" },
        TrivagoConfig: { ScriptUrl: "https://www.trivago.com/", AffiliateId: "default", DefaultCurrency: "THB" },
        Styling: { Theme: "light", PrimaryColor: "#3b82f6", BackgroundColor: "#ffffff" }
      })
    }
  }

  const loadPopularDestinations = async () => {
    try {
      // Prefer local API during development
      const response = await fetch('/api/travel-widget/destinations')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setPopularDestinations(data.data || [])
        }
      }
      // Fallback if no data returned
      if (!popularDestinations || popularDestinations.length === 0) {
        setPopularDestinations([
          { name: 'Bangkok', code: 'BKK', country: 'Thailand' },
          { name: 'Phuket', code: 'HKT', country: 'Thailand' },
          { name: 'Pattaya', code: 'UTP', country: 'Thailand' },
          { name: 'Chiang Mai', code: 'CNX', country: 'Thailand' },
          { name: 'Krabi', code: 'KBV', country: 'Thailand' },
          { name: 'Koh Samui', code: 'USM', country: 'Thailand' },
        ])
      }
    } catch (error) {
      console.error('Error loading popular destinations:', error)
      // Ensure UI still shows something
      setPopularDestinations([
        { name: 'Bangkok', code: 'BKK', country: 'Thailand' },
        { name: 'Phuket', code: 'HKT', country: 'Thailand' },
        { name: 'Pattaya', code: 'UTP', country: 'Thailand' },
        { name: 'Chiang Mai', code: 'CNX', country: 'Thailand' },
        { name: 'Krabi', code: 'KBV', country: 'Thailand' },
        { name: 'Koh Samui', code: 'USM', country: 'Thailand' },
      ])
    }
  }

  const loadTrivagoScript = () => {
    if (!widget || trivagoScriptRef.current) return

    const script = document.createElement('script')
    script.src = widget.TrivagoConfig.ScriptUrl
    script.async = true
    script.setAttribute('data-noptimize', '1')
    script.setAttribute('data-cfasync', 'false')
    
    trivagoScriptRef.current = script
    document.head.appendChild(script)
  }

  const generateFlightUrl = async (searchData: FlightSearchData) => {
    if (!widget) return

    setLoading(true)
    try {
      // Convert city names to airport codes for Trivago flights
      const getAirportCode = (cityName: string) => {
        const codes: { [key: string]: string } = {
          'Bangkok': 'BKK',
          'Phuket': 'HKT', 
          'Pattaya': 'UTP',
          'Chiang Mai': 'CNX'
        }
        return codes[cityName] || cityName
      }

      const params = new URLSearchParams({
        origin: getAirportCode(searchData.origin),
        destination: getAirportCode(searchData.destination),
        departureDate: searchData.departDate,
        adults: searchData.passengers.toString()
      })

      if (searchData.returnDate) {
        params.append('returnDate', searchData.returnDate)
      }

      const response = await fetch(` https://api.pattaya1.com/api/travel-widget/flight-search?${params}`)

      if (response.ok) {
        const data = await response.json()
        console.log('Trivago flight search response:', data)
        if (data.success && data.data.searchUrl) {
          console.log('Opening Trivago flight URL:', data.data.searchUrl)
          window.open(data.data.searchUrl, '_blank')
          
          // Track the click
          trackClick('flight', searchData)
        } else {
          console.error('Invalid response structure:', data)
        }
      } else {
        console.error('Flight search failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error generating flight URL:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBookingUrl = (searchData: typeof hotelSearch) => {
    const baseUrl = 'https://www.booking.com/searchresults.html'
    const params = new URLSearchParams({
      ss: searchData.destination,
      checkin: searchData.checkIn,
      checkout: searchData.checkOut,
      group_adults: searchData.guests.toString(),
      group_children: '0',
      no_rooms: '1',
      selected_currency: 'THB'
    })
    return `${baseUrl}?${params.toString()}`
  }

  const trackClick = async (type: string, searchParams: any) => {
    if (!widget) return

    try {
      await fetch(' https://api.pattaya1.com/api/travel-widget/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: widget.id,
          type,
          destination: searchParams.destination,
          searchParams
        })
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (flightSearch.origin && flightSearch.destination && flightSearch.departDate) {
      generateFlightUrl(flightSearch)
    }
  }

  const handleHotelSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelSearch.destination || !hotelSearch.checkIn || !hotelSearch.checkOut) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        destination: hotelSearch.destination,
        checkinDate: hotelSearch.checkIn,
        checkoutDate: hotelSearch.checkOut,
        adults: hotelSearch.guests.toString()
      })

      const response = await fetch(`/api/travel-widget/hotel-search?${params}`)

      if (response.ok) {
        const data = await response.json()
        console.log('Hotel search response:', data)
        // Redirect to external booking source (Booking.com)
        if (data.data && Array.isArray(data.data)) {
          console.log('Hotel search results:', data.data)
          
          // Generate Booking.com URL with search parameters
          const bookingUrl = generateBookingUrl(hotelSearch)
          console.log('Redirecting to Booking.com:', bookingUrl)
          window.open(bookingUrl, '_blank')
          
          // Track the click
          trackClick('hotel', hotelSearch)
        } else {
          console.error('Invalid hotel response structure:', data)
        }
      } else {
        console.error('Hotel search failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error generating hotel URL:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toISOString().split('T')[0]
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDate(tomorrow.toISOString())
  }

  const getNextWeekDate = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return formatDate(nextWeek.toISOString())
  }

  if (!widget) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-sky-100 to-blue-50 rounded-xl">
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading paradise...</p>
          </div>
          </div>
    )
  }

  return (
    <>
      {/* Main Widget - Clickable to expand */}
      <div 
        className="h-full pb-2 flex flex-col bg-gradient-to-br from-blue-100 via-sky-100 to-blue-50 rounded-xl overflow-hidden relative shadow-sm border border-blue-200"
        onClick={() => setShowExpandedModal(true)}
      >
        {/* Clean Header - Compact */}
        <div className="relative p-2 border-b border-blue-200 bg-gradient-to-r from-blue-100 to-sky-100 overflow-hidden">
          {/* Sun Glow - Top Left - Bigger & Brighter */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-yellow-300 rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute -top-1 -left-1 w-20 h-20 bg-yellow-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-yellow-100 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute -top-3 -left-3 w-28 h-28 bg-yellow-50 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-yellow-50 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          
          {/* Clouds - Filling Entire Header */}
          {/* Top Row Clouds */}
          <div className="absolute top-0 left-8 w-6 h-4 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '4s' }}></div>
          <div className="absolute top-1 left-12 w-7 h-4 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '4s' }}></div>
          <div className="absolute top-0 left-20 w-5 h-3 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '2.1s', animationDuration: '4s' }}></div>
          <div className="absolute top-2 left-28 w-6 h-4 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '2.4s', animationDuration: '4s' }}></div>
          <div className="absolute top-1 left-36 w-7 h-5 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2.7s', animationDuration: '4s' }}></div>
          <div className="absolute top-0 left-44 w-6 h-4 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '3s', animationDuration: '4s' }}></div>
          <div className="absolute top-2 left-52 w-5 h-3 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '3.3s', animationDuration: '4s' }}></div>
          <div className="absolute top-1 left-60 w-8 h-5 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '3.6s', animationDuration: '4s' }}></div>
          <div className="absolute top-0 left-70 w-6 h-4 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '3.9s', animationDuration: '4s' }}></div>
          <div className="absolute top-2 left-78 w-7 h-4 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '4.2s', animationDuration: '4s' }}></div>
          <div className="absolute top-1 left-86 w-5 h-3 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '4.5s', animationDuration: '4s' }}></div>
          <div className="absolute top-0 right-8 w-6 h-4 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '4.8s', animationDuration: '4s' }}></div>
          <div className="absolute top-2 right-2 w-7 h-5 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '5.1s', animationDuration: '4s' }}></div>
          
          {/* Middle Row Clouds */}
          <div className="absolute top-3 left-6 w-5 h-3 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1.7s', animationDuration: '4s' }}></div>
          <div className="absolute top-4 left-14 w-6 h-4 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
          <div className="absolute top-3 left-22 w-7 h-4 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2.3s', animationDuration: '4s' }}></div>
          <div className="absolute top-5 left-30 w-5 h-3 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '2.6s', animationDuration: '4s' }}></div>
          <div className="absolute top-4 left-38 w-6 h-4 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '2.9s', animationDuration: '4s' }}></div>
          <div className="absolute top-3 left-46 w-7 h-5 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '3.2s', animationDuration: '4s' }}></div>
          <div className="absolute top-5 left-54 w-6 h-3 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '3.5s', animationDuration: '4s' }}></div>
          <div className="absolute top-4 left-62 w-5 h-4 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '3.8s', animationDuration: '4s' }}></div>
          <div className="absolute top-3 left-70 w-7 h-4 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '4.1s', animationDuration: '4s' }}></div>
          <div className="absolute top-5 left-78 w-6 h-3 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '4.4s', animationDuration: '4s' }}></div>
          <div className="absolute top-4 left-86 w-5 h-4 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '4.7s', animationDuration: '4s' }}></div>
          <div className="absolute top-3 right-6 w-7 h-4 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '5s', animationDuration: '4s' }}></div>
          <div className="absolute top-5 right-0 w-6 h-3 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '5.3s', animationDuration: '4s' }}></div>
          
          {/* Bottom Row Clouds */}
          <div className="absolute top-6 left-4 w-6 h-4 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.9s', animationDuration: '4s' }}></div>
          <div className="absolute top-7 left-12 w-5 h-3 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '2.2s', animationDuration: '4s' }}></div>
          <div className="absolute top-6 left-20 w-7 h-4 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '4s' }}></div>
          <div className="absolute top-8 left-28 w-6 h-3 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2.8s', animationDuration: '4s' }}></div>
          <div className="absolute top-7 left-36 w-5 h-4 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '3.1s', animationDuration: '4s' }}></div>
          <div className="absolute top-6 left-44 w-7 h-4 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '3.4s', animationDuration: '4s' }}></div>
          <div className="absolute top-8 left-52 w-6 h-3 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '3.7s', animationDuration: '4s' }}></div>
          <div className="absolute top-7 left-60 w-5 h-4 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '4s', animationDuration: '4s' }}></div>
          <div className="absolute top-6 left-68 w-7 h-4 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '4.3s', animationDuration: '4s' }}></div>
          <div className="absolute top-8 left-76 w-6 h-3 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '4.6s', animationDuration: '4s' }}></div>
          <div className="absolute top-7 left-84 w-5 h-4 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '4.9s', animationDuration: '4s' }}></div>
          <div className="absolute top-6 right-4 w-7 h-4 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '5.2s', animationDuration: '4s' }}></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg shadow-sm">
                <Plane className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Travel Search</h2>
                <p className="text-xs text-gray-600">Find your getaway</p>
              </div>
            </div>
            {/* Popular inline in header */}
            {popularDestinations.length > 0 && (
              <div className="ml-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-bold text-gray-700">Popular</span>
                </div>
                <div className="flex items-center gap-1">
                  {popularDestinations.slice(0, 6).map(dest => (
                    <button
                      key={dest.code}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveTab('flights')
                        setFlightSearch(prev => ({ ...prev, destination: dest.name }))
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-400 rounded-lg transition-all duration-200 text-[11px] text-gray-700 hover:text-blue-700"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {dest.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Clean Content Area - Compact */}
        <div className="flex-1 overflow-hidden p-1.5 h-full">
          <div className="space-y-1 h-full" onClick={(e) => e.stopPropagation()}>
            {/* Simplified Tabs */}
            <div className="flex my-1 gap-1" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant={activeTab === 'flights' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveTab('flights')
                }}
                className={`text-xs h-8 px-2 ${activeTab === 'flights' ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white' : ''}`}
              >
                <Plane className="h-3 w-3 mr-1" />
              Flights
              </Button>
              <Button 
                variant={activeTab === 'hotels' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveTab('hotels')
                }}
                className={`text-xs h-8 px-2 ${activeTab === 'hotels' ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white' : ''}`}
              >
                <Hotel className="h-3 w-3 mr-1" />
              Hotels
              </Button>
            </div>

            {/* Professional Flight Search Form - Compact */}
            {activeTab === 'flights' && (
              <div className="bg-gradient-to-br from-white via-blue-50/30 to-sky-50/50 backdrop-blur-sm p-1.5 rounded-lg border border-blue-200/60 shadow-sm flex-1 py-2" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleFlightSearch} className="space-y-1.5">
                  {/* Form Header */}

                  {/* Origin & Destination - Enhanced */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        From
                      </label>
                      <Select 
                        value={flightSearch.origin} 
                        onValueChange={(value) => setFlightSearch(prev => ({ ...prev, origin: value }))}
                      >
                        <SelectTrigger 
                          className="h-8 bg-white border border-blue-200 rounded-lg focus:border-blue-500 transition-all duration-200 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue placeholder="Origin" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-blue-200 shadow-lg">
                          {popularDestinations.map(dest => (
                            <SelectItem key={dest.code} value={dest.name} className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                {dest.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        To
                      </label>
                      <Select 
                        value={flightSearch.destination} 
                        onValueChange={(value) => setFlightSearch(prev => ({ ...prev, destination: value }))}
                      >
                        <SelectTrigger 
                          className="h-8 bg-white border border-blue-200 rounded-lg focus:border-blue-500 transition-all duration-200 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue placeholder="Destination" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-blue-200 shadow-lg">
                          {popularDestinations.map(dest => (
                            <SelectItem key={dest.code} value={dest.name} className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-green-500" />
                                {dest.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center -my-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        const temp = flightSearch.origin
                        setFlightSearch(prev => ({ 
                          ...prev, 
                          origin: prev.destination, 
                          destination: temp 
                        }))
                      }}
                      className="h-6 w-6 rounded-full border border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400 shadow-sm"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                    </Button>
                  </div>

                  {/* Dates - Enhanced */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        Departure
                      </label>
                      <Input
                        type="date"
                        value={flightSearch.departDate}
                        onChange={(e) => setFlightSearch(prev => ({ ...prev, departDate: e.target.value }))}
                        min={getTomorrowDate()}
                        className="h-8 bg-white border border-blue-200 rounded-lg focus:border-blue-500 transition-all duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-green-500" />
                        Return
                      </label>
                      <Input
                        type="date"
                        value={flightSearch.returnDate}
                        onChange={(e) => setFlightSearch(prev => ({ ...prev, returnDate: e.target.value }))}
                        min={flightSearch.departDate || getTomorrowDate()}
                        className="h-8 bg-white border border-blue-200 rounded-lg focus:border-blue-500 transition-all duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Passengers & Class - Enhanced */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        Passengers
                      </label>
                      <Select 
                        value={flightSearch.passengers.toString()} 
                        onValueChange={(value) => setFlightSearch(prev => ({ ...prev, passengers: parseInt(value) }))}
                      >
                        <SelectTrigger 
                          className="h-8 bg-white border border-blue-200 rounded-lg focus:border-blue-500 transition-all duration-200 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-blue-200 shadow-lg">
                          {[1,2,3,4,5,6].map(num => (
                            <SelectItem key={num} value={num.toString()} className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                {num} {num === 1 ? 'Passenger' : 'Passengers'}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        Class
                      </label>
                      <Select 
                        value={flightSearch.cabinClass} 
                        onValueChange={(value) => setFlightSearch(prev => ({ ...prev, cabinClass: value }))}
                      >
                        <SelectTrigger 
                          className="h-8 bg-white border border-blue-200 rounded-lg focus:border-blue-500 transition-all duration-200 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-blue-200 shadow-lg">
                          <SelectItem value="economy" className="rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                              Economy
                            </div>
                          </SelectItem>
                          <SelectItem value="premium_economy" className="rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                              Premium Economy
                            </div>
                          </SelectItem>
                          <SelectItem value="business" className="rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                              Business
                            </div>
                          </SelectItem>
                          <SelectItem value="first" className="rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                              First Class
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Search Button - Enhanced */}
                  <Button 
                    type="submit" 
                    className="w-full h-8 mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-700 hover:via-blue-600 hover:to-sky-600 text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow-md transition-all duration-300 "
                    disabled={loading || !flightSearch.origin || !flightSearch.destination || !flightSearch.departDate}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span className="text-xs">Searching...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="h-3 w-3" />
                        <span className="text-xs">Search Flights</span>
                        <Plane className="h-3 w-3" />
                      </div>
                    )}
                  </Button>
                </form>

                
              </div>
            )}

            {/* Professional Hotel Search Form - Compact */}
            {activeTab === 'hotels' && (
              <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-sm p-1.5 rounded-lg border border-green-200/50 shadow-sm flex-1" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleHotelSearch} className="space-y-1.5">
                  
                  {/* Destination */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-500" />
                      Destination
                    </label>
                    <Select 
                      value={hotelSearch.destination} 
                      onValueChange={(value) => setHotelSearch(prev => ({ ...prev, destination: value }))}
                    >
                      <SelectTrigger 
                        className="h-8 bg-white border border-green-200 rounded-lg focus:border-green-500 transition-all duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue placeholder="Where to stay?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-green-200 shadow-lg">
                        {popularDestinations.map(dest => (
                          <SelectItem key={dest.code} value={dest.name} className="rounded-lg">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-500" />
                              {dest.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Check-in & Check-out */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-green-500" />
                        Check-in
                      </label>
                      <Input
                        type="date"
                        value={hotelSearch.checkIn}
                        onChange={(e) => setHotelSearch(prev => ({ ...prev, checkIn: e.target.value }))}
                        min={getTomorrowDate()}
                        className="h-8 bg-white border border-green-200 rounded-lg focus:border-green-500 transition-all duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        Check-out
                      </label>
                      <Input
                        type="date"
                        value={hotelSearch.checkOut}
                        onChange={(e) => setHotelSearch(prev => ({ ...prev, checkOut: e.target.value }))}
                        min={hotelSearch.checkIn || getTomorrowDate()}
                        className="h-8 bg-white border border-green-200 rounded-lg focus:border-green-500 transition-all duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="w-3 h-3 text-green-500" />
                      Guests
                    </label>
                    <Select 
                      value={hotelSearch.guests.toString()} 
                      onValueChange={(value) => setHotelSearch(prev => ({ ...prev, guests: parseInt(value) }))}
                    >
                      <SelectTrigger 
                        className="h-8 bg-white border border-green-200 rounded-lg focus:border-green-500 transition-all duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue placeholder="Guests?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-green-200 shadow-lg">
                        {[1,2,3,4,5,6].map(num => (
                          <SelectItem key={num} value={num.toString()} className="rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-green-500" />
                              {num} {num === 1 ? 'Guest' : 'Guests'}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Button - Enhanced */}
                  <Button 
                    type="submit" 
                    className="w-full h-8 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 hover:from-green-700 hover:via-green-600 hover:to-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                    disabled={!hotelSearch.destination || !hotelSearch.checkIn || !hotelSearch.checkOut}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Hotel className="h-3 w-3" />
                      <span className="text-xs">Search Hotels</span>
                      <Star className="h-3 w-3" />
                    </div>
                  </Button>
                </form>

                {/* Hotel Search Info - Enhanced */}
                <div className="mt-2 pt-2 border-t border-green-200/50" onClick={(e) => e.stopPropagation()}>
                  
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {showExpandedModal && (
        <Dialog open={showExpandedModal} onOpenChange={setShowExpandedModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden z-[100]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plane className="w-6 h-6 text-blue-500 animate-pulse" />
                Travel Search - Full View
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Same content as main widget but with larger spacing */}
                <div className="flex gap-3">
                  <Button 
                    variant={activeTab === 'flights' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('flights')}
                    className={activeTab === 'flights' ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white' : ''}
                  >
                    <Plane className="h-4 w-4 mr-2 animate-pulse" />
              Flights
                  </Button>
                  <Button 
                    variant={activeTab === 'hotels' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('hotels')}
                    className={activeTab === 'hotels' ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white' : ''}
                  >
                    <Hotel className="h-4 w-4 mr-2 animate-pulse" />
              Hotels
                  </Button>
                </div>

                {/* Flight Search Form - Expanded */}
                {activeTab === 'flights' && (
                  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-lg border border-blue-200">
                    <form onSubmit={handleFlightSearch} className="space-y-4">
                      {/* Origin & Destination */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">From</label>
                          <Select 
                            value={flightSearch.origin} 
                            onValueChange={(value) => setFlightSearch(prev => ({ ...prev, origin: value }))}
                          >
                            <SelectTrigger className="h-12 bg-white/80 border-blue-300">
                      <SelectValue placeholder="Origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularDestinations.map(dest => (
                        <SelectItem key={dest.code} value={dest.name}>{dest.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">To</label>
                          <Select 
                            value={flightSearch.destination} 
                            onValueChange={(value) => setFlightSearch(prev => ({ ...prev, destination: value }))}
                          >
                            <SelectTrigger className="h-12 bg-white/80 border-blue-300">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularDestinations.map(dest => (
                        <SelectItem key={dest.code} value={dest.name}>{dest.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Departure</label>
                  <Input
                    type="date"
                    value={flightSearch.departDate}
                    onChange={(e) => setFlightSearch(prev => ({ ...prev, departDate: e.target.value }))}
                    min={getTomorrowDate()}
                            className="h-12 bg-white/80 border-blue-300"
                  />
                </div>
                
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Return</label>
                  <Input
                    type="date"
                    value={flightSearch.returnDate}
                    onChange={(e) => setFlightSearch(prev => ({ ...prev, returnDate: e.target.value }))}
                    min={flightSearch.departDate || getTomorrowDate()}
                            className="h-12 bg-white/80 border-blue-300"
                  />
                </div>
              </div>

                      {/* Passengers & Class */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Passengers</label>
                          <Select 
                            value={flightSearch.passengers.toString()} 
                            onValueChange={(value) => setFlightSearch(prev => ({ ...prev, passengers: parseInt(value) }))}
                          >
                            <SelectTrigger className="h-12 bg-white/80 border-blue-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Class</label>
                          <Select 
                            value={flightSearch.cabinClass} 
                            onValueChange={(value) => setFlightSearch(prev => ({ ...prev, cabinClass: value }))}
                          >
                            <SelectTrigger className="h-12 bg-white/80 border-blue-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium_economy">Premium Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-medium text-lg"
                disabled={loading || !flightSearch.origin || !flightSearch.destination || !flightSearch.departDate}
              >
                {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                          <Search className="h-5 w-5 mr-2 animate-pulse" />
                )}
                Search Flights
              </Button>
            </form>

                    {/* Popular Destinations - Expanded */}
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-700 mb-3">Popular Destinations</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {popularDestinations.slice(0, 8).map(dest => (
                  <button
                    key={dest.code}
                    onClick={() => setFlightSearch(prev => ({ ...prev, destination: dest.name }))}
                            className="p-3 text-sm bg-white/60 hover:bg-white/80 border border-blue-200 rounded-lg transition-colors text-center"
                  >
                    {dest.name}
                  </button>
                ))}
              </div>
            </div>
                  </div>
                )}

                {/* Hotel Search Form - Expanded */}
                {activeTab === 'hotels' && (
                  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-lg border border-blue-200">
                    <form onSubmit={handleHotelSearch} className="space-y-4">
              <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Destination</label>
                        <Select 
                          value={hotelSearch.destination} 
                          onValueChange={(value) => setHotelSearch(prev => ({ ...prev, destination: value }))}
                        >
                          <SelectTrigger className="h-12 bg-white/80 border-blue-300">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularDestinations.map(dest => (
                      <SelectItem key={dest.code} value={dest.name}>{dest.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Check-in</label>
                  <Input
                    type="date"
                    value={hotelSearch.checkIn}
                    onChange={(e) => setHotelSearch(prev => ({ ...prev, checkIn: e.target.value }))}
                    min={getTomorrowDate()}
                            className="h-12 bg-white/80 border-blue-300"
                  />
                </div>
                
                <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Check-out</label>
                  <Input
                    type="date"
                    value={hotelSearch.checkOut}
                    onChange={(e) => setHotelSearch(prev => ({ ...prev, checkOut: e.target.value }))}
                    min={hotelSearch.checkIn || getTomorrowDate()}
                            className="h-12 bg-white/80 border-blue-300"
                  />
                </div>
              </div>

              <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Guests</label>
                        <Select 
                          value={hotelSearch.guests.toString()} 
                          onValueChange={(value) => setHotelSearch(prev => ({ ...prev, guests: parseInt(value) }))}
                        >
                          <SelectTrigger className="h-12 bg-white/80 border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Guest' : 'Guests'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-medium text-lg"
                disabled={!hotelSearch.destination || !hotelSearch.checkIn || !hotelSearch.checkOut}
              >
                        <Hotel className="h-5 w-5 mr-2 animate-pulse" />
                Search Hotels
              </Button>
            </form>

                    {/* Hotel Search Info - Expanded */}
                    <div className="mt-6 p-4 bg-white/40 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-center gap-2">
                        <Hotel className="h-5 w-5 text-blue-500 animate-pulse" />
                        <p className="text-sm text-gray-600">
                          Powered by Trivago - Find the best hotel deals for your perfect beach getaway
                        </p>
                </div>
              </div>
            </div>
                )}
        </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
