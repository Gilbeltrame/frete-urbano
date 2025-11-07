import type { Coordinates, RouteInfo } from "@/types";
import { ApiError, viaCEPService } from "./api";

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY as string | undefined;
const ORS_BASE = "https://api.openrouteservice.org";

// Função para limpar CEP removendo formatação
function cleanCEP(cep: string): string {
	return cep.replace(/\D/g, ""); // Remove tudo que não for dígito
}

// Função para calcular distância em linha reta usando fórmula de Haversine
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Raio da Terra em km
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180);
}

// Estimativa de tempo baseada na distância (considerando média de 60 km/h)
function estimateTime(distanceKm: number): number {
	return Math.round((distanceKm / 60) * 60); // em minutos
}

// Fator de correção para distância rodoviária (linha reta * fator)
function getRoadDistanceFactor(distanceKm: number): number {
	// Fator baseado na distância para simular rotas reais
	if (distanceKm < 50) return 1.3; // Cidades próximas, mais curvas
	if (distanceKm < 200) return 1.25; // Distâncias médias
	if (distanceKm < 500) return 1.2; // Distâncias longas, mais diretas
	return 1.15; // Distâncias muito longas, rodovias principais
}

export const routeService = {
	// Geocoding usando múltiplas fontes
	async geocodeMultiSource(text: string): Promise<Coordinates> {
		const errors = [];

		if (ORS_API_KEY) {
			try {
				return await this.geocodeORS(text);
			} catch (error) {
				errors.push(`ORS: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
			}
		}

		throw new ApiError(`Não foi possível encontrar as coordenadas para: ${text}. Erros: ${errors.join("; ")}`);
	},

	async geocodeORS(text: string): Promise<Coordinates> {
		if (!ORS_API_KEY) throw new ApiError("Defina VITE_ORS_API_KEY");

		const url = `${ORS_BASE}/geocode/search?api_key=${encodeURIComponent(ORS_API_KEY)}&text=${encodeURIComponent(text)}&boundary.country=BR&size=1`;
		const response = await fetch(url);

		if (!response.ok) throw new ApiError("Falha no geocoding (ORS)");

		const data = await response.json();
		const feat = data?.features?.[0];
		if (!feat) throw new ApiError("Endereço não encontrado");

		const [lon, lat] = feat.geometry.coordinates;
		const label = feat.properties?.label || text;

		return { lat, lon, label };
	},

	// Fallback adicional usando Nominatim para tentar capturar melhor o bairro
	async geocodeNominatim(query: string): Promise<Coordinates | null> {
		try {
			const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
			const response = await fetch(url, {
				headers: { "Accept-Language": "pt-BR", "User-Agent": "frete-urbano-app/1.0" },
			});
			if (!response.ok) return null;
			const data = await response.json();
			const first = data?.[0];
			if (!first) return null;
			return {
				lat: parseFloat(first.lat),
				lon: parseFloat(first.lon),
				label: first.display_name || query,
			};
		} catch {
			return null;
		}
	},

	async calculateRoute(start: Coordinates, end: Coordinates): Promise<{ km: number; durMin: number; geometry?: { lat: number; lon: number }[] }> {
		if (!ORS_API_KEY) throw new ApiError("Defina VITE_ORS_API_KEY");

		const url = `${ORS_BASE}/v2/directions/driving-car?api_key=${encodeURIComponent(ORS_API_KEY)}&start=${start.lon},${start.lat}&end=${end.lon},${end.lat}`;
		const response = await fetch(url);

		if (!response.ok) {
			try {
				const errorData = await response.json();
				if (errorData?.error?.code === 2010) {
					throw new ApiError("Não foi possível encontrar uma rota válida para as coordenadas informadas. Tente usar endereços mais específicos ou próximos a vias principais.");
				}
				if (errorData?.error?.message) {
					throw new ApiError(`Erro na API de rotas: ${errorData.error.message}`);
				}
			} catch (parseError) {}
			throw new ApiError("Falha ao calcular rota (ORS)");
		}

		const data = await response.json();

		if (data?.error) {
			if (data.error.code === 2010) {
				throw new ApiError("Não foi possível encontrar uma rota válida para as coordenadas informadas. Tente usar endereços mais específicos ou próximos a vias principais.");
			}
			throw new ApiError(`Erro na API de rotas: ${data.error.message}`);
		}

		const summary = data?.features?.[0]?.properties?.summary;
		if (!summary) throw new ApiError("Rota não encontrada");

		const km = (summary.distance / 1000) as number;
		const durMin = Math.round((summary.duration / 60) as number);

		// Extrair geometria detalhada (lista de coordenadas [lon, lat])
		let geometry: { lat: number; lon: number }[] | undefined;
		try {
			const coords: [number, number][] = data?.features?.[0]?.geometry?.coordinates || [];
			if (Array.isArray(coords) && coords.length > 1) {
				geometry = coords.map(([lon, lat]) => ({ lon, lat }));
			}
		} catch {}

		return { km, durMin, geometry };
	},

	async geocodeFromMode(mode: "cep" | "cidade", cep: string, cidade: string, numero?: string): Promise<Coordinates> {
		if (mode === "cep") {
			// Limpar CEP removendo hífen e outros caracteres
			const cleanedCEP = cleanCEP(cep);

			try {
				const viaCepData = await viaCEPService.getCEP(cleanedCEP);
				// Montar endereço mais específico possível
				const addressParts = [];
				if (viaCepData.logradouro) addressParts.push(viaCepData.logradouro);
				if (numero?.trim()) addressParts.push(numero.trim());
				if (viaCepData.bairro) addressParts.push(viaCepData.bairro);
				addressParts.push(`${viaCepData.localidade}, ${viaCepData.uf}`);

				const fullAddress = addressParts.join(", ");

				try {
					const coord = await this.geocodeMultiSource(fullAddress);
					const expectedBairro = viaCepData.bairro?.trim();
					if (expectedBairro && coord.label && !coord.label.toLowerCase().includes(expectedBairro.toLowerCase())) {
						// Tenta ORS só com bairro
						try {
							const bairroAddress = `${expectedBairro}, ${viaCepData.localidade}, ${viaCepData.uf}`;
							let retry = await this.geocodeMultiSource(bairroAddress);
							if (retry.label && !retry.label.toLowerCase().includes(expectedBairro.toLowerCase())) {
								// Tenta Nominatim como fallback final
								const nominatim = await this.geocodeNominatim(bairroAddress);
								if (nominatim) retry = nominatim;
							}
							return { ...retry, bairro: expectedBairro };
						} catch {
							const bairroAddress = `${expectedBairro}, ${viaCepData.localidade}, ${viaCepData.uf}`;
							const nominatim = await this.geocodeNominatim(bairroAddress);
							if (nominatim) return { ...nominatim, bairro: expectedBairro };
							return { ...coord, bairro: expectedBairro }; // mantém coord original
						}
					}
					return { ...coord, bairro: expectedBairro };
				} catch (error) {
					// Se falhar com endereço completo, tenta só com cidade
					console.warn("Geocoding com endereço completo falhou, tentando só com cidade:", error);
					const cityOnly = `${viaCepData.localidade}, ${viaCepData.uf}`;
					const coordCity = await this.geocodeMultiSource(cityOnly);
					return { ...coordCity, bairro: viaCepData.bairro?.trim() };
				}
			} catch {
				// fallback: tenta geocodificar o CEP limpo diretamente
				try {
					// Formatar CEP com hífen para as APIs de geocoding
					const formattedCEP = cleanedCEP.replace(/(\d{5})(\d{3})/, "$1-$2");
					const coord = await this.geocodeMultiSource(`CEP ${formattedCEP}, Brasil`);
					return coord;
				} catch (error) {
					throw new ApiError(`Não foi possível localizar o CEP ${cep}. Verifique se está correto.`);
				}
			}
		}
		// cidade/UF
		try {
			return await this.geocodeMultiSource(cidade);
		} catch (error) {
			throw new ApiError(`Não foi possível localizar a cidade "${cidade}". Verifique se o nome está correto.`);
		}
	},

	async calculateFullRoute(
		origemMode: "cep" | "cidade",
		origemCep: string,
		origemCidade: string,
		destinoMode: "cep" | "cidade",
		destinoCep: string,
		destinoCidade: string,
		origemNumero?: string,
		destinoNumero?: string
	): Promise<RouteInfo> {
		const origemTxt = this.buildLocationText(origemMode, origemCep, origemCidade);
		const destinoTxt = this.buildLocationText(destinoMode, destinoCep, destinoCidade);

		if (!origemTxt || !destinoTxt) {
			throw new ApiError("Informe origem e destino (CEP ou Cidade/UF)");
		}

		const origem = await this.geocodeFromMode(origemMode, origemCep, origemCidade, origemNumero);
		const destino = await this.geocodeFromMode(destinoMode, destinoCep, destinoCidade, destinoNumero);

		// Verificar se as coordenadas são diferentes
		const coordsAreSame = Math.abs(origem.lat - destino.lat) < 0.001 && Math.abs(origem.lon - destino.lon) < 0.001;

		if (coordsAreSame) {
			throw new ApiError("Origem e destino são muito próximos ou idênticos. Verifique os endereços informados.");
		}

		try {
			const { km, durMin, geometry } = await this.calculateRoute(origem, destino);
			return {
				km,
				durMin,
				origem: origem.label,
				destino: destino.label,
				isEstimate: false,
				geometry,
				origemCoords: { lat: origem.lat, lon: origem.lon },
				destinoCoords: { lat: destino.lat, lon: destino.lon },
				origemBairro: origem.bairro,
				destinoBairro: destino.bairro,
				bairroMismatchOrigem: origem.bairro ? !origem.label.toLowerCase().includes(origem.bairro.toLowerCase()) : false,
				bairroMismatchDestino: destino.bairro ? !destino.label.toLowerCase().includes(destino.bairro.toLowerCase()) : false,
			};
		} catch (error: any) {
			// Se falhar ao calcular rota, usa distância estimada como fallback
			console.warn("Rota exata não disponível, calculando estimativa:", error);

			const straightKm = calculateHaversineDistance(origem.lat, origem.lon, destino.lat, destino.lon);
			const roadFactor = getRoadDistanceFactor(straightKm);
			const estimatedKm = straightKm * roadFactor;
			const estimatedDuration = estimateTime(estimatedKm);

			return {
				km: Number(estimatedKm.toFixed(1)),
				durMin: estimatedDuration,
				origem: origem.label,
				destino: destino.label,
				isEstimate: true,
				geometry: [
					{ lat: origem.lat, lon: origem.lon },
					{ lat: destino.lat, lon: destino.lon },
				],
				origemCoords: { lat: origem.lat, lon: origem.lon },
				destinoCoords: { lat: destino.lat, lon: destino.lon },
				origemBairro: origem.bairro,
				destinoBairro: destino.bairro,
				bairroMismatchOrigem: origem.bairro ? !origem.label.toLowerCase().includes(origem.bairro.toLowerCase()) : false,
				bairroMismatchDestino: destino.bairro ? !destino.label.toLowerCase().includes(destino.bairro.toLowerCase()) : false,
			};
		}
	},

	buildLocationText(mode: "cep" | "cidade", cep: string, cidade: string): string {
		if (mode === "cep" && cep.trim()) return cep.trim();
		if (mode === "cidade" && cidade.trim()) return cidade.trim() + ", Brasil";
		return "";
	},

	get hasApiKey(): boolean {
		return !!ORS_API_KEY;
	},
};
