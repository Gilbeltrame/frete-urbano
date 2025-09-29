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

// Tipos para Conciliação
export interface OrcamentoItem {
	filial: string;
	filialNome: string;
	dataEmissao: string;
	cfop: string;
	cidadeOrigem: string;
	origemUF: string;
	cidadeDestino: string;
	destinoUF: string;
	lote: string;
	placa: string;
	transportadora: string;
	valorFrete: number;
	pesoLiqCalc: number;
	pesoBruto: number;
	tpVeiculo: string;
	tpFrota: string;
	qtEixos: number;
	tipoCarga: string;
	tabelaFrete: string;
	distanciaKm?: number;
	pedagioTotal?: number;
}

export interface FreteMinANTT {
	valor: number;
	detalhamento: {
		pisoBase: number;
		retornoVazio: number;
		pedagio: number;
		coeficientes: {
			CCD: number;
			CC: number;
		};
	};
	parametros: {
		tabela: string;
		tipoCarga: string;
		eixos: number;
		distanciaKm: number;
	};
}

export interface ConciliacaoResult {
	item: OrcamentoItem;
	status: "CONFORME" | "DIVERGENTE" | "ERRO_CALCULO";
	alertas: string[];
	freteMinimo: FreteMinANTT | null;
	detalhes?: {
		valorCobrado: number;
		valorMinimo: number;
		diferençaPercentual: number;
		diferençaValor: number;
		rotaCalculada?: boolean;
		distanciaCalculada?: number;
		observacoes?: string[];
	};
}

export type StatusConciliacao = "CONFORME" | "DIVERGENTE" | "ERRO_CALCULO";

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
