"use client"

import React from 'react'
import UnifiedSearchWidget from './unified-search-widget'

export function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Search Pattaya
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find news, events, businesses, and everything happening in Pattaya. 
            Search our local content or explore the entire web.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <UnifiedSearchWidget />
        </div>
      </div>
    </div>
  )
}


