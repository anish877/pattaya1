// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Clock, MapPin, Search, ChevronRight, Film } from "lucide-react"
// import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"

// interface Movie {
//   id: string
//   title: string
//   poster: string
//   genre: string
//   duration: string
//   rating: string
//   showtimes: string[]
//   cinema: string
//   language: string
//   format: string
// }

// const mockMovies: Movie[] = [
//   {
//     id: "1",
//     title: "Avatar: The Way of Water",
//     poster: "/avatar-movie-poster.jpg",
//     genre: "Sci-Fi",
//     duration: "192 min",
//     rating: "PG-13",
//     showtimes: ["14:30", "18:00", "21:30"],
//     cinema: "SF Cinema Terminal 21",
//     language: "EN/TH",
//     format: "IMAX",
//   },
//   {
//     id: "2",
//     title: "Top Gun: Maverick",
//     poster: "/top-gun-maverick-inspired-poster.png",
//     genre: "Action",
//     duration: "131 min",
//     rating: "PG-13",
//     showtimes: ["15:15", "19:45", "22:15"],
//     cinema: "Major Cineplex The Avenue",
//     language: "EN/TH",
//     format: "4DX",
//   },
//   {
//     id: "3",
//     title: "Black Panther: Wakanda Forever",
//     poster: "/wakanda-forever-poster.png",
//     genre: "Action",
//     duration: "161 min",
//     rating: "PG-13",
//     showtimes: ["16:00", "20:30"],
//     cinema: "SF Cinema Terminal 21",
//     language: "EN/TH",
//     format: "2D",
//   },
//   {
//     id: "4",
//     title: "The Menu",
//     poster: "/the-menu-movie-poster.jpg",
//     genre: "Thriller",
//     duration: "107 min",
//     rating: "R",
//     showtimes: ["17:30", "21:00"],
//     cinema: "Major Cineplex The Avenue",
//     language: "EN/TH",
//     format: "2D",
//   },
//   {
//     id: "5",
//     title: "Spider-Man: No Way Home",
//     poster: "/spider-man-movie-poster.jpg",
//     genre: "Action",
//     duration: "148 min",
//     rating: "PG-13",
//     showtimes: ["13:00", "16:30", "20:00"],
//     cinema: "SF Cinema Terminal 21",
//     language: "EN/TH",
//     format: "IMAX",
//   },
//   {
//     id: "6",
//     title: "Dune: Part Two",
//     poster: "/dune-part-two-poster.png",
//     genre: "Sci-Fi",
//     duration: "166 min",
//     rating: "PG-13",
//     showtimes: ["14:00", "17:45", "21:15"],
//     cinema: "Major Cineplex The Avenue",
//     language: "EN/TH",
//     format: "IMAX",
//   },
//   {
//     id: "7",
//     title: "John Wick: Chapter 4",
//     poster: "/john-wick-chapter-4-movie-poster.jpg",
//     genre: "Action",
//     duration: "169 min",
//     rating: "R",
//     showtimes: ["15:30", "19:00", "22:30"],
//     cinema: "SF Cinema Terminal 21",
//     language: "EN/TH",
//     format: "2D",
//   },
//   {
//     id: "8",
//     title: "Oppenheimer",
//     poster: "/oppenheimer-inspired-poster.png",
//     genre: "Drama",
//     duration: "180 min",
//     rating: "R",
//     showtimes: ["14:15", "18:30", "22:00"],
//     cinema: "Major Cineplex The Avenue",
//     language: "EN/TH",
//     format: "70mm",
//   },
//   {
//     id: "9",
//     title: "Barbie",
//     poster: "/barbie-movie-poster-pink.jpg",
//     genre: "Comedy",
//     duration: "114 min",
//     rating: "PG-13",
//     showtimes: ["13:30", "16:00", "18:45", "21:30"],
//     cinema: "SF Cinema Terminal 21",
//     language: "EN/TH",
//     format: "2D",
//   },
//   {
//     id: "10",
//     title: "Fast X",
//     poster: "/fast-x-movie-poster-action-cars.jpg",
//     genre: "Action",
//     duration: "141 min",
//     rating: "PG-13",
//     showtimes: ["15:00", "18:15", "21:45"],
//     cinema: "Major Cineplex The Avenue",
//     language: "EN/TH",
//     format: "4DX",
//   },
// ]

