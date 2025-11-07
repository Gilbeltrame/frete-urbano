// routeService.mjs (refatorado para performance e resiliência)
// Serviço para calcular rotas usando OpenRouteService com:
// - Rate limiting separado geocode/rota
// - Concorrência controlada
// - Keep-Alive + AbortController (timeouts)
// - Cache LRU com TTL e deduplicação de requisições em voo

import https from 'https';
import fetch from 'node-fetch';

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE = 'https://api.openrouteservice.org';

// Parâmetros ajustáveis via ENV
const MIN_GEO_INTERVAL = Number(process.env.ORS_GEO_INTERVAL_MS) || 250; // ms
const MIN_ROUTE_INTERVAL = Number(process.env.ORS_ROUTE_INTERVAL_MS) || 750; // ms
const MAX_CONCURRENCY = Number(process.env.ORS_MAX_CONCURRENCY) || 4;
const ORS_TIMEOUT_MS = Number(process.env.ORS_TIMEOUT_MS) || 12000; // Timeout de rede

// Cache sizes + TTL
const MAX_GEO_CACHE = Number(process.env.GEO_CACHE_MAX) || 1000;
const MAX_ROUTE_CACHE = Number(process.env.ROUTE_CACHE_MAX) || 2000;
const GEO_TTL_MS = Number(process.env.GEO_CACHE_TTL_MS) || 12 * 60 * 60 * 1000; // 12h
const ROUTE_TTL_MS = Number(process.env.ROUTE_CACHE_TTL_MS) || 24 * 60 * 60 * 1000; // 24h

// State para rate limiting
let lastGeocodeTime = 0;
let lastRouteTime = 0;
const requestQueue = [];
let activeCount = 0;

// Keep-alive agent reutiliza conexões TLS
const keepAliveAgent = new https.Agent({ keepAlive: true });

// Caches: Map(key -> { value, expiresAt, lastAccess })
const geocodeCache = new Map();
const routeCache = new Map();
const inFlightGeocode = new Map(); // Map(key -> Promise)
const inFlightRoute = new Map();

