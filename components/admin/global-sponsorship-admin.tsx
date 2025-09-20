"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Megaphone, Save, RefreshCw, CheckSquare, Square } from "lucide-react"
import { buildApiUrl } from "@/lib/strapi-config"

interface SponsorshipTitle {
  id?: number
  title: string
  color: string
  isActive: boolean
  displayOrder: number
}

interface GlobalSponsorship {
  id?: number
  sponsorshipTitles: SponsorshipTitle[]
  isActive: boolean
  sponsoredWidgets: string[]
  defaultColor: string
  animationSpeed: 'slow' | 'normal' | 'fast'
  sponsorWebsite?: string
  sponsorLogo?: string
  sponsorStartDate?: string
  sponsorEndDate?: string
}

const ALL_WIDGETS = [
  { id: "radio", name: "Radio Widget", description: "Live radio streaming" },
  { id: "weather", name: "Weather Widget", description: "Current weather and forecasts" },
  { id: "news", name: "News Widget", description: "Latest news updates" },
  { id: "events", name: "Events Widget", description: "Upcoming events" },
  { id: "deals", name: "Deals Widget", description: "Hot deals and offers" },
  { id: "business", name: "Business Widget", description: "Business directory" },
  { id: "social", name: "Social Widget", description: "Social media feeds" },
  { id: "traffic", name: "Traffic Widget", description: "Traffic updates" },
  { id: "youtube", name: "YouTube Widget", description: "Video content" },
  { id: "photos", name: "Photos Widget", description: "Photo gallery" },
  { id: "quick-links", name: "Quick Links Widget", description: "Quick navigation links" },
  { id: "trending", name: "Trending Widget", description: "Trending topics" },
  { id: "breaking-news", name: "Breaking News Widget", description: "Breaking news alerts" },
  { id: "live-events", name: "Live Events Widget", description: "Live event streaming" },
  { id: "business-spotlight", name: "Business Spotlight Widget", description: "Featured businesses" },
  { id: "hot-deals", name: "Hot Deals Widget", description: "Enhanced hot deals" }
]

