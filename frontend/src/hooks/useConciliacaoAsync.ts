// useConciliacaoAsync.ts
// Hook para conciliação assíncrona com processamento server-side

import type { ConciliacaoResult } from "@/types";
import type { LogEntry, LogLevel } from "@/utils/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUsageLimits } from "./useUsageLimits";

// Tipos
interface JobStatus {
	id: string;
	type: string;
	status: "queued" | "running" | "completed" | "failed" | "cancelled";
	createdAt: string;
	startedAt?: string;
	completedAt?: string;
	progress: {
		step: string;
		processed: number;
		total: number;
		percentage: number;
		message: string;
	};
	error?: string;
	stats?: {
		total: number;
		conforme: number;
		divergente: number;
		erroCalculo: number;
		tempoProcessamento: number;
	};
}

interface AsyncConciliacaoResult {
	jobId: string;
	stats: {
		total: number;
		conforme: number;
		divergente: number;
		erroCalculo: number;
		tempoProcessamento: number;
	};
	resultados: ConciliacaoResult[];
	erros: any[];
	observacoes: string[];
	truncatedInfo?: {
		wasTruncated: boolean;
		originalCount: number;
		processedCount: number;
		message: string;
	};
}

// Base dinâmica para API (conciliacao). Usa VITE_API_BASE_URL se definida, caso contrário fallback:
// - se estiver em produção e origin não é localhost:5173, usa same-origin
// - senão usa http://localhost:3000
const API_BASE_URL =
	(import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
		(typeof window !== "undefined" && window.location.origin !== "http://localhost:5173" ? window.location.origin : "http://localhost:3000")) + "/api";

