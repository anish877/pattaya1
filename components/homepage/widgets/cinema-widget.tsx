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
import { Clock, MapPin, Search, ChevronRight, Film } from "lucide-react"
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

// Array of vibrant background gradients
const movieBackgrounds = [
  "linear-gradient(to top right, #6D28D9, #DB2777)", // Violet to Pink
  "linear-gradient(to top right, #0F766E, #1D4ED8)", // Teal to Blue
  "linear-gradient(to top right, #BE185D, #F59E0B)", // Rose to Amber
  "linear-gradient(to top right, #065F46, #4C1D95)", // Dark Green to Dark Purple
  "linear-gradient(to top right, #9D174D, #DC2626)", // Ruby to Red
  "linear-gradient(to top right, #0891B2, #65A30D)", // Cyan to Lime
  "linear-gradient(to top right, #4F46E5, #7C3AED)", // Indigo to Purple
  "linear-gradient(to top right, #C2410C, #EA580C)", // Orange to Dark Orange
  "linear-gradient(to top right, #DB2777, #FDE047)", // Pink to Yellow
  "linear-gradient(to top right, #6D28D9, #0891B2)", // Violet to Cyan
];


export function CinemaWidget() {
  const { movies, loading, error } = useMovies()
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedCinema, setSelectedCinema] = useState("all")
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])

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
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading movies...</p>
        </div>
      </div>
    )
  }

  if (error && movies.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center text-red-500">
          <p>Failed to load movies</p>
          <p className="text-sm text-gray-500">Displaying offline data</p>
        </div>
      </div>
    )
  }

  const currentMovie = movies[currentMovieIndex] || movies[0]
  const currentBackground = movieBackgrounds[currentMovieIndex % movieBackgrounds.length];
  const genres = [...new Set(movies.map((movie) => movie.genre))]
  const cinemas = [...new Set(movies.map((movie) => movie.cinema))]

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full relative overflow-hidden rounded-2xl border-0 shadow-2xl shadow-black/50 group">
        {/* --- Background Gradient with smooth transition --- */}
        <div
          className="absolute inset-0 transition-all duration-1000 ease-in-out"
          style={{ background: currentBackground }}
        ></div>
        
        {/* --- Image Overlay (optional, remove if you want pure color) --- */}
        {movies.map((movie, index) => (
          <img
            key={movie.id}
            src={movie.poster || "/placeholder.svg"}
            alt={movie.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out mix-blend-overlay opacity-30 group-hover:scale-105 ${
              index === currentMovieIndex ? "opacity-30" : "opacity-0"
            }`}
          />
        ))}

        {/* --- Gradient Overlay for Readability --- */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

        <CardContent className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
          {/* --- Header --- */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
              <Film className="w-5 h-5 text-purple-300" />
              <span className="text-sm font-semibold text-white/90 tracking-wider">CINEMAX</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-purple-400/20 border border-purple-300/50 text-purple-200 backdrop-blur-sm text-xs font-bold px-3 py-1 uppercase"
            >
              {currentMovie.format}
            </Badge>
          </div>

          {/* --- Main Content --- */}
          <div className="flex flex-col justify-end h-full pt-20">
            {/* Movie Title - Animate on change */}
            <div key={currentMovie.id + "title"} className="animate-fade-in-up">
              <h2 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">{currentMovie.title}</h2>
              {/* Genre, Duration, Rating */}
              <div className="flex items-center gap-4 text-sm mt-3 text-white/80">
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white/90 backdrop-blur-sm">
                  {currentMovie.genre}
                </Badge>
                <span>{currentMovie.duration}</span>
                <span className="opacity-50">•</span>
                <span>{currentMovie.rating}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
               {/* Cinema Location */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-purple-300" />
                <span>{currentMovie.cinema}</span>
              </div>

              {/* Showtimes */}
              <div className="flex items-center flex-wrap gap-2">
                <Clock className="w-4 h-4 text-purple-300 mr-2" />
                {currentMovie.showtimes.slice(0, 4).map((time, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="backdrop-blur-sm bg-white/10 border-white/30 text-white/90 text-sm px-4 py-1.5 hover:bg-white/20 hover:border-white/50 cursor-pointer transition-all"
                  >
                    {time}
                  </Badge>
                ))}
              </div>
            </div>

            {/* --- Footer --- */}
            <div className="mt-8">
              {/* Movie Indicators (clickable) */}
              <div className="flex justify-center gap-2 mb-6">
                {movies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMovieIndex(index)}
                    className={`h-2 rounded-full transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                      index === currentMovieIndex ? "bg-purple-300 w-8 shadow-[0_0_10px_rgba(192,132,252,0.7)]" : "bg-white/50 w-2 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              {/* Expand Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 transition-all duration-300 rounded-lg px-4 py-3 flex items-center justify-center cursor-pointer font-semibold text-sm text-white shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-100">
                    View All Movies
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-purple-300">Now Showing</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6 my-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            placeholder="Search movies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border-gray-700 text-white pl-10 focus:ring-purple-500 focus:border-purple-500"
                          />
                      </div>
                      <div className="flex gap-4">
                          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="all">All Genres</SelectItem>
                              {genres.map((genre) => (
                                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={selectedCinema} onValueChange={setSelectedCinema}>
                            <SelectTrigger className="w-full md:w-64 bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Select cinema" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="all">All Cinemas</SelectItem>
                              {cinemas.map((cinema) => (
                                <SelectItem key={cinema} value={cinema}>{cinema}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMovies.map((movie) => (
                      <Card key={movie.id} className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-purple-400/50 transition-all group">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={movie.poster || "/placeholder.svg"}
                              alt={movie.title}
                              className="w-24 h-36 object-cover rounded-md flex-shrink-0"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-purple-300 mb-2 group-hover:text-purple-200">{movie.title}</h3>
                              <div className="space-y-1.5 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-pink-400/20 text-pink-300">{movie.format}</Badge>
                                  <Badge variant="outline" className="border-gray-600">{movie.genre}</Badge>
                                  <span>{movie.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {movie.cinema}
                                </div>
                                <span>Language: {movie.language}</span>
                              </div>
                              <div className="mt-4">
                                <p className="text-sm font-medium text-purple-300 mb-2">Showtimes:</p>
                                <div className="flex flex-wrap gap-2">
                                  {movie.showtimes.map((time, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="border-gray-600 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-500 cursor-pointer transition-colors"
                                    >
                                      {time}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredMovies.length === 0 && (
                    <div className="text-center py-10 text-gray-500">No movies found matching your criteria.</div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}