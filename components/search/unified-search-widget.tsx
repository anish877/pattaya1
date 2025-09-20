"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Search, Globe, Filter, TrendingUp, X, ChevronDown, ExternalLink, Clock, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Import the existing search components to reuse their logic
import CompactComprehensiveSearchWidget from './compact-comprehensive-search-widget'
import WebSearchWidget from './web-search-widget'

interface SearchResult {
  title: string
  content: string
  source: string
  category: string
  url: string
  contentType: string
  publishedAt: string
  featuredImage?: string
  isBreaking?: boolean
  severity?: string
  sponsorName?: string
  type?: string
}

interface WebSearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
  htmlTitle: string
  htmlSnippet: string
  image?: {
    src: string
    width: number
    height: number
  }
  thumbnail?: {
    src: string
    width: number
    height: number
  }
}

interface ImageSearchResult {
  title: string
  link: string
  image: {
    src: string
    width: number
    height: number
  }
  thumbnail: {
    src: string
    width: number
    height: number
  }
}

interface SearchSuggestion {
  text?: string
  suggestion?: string
  type: string
  source: string
  category: string
}

interface TrendingTopic {
  query: string
  rank: number
  category: string
  searchCount?: number
}

interface SearchFacets {
  categories: string[]
  sources: string[]
  contentTypes: string[]
  severities: string[]
}

import { createPortal } from 'react-dom'

interface UnifiedSearchProps { compact?: boolean }

