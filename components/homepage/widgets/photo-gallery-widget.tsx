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
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Heart, Eye, User, MapPin } from "lucide-react"
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
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<PattayaPulsePhoto | null>(null)

  useEffect(() => {
    loadPhotoData()
    const interval = setInterval(loadPhotoData, 180000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (photos.length > 0) {
      const interval = setInterval(() => {
        setCurrentPhoto((prev) => (prev + 1) % photos.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [photos])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!lightboxOpen || !lightboxPhoto) return
      if (event.key === 'Escape') closeLightbox()
      else if (event.key === 'ArrowLeft') {
        const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
        setLightboxPhoto(photos[prevIndex])
      } else if (event.key === 'ArrowRight') {
        const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
        const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
        setLightboxPhoto(photos[nextIndex])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxPhoto, photos])

  const loadPhotoData = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl("photos/latest?limit=5&populate=*"))
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handlePhotoClick = (photo: PattayaPulsePhoto) => {
    if (photo.sponsor_url) window.open(photo.sponsor_url, '_blank')
    else {
      setLightboxPhoto(photo)
      setLightboxOpen(true)
    }
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxPhoto(null)
  }

  // linear gradient glassmorphic background CSS string
  const glassGradientBg = "bg-gradient-to-tr from-indigo-400/20 via-purple-400/20 to-pink-400/20"

  if (loading) {
    return (
      <Card className={`h-full ${glassGradientBg} backdrop-blur-lg border border-white/30 rounded-3xl shadow-lg animate-pulse select-none`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-5 bg-white/30 rounded-full w-28 animate-pulse" />
            <div className="h-24 bg-white/20 rounded-3xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 bg-white/30 rounded-full animate-pulse" />
              <div className="h-3 bg-white/30 rounded-full w-1/2 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!photos.length) {
    return (
      <Card className={`h-full ${glassGradientBg} backdrop-blur-lg border border-white/30 rounded-3xl shadow-md flex flex-col justify-center items-center text-white select-none`}>
        <CardHeader className="pb-4 px-6 pt-6">
          <CardTitle className="text-base font-semibold flex items-center justify-center gap-2 drop-shadow-md">
            <Camera className="w-5 h-5" /> Pattaya Pulse
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-center text-sm font-semibold drop-shadow-md">No photos available</p>
        </CardContent>
      </Card>
    )
  }

  const photo = photos[currentPhoto]

  return (
    <Card className={`${glassGradientBg} backdrop-blur-lg border border-white/40 rounded-3xl shadow-lg shadow-indigo-400/30 hover:shadow-indigo-500/50 transition-shadow duration-500 ease-in-out overflow-hidden`}>
      <SponsorshipBanner widgetType="photos" />
      <CardHeader className="pb-4 px-6 pt-6">
        <CardTitle className="text-base font-semibold text-white flex items-center justify-between select-none drop-shadow-lg">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo Gallery
          </div>
          <span className="text-xs font-semibold">{photos.length} photos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        <div
          className="relative cursor-pointer rounded-3xl overflow-hidden shadow-lg transform transition-transform duration-500 hover:scale-[1.02] hover:opacity-95"
          onClick={() => handlePhotoClick(photo)}
          role="button"
          tabIndex={0}
          aria-label="View photo details"
          onKeyDown={(e) => { if (e.key === 'Enter') handlePhotoClick(photo) }}
        >
          <img
            src={photo.image ? buildStrapiUrl(photo.image.url) : "/placeholder.svg"}
            alt={photo.caption || "Pattaya photo"}
            className="w-full h-64 object-cover"
            draggable={false}
            loading="lazy"
          />
          {photo.featured && (
            <Badge className="absolute top-4 left-4 text-xs bg-yellow-400/80 text-white border-0 font-semibold shadow-lg backdrop-blur-sm">
              Featured
            </Badge>
          )}
          {photo.sponsor_url && (
            <Badge className="absolute top-4 right-4 text-xs bg-green-400/80 text-white border-0 font-semibold shadow-lg backdrop-blur-sm">
              Sponsored
            </Badge>
          )}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg select-none">
            {currentPhoto + 1}/{photos.length}
          </div>
        </div>

        <div className="space-y-3 select-none text-white drop-shadow-md">
          {photo.caption && (
            <h3 className="text-md font-semibold line-clamp-1 leading-tight">{photo.caption}</h3>
          )}
          <div className="flex items-center justify-between text-xs mt-1 font-medium">
            <div className="flex items-center space-x-1 min-w-0 truncate">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{photo.author?.username || 'Anonymous'}</span>
            </div>
            <span className="flex-shrink-0 font-semibold">{formatTimeAgo(photo.uploaded_at || photo.createdAt || '')}</span>
          </div>
          {photo.location?.address && (
            <div className="flex items-center text-xs mb-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{photo.location.address}</span>
            </div>
          )}
          {photo.hashtags && photo.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photo.hashtags.slice(0, 2).map((h) => (
                <Badge
                  key={h.id}
                  variant="secondary"
                  className="text-xs font-medium px-2 py-1 backdrop-blur-md bg-pink-400/30 border border-pink-400/50 rounded-md"
                >
                  #{h?.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{photo.likes || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span>{photo.views || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-3 select-none">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhoto(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 shadow-lg border border-white/60 ${
                i === currentPhoto ? "bg-gray-700 scale-110" : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      </CardContent>

      {lightboxOpen && lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg transition-opacity duration-500">
          <div className={`relative max-w-5xl max-h-[90vh] w-full mx-4 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl border border-white/20 ${glassGradientBg}`}>
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 z-20 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors shadow-lg"
              aria-label="Close lightbox"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative flex justify-center items-center p-6">
              <img
                src={lightboxPhoto.image ? buildStrapiUrl(lightboxPhoto.image.url) : "/placeholder.svg"}
                alt={lightboxPhoto.caption || "Pattaya photo"}
                className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-transform duration-300"
                draggable={false}
                loading="lazy"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
                      setLightboxPhoto(photos[prevIndex])
                    }}
                    className="absolute left-5 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg"
                    aria-label="Previous photo"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id)
                      const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
                      setLightboxPhoto(photos[nextIndex])
                    }}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg"
                    aria-label="Next photo"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 bg-white/20 backdrop-blur-md rounded-b-3xl p-6 text-gray-900 select-text">
              {lightboxPhoto.caption && (
                <h3 className="text-2xl font-semibold mb-3">{lightboxPhoto.caption}</h3>
              )}
              <div className="flex items-center justify-between text-sm text-gray-700 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="font-semibold">{lightboxPhoto.author?.username || 'Anonymous'}</span>
                </div>
                <span className="font-semibold">{formatTimeAgo(lightboxPhoto.uploaded_at || lightboxPhoto.createdAt || '')}</span>
              </div>
              {lightboxPhoto.location?.address && (
                <div className="flex items-center text-sm text-gray-600 mb-5">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{lightboxPhoto.location.address}</span>
                </div>
              )}

              {lightboxPhoto.hashtags && lightboxPhoto.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-5">
                  {lightboxPhoto.hashtags.map((h) => (
                    <Badge
                      key={h.id}
                      variant="secondary"
                      className="text-sm font-semibold px-3 py-1 backdrop-blur-lg bg-white/30 border border-white/50 rounded-lg shadow-md"
                    >
                      #{h?.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-base text-gray-500 mb-6 font-semibold">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>{lightboxPhoto.likes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>{lightboxPhoto.views || 0}</span>
                  </div>
                </div>
                {lightboxPhoto.featured && (
                  <Badge className="text-sm bg-yellow-400 text-white border-0 font-semibold shadow-lg px-3 py-1 rounded-lg">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="text-center">
                <button
                  onClick={() => (window.location.href = '/photos/upload')}
                  className="inline-flex items-center px-6 py-3 bg-blue-500/60 backdrop-blur-md text-white text-base font-semibold rounded-xl hover:bg-blue-600/70 transition-colors shadow-lg"
                  aria-label="Submit your photo"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Submit Your Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default PhotoGalleryWidget