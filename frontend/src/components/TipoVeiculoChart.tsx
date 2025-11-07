import type { StatusConciliacao } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface ResultadoConciliacao {
	status: StatusConciliacao;
	item: any;
	detalhes?: any;
}

interface TipoVeiculoChartProps {
	resultados: ResultadoConciliacao[];
	filtrados?: ResultadoConciliacao[];
	className?: string;
}

function genColor(i: number) {
	// Usa var(--chart-2 .. --chart-5) + mistura para variar sem saturar demais
	const vars = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
	const chosen = vars[i % vars.length];
	// Leve ajuste de profundidade conforme índice
	const depth = (i % vars.length) * 8 + 4; // 4,12,20...
	return `color-mix(in oklab, ${chosen} 85%, black ${depth}%)`;
}

export function TipoVeiculoChart({ resultados, filtrados, className }: TipoVeiculoChartProps) {
	const [modo, setModo] = useState<"total" | "filtrado">("total");
	const base = modo === "filtrado" && filtrados ? filtrados : resultados;
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const raf = requestAnimationFrame(() => setMounted(true));
		return () => cancelAnimationFrame(raf);
	}, []);

	const dados = useMemo(() => {
		const acc: Record<string, { peso: number; count: number }> = {};
		for (const r of base) {
			let key = (r.item.tpVeiculo || "Indef.").toString().trim();
			if (!key) key = "Indef.";
			const peso = Number(r.item.pesoBruto) || 0;
			if (!acc[key]) acc[key] = { peso: 0, count: 0 };
			acc[key].peso += peso;
			acc[key].count += 1;
		}
		const entries = Object.entries(acc).sort((a, b) => b[1].peso - a[1].peso);
		const totalPeso = entries.reduce((s, [, v]) => s + v.peso, 0) || 1;
		return entries.map(([tipo, v], i) => ({ tipo, ...v, pct: (v.peso / totalPeso) * 100, color: genColor(i) }));
	}, [base]);

	return (
		<div className={`space-y-3 ${className || ""}`}>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-semibold text-foreground tracking-tight'>Distribuição por Tipo de Veículo {modo === "filtrado" ? "(Filtros)" : "(Total)"}</h3>
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
						<div key={d.tipo} className='flex items-center gap-2 group'>
							<div className='w-28 text-xs font-medium text-muted-foreground truncate' title={d.tipo}>
								{d.tipo}
							</div>
							<div className='flex-1 h-5 rounded-md bg-muted/60 overflow-hidden relative ring-1 ring-border/50'>
								<div
									className='h-full flex items-center justify-end pr-2 text-[10px] font-semibold text-foreground/80 shadow-sm transition-[width] duration-700 ease-out relative'
									style={{ width, background: `linear-gradient(90deg, ${d.color} 0%, color-mix(in oklab, ${d.color} 86%, white) 100%)` }}
									aria-label={`${d.tipo}: ${d.peso.toLocaleString("pt-BR")} kg (${d.pct.toFixed(1)}%)`}
								>
									{d.pct > 7 && <span className='drop-shadow-sm'>{d.pct.toFixed(0)}%</span>}
									<span className='absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border/60'>
										{d.peso.toLocaleString("pt-BR")} kg • {d.count}x • {d.pct.toFixed(1)}%
									</span>
								</div>
							</div>
							<div className='w-24 text-right text-[10px] font-medium text-foreground tabular-nums'>
								{d.peso.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} kg • {d.count}x
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default TipoVeiculoChart;
