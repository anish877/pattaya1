"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Search, Globe, Image, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  suggestion: string
}

interface WebSearchResponse {
  success: boolean
  data: {
    query: string
    totalResults: number
    searchTime: number
    results: WebSearchResult[]
    pagination: {
      currentPage: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
      nextPageStart: number | null
      previousPageStart: number | null
    }
  }
  meta: {
    query: string
    page: number
    resultsPerPage: number
    totalResults: number
    searchTime: number
  }
}

export default function WebSearchWidget() {
  const [query, setQuery] = useState('')
  const [webResults, setWebResults] = useState<WebSearchResult[]>([])
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [searchTime, setSearchTime] = useState(0)
  const [activeTab, setActiveTab] = useState('web')
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle search suggestions as user types
  useEffect(() => {
    if (query.length >= 2) {
      const debounceTimer = setTimeout(() => {
        loadSuggestions(query)
      }, 300)
      return () => clearTimeout(debounceTimer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

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

  const loadSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(` http://localhost:1337/api/web-search/suggestions?query=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data || [])
          setShowSuggestions(true)
        }
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const performWebSearch = async (searchQuery: string, page = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(` http://localhost:1337/api/web-search?query=${encodeURIComponent(searchQuery)}&page=${page}&num=8`)
      if (response.ok) {
        const data: WebSearchResponse = await response.json()
        if (data.success) {
          setWebResults(data.data.results)
          setTotalResults(data.data.totalResults)
          setSearchTime(data.data.searchTime)
          setCurrentPage(page)
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
      const response = await fetch(` http://localhost:1337/api/web-search/images?query=${encodeURIComponent(searchQuery)}&num=8&imgSize=medium`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setImageResults(data.data.results || [])
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
      if (activeTab === 'web') {
        performWebSearch(query, 1)
      } else {
        performImageSearch(query)
      }
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.suggestion)
    setShowSuggestions(false)
    if (activeTab === 'web') {
      performWebSearch(suggestion.suggestion, 1)
    } else {
      performImageSearch(suggestion.suggestion)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (query.trim()) {
      performWebSearch(query, newPage)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web Search
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search the web..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm"
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setWebResults([])
                    setImageResults([])
                    setShowSuggestions(false)
                  }}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 text-sm">{suggestion.suggestion}</div>
                  <Search className="h-3 w-3 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Web
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
          </TabsList>

          {/* Results Info */}
          {(webResults.length > 0 || imageResults.length > 0) && !loading && (
            <div className="flex items-center justify-between text-sm text-gray-600 py-2">
              <span>
                {formatNumber(totalResults)} results ({searchTime.toFixed(3)} seconds)
              </span>
              {activeTab === 'web' && (
                <span>Page {currentPage}</span>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Searching...</p>
            </div>
          )}

          {/* Web Results */}
          <TabsContent value="web" className="space-y-3 max-h-96 overflow-y-auto">
            {webResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
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
          </TabsContent>

          {/* Image Results */}
          <TabsContent value="images" className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
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
          </TabsContent>
        </Tabs>

        {/* Pagination for Web Results */}
        {activeTab === 'web' && webResults.length > 0 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= 10} // Google CSE limit
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* No Results */}
        {!loading && ((activeTab === 'web' && webResults.length === 0) || (activeTab === 'images' && imageResults.length === 0)) && query && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">No results found for "{query}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
