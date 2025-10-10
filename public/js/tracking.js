// Real-time order tracking with Socket.IO and Leaflet.js (OpenStreetMap)

let socket;
let map;
let driverMarker;
let destinationMarker;
let routeLayer;
let updateInterval;

// Initialize tracking
function initTracking(orderId, deliveryLat, deliveryLng, driverLat, driverLng) {
  // Connect to Socket.IO
  socket = io();

  // Join tracking room for this order
  socket.emit('tracking:join', orderId);

  // Initialize Leaflet Map with OpenStreetMap tiles
  const destination = [deliveryLat, deliveryLng];

  map = L.map('tracking-map').setView(destination, 14);

  // Add OpenStreetMap tile layer
  // Note: This uses the default URL. For custom URLs, pass via config on page load
  const tileUrl = window.OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    minZoom: 3
  }).addTo(map);

  // Custom icons
  const destinationIcon = L.divIcon({
    className: 'custom-marker destination-marker',
    html: '<div style="background-color: #4FC3F7; border: 3px solid #0288D1; width: 24px; height: 24px; border-radius: 50%;"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const driverIcon = L.divIcon({
    className: 'custom-marker driver-marker',
    html: '<div style="background-color: #FF9800; border: 3px solid #F57C00; width: 24px; height: 24px; border-radius: 50%;"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Destination marker (customer location) - Light Blue
  destinationMarker = L.marker(destination, {
    icon: destinationIcon,
    title: 'Your Location'
  }).addTo(map);

  // Driver marker - Orange
  if (driverLat && driverLng) {
    const driverPosition = [driverLat, driverLng];

    driverMarker = L.marker(driverPosition, {
      icon: driverIcon,
      title: 'Delivery Driver'
    }).addTo(map);

    // Draw route line
    drawRoute(driverPosition, destination);

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([driverPosition, destination]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  // Listen for driver location updates
  socket.on('tracking:update', (data) => {
    updateDriverLocation(data.lat, data.lng, destination);
  });

  // Listen for order status updates
  socket.on('order:updated', (data) => {
    if (data.orderId === orderId) {
      updateOrderStatus(data.status);
    }
  });
}

// Update driver location on map
function updateDriverLocation(lat, lng, destination) {
  const newPosition = [lat, lng];

  const driverIcon = L.divIcon({
    className: 'custom-marker driver-marker',
    html: '<div style="background-color: #FF9800; border: 3px solid #F57C00; width: 24px; height: 24px; border-radius: 50%;"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  if (driverMarker) {
    // Smooth marker animation
    driverMarker.setLatLng(newPosition);
  } else {
    // Create driver marker if doesn't exist
    driverMarker = L.marker(newPosition, {
      icon: driverIcon,
      title: 'Delivery Driver'
    }).addTo(map);
  }

  // Update route
  drawRoute(newPosition, destination);

  // Calculate and display ETA
  updateETA(newPosition, destination);

  // Fit bounds to show both markers
  const bounds = L.latLngBounds([newPosition, destination]);
  map.fitBounds(bounds, { padding: [50, 50] });
}

// Draw route between driver and destination
async function drawRoute(origin, destination) {
  try {
    // Remove existing route if any
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    // Use OSRM API for routing
    const originStr = `${origin[1]},${origin[0]}`; // lon,lat
    const destStr = `${destination[1]},${destination[0]}`; // lon,lat

    // Use OSRM URL from config or default
    const osrmUrl = window.OSRM_BASE_URL || 'https://router.project-osrm.org';
    const response = await fetch(
      `${osrmUrl}/route/v1/driving/${originStr};${destStr}?overview=full&geometries=geojson`
    );

    const data = await response.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates;

      // Convert from [lng, lat] to [lat, lng] for Leaflet
      const latLngs = coordinates.map(coord => [coord[1], coord[0]]);

      // Draw route polyline
      routeLayer = L.polyline(latLngs, {
        color: '#FF9800',
        weight: 4,
        opacity: 0.7
      }).addTo(map);
    }
  } catch (error) {
    console.error('Error drawing route:', error);
    // Draw straight line as fallback
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
    routeLayer = L.polyline([origin, destination], {
      color: '#FF9800',
      weight: 4,
      opacity: 0.5,
      dashArray: '10, 10'
    }).addTo(map);
  }
}

// Update estimated time of arrival
async function updateETA(driverPosition, destination) {
  try {
    const originStr = `${driverPosition[1]},${driverPosition[0]}`; // lon,lat
    const destStr = `${destination[1]},${destination[0]}`; // lon,lat

    // Use OSRM URL from config or default
    const osrmUrl = window.OSRM_BASE_URL || 'https://router.project-osrm.org';
    const response = await fetch(
      `${osrmUrl}/route/v1/driving/${originStr};${destStr}?overview=false`
    );

    const data = await response.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMin = Math.ceil(route.duration / 60);

      const etaElement = document.getElementById('eta');
      if (etaElement) {
        etaElement.innerHTML = `
          <strong>Estimated Arrival:</strong> ${durationMin} mins<br>
          <strong>Distance:</strong> ${distanceKm} km
        `;
      }
    }
  } catch (error) {
    console.error('Error calculating ETA:', error);
    // Calculate straight-line distance as fallback
    const distance = calculateDistance(
      driverPosition[0], driverPosition[1],
      destination[0], destination[1]
    );
    const etaMin = Math.ceil((distance / 30) * 60); // Assume 30 km/h

    const etaElement = document.getElementById('eta');
    if (etaElement) {
      etaElement.innerHTML = `
        <strong>Estimated Arrival:</strong> ~${etaMin} mins<br>
        <strong>Distance:</strong> ~${distance.toFixed(1)} km
      `;
    }
  }
}

// Calculate straight-line distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Update order status display
function updateOrderStatus(status) {
  const statusElement = document.getElementById('order-status');
  if (statusElement) {
    const statusText = status.replace(/_/g, ' ');
    const statusClass = status === 'DELIVERED' ? 'badge-success' : 'badge-primary';

    statusElement.innerHTML = `<span class="badge ${statusClass}">${statusText}</span>`;

    // Reload page if delivered
    if (status === 'DELIVERED') {
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
  }
}

// Simulate driver movement for testing (remove in production)
function simulateDriverMovement(orderId, startLat, startLng, destLat, destLng) {
  let currentLat = startLat;
  let currentLng = startLng;

  const latStep = (destLat - startLat) / 20;
  const lngStep = (destLng - startLng) / 20;

  updateInterval = setInterval(() => {
    currentLat += latStep + (Math.random() - 0.5) * 0.001;
    currentLng += lngStep + (Math.random() - 0.5) * 0.001;

    // Send location update
    socket.emit('driver:location-update', {
      orderId: orderId,
      lat: currentLat,
      lng: currentLng
    });

    // Stop when close to destination
    const distance = Math.sqrt(
      Math.pow(destLat - currentLat, 2) + Math.pow(destLng - currentLng, 2)
    );

    if (distance < 0.001) {
      clearInterval(updateInterval);
    }
  }, 3000); // Update every 3 seconds
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (socket) {
    socket.disconnect();
  }
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
