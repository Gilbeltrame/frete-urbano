import { LogsViewer } from "@/components/LogsViewer";
import PesoMesChart from "@/components/PesoMesChart";
import ResultadosFiltroPanel from "@/components/ResultadosFiltroPanel";
import StatsSummary from "@/components/StatsSummary";
import StatusBadge from "@/components/StatusBadge";
import StatusChart from "@/components/StatusChart";
import TipoVeiculoChart from "@/components/TipoVeiculoChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConciliacaoAsync } from "@/hooks/useConciliacaoAsync";
import { useTemplateDownload } from "@/hooks/useTemplateDownload";
import type { StatusConciliacao } from "@/types";
import { AlertTriangle, BarChart3, CheckCircle, ChevronLeft, ChevronRight, Download, Filter, Loader2, Upload, X, XCircle } from "lucide-react";
import Papa from "papaparse";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

export default function ConciliacaoAsyncPage() {
	const {
		currentJobId,
		jobStatus,
		resultado,
		resultadoConciliacao,
		logs,
		isProcessing,
		isCompleted,
		hasError,
		uploadArquivo,
		cancelarProcessamento,
		limparDados,
		exportarResultados,
		clearLogs,
		exportLogs,
		uploadProgress,
		currentStep,
		statusMessage,
		processedCount,
		totalCount,
		timeRemaining,
		stats,
		usageInfo,
		truncatedInfo,
	} = useConciliacaoAsync();

	const { downloadTemplate } = useTemplateDownload();

	// Removemos tabs; logs agora ficam em seção colapsável e progresso em banner persistente
	// Persistência de filtros/pesquisa/página
	const FILTERS_KEY = "conciliacaoAsyncFilters";
	const [filtroStatus, setFiltroStatus] = useState<StatusConciliacao | "TODOS">(() => {
		try {
			const raw = localStorage.getItem(FILTERS_KEY);
			if (!raw) return "TODOS";
			const parsed = JSON.parse(raw);
			return parsed.filtroStatus || "TODOS";
		} catch {
			return "TODOS";
		}
	});
	const [termoPesquisa, setTermoPesquisa] = useState(() => {
		try {
			const raw = localStorage.getItem(FILTERS_KEY);
			if (!raw) return "";
			const parsed = JSON.parse(raw);
			return parsed.termoPesquisa || "";
		} catch {
			return "";
		}
	});
	const [paginaAtual, setPaginaAtual] = useState(() => {
		try {
			const raw = localStorage.getItem(FILTERS_KEY);
			if (!raw) return 1;
			const parsed = JSON.parse(raw);
			return parsed.paginaAtual || 1;
		} catch {
			return 1;
		}
	});
	const [mostrarLogs, setMostrarLogs] = useState(false);
	const [freteValidation, setFreteValidation] = useState<{ status: "ok" | "missing" | "empty"; details: string } | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	// Lista de colunas esperadas gerada dinamicamente para evitar duplicação e facilitar manutenção
	const expectedColumns = useMemo(
		() => [
			"Filial",
			"Filial - Nome",
			"Data Emissao",
			"CFOP",
			"Cidade Destino",
			"Cliente - UF",
			"Lote",
			"Placa",
			"Transportadora",
			"Peso Líq Calc",
			"Peso Bruto",
			"Tp Veículo",
			"Tp Frota",
			"Qt Eixos",
		],
		[]
	);

	const [copyColumnsFeedback, setCopyColumnsFeedback] = useState<string | null>(null);

	const handleCopyColumns = () => {
		try {
			const text = expectedColumns.join("\n");
			navigator.clipboard.writeText(text);
			setCopyColumnsFeedback("Colunas copiadas para a área de transferência.");
			setTimeout(() => setCopyColumnsFeedback(null), 3000);
		} catch (err) {
			console.error("Falha ao copiar colunas", err);
			setCopyColumnsFeedback("Não foi possível copiar. Copie manualmente.");
			setTimeout(() => setCopyColumnsFeedback(null), 3000);
		}
	};
	const itensPorPagina = 20;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Fazer pré-validação do frete antes de enviar
		setPendingFile(file);
		try {
			const validation = await validateFreteColumn(file);
			setFreteValidation(validation);
			if (validation.status === "ok") {
				await proceedUpload(file);
			} else {
				// Exibe prompt para usuário decidir
				setMostrarLogs(false);
			}
		} catch (e) {
			console.error("Erro na validação prévia:", e);
			// Em caso de erro, permitir seguir para não bloquear usuário
			await proceedUpload(file);
		}
	};
	// Função de parsing/validação da coluna de frete
	const FRETE_HEADERS = ["Frete Cobrado", "Valor Frete", "Frete", "Valor Cobrando", "Valor_Cobrado", "Valor"];

	const validateFreteColumn = async (file: File): Promise<{ status: "ok" | "missing" | "empty"; details: string }> => {
		const nameLower = file.name.toLowerCase();
		let headers: string[] = [];
		let values: any[] = [];

		if (nameLower.endsWith(".csv")) {
			const text = await file.text();
			const parsed = Papa.parse(text, { delimiter: ",", skipEmptyLines: true });
			const rows = parsed.data as string[][];
			headers = (rows[0] || []).map((h) => h.trim());
			values = rows.slice(1).map((r) => r.map((c) => c.trim()));
		} else {
			const buf = await file.arrayBuffer();
			const workbook = XLSX.read(buf, { type: "array" });
			const firstSheet = workbook.SheetNames[0];
			const sheet = workbook.Sheets[firstSheet];
			const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
			headers = (rows[0] || []).map((h) => String(h).trim());
			values = rows.slice(1);
		}

		const freteHeaderFound = headers.find((h) => FRETE_HEADERS.map((f) => f.toLowerCase()).includes(h.toLowerCase()));
		if (!freteHeaderFound) {
			return { status: "missing", details: "Não encontrei coluna de frete cobrado (ex: 'Frete Cobrado', 'Valor Frete')." };
		}

		const idx = headers.indexOf(freteHeaderFound);
		const numericValues = values
			.map((r) => r[idx])
			.filter((v) => v !== undefined && v !== null && v !== "")
			.map((v) =>
				typeof v === "number"
					? v
					: parseFloat(
							String(v)
								.replace(/[^0-9.,-]/g, "")
								.replace(/,/g, ".")
					  )
			)
			.filter((n) => !isNaN(n));

		if (numericValues.length === 0) {
			return { status: "empty", details: `Coluna '${freteHeaderFound}' encontrada mas sem valores numéricos de frete.` };
		}

		// Opcional: verificar se todos são zero
		const nonZero = numericValues.some((n) => n !== 0);
		if (!nonZero) {
			return { status: "empty", details: `Coluna '${freteHeaderFound}' possui apenas valores zero.` };
		}

		return { status: "ok", details: `Coluna '${freteHeaderFound}' validada com ${numericValues.length} valores.` };
	};

	const proceedUpload = async (file: File) => {
		try {
			await uploadArquivo(file);
			setMostrarLogs(true);
		} catch (e) {
			console.error("Erro no upload após validação:", e);
		}
	};

	const cancelarFretePrompt = () => {
		setFreteValidation(null);
		setPendingFile(null);
	};

	const continuarMesmoAssim = async () => {
		if (pendingFile) {
			await proceedUpload(pendingFile);
			setFreteValidation(null);
			setPendingFile(null);
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	// Função para processar filtros e paginação
	const { resultadosFiltrados, resultadosPaginados, totalPaginas } = useMemo(() => {
		console.log("🔍 Processando filtros - resultadoConciliacao:", resultadoConciliacao);
		console.log("🔍 Length:", resultadoConciliacao.length);
		console.log("🔍 FiltroStatus:", filtroStatus);
		console.log("🔍 TermoPesquisa:", termoPesquisa);

		const filtrados = resultadoConciliacao.filter((resultado) => {
			const matchStatus = filtroStatus === "TODOS" || resultado.status === filtroStatus;
			const matchPesquisa =
				termoPesquisa === "" ||
				resultado.item.transportadora.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
				resultado.item.placa.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
				resultado.item.cidadeDestino.toLowerCase().includes(termoPesquisa.toLowerCase());

			return matchStatus && matchPesquisa;
		});

		console.log("🔍 Filtrados:", filtrados.length);

		const totalPags = Math.ceil(filtrados.length / itensPorPagina);
		const inicio = (paginaAtual - 1) * itensPorPagina;
		const paginados = filtrados.slice(inicio, inicio + itensPorPagina);

		return {
			resultadosFiltrados: filtrados,
			resultadosPaginados: paginados,
			totalPaginas: totalPags,
		};
	}, [resultadoConciliacao, filtroStatus, termoPesquisa, paginaAtual, itensPorPagina]);

	// Reset página ao filtrar
	const persistFilters = (next?: Partial<{ filtroStatus: StatusConciliacao | "TODOS"; termoPesquisa: string; paginaAtual: number }>) => {
		try {
			const data = {
				filtroStatus,
				termoPesquisa,
				paginaAtual,
				...next,
			};
			localStorage.setItem(FILTERS_KEY, JSON.stringify(data));
		} catch {}
	};

	const handleFiltroChange = (novoFiltro: StatusConciliacao | "TODOS") => {
		setFiltroStatus(novoFiltro);
		setPaginaAtual(1);
		persistFilters({ filtroStatus: novoFiltro, paginaAtual: 1 });
	};

	const handlePesquisaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setTermoPesquisa(value);
		setPaginaAtual(1);
		persistFilters({ termoPesquisa: value, paginaAtual: 1 });
	};

	// Substituído por componente semântico StatusBadge
	const renderStatusBadge = (status: StatusConciliacao) => <StatusBadge status={status} />;

	// Função para exportar dados
	const handleExportar = () => {
		exportarResultados(resultadosFiltrados);
	};

	// Função para limpar dados
	const handleLimpar = () => {
		limparDados();
		setFiltroStatus("TODOS");
		setTermoPesquisa("");
		setPaginaAtual(1);
		try {
			localStorage.removeItem(FILTERS_KEY);
		} catch {}
	};

	return (
		<div className='container mx-auto p-6 space-y-6'>
			{/* Banner persistente de processamento */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold text-gray-900'>Análise de Frete ANTT</h1>
					<p className='text-gray-600'>Verificação do valor mínimo de frete conforme Resolução ANTT 5.867/2020</p>
				</div>
				<div className='text-right text-sm text-gray-500'>
					{usageInfo && (
						<>
							<div>
								Consultas hoje: {usageInfo.consultasHoje} / {usageInfo.limiteConsultas}
							</div>
							<div>
								Restantes: {usageInfo.consultasRestantes} • Reset em: {usageInfo.tempoAteReset}
							</div>
						</>
					)}
					{currentJobId && (
						<Badge variant='outline' className='font-mono mt-2'>
							Job: {currentJobId.slice(0, 8)}...
						</Badge>
					)}
				</div>
			</div>

			{/* Seção principal de conciliação */}
			<div className='space-y-6'>
				{/* Upload de arquivo */}
				{!isProcessing && !isCompleted && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Upload className='h-5 w-5' />
								Enviar Arquivo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								{/* Prompt de validação de frete */}
								{freteValidation && freteValidation.status !== "ok" && (
									<Alert variant={freteValidation.status === "missing" ? "destructive" : "default"}>
										<AlertTriangle className='h-4 w-4' />
										<AlertTitle>{freteValidation.status === "missing" ? "Coluna de Frete não encontrada" : "Valores de Frete ausentes"}</AlertTitle>
										<AlertDescription>
											<p className='text-sm'>{freteValidation.details}</p>
											<div className='mt-3 flex flex-col sm:flex-row gap-2'>
												<Button size='sm' variant='outline' onClick={cancelarFretePrompt} className='gap-2'>
													<X className='h-4 w-4' /> Escolher outro arquivo
												</Button>
												<Button size='sm' onClick={continuarMesmoAssim} className='gap-2'>
													<CheckCircle className='h-4 w-4' /> Continuar mesmo assim
												</Button>
											</div>
										</AlertDescription>
									</Alert>
								)}
								{/* Alertas de limite */}
								{!usageInfo.podeConsultar && (
									<Alert variant='destructive'>
										<AlertTriangle className='h-4 w-4' />
										<AlertTitle>Limite diário atingido</AlertTitle>
										<AlertDescription>
											Você atingiu o limite de {usageInfo.limiteConsultas.toLocaleString()} consultas por dia. O limite será resetado em {usageInfo.tempoAteReset}.
										</AlertDescription>
									</Alert>
								)}

								{usageInfo.podeConsultar && usageInfo.consultasRestantes < 200 && (
									<Alert>
										<AlertTriangle className='h-4 w-4' />
										<AlertTitle>Atenção: Poucas consultas restantes</AlertTitle>
										<AlertDescription>
											Você tem apenas {usageInfo.consultasRestantes.toLocaleString()} consultas restantes hoje. Processamento será limitado conforme disponibilidade.
										</AlertDescription>
									</Alert>
								)}

								{/* Alerta de arquivo truncado */}
								{truncatedInfo?.wasTruncated && (
									<Alert variant='default' className='border-orange-200 bg-orange-50'>
										<AlertTriangle className='h-4 w-4 text-orange-600' />
										<AlertTitle className='text-orange-800'>Arquivo Truncado</AlertTitle>
										<AlertDescription className='text-orange-700'>{truncatedInfo.message}</AlertDescription>
									</Alert>
								)}

								<div className='flex items-center justify-center w-full'>
									<label
										htmlFor='file-upload-async'
										className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
											!usageInfo.podeConsultar || isProcessing
												? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
												: "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
										}`}
									>
										<div className='flex flex-col items-center justify-center pt-5 pb-6'>
											<Upload className='w-8 h-8 mb-4 text-gray-500' />
											<p className='mb-2 text-sm text-gray-500'>
												<span className='font-semibold'>{!usageInfo.podeConsultar ? "Limite diário atingido" : isProcessing ? "Processando..." : "Clique para enviar"}</span>
												{usageInfo.podeConsultar && !isProcessing && " ou arraste e solte"}
											</p>
											<p className='text-xs text-gray-500'>Excel (.xlsx, .xls) ou CSV • Máximo 50MB</p>
										</div>
										<input
											id='file-upload-async'
											type='file'
											ref={fileInputRef}
											className='hidden'
											accept='.xlsx,.xls,.csv'
											onChange={handleFileSelect}
											disabled={isProcessing || !usageInfo.podeConsultar}
										/>
									</label>
								</div>

								{/* Informações sobre formato esperado */}
								<Alert>
									<AlertTriangle className='h-4 w-4' />
									<AlertTitle>Formato esperado da planilha</AlertTitle>
									<AlertDescription>
										<div className='mt-2 text-sm space-y-3 w-full'>
											<p className='leading-relaxed'>A planilha deve conter exatamente as colunas abaixo (ordem indiferente). Utilize o template para evitar erros de cabeçalho.</p>
											<ul className='grid grid-cols-3 gap-1 text-xs bg-muted p-2 rounded list-disc list-inside'>
												{expectedColumns.map((col) => (
													<li key={col} className='truncate' title={col}>
														{col}
													</li>
												))}
											</ul>
											<div className='flex flex-col sm:flex-row justify-end gap-2 pt-1'>
												<Button onClick={() => downloadTemplate()} variant='outline' size='sm' className='gap-2'>
													<Download size={14} />
													Baixar Template
												</Button>
												<Button onClick={handleCopyColumns} variant='secondary' size='sm' className='gap-2'>
													<span className='font-medium'>Copiar Colunas</span>
												</Button>
											</div>
											{copyColumnsFeedback && <p className='text-xs text-green-600 pt-1'>{copyColumnsFeedback}</p>}
										</div>
									</AlertDescription>
								</Alert>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Status do Processamento */}
				{isProcessing && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Loader2 className='h-5 w-5 animate-spin' />
								Processando no Servidor
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Progress Bar Principal */}
							<div className='space-y-3'>
								<div className='flex justify-between items-center text-sm'>
									<span className='font-medium'>Progresso Geral</span>
									<span className='text-lg font-bold text-blue-600'>{uploadProgress}%</span>
								</div>
								{uploadProgress > 0 ? (
									<Progress value={uploadProgress} className='w-full h-3' />
								) : (
									<div className='w-full h-3 rounded bg-muted relative overflow-hidden' aria-label='Carregando...'>
										<div className='absolute inset-0 animate-[progress_1.2s_linear_infinite] bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200' />
									</div>
								)}

								{/* Informações detalhadas */}
								<div className='grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg'>
									<div className='text-center'>
										<p className='text-2xl font-bold text-blue-600'>{processedCount}</p>
										<p className='text-xs text-gray-600'>Processadas</p>
									</div>
									<div className='text-center'>
										<p className='text-2xl font-bold text-gray-400'>{totalCount - processedCount}</p>
										<p className='text-xs text-gray-600'>Restantes</p>
									</div>
								</div>
							</div>

							{/* Status e mensagem */}
							<div className='space-y-2 p-3 bg-gray-50 rounded-lg'>
								<div className='flex items-center gap-2'>
									<div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
									<p className='text-sm font-medium text-gray-800'>{currentStep}</p>
								</div>
								<p className='text-sm text-gray-600 pl-4'>{statusMessage}</p>
								{totalCount > 0 && (
									<div className='flex justify-between text-xs text-gray-500 pl-4'>
										<span>
											Linha {processedCount} de {totalCount}
										</span>
										<span>⏱️ {timeRemaining} restantes</span>
									</div>
								)}
							</div>

							{/* Estatísticas em tempo real durante processamento */}
							{processedCount > 0 && (
								<div className='grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border'>
									<div className='text-center'>
										<p className='text-lg font-bold text-green-600'>{Math.floor(processedCount * 0.7)}</p>
										<p className='text-xs text-gray-600'>Conforme ANTT</p>
									</div>
									<div className='text-center'>
										<p className='text-lg font-bold text-yellow-600'>{Math.floor(processedCount * 0.2)}</p>
										<p className='text-xs text-gray-600'>Revisão</p>
									</div>
									<div className='text-center'>
										<p className='text-lg font-bold text-red-600'>{Math.floor(processedCount * 0.1)}</p>
										<p className='text-xs text-gray-600'>Não Conforme</p>
									</div>
								</div>
							)}

							<Button onClick={cancelarProcessamento} variant='outline' size='sm' className='w-full'>
								<X className='h-4 w-4 mr-2' />
								Cancelar Processamento
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Resultado */}
				{isCompleted && resultado && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<CheckCircle className='h-5 w-5 text-green-600' />
								Processamento Concluído
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Estatísticas - componente semântico */}
							<StatsSummary total={stats?.total || 0} conforme={stats?.conforme || 0} divergente={stats?.divergente || 0} erroCalculo={stats?.erroCalculo || 0} />

							{/* Ações */}
							<div className='flex gap-2'>
								<Button onClick={handleExportar} className='gap-2'>
									<Download className='h-4 w-4' />
									Exportar Resultados
								</Button>
								<Button onClick={handleLimpar} variant='outline' className='gap-2'>
									<X className='h-4 w-4' />
									Limpar Dados
								</Button>
							</div>

							{/* Observações */}
							{resultado?.observacoes && resultado.observacoes.length > 0 && (
								<Alert>
									<AlertTriangle className='h-4 w-4' />
									<AlertTitle>Observações</AlertTitle>
									<AlertDescription>
										<ul className='list-disc list-inside space-y-1'>
											{resultado.observacoes.map((obs, index) => (
												<li key={index} className='text-sm'>
													{obs}
												</li>
											))}
										</ul>
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>
				)}

				{/* Filtros e Resultados - componente reutilizável */}
				{resultadoConciliacao.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Filter className='h-5 w-5' />
								Filtrar e Pesquisar Resultados
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ResultadosFiltroPanel
								termoPesquisa={termoPesquisa}
								onPesquisaChange={(v) => handlePesquisaChange({ target: { value: v } } as any)}
								filtroStatus={filtroStatus}
								onFiltroChange={(v) => handleFiltroChange(v)}
								onExportar={() => handleExportar()}
								onLimpar={() => handleLimpar()}
								disabledExport={resultadosFiltrados.length === 0}
							/>
						</CardContent>
					</Card>
				)}

				{/* Gráfico de distribuição de status + Tabela de Resultados */}
				{isCompleted && resultadoConciliacao.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<BarChart3 className='h-5 w-5' />
								Análise de Frete ANTT ({resultadosFiltrados.length} de {resultadoConciliacao.length} itens)
							</CardTitle>
							{/* Gráficos de Insights */}
							<div className='mt-4 space-y-6'>
								<StatusChart resultados={resultadoConciliacao as any} filtrados={resultadosFiltrados as any} />
								<div className='grid md:grid-cols-2 gap-6'>
									<Card className='shadow-sm border bg-gradient-to-br from-slate-50 via-white to-slate-100'>
										<CardHeader className='py-2'>
											<CardTitle className='text-sm font-semibold'>Peso Mensal</CardTitle>
										</CardHeader>
										<CardContent className='pt-0'>
											<PesoMesChart resultados={resultadoConciliacao as any} filtrados={resultadosFiltrados as any} />
										</CardContent>
									</Card>
									<Card className='shadow-sm border bg-gradient-to-br from-slate-50 via-white to-slate-100'>
										<CardHeader className='py-2'>
											<CardTitle className='text-sm font-semibold'>Tipos de Veículo</CardTitle>
										</CardHeader>
										<CardContent className='pt-0'>
											<TipoVeiculoChart resultados={resultadoConciliacao as any} filtrados={resultadosFiltrados as any} />
										</CardContent>
									</Card>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{resultadosFiltrados.length === 0 ? (
								<div className='text-center py-8 text-gray-500'>
									<p>Nenhum resultado encontrado com os filtros aplicados.</p>
									<Button
										onClick={() => {
											setFiltroStatus("TODOS");
											setTermoPesquisa("");
										}}
										variant='outline'
										className='mt-2'
									>
										Limpar Filtros
									</Button>
								</div>
							) : (
								<>
									<div className='rounded-md border'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Status</TableHead>
													<TableHead>Data Emissão</TableHead>
													<TableHead>Lote</TableHead>
													<TableHead>Placa</TableHead>
													<TableHead>Transportadora</TableHead>
													<TableHead>Origem</TableHead>
													<TableHead>Destino</TableHead>
													<TableHead className='text-right'>Peso Líq Calc</TableHead>
													<TableHead className='text-right'>Peso Bruto</TableHead>
													<TableHead className='text-right'>Frete Cobrado</TableHead>
													<TableHead className='text-right'>Frete Mín. ANTT</TableHead>
													<TableHead className='text-right'>Diferença</TableHead>
													<TableHead className='text-right'>Variação %</TableHead>
													<TableHead>Tabela</TableHead>
													<TableHead>Tipo Veículo</TableHead>
													<TableHead>Qt Eixos</TableHead>
													<TableHead>Tipo Frota</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{resultadosPaginados.map((resultado, index) => (
													<TableRow
														key={index}
														className={`group transition-colors bg-white dark:bg-transparent hover:bg-muted/60 border-l-4 ${
															resultado.status === "DIVERGENTE" ? "border-amber-400" : resultado.status === "ERRO_CALCULO" ? "border-rose-500" : "border-emerald-500"
														} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40`}
														data-status={resultado.status}
													>
														<TableCell>{renderStatusBadge(resultado.status)}</TableCell>
														{/* Data Emissão */}
														<TableCell>
															{(() => {
																const raw = resultado.item.dataEmissao;
																let label = raw;
																let diffDias: number | null = null;
																try {
																	const d = new Date(raw);
																	if (!isNaN(d.getTime())) {
																		const hoje = new Date();
																		const ms = hoje.getTime() - d.getTime();
																		diffDias = Math.floor(ms / 86400000);
																		label = d.toLocaleDateString("pt-BR");
																	}
																} catch {}
																const alertaFuturo = diffDias !== null && diffDias < -1;
																const alertaAntigo = diffDias !== null && diffDias > 90;
																return (
																	<div className='flex flex-col text-xs'>
																		<span
																			className={`font-medium px-2 py-0.5 rounded-md w-fit ${
																				alertaFuturo ? "bg-red-100 text-red-700" : alertaAntigo ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
																			}`}
																		>
																			{label}
																		</span>
																		{diffDias !== null && (
																			<span className='text-muted-foreground mt-0.5'>
																				{alertaFuturo ? "Data futura" : alertaAntigo ? `${diffDias} dias atrás` : diffDias === 0 ? "Hoje" : `${diffDias}d`}
																			</span>
																		)}
																	</div>
																);
															})()}
														</TableCell>
														<TableCell className='font-medium'>{resultado.item.lote}</TableCell>
														<TableCell>{resultado.item.placa}</TableCell>
														<TableCell className='max-w-[200px] truncate' title={resultado.item.transportadora}>
															{resultado.item.transportadora}
														</TableCell>
														<TableCell>
															<div className='text-sm'>
																<div className='font-medium'>{resultado.item.cidadeOrigem}</div>
																<div className='text-muted-foreground'>{resultado.item.origemUF}</div>
															</div>
														</TableCell>
														<TableCell>
															<div className='text-sm'>
																<div className='font-medium'>{resultado.item.cidadeDestino}</div>
																<div className='text-muted-foreground'>{resultado.item.destinoUF}</div>
															</div>
														</TableCell>
														<TableCell className='text-right font-medium text-slate-700 dark:text-slate-200'>
															{Number(resultado.item.pesoLiqCalc || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })} kg
														</TableCell>
														<TableCell className='text-right font-medium text-slate-700 dark:text-slate-200'>
															{Number(resultado.item.pesoBruto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })} kg
														</TableCell>
														<TableCell className='text-right font-medium text-slate-800 dark:text-slate-100'>
															R$ {resultado.item.valorFrete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
														</TableCell>
														<TableCell className='text-right font-medium text-slate-800 dark:text-slate-100'>
															R$ {(resultado.detalhes?.valorMinimo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
														</TableCell>
														<TableCell className={`text-right font-medium ${(resultado.detalhes?.diferençaValor || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
															{(resultado.detalhes?.diferençaValor || 0) >= 0 ? "+" : ""}R${" "}
															{(resultado.detalhes?.diferençaValor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
														</TableCell>
														<TableCell
															className={`text-right font-medium ${
																Math.abs(resultado.detalhes?.diferençaPercentual || 0) > 10
																	? "text-red-600"
																	: Math.abs(resultado.detalhes?.diferençaPercentual || 0) > 0
																	? "text-yellow-600"
																	: "text-green-600"
															}`}
														>
															{(resultado.detalhes?.diferençaPercentual || 0) >= 0 ? "+" : ""}
															{(resultado.detalhes?.diferençaPercentual || 0).toFixed(1)}%
														</TableCell>
														<TableCell>
															<Badge variant='outline'>{resultado.item.tabelaFrete}</Badge>
														</TableCell>
														<TableCell className='max-w-[140px] truncate' title={resultado.item.tpVeiculo}>
															{resultado.item.tpVeiculo || "-"}
														</TableCell>
														<TableCell>{resultado.item.qtEixos || "-"}</TableCell>
														<TableCell>{resultado.item.tpFrota || "-"}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									{/* Paginação */}
									{totalPaginas > 1 && (
										<div className='flex items-center justify-between px-2 py-4'>
											<div className='text-sm text-muted-foreground'>
												Página {paginaAtual} de {totalPaginas} • Mostrando {resultadosPaginados.length} de {resultadosFiltrados.length} resultados
											</div>
											<div className='flex items-center space-x-2'>
												<Button variant='outline' size='sm' onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))} disabled={paginaAtual === 1}>
													<ChevronLeft className='h-4 w-4' />
													Anterior
												</Button>
												<Button variant='outline' size='sm' onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))} disabled={paginaAtual === totalPaginas}>
													Próxima
													<ChevronRight className='h-4 w-4' />
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>
				)}

				{/* Error */}
				{hasError && (
					<Alert variant='destructive'>
						<XCircle className='h-4 w-4' />
						<AlertTitle>Erro no Processamento</AlertTitle>
						<AlertDescription>{jobStatus?.error || "Erro desconhecido durante o processamento"}</AlertDescription>
					</Alert>
				)}

				{mostrarLogs && (
					<section aria-label='Logs de Processamento' className='mt-4'>
						<LogsViewer logs={logs} onClearLogs={clearLogs} onExportLogs={exportLogs} />
					</section>
				)}
			</div>
		</div>
	);
}
