"use client"

import { useState, useEffect, useCallback } from "react"
import { Responsive, WidthProvider } from 'react-grid-layout';
import { InView } from 'react-intersection-observer';
import { Settings, BarChart3, Eye, EyeOff, ToggleLeft, ToggleRight, Activity, Sparkles, Save, RotateCcw, Move, Maximize2, X, GripVertical, Wand2, Lock, Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, Eye as EyeIcon, Sunrise, Sunset, AlertTriangle, MapPin, Clock, RefreshCw, CloudDrizzle, Zap, CloudSnow, Waves, Gauge } from "lucide-react"
import { trackLayoutChange, trackWidgetResize, trackWidgetDrag, widgetTracker } from "@/lib/widget-tracker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth/auth-provider"
import { useLocation } from "@/components/location/location-provider"
import { buildApiUrl } from "@/lib/strapi-config"

// Import all widgets
import { EnhancedBreakingNewsWidget } from "./widgets/enhanced-breaking-news-widget"
import { EnhancedWeatherWidget } from "../widgets/enhanced-weather-widget"
import { RadioWidget } from "./widgets/radio-widget"
import FeaturedVideosWidget from "../video/featured-videos-widget"
import { LiveEventsWidget } from "./widgets/live-events-widget"
import { BusinessSpotlightWidget } from "./widgets/business-spotlight-widget"
import { PhotoGalleryWidget } from "./widgets/photo-gallery-widget"
import { QuickLinksWidget } from "./widgets/quick-links-widget"
import { SocialFeedWidget } from "./widgets/social-feed-widget"
import { TrendingWidget } from "./widgets/trending-widget"
import { ForumActivityWidget } from "./widgets/forum-activity-widget"
import { EventsCalendarWidget } from "./widgets/events-calendar-widget"
import { TrafficWidget } from "./widgets/traffic-widget"
import { GoogleReviewsWidget } from "../widgets/google-reviews-widget"
import { CompactCurrencyConverterWidget } from "../widgets/compact-currency-converter-widget"
import { NewCurrencyConverterWidget } from "../widgets/new-currency-converter-widget"
import { EnhancedHotDealsWidget } from "./widgets/enhanced-hot-deals-widget"
import { FoodWidget } from "../widgets/food-widget"
import { CinemaWidget } from "./widgets/cinema-widget"
import { ScrollingMarquee } from "./scrolling-marquee"
import ThreeWidgetSearchLayout from "../search/three-widget-search-layout"
import FlightTrackerWidget from "../search/flight-tracker-widget"
import SportsFixturesWidget from "../widgets/sports-fixtures-widget"
import UnifiedSearchWidget from "../search/unified-search-widget"

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ResponsiveGridLayout component with width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

// Minimal placeholder for empty reserved cells
const EmptyPlaceholderWidget = () => (
  <div className="h-full w-full bg-transparent" />
)

interface Widget {
  id: string
  name: string
  type: string
  description: string
  size: "small" | "medium" | "large" | "xlarge"
  category: string
  isVisible: boolean
  isResizable: boolean
  allowUserResizingAndMoving: boolean
  isMandatory: boolean
  adminSettings: {
    allowResize: boolean
    allowDrag: boolean
    allowDelete: boolean
    isLocked: boolean
  }
  settings: {
    apiKeys?: Record<string, string>
    refreshInterval?: number
    customContent?: any
    advertisements?: {
      enabled: boolean
      slots: number
      content: any[]
    }
  }
}

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  isDraggable?: boolean
  isResizable?: boolean
  static?: boolean
}

// Weather Data Interfaces
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

