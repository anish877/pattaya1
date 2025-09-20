import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || searchParams.get("q") || ""
  const contentType = searchParams.get("contentType") || ""
  const category = searchParams.get("category") || ""
  const rating = Number.parseFloat(searchParams.get("rating") || "0")
  const distance = Number.parseFloat(searchParams.get("distance") || "20")
  const openNow = searchParams.get("openNow") === "true"
  const hasDeals = searchParams.get("hasDeals") === "true"
  const verified = searchParams.get("verified") === "true"

  // Handle flight-specific search
  if (contentType === "flight-tracker" || query.toLowerCase().includes("flight") || /^[A-Z]{2}\d+$/.test(query.toUpperCase())) {
    try {
      // Search all flights from Strapi API
      const flightResponse = await fetch(` http://localhost:1337/api/flight-trackers`)
      
      if (flightResponse.ok) {
        const flightData = await flightResponse.json()
        
        // Filter flights based on query
        const filteredFlights = flightData.data.filter((flight: any) => {
          const searchTerm = query.toLowerCase()
          return (
            flight.FlightNumber?.toLowerCase().includes(searchTerm) ||
            flight.Airline?.toLowerCase().includes(searchTerm) ||
            flight.Airport?.toLowerCase().includes(searchTerm) ||
            searchTerm === "flight"
          )
        })
        
        return NextResponse.json({
          results: filteredFlights.map((flight: any) => ({
            id: flight.id,
            type: "flight",
            flightNumber: flight.FlightNumber,
            airline: flight.Airline,
            airport: flight.Airport,
            flightStatus: flight.FlightStatus,
            flightType: flight.FlightType,
            terminal: flight.Terminal,
            gate: flight.Gate,
            scheduledTime: flight.ScheduledTime,
            estimatedTime: flight.EstimatedTime,
            title: `${flight.FlightNumber} - ${flight.Airline}`,
            description: `${flight.FlightType === 'arrival' ? 'Arriving from' : 'Departing to'} ${flight.Airport} - Terminal ${flight.Terminal}, Gate ${flight.Gate}`
          })),
          total: filteredFlights.length,
          contentType: "flight-tracker",
          query: { query, contentType }
        })
      }
    } catch (error) {
      console.error('Flight search error:', error)
    }
  }

  // Handle airport search (BKK, DMK, etc.)
  if (/^[A-Z]{3}$/.test(query.toUpperCase())) {
    try {
      const airportCode = query.toUpperCase()
      const flightResponse = await fetch(` http://localhost:1337/api/flight-tracker/airports/${airportCode}`)
      
      if (flightResponse.ok) {
        const flightData = await flightResponse.json()
        return NextResponse.json({
          results: flightData.data.map((flight: any) => ({
            id: flight.id,
            type: "airport-flight",
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            airport: flight.airport,
            flightStatus: flight.flightStatus,
            flightType: flight.flightType,
            terminal: flight.terminal,
            gate: flight.gate,
            title: `${flight.flightNumber} - ${flight.airline}`,
            description: `${flight.flightType === 'arrival' ? 'Arrival' : 'Departure'} - Terminal ${flight.terminal}, Gate ${flight.gate}`
          })),
          total: flightData.data.length,
          contentType: "airport-search",
          airport: airportCode,
          query: { query, contentType }
        })
      }
    } catch (error) {
      console.error('Airport search error:', error)
    }
  }

  // Default business/location search results
  const allResults = [
    {
      id: "1",
      name: "Ocean View Restaurant",
      description: "Authentic Thai cuisine with stunning ocean views",
      address: "123 Beach Road, Pattaya",
      category: "restaurants",
      rating: 4.8,
      image: "/placeholder.svg?height=300&width=400",
      isOpen: true,
      hasDeals: true,
      verified: true,
      distance: 2.5,
    },
    {
      id: "2",
      name: "Sanctuary of Truth",
      description: "Magnificent wooden temple showcasing traditional architecture",
      address: "206/2 Moo 5, Naklua Road",
      category: "attractions",
      rating: 4.9,
      image: "/placeholder.svg?height=300&width=400",
      isOpen: true,
      hasDeals: false,
      verified: true,
      distance: 8.2,
    },
    {
      id: "3",
      name: "Central Festival Pattaya",
      description: "Premier shopping destination with international brands",
      address: "333/99 Moo 9, Beach Road",
      category: "shopping",
      rating: 4.6,
      image: "/placeholder.svg?height=300&width=400",
      isOpen: true,
      hasDeals: true,
      verified: true,
      distance: 1.8,
    },
    {
      id: "4",
      name: "Hilton Pattaya",
      description: "Luxury beachfront hotel with world-class amenities",
      address: "333/101 Moo 9, Beach Road",
      category: "hotels",
      rating: 4.7,
      image: "/placeholder.svg?height=300&width=400",
      isOpen: true,
      hasDeals: false,
      verified: true,
      distance: 3.1,
    },
    {
      id: "5",
      name: "Pattaya International Hospital",
      description: "Leading healthcare facility with international standards",
      address: "301 Chaiyapruek Road",
      category: "services",
      rating: 4.5,
      image: "/placeholder.svg?height=300&width=400",
      isOpen: true,
      hasDeals: false,
      verified: true,
      distance: 4.2,
    },
  ]

  // Filter results based on search criteria
  const filteredResults = allResults.filter((result) => {
    const matchesQuery =
      !query ||
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())

    const matchesCategory = !category || result.category === category
    const matchesRating = result.rating >= rating
    const matchesDistance = result.distance <= distance
    const matchesOpenNow = !openNow || result.isOpen
    const matchesHasDeals = !hasDeals || result.hasDeals
    const matchesVerified = !verified || result.verified

    return (
      matchesQuery &&
      matchesCategory &&
      matchesRating &&
      matchesDistance &&
      matchesOpenNow &&
      matchesHasDeals &&
      matchesVerified
    )
  })

  return NextResponse.json({
    results: filteredResults,
    total: filteredResults.length,
    query: {
      query: query,
      q: query,
      category,
      rating,
      distance,
      openNow,
      hasDeals,
      verified,
    },
  })
}
