// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Camera, Heart, MessageCircle, Eye, User, MapPin, Clock } from "lucide-react"
// import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"
// import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"

// interface PattayaPulsePhoto {
//   id: number
//   caption?: string
//   image?: {
//     id: number
//     name: string
//     url: string
//     formats?: {
//       thumbnail?: { url: string }
//       small?: { url: string }
//       medium?: { url: string }
//       large?: { url: string }
//     }
//   }
//   author?: {
//     id: number
//     username: string
//     email: string
//   }
//   hashtags?: Array<{
//     id: number
//     name: string
//     slug: string
//     color?: string
//   }>
//   location?: {
//     latitude: number
//     longitude: number
//     address?: string
//     city?: string
//     country: string
//   }
//   likes?: number
//   views?: number
//   width?: number
//   height?: number
//   orientation?: 'portrait' | 'landscape' | 'square'
//   sponsor_url?: string
//   featured?: boolean
//   uploaded_at?: string
//   approved_at?: string
//   createdAt?: string
// }

// export function PhotoGalleryWidget() {
//   const [photos, setPhotos] = useState<PattayaPulsePhoto[]>([])
//   const [currentPhoto, setCurrentPhoto] = useState(0)
//   const [loading, setLoading] = useState(true)
//   const [lightboxOpen, setLightboxOpen] = useState(false)
//   const [lightboxPhoto, setLightboxPhoto] = useState<PattayaPulsePhoto | null>(null)

//   useEffect(() => {
//     loadPhotoData()
//     const interval = setInterval(loadPhotoData, 180000) // Refresh every 3 minutes
//     return () => clearInterval(interval)
//   }, [])