// // Hook to fetch movies from Strapi
// const useMovies = () => {
//   const [movies, setMovies] = useState<Movie[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchMovies = async () => {
//       try {
//         setLoading(true)
//         setError(null)
        
//         // Use standard Strapi REST API with population - simplified for debugging
//         const apiUrl = buildApiUrl("movies?populate=poster")
//         console.log('🎬 Fetching movies from:', apiUrl)
//         const response = await fetch(apiUrl)
        
//         if (!response.ok) {
//           const errorText = await response.text()
//           console.error('🎬 API Error Response:', errorText)
//           throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
//         }
        
//         const result = await response.json()
//         const strapiMovies = result.data || []
//         console.log('🎬 Strapi API Response:', { result, strapiMovies })
        
//         // Transform Strapi data to our Movie interface
//         const transformedMovies: Movie[] = strapiMovies.map((movie: any) => {
//           console.log('🎬 Movie poster data:', movie.poster)
          
//           let posterUrl = "/placeholder.svg"
//           if (movie.poster?.data?.attributes?.url) {
//             posterUrl = buildStrapiUrl(movie.poster.data.attributes.url)
//             console.log('🎬 Built poster URL:', posterUrl)
//           } else if (movie.poster?.url) {
//             posterUrl = buildStrapiUrl(movie.poster.url)
//             console.log('🎬 Built poster URL (direct):', posterUrl)
//           } else {
//             console.log('🎬 No poster found, using placeholder')
//           }
          
//           return {
//             id: String(movie.id),
//             title: movie.title,
//             poster: posterUrl,
//             genre: movie.genre,
//             duration: movie.duration,
//             rating: movie.rating,
//             showtimes: movie.showtimes || [],
//             cinema: movie.cinema,
//             language: movie.language,
//             format: movie.format,
//           }
//         })
        
//         setMovies(transformedMovies)
//         console.log('🎬 Transformed movies:', transformedMovies)
        
//         // Fallback to mock data if no movies found
//         if (transformedMovies.length === 0) {
//           console.log('🎬 No movies found, using fallback data')
//           setMovies(mockMovies)
//         }
        
//       } catch (error) {
//         console.error('Failed to fetch movies:', error)
//         setError('Failed to load movies')
        
//         // Fallback to mock data on error
//         console.log('Using fallback movies due to fetch error')
//         setMovies(mockMovies)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchMovies()
//   }, [])

//   return { movies, loading, error }
// }

// export function CinemaWidget() {
//   const { movies, loading, error } = useMovies()
//   const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedGenre, setSelectedGenre] = useState("all")
//   const [selectedCinema, setSelectedCinema] = useState("all")
//   const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])

//   // Update filtered movies when movies data changes
//   useEffect(() => {
//     const filtered = movies.filter((movie) => {
//       const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase())
//       const matchesGenre = selectedGenre === "all" || movie.genre === selectedGenre
//       const matchesCinema = selectedCinema === "all" || movie.cinema === selectedCinema
//       return matchesSearch && matchesGenre && matchesCinema
//     })
//     setFilteredMovies(filtered)
//   }, [movies, searchTerm, selectedGenre, selectedCinema])

//   // Auto-rotate movies every 4 seconds (only if we have movies)
//   useEffect(() => {
//     if (movies.length === 0) return
    
//     const interval = setInterval(() => {
//       setCurrentMovieIndex((prev) => (prev + 1) % movies.length)
//     }, 4000)
//     return () => clearInterval(interval)
//   }, [movies])

//   // Show loading state
//   if (loading) {
//     return (
//       <div className="w-full h-full flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading movies...</p>
//         </div>
//       </div>
//     )
//   }

//   // Show error state
//   if (error && movies.length === 0) {
//     return (
//       <div className="w-full h-full flex items-center justify-center">
//         <div className="text-center text-red-600">
//           <p>Failed to load movies</p>
//           <p className="text-sm">Using offline data</p>
//         </div>
//       </div>
//     )
//   }

//   const currentMovie = movies[currentMovieIndex] || movies[0]
//   const genres = [...new Set(movies.map((movie) => movie.genre))]
//   const cinemas = [...new Set(movies.map((movie) => movie.cinema))]

