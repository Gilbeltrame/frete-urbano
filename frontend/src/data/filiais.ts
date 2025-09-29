// Mapeamento de filiais para cidades de origem
export const MAPEAMENTO_FILIAIS = {
	"01-URBANO MATRIZ": {
		cidade: "FRAIBURGO",
		uf: "SC",
	},
	"01-BROTO LEGAL CAMPINAS": {
		cidade: "CAMPINAS",
		uf: "SP",
	},
	"21-FORMOSA": {
		cidade: "FORMOSA",
		uf: "GO",
	},
	"14-PONTA GROSSA": {
		cidade: "PONTA GROSSA",
		uf: "PR",
	},
	"15-VARZEA GRANDE": {
		cidade: "VARZEA GRANDE",
		uf: "MT",
	},
	"02-SAO GABRIEL": {
		cidade: "SAO GABRIEL",
		uf: "RS",
	},
	"03-MELEIRO": {
		cidade: "MELEIRO",
		uf: "SC",
	},
	"03-BROTO LEGAL URUGUAIANA": {
		cidade: "URUGUAIANA",
		uf: "RS",
	},
	"04-SINOP": {
		cidade: "SINOP",
		uf: "MT",
	},
	"10-SALVADOR": {
		cidade: "SALVADOR",
		uf: "BA",
	},
	"06-CABO DE STO AGO": {
		cidade: "CABO DE SANTO AGOSTINHO",
		uf: "PE",
	},
	"02-BROTO LEGAL PORTO FERREIRA": {
		cidade: "PORTO FERREIRA",
		uf: "SP",
	},
	"08-BRASILIA": {
		cidade: "BRASILIA",
		uf: "DF",
	},
	"12-GUARULHOS 2": {
		cidade: "GUARULHOS",
		uf: "SP",
	},
	"07-FORTALEZA": {
		cidade: "FORTALEZA",
		uf: "CE",
	},
	"11-GUARULHOS 1": {
		cidade: "GUARULHOS",
		uf: "SP",
	},
};

// Função para obter cidade/UF baseado na filial
export const obterOrigemPorFilial = (filialNome: string) => {
	const filial = MAPEAMENTO_FILIAIS[filialNome as keyof typeof MAPEAMENTO_FILIAIS];
	return filial || { cidade: "", uf: "" };
};

// Função para normalizar nome da filial (remove variações)
export const normalizarFilial = (filialNome: string): string => {
	const filialLimpa = filialNome.trim().toUpperCase();

	// Buscar correspondência exata primeiro
	for (const [key] of Object.entries(MAPEAMENTO_FILIAIS)) {
		if (key.toUpperCase() === filialLimpa) {
			return key;
		}
	}

	// Buscar correspondência parcial
	for (const [key] of Object.entries(MAPEAMENTO_FILIAIS)) {
		if (key.toUpperCase().includes(filialLimpa) || filialLimpa.includes(key.toUpperCase())) {
			return key;
		}
	}

	return filialNome; // Retorna original se não encontrar
};