function normalizeKey(str) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Coordenadas estimadas (fallback + redução de chamadas)
function getEstimatedCoordinates(cidade, uf) {
  const coordenadas = {
    'FRAIBURGO': { lat: -27.0283, lon: -50.9244, label: 'FRAIBURGO, SC' },
    'CHAPECO': { lat: -27.0965, lon: -52.6147, label: 'CHAPECO, SC' },
    'CONCORDIA': { lat: -27.2342, lon: -52.0278, label: 'CONCORDIA, SC' },
    'JOACABA': { lat: -27.1733, lon: -51.5058, label: 'JOACABA, SC' },
    'PINHALZINHO': { lat: -26.8542, lon: -52.0033, label: 'PINHALZINHO, SC' },
    'SAO MIGUEL DO OESTE': { lat: -26.7242, lon: -53.5183, label: 'SAO MIGUEL DO OESTE, SC' },
    'SAO CARLOS': { lat: -27.0542, lon: -53.0183, label: 'SAO CARLOS, SC' },
    'TREZE TILIAS': { lat: -27.0042, lon: -51.3583, label: 'TREZE TILIAS, SC' },
    'MELEIRO': { lat: -28.2142, lon: -49.6383, label: 'MELEIRO, SC' },
    'PALMAS': { lat: -10.1842, lon: -48.3336, label: 'PALMAS, TO' },
    'ARAGUAINA': { lat: -7.1917, lon: -48.2067, label: 'ARAGUAINA, TO' },
    'PORTO NACIONAL': { lat: -10.7042, lon: -48.4183, label: 'PORTO NACIONAL, TO' },
    'GURUPI': { lat: -11.7292, lon: -49.0683, label: 'GURUPI, TO' },
    'MIRACEMA DO TOCANTINS': { lat: -9.5642, lon: -48.3933, label: 'MIRACEMA DO TOCANTINS, TO' },
    'MIRANORTE': { lat: -9.5342, lon: -48.5933, label: 'MIRANORTE, TO' },
    'ALIANCA DO TOCANTINS': { lat: -11.2042, lon: -48.9183, label: 'ALIANCA DO TOCANTINS, TO' },
    'SAO PAULO': { lat: -23.5505, lon: -46.6333, label: 'SAO PAULO, SP' },
    'CAMPINAS': { lat: -22.9099, lon: -47.0626, label: 'CAMPINAS, SP' },
    'COSMOPOLIS': { lat: -22.6442, lon: -47.1933, label: 'COSMOPOLIS, SP' },
    'ALUMINIO': { lat: -23.5342, lon: -47.2583, label: 'ALUMINIO, SP' },
    'SALTO': { lat: -23.2042, lon: -47.2833, label: 'SALTO, SP' },
    'SAO ROQUE': { lat: -23.5242, lon: -47.1333, label: 'SAO ROQUE, SP' },
    'CONCHAL': { lat: -22.3342, lon: -47.1733, label: 'CONCHAL, SP' },
    'SUMARE': { lat: -22.8242, lon: -47.2683, label: 'SUMARE, SP' },
    'JAGUARIUNA': { lat: -22.7042, lon: -46.9833, label: 'JAGUARIUNA, SP' },
    'GUARULHOS': { lat: -23.4538, lon: -46.5333, label: 'GUARULHOS, SP' },
    'PORTO FERREIRA': { lat: -21.8542, lon: -47.4789, label: 'PORTO FERREIRA, SP' },
    'SANTOS': { lat: -23.9608, lon: -46.3331, label: 'SANTOS, SP' },
    'FORTALEZA': { lat: -3.7319, lon: -38.5267, label: 'FORTALEZA, CE' },
    'GOIANIA': { lat: -16.6869, lon: -49.2648, label: 'GOIANIA, GO' },
    'FORMOSA': { lat: -15.5373, lon: -47.3342, label: 'FORMOSA, GO' },
    'SINOP': { lat: -11.8609, lon: -55.5019, label: 'SINOP, MT' },
    'VARZEA GRANDE': { lat: -15.6467, lon: -56.1326, label: 'VARZEA GRANDE, MT' },
    'CUIABA': { lat: -15.6014, lon: -56.0979, label: 'CUIABA, MT' },
    'JUAZEIRO': { lat: -9.4142, lon: -40.4983, label: 'JUAZEIRO, BA' },
    'SALVADOR': { lat: -12.9714, lon: -38.5014, label: 'SALVADOR, BA' },
    'CABO DE SANTO AGOSTINHO': { lat: -8.2916, lon: -35.0344, label: 'CABO DE SANTO AGOSTINHO, PE' },
    'RECIFE': { lat: -8.0476, lon: -34.877, label: 'RECIFE, PE' },
    'BRASILIA': { lat: -15.7801, lon: -47.9292, label: 'BRASILIA, DF' },
    'PELOTAS': { lat: -31.7742, lon: -52.3433, label: 'PELOTAS, RS' },
    'SAO GABRIEL': { lat: -30.3383, lon: -54.3194, label: 'SAO GABRIEL, RS' },
    'URUGUAIANA': { lat: -29.7546, lon: -57.0883, label: 'URUGUAIANA, RS' },
    'PORTO ALEGRE': { lat: -30.0277, lon: -51.2287, label: 'PORTO ALEGRE, RS' },
    'FOZ DO IGUACU': { lat: -25.5478, lon: -54.5882, label: 'FOZ DO IGUACU, PR' },
    'CASCAVEL': { lat: -24.9578, lon: -53.4568, label: 'CASCAVEL, PR' },
    'LONDRINA': { lat: -23.3045, lon: -51.1696, label: 'LONDRINA, PR' },
    'GUARATUBA': { lat: -25.8842, lon: -48.5733, label: 'GUARATUBA, PR' },
    'PONTA GROSSA': { lat: -25.0942, lon: -50.1583, label: 'PONTA GROSSA, PR' }
  };
  return coordenadas[normalizeKey(cidade)] || null;
}

