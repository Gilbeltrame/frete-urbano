// Web Worker para cálculo de frete mínimo ANTT
// Este worker roda em thread separada para não bloquear a UI

export interface WorkerMessage {
	type: "PROCESS_DATA" | "PROGRESS_UPDATE" | "VALIDATION_COMPLETE" | "ERROR" | "LOG";
	payload?: any;
}

export interface TabelaFreteConfig {
	tabela: string;
	tiposCarga: string[];
	coeficientes: {
		CCD: number; // Coeficiente Custo Distância
		CC: number; // Coeficiente Custo
	};
}

// Tipos espelhados do arquivo principal (necessário no worker)
interface OrcamentoItem {
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

interface FreteMinANTT {
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

interface ConciliacaoResult {
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

class ConciliacaoWorker {
	private batchSize = 50; // Processa 50 itens por vez
	private delayBetweenBatches = 10; // 10ms entre batches

	// Função para enviar logs para o main thread
	private log(level: "debug" | "info" | "warn" | "error" | "critical", message: string, context?: string, data?: any, error?: Error) {
		self.postMessage({
			type: "LOG",
			payload: {
				timestamp: new Date().toISOString(),
				level,
				message,
				context: context || "WORKER",
				data,
				stack: error?.stack,
			},
		});
	}

	// Validação de placa brasileira
	private validarPlaca(placa: string): boolean {
		if (!placa || placa.length < 7) return false;

		const placaLimpa = placa.replace(/[\s-]/g, "").toUpperCase();

		// Padrão antigo: ABC1234
		const padrao1 = /^[A-Z]{3}[0-9]{4}$/;
		// Padrão Mercosul: ABC1D23
		const padrao2 = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

		return padrao1.test(placaLimpa) || padrao2.test(placaLimpa);
	}

	// Lista de filiais válidas
	private filiaisValidas = new Set([
		"01-URBANO MATRIZ",
		"01-BROTO LEGAL CAMPINAS",
		"21-FORMOSA",
		"14-PONTA GROSSA",
		"15-VARZEA GRANDE",
		"02-SAO GABRIEL",
		"03-MELEIRO",
		"03-BROTO LEGAL URUGUAIANA",
		"04-SINOP",
		"10-SALVADOR",
		"06-CABO DE STO AGO",
		"02-BROTO LEGAL PORTO FERREIRA",
		"08-BRASILIA",
		"12-GUARULHOS 2",
		"07-FORTALEZA",
		"11-GUARULHOS 1",
	]);

	// Lista de tipos de veículos válidos
	private tiposVeiculosValidos = new Set([
		"TRUCK",
		"3/4",
		"3/4.",
		"BI-TREM",
		"BI-TRUCK",
		"CARGA SEMI REBOQUE",
		"CAV MEC QUATRO EIXOS",
		"CARRETA BAU",
		"CARRETA CARGA BAIXA",
		"RODO TREM",
		"CARRETA GRANELEIRA",
		"CARRETA PRANCHA (CONTAINER)",
		"CARRETA SIDER",
		"CAV MEC LS",
		"AUTOMOVEL",
		"CAV MEC SIMPLES",
		"FIORINO",
		"HR",
		"REBOQUE",
		"SPRINTERF",
		"TOCO",
		"TRACAO CAMINHAO TRATOR / TRACAO CAMINHAO TRATOR",
		"VAN / FURGAO",
		"CAV MEC VANDERLEIA",
	]);

	// Validação de eixos por tipo de veículo (baseado nos tipos reais encontrados)
	private validarEixosPorTipoVeiculo(tipoVeiculo: string, qtEixos: number) {
		const tipo = tipoVeiculo.toUpperCase().trim();

		// Veículos leves
		if (
			tipo.includes("3/4") ||
			tipo === "3/4." ||
			tipo === "FIORINO" ||
			tipo === "HR" ||
			tipo === "VAN" ||
			tipo.includes("FURGAO") ||
			tipo === "AUTOMOVEL" ||
			tipo === "SPRINTERF"
		) {
			return {
				valido: qtEixos >= 2 && qtEixos <= 2,
				mensagem: qtEixos !== 2 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 2)` : "",
			};
		}

		// Caminhões (TRUCK, BI-TRUCK, TOCO)
		if (tipo === "TRUCK" || tipo === "BI-TRUCK" || tipo === "TOCO") {
			return {
				valido: qtEixos >= 2 && qtEixos <= 4,
				mensagem: qtEixos < 2 || qtEixos > 4 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 2-4)` : "",
			};
		}

