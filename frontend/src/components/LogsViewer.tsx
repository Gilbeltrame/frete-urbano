import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { LogEntry, LogLevel } from "@/utils/logger";
import { AlertCircle, AlertTriangle, Bug, ChevronLeft, ChevronRight, Download, Info, RefreshCw, Trash2, Zap } from "lucide-react";
import { memo, startTransition, useCallback, useMemo, useState } from "react";

interface LogsViewerProps {
	logs: {
		entries: LogEntry[];
		stats: { [key in LogLevel]: number };
		hasErrors: boolean;
		hasWarnings: boolean;
	};
	onClearLogs: () => void;
	onExportLogs: () => void;
}

// Utilitários de formatação
const formatTimestamp = (timestamp: string) => {
	return new Date(timestamp).toLocaleString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		day: "2-digit",
		month: "2-digit",
	});
};

const getLevelIcon = (level: LogLevel) => {
	switch (level) {
		case "debug":
			return <Bug size={14} className='text-gray-500' />;
		case "info":
			return <Info size={14} className='text-blue-500' />;
		case "warn":
			return <AlertTriangle size={14} className='text-yellow-500' />;
		case "error":
			return <AlertCircle size={14} className='text-red-500' />;
		case "critical":
			return <Zap size={14} className='text-red-600' />;
	}
};

const getLevelBadge = (level: LogLevel) => {
	const variants = {
		debug: "secondary",
		info: "default",
		warn: "secondary",
		error: "destructive",
		critical: "destructive",
	} as const;

	const colors = {
		debug: "bg-gray-100 text-gray-600",
		info: "bg-blue-100 text-blue-600",
		warn: "bg-yellow-100 text-yellow-600",
		error: "bg-red-100 text-red-600",
		critical: "bg-red-200 text-red-700 font-bold",
	};

	return (
		<Badge variant={variants[level]} className={colors[level]}>
			{getLevelIcon(level)}
			<span className='ml-1 uppercase text-xs'>{level}</span>
		</Badge>
	);
};

// Componente de entrada de log individual (memoizado)
const LogEntryComponent = memo(({ log }: { log: LogEntry }) => (
	<div className='space-y-1'>
		<div className='flex items-start gap-2 text-sm'>
			<span className='text-xs text-muted-foreground font-mono min-w-[80px]'>{formatTimestamp(log.timestamp)}</span>
			{getLevelBadge(log.level)}
			{log.context && (
				<Badge variant='outline' className='text-xs'>
					{log.context}
				</Badge>
			)}
		</div>
		<div className='ml-2 pl-2 border-l-2 border-gray-200'>
			<p className='text-sm break-words'>{log.message}</p>
			{log.data && (
				<details className='mt-1'>
					<summary className='text-xs text-muted-foreground cursor-pointer hover:text-foreground'>Ver dados ({JSON.stringify(log.data).length} chars)</summary>
					<div className='mt-1 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-auto'>
						<pre className='whitespace-pre-wrap'>{JSON.stringify(log.data, null, 2)}</pre>
					</div>
				</details>
			)}
			{log.stack && (
				<details className='mt-1'>
					<summary className='text-xs text-red-600 cursor-pointer hover:text-red-800'>Ver stack trace</summary>
					<div className='mt-1 p-2 bg-red-50 rounded text-xs max-h-32 overflow-auto'>
						<pre className='whitespace-pre-wrap text-red-800'>{log.stack}</pre>
					</div>
				</details>
			)}
		</div>
	</div>
));

LogEntryComponent.displayName = "LogEntryComponent";

