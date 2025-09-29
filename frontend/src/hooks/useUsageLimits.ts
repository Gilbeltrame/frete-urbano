import { useCallback, useEffect, useState } from "react";

interface UsageStats {
	consultasHoje: number;
	limiteConsultas: number;
	ultimaReset: string;
	podeConsultar: boolean;
	consultasRestantes: number;
}

const LIMITE_CONSULTAS_DIARIO = 1800;
const LIMITE_LINHAS_PLANILHA = 200;
const STORAGE_KEY = "conciliacao_usage_stats";

export const useUsageLimits = () => {
	const [usageStats, setUsageStats] = useState<UsageStats>({
		consultasHoje: 0,
		limiteConsultas: LIMITE_CONSULTAS_DIARIO,
		ultimaReset: new Date().toDateString(),
		podeConsultar: true,
		consultasRestantes: LIMITE_CONSULTAS_DIARIO,
	});

	// Carregar estatísticas do localStorage
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const stats = JSON.parse(saved) as UsageStats;
				const hoje = new Date().toDateString();

				// Reset diário
				if (stats.ultimaReset !== hoje) {
					const newStats: UsageStats = {
						consultasHoje: 0,
						limiteConsultas: LIMITE_CONSULTAS_DIARIO,
						ultimaReset: hoje,
						podeConsultar: true,
						consultasRestantes: LIMITE_CONSULTAS_DIARIO,
					};
					setUsageStats(newStats);
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
				} else {
					// Atualizar campos calculados
					const updatedStats = {
						...stats,
						podeConsultar: stats.consultasHoje < LIMITE_CONSULTAS_DIARIO,
						consultasRestantes: Math.max(0, LIMITE_CONSULTAS_DIARIO - stats.consultasHoje),
					};
					setUsageStats(updatedStats);
				}
			} catch (error) {
				console.error("Erro ao carregar estatísticas de uso:", error);
			}
		}
	}, []);

	// Validar se pode processar planilha
	const validatePlanilha = useCallback(
		(
			numeroLinhas: number
		): {
			valid: boolean;
			error?: string;
			warning?: string;
		} => {
			// Arquivos com mais de 200 linhas são truncados automaticamente
			// Validamos o menor entre o número de linhas e o limite
			const linhasAProcessar = Math.min(numeroLinhas, LIMITE_LINHAS_PLANILHA);

			// Verificar limite de consultas diárias
			if (!usageStats.podeConsultar) {
				return {
					valid: false,
					error: `Limite diário de ${LIMITE_CONSULTAS_DIARIO.toLocaleString()} consultas atingido. Tente novamente amanhã.`,
				};
			}

			// Verificar se as linhas a processar irão exceder o limite diário
			if (usageStats.consultasHoje + linhasAProcessar > LIMITE_CONSULTAS_DIARIO) {
				const consultasDisponiveis = LIMITE_CONSULTAS_DIARIO - usageStats.consultasHoje;
				return {
					valid: false,
					error: `Esta planilha (${linhasAProcessar.toLocaleString()} linhas a processar) excederia o limite diário. Consultas restantes hoje: ${consultasDisponiveis.toLocaleString()}.`,
				};
			}

			// Warning se está chegando perto do limite
			const consultasAposProcessamento = usageStats.consultasHoje + linhasAProcessar;
			const percentualUso = (consultasAposProcessamento / LIMITE_CONSULTAS_DIARIO) * 100;

			if (percentualUso > 80) {
				let warningMessage = `Após processar esta planilha, você terá usado ${percentualUso.toFixed(1)}% do limite diário.`;

				// Adicionar aviso sobre truncamento se aplicável
				if (numeroLinhas > LIMITE_LINHAS_PLANILHA) {
					warningMessage += ` Arquivo será truncado para ${LIMITE_LINHAS_PLANILHA.toLocaleString()} linhas.`;
				}

				return {
					valid: true,
					warning: warningMessage,
				};
			}

			// Warning apenas sobre truncamento se aplicável
			if (numeroLinhas > LIMITE_LINHAS_PLANILHA) {
				return {
					valid: true,
					warning: `Arquivo contém ${numeroLinhas.toLocaleString()} linhas e será truncado para ${LIMITE_LINHAS_PLANILHA.toLocaleString()} linhas.`,
				};
			}

			return { valid: true };
		},
		[usageStats]
	);

	// Registrar uso de consultas
	const registrarUso = useCallback(
		(numeroConsultas: number) => {
			const novasStats: UsageStats = {
				...usageStats,
				consultasHoje: usageStats.consultasHoje + numeroConsultas,
				consultasRestantes: Math.max(0, usageStats.consultasRestantes - numeroConsultas),
				podeConsultar: usageStats.consultasHoje + numeroConsultas < LIMITE_CONSULTAS_DIARIO,
			};

			setUsageStats(novasStats);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(novasStats));
		},
		[usageStats]
	);

	// Reset manual (para desenvolvimento/testes)
	const resetUsage = useCallback(() => {
		const newStats: UsageStats = {
			consultasHoje: 0,
			limiteConsultas: LIMITE_CONSULTAS_DIARIO,
			ultimaReset: new Date().toDateString(),
			podeConsultar: true,
			consultasRestantes: LIMITE_CONSULTAS_DIARIO,
		};
		setUsageStats(newStats);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
	}, []);

	// Obter próximo reset
	const getProximoReset = useCallback(() => {
		const amanha = new Date();
		amanha.setDate(amanha.getDate() + 1);
		amanha.setHours(0, 0, 0, 0);
		return amanha;
	}, []);

	// Tempo até próximo reset
	const getTempoAteReset = useCallback(() => {
		const proximoReset = getProximoReset();
		const agora = new Date();
		const diff = proximoReset.getTime() - agora.getTime();

		const horas = Math.floor(diff / (1000 * 60 * 60));
		const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		return `${horas}h ${minutos}m`;
	}, [getProximoReset]);

	return {
		usageStats,
		validatePlanilha,
		registrarUso,
		resetUsage,
		getTempoAteReset,
		limites: {
			consultasDiarias: LIMITE_CONSULTAS_DIARIO,
			linhasPlanilha: LIMITE_LINHAS_PLANILHA,
		},
	};
};