//   return (
//     <div className="w-full h-full">
//       <Card className="w-full h-full relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group cursor-pointer">
//         {/* Background Image */}
//         <div
//           className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-105"
//           style={{
//             backgroundImage: `url(${currentMovie.poster || "/placeholder.svg"})`,
//           }}
//         />

//         {/* Content Overlay */}
//         <CardContent className="relative z-10 h-full flex flex-col justify-between p-4 text-white">
//           {/* Header - Fixed to top */}
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2 bg-gray-900/90 border border-cyan-400/50 px-3 py-1 rounded-full backdrop-blur-sm">
//               <Film className="w-5 h-5 text-cyan-400" />
//               <span className="text-sm font-semibold text-white drop-shadow-lg">PATTAYA CINEMAS</span>
//             </div>
//             <Badge
//               variant="secondary"
//               className="bg-gray-900/90 border border-purple-400/50 text-white backdrop-blur-sm"
//             >
//               {currentMovie.format}
//             </Badge>
//           </div>

//           <div className="space-y-3">
//             {/* Movie Title */}
//             <div className="bg-gray-900/80 p-3 rounded-lg backdrop-blur-sm">
//               <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-2xl">{currentMovie.title}</h2>
//             </div>

//             {/* Genre, Duration, Rating */}
//             <div className="flex items-center gap-3 text-sm border border-white/30 bg-gray-800/60 px-3 py-2 rounded-full backdrop-blur-sm">
//               <Badge variant="outline" className="bg-gray-900/80 border-purple-400/50 text-white">
//                 {currentMovie.genre}
//               </Badge>
//               <span className="text-white drop-shadow-lg">{currentMovie.duration}</span>
//               <span className="text-white">•</span>
//               <span className="text-white drop-shadow-lg">{currentMovie.rating}</span>
//             </div>

//             {/* Cinema Location */}
//             <div className="flex items-center gap-2 text-sm border border-white/30 bg-gray-800/80 px-3 py-2 rounded-full w-fit backdrop-blur-sm">
//               <MapPin className="w-4 h-4 text-teal-400" />
//               <span className="text-white drop-shadow-lg">{currentMovie.cinema}</span>
//             </div>

//             {/* Showtimes */}
//             <div className="space-y-2">
//               <div className="flex items-center gap-2 border border-white/30 bg-gray-900/80 px-3 py-2 rounded-full w-fit backdrop-blur-sm">
//                 <Clock className="w-4 h-4 text-green-400" />
//                 <span className="text-sm font-medium text-white drop-shadow-lg">TODAY</span>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {currentMovie.showtimes.slice(0, 3).map((time, index) => (
//                   <Badge
//                     key={index}
//                     variant="outline"
//                     className="bg-gray-900/80 border-orange-400/50 text-white hover:bg-gray-800/90 cursor-pointer transition-all duration-200 backdrop-blur-sm"
//                   >
//                     {time}
//                   </Badge>
//                 ))}
//               </div>
//             </div>

//             {/* Movie Indicators */}
//             <div className="flex justify-center gap-1.5">
//               {movies.map((_, index) => (
//                 <div
//                   key={index}
//                   className={`w-2 h-2 rounded-full transition-all duration-300 ${
//                     index === currentMovieIndex ? "bg-cyan-300 w-6 shadow-lg" : "bg-white/80 hover:bg-white"
//                   }`}
//                 />
//               ))}
//             </div>

//             {/* Expand Button */}
//             <Dialog>
//               <DialogTrigger asChild>
//                 <div className="w-full bg-gray-900 border border-red-400/50 hover:bg-gray-800 transition-all duration-200 rounded-md px-4 py-2 flex items-center justify-center cursor-pointer font-medium text-sm text-white backdrop-blur-sm">
//                   View All Movies
//                   <ChevronRight className="w-4 h-4 ml-2" />
//                 </div>
//               </DialogTrigger>
//               <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//                 <DialogHeader>
//                   <DialogTitle className="text-2xl text-cyan-800">Pattaya Cinema Showtimes</DialogTitle>
//                 </DialogHeader>

