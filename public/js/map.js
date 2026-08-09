const listing = window.listing || {};
const mapToken = window.mapToken || '';

// Clean map container to avoid "Map container is already initialized" error
function getCleanMapContainer() {
  const oldContainer = document.getElementById('map');
  if (!oldContainer) return null;
  const newContainer = oldContainer.cloneNode(false);
  oldContainer.parentNode.replaceChild(newContainer, oldContainer);
  return newContainer;
}

async function getCoordinates(loc, country, existingCoords) {
  const query = [loc, country].filter(Boolean).join(', ');
  if (!query) {
    return (Array.isArray(existingCoords) && existingCoords.length >= 2) ? existingCoords : [77.5946, 12.9716];
  }

  // 1. Try Photon Geocoding API (Fast, Free, OpenStreetMap-based)
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.features?.[0]?.geometry?.coordinates) {
        const coords = data.features[0].geometry.coordinates; // [lng, lat]
        if (Array.isArray(coords) && coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          return [parseFloat(coords[0]), parseFloat(coords[1])];
        }
      }
    }
  } catch (err) {
    console.warn('Photon client geocoding error:', err);
  }

  // 2. Try Nominatim Geocoding API
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    if (res.ok && res.headers.get('content-type')?.includes('json')) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return [lon, lat];
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim client geocoding error:', err);
  }

  if (Array.isArray(existingCoords) && existingCoords.length >= 2) {
    return existingCoords;
  }

  return [77.5946, 12.9716];
}

function initLeafletMap(coords) {
  getCleanMapContainer();

  // Load Leaflet CSS if missing
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  const setup = () => {
    const latLng = [coords[1], coords[0]]; // Leaflet uses [lat, lng]
    const map = L.map('map').setView(latLng, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const popupText = `<b>${listing.title || 'Location'}</b><br>${listing.location || ''}${listing.country ? ', ' + listing.country : ''}<br>Exact location provided after booking!`;

    L.marker(latLng).addTo(map)
      .bindPopup(popupText)
      .openPopup();

    setTimeout(() => map.invalidateSize(), 300);
  };

  if (window.L) {
    setup();
  } else {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = setup;
    document.body.appendChild(script);
  }
}

async function initMap() {
  const container = document.getElementById('map');
  if (!container) return;

  const existingCoords = listing?.geometry?.coordinates;
  const coords = await getCoordinates(listing.location, listing.country, existingCoords);

  // If mapToken is missing or invalid, fallback to Leaflet
  if (!mapToken || mapToken.trim() === '') {
    initLeafletMap(coords);
    return;
  }

  try {
    getCleanMapContainer();
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coords,
      zoom: 9,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    let hasErrored = false;
    map.on('error', (e) => {
      if (!hasErrored) {
        hasErrored = true;
        console.warn('Mapbox GL JS error, falling back to Leaflet:', e);
        initLeafletMap(coords);
      }
    });

    map.on('load', () => map.resize());
    setTimeout(() => map.resize(), 300);

    const popupText = `<h4>${listing.title || 'Location'}</h4><p>${listing.location || ''}${listing.country ? ', ' + listing.country : ''}</p><p>Exact location provided after booking!</p>`;
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupText);

    new mapboxgl.Marker({ color: 'red' })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(map);

  } catch (err) {
    initLeafletMap(coords);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}