export function DynamicModularHomepage() {
  const { user, firebaseUser, loading: authLoading, getStrapiToken } = useAuth()
  const { location, units, setUnits } = useLocation()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [layout, setLayout] = useState<LayoutItem[]>([])
  const [showAdmin, setShowAdmin] = useState(false)
  const [userRole, setUserRole] = useState<"admin" | "business" | "user">("admin")
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<{id: string, name: string, content: string} | null>(null)
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false)
  
  // Weather modal state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherSettings, setWeatherSettings] = useState<WeatherSettings | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  
  // Check if user is authenticated
  const isAuthenticated = !!user && !!firebaseUser

  /**
   * Save user layout to backend API
   */
  const saveLayoutToApi = useCallback(async (currentLayout: LayoutItem[]) => {
    try {
      const token = getStrapiToken()
      if (!token) {
        console.warn('No auth token available for saving layout')
        return { success: false, error: 'No authentication token' }
      }

      const simplifiedLayout = currentLayout.map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      }));
      
      const response = await fetch('/api/users/me/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ layout: simplifiedLayout })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Layout saved to API:', result);
      
      // Save to localStorage as fallback
      localStorage.setItem("pattaya1-dynamic-layout", JSON.stringify(simplifiedLayout));
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to save layout:', error);
      // Fallback to localStorage
      const simplifiedLayout = currentLayout.map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      }));
      localStorage.setItem("pattaya1-dynamic-layout", JSON.stringify(simplifiedLayout));
      return { success: false, error };
    }
  }, [getStrapiToken]);

  /**
   * Load user's saved layout from backend API
   */
  const loadUserLayout = useCallback(async () => {
    try {
      const token = getStrapiToken()
      if (!token) {
        console.warn('No auth token available for loading layout')
        return { success: false, error: 'No authentication token' }
      }

      const response = await fetch('/api/users/me/layout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loading user layout from API:', result);
        return { success: true, data: result.layout || null };
      }
      
      // Fallback to localStorage if API fails
      const savedLayout = localStorage.getItem("pattaya1-dynamic-layout");
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        console.log('Loading user layout from localStorage fallback:', parsedLayout);
        return { success: true, data: parsedLayout };
      }
      
      return { success: false, data: null };
    } catch (error) {
      console.error('Failed to load user layout:', error);
      // Fallback to localStorage
      const savedLayout = localStorage.getItem("pattaya1-dynamic-layout");
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        return { success: true, data: parsedLayout };
      }
      return { success: false, error };
    }
  }, [getStrapiToken]);

  /**
   * Fetch admin widget configurations from Strapi backend
   */
  const fetchAdminWidgetConfigs = useCallback(async () => {
    try {
      const token = getStrapiToken()
      if (!token) {
        console.warn('No auth token available for loading widget configs')
        return { success: false, error: 'No authentication token' }
      }

      const response = await fetch('/api/admin/widget-configs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loading admin widget configs from Strapi:', result);
        return { success: true, data: result };
      }
      
      // Fallback to default configurations if API fails
      const defaultConfigs = {
        "unified-search": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "weather": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "breaking-news": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "radio": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "currency-converter": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "hot-deals": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "social-feed": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "trending": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "youtube": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "quick-links": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "photo-gallery": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "forum-activity": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "google-reviews": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "traffic": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "search-widgets": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "flight-tracker": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "food": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "cinema": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
      };
      
      console.log('Using fallback admin widget configs:', defaultConfigs);
      return { success: true, data: defaultConfigs };
    } catch (error) {
      console.error('Failed to fetch admin widget configs:', error);
      return { success: false, error };
    }
  }, [getStrapiToken]);

  /**
   * Generate layout from widget configurations
   */
  const generateLayoutFromWidgets = useCallback((widgetConfigs: Widget[], savedLayout: any[] | null = null) => {
    return widgetConfigs.map((widget, index) => {
      // Check if there's a saved layout for this widget
      const savedItem = savedLayout?.find(item => item.i === widget.id);
      
      // Beautifully organized layout with logical content groupings and optimal visual flow
      const defaultPositions: { [key: string]: { x: number, y: number, w: number, h: number } } = {
        
        
        // 📰 NEWS & INFORMATION (Below search bar)
        "weather": { x: 0, y: 5, w: 3, h: 6 },
        "breaking-news": { x: 3, y: 5, w: 6, h: 6 },
        "radio": { x: 9, y: 5, w: 3, h: 6 },
        // Hot deals between radio and currency (same size as Google Reviews)
        "hot-deals": { x: 9, y: 11, w: 3, h: 8 },
        // Currency converter below hot deals
        "currency-converter": { x: 9, y: 19, w: 3, h: 6 },
        
        // 🎬 CINEMA (Below weather widget with same height)
        "cinema": { x: 0, y: 11, w: 3, h: 6 },
        
        // 🍽️ FOOD (Below breaking news, spans wider)
        "food": { x: 3, y: 11, w: 6, h: 6 },
        
        // ✈️ FLIGHT & SEARCH (Below cinema/food with 3:6:3 ratio like weather/radio/news)
        // Swap positions: move Google Reviews where Traffic was
        "google-reviews": { x: 9, y: 33, w: 3, h: 8 },
        "search-widgets": { x: 3, y: 17, w: 6, h: 6 },
        "youtube": { x: 3, y: 23, w: 6, h: 6 },
        "flight-tracker": { x: 0, y: 25, w: 3, h: 6 },
        
        // 💬 SOCIAL & COMMUNITY
        // Social feed placed directly below currency converter (same size as Google Reviews)
        "social-feed": { x: 9, y: 25, w: 3, h: 8 },
        // Trending same size as weather (w:3,h:6)
        "trending": { x: 0, y: 33, w: 3, h: 6 },
        
        // Photo gallery just below featured videos (youtube) and forum below photo gallery
        "photo-gallery": { x: 3, y: 29, w: 6, h: 6 },
        "forum-activity": { x: 3, y: 35, w: 6, h: 6 },
        
        // 📅 EVENTS & ACTIVITIES (Time-sensitive, side by side)
        // Swap positions: move Traffic to where Google Reviews was, keep weather-sized height
        "traffic": { x: 0, y: 17, w: 3, h: 6 },
        "sports-fixtures": { x: 0, y: 50, w: 6, h: 8 },
        
        // Quick access (quick-links) below trending, same size as weather
        "quick-links": { x: 0, y: 39, w: 3, h: 6 },
        
      };
      
      const defaultPos = defaultPositions[widget.id] || { x: (index % 4) * 3, y: Math.floor(index / 4) * 4, w: 3, h: 3 };
      
      // Use admin settings to determine if widget can be dragged/resized
      const canDrag = widget.adminSettings.allowDrag && !widget.adminSettings.isLocked;
      const canResize = widget.adminSettings.allowResize && !widget.adminSettings.isLocked;
      
      return {
        i: widget.id,
        x: savedItem?.x ?? defaultPos.x,
        y: savedItem?.y ?? defaultPos.y,
        w: savedItem?.w ?? defaultPos.w,
        h: savedItem?.h ?? defaultPos.h,
        isDraggable: canDrag,
        isResizable: canResize,
        static: !canDrag || widget.adminSettings.isLocked
      };
    });
  }, []);

  useEffect(() => {
    // Initialize widget tracker with grid info
    widgetTracker.initializeGrid({
      totalRows: 20,
      totalColumns: 12,
      gridWidth: 1200,
      gridHeight: 1000,
      rowHeight: 50,
      margin: [8, 8],
      containerPadding: [8, 8]
    });
    
    initializeWidgets()
  }, [])

  // Load DMCA script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://images.dmca.com/Badges/DMCABadgeHelper.min.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      const existingScript = document.querySelector('script[src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  const initializeWidgets = async () => {
    try {
      console.log('Initializing dynamic widgets...')
      
      // Fetch admin configurations from Strapi
      const adminConfigsResult = await fetchAdminWidgetConfigs();
      const adminConfigs: Record<string, any> = adminConfigsResult.success ? (adminConfigsResult.data || {}) : {};
      
      // Helper function to add admin settings to widgets
      const addAdminSettings = (widget: any) => ({
        ...widget,
        adminSettings: adminConfigs[widget.id] || { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false }
      });

      const defaultWidgets: Widget[] = [
        addAdminSettings({
          id: "weather",
          name: "Weather Widget",
          type: "weather",
          description: "Current weather conditions",
          size: "medium",
          category: "Information",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: true,
          settings: {
            apiKeys: { openweather: process.env.OPENWEATHER_API_KEY || "" },
            refreshInterval: 600000,
          },
        }),
        addAdminSettings({
          id: "breaking-news",
          name: "Breaking News",
          type: "news",
          description: "Live breaking news and alerts",
          size: "medium",
          category: "News",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: true,
          settings: {
            refreshInterval: 300000,
            advertisements: { enabled: true, slots: 2, content: [] },
          },
        }),
        addAdminSettings({
          id: "radio",
          name: "Radio Player",
          type: "media",
          description: "Live radio streaming",
          size: "medium",
          category: "Entertainment",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 30000,
          },
        }),
        addAdminSettings({
          id: "hot-deals",
          name: "Hot Deals",
          type: "business",
          description: "Latest deals and promotions with Groupon integration",
          size: "medium",
          category: "Business",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: true,
          settings: {
            refreshInterval: 1800000,
            advertisements: { enabled: true, slots: 3, content: [] },
          },
        }),
        addAdminSettings({
          id: "forum-activity",
          name: "Forum Activity",
          type: "social",
          description: "Latest forum discussions",
          size: "medium",
          category: "Community",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 180000,
          },
        }),
        addAdminSettings({
          id: "social-feed",
          name: "Social Media Feed",
          type: "social",
          description: "Real-time social media updates",
          size: "small",
          category: "Social",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 120000,
          },
        }),
        addAdminSettings({
          id: "trending",
          name: "Trending Topics",
          type: "social",
          description: "Hot trending topics and hashtags",
          size: "small",
          category: "Social",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 300000,
          },
        }),
        addAdminSettings({
          id: "youtube",
          name: "YouTube Videos",
          type: "media",
          description: "Featured YouTube content",
          size: "small",
          category: "Entertainment",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            apiKeys: { youtube: process.env.YOUTUBE_API_KEY || "" },
            refreshInterval: 900000,
          },
        }),
        addAdminSettings({
          id: "traffic",
          name: "Traffic Updates",
          type: "transport",
          description: "Live traffic updates",
          size: "large",
          category: "Information",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: true,
          settings: {
            apiKeys: { google: process.env.GOOGLE_MAPS_API_KEY || "" },
            refreshInterval: 300000,
          },
        }),
        addAdminSettings({
          id: "quick-links",
          name: "Quick Links",
          type: "navigation",
          description: "Quick access to popular sections",
          size: "small",
          category: "Navigation",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 3600000,
          },
        }),
        addAdminSettings({
          id: "photo-gallery",
          name: "Photo Gallery",
          type: "media",
          description: "User-submitted photos",
          size: "medium",
          category: "Media",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 600000,
          },
        }),
        addAdminSettings({
          id: "google-reviews",
          name: "Google Reviews",
          type: "business",
          description: "Latest Google reviews",
          size: "small",
          category: "Business",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 900000,
          },
        }),
        addAdminSettings({
          id: "currency-converter",
          name: "Currency Converter",
          type: "finance",
          description: "Real-time currency conversion with exchange rates",
          size: "small",
          category: "Finance",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 300000,
          },
        }),
        addAdminSettings({
          id: "search-widgets",
          name: "Search Widgets",
          type: "search",
          description: "Comprehensive search with site search, web search, and travel search",
          size: "xlarge",
          category: "Search",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 300000,
          },
        }),
        addAdminSettings({
          id: "flight-tracker",
          name: "Flight Tracker",
          type: "travel",
          description: "Live flight tracking and airport information",
          size: "large",
          category: "Travel",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 30000,
          },
        }),
        addAdminSettings({
          id: "food",
          name: "Food & Dining",
          type: "dining",
          description: "Restaurant recommendations and dining deals",
          size: "large",
          category: "Food & Dining",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 600000,
          },
        }),
        addAdminSettings({
          id: "cinema",
          name: "Cinema Showtimes",
          type: "entertainment",
          description: "Movie showtimes and cinema information",
          size: "large",
          category: "Entertainment",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 300000,
          },
        }),
      ]

      // Load user's saved layout
      const userLayoutResult = await loadUserLayout();
      const savedLayout = userLayoutResult.success ? userLayoutResult.data : null;
      
      // Generate layout from configurations and saved data
      const generatedLayout = generateLayoutFromWidgets(defaultWidgets, savedLayout);
      
      setWidgets(defaultWidgets);
      setLayout(generatedLayout);
      
      // Track initial layout
      trackLayoutChange(generatedLayout, defaultWidgets, 'initial');
      
      console.log('Dynamic widgets initialized successfully')
      setLoading(false)
    } catch (error) {
      console.error('Error initializing dynamic widgets:', error)
      setLoading(false)
    }
  }

  const handleToggleWidget = (widgetId: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w)))
  }

  const handleSaveLayout = async () => {
    await saveLayoutToApi(layout);
    console.log("Layout saved!");
  }

  const handleResetLayout = () => {
    // Reset to beautifully organized layout with logical content groupings
    const resetLayout: LayoutItem[] = [
      
      
      // 📰 NEWS & INFORMATION (Below search bar)
      { i: "weather", x: 0, y: 5, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "breaking-news", x: 3, y: 5, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "radio", x: 9, y: 5, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "hot-deals", x: 9, y: 11, w: 3, h: 8, isDraggable: true, isResizable: true, static: false },
      { i: "currency-converter", x: 9, y: 19, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      
      // 🎬 CINEMA (Below weather widget with same height)
      { i: "cinema", x: 0, y: 11, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      
      // 🍽️ FOOD (Below breaking news, spans wider but leaves space for currency converter)
      { i: "food", x: 3, y: 11, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      
      // ✈️ FLIGHT & SEARCH (Below cinema/food with 3:6:3 ratio like weather/radio/news)
      // Swap positions: move Google Reviews where Traffic was
      { i: "google-reviews", x: 9, y: 33, w: 3, h: 8, isDraggable: true, isResizable: true, static: false },
      { i: "search-widgets", x: 3, y: 17, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "youtube", x: 3, y: 23, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "flight-tracker", x: 0, y: 25, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      
      // 💬 SOCIAL & COMMUNITY
      { i: "social-feed", x: 9, y: 25, w: 3, h: 8, isDraggable: true, isResizable: true, static: false },
      // Trending same size as weather (w:3,h:6)
      { i: "trending", x: 0, y: 33, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      
      // Photo gallery just below featured videos (youtube) and forum below photo gallery
      { i: "photo-gallery", x: 3, y: 29, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "forum-activity", x: 3, y: 35, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      
      // 📅 EVENTS & ACTIVITIES (Time-sensitive, side by side)
      // Swap positions: move Traffic to where Google Reviews was, keep weather-sized height
      { i: "traffic", x: 0, y: 17, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "sports-fixtures", x: 0, y: 50, w: 6, h: 8, isDraggable: true, isResizable: true, static: false },
      
      // Quick access (quick-links) below trending, same size as weather
      { i: "quick-links", x: 0, y: 39, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      
    ];
    
    setLayout(resetLayout);
    
    // Track the reset layout
    trackLayoutChange(resetLayout, widgets, 'initial');
    
    // Clear saved layout from localStorage
    localStorage.removeItem("pattaya1-dynamic-layout");
    
    // Save the reset layout to API
    saveLayoutToApi(resetLayout);
    
    console.log('🔄 Layout reset to default positions');
  }

  /**
   * Handle layout changes (drag, resize)
   */
  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayout(newLayout);
    // Track widget positions and placements
    trackLayoutChange(newLayout, widgets, 'layout-change');
  }, [widgets]);

  /**
   * Handle drag stop - save layout to API
   */
  const handleDragStop = useCallback(async (newLayout: LayoutItem[], oldItem: LayoutItem, newItem: LayoutItem) => {
    await saveLayoutToApi(newLayout);
    // Track individual widget drag
    const widget = widgets.find(w => w.id === newItem.i);
    trackWidgetDrag(newItem.i, { x: newItem.x, y: newItem.y }, widget?.name);
  }, [saveLayoutToApi, widgets]);

  /**
   * Handle resize stop - save layout to API
   */
  const handleResizeStop = useCallback(async (newLayout: LayoutItem[], oldItem: LayoutItem, newItem: LayoutItem) => {
    await saveLayoutToApi(newLayout);
    // Track individual widget resize
    const widget = widgets.find(w => w.id === newItem.i);
    trackWidgetResize(newItem.i, newItem, widget?.name);
  }, [saveLayoutToApi, widgets]);

  /**
   * Handle widget deletion
   */
  const handleDeleteWidget = useCallback((widgetId: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    const updatedLayout = layout.filter(item => item.i !== widgetId);
    
    setWidgets(updatedWidgets);
    setLayout(updatedLayout);
    
    // Save the updated layout
    saveLayoutToApi(updatedLayout);
  }, [widgets, layout, saveLayoutToApi]);

  /**
   * Handle widget expansion
   */
  const handleExpandWidget = useCallback((widgetId: string) => {
    if (widgetId === 'weather') {
      setIsWeatherModalOpen(true);
      return;
    }
    
    const widget = widgets.find(w => w.id === widgetId);
    setModalContent({
      id: widgetId,
      name: widget?.name || 'Widget',
      content: `This is the expanded view of ${widget?.name || 'the widget'}. Here you would show detailed content like a 5-day weather forecast, full list of radio stations, etc.`
    });
    setIsModalOpen(true);
  }, [widgets]);

  /**
   * Close modal
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalContent(null);
  }, []);

  /**
   * Close weather modal
   */
  const closeWeatherModal = useCallback(() => {
    setIsWeatherModalOpen(false);
  }, []);

  // Weather data fetching functions
  const loadWeatherSettings = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("weather/settings"))
      if (response.ok) {
        const data = await response.json()
        setWeatherSettings(data.data)
      }
    } catch (error) {
      console.error("Failed to load weather settings:", error)
    }
  }, [])

  const loadWeatherData = useCallback(async () => {
    if (!weatherSettings) return

    try {
      setWeatherError(null)
      setWeatherLoading(true)

      let apiUrl = buildApiUrl("weather/current")
      const params = new URLSearchParams()

      if (location) {
        params.append('lat', location.lat.toString())
        params.append('lon', location.lon.toString())
      } else {
        params.append('lat', weatherSettings.defaultLatitude.toString())
        params.append('lon', weatherSettings.defaultLongitude.toString())
      }
      
      params.append('units', units || weatherSettings.units)
      apiUrl += `?${params.toString()}`

      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const data = await response.json()
        setWeatherData(data.data)
        console.log('Weather data loaded:', data.data.location.name)
      } else {
        throw new Error("Failed to fetch weather data")
      }
    } catch (err) {
      console.error("Weather loading error:", err)
      setWeatherError("Unable to load weather data")
      
      // Set fallback data
      setWeatherData({
        location: {
          name: weatherSettings.defaultCityName,
          lat: weatherSettings.defaultLatitude,
          lon: weatherSettings.defaultLongitude
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
        airQuality: undefined,
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
        units: units || weatherSettings.units,
        lastUpdated: new Date().toISOString(),
        source: "OpenWeatherMap"
      })
    } finally {
      setWeatherLoading(false)
    }
  }, [weatherSettings, location, units])

  // Load weather data when modal opens
  useEffect(() => {
    if (isWeatherModalOpen) {
      loadWeatherSettings()
    }
  }, [isWeatherModalOpen, loadWeatherSettings])

  useEffect(() => {
    if (weatherSettings && isWeatherModalOpen) {
      loadWeatherData()
    }
  }, [weatherSettings, isWeatherModalOpen, loadWeatherData])

  // Weather utility functions
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

  const visibleWidgets = widgets.filter((w) => w.isVisible)

  const getWidgetComponent = (widgetId: string) => {
    const componentMap: { [key: string]: any } = {
      "unified-search": UnifiedSearchWidget,
      "breaking-news": EnhancedBreakingNewsWidget,
      weather: EnhancedWeatherWidget,
      radio: RadioWidget,
      "google-reviews": GoogleReviewsWidget,
      youtube: FeaturedVideosWidget,
      "social-feed": SocialFeedWidget,
      trending: TrendingWidget,
      "hot-deals": EnhancedHotDealsWidget,
      "forum-activity": ForumActivityWidget,
      "photo-gallery": PhotoGalleryWidget,
      "currency-converter": CompactCurrencyConverterWidget,
      "live-events": LiveEventsWidget,
      "quick-links": QuickLinksWidget,
      traffic: TrafficWidget,
      "search-widgets": ThreeWidgetSearchLayout,
      "flight-tracker": FlightTrackerWidget,
      food: FoodWidget,
      cinema: CinemaWidget,
    }
    return componentMap[widgetId] || null
  }

  /**
   * Render individual widget with lazy loading
   */
  const renderWidget = (widget: Widget) => {
    const layoutItem = layout.find(item => item.i === widget.id);
    if (!layoutItem) return null;

    const WidgetComponent = getWidgetComponent(widget.id);
    if (!WidgetComponent) return null;

    // Special rendering for search widgets - make them look like real search bars
    const isSearchWidget = widget.id === 'unified-search';

    if (isSearchWidget) {
      return (
        <div key={widget.id} className="widget-container bg-transparent overflow-visible relative">
          <InView triggerOnce>
            {({ inView, ref }) => (
              <div ref={ref} className="widget-content h-full min-h-0">
                {inView ? (
                  <div className="widget-loaded h-full min-h-0 flex flex-col">
                    {/* Widget Header with Controls - Only show in edit mode */}
                    {isEditMode && (
                      <div className="widget-header bg-gradient-to-r from-pink-600 to-purple-600 text-white p-2 flex justify-between items-center mb-2 rounded-lg">
                        <div className="widget-title-section flex items-center gap-2">
                          <h3 className="widget-title text-xs font-semibold truncate">{widget.name}</h3>
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            {widget.category}
                          </Badge>
                        </div>
                        <div className="widget-actions flex gap-1">
                          {/* Drag Handle - Only show if admin allows dragging and edit mode is on */}
                          {widget.adminSettings.allowDrag && !widget.adminSettings.isLocked && (
                            <button
                              className="drag-handle p-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors cursor-move"
                              title="Drag to move widget"
                            >
                              <GripVertical className="w-3 h-3" />
                            </button>
                          )}
                          {/* Lock indicator for locked widgets */}
                          {widget.adminSettings.isLocked && (
                            <div className="p-1 rounded-md bg-yellow-500/20" title="Widget locked by admin">
                              🔒
                            </div>
                          )}
                          <button
                            className="expand-btn p-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
                            onClick={() => handleExpandWidget(widget.id)}
                            title="Expand widget"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                          {/* Delete button - only show if admin allows deletion and widget is not mandatory */}
                          {widget.adminSettings.allowDelete && !widget.isMandatory && !widget.adminSettings.isLocked && (
                            <button
                              className="delete-btn p-1 rounded-md bg-red-500/20 hover:bg-red-500/30 transition-colors"
                              onClick={() => handleDeleteWidget(widget.id)}
                              title="Delete widget"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Widget Body - No padding for search widgets */}
                    <div className="widget-body flex-1">
                      <div className="widget-inner-content h-full">
                        <WidgetComponent />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="widget-placeholder h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-4 rounded-lg">
                    <div className="loading-spinner text-2xl mb-2 animate-spin">⏳</div>
                    <p className="text-sm text-center">Loading {widget.name}...</p>
                  </div>
                )}
              </div>
            )}
          </InView>
        </div>
      );
    }

    // Regular widget rendering for non-search widgets
    return (
      <div key={widget.id} className="widget-container bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <InView triggerOnce>
          {({ inView, ref }) => (
            <div ref={ref} className="widget-content h-full min-h-0">
              {inView ? (
                <div className="widget-loaded h-full min-h-0 flex flex-col">
                  {/* Widget Header with Controls - Only show in edit mode */}
                  {isEditMode && (
                    <div className="widget-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 flex justify-between items-center">
                      <div className="widget-title-section flex items-center gap-2">
                        <h3 className="widget-title text-sm font-semibold truncate">{widget.name}</h3>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                          {widget.category}
                        </Badge>
                      </div>
                      <div className="widget-actions flex gap-1">
                        {/* Drag Handle - Only show if admin allows dragging and edit mode is on */}
                        {widget.adminSettings.allowDrag && !widget.adminSettings.isLocked && (
                          <button
                            className="drag-handle p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors cursor-move"
                            title="Drag to move widget"
                          >
                            <GripVertical className="w-3 h-3" />
                          </button>
                        )}
                        {/* Lock indicator for locked widgets */}
                        {widget.adminSettings.isLocked && (
                          <div className="p-1.5 rounded-md bg-yellow-500/20" title="Widget locked by admin">
                            🔒
                          </div>
                        )}
                        <button
                          className="expand-btn p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
                          onClick={() => handleExpandWidget(widget.id)}
                          title="Expand widget"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        {/* Delete button - only show if admin allows deletion and widget is not mandatory */}
                        {widget.adminSettings.allowDelete && !widget.isMandatory && !widget.adminSettings.isLocked && (
                          <button
                            className="delete-btn p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 transition-colors"
                            onClick={() => handleDeleteWidget(widget.id)}
                            title="Delete widget"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Widget Body */}
                  <div className="widget-body flex-1 min-h-0 p-0">
                    {(widget.id === 'flight-tracker' || widget.id === 'social-feed' || widget.id === 'google-reviews') ? (
                      <div className="widget-inner-content h-full min-h-0 overflow-auto">
                        <WidgetComponent />
                      </div>
                    ) : (
                      <div className="widget-inner-content h-full min-h-0">
                        {widget.id === 'weather' ? (
                          <WidgetComponent onExpand={() => handleExpandWidget(widget.id)} />
                        ) : (
                          <WidgetComponent />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="widget-placeholder h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-4">
                  <div className="loading-spinner text-2xl mb-2 animate-spin">⏳</div>
                  <p className="text-sm text-center">Loading {widget.name}...</p>
                </div>
              )}
            </div>
          )}
        </InView>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans antialiased">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Loading dynamic dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Scrolling Marquee */}
      <ScrollingMarquee />

      {/* Enhanced Edit Mode Control Header - Only for Authenticated Users */}
      {isEditMode && isAuthenticated && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 backdrop-blur-md border-b border-purple-300 px-4 sm:px-6 py-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl shadow-lg">
                  <Wand2 className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Make This Place Your Own</h2>
                  <p className="text-sm text-purple-100">Customize your dashboard layout</p>
                </div>
              </div>
              <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
                {visibleWidgets.length} Active Widgets
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Layout Button */}
              <Button 
                onClick={handleSaveLayout} 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Save className="w-4 h-4 mr-2 animate-pulse" />
                Save Layout
              </Button>

              {/* Reset Layout Button */}
              <Button 
                onClick={handleResetLayout} 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" style={{ animationDuration: '2s' }} />
                Reset to Default
              </Button>

              {/* Exit Edit Mode Button */}
              <Button 
                onClick={() => setIsEditMode(false)}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Exit Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Layout Button - Only for Authenticated Users */}
      {!isEditMode && isAuthenticated && (
        <div className="fixed top-20 right-4 z-40">
          <Button
            onClick={() => setIsEditMode(true)}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border-0"
          >
            <Wand2 className="w-5 h-5 mr-2 animate-pulse" />
            <span className="hidden sm:inline">Make This Place Your Own</span>
            <span className="sm:hidden">Customize</span>
          </Button>
        </div>
      )}

      {/* Unauthenticated User Message */}
      {!isEditMode && !isAuthenticated && (
        <div className="fixed top-20 right-4 z-40">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-4 py-3 max-w-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Sign in to customize layout</span>
            </div>
          </div>
        </div>
      )}

      {/* Apple-style Widget Admin Panel */}
      {showAdmin && (
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Card className="border-gray-100/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                  <span>Widget Management</span>
                  <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                    <Activity className="w-3 h-3 mr-1" />
                    Admin Mode
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                        widget.isVisible
                          ? "border-blue-200 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50"
                      }`}
                      onClick={() => handleToggleWidget(widget.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={widget.isVisible ? "default" : "secondary"} 
                            className={`text-xs font-medium ${
                              widget.isVisible 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {widget.size}
                          </Badge>
                          {widget.adminSettings.isLocked && (
                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                              🔒 Locked
                            </Badge>
                          )}
                        </div>
                        {widget.isVisible ? (
                          <Eye className="h-4 w-4 text-blue-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-900 line-clamp-2">{widget.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{widget.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-medium bg-white/50 border-gray-200 text-gray-600">
                          {widget.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/admin/widgets/${widget.id}`, "_blank")
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dynamic Grid Layout */}
      <div className="p-2 sm:p-4">
        <ResponsiveGridLayout
          className={`layout ${isEditMode ? 'edit-mode' : 'view-mode'}`}
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={50}
          width={1200}
          onLayoutChange={handleLayoutChange}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[12, 12]}
          containerPadding={[16, 16]}
          draggableHandle=".drag-handle"
        >
          {visibleWidgets.map(renderWidget)}
        </ResponsiveGridLayout>
      </div>

      {/* Expand Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-xl font-semibold">{modalContent.name} - Expanded View</h2>
              <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" onClick={closeModal}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <p className="text-gray-700 mb-4">{modalContent.content}</p>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm"><strong>Widget ID:</strong> {modalContent.id}</p>
                <p className="text-sm"><strong>Features:</strong> Full-screen view, detailed content, enhanced functionality</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Modal - Compact Size */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeWeatherModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] bg-white overflow-y-auto flex flex-col rounded-2xl shadow-2xl"
          >
            <div className="p-6 relative border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {weatherData && getWeatherIcon(weatherData.current.condition, "h-8 w-8")}
                    <span className="text-2xl font-semibold text-gray-900">Weather Details</span>
                    {weatherData?.alerts && weatherData.alerts.length > 0 && (
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                        ⚠️ Weather Alert
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadWeatherData} 
                    className="h-8 w-8 p-0 hover:bg-gray-100/80 rounded-full transition-colors" 
                    disabled={weatherLoading}
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${weatherLoading ? "animate-spin" : ""}`} />
                  </Button>
                  <button 
                    onClick={closeWeatherModal} 
                    className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1 scrollbar-hide">
              {weatherLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 text-blue-500 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading weather data...</p>
                  </div>
                </div>
              ) : weatherError ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                    <p className="text-red-600 font-medium">{weatherError}</p>
                    <Button onClick={loadWeatherData} variant="outline" size="sm" className="mt-3">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : weatherData ? (
                <>
                  {/* Compact Weather Header - Similar to widget */}
                  <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/15 to-purple-500/10 rounded-2xl p-6 border border-blue-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-900 text-lg">{weatherData.location.name}</span>
                        {weatherData.alerts && weatherData.alerts.length > 0 && (
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                        )}
                      </div>
                    </div>
                    
                    {/* Main Weather Display */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="text-6xl font-thin text-gray-900 tracking-tighter">
                        {Math.round(weatherData.current.temperature)}°
                      </div>
                      <div className="transform transition-transform duration-200">
                        {getWeatherIcon(weatherData.current.condition, "w-20 h-20")}
                      </div>
                    </div>
                    
                    <div className="text-left mb-4">
                      <div className="text-xl font-medium text-gray-700 capitalize">{weatherData.current.description}</div>
                      <div className="text-base text-gray-500">Feels like {Math.round(weatherData.current.feelsLike)}°</div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-white/60 rounded-xl">
                        <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <div className="text-sm font-semibold text-gray-900">{weatherData.current.humidity}%</div>
                        <div className="text-xs text-gray-600">Humidity</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 rounded-xl">
                        <Wind className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <div className="text-sm font-semibold text-gray-900">{Math.round(weatherData.current.windSpeed)}</div>
                        <div className="text-xs text-gray-600">Wind</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 rounded-xl">
                        <Sun className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                        <div className="text-sm font-semibold text-gray-900">{weatherData.current.uvIndex}</div>
                        <div className="text-xs text-gray-600">UV Index</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 rounded-xl">
                        <EyeIcon className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        <div className="text-sm font-semibold text-gray-900">{weatherData.current.visibility}</div>
                        <div className="text-xs text-gray-600">Visibility</div>
                      </div>
                    </div>
                  </div>

                  {/* Weather Alerts */}
                  {weatherData.alerts && weatherData.alerts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Weather Alerts
                      </h3>
                      {weatherData.alerts.map((alert, index) => (
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

                  {/* Hourly Forecast - Compact Style */}
                  {weatherData.hourly.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Hourly Forecast</h3>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {weatherData.hourly.map((hour, index) => (
                          <div key={index} className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200/50 min-w-[60px]">
                            <div className="text-xs text-gray-600 font-medium">{formatTime(new Date(hour.time))}</div>
                            {getWeatherIcon(hour.icon, "w-6 h-6")}
                            <div className="text-md font-semibold text-gray-900">{hour.temp}°</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Forecast - Compact Style */}
                  {weatherData.daily.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">5-Day Forecast</h3>
                      <div className="space-y-2">
                        {weatherData.daily.slice(0, 5).map((day, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              {getWeatherIcon(day.icon, "w-5 h-5")}
                              <span className="text-sm font-medium text-gray-800 w-20">{index === 0 ? 'Today' : formatDate(day.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">{day.low}°</span>
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-amber-400 rounded-full" style={{ width: `${((day.high - 20) / 15) * 100}%` }}></div>
                              </div>
                              <span className="font-semibold text-gray-900">{day.high}°</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <div>Data from {weatherData.source}</div>
                    <div>Last updated: {formatTime(new Date(weatherData.lastUpdated))}</div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Cloud className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Weather unavailable</p>
                    <p className="text-xs text-gray-400 mt-1">Please try again later</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="text-center py-4 text-sm text-gray-500 border-t border-gray-200 bg-white/80">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span>Pattaya1 Dashboard - Dynamic Grid Layout</span>
          <Badge variant="secondary">V2.0 Dynamic</Badge>
          <span className="hidden sm:inline">•</span>
          <span>{widgets.length} Total Widgets</span>
          <span className="hidden sm:inline">•</span>
          <span>{visibleWidgets.length} Visible</span>
        </div>
        
        {/* DMCA Protection Badge */}
        <div className="mt-3 flex justify-center">
          <a 
            href="//www.dmca.com/Protection/Status.aspx?ID=21b30fa5-25de-439b-9c20-c5a88c0f9f12" 
            title="DMCA.com Protection Status" 
            className="dmca-badge hover:opacity-80 transition-opacity duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src="https://images.dmca.com/Badges/DMCA_badge_grn_60w.png?ID=21b30fa5-25de-439b-9c20-c5a88c0f9f12" 
              alt="DMCA.com Protection Status"
              className="h-6 w-auto"
            />
          </a>
        </div>
      </div>
      
      {/* CSS for scrollbar-hide */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}