//                 {/* Search and Filters */}
//                 <div className="space-y-4 mb-6">
//                   <div className="flex gap-4">
//                     <div className="flex-1">
//                       <Input
//                         placeholder="Search movies..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="w-full"
//                       />
//                     </div>
//                     <div
//                       style={{ backgroundColor: "#1f2937", color: "#ffffff" }}
//                       className="w-10 h-10 border border-cyan-300/50 hover:bg-gray-700 cursor-pointer transition-all duration-200 backdrop-blur-sm rounded-full flex items-center justify-center"
//                     >
//                       <Search className="w-4 h-4" />
//                     </div>
//                   </div>

//                   <div className="flex gap-4">
//                     <Select value={selectedGenre} onValueChange={setSelectedGenre}>
//                       <SelectTrigger className="w-48">
//                         <SelectValue placeholder="Select genre" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Genres</SelectItem>
//                         {genres.map((genre) => (
//                           <SelectItem key={genre} value={genre}>
//                             {genre}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>

//                     <Select value={selectedCinema} onValueChange={setSelectedCinema}>
//                       <SelectTrigger className="w-64">
//                         <SelectValue placeholder="Select cinema" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Cinemas</SelectItem>
//                         {cinemas.map((cinema) => (
//                           <SelectItem key={cinema} value={cinema}>
//                             {cinema}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 {/* Movie Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {filteredMovies.map((movie) => (
//                     <Card key={movie.id} className="hover:shadow-md transition-shadow">
//                       <CardContent className="p-4">
//                         <div className="flex gap-4">
//                           <img
//                             src={movie.poster || "/placeholder.svg"}
//                             alt={movie.title}
//                             className="w-20 h-30 object-cover rounded-md"
//                           />
//                           <div className="flex-1">
//                             <h3 className="font-semibold text-lg text-cyan-900 mb-2">{movie.title}</h3>
//                             <div className="space-y-2">
//                               <div className="flex items-center gap-2">
//                                 <Badge variant="secondary" className="bg-purple-100 text-purple-700">
//                                   {movie.format}
//                                 </Badge>
//                                 <Badge variant="outline">{movie.genre}</Badge>
//                                 <span className="text-sm text-gray-600">{movie.duration}</span>
//                               </div>
//                               <div className="flex items-center gap-1 text-sm text-gray-600">
//                                 <MapPin className="w-4 h-4" />
//                                 {movie.cinema}
//                               </div>
//                               <div className="flex items-center gap-1 text-sm text-gray-600">
//                                 <span>Language: {movie.language}</span>
//                               </div>
//                             </div>
//                             <div className="mt-3">
//                               <p className="text-sm font-medium text-cyan-800 mb-2">Showtimes:</p>
//                               <div className="flex flex-wrap gap-2">
//                                 {movie.showtimes.map((time, index) => (
//                                   <Badge
//                                     key={index}
//                                     variant="outline"
//                                     className="border-cyan-300 text-cyan-700 hover:bg-cyan-100 cursor-pointer transition-colors"
//                                   >
//                                     {time}
//                                   </Badge>
//                                 ))}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>

//                 {filteredMovies.length === 0 && (
//                   <div className="text-center py-8 text-gray-500">No movies found matching your criteria.</div>
//                 )}
//               </DialogContent>
//             </Dialog>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }




"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, Search, ChevronRight, Film, Star, Calendar, Users, Award, Play, Zap, Heart, TrendingUp, Sparkles, Ticket, Eye, Filter, X } from "lucide-react"
import { buildApiUrl, buildStrapiUrl } from "@/lib/strapi-config"

interface Movie {
  id: string
  title: string
  poster: string
  genre: string
  duration: string
  rating: string
  showtimes: string[]
  cinema: string
  language: string
  format: string
}

