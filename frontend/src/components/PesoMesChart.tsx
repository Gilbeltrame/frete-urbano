import type { StatusConciliacao } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface ResultadoConciliacao {
	status: StatusConciliacao;
	item: any;
	detalhes?: any;
}

interface PesoMesChartProps {
	resultados: ResultadoConciliacao[];
	filtrados?: ResultadoConciliacao[];
	className?: string;
}

// Geração de cor suave por índice
function colorForIndex(i: number) {
	// Usa a cor base do tema (--chart-1) variando opacidade para criar diferenciação leve
	const base = "var(--chart-1)";
	// gerar steps de opacidade
	const opacities = [0.25, 0.38, 0.52, 0.66, 0.8];
	const o = opacities[i % opacities.length];
	// Utiliza color-mix para escurecer progressivamente (fallback: rgba via currentColor approach se não suportado)
	return `color-mix(in oklab, ${base} ${Math.round(o * 100)}%, black)`;
}

export function PesoMesChart({ resultados, filtrados, className }: PesoMesChartProps) {
	const [modo, setModo] = useState<"total" | "filtrado">("total");
	const base = modo === "filtrado" && filtrados ? filtrados : resultados;
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setMounted(true));
		return () => cancelAnimationFrame(id);
	}, []);

	const dados = useMemo(() => {
		const acc: Record<string, number> = {};
		for (const r of base) {
			const raw = r.item.dataEmissao;
			let chave = "Sem Data";
			if (raw) {
				const d = new Date(raw);
				if (!isNaN(d.getTime())) {
					const ano = d.getFullYear();
					const mes = (d.getMonth() + 1).toString().padStart(2, "0");
					chave = `${ano}-${mes}`;
				}
			}
			const peso = Number(r.item.pesoBruto) || 0;
			acc[chave] = (acc[chave] || 0) + peso;
		}
		// Ordenar meses cronologicamente (Sem Data sempre no fim)
		const entries = Object.entries(acc).sort((a, b) => {
			if (a[0] === "Sem Data") return 1;
			if (b[0] === "Sem Data") return -1;
			return a[0] < b[0] ? -1 : 1;
		});
		const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
		return entries.map(([mes, valor], i) => ({ mes, valor, pct: (valor / total) * 100, color: colorForIndex(i) }));
	}, [base]);

	return (
		<div className={`space-y-3 ${className || ""}`}>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-semibold text-foreground tracking-tight'>Peso Bruto por Mês {modo === "filtrado" ? "(Filtros)" : "(Total)"}</h3>
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
			<div className='space-y-2'>
				{dados.map((d, i) => {
					const width = mounted ? `${d.pct}%` : "0%";
					return (
						<div key={d.mes} className='flex items-center gap-2 group'>
							<div className='w-20 text-xs font-medium text-muted-foreground tabular-nums'>{d.mes}</div>
							<div className='flex-1 h-5 rounded-md bg-muted/60 backdrop-blur-[2px] overflow-hidden relative ring-1 ring-border/50'>
								<div
									className='h-full flex items-center justify-end pr-2 text-[10px] font-semibold text-foreground/80 shadow-sm transition-[width] duration-700 ease-out relative'
									style={{ width, background: `linear-gradient(90deg, ${d.color} 0%, color-mix(in oklab, ${d.color} 85%, white) 100%)` }}
									aria-label={`${d.mes}: ${d.valor.toLocaleString("pt-BR")} kg (${d.pct.toFixed(1)}%)`}
								>
									{d.pct > 8 && <span className='drop-shadow-sm'>{d.pct.toFixed(0)}%</span>}
									<span className='absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border/60'>
										{d.valor.toLocaleString("pt-BR")} kg • {d.pct.toFixed(1)}%
									</span>
								</div>
							</div>
							<div className='w-24 text-right text-xs font-medium text-foreground tabular-nums'>{d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} kg</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default PesoMesChart;
