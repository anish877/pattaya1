"use client"

import CompactComprehensiveSearchWidget from "./compact-comprehensive-search-widget"
import TravelSearchWidget from "./travel-search-widget"

interface ThreeWidgetSearchLayoutProps {
  variant?: 'compact' | 'full'
}

export default function ThreeWidgetSearchLayout({ variant = 'compact' }: ThreeWidgetSearchLayoutProps) {
  if (variant === 'full') {
    return (
      <div className="w-full space-y-6">
        {/* Full comprehensive search widget */}
        <div className="w-full">
          <CompactComprehensiveSearchWidget />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {/* Travel Search Only - Site and Web search are in unified search above */}
      <div className="w-full">
        {/* Travel Search Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <TravelSearchWidget />
        </div>
      </div>

      {/* Responsive behavior for smaller screens */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .grid-cols-1.lg\\:grid-cols-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .grid-cols-1.lg\\:grid-cols-3 {
            grid-template-columns: 1fr;
          }
          
          .h-\\[500px\\] {
            height: 400px;
          }
        }
        
        @media (max-width: 640px) {
          .h-\\[500px\\] {
            height: 350px;
          }
        }
      `}</style>
    </div>
  )
}