// ---------- Rate limited fetch com concorrência ----------
function rateLimitedFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, options, resolve, reject, enqueuedAt: Date.now() });
    console.log(`⏳ [QUEUE] +1 (tamanho: ${requestQueue.length}, ativos: ${activeCount})`);
    drainQueue();
  });
}

async function drainQueue() {
  while (activeCount < MAX_CONCURRENCY && requestQueue.length > 0) {
    const item = requestQueue.shift();
    const { url, options, resolve, reject, enqueuedAt } = item;
    const isGeocode = /\/geocode\//.test(url);
    const now = Date.now();
    const sinceLast = now - (isGeocode ? lastGeocodeTime : lastRouteTime);
    const minInterval = isGeocode ? MIN_GEO_INTERVAL : MIN_ROUTE_INTERVAL;
    if (sinceLast < minInterval) {
      const wait = minInterval - sinceLast;
      console.log(`⏸️ [RATE LIMIT] Aguardando ${wait}ms (${isGeocode ? 'GEOCODE' : 'ROUTE'})`);
      await new Promise(r => setTimeout(r, wait));
    }
    activeCount++;
    const startedAt = Date.now();
    if (isGeocode) lastGeocodeTime = startedAt; else lastRouteTime = startedAt;
    const maskedUrl = url.replace(/(api_key=)[^&]*/, '$1***');
    console.log(`📡 [FETCH] ${isGeocode ? 'GEOCODE' : 'ROUTE'} → ${maskedUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS);
    const fetchOptions = {
      ...options,
      agent: keepAliveAgent,
      signal: controller.signal,
      headers: { 'Accept': 'application/json', ...(options.headers || {}) }
    };

    fetch(url, fetchOptions)
      .then(response => {
        clearTimeout(timeoutId);
        const totalTime = Date.now() - enqueuedAt;
        const netTime = Date.now() - startedAt;
        console.log(`📨 [RESPONSE] ${response.status} ${response.statusText} (fila+espera: ${totalTime - netTime}ms, rede: ${netTime}ms)`);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        const totalTime = Date.now() - enqueuedAt;
        console.log(`💥 [FETCH ERROR] ${err.name === 'AbortError' ? 'TIMEOUT' : err.message} (total: ${totalTime}ms)`);
        reject(err);
      })
      .finally(() => {
        activeCount--;
        drainQueue();
      });
  }
}

// ---------- Utilidades de distância ----------
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRadians(degrees) { return degrees * (Math.PI / 180); }
function getRoadDistanceFactor(distanceKm) {
  if (distanceKm < 50) return 1.3;
  if (distanceKm < 200) return 1.25;
  if (distanceKm < 500) return 1.2;
  return 1.15;
}

// ---------- Geocoding ----------
async function geocodeCity(cityName, uf) {
  const cacheKey = `${normalizeKey(cityName)}-${normalizeKey(uf)}`;
  const startTime = Date.now();
  console.log(`🌐 [GEOCODE] ${cityName}, ${uf}`);

  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    cached.lastAccess = Date.now();
    console.log(`📦 [CACHE HIT] geocode ${cacheKey}`);
    return cached.value;
  } else if (cached) {
    geocodeCache.delete(cacheKey);
  }

  if (inFlightGeocode.has(cacheKey)) {
    console.log(`� [IN-FLIGHT] geocode aguardando: ${cacheKey}`);
    return inFlightGeocode.get(cacheKey);
  }

  // Sem API Key → fallback estimado
  if (!ORS_API_KEY || ORS_API_KEY === 'your_openrouteservice_api_key_here') {
    const estimated = getEstimatedCoordinates(cityName, uf);
    if (estimated) {
      geocodeCache.set(cacheKey, { value: estimated, expiresAt: Date.now() + GEO_TTL_MS, lastAccess: Date.now() });
      return estimated;
    }
    throw new Error(`ORS_API_KEY ausente e sem coordenada estimada para ${cityName}, ${uf}`);
  }

  const searchText = `${cityName}, ${uf}, Brasil`;
  const url = `${ORS_BASE}/geocode/search?api_key=${encodeURIComponent(ORS_API_KEY)}&text=${encodeURIComponent(searchText)}&boundary.country=BR&size=1`;
  const promise = rateLimitedFetch(url)
    .then(async response => {
      const elapsed = Date.now() - startTime;
      console.log(`⏱️ [GEOCODE NET] ${elapsed}ms`);
      if (!response.ok) {
        if (response.status === 404) {
          const est = getEstimatedCoordinates(cityName, uf);
          if (est) {
            geocodeCache.set(cacheKey, { value: est, expiresAt: Date.now() + GEO_TTL_MS, lastAccess: Date.now() });
            return est;
          }
        }
        throw new Error(`Erro ORS geocode status ${response.status}`);
      }
      const data = await response.json();
      const feat = data?.features?.[0];
      if (!feat) {
        const est = getEstimatedCoordinates(cityName, uf);
        if (est) {
          geocodeCache.set(cacheKey, { value: est, expiresAt: Date.now() + GEO_TTL_MS, lastAccess: Date.now() });
          return est;
        }
        throw new Error(`Cidade não encontrada: ${searchText}`);
      }
      const [lon, lat] = feat.geometry.coordinates;
      const coordinates = { lat, lon, label: feat.properties?.label || searchText };
      geocodeCache.set(cacheKey, { value: coordinates, expiresAt: Date.now() + GEO_TTL_MS, lastAccess: Date.now() });
      enforceGeoCapacity();
      return coordinates;
    })
    .catch(err => {
      const est = getEstimatedCoordinates(cityName, uf);
      if (est) {
        geocodeCache.set(cacheKey, { value: est, expiresAt: Date.now() + GEO_TTL_MS, lastAccess: Date.now() });
        return est;
      }
      throw new Error(`Falha geocode ${cityName}/${uf}: ${err.message}`);
    })
    .finally(() => {
      inFlightGeocode.delete(cacheKey);
    });
  inFlightGeocode.set(cacheKey, promise);
  return promise;
}

// ---------- Rotas ----------
async function calculateRoute(startCoords, endCoords) {
  const routeKey = `${startCoords.lat.toFixed(4)},${startCoords.lon.toFixed(4)}-${endCoords.lat.toFixed(4)},${endCoords.lon.toFixed(4)}`;
  const startTime = Date.now();
  console.log(`🛣️ [ROUTE] ${routeKey}`);

  const cached = routeCache.get(routeKey);
  if (cached && cached.expiresAt > Date.now()) {
    cached.lastAccess = Date.now();
    console.log(`📦 [ROUTE CACHE HIT] ${routeKey}`);
    return cached.value;
  } else if (cached) {
    routeCache.delete(routeKey);
  }

  if (inFlightRoute.has(routeKey)) {
    console.log(`� [IN-FLIGHT] rota aguardando: ${routeKey}`);
    return inFlightRoute.get(routeKey);
  }
  if (!ORS_API_KEY) throw new Error('ORS_API_KEY não configurada');
  const url = `${ORS_BASE}/v2/directions/driving-car?api_key=${encodeURIComponent(ORS_API_KEY)}&start=${startCoords.lon},${startCoords.lat}&end=${endCoords.lon},${endCoords.lat}`;
  const promise = rateLimitedFetch(url)
    .then(async response => {
      const net = Date.now() - startTime;
      console.log(`⏱️ [ROUTE NET] ${net}ms`);
      if (!response.ok) throw new Error(`Erro ORS rota status ${response.status}`);
      const data = await response.json();
      const summary = data?.features?.[0]?.properties?.summary;
      if (!summary) throw new Error('Rota sem summary');
      const km = summary.distance / 1000;
      const durMin = Math.round(summary.duration / 60);
      const result = { km: Number(km.toFixed(1)), durMin };
      routeCache.set(routeKey, { value: result, expiresAt: Date.now() + ROUTE_TTL_MS, lastAccess: Date.now() });
      enforceRouteCapacity();
      return result;
    })
    .catch(err => {
      throw new Error(`Falha rota ${routeKey}: ${err.message}`);
    })
    .finally(() => {
      inFlightRoute.delete(routeKey);
    });
  inFlightRoute.set(routeKey, promise);
  return promise;
}

// ---------- Cálculo de distância principal ----------
export async function calculateCityDistance(cidadeOrigem, ufOrigem, cidadeDestino, ufDestino) {
  try {
    if (normalizeKey(cidadeOrigem) === normalizeKey(cidadeDestino) && normalizeKey(ufOrigem) === normalizeKey(ufDestino)) {
      return { km: 0, durMin: 0, method: 'same_city' };
    }
    const [origemCoords, destinoCoords] = await Promise.all([
      geocodeCity(cidadeOrigem, ufOrigem),
      geocodeCity(cidadeDestino, ufDestino)
    ]);
    try {
      const routeResult = await calculateRoute(origemCoords, destinoCoords);
      return { ...routeResult, method: 'ors_route', origem: origemCoords.label, destino: destinoCoords.label };
    } catch (routeError) {
      console.warn(`🔄 [FALLBACK] ORS rota falhou ${cidadeOrigem}-${cidadeDestino}: ${routeError.message}`);
      const straight = calculateHaversineDistance(origemCoords.lat, origemCoords.lon, destinoCoords.lat, destinoCoords.lon);
      const factor = getRoadDistanceFactor(straight);
      const estimatedKm = straight * factor;
      return {
        km: Number(estimatedKm.toFixed(1)),
        durMin: Math.round((estimatedKm / 60) * 60),
        method: 'haversine_estimate',
        origem: origemCoords.label,
        destino: destinoCoords.label
      };
    }
  } catch (error) {
    console.warn(`Geocoding falhou ${cidadeOrigem}-${cidadeDestino}, fallback UF: ${error.message}`);
    const distancias = { 'SC': 150, 'PR': 200, 'RS': 300, 'SP': 350, 'MG': 500, 'RJ': 600, 'MT': 800, 'GO': 700, 'MS': 600, 'DF': 750, 'BA': 1200, 'CE': 1800, 'PE': 1600, 'PA': 2200, 'MA': 2000, 'TO': 1500, 'PI': 1700, 'AL': 1500, 'SE': 1400, 'PB': 1700, 'RN': 1800, 'AC': 2500, 'AP': 2800, 'AM': 2600, 'RO': 2000, 'RR': 3000, 'EX': 500 };
    const km = distancias[normalizeKey(ufDestino)] || 500;
    return { km, durMin: Math.round((km / 60) * 60), method: 'uf_estimate', origem: `${cidadeOrigem}, ${ufOrigem}`, destino: `${cidadeDestino}, ${ufDestino}` };
  }
}

// ---------- Capacidade cache LRU ----------
function enforceGeoCapacity() {
  if (geocodeCache.size <= MAX_GEO_CACHE) return;
  const entries = [...geocodeCache.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  const excess = geocodeCache.size - MAX_GEO_CACHE;
  for (let i = 0; i < excess; i++) geocodeCache.delete(entries[i][0]);
}
function enforceRouteCapacity() {
  if (routeCache.size <= MAX_ROUTE_CACHE) return;
  const entries = [...routeCache.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  const excess = routeCache.size - MAX_ROUTE_CACHE;
  for (let i = 0; i < excess; i++) routeCache.delete(entries[i][0]);
}

// ---------- Estatísticas ----------
export function getCacheStats() {
  return {
    geocodeCache: geocodeCache.size,
    routeCache: routeCache.size,
    inFlightGeocode: inFlightGeocode.size,
    inFlightRoute: inFlightRoute.size,
    hasApiKey: !!ORS_API_KEY,
    intervals: { MIN_GEO_INTERVAL, MIN_ROUTE_INTERVAL },
    concurrency: { activeCount, MAX_CONCURRENCY }
  };
}

export function clearCaches() {
  geocodeCache.clear();
  routeCache.clear();
}