const mockMovies: Movie[] = [
  {
    id: "1",
    title: "Avatar: The Way of Water",
    poster: "/avatar-movie-poster.jpg",
    genre: "Sci-Fi",
    duration: "192 min",
    rating: "PG-13",
    showtimes: ["14:30", "18:00", "21:30"],
    cinema: "SF Cinema Terminal 21",
    language: "EN/TH",
    format: "IMAX",
  },
  {
    id: "2",
    title: "Top Gun: Maverick",
    poster: "/top-gun-maverick-inspired-poster.png",
    genre: "Action",
    duration: "131 min",
    rating: "PG-13",
    showtimes: ["15:15", "19:45", "22:15"],
    cinema: "Major Cineplex The Avenue",
    language: "EN/TH",
    format: "4DX",
  },
  {
    id: "3",
    title: "Black Panther: Wakanda Forever",
    poster: "/wakanda-forever-poster.png",
    genre: "Action",
    duration: "161 min",
    rating: "PG-13",
    showtimes: ["16:00", "20:30"],
    cinema: "SF Cinema Terminal 21",
    language: "EN/TH",
    format: "2D",
  },
  {
    id: "4",
    title: "The Menu",
    poster: "/the-menu-movie-poster.jpg",
    genre: "Thriller",
    duration: "107 min",
    rating: "R",
    showtimes: ["17:30", "21:00"],
    cinema: "Major Cineplex The Avenue",
    language: "EN/TH",
    format: "2D",
  },
  {
    id: "5",
    title: "Spider-Man: No Way Home",
    poster: "/spider-man-movie-poster.jpg",
    genre: "Action",
    duration: "148 min",
    rating: "PG-13",
    showtimes: ["13:00", "16:30", "20:00"],
    cinema: "SF Cinema Terminal 21",
    language: "EN/TH",
    format: "IMAX",
  },
  {
    id: "6",
    title: "Dune: Part Two",
    poster: "/dune-part-two-poster.png",
    genre: "Sci-Fi",
    duration: "166 min",
    rating: "PG-13",
    showtimes: ["14:00", "17:45", "21:15"],
    cinema: "Major Cineplex The Avenue",
    language: "EN/TH",
    format: "IMAX",
  },
  {
    id: "7",
    title: "John Wick: Chapter 4",
    poster: "/john-wick-chapter-4-movie-poster.jpg",
    genre: "Action",
    duration: "169 min",
    rating: "R",
    showtimes: ["15:30", "19:00", "22:30"],
    cinema: "SF Cinema Terminal 21",
    language: "EN/TH",
    format: "2D",
  },
  {
    id: "8",
    title: "Oppenheimer",
    poster: "/oppenheimer-inspired-poster.png",
    genre: "Drama",
    duration: "180 min",
    rating: "R",
    showtimes: ["14:15", "18:30", "22:00"],
    cinema: "Major Cineplex The Avenue",
    language: "EN/TH",
    format: "70mm",
  },
  {
    id: "9",
    title: "Barbie",
    poster: "/barbie-movie-poster-pink.jpg",
    genre: "Comedy",
    duration: "114 min",
    rating: "PG-13",
    showtimes: ["13:30", "16:00", "18:45", "21:30"],
    cinema: "SF Cinema Terminal 21",
    language: "EN/TH",
    format: "2D",
  },
  {
    id: "10",
    title: "Fast X",
    poster: "/fast-x-movie-poster-action-cars.jpg",
    genre: "Action",
    duration: "141 min",
    rating: "PG-13",
    showtimes: ["15:00", "18:15", "21:45"],
    cinema: "Major Cineplex The Avenue",
    language: "EN/TH",
    format: "4DX",
  },
]

// Hook to fetch movies from Strapi
const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = buildApiUrl("movies?populate=poster")
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        const strapiMovies = result.data || []
        
        const transformedMovies: Movie[] = strapiMovies.map((movie: any) => {
          let posterUrl = "/placeholder.svg"
          if (movie.poster?.data?.attributes?.url) {
            posterUrl = buildStrapiUrl(movie.poster.data.attributes.url)
          } else if (movie.poster?.url) {
            posterUrl = buildStrapiUrl(movie.poster.url)
          }
          
          return {
            id: String(movie.id),
            title: movie.title,
            poster: posterUrl,
            genre: movie.genre,
            duration: movie.duration,
            rating: movie.rating,
            showtimes: movie.showtimes || [],
            cinema: movie.cinema,
            language: movie.language,
            format: movie.format,
          }
        })
        
        if (transformedMovies.length > 0) {
            setMovies(transformedMovies)
        } else {
            setMovies(mockMovies)
        }
        
      } catch (error) {
        console.error('Failed to fetch movies:', error)
        setError('Failed to load movies')
        setMovies(mockMovies)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  return { movies, loading, error }
}

