import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import React from "react";

interface LogsSummary {
	errors: number;
	warnings: number;
	infos: number;
}

interface ProcessamentoBannerProps {
	isProcessing: boolean;
	isCompleted: boolean;
	hasError: boolean;
	// client-side upload progress (while uploading)
	clientUploadProgress?: number;
	// server-side processing progress
	serverProgress?: number;
	currentStep: string;
	statusMessage: string;
	processedCount: number;
	totalCount: number;
	timeRemaining: string;
	onCancel?: () => void;
	onToggleLogs?: () => void;
	showLogs: boolean;
	logsSummary: LogsSummary;
}

export const ProcessamentoBanner: React.FC<ProcessamentoBannerProps> = ({
	isProcessing,
	isCompleted,
	hasError,
	clientUploadProgress = 0,
	serverProgress = 0,
	currentStep,
	statusMessage,
	processedCount,
	totalCount,
	timeRemaining,
	onCancel,
	onToggleLogs,
	showLogs,
	logsSummary,
}) => {
	if (!isProcessing && !isCompleted && !hasError) return null;

	return (
		<div className='sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/80 bg-white border-b shadow-sm' role='status' aria-live='polite'>
			<div className='max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3'>
				{/* Header Line */}
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<div className='flex items-center gap-2 font-medium text-sm'>
						{isProcessing && <Loader2 className='h-4 w-4 animate-spin' />}
						{isCompleted && <CheckCircle className='h-4 w-4 text-green-600' />}
						{hasError && <AlertTriangle className='h-4 w-4 text-red-600' />}
						<span>
							{isProcessing && "Processando conciliação"}
							{isCompleted && "Processamento concluído"}
							{hasError && "Erro no processamento"}
						</span>
					</div>
					<div className='flex items-center gap-2 text-xs'>
						{isProcessing && (
							<Badge variant='secondary' className='text-blue-700 bg-blue-100'>
								{processedCount}/{totalCount} itens • Upload {clientUploadProgress}% • Proc. {serverProgress}% • {timeRemaining} restantes
							</Badge>
						)}
						{isCompleted && (
							<Badge variant='outline' className='text-green-700 border-green-300'>
								{processedCount} itens processados
							</Badge>
						)}
						{logsSummary.errors > 0 && (
							<Badge variant='destructive' className='text-xs'>
								{logsSummary.errors} Erros
							</Badge>
						)}
						{logsSummary.warnings > 0 && (
							<Badge variant='secondary' className='bg-yellow-100 text-yellow-700 text-xs'>
								{logsSummary.warnings} Avisos
							</Badge>
						)}
						<Button size='sm' variant='outline' onClick={onToggleLogs} className='text-xs'>
							{showLogs ? "Esconder Logs" : "Ver Logs"}
						</Button>
						{isProcessing && onCancel && (
							<Button size='sm' variant='ghost' onClick={onCancel} className='text-xs text-red-600 hover:text-red-700'>
								<X className='h-4 w-4' />
							</Button>
						)}
					</div>
				</div>

				{/* Progress + Message */}
				<div className='space-y-2'>
					{isProcessing && (
						<>
							{clientUploadProgress > 0 || serverProgress > 0 ? (
								// If client upload is in progress, show it as primary. Otherwise show server progress.
								<Progress value={clientUploadProgress > 0 ? clientUploadProgress : serverProgress} className='h-2' />
							) : (
								<div className='h-2 w-full rounded bg-muted relative overflow-hidden' aria-label='Carregando...'>
									{/* Barra indeterminada animada */}
									<div className='absolute inset-0 animate-[progress_1.2s_linear_infinite] bg-gradient-to-r from-blue-300 via-blue-500 to-blue-300' />
								</div>
							)}
							<div className='flex justify-between text-xs text-muted-foreground'>
								<span>{currentStep || (clientUploadProgress === 0 && serverProgress === 0 ? "Preparando processamento" : "")}</span>
								<span>{statusMessage || (clientUploadProgress === 0 && serverProgress === 0 ? "Inicializando serviços e lendo arquivo" : "")}</span>
							</div>
						</>
					)}
					{hasError && <p className='text-xs text-red-600'>{statusMessage || "Ocorreu um erro. Verifique os logs."}</p>}
				</div>
			</div>
		</div>
	);
};

// Tailwind custom keyframes (caso não exista, adicionar em config) provisório fallback usando inline style via global CSS injection not included here.
export default ProcessamentoBanner;
