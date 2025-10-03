// Real-time order tracking with Socket.IO and Google Maps

let socket;
let map;
let driverMarker;
let destinationMarker;
let updateInterval;

// Initialize tracking
function initTracking(orderId, deliveryLat, deliveryLng, driverLat, driverLng) {
  // Connect to Socket.IO
  socket = io();

  // Join tracking room for this order
  socket.emit('tracking:join', orderId);

  // Initialize Google Map
  const destination = { lat: deliveryLat, lng: deliveryLng };

  map = new google.maps.Map(document.getElementById('tracking-map'), {
    center: destination,
    zoom: 14,
    styles: [
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  // Destination marker (customer location) - Light Blue
  destinationMarker = new google.maps.Marker({
    position: destination,
    map: map,
    title: 'Your Location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#4FC3F7',
      fillOpacity: 1,
      strokeColor: '#0288D1',
      strokeWeight: 3
    }
  });

  // Driver marker - Orange
  if (driverLat && driverLng) {
    const driverPosition = { lat: driverLat, lng: driverLng };

    driverMarker = new google.maps.Marker({
      position: driverPosition,
      map: map,
      title: 'Delivery Driver',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF9800',
        fillOpacity: 1,
        strokeColor: '#F57C00',
        strokeWeight: 3
      }
    });

    // Draw route line
    drawRoute(driverPosition, destination);
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
  const newPosition = { lat, lng };

  if (driverMarker) {
    // Smooth marker animation
    animateMarker(driverMarker, newPosition);
  } else {
    // Create driver marker if doesn't exist
    driverMarker = new google.maps.Marker({
      position: newPosition,
      map: map,
      title: 'Delivery Driver',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF9800',
        fillOpacity: 1,
        strokeColor: '#F57C00',
        strokeWeight: 3
      }
    });
  }

  // Update route
  drawRoute(newPosition, destination);

  // Calculate and display ETA
  updateETA(newPosition, destination);
}

// Animate marker movement
function animateMarker(marker, newPosition) {
  const startPosition = marker.getPosition();
  const duration = 1000; // 1 second animation
  const steps = 60;
  const stepDelay = duration / steps;

  let step = 0;

  const interval = setInterval(() => {
    step++;
    const progress = step / steps;

    const lat = startPosition.lat() + (newPosition.lat - startPosition.lat()) * progress;
    const lng = startPosition.lng() + (newPosition.lng - startPosition.lng()) * progress;

    marker.setPosition({ lat, lng });

    if (step >= steps) {
      clearInterval(interval);
    }
  }, stepDelay);
}

// Draw route between driver and destination
function drawRoute(origin, destination) {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#FF9800',
      strokeWeight: 4,
      strokeOpacity: 0.7
    }
  });

  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
      }
    }
  );
}

// Update estimated time of arrival
function updateETA(driverPosition, destination) {
  const service = new google.maps.DistanceMatrixService();

  service.getDistanceMatrix(
    {
      origins: [driverPosition],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response, status) => {
      if (status === 'OK') {
        const result = response.rows[0].elements[0];
        if (result.status === 'OK') {
          const duration = result.duration.text;
          const distance = result.distance.text;

          const etaElement = document.getElementById('eta');
          if (etaElement) {
            etaElement.innerHTML = `
              <strong>Estimated Arrival:</strong> ${duration}<br>
              <strong>Distance:</strong> ${distance}
            `;
          }
        }
      }
    }
  );
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
