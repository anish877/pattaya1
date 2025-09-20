"use client"

import { useState, useEffect, useCallback } from "react"
import { Responsive, WidthProvider } from 'react-grid-layout';
import { InView } from 'react-intersection-observer';
import { Settings, BarChart3, Eye, EyeOff, ToggleLeft, ToggleRight, Activity, Sparkles, Save, RotateCcw, Move, Maximize2, X, GripVertical } from "lucide-react"
import { trackLayoutChange, trackWidgetResize, trackWidgetDrag, widgetTracker } from "@/lib/widget-tracker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

// Import all widgets
import { EnhancedBreakingNewsWidget } from "./widgets/enhanced-breaking-news-widget"
import { EnhancedWeatherWidget } from "../widgets/enhanced-weather-widget"
import { RadioWidget } from "./widgets/radio-widget"
import { YouTubeWidget } from "./widgets/youtube-widget"
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
import { CurrencyConverterWidget } from "../widgets/currency-converter-widget"
import { EnhancedHotDealsWidget } from "./widgets/enhanced-hot-deals-widget"
import { ScrollingMarquee } from "./scrolling-marquee"
import ThreeWidgetSearchLayout from "../search/three-widget-search-layout"
import FlightTrackerWidget from "../search/flight-tracker-widget"

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ResponsiveGridLayout component with width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

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

