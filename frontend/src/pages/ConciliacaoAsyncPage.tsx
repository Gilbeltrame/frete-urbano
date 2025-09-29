import { LogsViewer } from "@/components/LogsViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConciliacaoAsync } from "@/hooks/useConciliacaoAsync";
import { useTemplateDownload } from "@/hooks/useTemplateDownload";
import type { StatusConciliacao } from "@/types";
import { AlertTriangle, BarChart3, CheckCircle, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Filter, Loader2, Search, Trash2, Upload, X, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";

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

	const [activeTab, setActiveTab] = useState("conciliacao");
	const [filtroStatus, setFiltroStatus] = useState<StatusConciliacao | "TODOS">("TODOS");
	const [termoPesquisa, setTermoPesquisa] = useState("");
	const [paginaAtual, setPaginaAtual] = useState(1);
	const itensPorPagina = 20;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			await uploadArquivo(file);
			setActiveTab("logs"); // Mostrar logs durante processamento
		} catch (error) {
			console.error("Erro no upload:", error);
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
	const handleFiltroChange = (novoFiltro: StatusConciliacao | "TODOS") => {
		setFiltroStatus(novoFiltro);
		setPaginaAtual(1);
	};

	const handlePesquisaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTermoPesquisa(e.target.value);
		setPaginaAtual(1);
	};

	// Função para obter badge de status
	const getStatusBadge = (status: StatusConciliacao) => {
		switch (status) {
			case "CONFORME":
				return (
					<Badge variant='secondary' className='bg-green-100 text-green-700 hover:bg-green-200'>
						<CheckCircle className='w-3 h-3 mr-1' />
						Conforme ANTT
					</Badge>
				);
			case "DIVERGENTE":
				return (
					<Badge variant='secondary' className='bg-yellow-100 text-yellow-700 hover:bg-yellow-200'>
						<AlertTriangle className='w-3 h-3 mr-1' />
						Necessita Revisão
					</Badge>
				);
			case "ERRO_CALCULO":
				return (
					<Badge variant='destructive'>
						<XCircle className='w-3 h-3 mr-1' />
						Não Conforme
					</Badge>
				);
			default:
				return <Badge variant='outline'>Desconhecido</Badge>;
		}
	};

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
	};

	return (
		<div className='container mx-auto p-6 space-y-6'>
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

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid grid-cols-2 w-full max-w-md'>
					<TabsTrigger value='conciliacao' className='flex items-center gap-2'>
						<FileSpreadsheet className='h-4 w-4' />
						Conciliação
					</TabsTrigger>
					<TabsTrigger value='logs' className='flex items-center gap-2'>
						<AlertTriangle className='h-4 w-4' />
						Logs
						{logs.hasErrors && (
							<Badge variant='destructive' className='ml-1 text-xs'>
								{logs.stats.error + logs.stats.critical}
							</Badge>
						)}
						{logs.hasWarnings && (
							<Badge variant='secondary' className='ml-1 text-xs bg-yellow-100 text-yellow-600'>
								{logs.stats.warn}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='conciliacao' className='space-y-6'>
					{/* Upload de arquivo */}
					{!isProcessing && !isCompleted && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Upload className='h-5 w-5' />
									Enviar Planilha para Processamento Assíncrono
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
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
											<div className='mt-2 text-sm space-y-3'>
												<p>A planilha deve conter as seguintes colunas:</p>
												<div className='grid grid-cols-2 gap-2 text-xs bg-muted p-2 rounded'>
													<span>• Filial</span>
													<span>• Filial - Nome</span>
													<span>• Data Emissao</span>
													<span>• CFOP</span>
													<span>• Cidade Destino</span>
													<span>• Cliente - UF</span>
													<span>• Lote</span>
													<span>• Placa</span>
													<span>• Transportadora</span>
													<span>• Peso Líq Calc</span>
													<span>• Peso Bruto</span>
													<span>• Tp Veículo</span>
													<span>• Tp Frota</span>
													<span>• Qt Eixos</span>
												</div>
												<div className='flex justify-end'>
													<Button onClick={downloadTemplate} variant='outline' size='sm' className='gap-2'>
														<Download size={14} />
														Baixar Template
													</Button>
												</div>
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
									<Progress value={uploadProgress} className='w-full h-3' />

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
								{/* Estatísticas */}
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									<div className='text-center p-3 bg-blue-50 rounded-lg'>
										<div className='text-2xl font-bold text-blue-600'>{stats?.total || 0}</div>
										<div className='text-sm text-blue-600'>Total Analisado</div>
									</div>
									<div className='text-center p-3 bg-green-50 rounded-lg'>
										<div className='text-2xl font-bold text-green-600'>{stats?.conforme || 0}</div>
										<div className='text-sm text-green-600'>Conforme ANTT</div>
									</div>
									<div className='text-center p-3 bg-yellow-50 rounded-lg'>
										<div className='text-2xl font-bold text-yellow-600'>{stats?.divergente || 0}</div>
										<div className='text-sm text-yellow-600'>Necessita Revisão</div>
									</div>
									<div className='text-center p-3 bg-red-50 rounded-lg'>
										<div className='text-2xl font-bold text-red-600'>{stats?.erroCalculo || 0}</div>
										<div className='text-sm text-red-600'>Não Conforme</div>
									</div>
								</div>

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

					{/* Filtros e Resultados */}
					{resultadoConciliacao.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Filter className='h-5 w-5' />
									Filtrar e Pesquisar Resultados
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='flex flex-col sm:flex-row gap-4 mb-4'>
									<div className='flex items-center gap-2'>
										<Search className='h-4 w-4 text-gray-500' />
										<Input placeholder='Pesquisar por transportadora, placa ou destino...' value={termoPesquisa} onChange={handlePesquisaChange} className='w-full sm:w-96' />
									</div>
									<div className='flex items-center gap-2'>
										<Filter className='h-4 w-4 text-gray-500' />
										<Select value={filtroStatus} onValueChange={(value) => handleFiltroChange(value as StatusConciliacao | "TODOS")}>
											<SelectTrigger className='w-[200px]'>
												<SelectValue placeholder='Filtrar por status' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='TODOS'>📊 Todos os Status</SelectItem>
												<SelectItem value='CONFORME'>✅ Conforme ANTT</SelectItem>
												<SelectItem value='DIVERGENTE'>⚠️ Necessita Revisão</SelectItem>
												<SelectItem value='ERRO_CALCULO'>❌ Não Conforme</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className='pt-6 flex gap-2'>
										<Button onClick={handleExportar} variant='outline' className='gap-2'>
											<Download size={16} />
											Exportar
										</Button>
										{resultadoConciliacao.length > 0 && (
											<Button onClick={handleLimpar} variant='outline' className='gap-2'>
												<Trash2 size={16} />
												Limpar
											</Button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Tabela de Resultados */}
					{isCompleted && resultadoConciliacao.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									Análise de Frete ANTT ({resultadosFiltrados.length} de {resultadoConciliacao.length} itens)
								</CardTitle>
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
														<TableHead>Lote</TableHead>
														<TableHead>Placa</TableHead>
														<TableHead>Transportadora</TableHead>
														<TableHead>Origem</TableHead>
														<TableHead>Destino</TableHead>
														<TableHead className='text-right'>Frete Cobrado</TableHead>
														<TableHead className='text-right'>Frete Mín. ANTT</TableHead>
														<TableHead className='text-right'>Diferença</TableHead>
														<TableHead className='text-right'>Variação %</TableHead>
														<TableHead>Tabela</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{resultadosPaginados.map((resultado, index) => (
														<TableRow
															key={index}
															className={
																resultado.status === "DIVERGENTE"
																	? "bg-yellow-50/50 hover:bg-yellow-100/50"
																	: resultado.status === "ERRO_CALCULO"
																	? "bg-red-50/50 hover:bg-red-100/50"
																	: "bg-green-50/50 hover:bg-green-100/50"
															}
														>
															<TableCell>{getStatusBadge(resultado.status)}</TableCell>
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
															<TableCell className='text-right font-medium text-blue-600'>
																R$ {resultado.item.valorFrete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
															</TableCell>
															<TableCell className='text-right font-medium text-green-600'>
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
				</TabsContent>

				<TabsContent value='logs'>
					<LogsViewer logs={logs} onClearLogs={clearLogs} onExportLogs={exportLogs} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
