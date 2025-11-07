import type { StatusConciliacao } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface ResultadoConciliacao {
	status: StatusConciliacao;
	item: any;
	detalhes?: any;
}

interface StatusChartProps {
	resultados: ResultadoConciliacao[];
	filtrados?: ResultadoConciliacao[]; // opcional: conjunto após filtros
	className?: string;
}

// Cores agora derivadas do tema via CSS vars para facilitar ajustes globais
const STATUS_COLORS: Record<StatusConciliacao, { bgVar: string; fgVar: string; text: string; label: string }> = {
	CONFORME: { bgVar: "var(--status-conforme-bg)", fgVar: "var(--status-conforme)", text: "Conforme ANTT", label: "Conforme" },
	DIVERGENTE: { bgVar: "var(--status-divergente-bg)", fgVar: "var(--status-divergente)", text: "Necessita Revisão", label: "Revisão" },
	ERRO_CALCULO: { bgVar: "var(--status-erro-bg)", fgVar: "var(--status-erro)", text: "Não Conforme", label: "Não Conforme" },
};

export function StatusChart({ resultados, filtrados, className }: StatusChartProps) {
	const [modo, setModo] = useState<"total" | "filtrado">("total");
	// animação de entrada controlada
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const t = requestAnimationFrame(() => setMounted(true));
		return () => cancelAnimationFrame(t);
	}, []);

	const base = modo === "filtrado" && filtrados ? filtrados : resultados;

	const counts = useMemo(() => {
		const acc: Record<StatusConciliacao, number> = { CONFORME: 0, DIVERGENTE: 0, ERRO_CALCULO: 0 };
		for (const r of base) if (acc[r.status] !== undefined) acc[r.status]++;
		return acc;
	}, [base]);

	const total = base.length || 1;
	const barras = (Object.entries(counts) as [StatusConciliacao, number][]) // preserve order
		.map(([status, valor]) => ({ status, valor, pct: (valor / total) * 100 }));

	return (
		<div className={`space-y-3 ${className || ""}`}>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-semibold text-foreground flex items-center gap-2 tracking-tight'>Distribuição de Status {modo === "filtrado" ? "(Filtros)" : "(Total)"}</h3>
				{filtrados && filtrados.length !== resultados.length && (
					<div className='flex gap-2'>
						{["total", "filtrado"].map((m) => (
							<button
								key={m}
								type='button'
								onClick={() => setModo(m as any)}
								className={`px-2 py-1 rounded-md text-xs font-medium ring-1 ring-border transition-colors ${
									modo === m ? "bg-accent text-accent-foreground" : "bg-card hover:bg-muted text-muted-foreground"
								}`}
							>
								{m === "total" ? "Total" : "Filtrado"}
							</button>
						))}
					</div>
				)}
			</div>
			{/* Barra empilhada */}
			<div className='w-full h-9 rounded-lg overflow-hidden flex ring-1 ring-border bg-card relative'>
				{barras.map((b, i) => {
					const color = STATUS_COLORS[b.status];
					const width = mounted ? `${b.pct}%` : "0%";
					return (
						<div
							key={b.status}
							style={{
								width,
								background: `linear-gradient(90deg, ${color.bgVar} 0%, color-mix(in oklab, ${color.bgVar} 92%, white) 100%)`,
								color: color.fgVar,
								transition: "width 750ms cubic-bezier(.25,.75,.25,1)",
							}}
							className='relative group flex items-center justify-center text-[10px] font-medium 
								before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.08))]'
							aria-label={`${color.text}: ${b.valor} (${b.pct.toFixed(1)}%)`}
						>
							{b.pct > 7 && (
								<span className='pointer-events-none select-none drop-shadow-sm'>
									{color.label} {b.pct.toFixed(0)}%
								</span>
							)}
							<span className='absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border/60 backdrop-blur-sm'>
								{color.text}: {b.valor} ({b.pct.toFixed(1)}%)
							</span>
							{/* Divisor sutil */}
							{i < barras.length - 1 && <span className='absolute right-0 top-0 h-full w-px bg-border/60' />}
						</div>
					);
				})}
				{/* Brilho hover global */}
				<div className='pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,var(--ring),transparent_70%)] mix-blend-overlay' />
			</div>
			{/* Legenda */}
			<div className='grid grid-cols-3 gap-2 text-xs'>
				{barras.map((b) => {
					const color = STATUS_COLORS[b.status];
					return (
						<div key={b.status} className='flex items-center gap-1 group'>
							<span
								className='inline-block w-3 h-3 rounded-sm border border-border shadow-sm group-hover:scale-105 transition-transform'
								style={{ background: `linear-gradient(135deg, ${color.bgVar} 0%, color-mix(in oklab, ${color.bgVar} 88%, white) 100%)` }}
							/>
							<span className='text-muted-foreground truncate'>{color.text}</span>
							<span className='font-medium text-foreground ml-auto tabular-nums'>
								{counts[b.status]} ({b.pct.toFixed(1)}%)
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default StatusChart;
