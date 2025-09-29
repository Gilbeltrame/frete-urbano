import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useConciliacao } from "@/hooks/useConciliacao";
import { useTemplateDownload } from "@/hooks/useTemplateDownload";
import type { StatusConciliacao } from "@/types";
import { AlertTriangle, BarChart3, CheckCircle, Download, FileSpreadsheet, Filter, Loader2, Search, Trash2, Upload, X, XCircle } from "lucide-react";
import { useRef, useState } from "react";

export default function ConciliacaoPage() {
	const {
		resultadoConciliacao,
		isProcessing,
		uploadProgress,
		processedCount,
		currentProcessingItem,
		truncatedInfo,
		stats,
		usageInfo,
		processarPlanilha,
		exportarResultados,
		limparDados,
		cancelarProcessamento,
	} = useConciliacao();

	const { downloadTemplate } = useTemplateDownload();

	const [filtroStatus, setFiltroStatus] = useState<StatusConciliacao | "TODOS">("TODOS");
	const [termoPesquisa, setTermoPesquisa] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Função para processar arquivo Excel/CSV
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			await processarPlanilha(file);
		} catch (error) {
			console.error("Erro ao processar arquivo:", error);
			alert("Erro ao processar arquivo. Verifique se o formato está correto.");
		}
	};

	// Função para filtrar resultados
	const resultadosFiltrados = resultadoConciliacao.filter((resultado) => {
		const matchStatus = filtroStatus === "TODOS" || resultado.status === filtroStatus;
		const matchPesquisa =
			termoPesquisa === "" ||
			resultado.item.transportadora.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
			resultado.item.placa.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
			resultado.item.cidadeDestino.toLowerCase().includes(termoPesquisa.toLowerCase());

		return matchStatus && matchPesquisa;
	});

	// Função para lidar com exportação
	const handleExportar = () => {
		exportarResultados(resultadosFiltrados);
	};

	// Função para limpar arquivo selecionado
	const handleLimpar = () => {
		limparDados();
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const getStatusBadge = (status: StatusConciliacao) => {
		switch (status) {
			case "CONFORME":
				return (
					<Badge variant='default' className='bg-green-500'>
						<CheckCircle size={14} className='mr-1' />
						Conforme
					</Badge>
				);
			case "RISCO":
				return (
					<Badge variant='secondary' className='bg-yellow-500'>
						<AlertTriangle size={14} className='mr-1' />
						Risco
					</Badge>
				);
			case "NAO_CONFORME":
				return (
					<Badge variant='destructive'>
						<XCircle size={14} className='mr-1' />
						Não Conforme
					</Badge>
				);
		}
	};

	return (
		<div className='h-full overflow-auto p-6 space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>Conciliação de Orçamentos</h1>
					<p className='text-muted-foreground'>Processamento automatizado com classificação de compliance</p>
				</div>
				<div className='text-right space-y-1'>
					<div className='text-sm text-muted-foreground'>
						Consultas hoje: <span className='font-medium'>{usageInfo.consultasHoje.toLocaleString()}</span> / {usageInfo.limiteConsultas.toLocaleString()}
					</div>
					<div className='text-xs text-muted-foreground'>
						Restantes: {usageInfo.consultasRestantes.toLocaleString()} • Reset em: {usageInfo.tempoAteReset}
					</div>
					{!usageInfo.podeConsultar && <div className='text-xs text-red-600 font-medium'>Limite diário atingido</div>}
				</div>
			</div>

			{/* Upload de Arquivo */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<FileSpreadsheet className='h-5 w-5' />
						Importar Planilha
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
								<AlertDescription>Você tem apenas {usageInfo.consultasRestantes.toLocaleString()} consultas restantes hoje. Máximo de 1000 linhas por planilha.</AlertDescription>
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
								htmlFor='file-upload'
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
									<p className='text-xs text-gray-500'>Excel (.xlsx, .xls) ou CSV • Máximo 1000 linhas</p>
								</div>
								<input
									id='file-upload'
									type='file'
									ref={fileInputRef}
									className='hidden'
									accept='.xlsx,.xls,.csv'
									onChange={handleFileUpload}
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

					{isProcessing && (
						<div className='mt-4 space-y-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<Loader2 className='h-4 w-4 animate-spin' />
									<span className='text-sm font-medium'>{currentProcessingItem}</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-sm text-muted-foreground'>{processedCount > 0 && `${processedCount} processados`}</span>
									<Button onClick={cancelarProcessamento} variant='outline' size='sm' className='h-6 px-2 text-xs'>
										<X size={12} />
										Cancelar
									</Button>
								</div>
							</div>
							<Progress value={uploadProgress} className='w-full h-2' />
							<div className='flex justify-between text-xs text-muted-foreground'>
								<span>{uploadProgress < 25 ? "Lendo arquivo..." : uploadProgress < 50 ? "Validando formato..." : "Analisando compliance..."}</span>
								<span>{uploadProgress.toFixed(1)}%</span>
							</div>
							{currentProcessingItem && processedCount > 0 && <div className='text-xs text-blue-600 truncate'>Atual: {currentProcessingItem}</div>}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Estatísticas */}
			{resultadoConciliacao.length > 0 && (
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium'>Total</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats.total}</div>
							{truncatedInfo?.wasTruncated && (
								<p className='text-xs text-orange-600 mt-1'>
									{truncatedInfo.processedCount.toLocaleString()} de {truncatedInfo.originalCount.toLocaleString()} linhas
								</p>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-green-600'>Conforme</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-green-600'>{stats.conforme}</div>
							<p className='text-xs text-muted-foreground'>{stats.total > 0 ? ((stats.conforme / stats.total) * 100).toFixed(1) : 0}%</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-yellow-600'>Risco</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-yellow-600'>{stats.risco}</div>
							<p className='text-xs text-muted-foreground'>{stats.total > 0 ? ((stats.risco / stats.total) * 100).toFixed(1) : 0}%</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-red-600'>Não Conforme</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-red-600'>{stats.naoConforme}</div>
							<p className='text-xs text-muted-foreground'>{stats.total > 0 ? ((stats.naoConforme / stats.total) * 100).toFixed(1) : 0}%</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filtros e Ações */}
			{resultadoConciliacao.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Filter className='h-5 w-5' />
							Filtros e Ações
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col md:flex-row gap-4 items-center'>
							<div className='flex-1'>
								<Label htmlFor='pesquisa'>Pesquisar</Label>
								<div className='relative'>
									<Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
									<Input
										id='pesquisa'
										placeholder='Pesquisar por transportadora, placa ou cidade...'
										value={termoPesquisa}
										onChange={(e) => setTermoPesquisa(e.target.value)}
										className='pl-8'
									/>
								</div>
							</div>
							<div>
								<Label htmlFor='filtro-status'>Status</Label>
								<select
									id='filtro-status'
									value={filtroStatus}
									onChange={(e) => setFiltroStatus(e.target.value as any)}
									className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors'
								>
									<option value='TODOS'>Todos</option>
									<option value='CONFORME'>Conforme</option>
									<option value='RISCO'>Risco</option>
									<option value='NAO_CONFORME'>Não Conforme</option>
								</select>
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

			{/* Resultados */}
			{resultadosFiltrados.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<BarChart3 className='h-5 w-5' />
							Resultados da Conciliação ({resultadosFiltrados.length} itens)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{resultadosFiltrados.map((resultado, index) => (
								<div
									key={index}
									className={`border rounded-lg p-4 space-y-3 transition-all hover:shadow-md ${
										resultado.status === "NAO_CONFORME"
											? "border-red-200 bg-red-50/50"
											: resultado.status === "RISCO"
											? "border-yellow-200 bg-yellow-50/50"
											: "border-green-200 bg-green-50/50"
									}`}
								>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											{getStatusBadge(resultado.status)}
											<span className='font-semibold'>{resultado.item.transportadora}</span>
											<span className='text-sm text-muted-foreground'>
												{resultado.item.placa} • {resultado.item.cidadeDestino}/{resultado.item.clienteUF}
											</span>
										</div>
										<div className='flex items-center gap-3 text-sm text-muted-foreground'>
											<span>
												Lote: <strong>{resultado.item.lote}</strong>
											</span>
											<span>•</span>
											<span>{resultado.item.dataEmissao}</span>
										</div>
									</div>

									<div className='grid grid-cols-2 md:grid-cols-5 gap-4 text-sm'>
										<div className='space-y-1'>
											<span className='text-muted-foreground'>Peso Líquido</span>
											<div className='font-medium'>{resultado.item.pesoLiqCalc.toLocaleString()} kg</div>
										</div>
										<div className='space-y-1'>
											<span className='text-muted-foreground'>Peso Bruto</span>
											<div className='font-medium'>{resultado.item.pesoBruto.toLocaleString()} kg</div>
										</div>
										<div className='space-y-1'>
											<span className='text-muted-foreground'>Veículo</span>
											<div className='font-medium'>{resultado.item.tpVeiculo}</div>
										</div>
										<div className='space-y-1'>
											<span className='text-muted-foreground'>Frota</span>
											<div className='font-medium'>{resultado.item.tpFrota}</div>
										</div>
										<div className='space-y-1'>
											<span className='text-muted-foreground'>Eixos</span>
											<div className='font-medium'>{resultado.item.qtEixos}</div>
										</div>
									</div>

									{resultado.detalhes?.diferençaPeso && resultado.detalhes.diferençaPeso > 0 && (
										<div className='text-sm p-2 bg-blue-50 rounded border border-blue-200'>
											<span className='text-blue-700'>
												<strong>Diferença de peso:</strong> {resultado.detalhes.diferençaPeso.toFixed(2)} kg
												{resultado.item.pesoBruto > 0 && <span className='ml-2'>({((resultado.detalhes.diferençaPeso / resultado.item.pesoBruto) * 100).toFixed(2)}%)</span>}
											</span>
										</div>
									)}

									{resultado.alertas.length > 0 && (
										<Alert variant={resultado.status === "NAO_CONFORME" ? "destructive" : "default"}>
											<AlertTriangle className='h-4 w-4' />
											<AlertTitle>
												{resultado.status === "NAO_CONFORME" ? "Não Conformidades" : resultado.status === "RISCO" ? "Pontos de Atenção" : "Informações"} ({resultado.alertas.length}
												)
											</AlertTitle>
											<AlertDescription>
												<ul className='list-disc list-inside space-y-1 mt-2'>
													{resultado.alertas.map((alerta, i) => (
														<li key={i} className='text-sm'>
															{alerta}
														</li>
													))}
												</ul>
											</AlertDescription>
										</Alert>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Estado vazio */}
			{resultadoConciliacao.length === 0 && !isProcessing && (
				<Card>
					<CardContent className='flex flex-col items-center justify-center py-12'>
						<FileSpreadsheet className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-semibold mb-2'>Nenhuma planilha carregada</h3>
						<p className='text-muted-foreground text-center max-w-md'>Faça o upload de uma planilha de orçamentos para iniciar o processo de conciliação automatizado.</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