export default function UnifiedSearchWidget({ compact = false }: UnifiedSearchProps) {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'site' | 'web'>('site')
  const [activeTab, setActiveTab] = useState('web')
  
  // Site search state
  const [siteResults, setSiteResults] = useState<SearchResult[]>([])
  const [siteSuggestions, setSiteSuggestions] = useState<SearchSuggestion[]>([])
  const [trending, setTrending] = useState<TrendingTopic[]>([])
  const [facets, setFacets] = useState<SearchFacets | null>(null)
  const [showSiteFilters, setShowSiteFilters] = useState(false)
  const [showTrending, setShowTrending] = useState(false)
  const [siteCurrentPage, setSiteCurrentPage] = useState(0)
  const [siteTotalResults, setSiteTotalResults] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSource, setSelectedSource] = useState('')
  const [selectedContentType, setSelectedContentType] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('')
  
  // Web search state
  const [webResults, setWebResults] = useState<WebSearchResult[]>([])
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([])
  const [webSuggestions, setWebSuggestions] = useState<SearchSuggestion[]>([])
  const [webCurrentPage, setWebCurrentPage] = useState(1)
  const [webTotalResults, setWebTotalResults] = useState(0)
  const [searchTime, setSearchTime] = useState(0)
  
  // Common state
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null)

  const updateDropdownRect = () => {
    const el = formRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({ 
      left: rect.left + window.scrollX, 
      top: rect.bottom + window.scrollY + 4, // Add small gap
      width: rect.width 
    })
  }

  useEffect(() => {
    updateDropdownRect()
    const onResize = () => updateDropdownRect()
    const onScroll = () => updateDropdownRect()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  const suggestionsRef = useRef<HTMLDivElement>(null)
  const hitsPerPage = 5
  const isWebMode = searchMode === 'web'
  const isSiteMode = searchMode === 'site'

  // Load trending topics and facets on component mount
  useEffect(() => {
    loadTrendingTopics()
    loadFacets()
  }, [])

  // Handle search suggestions as user types
  useEffect(() => {
    if (query.length >= 2) {
      const debounceTimer = setTimeout(() => {
        if (searchMode === 'site') {
          loadSiteSuggestions(query)
        } else {
          loadWebSuggestions(query)
        }
      }, 300)
      return () => clearTimeout(debounceTimer)
    } else {
      setSiteSuggestions([])
      setWebSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, searchMode])

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTrendingTopics = async () => {
    try {
      const response = await fetch('/api/search/trending?limit=5')
      if (response.ok) {
        const data = await response.json()
        setTrending(data.data)
      }
    } catch (error) {
      console.error('Error loading trending topics:', error)
    }
  }

  const loadFacets = async () => {
    try {
      const response = await fetch('/api/search/facets')
      if (response.ok) {
        const data = await response.json()
        setFacets(data.data)
      }
    } catch (error) {
      console.error('Error loading facets:', error)
    }
  }

  const loadSiteSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(searchQuery)}&limit=3`)
      if (response.ok) {
        const data = await response.json()
        setSiteSuggestions(data.data)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error loading site suggestions:', error)
    }
  }

  const loadWebSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`https://api.pattaya1.com/api/web-search/suggestions?query=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const normalized = Array.isArray(data.data)
            ? data.data.map((item: any) => (typeof item === 'string'
                ? { text: item, suggestion: item, type: 'web', source: 'cse', category: 'web' }
                : { text: item.text || item.suggestion || '', ...item }
              ))
            : []
          setWebSuggestions(normalized)
          setShowSuggestions(true)
        }
      }
    } catch (error) {
      console.error('Error loading web suggestions:', error)
    }
  }

  const performSiteSearch = async (searchQuery: string, page = 0) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      // Build filters string
      const filters = []
      if (selectedCategory) filters.push(`category:${selectedCategory}`)
      if (selectedSource) filters.push(`source:${selectedSource}`)
      if (selectedContentType) filters.push(`contentType:${selectedContentType}`)
      if (selectedSeverity) filters.push(`severity:${selectedSeverity}`)
      
      const filtersParam = filters.length > 0 ? `&filters=${filters.join(',')}` : ''
      const url = `/api/search/unified?query=${encodeURIComponent(searchQuery)}&page=${page}&hitsPerPage=${hitsPerPage}${filtersParam}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSiteResults(data.data)
        setSiteTotalResults(data.meta.pagination.total)
        setSiteCurrentPage(page)
      }
    } catch (error) {
      console.error('Error performing site search:', error)
    } finally {
      setLoading(false)
      setShowSuggestions(false)
    }
  }

  const performWebSearch = async (searchQuery: string, page = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`https://api.pattaya1.com/api/web-search?query=${encodeURIComponent(searchQuery)}&page=${page}&num=8`)
      if (response.ok) {
        const data = await response.json()
        if (data && (data.success === true || data.status === 'ok')) {
          const payload = data.data || data
          const results = (payload.results || payload.items || []) as any[]
          const normalized = results.map((r: any) => ({
            title: r.title || r.htmlTitle || '',
            link: r.link || r.url || '',
            snippet: r.snippet || r.summary || '',
            displayLink: r.displayLink || r.source || '',
            htmlTitle: r.htmlTitle || r.title || '',
            htmlSnippet: r.htmlSnippet || r.snippet || '',
            image: r.image,
            thumbnail: r.thumbnail
          }))
          setWebResults(normalized)
          setWebTotalResults(payload.totalResults || payload.total || normalized.length)
          setSearchTime(payload.searchTime || 0)
          setWebCurrentPage(page)
        } else {
          setWebResults([])
        }
      }
    } catch (error) {
      console.error('Error performing web search:', error)
    } finally {
      setLoading(false)
      setShowSuggestions(false)
    }
  }

  const performImageSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`https://api.pattaya1.com/api/web-search/images?query=${encodeURIComponent(searchQuery)}&num=8&imgSize=medium`)
      if (response.ok) {
        const data = await response.json()
        if (data && (data.success === true || data.status === 'ok')) {
          const payload = data.data || data
          const results = (payload.results || payload.items || []) as any[]
          const normalized = results.map((r: any) => ({
            title: r.title || '',
            link: r.link || r.image?.src || '',
            image: r.image || r.thumbnail || null,
            thumbnail: r.thumbnail || r.image || null,
          }))
          setImageResults(normalized)
        } else {
          setImageResults([])
        }
      }
    } catch (error) {
      console.error('Error performing image search:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      updateDropdownRect() // Ensure rect is updated before showing results
      if (searchMode === 'site') {
        performSiteSearch(query, 0)
      } else {
        if (activeTab === 'web') {
          performWebSearch(query, 1)
        } else {
          performImageSearch(query)
        }
      }
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const suggestionText = suggestion.text || suggestion.suggestion || ''
    setQuery(suggestionText)
    setShowSuggestions(false)
    if (searchMode === 'site') {
      performSiteSearch(suggestionText, 0)
    } else {
      if (activeTab === 'web') {
        performWebSearch(suggestionText, 1)
      } else {
        performImageSearch(suggestionText)
      }
    }
  }

  const handleTrendingClick = (topic: TrendingTopic) => {
    setQuery(topic.query)
    if (searchMode === 'site') {
      performSiteSearch(topic.query, 0)
    } else {
      if (activeTab === 'web') {
        performWebSearch(topic.query, 1)
      } else {
        performImageSearch(topic.query)
      }
    }
    setShowTrending(false)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedSource('')
    setSelectedContentType('')
    setSelectedSeverity('')
    if (query) {
      if (searchMode === 'site') {
        performSiteSearch(query, 0)
      } else {
        if (activeTab === 'web') {
          performWebSearch(query, 1)
        } else {
          performImageSearch(query)
        }
      }
    }
  }

  const getContentTypeBadge = (contentType: string, isBreaking?: boolean, severity?: string) => {
    if (contentType === 'sponsored-post') {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">SPONSORED</Badge>
    }
    if (isBreaking) {
      const severityColor = severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
      return <Badge variant="secondary" className={`${severityColor} text-xs`}>BREAKING</Badge>
    }
    return <Badge variant="outline" className="text-xs">{contentType.replace('-', ' ').toUpperCase()}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const siteTotalPages = Math.ceil(siteTotalResults / hitsPerPage)
  const webTotalPages = Math.ceil(webTotalResults / 8)

  const currentSuggestions = searchMode === 'site' ? siteSuggestions : webSuggestions

  // Web search now handled internally with same styling as site search

  return (
    <div className="h-full w-full">
      
      {/* Transparent background container */}
      <div className="h-full bg-transparent relative">

        {/* Clean, centered search container */}
        <div className={`flex flex-col items-center justify-center h-full ${compact ? 'px-0 py-0' : 'px-6 py-8'} relative z-10`}>
          {/* Simple, clean search bar */}
          <div className={`w-full ${compact ? 'max-w-xl' : 'max-w-3xl'}`}>
            <form ref={formRef} onSubmit={handleSearch} className={`flex items-center gap-1 bg-white rounded-xl shadow-lg border-2 ${compact ? 'px-2 py-1 h-8' : 'p-2'} transition-all duration-150 relative ${
              searchMode === 'site' 
                ? 'border-pink-200 hover:border-pink-300 focus-within:border-pink-400' 
                : 'border-purple-200 hover:border-purple-300 focus-within:border-purple-400'
            }`} style={{
              boxShadow: searchMode === 'site' 
                ? '0 0 0 1px rgba(236, 72, 153, 0.1), 0 0 12px rgba(236, 72, 153, 0.15), 0 0 24px rgba(236, 72, 153, 0.1), 0 0 36px rgba(236, 72, 153, 0.08), 0 0 48px rgba(236, 72, 153, 0.06), 0 0 60px rgba(236, 72, 153, 0.04), 0 0 72px rgba(236, 72, 153, 0.03), 0 0 84px rgba(236, 72, 153, 0.02), 0 0 96px rgba(236, 72, 153, 0.01)' 
                : '0 0 0 1px rgba(168, 85, 247, 0.1), 0 0 12px rgba(168, 85, 247, 0.15), 0 0 24px rgba(168, 85, 247, 0.1), 0 0 36px rgba(168, 85, 247, 0.08), 0 0 48px rgba(168, 85, 247, 0.06), 0 0 60px rgba(168, 85, 247, 0.04), 0 0 72px rgba(168, 85, 247, 0.03), 0 0 84px rgba(168, 85, 247, 0.02), 0 0 96px rgba(168, 85, 247, 0.01)',
              transition: 'all 0.15s ease-in-out'
            }}>
              {/* Subtle search icon with gentle glow */}
              <Search className={`${compact ? 'h-3 w-3 ml-1' : 'h-5 w-5 ml-3'} transition-all duration-150 ${
                searchMode === 'site' ? 'text-pink-500' : 'text-purple-500'
              }`} style={{
                filter: searchMode === 'site' 
                  ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.3))' 
                  : 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.3))'
              }} />
              
              {/* Search input */}
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={
                  compact 
                    ? (searchMode === 'site' ? "Search site..." : "Search web...")
                    : (searchMode === 'site' 
                        ? "Search news, articles, events, businesses..." 
                        : "Search the entire web, images, videos...")
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`flex-1 border-0 bg-transparent ${compact ? 'text-xs h-6' : 'text-lg'} placeholder:text-gray-500 focus:ring-0 focus:outline-none text-gray-900`}
                onFocus={() => {
                  updateDropdownRect()
                  if (query.length >= 2) setShowSuggestions(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch(e as unknown as React.FormEvent)
                  }
                }}
              />
              
              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSiteResults([])
                    setWebResults([])
                    setImageResults([])
                    setShowSuggestions(false)
                  }}
                  className={`${compact ? 'p-1' : 'p-2'} rounded-full hover:bg-gray-100 transition-colors`}
                >
                  <X className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
                </button>
              )}

              {/* Inline quick icons */}
              {isSiteMode && (
                <button
                  type="button"
                  onClick={() => setShowSiteFilters(!showSiteFilters)}
                  className={`rounded-md hover:bg-gray-100 transition-colors ${compact ? 'p-1' : 'p-1.5'}`}
                  title="Advanced Filters"
                  aria-label="Advanced Filters"
                >
                  <Filter className={`${compact ? 'h-4 w-4' : 'h-4 w-4'} text-gray-500`} />
                </button>
              )}
              {isSiteMode && (
                <button
                  type="button"
                  onClick={() => setShowTrending(!showTrending)}
                  className={`rounded-md hover:bg-gray-100 transition-colors ${compact ? 'p-1' : 'p-1.5'}`}
                  title="Hot Topics"
                  aria-label="Hot Topics"
                >
                  <TrendingUp className={`${compact ? 'h-4 w-4' : 'h-4 w-4'} text-gray-500`} />
                </button>
              )}
              
              {/* Web search tabs - only show when in web mode and not compact */}
              {isWebMode && !compact && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('web')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'web' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Globe className="h-3 w-3 inline mr-1" />
                    Web
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('images')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'images' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Image className="h-3 w-3 inline mr-1" />
                    Images
                  </button>
                </div>
              )}
              
              {/* Subtle mode toggle with gentle glow */}
              <Select value={searchMode} onValueChange={(value: 'site' | 'web') => setSearchMode(value)}>
                <SelectTrigger className={`${compact ? 'w-16 h-6' : 'w-24 h-10'} border-0 bg-transparent hover:bg-gray-50 rounded-lg transition-all duration-150 ${
                  searchMode === 'site' ? 'text-pink-600' : 'text-purple-600'
                }`} style={{
                  boxShadow: searchMode === 'site' 
                    ? '0 0 6px rgba(236, 72, 153, 0.2)' 
                    : '0 0 6px rgba(168, 85, 247, 0.2)'
                }}>
                  <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
                    {searchMode === 'site' ? (
                      <Search className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    ) : (
                      <Globe className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    )}
                    <span className={`font-medium ${compact ? 'text-xs' : ''}`}>
                      {searchMode === 'site' ? 'Site' : 'Web'}
                    </span>
                    {!compact && <ChevronDown className="h-3 w-3" />}
                  </div>
                </SelectTrigger>
                <SelectContent className="border-0 shadow-xl rounded-lg bg-white/95 backdrop-blur-sm transition-all duration-150">
                  <SelectItem value="site" className="flex items-center gap-2 hover:bg-pink-50 rounded-lg transition-all duration-150">
                    <Search className="h-4 w-4 text-pink-500" />
                    <span>Site Search</span>
                  </SelectItem>
                  <SelectItem value="web" className="flex items-center gap-2 hover:bg-purple-50 rounded-lg transition-all duration-150">
                    <Globe className="h-4 w-4 text-purple-500" />
                    <span>Web Search</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </form>
          </div>

          {/* Subtle search suggestions dropdown with gentle glow */}
          {showSuggestions && currentSuggestions.length > 0 && dropdownRect && createPortal(
            <div ref={suggestionsRef} className={`z-[99999] fixed bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-2xl max-h-64 overflow-y-auto transition-all duration-150 ${
              searchMode === 'site' 
                ? 'shadow-pink-200/20' 
                : 'shadow-purple-200/20'
            }`} style={{
              left: dropdownRect.left,
              top: dropdownRect.top + 4,
              width: dropdownRect.width,
              boxShadow: searchMode === 'site' 
                ? '0 10px 20px -5px rgba(236, 72, 153, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.1)' 
                : '0 10px 20px -5px rgba(168, 85, 247, 0.15), 0 0 0 1px rgba(168, 85, 247, 0.1)'
            }}>
              {currentSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-5 py-3 text-left transition-all duration-150 flex items-center justify-between border-b border-gray-100/50 last:border-b-0 ${
                    searchMode === 'site' 
                      ? 'hover:bg-pink-50/80' 
                      : 'hover:bg-purple-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-all duration-150 ${
                      searchMode === 'site' ? 'bg-pink-400' : 'bg-purple-400'
                    }`} style={{
                      boxShadow: searchMode === 'site' 
                        ? '0 0 4px rgba(236, 72, 153, 0.3)' 
                        : '0 0 4px rgba(168, 85, 247, 0.3)'
                    }}></div>
                    <span className="font-medium text-gray-900">{suggestion.text || suggestion.suggestion}</span>
                  </div>
                  <Search className={`h-4 w-4 transition-all duration-150 ${
                    searchMode === 'site' ? 'text-pink-400' : 'text-purple-400'
                  }`} style={{
                    filter: searchMode === 'site' 
                      ? 'drop-shadow(0 0 2px rgba(236, 72, 153, 0.2))' 
                      : 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.2))'
                  }} />
                </button>
              ))}
            </div>, document.body
          )}
        </div>
      </div>

      {/* Web tabs removed for cleaner inline experience */}

      {/* Subtle results container with gentle glow */}
      {((isSiteMode && siteResults.length > 0) || 
        (isWebMode && (webResults.length > 0 || imageResults.length > 0)) || 
        loading) && dropdownRect && createPortal(
        <div className={`fixed z-[99999] bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-2xl max-h-96 overflow-y-auto transition-all duration-150 ${
          searchMode === 'site' 
            ? 'shadow-pink-200/20' 
            : 'shadow-purple-200/20'
        }`} style={{
          left: dropdownRect?.left || 0,
          top: dropdownRect?.top || 0,
          width: dropdownRect?.width || 300,
          minWidth: '300px',
          boxShadow: searchMode === 'site' 
            ? '0 10px 20px -5px rgba(236, 72, 153, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.1)' 
            : '0 10px 20px -5px rgba(168, 85, 247, 0.15), 0 0 0 1px rgba(168, 85, 247, 0.1)'
        }}>
          {loading && (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
                searchMode === 'site' ? 'border-pink-600' : 'border-purple-600'
              }`} style={{
                boxShadow: searchMode === 'site' 
                  ? '0 0 8px rgba(236, 72, 153, 0.3)' 
                  : '0 0 8px rgba(168, 85, 247, 0.3)'
              }}></div>
              <p className={`mt-2 text-sm font-medium transition-colors duration-150 ${
                searchMode === 'site' ? 'text-pink-600' : 'text-purple-600'
              }`}>Searching...</p>
            </div>
          )}

          {/* Site Search Results */}
          {isSiteMode && siteResults.length > 0 && !loading && (
            <div className="p-4">
              <div className="text-sm text-gray-600 mb-3">
                {siteTotalResults} results found
              </div>
              <div className="space-y-3">
                {siteResults.map((result, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex gap-3">
                      {result.featuredImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={result.featuredImage}
                            alt=""
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-2 cursor-pointer"
                              dangerouslySetInnerHTML={{ __html: result.title }}
                              onClick={() => window.open(result.url, '_blank')}
                            />
                            <div className="flex items-center gap-1 mt-1">
                              {getContentTypeBadge(result.contentType, result.isBreaking, result.severity)}
                            </div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-gray-400 ml-2" />
                        </div>
                        
                        <p 
                          className="text-xs text-gray-600 line-clamp-2 mt-1"
                          dangerouslySetInnerHTML={{ __html: result.content }}
                        />
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>{result.source}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-2 w-2" />
                            {formatDate(result.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Site Search Pagination */}
              {siteTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={siteCurrentPage === 0}
                    onClick={() => performSiteSearch(query, siteCurrentPage - 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  
                  <span className="text-xs text-gray-600 px-3">
                    {siteCurrentPage + 1} of {siteTotalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={siteCurrentPage >= siteTotalPages - 1}
                    onClick={() => performSiteSearch(query, siteCurrentPage + 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Web Search Results */}
          {isWebMode && activeTab === 'web' && webResults.length > 0 && !loading && (
            <div className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>
                  {formatNumber(webTotalResults)} results ({searchTime.toFixed(3)} seconds)
                </span>
                <span>Page {webCurrentPage}</span>
              </div>
              
              <div className="space-y-3">
                {webResults.map((result, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex gap-3">
                      {result.thumbnail && (
                        <div className="flex-shrink-0">
                          <img
                            src={result.thumbnail.src}
                            alt=""
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: result.htmlTitle }}
                            />
                            <div className="text-xs text-green-600 mt-1">{result.displayLink}</div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-gray-400 ml-2" />
                        </div>
                        
                        <p 
                          className="text-xs text-gray-600 line-clamp-2 mt-1"
                          dangerouslySetInnerHTML={{ __html: result.htmlSnippet }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Web Search Pagination */}
              {webTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={webCurrentPage === 1}
                    onClick={() => performWebSearch(query, webCurrentPage - 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  
                  <span className="text-xs text-gray-600 px-3">
                    {webCurrentPage} of {webTotalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={webCurrentPage >= 10} // Google CSE limit
                    onClick={() => performWebSearch(query, webCurrentPage + 1)}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Image Search Results */}
          {isWebMode && activeTab === 'images' && imageResults.length > 0 && !loading && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {imageResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={result.link}
                        alt={result.title}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="p-2">
                        <p className="text-xs text-gray-900 line-clamp-2">{result.title}</p>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && (
            (isSiteMode && siteResults.length === 0) ||
            (isWebMode && activeTab === 'web' && webResults.length === 0) ||
            (isWebMode && activeTab === 'images' && imageResults.length === 0)
          ) && query && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">No results found for "{query}"</p>
            </div>
          )}
        </div>, document.body)
      }

      {/* Nightlife themed Quick Actions for Site Search with glow (hidden in compact/inline use) */}
      {!compact && isSiteMode && (
        <div className="flex justify-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSiteFilters(!showSiteFilters)}
            className={`text-sm font-medium transition-all duration-150 hover:scale-105 ${
              showSiteFilters 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg shadow-pink-200/50' 
                : 'border-pink-200 text-pink-700 hover:bg-pink-50 hover:border-pink-300'
            }`}
            style={{
              boxShadow: showSiteFilters 
                ? '0 10px 25px -5px rgba(236, 72, 153, 0.4), 0 0 0 1px rgba(236, 72, 153, 0.1)' 
                : '0 0 8px rgba(236, 72, 153, 0.2)'
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTrending(!showTrending)}
            className={`text-sm font-medium transition-all duration-150 hover:scale-105 ${
              showTrending 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg shadow-pink-200/50' 
                : 'border-pink-200 text-pink-700 hover:bg-pink-50 hover:border-pink-300'
            }`}
            style={{
              boxShadow: showTrending 
                ? '0 10px 25px -5px rgba(236, 72, 153, 0.4), 0 0 0 1px rgba(236, 72, 153, 0.1)' 
                : '0 0 8px rgba(236, 72, 153, 0.2)'
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Hot Topics
          </Button>
        </div>
      )}

      {/* Nightlife themed Site Search Filters with glow */}
      {searchMode === 'site' && showSiteFilters && facets && (
        <div className="flex justify-center mt-4">
          <div className="w-full max-w-3xl p-5 bg-white/90 backdrop-blur-sm border-0 rounded-xl shadow-lg transition-all duration-150" style={{
            boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.2), 0 0 0 1px rgba(236, 72, 153, 0.1)'
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-pink-600 transition-all duration-150" style={{
                filter: 'drop-shadow(0 0 6px rgba(236, 72, 153, 0.4))'
              }} />
              <h3 className="text-lg font-semibold text-gray-800">Refine Your Search</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Content Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 text-sm border-pink-200 focus:border-pink-400 rounded-lg transition-all duration-150">
                    <SelectValue placeholder="Choose category..." />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg rounded-lg bg-white/95 backdrop-blur-sm transition-all duration-150">
                    <SelectItem value="">All Categories</SelectItem>
                    {facets.categories.slice(0, 5).map(category => (
                      <SelectItem key={category} value={category} className="hover:bg-pink-50 rounded-lg transition-all duration-150">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Content Type</label>
                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger className="h-10 text-sm border-pink-200 focus:border-pink-400 rounded-lg transition-all duration-150">
                    <SelectValue placeholder="Choose type..." />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg rounded-lg bg-white/95 backdrop-blur-sm transition-all duration-150">
                    <SelectItem value="">All Types</SelectItem>
                    {facets.contentTypes.slice(0, 5).map(type => (
                      <SelectItem key={type} value={type} className="hover:bg-pink-50 rounded-lg transition-all duration-150">{type.replace('-', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nightlife themed Trending Topics with glow */}
      {searchMode === 'site' && showTrending && trending.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="w-full max-w-3xl p-5 bg-white/90 backdrop-blur-sm border-0 rounded-xl shadow-lg transition-all duration-150" style={{
            boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.2), 0 0 0 1px rgba(236, 72, 153, 0.1)'
          }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-pink-600 transition-all duration-150" style={{
                filter: 'drop-shadow(0 0 6px rgba(236, 72, 153, 0.4))'
              }} />
              <div className="text-lg font-semibold text-gray-800">Trending Topics</div>
            </div>
            <div className="space-y-2">
              {trending.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTrendingClick(topic)}
                  className="w-full text-left p-3 rounded-lg hover:bg-pink-50 transition-all duration-150 hover:scale-[1.01] group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-pink-800">{topic.query}</span>
                    <span className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded-full">#{topic.rank}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
