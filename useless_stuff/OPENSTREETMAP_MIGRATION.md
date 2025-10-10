# OpenStreetMap Migration Guide

## Overview

This project has been successfully migrated from **Google Maps API** to **OpenStreetMap** (OSM) with open-source alternatives. This eliminates the need for Google Maps API keys and removes associated costs.

## What Changed

### Backend Services

**Before (Google Maps):**
- Google Maps JavaScript Services
- Directions API
- Distance Matrix API
- Geocoding API
- Places API

**After (OpenStreetMap):**
- **Nominatim** - Free geocoding service
- **OSRM (Open Source Routing Machine)** - Free routing and directions
- **Leaflet.js** - Free, open-source map display library

### Files Modified

1. **`src/services/maps.service.js`**
   - Completely rewritten to use Nominatim and OSRM APIs
   - No API key required
   - Built-in rate limiting for Nominatim (1 request/second)
   - Fallback to Haversine formula when APIs unavailable

2. **`package.json`**
   - Removed: `@googlemaps/google-maps-services-js`
   - Uses existing `axios` for API calls

3. **`.env.example`**
   - Removed: `GOOGLE_MAPS_API_KEY`
   - Added documentation about OpenStreetMap services

4. **Frontend Files:**
   - `public/js/tracking.js` - Now uses Leaflet.js
   - `src/views/orders/view.ejs` - Updated to use Leaflet.js
   - `src/views/orders/checkout.ejs` - Updated to use Leaflet.js with Nominatim geocoding

## API Services Used

### 1. Nominatim (Geocoding)
- **URL:** https://nominatim.openstreetmap.org/
- **Purpose:** Convert addresses to coordinates and vice versa
- **Rate Limit:** 1 request per second
- **Cost:** FREE
- **Usage Policy:** Must include User-Agent header
- **Production Note:** Consider self-hosting or using commercial Nominatim providers for heavy usage

### 2. OSRM (Routing)
- **URL:** https://router.project-osrm.org/
- **Purpose:** Calculate routes, distances, and travel times
- **Rate Limit:** No strict limit on demo server
- **Cost:** FREE
- **Production Note:** For production use, consider self-hosting OSRM or using commercial providers like Mapbox

### 3. Leaflet.js (Map Display)
- **CDN:** https://unpkg.com/leaflet@1.9.4/
- **Purpose:** Interactive map display in browser
- **Cost:** FREE
- **License:** BSD-2-Clause

## Installation

### 1. Remove Google Maps Dependency

```bash
npm uninstall @googlemaps/google-maps-services-js
```

### 2. Install/Update Dependencies

```bash
npm install
```

Note: No new dependencies needed! We use the existing `axios` package.

### 3. Update Environment Variables

Remove or comment out the Google Maps API key from your `.env` file:

```bash
# No longer needed:
# GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 4. Restart Your Application

```bash
npm start
```

## Features Comparison

| Feature | Google Maps | OpenStreetMap | Status |
|---------|-------------|---------------|--------|
| Geocoding | ✅ | ✅ Nominatim | ✅ Working |
| Reverse Geocoding | ✅ | ✅ Nominatim | ✅ Working |
| Directions/Routing | ✅ | ✅ OSRM | ✅ Working |
| Distance Matrix | ✅ | ✅ OSRM (manual) | ✅ Working |
| Route Optimization | ✅ | ✅ OSRM Trip | ✅ Working |
| Real-time Traffic | ✅ | ❌ | ⚠️ Fallback to average speeds |
| Places Autocomplete | ✅ | ⚠️ Basic search | ⚠️ Simplified |
| Map Display | ✅ | ✅ Leaflet.js | ✅ Working |
| Real-time Tracking | ✅ | ✅ Leaflet.js | ✅ Working |

## Code Examples

### Backend - Get Directions

```javascript
import mapsService from './services/maps.service.js';

// Get route from point A to B
const route = await mapsService.getDirections(
  { lat: 14.5995, lng: 120.9842 },  // Manila
  { lat: 14.6507, lng: 121.0494 }   // Quezon City
);

console.log(route.distance.km);      // Distance in km
console.log(route.duration.minutes); // Duration in minutes
console.log(route.polyline);         // Encoded polyline for map
```

### Backend - Geocode Address

```javascript
const result = await mapsService.geocodeAddress('Makati, Metro Manila, Philippines');