// Componente principal
export const LogsViewer = memo(function LogsViewer({ logs, onClearLogs, onExportLogs }: LogsViewerProps) {
	const [selectedLevel, setSelectedLevel] = useState<LogLevel | "all">("all");
	const [selectedContext, setSelectedContext] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [isFiltering, setIsFiltering] = useState(false);

	const ITEMS_PER_PAGE = 50;

	// Obter contextos únicos
	const availableContexts = useMemo(() => {
		const contexts = new Set<string>();
		logs.entries.forEach((log) => {
			if (log.context) {
				contexts.add(log.context);
			}
		});
		return Array.from(contexts).sort();
	}, [logs.entries]);

	// Filtrar logs
	const filteredLogs = useMemo(() => {
		return logs.entries.filter((log) => {
			const levelMatch = selectedLevel === "all" || log.level === selectedLevel;
			const contextMatch = selectedContext === "all" || (log.context && log.context.includes(selectedContext));
			return levelMatch && contextMatch;
		});
	}, [logs.entries, selectedLevel, selectedContext]);

	// Paginar logs
	const paginatedLogs = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		return filteredLogs.slice(startIndex, endIndex);
	}, [filteredLogs, currentPage]);

	const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

	// Handlers não-bloqueantes
	const handleLevelChange = useCallback((value: string) => {
		setIsFiltering(true);
		startTransition(() => {
			setSelectedLevel(value as LogLevel | "all");
			setCurrentPage(1);
			setIsFiltering(false);
		});
	}, []);

	const handleContextChange = useCallback((value: string) => {
		setIsFiltering(true);
		startTransition(() => {
			setSelectedContext(value);
			setCurrentPage(1);
			setIsFiltering(false);
		});
	}, []);

	const handlePageChange = useCallback((page: number) => {
		startTransition(() => {
			setCurrentPage(page);
		});
	}, []);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Bug className='h-5 w-5' />
					Logs de Diagnóstico
					{logs.hasErrors && (
						<Badge variant='destructive' className='ml-2'>
							{logs.stats.error + logs.stats.critical} erros
						</Badge>
					)}
					{logs.hasWarnings && (
						<Badge variant='secondary' className='bg-yellow-100 text-yellow-600'>
							{logs.stats.warn} avisos
						</Badge>
					)}
					{isFiltering && (
						<Badge variant='outline' className='animate-pulse'>
							Filtrando...
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					{/* Estatísticas */}
					<div className='flex flex-wrap gap-2'>
						<Badge variant='outline' className='bg-gray-50'>
							Debug: {logs.stats.debug}
						</Badge>
						<Badge variant='outline' className='bg-blue-50 text-blue-600'>
							Info: {logs.stats.info}
						</Badge>
						<Badge variant='outline' className='bg-yellow-50 text-yellow-600'>
							Warn: {logs.stats.warn}
						</Badge>
						<Badge variant='outline' className='bg-red-50 text-red-600'>
							Error: {logs.stats.error}
						</Badge>
						{logs.stats.critical > 0 && (
							<Badge variant='outline' className='bg-red-100 text-red-700 font-bold'>
								Critical: {logs.stats.critical}
							</Badge>
						)}
					</div>

					{/* Filtros */}
					<div className='flex flex-col sm:flex-row gap-4 items-center'>
						<div className='flex-1'>
							<label className='text-sm font-medium mb-1 block'>Nível:</label>
							<select
								value={selectedLevel}
								onChange={(e) => handleLevelChange(e.target.value)}
								className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
								disabled={isFiltering}
							>
								<option value='all'>Todos ({logs.entries.length})</option>
								<option value='debug'>Debug ({logs.stats.debug})</option>
								<option value='info'>Info ({logs.stats.info})</option>
								<option value='warn'>Avisos ({logs.stats.warn})</option>
								<option value='error'>Erros ({logs.stats.error})</option>
								<option value='critical'>Críticos ({logs.stats.critical})</option>
							</select>
						</div>
						<div className='flex-1'>
							<label className='text-sm font-medium mb-1 block'>Contexto:</label>
							<select
								value={selectedContext}
								onChange={(e) => handleContextChange(e.target.value)}
								className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
								disabled={isFiltering}
							>
								<option value='all'>Todos</option>
								{availableContexts.map((context) => (
									<option key={context} value={context}>
										{context}
									</option>
								))}
							</select>
						</div>
						<div className='pt-6 flex gap-2'>
							<Button onClick={onExportLogs} variant='outline' size='sm' className='gap-2'>
								<Download size={14} />
								Exportar
							</Button>
							<Button onClick={onClearLogs} variant='outline' size='sm' className='gap-2'>
								<Trash2 size={14} />
								Limpar
							</Button>
						</div>
					</div>

					{/* Lista de Logs com Paginação */}
					<div className='border rounded-md'>
						<div className='h-96 overflow-y-auto p-4'>
							{paginatedLogs.length === 0 ? (
								<div className='text-center text-muted-foreground py-8'>
									<RefreshCw className='h-8 w-8 mx-auto mb-2 opacity-50' />
									<p>{isFiltering ? "Filtrando logs..." : "Nenhum log encontrado com os filtros selecionados"}</p>
								</div>
							) : (
								<div className='space-y-3'>
									{paginatedLogs.map((log, index) => (
										<div key={`${log.timestamp}-${index}`}>
											<LogEntryComponent log={log} />
											{index < paginatedLogs.length - 1 && <Separator className='my-3' />}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Paginação */}
						{totalPages > 1 && (
							<div className='flex items-center justify-between p-4 border-t'>
								<div className='text-sm text-muted-foreground'>
									Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} de {filteredLogs.length} logs
								</div>
								<div className='flex items-center space-x-2'>
									<Button variant='outline' size='sm' onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
										<ChevronLeft className='h-4 w-4' />
									</Button>
									<span className='text-sm'>
										Página {currentPage} de {totalPages}
									</span>
									<Button variant='outline' size='sm' onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
										<ChevronRight className='h-4 w-4' />
									</Button>
								</div>
							</div>
						)}
					</div>

					{/* Resumo */}
					<div className='text-xs text-muted-foreground flex justify-between'>
						<span>{filteredLogs.length !== logs.entries.length ? `Filtrados: ${filteredLogs.length} de ${logs.entries.length} logs` : `Total: ${logs.entries.length} logs`}</span>
						<span>Última atualização: {logs.entries.length > 0 ? formatTimestamp(logs.entries[logs.entries.length - 1].timestamp) : "N/A"}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

LogsViewer.displayName = "LogsViewer";
