# 🌤️ Weather Widget Setup Guide

## 🎯 Overview
The weather widget is now fully connected to Strapi backend APIs and ready for production use. It includes all requested features:
- Dynamic geolocation with GPS support
- Severe weather alerts
- Tide times & beach conditions
- Smart activity suggestions
- Real-time OpenWeatherMap integration
- Professional Apple-inspired UI

## 🚀 Quick Start

### 1. Backend Setup (Strapi)

#### Environment Configuration
Create/update your Strapi `.env` file:
```bash
# OpenWeatherMap API Key (Required)
OWM_API_KEY=your_openweathermap_api_key_here

# Optional: Customize default settings
WEATHER_DEFAULT_CITY=Pattaya City
WEATHER_DEFAULT_LAT=12.9236
WEATHER_DEFAULT_LON=100.8825
WEATHER_UPDATE_FREQUENCY=30
```

#### Get OpenWeatherMap API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free account
3. Get your API key from dashboard
4. Add to Strapi `.env` file

### 2. Frontend Setup (Next.js)

#### Environment Variables
Create/update your Next.js `.env.local`:
```bash
# Strapi API URL (REQUIRED - This is the key fix!)
NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com

# Optional: Weather widget settings
NEXT_PUBLIC_WEATHER_ENABLED=true
NEXT_PUBLIC_WEATHER_DEFAULT_UNITS=metric
```

**⚠️ IMPORTANT**: The `NEXT_PUBLIC_STRAPI_URL` is now **REQUIRED** for the weather widget to work. Without this, it will try to call APIs on the frontend server instead of the Strapi backend.

#### Component Integration
The weather widget is already integrated in:
- `components/homepage/widgets/enhanced-weather-widget.tsx`
- `components/homepage/modular-homepage.tsx`

## 🔧 API Endpoints

### Weather Data
- **GET** `/api/weather/current?lat={lat}&lon={lon}&units={metric|imperial}`
- **GET** `/api/weather/settings`
- **GET** `/api/weather/suggestions?condition={condition}`

### Response Format
```json
{
  "data": {
    "location": { "name": "Pattaya, Thailand", "lat": 12.9236, "lon": 100.8825 },
    "current": { "temperature": 32, "feelsLike": 39, "condition": "broken clouds" },
    "hourly": [...],
    "daily": [...],
    "airQuality": { "index": 2, "level": "Fair" },
    "marine": { "tideTimes": [...], "seaState": "Moderate" },
    "suggestions": [...]
  }
}
```

## 🧪 Testing

### Test API Endpoints
```bash
# Test all weather APIs
node test-weather-api.js

# Or test individually with curl
curl https://api.pattaya1.com/api/weather/settings
curl "https://api.pattaya1.com/api/weather/current?lat=12.9236&lon=100.8825&units=metric"
curl "https://api.pattaya1.com/api/weather/suggestions?condition=sunny"
```

### Test Frontend
1. Start your Next.js app: `npm run dev`
2. Navigate to homepage
3. Click weather widget to open modal
4. Test geolocation with locate button
5. Verify real-time data loading

### Quick Connection Test
```bash
# Test if Strapi is accessible
curl https://api.pattaya1.com/api/weather/settings

# Test if weather endpoint works
curl "https://api.pattaya1.com/api/weather/current?lat=12.9236&lon=100.8825&units=metric"
```

## 📱 Features Status

### ✅ Fully Implemented
- [x] Dynamic geolocation with GPS
- [x] Severe weather alerts
- [x] Tide times & beach conditions
- [x] Smart activity suggestions
- [x] Real API integration
- [x] Professional UI/UX
- [x] Responsive design
- [x] Error handling & fallbacks
- [x] Loading states
- [x] Unit conversion
- [x] Caching system
- [x] **Data structure alignment** (Backend ↔ Frontend)
- [x] **Recommendation system consistency**
- [x] **Priority-based suggestions**

### 🔄 Real-time Updates
- Weather data refreshes every 30 minutes (configurable)
- Location changes trigger immediate updates
- Unit changes reload data
- Manual refresh button available

## 🎨 Customization

### Strapi Admin Panel
1. **Weather Settings**: Configure default city, units, update frequency
2. **Activity Suggestions**: Manage weather-based recommendations
3. **Sponsorship**: Enable/disable sponsored weather widget
4. **Widget Control**: Enable/disable entire weather system

### Frontend Styling
- All styles use Tailwind CSS
- Easy to customize colors, spacing, animations
- Responsive breakpoints included
- Dark mode ready (can be added)

## 🚨 Troubleshooting

### Common Issues

#### 1. API Key Missing
```
Error: OpenWeatherMap API key not configured
```
**Solution**: Add `OWM_API_KEY` to Strapi `.env`

#### 2. CORS Issues
```
Error: CORS policy violation
```
**Solution**: Configure CORS in Strapi `config/middlewares.js`

#### 3. Weather Data Not Loading
```
Error: Unable to load weather data
```
**Solution**: Check Strapi logs, verify API key, test endpoints

#### 4. 404 Errors on Weather APIs
```
GET http://localhost:3000/api/weather/settings 404 (Not Found)
GET http://localhost:3000/api/weather/current 404 (Not Found)
```
**Solution**: This means the frontend is calling the wrong server. Add `NEXT_PUBLIC_STRAPI_URL=https://api.pattaya1.com` to your `.env.local` file.

#### 4. Location Permission Denied
```
Location denied or error
```
**Solution**: User denied GPS access, widget falls back to default location

### Debug Mode
Enable console logging:
```javascript
// In browser console
localStorage.setItem('weather-debug', 'true')
```

## 📊 Performance

### Caching Strategy
- **Backend**: Strapi caches weather data (configurable TTL)
- **Frontend**: Local storage for user preferences
- **API Calls**: Minimized with intelligent refresh logic

### Optimization
- Lazy loading of weather data
- Debounced location updates
- Efficient re-renders with React hooks
- Image optimization for weather icons

## 🔮 Future Enhancements

### Planned Features
- [ ] Dark mode support
- [ ] Weather history charts
- [ ] Push notifications for severe weather
- [ ] Multi-language support
- [ ] Weather maps integration
- [ ] Social sharing

### API Extensions
- [ ] Weather radar data
- [ ] Historical weather data
- [ ] Extended forecasts (10+ days)
- [ ] Weather alerts from multiple sources

## 📞 Support

### Documentation
- [OpenWeatherMap API Docs](https://openweathermap.org/api)
- [Strapi Documentation](https://docs.strapi.io/)
- [Next.js Documentation](https://nextjs.org/docs)

### Issues & Questions
1. Check this setup guide
2. Review console logs
3. Test API endpoints
4. Check Strapi admin panel
5. Verify environment variables

---

**🎉 Your weather widget is now fully connected and ready to provide real-time weather data to your users!** 