//   useEffect(() => {
//     if (photos.length > 0) {
//       // Auto-rotate photos every 3 seconds
//       const interval = setInterval(() => {
//         setCurrentPhoto((prev) => (prev + 1) % photos.length)
//       }, 3000)
//       return () => clearInterval(interval)
//     }
//   }, [photos])

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (lightboxOpen && lightboxPhoto) {
//         if (event.key === 'Escape') {
//           closeLightbox()
//         } else if (event.key === 'ArrowLeft') {
//           const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
//           const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
//           setLightboxPhoto(photos[prevIndex])
//         } else if (event.key === 'ArrowRight') {
//           const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
//           const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
//           setLightboxPhoto(photos[nextIndex])
//         }
//       }
//     }

//     document.addEventListener('keydown', handleKeyDown)
//     return () => document.removeEventListener('keydown', handleKeyDown)
//   }, [lightboxOpen, lightboxPhoto, photos])

//   const loadPhotoData = async () => {
//     try {
//       setLoading(true)
//       console.log('Fetching Pattaya Pulse photos from Strapi...')
//       const response = await fetch(buildApiUrl("photos/latest?limit=5&populate=*"))

//       if (response.ok) {
//         const data = await response.json()

//         if (data.data && data.data.length > 0) {
//           setPhotos(data.data)
//         } else {
//           setPhotos([])
//         }
//       } else {
//         console.error("Failed to load Pattaya Pulse photos:", response.status)
//         setPhotos([])
//       }
//     } catch (error) {
//       console.error("Failed to load Pattaya Pulse photos:", error)
//       setPhotos([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const formatTimeAgo = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

//     if (diffInSeconds < 60) return "Just now"
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
//     if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
//     return date.toLocaleDateString()
//   }

//   const handlePhotoClick = (photo: PattayaPulsePhoto) => {
//     if (photo.sponsor_url) {
//       window.open(photo.sponsor_url, '_blank')
//     } else {
//       setLightboxPhoto(photo)
//       setLightboxOpen(true)
//     }
//   }

//   const closeLightbox = () => {
//     setLightboxOpen(false)
//     setLightboxPhoto(null)
//   }

//   if (loading) {
//     return (
//       <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-sm">
//         <CardContent className="p-6">
//           <div className="animate-pulse space-y-4">
//             <div className="h-5 bg-gray-100 rounded-full w-28"></div>
//             <div className="h-24 bg-gray-50 rounded-2xl"></div>
//             <div className="space-y-3">
//               <div className="h-4 bg-gray-100 rounded-full"></div>
//               <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   if (photos.length === 0) {
//     return (
//       <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-sm">
//         <CardHeader className="pb-4 px-6 pt-6">
//         <CardTitle className="text-base font-medium text-gray-900 flex items-center">
//           <Camera className="w-4 h-4 mr-2 text-gray-600" />
//           Pattaya Pulse
//         </CardTitle>
//         </CardHeader>
//         <CardContent className="px-6 pb-6">
//           <div className="text-center text-gray-400 py-12">
//             <p className="text-sm font-medium">No photos available</p>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   const photo = photos[currentPhoto]

//   return (
//     <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300">
//       {/* Global Sponsorship Banner */}
//       <SponsorshipBanner widgetType="photos" />
//       <CardHeader className="pb-4 px-6 pt-6">
//         <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
//           <div className="flex items-center">
//             <Camera className="w-4 h-4 mr-2 text-gray-600" />
//             Photo Gallery
//           </div>
//           <span className="text-xs text-gray-400 font-medium">
//             {photos.length} photos
//           </span>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="px-6 pb-6 space-y-4">
//         {/* Photo */}
//         <div className="relative cursor-pointer" onClick={() => handlePhotoClick(photo)}>
//           <img
//             src={photo.image ? buildStrapiUrl(photo.image.url) : "/placeholder.svg"}
//             alt={photo.caption || "Pattaya photo"}
//             className="w-full h-64 object-cover rounded-2xl shadow-sm hover:opacity-90 transition-opacity"
//           />
//           {photo.featured && (
//             <Badge className="absolute top-3 left-3 text-xs bg-yellow-500 text-white border-0 font-medium">
//               Featured
//             </Badge>
//           )}
//           {photo.sponsor_url && (
//             <Badge className="absolute top-3 right-3 text-xs bg-green-500 text-white border-0 font-medium">
//               Sponsored
//             </Badge>
//           )}
//           <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
//             {currentPhoto + 1}/{photos.length}
//           </div>
//         </div>

//         {/* Photo Info */}
//         <div className="space-y-3">
//           <div>
//             {photo.caption && (
//               <h3 className="text-sm font-medium text-gray-900 line-clamp-1 leading-tight">{photo.caption}</h3>
//             )}
//             <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
//               <div className="flex items-center space-x-1 min-w-0">
//                 <User className="w-3 h-3 flex-shrink-0" />
//                 <span className="truncate font-medium">{photo.author?.username || 'Anonymous'}</span>
//               </div>
//               <span className="flex-shrink-0 font-medium">{formatTimeAgo(photo.uploaded_at || photo.createdAt || '')}</span>
//             </div>
//           </div>

//           {photo.location?.address && (
//             <div className="flex items-center text-xs text-gray-500">
//               <MapPin className="w-3 h-3 mr-1" />
//               <span>{photo.location.address}</span>
//             </div>
//           )}

//           {/* Hashtags */}
//           {photo.hashtags && photo.hashtags.length > 0 && (
//             <div className="flex flex-wrap gap-1">
//               {photo.hashtags.slice(0, 2).map((hashtag) => (
//                 <Badge key={hashtag.id} variant="secondary" className="text-xs">
//                   #{hashtag?.name}
//                 </Badge>
//               ))}
//             </div>
//           )}

//           {/* Stats */}
//           <div className="flex items-center justify-between text-xs text-gray-400">
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-1">
//                 <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
//                 <span className="font-medium">{photo.likes || 0}</span>
//               </div>
//               <div className="flex items-center space-x-1">
//                 <Eye className="w-3 h-3 flex-shrink-0" />
//                 <span className="font-medium">{photo.views || 0}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Navigation dots */}
//         <div className="flex justify-center space-x-2">
//           {photos.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => setCurrentPhoto(index)}
//               className={`w-2 h-2 rounded-full transition-all duration-200 ${
//                 index === currentPhoto ? "bg-gray-600" : "bg-gray-200"
//               }`}
//             />
//           ))}
//         </div>
//       </CardContent>

//       {/* Lightbox Modal */}
//       {lightboxOpen && lightboxPhoto && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
//           <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
//             {/* Close Button */}
//             <button
//               onClick={closeLightbox}
//               className="absolute top-4 right-4 z-10 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>

//             {/* Image */}
//             <div className="relative">
//               <img
//                 src={lightboxPhoto.image ? buildStrapiUrl(lightboxPhoto.image.url) : "/placeholder.svg"}
//                 alt={lightboxPhoto.caption || "Pattaya photo"}
//                 className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
//               />

//               {/* Navigation Arrows */}
//               {photos.length > 1 && (
//                 <>
//                   <button
//                     onClick={() => {
//                       const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
//                       const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
//                       setLightboxPhoto(photos[prevIndex])
//                     }}
//                     className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
//                   >
//                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                     </svg>
//                   </button>
//                   <button
//                     onClick={() => {
//                       const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
//                       const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
//                       setLightboxPhoto(photos[nextIndex])
//                     }}
//                     className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
//                   >
//                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </button>
//                 </>
//               )}
//             </div>

//             {/* Photo Info in Lightbox */}
//             <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg p-4">
//               {lightboxPhoto.caption && (
//                 <h3 className="text-xl font-semibold text-gray-900 mb-2">{lightboxPhoto.caption}</h3>
//               )}
//               <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
//                 <div className="flex items-center space-x-1">
//                   <User className="w-4 h-4" />
//                   <span className="font-medium">{lightboxPhoto.author?.username || 'Anonymous'}</span>
//                 </div>
//                 <span className="font-medium">{formatTimeAgo(lightboxPhoto.uploaded_at || lightboxPhoto.createdAt || '')}</span>
//               </div>
//               {lightboxPhoto.location?.address && (
//                 <div className="flex items-center text-sm text-gray-500 mb-3">
//                   <MapPin className="w-4 h-4 mr-1" />
//                   <span>{lightboxPhoto.location.address}</span>
//                 </div>
//               )}

//               {/* Hashtags */}
//               {lightboxPhoto.hashtags && lightboxPhoto.hashtags.length > 0 && (
//                 <div className="flex flex-wrap gap-1 mb-3">
//                   {lightboxPhoto.hashtags.map((hashtag) => (
//                     <Badge key={hashtag.id} variant="secondary" className="text-xs">
//                       #{hashtag?.name}
//                     </Badge>
//                   ))}
//                 </div>
//               )}

//               {/* Stats */}
//               <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
//                 <div className="flex items-center space-x-4">
//                   <div className="flex items-center space-x-1">
//                     <Heart className="w-4 h-4 text-red-400" />
//                     <span className="font-medium">{lightboxPhoto.likes || 0}</span>
//                   </div>
//                   <div className="flex items-center space-x-1">
//                     <Eye className="w-4 h-4" />
//                     <span className="font-medium">{lightboxPhoto.views || 0}</span>
//                   </div>
//                 </div>
//                 {lightboxPhoto.featured && (
//                   <Badge className="text-xs bg-yellow-500 text-white border-0 font-medium">
//                     Featured
//                   </Badge>
//                 )}
//               </div>

//               {/* Submit Your Photo Button */}
//               <div className="text-center">
//                 <button
//                   onClick={() => {
//                     // Navigate to photo submission page
//                     window.location.href = '/photos/upload'
//                   }}
//                   className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   <Camera className="w-4 h-4 mr-2" />
//                   Submit Your Photo
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </Card>
//   )
// }

"use client"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Heart, Eye, User, MapPin, X, ChevronLeft, ChevronRight, Share2, Download } from "lucide-react"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"
import { SponsorshipBanner } from "@/components/widgets/sponsorship-banner"

