export type ModoDistancia = "km" | "origemdestino";

export type LocalMode = "cep" | "cidade";

export interface ViaCEPResponse {
	logradouro?: string;
	bairro?: string;
	localidade: string;
	uf: string;
	erro?: boolean;
}

export interface Coordinates {
	lat: number;
	lon: number;
	label: string;
}

export interface RouteInfo {
	km: number;
	durMin: number;
	origem: string;
	destino: string;
	isEstimate?: boolean; // Indica se é uma estimativa (distância em linha reta)
}

export interface FreteCalculationRequest {
	tabela: string;
	tipoCarga: string;
	eixos: number;
	distancia_km: number;
	retorno_vazio_km: number;
	pedagio_total: number;
}

export interface FreteCalculationResponse {
	total: number;
	moeda: string;
	coeficientes: {
		CCD: number;
		CC: number;
	};
	detalhamento: {
		pisoBase: number;
		retornoVazioValor: number;
		pedagio_total: number;
	};
	input: any;
}

export interface FreteFormData {
	modo: ModoDistancia;
	eixos: string;
	nLotes: string;
	kmTotal: string;
	origemMode: LocalMode;
	destinoMode: LocalMode;
	origemCep: string;
	destinoCep: string;
	origemCidade: string;
	destinoCidade: string;
	retornoKm: string;
	pedagio: string;
}