		// Carretas e cavalos mecânicos
		if (tipo.includes("CARRETA") || tipo.includes("CAV MEC") || tipo === "REBOQUE") {
			if (tipo === "CAV MEC SIMPLES") {
				return {
					valido: qtEixos >= 3 && qtEixos <= 5,
					mensagem: qtEixos < 3 || qtEixos > 5 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 3-5)` : "",
				};
			}
			if (tipo === "CAV MEC QUATRO EIXOS") {
				return {
					valido: qtEixos === 4,
					mensagem: qtEixos !== 4 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 4)` : "",
				};
			}
			// Carretas gerais
			return {
				valido: qtEixos >= 3 && qtEixos <= 7,
				mensagem: qtEixos < 3 || qtEixos > 7 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 3-7)` : "",
			};
		}

		// Veículos pesados especiais
		if (tipo === "BI-TREM" || tipo === "RODO TREM") {
			return {
				valido: qtEixos >= 6 && qtEixos <= 9,
				mensagem: qtEixos < 6 || qtEixos > 9 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 6-9)` : "",
			};
		}

		// Semi-reboques e implementos
		if (tipo.includes("SEMI REBOQUE") || tipo.includes("CARGA SEMI")) {
			return {
				valido: qtEixos >= 4 && qtEixos <= 6,
				mensagem: qtEixos < 4 || qtEixos > 6 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 4-6)` : "",
			};
		}

		// Trações especiais
		if (tipo.includes("TRACAO CAMINHAO TRATOR")) {
			return {
				valido: qtEixos >= 3 && qtEixos <= 6,
				mensagem: qtEixos < 3 || qtEixos > 6 ? `Quantidade de eixos incompatível com ${tipo} (esperado: 3-6)` : "",
			};
		}

		// Tipo não reconhecido - aceitar qualquer quantidade mas alertar
		return {
			valido: true,
			mensagem: `Tipo de veículo '${tipo}' não reconhecido na base de validação`,
		};
	}

	// Análise individual de cada item para cálculo de frete mínimo ANTT
	private async analisarItem(item: OrcamentoItem): Promise<ConciliacaoResult> {
		const alertas: string[] = [];
		let status: "CONFORME" | "DIVERGENTE" | "ERRO_CALCULO" = "CONFORME";
		let freteMinimo: FreteMinANTT | null = null;

		// === VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS ===

		// Campos essenciais para cálculo do frete
		if (!item.cidadeOrigem || item.cidadeOrigem.trim() === "") {
			alertas.push("Cidade de origem não informada (necessária para cálculo)");
			status = "ERRO_CALCULO";
		}

		if (!item.cidadeDestino || item.cidadeDestino.trim() === "") {
			alertas.push("Cidade de destino não informada (necessária para cálculo)");
			status = "ERRO_CALCULO";
		}

		if (!item.tipoCarga || item.tipoCarga.trim() === "") {
			alertas.push("Tipo de carga não informado (necessário para cálculo ANTT)");
			status = "ERRO_CALCULO";
		}

		if (!item.tabelaFrete || item.tabelaFrete.trim() === "") {
			alertas.push("Tabela de frete não informada (A ou B - necessária para cálculo ANTT)");
			status = "ERRO_CALCULO";
		}

		if (!item.qtEixos || item.qtEixos <= 0) {
			alertas.push("Quantidade de eixos não informada ou inválida (necessária para cálculo ANTT)");
			status = "ERRO_CALCULO";
		}

		if (!item.valorFrete || item.valorFrete <= 0) {
			alertas.push("Valor do frete não informado ou inválido");
			status = "ERRO_CALCULO";
		}

		// Distância (será calculada se não informada)
		let distanciaKm = item.distanciaKm || 0;
		if (distanciaKm <= 0) {
			// Aqui poderia calcular a distância entre origem e destino
			// Por ora, vamos usar uma estimativa baseada na diferença de coordenadas
			alertas.push("Distância não informada - será necessário calcular automaticamente");
		}

		// === CÁLCULO DO FRETE MÍNIMO ANTT ===
		if (status !== "ERRO_CALCULO") {
			try {
				// Simular o cálculo do frete mínimo
				// Em um cenário real, aqui faria a chamada para a API
				const resultadoCalculo = await this.calcularFreteMinimo({
					tabela: item.tabelaFrete,
					tipoCarga: item.tipoCarga,
					eixos: item.qtEixos,
					distanciaKm: distanciaKm > 0 ? distanciaKm : 100, // Fallback para 100km se não informado
					retornoVazioKm: 0, // Pode ser configurável
					pedagioTotal: item.pedagioTotal || 0,
				});

				freteMinimo = {
					valor: resultadoCalculo.total,
					detalhamento: {
						pisoBase: resultadoCalculo.detalhamento.pisoBase,
						retornoVazio: resultadoCalculo.detalhamento.retornoVazioValor,
						pedagio: resultadoCalculo.detalhamento.pedagio_total,
						coeficientes: resultadoCalculo.coeficientes,
					},
					parametros: {
						tabela: item.tabelaFrete,
						tipoCarga: item.tipoCarga,
						eixos: item.qtEixos,
						distanciaKm: distanciaKm > 0 ? distanciaKm : 100,
					},
				};

				// === ANÁLISE DE CONFORMIDADE ===
				const valorCobrado = item.valorFrete;
				const valorMinimo = freteMinimo.valor;
				const diferençaValor = valorCobrado - valorMinimo;
				const diferençaPercentual = (diferençaValor / valorMinimo) * 100;

				if (valorCobrado < valorMinimo) {
					// Valor cobrado abaixo do mínimo da ANTT
					const percentualAbaixo = Math.abs(diferençaPercentual);
					if (percentualAbaixo > 5) {
						status = "DIVERGENTE";
						alertas.push(`Valor cobrado R$ ${valorCobrado.toFixed(2)} está ${percentualAbaixo.toFixed(1)}% abaixo do mínimo ANTT (R$ ${valorMinimo.toFixed(2)})`);
					} else {
						alertas.push(`Valor cobrado próximo ao mínimo ANTT (diferença: ${percentualAbaixo.toFixed(1)}%)`);
					}
				} else if (diferençaPercentual > 50) {
					// Valor muito acima do esperado - pode indicar erro
					alertas.push(`Valor cobrado R$ ${valorCobrado.toFixed(2)} está ${diferençaPercentual.toFixed(1)}% acima do mínimo ANTT - verificar se está correto`);
				}
			} catch (error) {
				status = "ERRO_CALCULO";
				alertas.push(`Erro ao calcular frete mínimo ANTT: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
			}
		}