// Professional color palette for clean, mature design
const professionalColors = [
  { primary: "#059669", secondary: "#10B981", accent: "#F59E0B" }, // Emerald & Amber
  { primary: "#7C3AED", secondary: "#8B5CF6", accent: "#F59E0B" }, // Purple & Amber
  { primary: "#DC2626", secondary: "#EF4444", accent: "#F59E0B" }, // Red & Amber
  { primary: "#0891B2", secondary: "#06B6D4", accent: "#F59E0B" }, // Cyan & Amber
  { primary: "#7C2D12", secondary: "#EA580C", accent: "#F59E0B" }, // Orange & Amber
  { primary: "#BE185D", secondary: "#EC4899", accent: "#F59E0B" }, // Pink & Amber
  { primary: "#065F46", secondary: "#059669", accent: "#F59E0B" }, // Green & Amber
  { primary: "#1E40AF", secondary: "#3B82F6", accent: "#F59E0B" }, // Indigo & Amber
  { primary: "#7C2D12", secondary: "#DC2626", accent: "#F59E0B" }, // Brown & Red
  { primary: "#6B21A8", secondary: "#7C3AED", accent: "#F59E0B" }, // Violet & Purple
];


export function CinemaWidget() {
  const { movies, loading, error } = useMovies()
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedCinema, setSelectedCinema] = useState("all")
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const filtered = movies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = selectedGenre === "all" || movie.genre === selectedGenre
      const matchesCinema = selectedCinema === "all" || movie.cinema === selectedCinema
      return matchesSearch && matchesCinema && matchesGenre
    })
    setFilteredMovies(filtered)
  }, [movies, searchTerm, selectedGenre, selectedCinema])

  useEffect(() => {
    if (movies.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentMovieIndex((prev) => (prev + 1) % movies.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [movies])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading movies...</p>
        </div>
      </div>
    )
  }

  if (error && movies.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 font-medium mb-2">Failed to load movies</p>
          <p className="text-sm text-gray-500">Displaying offline data</p>
        </div>
      </div>
    )
  }

  const currentMovie = movies[currentMovieIndex] || movies[0]
  const currentTheme = professionalColors[currentMovieIndex % professionalColors.length];
  const genres = [...new Set(movies.map((movie) => movie.genre))]
  const cinemas = [...new Set(movies.map((movie) => movie.cinema))]

  return (
    <div className="w-full h-full">
      <Card 
        className="w-full h-full relative overflow-hidden rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* --- Movie Poster Background --- */}
        <div className="absolute inset-0 overflow-hidden">
          {movies.map((movie, index) => (
            <img
              key={movie.id}
              src={movie.poster || "/placeholder.svg"}
              alt={movie.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                index === currentMovieIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        <CardContent className="relative z-10 h-full flex flex-col p-4 text-white">
          {/* --- Professional Header --- */}
          <div className="flex items-center justify-between mb-3">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-sm border"
              style={{ 
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderColor: "rgba(255, 255, 255, 0.3)" 
              }}
            >
              <Film className="w-3 h-3" style={{ color: "#FFFFFF" }} />
              <span 
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: "#FFFFFF" }}
              >
                Cinema
              </span>
            </div>
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm"
              style={{ 
                borderColor: "rgba(255, 255, 255, 0.4)",
                color: "#FFFFFF",
                backgroundColor: "rgba(255, 255, 255, 0.15)"
              }}
            >
              {currentMovie.format}
            </Badge>
          </div>

          {/* --- Main Content Area --- */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Movie Title Section */}
            <div key={currentMovie.id + "title"} className="animate-fade-in">
              <h2 
                className="text-lg font-bold leading-tight line-clamp-2 mb-2 text-white drop-shadow-lg"
                style={{ color: "#FFFFFF" }}
              >
                {currentMovie.title}
              </h2>
              
              {/* Movie Details */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge 
                  variant="outline" 
                  className="px-2 py-0.5 text-xs font-medium backdrop-blur-sm"
                  style={{ 
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    color: "#FFFFFF",
                    backgroundColor: "rgba(255, 255, 255, 0.15)"
                  }}
                >
                  {currentMovie.genre}
                </Badge>
                <span 
                  className="text-xs font-medium text-white/90"
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                >
                  {currentMovie.duration}
                </span>
                <span 
                  className="text-xs font-medium text-white/90"
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                >
                  • {currentMovie.rating}
                </span>
              </div>
            </div>
            
            {/* Cinema Location */}
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#FFFFFF" }} />
              <span 
                className="text-xs font-medium truncate text-white/90"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                {currentMovie.cinema}
              </span>
            </div>

            {/* Showtimes */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3 flex-shrink-0" style={{ color: "#FFFFFF" }} />
                <span 
                  className="text-xs font-semibold uppercase tracking-wide text-white"
                  style={{ color: "#FFFFFF" }}
                >
                  Today's Shows
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentMovie.showtimes.slice(0, 3).map((time, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-2 py-1 text-xs font-semibold hover:scale-105 transition-all cursor-pointer backdrop-blur-sm"
                    style={{ 
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      color: "#FFFFFF",
                      backgroundColor: "rgba(255, 255, 255, 0.15)"
                    }}
                  >
                    {time}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Footer Section */}
            <div>
              {/* Movie Navigation Dots */}
              <div className="flex justify-center gap-1.5 mb-3">
                {movies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMovieIndex(index)}
                    className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 ${
                      index === currentMovieIndex 
                        ? "w-6 h-1.5" 
                        : "w-1.5 h-1.5 hover:w-2"
                    }`}
                    style={{
                      backgroundColor: index === currentMovieIndex 
                        ? "#FFFFFF" 
                        : "rgba(255, 255, 255, 0.5)",
                      focusRingColor: "#FFFFFF"
                    }}
                  />
                ))}
              </div>

              {/* View All Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button 
                    className="w-full rounded-lg px-3 py-2 flex items-center justify-center font-semibold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-100 backdrop-blur-sm border"
                    style={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      borderColor: "rgba(255, 255, 255, 0.3)"
                    }}
                  >
                    View All Movies
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl p-0 [&>button[data-radix-collection-item]]:hidden">
                  {/* Custom Close Button - Working */}
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="absolute top-4 right-4 z-50 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                  </button>
                  {/* Professional Header with Animated Background Icons */}
                  <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100 border-b border-slate-200">
                    {/* Animated Background Icons */}
                    <div className="absolute inset-0 overflow-hidden">
                      <Film className="absolute top-8 left-8 w-16 h-16 text-slate-100 opacity-30 animate-pulse" />
                      <Star className="absolute top-12 right-16 w-12 h-12 text-slate-100 opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }} />
                      <Play className="absolute bottom-8 left-16 w-14 h-14 text-slate-100 opacity-25 animate-pulse" style={{ animationDelay: '1s' }} />
                      <Award className="absolute top-20 right-8 w-10 h-10 text-slate-100 opacity-20 animate-bounce" style={{ animationDelay: '1.5s' }} />
                      <Sparkles className="absolute bottom-12 right-12 w-8 h-8 text-slate-100 opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
                      <Ticket className="absolute top-32 left-32 w-12 h-12 text-slate-100 opacity-15 animate-bounce" style={{ animationDelay: '2.5s' }} />
                      <Eye className="absolute bottom-16 left-32 w-10 h-10 text-slate-100 opacity-20 animate-pulse" style={{ animationDelay: '3s' }} />
                      <Calendar className="absolute top-40 right-24 w-14 h-14 text-slate-100 opacity-20 animate-pulse" style={{ animationDelay: '3.5s' }} />
                      <Users className="absolute bottom-24 right-20 w-12 h-12 text-slate-100 opacity-15 animate-bounce" style={{ animationDelay: '4s' }} />
                      <Heart className="absolute top-16 left-48 w-10 h-10 text-slate-100 opacity-25 animate-pulse" style={{ animationDelay: '4.5s' }} />
                      <Zap className="absolute bottom-8 right-40 w-8 h-8 text-slate-100 opacity-20 animate-bounce" style={{ animationDelay: '5s' }} />
                    </div>
                    
                    <div className="relative z-10 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <DialogTitle className="text-xl font-bold text-slate-900 mb-1">Cinema Showtimes</DialogTitle>
                          <p className="text-slate-600 text-sm">Discover the latest movies and showtimes</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span>{filteredMovies.length} Movies</span>
                        </div>
                      </div>

                      {/* Clean Search and Filters */}
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Search movies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-sm"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="w-full lg:w-44 bg-white border-slate-200 text-slate-900 py-2.5 rounded-lg shadow-sm text-sm">
                              <Filter className="w-4 h-4 mr-2 text-slate-400" />
                              <SelectValue placeholder="Genre" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                              <SelectItem value="all">All Genres</SelectItem>
                              {genres.map((genre) => (
                                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={selectedCinema} onValueChange={setSelectedCinema}>
                            <SelectTrigger className="w-full lg:w-52 bg-white border-slate-200 text-slate-900 py-2.5 rounded-lg shadow-sm text-sm">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                              <SelectValue placeholder="Cinema" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                              <SelectItem value="all">All Cinemas</SelectItem>
                              {cinemas.map((cinema) => (
                                <SelectItem key={cinema} value={cinema}>{cinema}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredMovies.map((movie, index) => (
                        <Card key={movie.id} className="group bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-xl">
                          <div className="flex flex-col h-full">
                            {/* Movie Poster - Smaller and Fixed Height */}
                            <div className="relative h-36 overflow-hidden">
                              <img
                                src={movie.poster || "/placeholder.svg"}
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {/* Subtle Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                              
                              {/* Format Badge */}
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-emerald-500 text-white border-0 px-1.5 py-0.5 font-medium text-xs">
                                  {movie.format}
                                </Badge>
                              </div>
                              
                              {/* Movie Title Overlay */}
                              <div className="absolute bottom-2 left-2 right-2">
                                <h3 className="font-semibold text-sm text-white mb-1 group-hover:text-emerald-200 transition-colors drop-shadow-lg line-clamp-2">
                                  {movie.title}
                                </h3>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm text-xs px-1 py-0.5">
                                    {movie.genre}
                                  </Badge>
                                  <span className="text-xs text-white/90">{movie.duration}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Content - Compact */}
                            <CardContent className="p-3 flex-1 flex flex-col">
                              {/* Movie Details - Compact */}
                              <div className="space-y-2 mb-3 flex-1">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <MapPin className="w-3 h-3 text-emerald-500" />
                                  <span className="truncate">{movie.cinema}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <Users className="w-3 h-3 text-emerald-500" />
                                  <span>{movie.language}</span>
                                  <span className="text-slate-400">•</span>
                                  <span>{movie.rating}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                  <Calendar className="w-3 h-3 text-emerald-500" />
                                  <span>Today's Shows</span>
                                </div>
                              </div>
                              
                              {/* Showtimes - Compact Grid */}
                              <div className="grid grid-cols-3 gap-1 mb-3">
                                {movie.showtimes.map((time, index) => (
                                  <div
                                    key={index}
                                    className="text-center py-1.5 px-1 bg-slate-50 rounded-md border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all duration-200 group/time"
                                  >
                                    <Clock className="w-2.5 h-2.5 mx-auto mb-0.5 text-slate-500 group-hover/time:text-emerald-500 transition-colors" />
                                    <span className="text-xs font-semibold text-slate-900 group-hover/time:text-emerald-700 transition-colors">
                                      {time}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Action Button - Compact */}
                              <div className="mt-auto">
                                <button className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md text-xs">
                                  <Ticket className="w-3 h-3" />
                                  Book Tickets
                                </button>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Empty State */}
                    {filteredMovies.length === 0 && (
                      <div className="text-center py-16">
                        <div className="relative inline-block mb-4">
                          <div className="p-4 bg-slate-100 rounded-2xl">
                            <Film className="w-12 h-12 text-slate-400" />
                          </div>
                          <div className="absolute -top-1 -right-1">
                            <div className="p-1.5 bg-emerald-100 rounded-full">
                              <Search className="w-4 h-4 text-emerald-500" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Movies Found</h3>
                        <p className="text-slate-600 mb-4 text-sm">Try adjusting your search criteria or filters.</p>
                        <button 
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedGenre("all");
                            setSelectedCinema("all");
                          }}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-1.5 mx-auto"
                        >
                          <X className="w-4 h-4" />
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Professional Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-red-400" />
                          <span>Updated Daily</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Live Showtimes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Powered by Pattaya Cinema Network</span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom CSS for professional animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}