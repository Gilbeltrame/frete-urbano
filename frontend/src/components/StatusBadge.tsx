import { cn } from "@/lib/utils";
import type { StatusConciliacao } from "@/types";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import React from "react";

interface StatusBadgeProps {
	status: StatusConciliacao;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
	const base =
		"flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium tracking-tight transition-colors border animate-in fade-in duration-300 bg-white/60 backdrop-blur-sm";

	if (status === "CONFORME") {
		return (
			<span className={cn(base, "bg-emerald-50/70 border-emerald-200 text-emerald-700 shadow-sm")}>
				<CheckCircle className='w-3.5 h-3.5 text-emerald-500' />
				<span className='leading-none'>Conforme ANTT</span>
				<span className='ml-1 w-1 h-1 rounded-full bg-emerald-400 animate-pulse' />
			</span>
		);
	}
	if (status === "DIVERGENTE") {
		return (
			<span className={cn(base, "bg-amber-50/70 border-amber-200 text-amber-700 shadow-sm")}>
				<AlertTriangle className='w-3.5 h-3.5 text-amber-500' />
				<span className='leading-none'>Necessita Revisão</span>
			</span>
		);
	}
	if (status === "ATENCAO") {
		return (
			<span className={cn(base, "bg-orange-50/70 border-orange-200 text-orange-700 shadow-sm")}>
				<AlertTriangle className='w-3.5 h-3.5 text-orange-500' />
				<span className='leading-none'>Atenção</span>
			</span>
		);
	}
	if (status === "ERRO_CALCULO") {
		return (
			<span className={cn(base, "bg-red-50/70 border-red-200 text-red-700 shadow-sm")}>
				<XCircle className='w-3.5 h-3.5 text-red-500' />
				<span className='leading-none'>Não Conforme</span>
			</span>
		);
	}
	if (status === "PROCESSANDO") {
		return (
			<span className={cn(base, "bg-slate-50/80 border-slate-200 text-slate-600 shadow-sm")}>
				<Loader2 className='w-3.5 h-3.5 animate-spin text-slate-500' />
				<span className='leading-none'>Processando</span>
			</span>
		);
	}
	return <span className={cn(base, "text-gray-600 border-gray-200")}>Desconhecido</span>;
};

export default StatusBadge;
