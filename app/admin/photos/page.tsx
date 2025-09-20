"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Check, 
  X, 
  Eye, 
  User, 
  Calendar, 
  MapPin, 
  Hash, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  Search
} from "lucide-react"
import { buildApiUrl } from "@/lib/strapi-config"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

interface Photo {
  id: number
  caption?: string
  image?: {
    id: number
    name: string
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
    }
  }
  author?: {
    id: number
    username: string
    email: string
  }
  hashtags?: Array<{
    id: number
    name: string
  }>
  location?: {
    latitude: number
    longitude: number
    address?: string
    city?: string
    country: string
  }
  status: 'pending' | 'approved' | 'rejected'
  uploaded_at: string
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
  likes: number
  views: number
  featured: boolean
  file_size?: number
  mime_type?: string
}

export default function AdminPhotosPage() {
  const { user, getStrapiToken } = useAuth()
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [moderationNotes, setModerationNotes] = useState("")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadPhotos()
  }, [user, statusFilter])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      const token = getStrapiToken()
      
      let url = buildApiUrl('photos/pending')
      if (statusFilter !== 'pending') {
        url = buildApiUrl(`photos?filters[status][$eq]=${statusFilter}&populate=*`)
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPhotos(data.data || [])
      } else {
        console.error('Failed to load photos:', response.status)
      }
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (photoId: number) => {
    try {
      setActionLoading(photoId)
      const token = getStrapiToken()
      
      const response = await fetch(buildApiUrl(`photos/${photoId}/approve`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove from pending list
        setPhotos(prev => prev.filter(p => p.id !== photoId))
      } else {
        const error = await response.json()
        console.error('Failed to approve photo:', error)
        alert('Failed to approve photo: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error approving photo:', error)
      alert('Error approving photo')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (photoId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      setActionLoading(photoId)
      const token = getStrapiToken()
      
      const response = await fetch(buildApiUrl(`photos/${photoId}/reject`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason,
          moderation_notes: moderationNotes
        })
      })

      if (response.ok) {
        // Remove from pending list
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setRejectionReason("")
        setModerationNotes("")
        setSelectedPhoto(null)
      } else {
        const error = await response.json()
        console.error('Failed to reject photo:', error)
        alert('Failed to reject photo: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error rejecting photo:', error)
      alert('Error rejecting photo')
    } finally {
      setActionLoading(null)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800", 
      rejected: "bg-red-100 text-red-800"
    }
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredPhotos = photos.filter(photo => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        photo.caption?.toLowerCase().includes(searchLower) ||
        photo.author?.username.toLowerCase().includes(searchLower) ||
        photo.hashtags?.some(tag => tag.name.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
            <Button onClick={() => router.push('/auth/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Moderation</h1>
              <p className="text-gray-600">Review and moderate user-submitted photos for Pattaya Pulse</p>
            </div>
            <Button onClick={loadPhotos} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search photos, users, or hashtags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All Photos</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No photos found</h3>
              <p className="text-gray-500">
                {statusFilter === 'pending' 
                  ? "No photos are currently pending review." 
                  : `No ${statusFilter} photos found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Photo */}
                  <div className="relative mb-4">
                    <img
                      src={photo.image ? buildApiUrl(photo.image.url.replace('/uploads/', 'uploads/')) : "/placeholder.svg"}
                      alt={photo.caption || "Pattaya photo"}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(photo.status)}
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="space-y-3">
                    {photo.caption && (
                      <p className="text-sm text-gray-700 line-clamp-2">{photo.caption}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{photo.author?.username || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatTimeAgo(photo.uploaded_at)}</span>
                      </div>
                    </div>

                    {photo.location?.address && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{photo.location.address}</span>
                      </div>
                    )}

                    {photo.hashtags && photo.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {photo.hashtags.slice(0, 3).map((hashtag) => (
                          <Badge key={hashtag.id} variant="secondary" className="text-xs">
                            #{hashtag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span>{photo.likes} likes</span>
                        <span>{photo.views} views</span>
                      </div>
                      {photo.file_size && (
                        <span>{formatFileSize(photo.file_size)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {photo.status === 'pending' && (
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(photo.id)}
                          disabled={actionLoading === photo.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === photo.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedPhoto(photo)}
                          disabled={actionLoading === photo.id}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Reject Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moderation Notes (Optional)
                  </label>
                  <Textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    placeholder="Additional notes for internal use..."
                    rows={2}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleReject(selectedPhoto.id)}
                    disabled={!rejectionReason.trim() || actionLoading === selectedPhoto.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {actionLoading === selectedPhoto.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject Photo
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedPhoto(null)
                      setRejectionReason("")
                      setModerationNotes("")
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