export function useConciliacaoAsync() {
	// Estados
	const [currentJobId, setCurrentJobId] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
	const [resultado, setResultado] = useState<AsyncConciliacaoResult | null>(null);
	const [resultadoConciliacao, setResultadoConciliacao] = useState<ConciliacaoResult[]>([]);
	const [startTime, setStartTime] = useState<number | null>(null);
	const [logs, setLogs] = useState<{
		entries: LogEntry[];
		stats: { [key in LogLevel]: number };
		hasErrors: boolean;
		hasWarnings: boolean;
	}>({
		entries: [],
		stats: { debug: 0, info: 0, warn: 0, error: 0, critical: 0 },
		hasErrors: false,
		hasWarnings: false,
	});

	// Hook de limitação de uso
	const { usageStats, validatePlanilha, registrarUso, getTempoAteReset } = useUsageLimits();

	// Refs para controle
	const eventSourceRef = useRef<EventSource | null>(null);
	const pollingRef = useRef<number | null>(null);

	// Estados derivados
	const isProcessing = jobStatus?.status === "running" || jobStatus?.status === "queued";
	const isCompleted = jobStatus?.status === "completed";
	const hasError = jobStatus?.status === "failed";

	// Estados de progresso
	const uploadProgress = jobStatus?.progress?.percentage || 0;
	const currentStep = jobStatus?.progress?.step || "";
	const statusMessage = jobStatus?.progress?.message || "";
	const processedCount = jobStatus?.progress?.processed || 0;
	const totalCount = jobStatus?.progress?.total || 0;

	// Cálculo de tempo estimado
	const elapsedTime = startTime ? Date.now() - startTime : 0;
	const estimatedTotal = processedCount > 0 ? (elapsedTime / processedCount) * totalCount : 0;
	const estimatedRemaining = Math.max(0, estimatedTotal - elapsedTime);

	const formatTime = (ms: number) => {
		const seconds = Math.ceil(ms / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	};

	const timeRemaining = estimatedRemaining > 0 ? formatTime(estimatedRemaining) : "Calculando...";

	// Estatísticas derivadas
	const stats = resultado?.stats || {
		total: 0,
		conforme: 0,
		divergente: 0,
		erroCalculo: 0,
		tempoProcessamento: 0,
	};

	// Informações de uso
	const usageInfo = {
		consultasHoje: usageStats.consultasHoje,
		limiteConsultas: usageStats.limiteConsultas,
		consultasRestantes: usageStats.consultasRestantes,
		podeConsultar: usageStats.podeConsultar,
		tempoAteReset: getTempoAteReset(),
	};

	// Adicionar log
	const addLog = useCallback((level: LogLevel, message: string, context?: string, data?: any) => {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			data,
		};

		setLogs((prev) => {
			const newEntries = [...prev.entries, entry];
			const newStats = { ...prev.stats };
			newStats[level]++;

			return {
				entries: newEntries,
				stats: newStats,
				hasErrors: newStats.error > 0 || newStats.critical > 0,
				hasWarnings: newStats.warn > 0,
			};
		});
	}, []);

	// -------------------------
	// Persistência em localStorage
	// -------------------------
	const PERSIST_KEY = "conciliacaoAsyncState";

	// Restaurar estado salvo ao montar
	useEffect(() => {
		try {
			const raw = localStorage.getItem(PERSIST_KEY);
			if (!raw) return;
			const saved = JSON.parse(raw);
			if (saved.currentJobId) setCurrentJobId(saved.currentJobId);
			if (saved.jobStatus) setJobStatus(saved.jobStatus);
			if (saved.resultado) setResultado(saved.resultado);
			if (Array.isArray(saved.resultadoConciliacao)) setResultadoConciliacao(saved.resultadoConciliacao);
			if (saved.startTime) setStartTime(saved.startTime);

			// Se o job estava em andamento, retomar monitoramento
			const status = saved.jobStatus?.status;
			if (saved.currentJobId && (status === "running" || status === "queued")) {
				addLog("info", "Retomando monitoramento de job em andamento", "PERSIST", { jobId: saved.currentJobId });
				startMonitoring(saved.currentJobId); // tentará SSE e cairá para polling se necessário
			} else if (saved.currentJobId && status === "completed" && !saved.resultado) {
				// Se completado mas resultado não persistido corretamente, busca novamente
				addLog("warn", "Job completo sem resultado persistido. Rebuscando...", "PERSIST", { jobId: saved.currentJobId });
				fetchResult(saved.currentJobId);
			}
		} catch (e) {
			addLog("warn", "Falha ao restaurar estado persistido", "PERSIST", { error: e.message });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Salvar estado sempre que algo relevante mudar
	useEffect(() => {
		try {
			const dataToPersist = {
				currentJobId,
				jobStatus,
				resultado,
				resultadoConciliacao,
				startTime,
			};
			localStorage.setItem(PERSIST_KEY, JSON.stringify(dataToPersist));
		} catch (e) {
			addLog("warn", "Falha ao persistir estado", "PERSIST", { error: e.message });
		}
	}, [currentJobId, jobStatus, resultado, resultadoConciliacao, startTime, addLog]);

	// Upload do arquivo e início do processamento
	const uploadArquivo = useCallback(
		async (file: File) => {
			try {
				addLog("info", `Iniciando upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, "UPLOAD");

				// Validações iniciais do arquivo
				const allowedTypes = [
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
					"application/vnd.ms-excel", // .xls
					"text/csv", // .csv
					"application/csv",
				];

				if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
					const error = `Tipo de arquivo não suportado: ${file.type || "desconhecido"}. Use apenas Excel (.xlsx, .xls) ou CSV.`;
					addLog("error", error, "UPLOAD", { fileName: file.name, fileType: file.type });
					throw new Error(error);
				}

				if (file.size > 100 * 1024 * 1024) {
					// 100MB para uploads assíncronos
					const error = `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 100MB.`;
					addLog("error", error, "UPLOAD", { fileName: file.name, fileSize: file.size });
					throw new Error(error);
				}

				// Validação de limitação de uso - estimativa de linhas baseada no tamanho do arquivo
				const estimatedLines = Math.floor(file.size / 150); // Estimativa aproximada
				const validation = validatePlanilha(estimatedLines);

				if (!validation.valid) {
					addLog("error", validation.error || "Validação falhou", "USAGE_LIMIT");
					throw new Error(validation.error);
				}

				if (validation.warning) {
					addLog("warn", validation.warning, "USAGE_LIMIT");
				}

				// Limpar estados anteriores
				setResultado(null);
				setResultadoConciliacao([]);
				setJobStatus(null);

				addLog("debug", "Enviando arquivo para servidor...", "UPLOAD");

				const formData = new FormData();
				formData.append("planilha", file);

				const response = await fetch(`${API_BASE_URL}/conciliacao/upload`, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.erro || `Erro no upload: ${response.status}`);
				}

				const uploadResult = await response.json();
				const jobId = uploadResult.jobId;

				setCurrentJobId(jobId);
				setStartTime(Date.now()); // Iniciar cronômetro
				addLog("info", `Job criado com sucesso: ${jobId}`, "UPLOAD", uploadResult);

				// Iniciar monitoramento
				startMonitoring(jobId);

				return jobId;
			} catch (error) {
				addLog("error", `Erro no upload: ${error.message}`, "UPLOAD");
				throw error;
			}
		},
		[addLog, validatePlanilha]
	);

	// Iniciar monitoramento do job
	const startMonitoring = useCallback(
		(jobId: string) => {
			addLog("info", "Iniciando monitoramento em tempo real", "MONITOR");

			// Tentar Server-Sent Events primeiro
			try {
				const eventSource = new EventSource(`${API_BASE_URL}/conciliacao/stream/${jobId}`);
				eventSourceRef.current = eventSource;

				eventSource.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);

						switch (data.type) {
							case "progress":
								addLog("debug", `Progresso: ${data.data.message}`, "PROGRESS", data.data);
								break;
							case "completed":
								addLog("info", "Processamento concluído!", "COMPLETE", data.data);
								fetchResult(jobId);
								break;
							case "error":
								addLog("error", `Erro no processamento: ${data.data.error}`, "ERROR");
								break;
						}
					} catch (e) {
						addLog("warn", "Erro ao processar evento SSE", "SSE", { error: e.message });
					}
				};

				eventSource.onerror = (error) => {
					addLog("warn", "Erro na conexão SSE, usando polling", "SSE");
					eventSource.close();
					startPolling(jobId);
				};
			} catch (error) {
				addLog("warn", "SSE não suportado, usando polling", "MONITOR");
				startPolling(jobId);
			}
		},
		[addLog]
	);

	// Polling como fallback
	const startPolling = useCallback(
		(jobId: string) => {
			const poll = async () => {
				try {
					const response = await fetch(`${API_BASE_URL}/conciliacao/status/${jobId}`);
					if (response.ok) {
						const status = await response.json();
						setJobStatus(status);

						if (status.status === "completed") {
							fetchResult(jobId);
							if (pollingRef.current) {
								clearInterval(pollingRef.current);
							}
						} else if (status.status === "failed") {
							addLog("error", `Job falhou: ${status.error}`, "JOB");
							if (pollingRef.current) {
								clearInterval(pollingRef.current);
							}
						}
					}
				} catch (error) {
					addLog("warn", `Erro no polling: ${error.message}`, "POLLING");
				}
			};

			pollingRef.current = setInterval(poll, 2000); // A cada 2 segundos
			poll(); // Primeira execução imediata
		},
		[addLog]
	);

	// Buscar resultado final
	const fetchResult = useCallback(
		async (jobId: string) => {
			try {
				console.log("🚀 fetchResult iniciado para jobId:", jobId);
				addLog("info", "Buscando resultado final", "RESULT");

				const response = await fetch(`${API_BASE_URL}/conciliacao/resultado/${jobId}`);
				console.log("🔗 Response status:", response.status, response.ok);

				if (!response.ok) {
					throw new Error("Erro ao buscar resultado");
				}

				const result = await response.json();
				setResultado(result);

				// Debug - vamos ver o que está chegando
				console.log("🔍 Resultado do backend:", result);
				console.log("🔍 result.resultados:", result.resultados);
				console.log("🔍 Array.isArray(result.resultados):", Array.isArray(result.resultados));

				// Transformar resultados para formato compatível com a versão síncrona
				if (result.resultados && Array.isArray(result.resultados)) {
					console.log("✅ Definindo resultadoConciliacao com:", result.resultados.length, "itens");
					setResultadoConciliacao(result.resultados);
				} else {
					console.log("❌ Resultados não encontrados ou não é array");
					setResultadoConciliacao([]);
				}

				// Registrar uso quando completo
				if (result.stats && result.stats.total > 0) {
					registrarUso(result.stats.total);
				}

				addLog("info", `Resultado obtido: ${result.stats.conforme || 0} conformes, ${result.stats.divergente || 0} divergentes`, "RESULT", result.stats);
			} catch (error) {
				addLog("error", `Erro ao buscar resultado: ${error.message}`, "RESULT");
			}
		},
		[addLog, registrarUso]
	);

	// Cancelar processamento
	const cancelarProcessamento = useCallback(async () => {
		if (!currentJobId) return;

		try {
			addLog("info", "Cancelando processamento", "CANCEL");

			const response = await fetch(`${API_BASE_URL}/conciliacao/cancelar/${currentJobId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				addLog("info", "Processamento cancelado", "CANCEL");

				// Limpar monitoramento
				if (eventSourceRef.current) {
					eventSourceRef.current.close();
				}
				if (pollingRef.current) {
					clearInterval(pollingRef.current);
				}

				setCurrentJobId(null);
				setJobStatus(null);
			}
		} catch (error) {
			addLog("error", `Erro ao cancelar: ${error.message}`, "CANCEL");
		}
	}, [currentJobId, addLog]);

	// Limpar dados
	const limparDados = useCallback(() => {
		setCurrentJobId(null);
		setJobStatus(null);
		setResultado(null);
		setResultadoConciliacao([]);
		setStartTime(null);
		try {
			localStorage.removeItem(PERSIST_KEY);
			addLog("debug", "Estado persistido removido", "PERSIST");
		} catch {}

		// Parar monitoramento
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
		}
		if (pollingRef.current) {
			clearInterval(pollingRef.current);
		}

		addLog("info", "Dados limpos", "CLEAR");
	}, [addLog]);

	// Exportar resultados
	const exportarResultados = useCallback(
		(dados?: ConciliacaoResult[]) => {
			const dadosParaExportar = dados || resultadoConciliacao;

			if (!dadosParaExportar || dadosParaExportar.length === 0) {
				addLog("warn", "Nenhum dado para exportar", "EXPORT");
				return;
			}

			try {
				addLog("info", "Exportando resultados", "EXPORT");

				const dataStr = JSON.stringify(dadosParaExportar, null, 2);
				const dataBlob = new Blob([dataStr], { type: "application/json" });
				const url = URL.createObjectURL(dataBlob);

				const link = document.createElement("a");
				link.href = url;
				link.download = `conciliacao_async_${currentJobId || "unknown"}_${new Date().toISOString().slice(0, 10)}.json`;
				link.click();

				URL.revokeObjectURL(url);
				addLog("info", "Resultados exportados", "EXPORT");
			} catch (error) {
				addLog("error", `Erro na exportação: ${error.message}`, "EXPORT");
			}
		},
		[resultadoConciliacao, currentJobId, addLog]
	);

	// Funções de logs
	const clearLogs = useCallback(() => {
		setLogs({
			entries: [],
			stats: { debug: 0, info: 0, warn: 0, error: 0, critical: 0 },
			hasErrors: false,
			hasWarnings: false,
		});
	}, []);

	const exportLogs = useCallback(() => {
		try {
			const logsData = {
				timestamp: new Date().toISOString(),
				jobId: currentJobId,
				logs: logs.entries,
				stats: logs.stats,
			};

			const dataStr = JSON.stringify(logsData, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);

			const link = document.createElement("a");
			link.href = url;
			link.download = `logs_conciliacao_${new Date().toISOString().slice(0, 10)}.json`;
			link.click();

			URL.revokeObjectURL(url);
			addLog("info", "Logs exportados", "EXPORT");
		} catch (error) {
			addLog("error", `Erro na exportação de logs: ${error.message}`, "EXPORT");
		}
	}, [logs, currentJobId, addLog]);

	// Cleanup ao desmontar
	useEffect(() => {
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
			if (pollingRef.current) {
				clearInterval(pollingRef.current);
			}
		};
	}, []);

	return {
		// Estados principais
		currentJobId,
		jobStatus,
		resultado,
		resultadoConciliacao,
		logs,
		isProcessing,
		isCompleted,
		hasError,

		// Estados de progresso
		uploadProgress,
		currentStep,
		statusMessage,
		processedCount,
		totalCount,
		timeRemaining,

		// Estatísticas
		stats,

		// Informações de uso e limitação
		usageInfo,
		truncatedInfo: resultado?.truncatedInfo || null,

		// Ações
		uploadArquivo,
		cancelarProcessamento,
		limparDados,
		exportarResultados,
		clearLogs,
		exportLogs,
		// Expor chave de persistência para possíveis diagnósticos externos
		_persistKey: PERSIST_KEY,
	};
}
