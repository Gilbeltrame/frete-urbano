// routeService.mjs
// Serviço para calcular rotas usando OpenRouteService no backend

import fetch from 'node-fetch';

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE = "https://api.openrouteservice.org";

// Cache de coordenadas para evitar múltiplas consultas da mesma cidade
const geocodeCache = new Map();

// Cache de rotas para evitar cálculos duplicados
const routeCache = new Map();

// Rate limiting otimizado para OpenRouteService (40 req/min = 1 req a cada 1.5s)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 1.5 segundos é muito conservador
let requestQueue = [];
let isProcessingQueue = false;

// Função para aplicar rate limiting com fila
async function rateLimitedFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    console.log(`⏳ [QUEUE] Adicionando requisição à fila (tamanho atual: ${requestQueue.length})`);
    
    requestQueue.push({
      url,
      options,
      resolve: (response) => {
        const queueTime = Date.now() - startTime;
        console.log(`🚀 [QUEUE PROCESSED] Requisição processada em ${queueTime}ms total`);
        resolve(response);
      },
      reject
    });
    
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { url, options, resolve, reject } = requestQueue.shift();
    
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏸️ [RATE LIMIT] Aguardando ${waitTime}ms (fila: ${requestQueue.length})`);
      await new Promise(r => setTimeout(r, waitTime));
    }
    
    try {
      lastRequestTime = Date.now();
      console.log(`📡 [FETCH] Fazendo requisição para: ${url.replace(/(api_key=)[^&]*/, '$1***')}`);
      const response = await fetch(url, options);
      console.log(`📨 [RESPONSE] Status: ${response.status} ${response.statusText}`);
      resolve(response);
    } catch (error) {
      console.log(`💥 [FETCH ERROR] ${error.message}`);
      reject(error);
    }
  }
  
  isProcessingQueue = false;
}

// Coordenadas estimadas para cidades comuns (para reduzir chamadas à API)
function getEstimatedCoordinates(cidade, uf) {
  const coordenadas = {
    // SC
    'FRAIBURGO': { lat: -27.0283, lon: -50.9244, label: 'FRAIBURGO, SC' },
    'CHAPECO': { lat: -27.0965, lon: -52.6147, label: 'CHAPECO, SC' },
    'CONCORDIA': { lat: -27.2342, lon: -52.0278, label: 'CONCORDIA, SC' },
    'JOACABA': { lat: -27.1733, lon: -51.5058, label: 'JOACABA, SC' },
    'PINHALZINHO': { lat: -26.8542, lon: -52.0033, label: 'PINHALZINHO, SC' },
    'SAO MIGUEL DO OESTE': { lat: -26.7242, lon: -53.5183, label: 'SAO MIGUEL DO OESTE, SC' },
    'SAO CARLOS': { lat: -27.0542, lon: -53.0183, label: 'SAO CARLOS, SC' },
    'TREZE TILIAS': { lat: -27.0042, lon: -51.3583, label: 'TREZE TILIAS, SC' },
    'MELEIRO': { lat: -28.2142, lon: -49.6383, label: 'MELEIRO, SC' },
    
    // TO
    'PALMAS': { lat: -10.1842, lon: -48.3336, label: 'PALMAS, TO' },
    'ARAGUAINA': { lat: -7.1917, lon: -48.2067, label: 'ARAGUAINA, TO' },
    'PORTO NACIONAL': { lat: -10.7042, lon: -48.4183, label: 'PORTO NACIONAL, TO' },
    'GURUPI': { lat: -11.7292, lon: -49.0683, label: 'GURUPI, TO' },
    'MIRACEMA DO TOCANTINS': { lat: -9.5642, lon: -48.3933, label: 'MIRACEMA DO TOCANTINS, TO' },
    'MIRANORTE': { lat: -9.5342, lon: -48.5933, label: 'MIRANORTE, TO' },
    'ALIANCA DO TOCANTINS': { lat: -11.2042, lon: -48.9183, label: 'ALIANCA DO TOCANTINS, TO' },
    
    // SP
    'SAO PAULO': { lat: -23.5505, lon: -46.6333, label: 'SAO PAULO, SP' },
    'CAMPINAS': { lat: -22.9099, lon: -47.0626, label: 'CAMPINAS, SP' },
    'COSMOPOLIS': { lat: -22.6442, lon: -47.1933, label: 'COSMOPOLIS, SP' },
    'ALUMINIO': { lat: -23.5342, lon: -47.2583, label: 'ALUMINIO, SP' },
    'SALTO': { lat: -23.2042, lon: -47.2833, label: 'SALTO, SP' },
    'SAO ROQUE': { lat: -23.5242, lon: -47.1333, label: 'SAO ROQUE, SP' },
    'CONCHAL': { lat: -22.3342, lon: -47.1733, label: 'CONCHAL, SP' },
    'SUMARE': { lat: -22.8242, lon: -47.2683, label: 'SUMARE, SP' },
    'JAGUARIUNA': { lat: -22.7042, lon: -46.9833, label: 'JAGUARIUNA, SP' },
    
    // GO
    'CAMPOS BELOS': { lat: -13.0342, lon: -46.7733, label: 'CAMPOS BELOS, GO' },
    'MONTE ALEGRE DE GOIAS': { lat: -13.2542, lon: -46.8933, label: 'MONTE ALEGRE DE GOIAS, GO' },
    'SAO JOAO D\'ALIANCA': { lat: -14.7042, lon: -47.5183, label: 'SAO JOAO D\'ALIANCA, GO' },
    
    // MT
    'NOVA GUARITA': { lat: -10.3042, lon: -55.4183, label: 'NOVA GUARITA, MT' },
    'TAPURAH': { lat: -12.5442, lon: -56.4933, label: 'TAPURAH, MT' },
    
    // BA
    'JUAZEIRO': { lat: -9.4142, lon: -40.4983, label: 'JUAZEIRO, BA' },
    
    // PR
    'GUARATUBA': { lat: -25.8842, lon: -48.5733, label: 'GUARATUBA, PR' },
    'PONTA GROSSA': { lat: -25.0942, lon: -50.1583, label: 'PONTA GROSSA, PR' },
    'FOZ DO IGUACU': { lat: -25.5478, lon: -54.5882, label: 'FOZ DO IGUACU, PR' },
    'CASCAVEL': { lat: -24.9578, lon: -53.4568, label: 'CASCAVEL, PR' },
    'LONDRINA': { lat: -23.3045, lon: -51.1696, label: 'LONDRINA, PR' },
    
    // RS
    'PELOTAS': { lat: -31.7742, lon: -52.3433, label: 'PELOTAS, RS' },
    'SAO GABRIEL': { lat: -30.3383, lon: -54.3194, label: 'SAO GABRIEL, RS' },
    'URUGUAIANA': { lat: -29.7546, lon: -57.0883, label: 'URUGUAIANA, RS' },
    'PORTO ALEGRE': { lat: -30.0277, lon: -51.2287, label: 'PORTO ALEGRE, RS' },
    
    // MT
    'SINOP': { lat: -11.8609, lon: -55.5019, label: 'SINOP, MT' },
    'VARZEA GRANDE': { lat: -15.6467, lon: -56.1326, label: 'VARZEA GRANDE, MT' },
    'CUIABA': { lat: -15.6014, lon: -56.0979, label: 'CUIABA, MT' },
    
    // BA
    'SALVADOR': { lat: -12.9714, lon: -38.5014, label: 'SALVADOR, BA' },
    
    // PE
    'CABO DE SANTO AGOSTINHO': { lat: -8.2916, lon: -35.0344, label: 'CABO DE SANTO AGOSTINHO, PE' },
    'RECIFE': { lat: -8.0476, lon: -34.8770, label: 'RECIFE, PE' },
    
    // DF
    'BRASILIA': { lat: -15.7801, lon: -47.9292, label: 'BRASILIA, DF' },
    
    // SP (mais cidades)
    'GUARULHOS': { lat: -23.4538, lon: -46.5333, label: 'GUARULHOS, SP' },
    'PORTO FERREIRA': { lat: -21.8542, lon: -47.4789, label: 'PORTO FERREIRA, SP' },
    'SANTOS': { lat: -23.9608, lon: -46.3331, label: 'SANTOS, SP' },
    
    // CE
    'FORTALEZA': { lat: -3.7319, lon: -38.5267, label: 'FORTALEZA, CE' },
    
    // GO (mais cidades) 
    'GOIANIA': { lat: -16.6869, lon: -49.2648, label: 'GOIANIA, GO' },
    'FORMOSA': { lat: -15.5373, lon: -47.3342, label: 'FORMOSA, GO' }
  };
  
  const chave = `${cidade.toUpperCase()}_${uf}`;
  return coordenadas[cidade.toUpperCase()] || null;
}

// Função para calcular distância em linha reta usando fórmula de Haversine
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
           Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
           Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Fator de correção para distância rodoviária (linha reta * fator)
function getRoadDistanceFactor(distanceKm) {
  if (distanceKm < 50) return 1.3;   // Cidades próximas, mais curvas
  if (distanceKm < 200) return 1.25; // Distâncias médias
  if (distanceKm < 500) return 1.2;  // Distâncias longas, mais diretas
  return 1.15; // Distâncias muito longas, rodovias principais
}

// Geocoding usando OpenRouteService
async function geocodeCity(cityName, uf) {
  const cacheKey = `${cityName.toUpperCase()}-${uf.toUpperCase()}`;
  const startTime = Date.now();
  
  console.log(`🌐 [GEOCODE] Iniciando geocoding: ${cityName}, ${uf}`);
  
  // Verificar cache primeiro
  if (geocodeCache.has(cacheKey)) {
    console.log(`📦 [CACHE HIT] Usando cache para: ${cacheKey}`);
    return geocodeCache.get(cacheKey);
  }

  // Se a API key não estiver configurada, usar coordenadas estimadas
  if (!ORS_API_KEY || ORS_API_KEY === 'your_openrouteservice_api_key_here') {
    console.log(`🔑 [NO API KEY] Tentando coordenadas estimadas para: ${cityName}, ${uf}`);
    const estimatedCoords = getEstimatedCoordinates(cityName, uf);
    if (estimatedCoords) {
      console.log(`📍 [COORDENADAS ESTIMADAS] Encontradas para ${cityName}: ${estimatedCoords.lat}, ${estimatedCoords.lon}`);
      geocodeCache.set(cacheKey, estimatedCoords);
      return estimatedCoords;
    }
    throw new Error(`ORS_API_KEY não configurada e coordenadas estimadas não disponíveis para ${cityName}, ${uf}`);
  }

  const searchText = `${cityName}, ${uf}, Brasil`;
  const url = `${ORS_BASE}/geocode/search?api_key=${encodeURIComponent(ORS_API_KEY)}&text=${encodeURIComponent(searchText)}&boundary.country=BR&size=1`;
  
  console.log(`🔍 [API REQUEST] URL: ${url.replace(ORS_API_KEY, '***')}`);

  try {
    const response = await rateLimitedFetch(url);
    const responseTime = Date.now() - startTime;
    
    console.log(`⏱️ [RESPONSE TIME] ${responseTime}ms para ${cityName}, ${uf}`);
    
    if (!response.ok) {
      console.log(`❌ [API ERROR] Status ${response.status} para ${cityName}, ${uf}`);
      
      // Se 404, tentar coordenadas estimadas como fallback
      if (response.status === 404) {
        console.log(`🔄 [FALLBACK 404] Tentando coordenadas estimadas para ${cityName}, ${uf}`);
        const estimatedCoords = getEstimatedCoordinates(cityName, uf);
        if (estimatedCoords) {
          console.log(`✅ [FALLBACK SUCCESS] Coordenadas estimadas encontradas: ${estimatedCoords.lat}, ${estimatedCoords.lon}`);
          geocodeCache.set(cacheKey, estimatedCoords);
          return estimatedCoords;
        }
        console.log(`💥 [FALLBACK FAILED] Nenhuma coordenada estimada para ${cityName}, ${uf}`);
      }
      throw new Error(`Erro na API ORS: ${response.status}`);
    }

    const data = await response.json();
    const feat = data?.features?.[0];
    
    if (!feat) {
      console.log(`🔍 [NO RESULTS] API não encontrou resultados para: ${searchText}`);
      // Se não encontrou na API, tentar coordenadas estimadas
      const estimatedCoords = getEstimatedCoordinates(cityName, uf);
      if (estimatedCoords) {
        console.log(`🔄 [FALLBACK NO RESULTS] Usando coordenadas estimadas: ${estimatedCoords.lat}, ${estimatedCoords.lon}`);
        geocodeCache.set(cacheKey, estimatedCoords);
        return estimatedCoords;
      }
      throw new Error(`Cidade não encontrada: ${searchText}`);
    }

    const [lon, lat] = feat.geometry.coordinates;
    const coordinates = { lat, lon, label: feat.properties?.label || searchText };
    
    console.log(`✅ [API SUCCESS] Coordenadas da API para ${cityName}: ${lat}, ${lon}`);
    
    // Armazenar no cache
    geocodeCache.set(cacheKey, coordinates);
    
    return coordinates;
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.log(`💥 [ERROR] ${errorTime}ms - ${error.message} para ${cityName}, ${uf}`);
    
    // Como último recurso, tentar coordenadas estimadas
    const estimatedCoords = getEstimatedCoordinates(cityName, uf);
    if (estimatedCoords) {
      console.log(`🔄 [FINAL FALLBACK] Usando coordenadas estimadas após erro: ${estimatedCoords.lat}, ${estimatedCoords.lon}`);
      geocodeCache.set(cacheKey, estimatedCoords);
      return estimatedCoords;
    }
    console.log(`💀 [TOTAL FAILURE] Falha completa para ${cityName}, ${uf}`);
    throw new Error(`Falha no geocoding para ${searchText}: ${error.message}`);
  }
}

// Calcular rota usando OpenRouteService
async function calculateRoute(startCoords, endCoords) {
  const routeKey = `${startCoords.lat.toFixed(4)},${startCoords.lon.toFixed(4)}-${endCoords.lat.toFixed(4)},${endCoords.lon.toFixed(4)}`;
  const startTime = Date.now();
  
  console.log(`🛣️ [ROUTE] Calculando rota: ${startCoords.lat},${startCoords.lon} → ${endCoords.lat},${endCoords.lon}`);
  
  // Verificar cache primeiro
  if (routeCache.has(routeKey)) {
    console.log(`📦 [ROUTE CACHE HIT] Usando cache para rota`);
    return routeCache.get(routeKey);
  }

  if (!ORS_API_KEY) {
    console.log(`🔑 [NO API KEY] ORS_API_KEY não configurada`);
    throw new Error('ORS_API_KEY não configurada');
  }

  const url = `${ORS_BASE}/v2/directions/driving-car?api_key=${encodeURIComponent(ORS_API_KEY)}&start=${startCoords.lon},${startCoords.lat}&end=${endCoords.lon},${endCoords.lat}`;
  
  console.log(`🔍 [ROUTE API REQUEST] URL: ${url.replace(ORS_API_KEY, '***')}`);

  try {
    const response = await rateLimitedFetch(url);
    const responseTime = Date.now() - startTime;
    
    console.log(`⏱️ [ROUTE RESPONSE TIME] ${responseTime}ms`);
    
    if (!response.ok) {
      console.log(`❌ [ROUTE API ERROR] Status ${response.status}`);
      throw new Error(`Erro na API ORS: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`📋 [ROUTE RESPONSE] Dados recebidos:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');

    if (data?.error) {
      console.log(`💥 [ROUTE ORS ERROR] ${data.error.message}`);
      throw new Error(`Erro ORS: ${data.error.message}`);
    }

    const summary = data?.features?.[0]?.properties?.summary;
    if (!summary) {
      console.log(`🔍 [NO ROUTE SUMMARY] Resposta sem summary válido`);
      throw new Error('Rota não encontrada na resposta da API');
    }

    const km = summary.distance / 1000;
    const durMin = Math.round(summary.duration / 60);
    
    console.log(`✅ [ROUTE SUCCESS] Distância: ${km.toFixed(1)}km, Duração: ${durMin}min`);
    
    const result = { km: Number(km.toFixed(1)), durMin };
    
    // Armazenar no cache
    routeCache.set(routeKey, result);
    
    return result;
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.log(`💥 [ROUTE ERROR] ${errorTime}ms - ${error.message}`);
    throw new Error(`Falha no cálculo de rota: ${error.message}`);
  }
}

// Função principal para calcular distância entre cidades
export async function calculateCityDistance(cidadeOrigem, ufOrigem, cidadeDestino, ufDestino) {
  try {
    // Se origem e destino são iguais, distância é 0
    if (cidadeOrigem.toUpperCase() === cidadeDestino.toUpperCase() && 
        ufOrigem.toUpperCase() === ufDestino.toUpperCase()) {
      return { km: 0, durMin: 0, method: 'same_city' };
    }

    // Geocodificar origem e destino
    const [origemCoords, destinoCoords] = await Promise.all([
      geocodeCity(cidadeOrigem, ufOrigem),
      geocodeCity(cidadeDestino, ufDestino)
    ]);

    // Tentar calcular rota real
    try {
      const routeResult = await calculateRoute(origemCoords, destinoCoords);
      return { 
        ...routeResult, 
        method: 'ors_route',
        origem: origemCoords.label,
        destino: destinoCoords.label 
      };
    } catch (routeError) {
      // Fallback: usar distância estimada
      console.warn(`🔄 [FALLBACK] Rota ORS falhou para ${cidadeOrigem}-${cidadeDestino}: ${routeError.message}`);
      
      const straightKm = calculateHaversineDistance(
        origemCoords.lat, origemCoords.lon,
        destinoCoords.lat, destinoCoords.lon
      );
      
      const roadFactor = getRoadDistanceFactor(straightKm);
      const estimatedKm = straightKm * roadFactor;
      
      console.log(`📏 [ESTIMATE] Distância estimada: ${estimatedKm.toFixed(1)}km (linha reta: ${straightKm.toFixed(1)}km, fator: ${roadFactor})`);
      
      return {
        km: Number(estimatedKm.toFixed(1)),
        durMin: Math.round((estimatedKm / 60) * 60),
        method: 'haversine_estimate',
        origem: origemCoords.label,
        destino: destinoCoords.label
      };
    }
  } catch (error) {
    // Fallback final: usar estimativas por UF (como antes)
    console.warn(`Geocoding falhou para ${cidadeOrigem}-${cidadeDestino}, usando estimativa por UF:`, error.message);
    
    const distancias = {
      'SC': 150,   'PR': 200,   'RS': 300,   'SP': 350,   'MG': 500,
      'RJ': 600,   'MT': 800,   'GO': 700,   'MS': 600,   'DF': 750,
      'BA': 1200,  'CE': 1800,  'PE': 1600,  'PA': 2200,  'MA': 2000,
      'TO': 1500,  'PI': 1700,  'AL': 1500,  'SE': 1400,  'PB': 1700,
      'RN': 1800,  'AC': 2500,  'AP': 2800,  'AM': 2600,  'RO': 2000,
      'RR': 3000,  'EX': 500    // Exportação
    };
    
    const km = distancias[ufDestino?.toUpperCase()] || 500;
    
    return {
      km,
      durMin: Math.round((km / 60) * 60),
      method: 'uf_estimate',
      origem: `${cidadeOrigem}, ${ufOrigem}`,
      destino: `${cidadeDestino}, ${ufDestino}`
    };
  }
}

// Função para obter estatísticas do cache
export function getCacheStats() {
  return {
    geocodeCache: geocodeCache.size,
    routeCache: routeCache.size,
    hasApiKey: !!ORS_API_KEY
  };
}

// Função para limpar caches (útil para testes)
export function clearCaches() {
  geocodeCache.clear();
  routeCache.clear();
}