export function DynamicModularHomepage() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [layout, setLayout] = useState<LayoutItem[]>([])
  const [showAdmin, setShowAdmin] = useState(false)
  const [userRole, setUserRole] = useState<"admin" | "business" | "user">("admin")
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<{id: string, name: string, content: string} | null>(null)

  /**
   * Save user layout to backend API
   */
  const saveLayoutToApi = useCallback(async (currentLayout: LayoutItem[]) => {
    try {
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
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
  }, []);

  /**
   * Load user's saved layout from backend API
   */
  const loadUserLayout = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me/layout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
  }, []);

  /**
   * Fetch admin widget configurations from Strapi backend
   */
  const fetchAdminWidgetConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/widget-configs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loading admin widget configs from Strapi:', result);
        return { success: true, data: result };
      }
      
      // Fallback to default configurations if API fails
      const defaultConfigs = {
        "weather": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "breaking-news": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "radio": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "hot-deals": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "news-hero": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "business-spotlight": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "social-feed": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "trending": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "youtube": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "events-calendar": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "quick-links": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "photo-gallery": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "forum-activity": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "google-reviews": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "curator-social": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "currency-converter": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "traffic": { allowResize: true, allowDrag: true, allowDelete: false, isLocked: false },
        "search-widgets": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
        "flight-tracker": { allowResize: true, allowDrag: true, allowDelete: true, isLocked: false },
      };
      
      console.log('Using fallback admin widget configs:', defaultConfigs);
      return { success: true, data: defaultConfigs };
    } catch (error) {
      console.error('Failed to fetch admin widget configs:', error);
      return { success: false, error };
    }
  }, []);

  /**
   * Generate layout from widget configurations
   */
  const generateLayoutFromWidgets = useCallback((widgetConfigs: Widget[], savedLayout: any[] | null = null) => {
    return widgetConfigs.map((widget, index) => {
      // Check if there's a saved layout for this widget
      const savedItem = savedLayout?.find(item => item.i === widget.id);
      
      // Default grid positions based on your specified layout - More compact
      const defaultPositions: { [key: string]: { x: number, y: number, w: number, h: number } } = {
        "weather": { x: 0, y: 0, w: 2, h: 12 },
        "breaking-news": { x: 2, y: 0, w: 7, h: 6 },
        "radio": { x: 9, y: 0, w: 3, h: 12 },
        "hot-deals": { x: 2, y: 6, w: 7, h: 5 },
        "news-hero": { x: 0, y: 12, w: 6, h: 9 },
        "business-spotlight": { x: 6, y: 12, w: 6, h: 6 },
        "social-feed": { x: 6, y: 18, w: 3, h: 12 },
        "trending": { x: 9, y: 18, w: 3, h: 6 },
        "youtube": { x: 0, y: 21, w: 3, h: 9 },
        "events-calendar": { x: 3, y: 21, w: 3, h: 9 },
        "quick-links": { x: 9, y: 24, w: 3, h: 6 },
        "photo-gallery": { x: 0, y: 30, w: 6, h: 14 },
        "forum-activity": { x: 6, y: 30, w: 6, h: 4 },
        "google-reviews": { x: 6, y: 34, w: 3, h: 10 },
        "curator-social": { x: 9, y: 34, w: 3, h: 10 },
        "currency-converter": { x: 8, y: 44, w: 4, h: 8 },
        "traffic": { x: 0, y: 44, w: 8, h: 8 },
        "search-widgets": { x: 0, y: 52, w: 12, h: 8 },
        "flight-tracker": { x: 0, y: 60, w: 12, h: 8 },
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
          id: "news-hero",
          name: "News Hero",
          type: "news",
          description: "Featured news stories",
          size: "large",
          category: "News",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: true,
          settings: {
            refreshInterval: 300000,
          },
        }),
        addAdminSettings({
          id: "business-spotlight",
          name: "Business Spotlight",
          type: "business",
          description: "Featured local businesses",
          size: "medium",
          category: "Business",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
            refreshInterval: 600000,
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
          id: "events-calendar",
          name: "Events Calendar",
          type: "events",
          description: "Upcoming events and activities",
          size: "small",
          category: "Events",
          isVisible: true,
          isResizable: true,
          allowUserResizingAndMoving: true,
          isMandatory: false,
          settings: {
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
          id: "curator-social",
          name: "Curator Social",
          type: "social",
          description: "Curated social media content",
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
          id: "traffic",
          name: "Traffic Updates",
          type: "transport",
          description: "Live traffic updates",
          size: "xlarge",
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
    // Reset to the exact layout positions you specified - More compact
    const resetLayout: LayoutItem[] = [
      { i: "weather", x: 0, y: 0, w: 2, h: 12, isDraggable: true, isResizable: true, static: false },
      { i: "breaking-news", x: 2, y: 0, w: 7, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "radio", x: 9, y: 0, w: 3, h: 12, isDraggable: true, isResizable: true, static: false },
      { i: "hot-deals", x: 2, y: 6, w: 7, h: 5, isDraggable: true, isResizable: true, static: false },
      { i: "news-hero", x: 0, y: 12, w: 6, h: 9, isDraggable: true, isResizable: true, static: false },
      { i: "business-spotlight", x: 6, y: 12, w: 6, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "social-feed", x: 6, y: 18, w: 3, h: 12, isDraggable: true, isResizable: true, static: false },
      { i: "trending", x: 9, y: 18, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "youtube", x: 0, y: 21, w: 3, h: 9, isDraggable: true, isResizable: true, static: false },
      { i: "events-calendar", x: 3, y: 21, w: 3, h: 9, isDraggable: true, isResizable: true, static: false },
      { i: "quick-links", x: 9, y: 24, w: 3, h: 6, isDraggable: true, isResizable: true, static: false },
      { i: "photo-gallery", x: 0, y: 30, w: 6, h: 14, isDraggable: true, isResizable: true, static: false },
      { i: "forum-activity", x: 6, y: 30, w: 6, h: 4, isDraggable: true, isResizable: true, static: false },
      { i: "google-reviews", x: 6, y: 34, w: 3, h: 10, isDraggable: true, isResizable: true, static: false },
      { i: "curator-social", x: 9, y: 34, w: 3, h: 10, isDraggable: true, isResizable: true, static: false },
      { i: "currency-converter", x: 8, y: 44, w: 4, h: 8, isDraggable: true, isResizable: true, static: false },
      { i: "traffic", x: 0, y: 44, w: 8, h: 8, isDraggable: true, isResizable: true, static: false },
      { i: "search-widgets", x: 0, y: 52, w: 12, h: 8, isDraggable: true, isResizable: true, static: false },
      { i: "flight-tracker", x: 0, y: 60, w: 12, h: 8, isDraggable: true, isResizable: true, static: false }
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

  const visibleWidgets = widgets.filter((w) => w.isVisible)

  const getWidgetComponent = (widgetId: string) => {
    const componentMap: { [key: string]: any } = {
      "breaking-news": EnhancedBreakingNewsWidget,
      weather: EnhancedWeatherWidget,
      radio: RadioWidget,
      "google-reviews": GoogleReviewsWidget,
      youtube: YouTubeWidget,
      "social-feed": SocialFeedWidget,
      trending: TrendingWidget,
      "business-spotlight": BusinessSpotlightWidget,
      "hot-deals": EnhancedHotDealsWidget,
      "events-calendar": EventsCalendarWidget,
      "forum-activity": ForumActivityWidget,
      "photo-gallery": PhotoGalleryWidget,
      "currency-converter": CurrencyConverterWidget,
      "live-events": LiveEventsWidget,
      "quick-links": QuickLinksWidget,
      traffic: TrafficWidget,
      "search-widgets": ThreeWidgetSearchLayout,
      "flight-tracker": FlightTrackerWidget,
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

    return (
      <div key={widget.id} className="widget-container bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <InView triggerOnce>
          {({ inView, ref }) => (
            <div ref={ref} className="widget-content h-full">
              {inView ? (
                <div className="widget-loaded h-full flex flex-col">
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
                  <div className="widget-body flex-1 p-0">
                    <div className="widget-inner-content h-full">
                      <WidgetComponent />
                    </div>
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

      {/* Control Header */}
      {isEditMode && (
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Dynamic Widget Layout Editor</h2>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {visibleWidgets.length} Active Widgets
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSaveLayout} className="text-xs sm:text-sm">
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </Button>

              <Button variant="outline" size="sm" onClick={handleResetLayout} className="text-xs sm:text-sm bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const positions = widgetTracker.getCurrentPositions();
                  console.log('📊 Current Widget Positions:', positions);
                  console.table(positions.map(p => ({
                    'Widget': p.name,
                    'ID': p.id,
                    'Position': `(${p.x}, ${p.y})`,
                    'Size': `${p.w}×${p.h}`,
                    'Row/Col': `${p.row}/${p.column}`,
                    'Span': `${p.rowSpan}×${p.columnSpan}`,
                    'Operation': p.operation
                  })));
                }}
                className="text-xs sm:text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                📊 Log Positions
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const layoutData = widgetTracker.exportLayout();
                  console.log('📋 Exported Layout:', layoutData);
                  navigator.clipboard.writeText(layoutData).then(() => {
                    alert('Layout data copied to clipboard!');
                  });
                }}
                className="text-xs sm:text-sm bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                📋 Export Layout
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('🎯 Widget Positions & Spans:');
                  console.log('=====================================');
                  
                  layout.forEach((item, index) => {
                    const widget = widgets.find(w => w.id === item.i);
                    console.log(`${index + 1}. ${widget?.name || 'Unknown Widget'} (${item.i})`);
                    console.log(`   📍 Position: (${item.x}, ${item.y})`);
                    console.log(`   📏 Size: ${item.w} × ${item.h} grid units`);
                    console.log(`   📊 Row Span: ${item.h} rows`);
                    console.log(`   📊 Column Span: ${item.w} columns`);
                    console.log(`   🔧 Draggable: ${item.isDraggable ? '✅' : '❌'}`);
                    console.log(`   🔧 Resizable: ${item.isResizable ? '✅' : '❌'}`);
                    console.log(`   🔒 Static: ${item.static ? '🔒' : '🔓'}`);
                    console.log('   ─────────────────────────────────');
                  });
                  
                  console.log(`\n📈 Grid Summary:`);
                  console.log(`   Total Widgets: ${layout.length}`);
                  console.log(`   Grid Columns: 12`);
                  console.log(`   Max Row: ${Math.max(...layout.map(item => item.y + item.h), 0)}`);
                  console.log(`   Total Grid Cells: ${12 * (Math.max(...layout.map(item => item.y + item.h), 0) + 1)}`);
                  console.log(`   Occupied Cells: ${layout.reduce((total, item) => total + (item.w * item.h), 0)}`);
                }}
                className="text-xs sm:text-sm bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                🎯 Log Positions & Spans
              </Button>

              <div className="flex items-center gap-2">
                <Switch checked={isEditMode} onCheckedChange={setIsEditMode} id="edit-mode" />
                <label htmlFor="edit-mode" className="text-sm font-medium">
                  Edit Mode
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Edit Mode Button (when not in edit mode) */}
      {!isEditMode && (
        <div className="fixed top-20 right-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
            className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Edit Layout</span>
            <span className="sm:hidden">Edit</span>
          </Button>
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
          margin={[8, 8]}
          containerPadding={[8, 8]}
          draggableHandle=".drag-handle"
        >
          {widgets.map(renderWidget)}
        </ResponsiveGridLayout>
      </div>

      {/* Expand Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
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
    </div>
  )
}