export function GlobalSponsorshipAdmin() {
  const [sponsorship, setSponsorship] = useState<GlobalSponsorship>({
    sponsorshipTitles: [],
    isActive: false,
    sponsoredWidgets: [],
    defaultColor: "#1e40af",
    animationSpeed: "normal",
    sponsorWebsite: "",
    sponsorLogo: "",
    sponsorStartDate: "",
    sponsorEndDate: ""
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCurrentSponsorship()
  }, [])

  const loadCurrentSponsorship = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl('global-sponsorships?filters[isActive][$eq]=true&sort=createdAt:desc&pagination[limit]=1&populate=*'))
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          const sponsorshipData = data.data[0]
          setSponsorship({
            id: sponsorshipData.id,
            sponsorshipTitles: sponsorshipData.attributes?.sponsorshipTitles || [],
            isActive: sponsorshipData.attributes?.isActive || false,
            sponsoredWidgets: sponsorshipData.attributes?.sponsoredWidgets || [],
            defaultColor: sponsorshipData.attributes?.defaultColor || "#1e40af",
            animationSpeed: sponsorshipData.attributes?.animationSpeed || "normal",
            sponsorWebsite: sponsorshipData.attributes?.sponsorWebsite || "",
            sponsorLogo: sponsorshipData.attributes?.sponsorLogo || "",
            sponsorStartDate: sponsorshipData.attributes?.sponsorStartDate || "",
            sponsorEndDate: sponsorshipData.attributes?.sponsorEndDate || ""
          })
        }
      }
    } catch (error) {
      console.error('Error loading sponsorship:', error)
      toast({
        title: "Error",
        description: "Failed to load current sponsorship settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSponsorship = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (sponsorship.isActive && sponsorship.sponsorshipTitles.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one sponsorship title when sponsorship is active",
          variant: "destructive"
        })
        return
      }
      
      if (sponsorship.isActive && sponsorship.sponsorshipTitles.some(title => !title.title.trim())) {
        toast({
          title: "Validation Error",
          description: "All sponsorship titles must have text",
          variant: "destructive"
        })
        return
      }
      
      const payload = {
        data: {
          sponsorshipTitles: sponsorship.sponsorshipTitles,
          isActive: sponsorship.isActive,
          sponsoredWidgets: sponsorship.sponsoredWidgets,
          defaultColor: sponsorship.defaultColor,
          animationSpeed: sponsorship.animationSpeed,
          sponsorWebsite: sponsorship.sponsorWebsite || null,
          sponsorLogo: sponsorship.sponsorLogo || null,
          sponsorStartDate: sponsorship.sponsorStartDate || null,
          sponsorEndDate: sponsorship.sponsorEndDate || null
        }
      }

      let response
      if (sponsorship.id) {
        // Update existing
        response = await fetch(buildApiUrl(`global-sponsorships/${sponsorship.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
      } else {
        // Create new
        response = await fetch(buildApiUrl('global-sponsorships'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        const result = await response.json()
        setSponsorship(prev => ({ ...prev, id: result.data?.id }))
        toast({
          title: "Success",
          description: "Global sponsorship settings updated successfully",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update sponsorship: ${response.status}`)
      }
    } catch (error) {
      console.error('Error saving sponsorship:', error)
      toast({
        title: "Error",
        description: "Failed to save sponsorship settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleWidgetToggle = (widgetId: string) => {
    setSponsorship(prev => ({
      ...prev,
      sponsoredWidgets: prev.sponsoredWidgets.includes(widgetId)
        ? prev.sponsoredWidgets.filter(id => id !== widgetId)
        : [...prev.sponsoredWidgets, widgetId]
    }))
  }

  const handleSelectAll = () => {
    setSponsorship(prev => ({
      ...prev,
      sponsoredWidgets: prev.sponsoredWidgets.length === ALL_WIDGETS.length 
        ? [] 
        : ALL_WIDGETS.map(w => w.id)
    }))
  }

  const addSponsorshipTitle = () => {
    setSponsorship(prev => ({
      ...prev,
      sponsorshipTitles: [
        ...prev.sponsorshipTitles,
        {
          title: "",
          color: prev.defaultColor,
          isActive: true,
          displayOrder: prev.sponsorshipTitles.length + 1
        }
      ]
    }))
  }

  const updateSponsorshipTitle = (index: number, field: keyof SponsorshipTitle, value: any) => {
    setSponsorship(prev => ({
      ...prev,
      sponsorshipTitles: prev.sponsorshipTitles.map((title, i) => 
        i === index ? { ...title, [field]: value } : title
      )
    }))
  }

  const removeSponsorshipTitle = (index: number) => {
    setSponsorship(prev => ({
      ...prev,
      sponsorshipTitles: prev.sponsorshipTitles.filter((_, i) => i !== index)
    }))
  }

  const isAllSelected = sponsorship.sponsoredWidgets.length === ALL_WIDGETS.length
  const isPartiallySelected = sponsorship.sponsoredWidgets.length > 0 && sponsorship.sponsoredWidgets.length < ALL_WIDGETS.length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading sponsorship settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Global Widget Sponsorship
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sponsorship Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">Enable Global Sponsorship</Label>
            <p className="text-sm text-muted-foreground">
              Show sponsorship text on selected widgets across the homepage
            </p>
          </div>
          <Switch
            id="isActive"
            checked={sponsorship.isActive}
            onCheckedChange={(checked) => 
              setSponsorship(prev => ({ ...prev, isActive: checked }))
            }
          />
        </div>

        {sponsorship.isActive && (
          <>
            {/* Sponsorship Titles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sponsorship Titles</Label>
                  <p className="text-sm text-muted-foreground">
                    Add multiple titles that will be displayed. Single title shows static text, multiple titles show marquee animation.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSponsorshipTitle}
                >
                  Add Title
                </Button>
              </div>

              {sponsorship.sponsorshipTitles.length === 0 && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-sm text-gray-500 mb-2">No sponsorship titles added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSponsorshipTitle}
                  >
                    Add First Title
                  </Button>
                </div>
              )}

              {sponsorship.sponsorshipTitles.map((title, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Title {index + 1}</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={title.isActive}
                        onCheckedChange={(checked) => 
                          updateSponsorshipTitle(index, 'isActive', checked)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSponsorshipTitle(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${index}`}>Title Text *</Label>
                      <Input
                        id={`title-${index}`}
                        placeholder="e.g., Sponsored by Singha Beer"
                        value={title.title}
                        onChange={(e) => 
                          updateSponsorshipTitle(index, 'title', e.target.value)
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`color-${index}`}>Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`color-${index}`}
                          type="color"
                          value={title.color}
                          onChange={(e) => 
                            updateSponsorshipTitle(index, 'color', e.target.value)
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={title.color}
                          onChange={(e) => 
                            updateSponsorshipTitle(index, 'color', e.target.value)
                          }
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Default Color */}
            <div className="space-y-2">
              <Label htmlFor="defaultColor">Default Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="defaultColor"
                  type="color"
                  value={sponsorship.defaultColor}
                  onChange={(e) => 
                    setSponsorship(prev => ({ ...prev, defaultColor: e.target.value }))
                  }
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={sponsorship.defaultColor}
                  onChange={(e) => 
                    setSponsorship(prev => ({ ...prev, defaultColor: e.target.value }))
                  }
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Default color for new titles and fallback color
              </p>
            </div>

            {/* Animation Speed */}
            <div className="space-y-2">
              <Label htmlFor="animationSpeed">Animation Speed</Label>
              <select
                id="animationSpeed"
                value={sponsorship.animationSpeed}
                onChange={(e) => 
                  setSponsorship(prev => ({ ...prev, animationSpeed: e.target.value as 'slow' | 'normal' | 'fast' }))
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Speed of marquee animation when multiple titles are present
              </p>
            </div>

            {/* Widget Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Select Widgets</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which widgets should display the sponsorship text
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {isAllSelected ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <CheckSquare className="h-4 w-4" />
                  )}
                  {isAllSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_WIDGETS.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={widget.id}
                      checked={sponsorship.sponsoredWidgets.includes(widget.id)}
                      onCheckedChange={() => handleWidgetToggle(widget.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={widget.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {widget.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {sponsorship.sponsoredWidgets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  {sponsorship.sponsoredWidgets.map((widgetId) => {
                    const widget = ALL_WIDGETS.find(w => w.id === widgetId)
                    return (
                      <Badge key={widgetId} variant="secondary" className="text-xs">
                        {widget?.name}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sponsor Website */}
            <div className="space-y-2">
              <Label htmlFor="sponsorWebsite">Sponsor Website (Optional)</Label>
              <Input
                id="sponsorWebsite"
                type="url"
                placeholder="https://example.com"
                value={sponsorship.sponsorWebsite}
                onChange={(e) => 
                  setSponsorship(prev => ({ ...prev, sponsorWebsite: e.target.value }))
                }
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sponsorStartDate">Start Date (Optional)</Label>
                <Input
                  id="sponsorStartDate"
                  type="date"
                  value={sponsorship.sponsorStartDate}
                  onChange={(e) => 
                    setSponsorship(prev => ({ ...prev, sponsorStartDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsorEndDate">End Date (Optional)</Label>
                <Input
                  id="sponsorEndDate"
                  type="date"
                  value={sponsorship.sponsorEndDate}
                  onChange={(e) => 
                    setSponsorship(prev => ({ ...prev, sponsorEndDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={saveSponsorship}
            disabled={saving || (sponsorship.isActive && (sponsorship.sponsorshipTitles.length === 0 || sponsorship.sponsorshipTitles.some(title => !title.title.trim())))}
            className="flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
