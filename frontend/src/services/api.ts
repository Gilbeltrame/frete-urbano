import type { ViaCEPResponse } from "@/types";

const API_BASE = "http://localhost:3000";

export class ApiError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = "ApiError";
	}
}

export const viaCEPService = {
	async getCEP(cepRaw: string): Promise<ViaCEPResponse> {
		console.log("🏢 viaCEPService.getCEP iniciado com:", cepRaw);

		const digits = (cepRaw || "").replace(/\D/g, "");
		console.log("🔢 Dígitos extraídos:", digits);

		if (digits.length < 8) {
			console.error("❌ CEP inválido - menos de 8 dígitos:", digits);
			throw new ApiError("CEP inválido");
		}

		const url = `https://viacep.com.br/ws/${digits}/json/`;
		console.log("🌐 Fazendo requisição para:", url);

		const response = await fetch(url);
		console.log("📡 Resposta viaCEP status:", response.status, response.ok);

		if (!response.ok) {
			console.error("❌ Falha na requisição viaCEP:", response.status, response.statusText);
			throw new ApiError("Falha ao consultar ViaCEP");
		}

		const data = await response.json();
		console.log("📦 Dados recebidos do viaCEP:", data);

		if (data && data.erro) {
			console.error("❌ CEP não encontrado no viaCEP:", data);
			throw new ApiError("CEP não encontrado no ViaCEP");
		}

		console.log("✅ viaCEP sucesso:", data);
		return data;
	},
};

export const apiService = {
	async calculateFrete(data: any) {
		const response = await fetch(`${API_BASE}/api/calcula-frete`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		const result = await response.json();
		if (!response.ok) {
			throw new ApiError(result?.erro || "Erro ao calcular", response.status);
		}

		return result;
	},

	async calculateFreteMassa(itens: any[]) {
		console.log("🚛 Iniciando cálculo de frete em massa para", itens.length, "itens");

		const response = await fetch(`${API_BASE}/api/calcula-frete-massa`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ itens }),
		});

		const result = await response.json();

		if (!response.ok) {
			console.error("❌ Erro na API de frete em massa:", result);
			throw new ApiError(result?.erro || "Erro ao calcular frete em massa", response.status);
		}

		console.log("✅ Cálculo de frete em massa concluído:", result.resumo);
		return result;
	},
};
