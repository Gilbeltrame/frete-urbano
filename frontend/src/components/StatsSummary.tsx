import React from "react";

interface StatsSummaryProps {
	total?: number;
	conforme?: number;
	divergente?: number;
	erroCalculo?: number;
	className?: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ total = 0, conforme = 0, divergente = 0, erroCalculo = 0, className }) => {
	return (
		<div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className || ""}`}>
			{/* Total */}
			<div className='text-center p-3 rounded-lg bg-card ring-1 ring-border shadow-sm flex flex-col gap-1'>
				<div className='text-2xl font-bold text-primary'>{total}</div>
				<div className='text-xs font-medium text-muted-foreground tracking-wide'>Total Analisado</div>
			</div>
			{/* Conforme */}
			<div className='text-center p-3 rounded-lg bg-[var(--status-conforme-bg)] ring-1 ring-border shadow-sm border-l-4 border-[var(--status-conforme)] flex flex-col gap-1'>
				<div className='text-2xl font-bold text-[var(--status-conforme)]'>{conforme}</div>
				<div className='text-xs font-medium text-[var(--status-conforme)]'>Conforme ANTT</div>
			</div>
			{/* Divergente */}
			<div className='text-center p-3 rounded-lg bg-[var(--status-divergente-bg)] ring-1 ring-border shadow-sm border-l-4 border-[var(--status-divergente)] flex flex-col gap-1'>
				<div className='text-2xl font-bold text-[var(--status-divergente)]'>{divergente}</div>
				<div className='text-xs font-medium text-[var(--status-divergente)]'>Necessita Revisão</div>
			</div>
			{/* Erro */}
			<div className='text-center p-3 rounded-lg bg-[var(--status-erro-bg)] ring-1 ring-border shadow-sm border-l-4 border-[var(--status-erro)] flex flex-col gap-1'>
				<div className='text-2xl font-bold text-[var(--status-erro)]'>{erroCalculo}</div>
				<div className='text-xs font-medium text-[var(--status-erro)]'>Não Conforme</div>
			</div>
		</div>
	);
};

export default StatsSummary;