		// === VALIDAÇÕES COMPLEMENTARES ===

		// Validação de filial
		if (item.filialNome && !this.filiaisValidas.has(item.filialNome.trim())) {
			alertas.push(`Filial '${item.filialNome}' não reconhecida no sistema`);
		}

		// Validação de placa
		if (item.placa && !this.validarPlaca(item.placa)) {
			alertas.push("Placa em formato inválido");
		}

		// Validação de tipo de veículo vs eixos
		if (item.tpVeiculo && item.qtEixos > 0) {
			const validacaoEixos = this.validarEixosPorTipoVeiculo(item.tpVeiculo, item.qtEixos);
			if (!validacaoEixos.valido && validacaoEixos.mensagem) {
				alertas.push(validacaoEixos.mensagem);
			}
		}

		const valorCobrado = item.valorFrete || 0;
		const valorMinimo = freteMinimo?.valor || 0;
		const diferençaValor = valorCobrado - valorMinimo;
		const diferençaPercentual = valorMinimo > 0 ? (diferençaValor / valorMinimo) * 100 : 0;

		return {
			item,
			status,
			alertas,
			freteMinimo,
			detalhes: {
				valorCobrado,
				valorMinimo,
				diferençaPercentual,
				diferençaValor,
				rotaCalculada: distanciaKm > 0,
				distanciaCalculada: distanciaKm,
				observacoes: alertas.length > 0 ? alertas : ["Cálculo realizado com sucesso"],
			},
		};
	}

	// Método para calcular frete mínimo (simulação da API)
	private async calcularFreteMinimo(params: { tabela: string; tipoCarga: string; eixos: number; distanciaKm: number; retornoVazioKm: number; pedagioTotal: number }) {
		// Simulação dos coeficientes - em produção, isso viria da API
		const coeficientes = this.getCoeficientesSimulados(params.tabela, params.tipoCarga, params.eixos);

		const pisoBase = params.distanciaKm * coeficientes.CCD + coeficientes.CC;
		const retornoVazioValor = params.retornoVazioKm > 0 ? 0.92 * coeficientes.CCD * params.retornoVazioKm : 0;
		const total = pisoBase + retornoVazioValor + params.pedagioTotal;

		return {
			total: Math.round(total * 100) / 100,
			coeficientes,
			detalhamento: {
				pisoBase: Math.round(pisoBase * 100) / 100,
				retornoVazioValor: Math.round(retornoVazioValor * 100) / 100,
				pedagio_total: Math.round(params.pedagioTotal * 100) / 100,
			},
		};
	}

	// Método auxiliar para obter coeficientes (simulação)
	private getCoeficientesSimulados(tabela: string, tipoCarga: string, eixos: number) {
		// Valores padrão para carga geral, tabela A
		const coeficientesDefault = {
			2: { CCD: 3.6735, CC: 417.95 },
			3: { CCD: 4.6502, CC: 509.43 },
			4: { CCD: 5.3306, CC: 559.08 },
			5: { CCD: 6.0112, CC: 610.08 },
			6: { CCD: 6.7301, CC: 660.12 },
			7: { CCD: 7.3085, CC: 752.64 },
			9: { CCD: 8.268, CC: 815.3 },
		};

		const coeficiente = coeficientesDefault[eixos as keyof typeof coeficientesDefault];
		return coeficiente || { CCD: 4.0, CC: 500.0 }; // Fallback
	}

	// Processamento otimizado com cálculo em massa via API
	public async processarDados(dados: OrcamentoItem[]): Promise<void> {
		const total = dados.length;
		const resultados: ConciliacaoResult[] = [];

		this.log("info", `Iniciando processamento de ${total} itens`, "WORKER_PROCESS", { totalItems: total });

		try {
			// === ETAPA 1: CÁLCULO EM MASSA VIA API ===
			self.postMessage({
				type: "PROGRESS_UPDATE",
				payload: {
					progress: 10,
					processed: 0,
					total,
					currentItem: "Enviando dados para cálculo em massa...",
				},
			});

			this.log("debug", "Preparando dados para API de cálculo em massa", "WORKER_API_PREP");

			// Preparar dados para API de cálculo em massa
			const itensParaAPI = dados.map((item) => ({
				lote: item.lote,
				placa: item.placa,
				cidadeOrigem: item.cidadeOrigem,
				cidadeDestino: item.cidadeDestino,
				valorFrete: item.valorFrete,
				tabelaFrete: item.tabelaFrete,
				tipoCarga: item.tipoCarga,
				qtEixos: item.qtEixos,
				distanciaKm: item.distanciaKm || 0,
				pedagioTotal: item.pedagioTotal || 0,
				retornoVazioKm: 0, // Pode ser configurável futuramente
			}));

			// Chamar API de cálculo em massa - OBRIGATÓRIO para conformidade ANTT
			let calculosAPI: any = null;

			this.log("info", "Iniciando chamada para API de cálculo ANTT", "WORKER_API_CALL", {
				itemsCount: itensParaAPI.length,
				endpoint: "http://localhost:3000/api/calcula-frete-massa",
			});

			try {
				const response = await fetch("http://localhost:3000/api/calcula-frete-massa", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ itens: itensParaAPI }),
				});

				this.log("debug", `API respondeu com status ${response.status}`, "WORKER_API_RESPONSE", {
					status: response.status,
					statusText: response.statusText,
				});

				if (!response.ok) {
					throw new Error(`API retornou erro ${response.status}: ${response.statusText}`);
				}

				calculosAPI = await response.json();

				if (!calculosAPI || !calculosAPI.resultados) {
					throw new Error("API retornou resposta inválida - sem resultados");
				}

				this.log("info", "API de cálculo ANTT respondeu com sucesso", "WORKER_API_SUCCESS", {
					totalResults: calculosAPI.resultados?.length || 0,
					sucessos: calculosAPI.resumo?.sucessos || 0,
					erros: calculosAPI.resumo?.erros || 0,
				});

				self.postMessage({
					type: "PROGRESS_UPDATE",
					payload: {
						progress: 40,
						processed: 0,
						total,
						currentItem: `API ANTT conectada: ${calculosAPI.resumo?.sucessos || 0} sucessos, ${calculosAPI.resumo?.erros || 0} erros`,
					},
				});
			} catch (error) {
				// API não disponível = ERRO CRÍTICO - não pode processar sem conformidade ANTT
				const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

				this.log(
					"critical",
					"Falha na comunicação com API ANTT",
					"WORKER_API_ERROR",
					{
						error: errorMessage,
						endpoint: "http://localhost:3000/api/calcula-frete-massa",
					},
					error instanceof Error ? error : undefined
				);

				// Interromper processamento completamente
				self.postMessage({
					type: "ERROR",
					payload: {
						message: `ERRO CRÍTICO: API ANTT indisponível. Não é possível processar sem conformidade total. Detalhes: ${errorMessage}`,
						critical: true,
						error: errorMessage,
					},
				});

				return; // Parar processamento completamente
			}

			// === ETAPA 2: PROCESSAMENTO E ANÁLISE ===
			// VALIDAÇÃO CRÍTICA: Todos os itens DEVEM ter resultado da API
			if (calculosAPI.resultados.length !== total) {
				const errorMsg = `ERRO DE CONFORMIDADE: API retornou ${calculosAPI.resultados.length} resultados para ${total} itens. Processamento interrompido.`;

				this.log("critical", errorMsg, "WORKER_VALIDATION", {
					expected: total,
					received: calculosAPI.resultados.length,
					difference: total - calculosAPI.resultados.length,
				});

				self.postMessage({
					type: "ERROR",
					payload: {
						message: errorMsg,
						critical: true,
					},
				});
				return;
			}

			this.log("info", "Iniciando análise individual dos itens", "WORKER_ANALYSIS", {
				totalItems: total,
				apiResultsCount: calculosAPI.resultados.length,
			});

			for (let i = 0; i < total; i++) {
				const item = dados[i];

				// OBRIGATÓRIO: Usar apenas resultado da API - SEM FALLBACKS
				const calculoAPI = calculosAPI.resultados[i];

				if (!calculoAPI) {
					// Se não há resultado da API para este item, marcar como erro
					const resultadoErro: ConciliacaoResult = {
						item,
						status: "ERRO_CALCULO",
						alertas: ["ERRO CRÍTICO: Sem resultado da API ANTT para este item"],
						freteMinimo: null,
						detalhes: {
							valorCobrado: item.valorFrete,
							valorMinimo: 0,
							diferençaPercentual: 0,
							diferençaValor: 0,
							observacoes: ["Item não processado pela API ANTT"],
						},
					};
					resultados.push(resultadoErro);
					continue;
				}

				// Processar item APENAS com dados da API
				const resultado = await this.analisarItemComCalculo(item, calculoAPI);
				resultados.push(resultado);

				// Enviar progresso
				const progresso = 40 + ((i + 1) / total) * 60; // De 40% a 100%
				self.postMessage({
					type: "PROGRESS_UPDATE",
					payload: {
						progress: progresso,
						processed: i + 1,
						total,
						currentItem: resultado,
					},
				});

				// Pequena pausa para manter responsividade
				if (i % 10 === 0) {
					await new Promise((resolve) => setTimeout(resolve, 1));
				}
			}

			// Enviar resultado final
			self.postMessage({
				type: "VALIDATION_COMPLETE",
				payload: resultados,
			});
		} catch (error) {
			self.postMessage({
				type: "ERROR",
				payload: {
					message: error instanceof Error ? error.message : "Erro no processamento",
					stack: error instanceof Error ? error.stack : undefined,
				},
			});
		}
	}

	// Análise de item com resultado da API (se disponível)
	private async analisarItemComCalculo(item: OrcamentoItem, calculoAPI: any): Promise<ConciliacaoResult> {
		const alertas: string[] = [];
		let status: "CONFORME" | "DIVERGENTE" | "ERRO_CALCULO" = "CONFORME";
		let freteMinimo: FreteMinANTT | null = null;

		// === USAR APENAS RESULTADO DA API - SEM FALLBACKS ===
		if (calculoAPI?.status === "sucesso" && calculoAPI?.freteMinimo) {
			const apiResult = calculoAPI.freteMinimo;
			freteMinimo = {
				valor: apiResult.total,
				detalhamento: {
					pisoBase: apiResult.detalhamento.pisoBase,
					retornoVazio: apiResult.detalhamento.retornoVazioValor,
					pedagio: apiResult.detalhamento.pedagio_total,
					coeficientes: apiResult.coeficientes,
				},
				parametros: {
					tabela: apiResult.input.tabela,
					tipoCarga: apiResult.input.tipoCarga,
					eixos: apiResult.input.eixos,
					distanciaKm: apiResult.input.distancia_km,
				},
			};
		} else {
			// SEM RESULTADO DA API = ERRO CRÍTICO
			status = "ERRO_CALCULO";
			alertas.push("ERRO CRÍTICO: Cálculo ANTT não disponível da API");

			if (calculoAPI?.erro) {
				alertas.push(`Erro da API: ${calculoAPI.erro}`);
			}
		}

		// === VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS ===
		if (!item.cidadeOrigem?.trim()) {
			alertas.push("Cidade de origem não informada");
			status = "ERRO_CALCULO";
		}

		if (!item.cidadeDestino?.trim()) {
			alertas.push("Cidade de destino não informada");
			status = "ERRO_CALCULO";
		}

		if (!item.valorFrete || item.valorFrete <= 0) {
			alertas.push("Valor do frete não informado ou inválido");
			status = "ERRO_CALCULO";
		}

		// === ANÁLISE DE CONFORMIDADE ===
		if (freteMinimo && status !== "ERRO_CALCULO") {
			const valorCobrado = item.valorFrete;
			const valorMinimo = freteMinimo.valor;
			const diferençaValor = valorCobrado - valorMinimo;
			const diferençaPercentual = (diferençaValor / valorMinimo) * 100;

			if (valorCobrado < valorMinimo) {
				const percentualAbaixo = Math.abs(diferençaPercentual);
				if (percentualAbaixo > 5) {
					status = "DIVERGENTE";
					alertas.push(`Valor R$ ${valorCobrado.toFixed(2)} está ${percentualAbaixo.toFixed(1)}% abaixo do mínimo ANTT (R$ ${valorMinimo.toFixed(2)})`);
				} else {
					alertas.push(`Valor próximo ao mínimo ANTT (diferença: ${percentualAbaixo.toFixed(1)}%)`);
				}
			} else if (diferençaPercentual > 100) {
				alertas.push(`Valor ${diferençaPercentual.toFixed(1)}% acima do mínimo - verificar se está correto`);
			}
		}

		// === VALIDAÇÕES COMPLEMENTARES ===
		if (item.filialNome && !this.filiaisValidas.has(item.filialNome.trim())) {
			alertas.push(`Filial '${item.filialNome}' não reconhecida`);
		}

		if (item.placa && !this.validarPlaca(item.placa)) {
			alertas.push("Placa em formato inválido");
		}

		const valorCobrado = item.valorFrete || 0;
		const valorMinimo = freteMinimo?.valor || 0;
		const diferençaValor = valorCobrado - valorMinimo;
		const diferençaPercentual = valorMinimo > 0 ? (diferençaValor / valorMinimo) * 100 : 0;

		return {
			item,
			status,
			alertas,
			freteMinimo,
			detalhes: {
				valorCobrado,
				valorMinimo,
				diferençaPercentual,
				diferençaValor,
				rotaCalculada: Boolean(item.distanciaKm),
				distanciaCalculada: item.distanciaKm || 0,
				observacoes: alertas.length > 0 ? alertas : ["Análise concluída com sucesso"],
			},
		};
	}
}

const worker = new ConciliacaoWorker();

// Handler de mensagens do worker
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
	try {
		const { type, payload } = event.data;

		switch (type) {
			case "PROCESS_DATA":
				await worker.processarDados(payload);
				break;
			default:
				console.warn("Tipo de mensagem não reconhecido:", type);
		}
	} catch (error) {
		self.postMessage({
			type: "ERROR",
			payload: {
				message: error instanceof Error ? error.message : "Erro desconhecido",
				stack: error instanceof Error ? error.stack : undefined,
			},
		});
	}
};

// Exportar tipos para uso no main thread
export type { ConciliacaoResult, OrcamentoItem };