interface PattayaPulsePhoto {
  id: number
  caption?: string
  image?: { id: number; name: string; url: string; formats?: any }
  author?: { id: number; username: string; email: string }
  hashtags?: Array<{ id: number; name: string; slug: string; color?: string }>
  location?: { latitude: number; longitude: number; address?: string; city?: string; country: string }
  likes?: number
  views?: number
  width?: number
  height?: number
  orientation?: 'portrait' | 'landscape' | 'square'
  sponsor_url?: string
  featured?: boolean
  uploaded_at?: string
  approved_at?: string
  createdAt?: string
}
export function PhotoGalleryWidget() {
  const [photos, setPhotos] = useState<PattayaPulsePhoto[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<PattayaPulsePhoto | null>(null)
  const [mounted, setMounted] = useState(false)
  const autoSlideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => { setMounted(true); loadPhotoData(); const interval = setInterval(loadPhotoData, 180000); return () => clearInterval(interval) }, [])
  useEffect(() => { if (photos.length > 1) { startAutoSlide() } return () => stopAutoSlide() }, [photos, currentPhotoIndex])
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!lightboxOpen || !lightboxPhoto) return
      if (event.key === 'Escape') closeLightbox()
      else if (event.key === 'ArrowLeft') showPreviousPhoto()
      else if (event.key === 'ArrowRight') showNextPhoto()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxPhoto, photos])
  const startAutoSlide = () => {
    stopAutoSlide()
    autoSlideTimeoutRef.current = setTimeout(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    }, 4000)
  }
  const stopAutoSlide = () => {
    if (autoSlideTimeoutRef.current) clearTimeout(autoSlideTimeoutRef.current)
  }
  const loadPhotoData = async () => {
    try {
      !photos.length && setLoading(true)
      const response = await fetch(buildApiUrl("photos/latest?limit=8&populate=*"))
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.data?.length ? data.data : [])
      } else setPhotos([])
    } catch {
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }
  const handlePhotoClick = (photo: PattayaPulsePhoto) => {
    stopAutoSlide()
    if (photo.sponsor_url) {
      window.open(photo.sponsor_url, '_blank')
    } else {
      setLightboxPhoto(photo)
      setLightboxOpen(true)
    }
  }
  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxPhoto(null)
    startAutoSlide()
  }
  const showPreviousPhoto = () => {
    if (!lightboxPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id);
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    setLightboxPhoto(photos[prevIndex]);
  };
  const showNextPhoto = () => {
    if (!lightboxPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id);
    const nextIndex = (currentIndex + 1) % photos.length;
    setLightboxPhoto(photos[nextIndex]);
  };

  // --- UI COMPONENTS ---
  const LightboxModal = () => {
    if (!lightboxOpen || !lightboxPhoto || !mounted) return null
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#181928]/90 via-[#2b254e]/80 to-[#153347]/80 backdrop-blur-lg animate-fade-in" onClick={closeLightbox}>
        <div
          className="relative max-w-6xl w-full max-h-[90vh] grid grid-cols-1 lg:grid-cols-3 gap-0 bg-gradient-to-br from-black/50 via-[#34365e]/30 to-[#24497a]/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_4px_50px_-5px_rgba(103,63,255,0.26)] ring-2 ring-indigo-400/25 border border-white/10"
          onClick={(e) => e.stopPropagation()}
          style={{ boxShadow: '0 0 80px 12px rgba(103,63,255,0.22), 0 4px 64px 0 rgba(20,200,255,0.13)' }}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-20 bg-gradient-to-tr from-[#43cea2] to-[#185a9d] text-white p-2 rounded-full hover:scale-110 transition-all shadow-lg border-2 border-white/30"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Image Display Area */}
          <div className="lg:col-span-2 relative flex items-center justify-center bg-gradient-to-tr from-[#181928]/70 via-[#23384e]/60 to-[#153347]/50 backdrop-blur-lg">
            <img
              src={lightboxPhoto.image ? buildStrapiUrl(lightboxPhoto.image.url) : "/placeholder.svg"}
              alt={lightboxPhoto.caption || "Pattaya photo"}
              className="max-h-[90vh] w-auto h-auto max-w-full object-contain drop-shadow-2xl"
              draggable={false}
              loading="lazy"
            />
            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); showPreviousPhoto(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur border border-white/20 text-cyan-300 p-3 rounded-full hover:bg-[#3f5efb]/30 hover:text-white transition-all shadow-lg"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); showNextPhoto(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur border border-white/20 text-[#a259f7] p-3 rounded-full hover:bg-[#fc466b]/30 hover:text-white transition-all shadow-lg"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          {/* Info Panel */}
          <div className="flex flex-col p-6 bg-gradient-to-br from-white/10 via-[#222146]/40 to-[#24497a]/30 backdrop-blur text-slate-200 dark:text-white overflow-y-auto">
            {lightboxPhoto.caption && (
              <h3 className="text-2xl font-bold mb-3 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-[#a259f7] via-[#43cea2] to-[#185a9d]">
                {lightboxPhoto.caption}
              </h3>
            )}
            <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">{lightboxPhoto.author?.username || 'Anonymous'}</span>
              </div>
              <span>{formatTimeAgo(lightboxPhoto.uploaded_at || lightboxPhoto.createdAt)}</span>
            </div>
            {lightboxPhoto.location?.address && (
              <div className="flex items-center text-sm text-[#78ffea] font-semibold drop-shadow mb-4">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{lightboxPhoto.location.address}</span>
              </div>
            )}
            <div className="h-[1px] bg-gradient-to-r from-cyan-400/20 via-indigo-400/40 to-[#a259f7]/30 my-4" />
            {lightboxPhoto.hashtags?.length ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {lightboxPhoto.hashtags.map((h) => (
                  <Badge
                    key={h.id}
                    className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-[#155799]/30 to-[#3f5efb]/30 text-cyan-200 border border-cyan-400/10 shadow-md backdrop-blur"
                  >
                    #{h?.name}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="flex items-center justify-between text-base font-semibold text-white mt-auto">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#fc466b]" />
                  <span>{lightboxPhoto.likes || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#43cea2]" />
                  <span>{lightboxPhoto.views || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-cyan-400/10 border border-cyan-200/10 hover:bg-[#185a9d]/40 transition-all text-white px-4 py-1 rounded-xl flex items-center gap-1 shadow-lg">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="bg-[#a259f7]/10 border border-indigo-400/10 hover:bg-pink-600/30 transition-all text-white px-4 py-1 rounded-xl flex items-center gap-1 shadow-lg">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (loading) {
    return (
      <Card className="h-full bg-gradient-to-br from-[#232526] via-[#303145] to-[#2b5876] backdrop-blur-2xl border-0 rounded-3xl p-8 animate-pulse shadow-2xl ring-2 ring-indigo-500/20 overflow-hidden">
        <div className="space-y-6">
          <div className="h-5 bg-white/20 rounded-lg w-32" />
          <div className="aspect-video bg-white/10 rounded-2xl" />
          <div className="h-4 bg-white/20 rounded-lg w-full" />
          <div className="h-3 bg-white/20 rounded-lg w-1/2" />
        </div>
      </Card>
    )
  }
  if (!photos.length) {
    return (
      <Card className="h-full bg-gradient-to-tl from-[#232526]/50 via-indigo-700/30 to-[#2b5876]/60 border-0 rounded-3xl flex flex-col justify-center items-center text-white p-8 shadow-xl ring-2 ring-indigo-800/30">
        <Camera className="w-14 h-14 text-cyan-300 drop-shadow-md mb-4" />
        <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-600">
          No Photos Yet
        </h3>
        <p className="text-sm text-slate-400 text-center mb-4">Be the first to capture the pulse of Pattaya!</p>
        <button
          onClick={() => window.location.href = '/photos/upload'}
          className="bg-gradient-to-r from-cyan-500 to-[#a259f7] hover:from-[#43cea2] hover:to-[#fc466b] text-white font-semibold px-5 py-2 rounded-xl shadow-lg tracking-wide transition-all"
        >
          Upload a Photo
        </button>
      </Card>
    )
  }
  const photo = photos[currentPhotoIndex]
  return (
    <>
      <Card className="relative h-full 
  bg-gradient-to-br from-blue-200 via-purple-200 to-orange-300 
  backdrop-blur-lg border-0 rounded-3xl overflow-hidden 
  shadow-[0_2px_40px_6px_rgba(36,59,105,0.14)] 
  ring-2 ring-pink-400/20 flex flex-col">
        <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden">
          <div className="absolute -top-1/3 -right-1/5 w-2/3 h-2/3 bg-gradient-to-br from-[#3f5efb]/40 via-fuchsia-600/30 to-[#232526]/40 rounded-full blur-[88px] animate-pulse-slow"></div>
          <div className="absolute -bottom-1/3 -left-1/5 w-2/3 h-2/3 bg-gradient-to-bl from-[#a259f7]/30 via-cyan-400/30 to-[#22223b]/50 rounded-full blur-[70px] animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
        </div>
        <CardHeader className="p-6 border-b border-white/10 relative z-10 bg-gradient-to-r from-white/5 via-[#a259f7]/5 to-[#303145]/15 backdrop-blur">
          <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-600 flex items-center justify-between drop-shadow">
            <div className="flex items-center text-black gap-2">
              <Camera className="w-5 h-5 text-cyan-700" />
              Pattaya Pulse
            </div>
            <a href="/photos" className="text-xs underline text-black-300 hover:text-white transition-colors">View All &rarr;</a>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 flex-1 flex flex-col min-h-0 relative z-10">
          <div
            className="relative cursor-pointer rounded-2xl overflow-hidden shadow-2xl group aspect-video flex-1 border border-white/30 bg-gradient-to-br from-white/10 via-[#2b254e]/10 to-sky-900/10 backdrop-blur"
            onClick={() => handlePhotoClick(photo)}
            role="button"
            tabIndex={0}
          >
            <img
              src={photo.image ? buildStrapiUrl(photo.image.formats?.medium?.url || photo.image.url) : "/placeholder.svg"}
              alt={photo.caption || "Pattaya photo"}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              draggable={false}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute top-3 left-3 flex gap-2">
              {photo.featured && (
                <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-fuchsia-500 text-black border-0 font-semibold shadow-lg backdrop-blur-sm">Featured</Badge>
              )}
              {photo.sponsor_url && (
                <Badge className="text-xs bg-gradient-to-r from-[#fc466b]/90 to-[#3f5efb]/80 text-white border-0 font-semibold shadow-lg backdrop-blur-sm">Sponsored</Badge>
              )}
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              {photo.caption && <h3 className="font-semibold text-base line-clamp-1 bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-indigo-200 to-fuchsia-200 drop-shadow">{photo.caption}</h3>}
              <div className="flex items-center justify-between text-xs mt-1">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{photo.author?.username || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-[#fc466b]" />
                    <span>{photo.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-300" />
                    <span>{photo.views || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-2 pt-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-md border border-white/50 ${i === currentPhotoIndex
                    ? "bg-gradient-to-r from-cyan-400 to-fuchsia-500 scale-125 shadow-2xl"
                    : "bg-white/20 hover:bg-cyan-400/60"
                  }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <LightboxModal />
      {/* Animations and glassmorphism helpers */}
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.18; } 50% { transform: scale(1.5); opacity: 0.24; } }
        .animate-pulse-slow { animation: pulse-slow 7s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.10); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.18); }
      `}</style>
    </>
  )
}
export default PhotoGalleryWidget