console.log(result.location.lat);     // Latitude
console.log(result.location.lng);     // Longitude
console.log(result.formattedAddress); // Full address
```

### Frontend - Display Map

```javascript
// Initialize map
const map = L.map('map').setView([14.5995, 120.9842], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Add marker
const marker = L.marker([14.5995, 120.9842]).addTo(map);
```

## Rate Limiting & Best Practices

### Nominatim Rate Limiting

The service includes built-in rate limiting to comply with Nominatim's usage policy:

```javascript
// Automatically enforced 1 request per second
await mapsService.geocodeAddress('address1');
await mapsService.geocodeAddress('address2'); // Will wait 1 second
```

### Caching Recommendations

For production, implement caching to reduce API calls:

```javascript
// Example: Cache geocoding results
const cache = new Map();

async function geocodeWithCache(address) {
  if (cache.has(address)) {
    return cache.get(address);
  }

  const result = await mapsService.geocodeAddress(address);
  cache.set(address, result);
  return result;
}
```

## Production Considerations

### 1. Self-Hosting (Recommended for High Traffic)

For production applications with high traffic, consider self-hosting:

**OSRM Server:**
```bash
# Docker installation
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/philippines-latest.osrm
```

**Nominatim Server:**
```bash
# Docker installation
docker run -it -p 8080:8080 mediagis/nominatim:4.2
```

Then update `maps.service.js`:
```javascript
this.nominatimBaseUrl = 'http://localhost:8080';
this.osrmBaseUrl = 'http://localhost:5000';
```

### 2. Commercial Alternatives

If self-hosting is not feasible, consider commercial OSM-based providers:

- **Mapbox** - OSRM-based routing with generous free tier
- **LocationIQ** - Commercial Nominatim with higher rate limits
- **Stadia Maps** - OpenStreetMap tiles and geocoding
- **Geoapify** - OSM-based geocoding and routing

### 3. Fallback Strategy

The service includes automatic fallbacks:

1. **Primary:** OSRM/Nominatim APIs
2. **Fallback:** Haversine formula for distance calculations
3. **Error Handling:** Graceful degradation with estimated values

## Migration Checklist

- [x] Remove Google Maps API key from `.env`
- [x] Uninstall `@googlemaps/google-maps-services-js`
- [x] Update `maps.service.js` to use OSM services
- [x] Update frontend to use Leaflet.js
- [x] Update all view templates (EJS files)
- [x] Test geocoding functionality
- [x] Test routing/directions
- [x] Test real-time tracking
- [x] Update documentation

## Testing

### Test Backend Services

```javascript
// Test in Node.js console or create a test file
import mapsService from './src/services/maps.service.js';

// Test geocoding
const geocode = await mapsService.geocodeAddress('Manila, Philippines');
console.log('Geocode:', geocode);

// Test routing
const route = await mapsService.getDirections(
  { lat: 14.5995, lng: 120.9842 },
  { lat: 14.6507, lng: 121.0494 }
);
console.log('Route:', route);

// Test distance calculation
const distance = mapsService.calculateDistance(
  14.5995, 120.9842,
  14.6507, 121.0494
);
console.log('Distance:', distance, 'km');
```

### Test Frontend

1. Open the checkout page
2. Enter an address in Philippines
3. Verify the map updates with correct location
4. Create an order with delivery tracking
5. Verify real-time tracking map displays correctly

## Troubleshooting

### Issue: Geocoding not working

**Solution:** Check User-Agent header is set correctly in `maps.service.js`

### Issue: Rate limit errors from Nominatim

**Solution:** The service has built-in rate limiting. If you're still hitting limits, consider:
- Implementing result caching
- Self-hosting Nominatim
- Using a commercial provider

### Issue: Map not displaying

**Solution:** Ensure Leaflet.js CSS and JS are loaded:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Issue: Routes not calculating for Philippines

**Solution:** OSRM's demo server has global coverage. If issues persist:
- Check coordinates are in correct format (lat, lng)
- Verify the coordinates are within Philippines
- Consider self-hosting OSRM with Philippines data

## Benefits of Migration

✅ **No API Key Required** - No Google Cloud account needed
✅ **Zero Cost** - Completely free for moderate usage
✅ **Open Source** - Full control and transparency
✅ **Privacy** - No data sent to Google
✅ **No Billing Surprises** - No unexpected charges
✅ **Community-Driven** - Regular updates from OSM community
✅ **Scalable** - Can self-host for unlimited usage

## Performance Notes

- **Geocoding:** Nominatim is generally fast but has 1 req/sec limit
- **Routing:** OSRM is typically faster than Google Directions API
- **Map Display:** Leaflet.js is lightweight and performant
- **Tile Loading:** OpenStreetMap tiles are cached by browsers

## Support & Resources

- **OpenStreetMap:** https://www.openstreetmap.org/
- **Nominatim Docs:** https://nominatim.org/release-docs/latest/
- **OSRM Docs:** http://project-osrm.org/
- **Leaflet.js Docs:** https://leafletjs.com/
- **OSM Usage Policy:** https://operations.osmfoundation.org/policies/tiles/

## License

This migration uses the following open-source components:

- **OpenStreetMap Data:** ODbL (Open Database License)
- **Leaflet.js:** BSD-2-Clause License
- **OSRM:** BSD-2-Clause License
- **Nominatim:** GPL-2.0 License

All are free to use in commercial applications.
