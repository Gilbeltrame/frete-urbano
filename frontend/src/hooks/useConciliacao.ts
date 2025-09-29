import type { ConciliacaoResult, OrcamentoItem } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useUsageLimits } from "./useUsageLimits";

export interface UseConciliacaoReturn {
	planilhaData: OrcamentoItem[];
	resultadoConciliacao: ConciliacaoResult[];
	isProcessing: boolean;
	uploadProgress: number;
	processedCount: number;
	currentProcessingItem: string;
	truncatedInfo: {
		wasTruncated: boolean;
		originalCount: number;
		processedCount: number;
		message: string;
	} | null;
	stats: {
		total: number;
		conforme: number;
		risco: number;
		naoConforme: number;
	};
	usageInfo: {
		consultasHoje: number;
		limiteConsultas: number;
		consultasRestantes: number;
		podeConsultar: boolean;
		tempoAteReset: string;
	};
	processarPlanilha: (file: File) => Promise<void>;
	exportarResultados: (dados: ConciliacaoResult[]) => void;
	limparDados: () => void;
	cancelarProcessamento: () => void;
}

export const useConciliacao = (): UseConciliacaoReturn => {
	const [planilhaData, setPlanilhaData] = useState<OrcamentoItem[]>([]);
	const [resultadoConciliacao, setResultadoConciliacao] = useState<ConciliacaoResult[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [processedCount, setProcessedCount] = useState(0);
	const [currentProcessingItem, setCurrentProcessingItem] = useState("");
	const [truncatedInfo, setTruncatedInfo] = useState<{
		wasTruncated: boolean;
		originalCount: number;
		processedCount: number;
		message: string;
	} | null>(null);

	const workerRef = useRef<Worker | null>(null);
	const { usageStats, validatePlanilha, registrarUso, getTempoAteReset } = useUsageLimits();

	// Inicializar worker quando necessário
	const initWorker = useCallback(() => {
		if (!workerRef.current) {
			workerRef.current = new Worker(new URL("../workers/conciliacaoWorker.ts", import.meta.url), { type: "module" });

			workerRef.current.onmessage = (event) => {
				const { type, payload } = event.data;

				switch (type) {
					case "PROGRESS_UPDATE":
						setUploadProgress(payload.progress);
						setProcessedCount(payload.processed);
						if (payload.currentItem) {
							setCurrentProcessingItem(payload.currentItem.item.transportadora || "Processando...");
							// Streaming: adicionar resultado em tempo real
							setResultadoConciliacao((prev) => [...prev, payload.currentItem]);
						}
						break;

					case "VALIDATION_COMPLETE":
						setIsProcessing(false);
						setUploadProgress(100);
						setCurrentProcessingItem("Concluído");
						// Registrar uso apenas quando completo
						registrarUso(payload.length);
						break;

					case "ERROR":
						setIsProcessing(false);
						setCurrentProcessingItem("Erro no processamento");
						console.error("Erro no worker:", payload);
						break;
				}
			};

			workerRef.current.onerror = (error) => {
				console.error("Erro no worker:", error);
				setIsProcessing(false);
				setCurrentProcessingItem("Erro no processamento");
			};
		}
		return workerRef.current;
	}, [registrarUso]);

	// Limpar worker ao desmontar componente
	useEffect(() => {
		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
		};
	}, []);

	// Função para processar arquivo Excel/CSV com web worker
	const processarPlanilha = useCallback(
		async (file: File) => {
			if (!file) return;

			try {
				// Ler arquivo
				setIsProcessing(true);
				setUploadProgress(5);
				setProcessedCount(0);
				setCurrentProcessingItem("Lendo arquivo...");
				setResultadoConciliacao([]); // Limpar resultados anteriores

				const reader = new FileReader();
				reader.onload = async (e) => {
					try {
						const data = e.target?.result;
						const workbook = XLSX.read(data, { type: "binary" });
						const sheetName = workbook.SheetNames[0];
						const worksheet = workbook.Sheets[sheetName];
						const jsonData = XLSX.utils.sheet_to_json(worksheet);

						setUploadProgress(15);
						setCurrentProcessingItem("Validando dados...");

						// Mapear os dados para o formato esperado (novo formato para cálculo ANTT)
						const allMappedData: OrcamentoItem[] = jsonData.map((row: any) => ({
							filial: String(row.Filial || row.filial || ""),
							filialNome: String(row["Filial - Nome"] || row["Filial Nome"] || row.filialNome || ""),
							dataEmissao: String(row["Data Emissao"] || row["Data Emissão"] || row.dataEmissao || ""),
							cfop: String(row.CFOP || row.cfop || ""),
							cidadeOrigem: String(row["Cidade Origem"] || row["Origem"] || row.cidadeOrigem || row.origem || ""),
							origemUF: String(row["Origem UF"] || row["UF Origem"] || row.origemUF || row.ufOrigem || ""),
							cidadeDestino: String(row["Cidade Destino"] || row["Destino"] || row.cidadeDestino || row.destino || ""),
							destinoUF: String(row["Destino UF"] || row["UF Destino"] || row.destinoUF || row.ufDestino || row["Cliente - UF"] || row.clienteUF || ""),
							lote: String(row.Lote || row.lote || ""),
							placa: String(row.Placa || row.placa || ""),
							transportadora: String(row.Transportadora || row.transportadora || ""),
							valorFrete: Number(String(row["Valor Frete"] || row["Valor do Frete"] || row.valorFrete || row.valor || 0).replace(/[^\d.-]/g, "")) || 0,
							pesoLiqCalc: Number(String(row["Peso Líq Calc"] || row["Peso Liq Calc"] || row.pesoLiqCalc || 0).replace(/[^\d.-]/g, "")) || 0,
							pesoBruto: Number(String(row["Peso Bruto"] || row.pesoBruto || 0).replace(/[^\d.-]/g, "")) || 0,
							tpVeiculo: String(row["Tp Veículo"] || row["Tp Veiculo"] || row.tpVeiculo || ""),
							tpFrota: String(row["Tp Frota"] || row.tpFrota || ""),
							qtEixos: Number(row["Qt Eixos"] || row.qtEixos || 0) || 0,
							tipoCarga: String(row["Tipo Carga"] || row["Tp Carga"] || row.tipoCarga || row.tpCarga || "carga_geral"),
							tabelaFrete: String(row["Tabela Frete"] || row["Tabela"] || row.tabelaFrete || row.tabela || "A").toUpperCase(),
							distanciaKm: Number(String(row["Distancia Km"] || row["Distância"] || row.distanciaKm || row.distancia || 0).replace(/[^\d.-]/g, "")) || undefined,
							pedagioTotal: Number(String(row["Pedagio Total"] || row["Pedágio"] || row.pedagioTotal || row.pedagio || 0).replace(/[^\d.-]/g, "")) || undefined,
						}));

						const originalCount = allMappedData.length;
						const LIMITE_LINHAS = 1000;

						// Verificar se precisa truncar
						let mappedData = allMappedData;
						let wasTruncated = false;

						if (originalCount > LIMITE_LINHAS) {
							mappedData = allMappedData.slice(0, LIMITE_LINHAS);
							wasTruncated = true;

							// Definir informações de truncamento
							setTruncatedInfo({
								wasTruncated: true,
								originalCount,
								processedCount: LIMITE_LINHAS,
								message: `Arquivo contém ${originalCount.toLocaleString()} linhas. Processando apenas as primeiras ${LIMITE_LINHAS.toLocaleString()} linhas devido ao limite do sistema.`,
							});

							setCurrentProcessingItem(`Arquivo truncado: processando ${LIMITE_LINHAS.toLocaleString()} de ${originalCount.toLocaleString()} linhas`);
						} else {
							// Limpar informações de truncamento
							setTruncatedInfo(null);
						}

						// Validar limites de consultas diárias
						const validation = validatePlanilha(mappedData.length);
						if (!validation.valid) {
							setIsProcessing(false);
							throw new Error(validation.error);
						}

						if (validation.warning) {
							console.warn("Aviso de uso:", validation.warning);
						}

						setPlanilhaData(mappedData);
						setUploadProgress(25);
						setCurrentProcessingItem("Iniciando validações...");

						// Inicializar worker e processar dados
						const worker = initWorker();
						worker.postMessage({
							type: "PROCESS_DATA",
							payload: mappedData,
						});
					} catch (error) {
						setIsProcessing(false);
						throw error;
					}
				};
				reader.readAsBinaryString(file);
			} catch (error) {
				console.error("Erro ao processar arquivo:", error);
				setIsProcessing(false);
				setCurrentProcessingItem("Erro");
				throw error;
			}
		},
		[initWorker, validatePlanilha]
	);

	// Função para cancelar processamento
	const cancelarProcessamento = useCallback(() => {
		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
		}
		setIsProcessing(false);
		setUploadProgress(0);
		setProcessedCount(0);
		setCurrentProcessingItem("Cancelado");
	}, []);

	// Função para exportar resultados
	const exportarResultados = useCallback((dados: ConciliacaoResult[]) => {
		const dadosExport = dados.map((resultado) => ({
			Filial: resultado.item.filial,
			"Filial Nome": resultado.item.filialNome,
			"Data Emissão": resultado.item.dataEmissao,
			CFOP: resultado.item.cfop,
			"Cidade Destino": resultado.item.cidadeDestino,
			"Cliente UF": resultado.item.clienteUF,
			Lote: resultado.item.lote,
			Placa: resultado.item.placa,
			Transportadora: resultado.item.transportadora,
			"Peso Líq Calc": resultado.item.pesoLiqCalc,
			"Peso Bruto": resultado.item.pesoBruto,
			"Tp Veículo": resultado.item.tpVeiculo,
			"Tp Frota": resultado.item.tpFrota,
			"Qt Eixos": resultado.item.qtEixos,
			Status: resultado.status,
			Alertas: resultado.alertas.join("; "),
			"Diferença Peso (kg)": resultado.detalhes?.diferençaPeso?.toFixed(2) || "0",
			Observações: resultado.detalhes?.observacoes?.join("; ") || "",
		}));

		const ws = XLSX.utils.json_to_sheet(dadosExport);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Conciliacao");

		// Ajustar largura das colunas
		const colWidths = Object.keys(dadosExport[0] || {}).map((key) => ({
			wch: Math.max(key.length, 15),
		}));
		ws["!cols"] = colWidths;

		XLSX.writeFile(wb, `conciliacao_${new Date().toISOString().split("T")[0]}.xlsx`);
	}, []);

	// Função para limpar dados
	const limparDados = useCallback(() => {
		setPlanilhaData([]);
		setResultadoConciliacao([]);
		setUploadProgress(0);
		setIsProcessing(false);
		setTruncatedInfo(null);
		setProcessedCount(0);
		setCurrentProcessingItem("");
	}, []);

	// Calcular estatísticas
	const stats = {
		total: resultadoConciliacao.length,
		conforme: resultadoConciliacao.filter((r) => r.status === "CONFORME").length,
		risco: resultadoConciliacao.filter((r) => r.status === "RISCO").length,
		naoConforme: resultadoConciliacao.filter((r) => r.status === "NAO_CONFORME").length,
	};

	return {
		planilhaData,
		resultadoConciliacao,
		isProcessing,
		uploadProgress,
		processedCount,
		currentProcessingItem,
		truncatedInfo,
		stats,
		usageInfo: {
			consultasHoje: usageStats.consultasHoje,
			limiteConsultas: usageStats.limiteConsultas,
			consultasRestantes: usageStats.consultasRestantes,
			podeConsultar: usageStats.podeConsultar,
			tempoAteReset: getTempoAteReset(),
		},
		processarPlanilha,
		exportarResultados,
		limparDados,
		cancelarProcessamento,
	};
};
