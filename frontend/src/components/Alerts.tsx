import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AlertsProps {
	erro: string | null;
	sucesso: string | null;
}

export function Alerts({ erro, sucesso }: AlertsProps) {
	if (!erro && !sucesso) return null;

	const baseCard = "relative overflow-hidden backdrop-blur-sm border transition-colors shadow-sm rounded-xl animate-in fade-in slide-in-from-top-2 duration-300";
	const iconWrapper = "flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset";

	return (
		<div className='space-y-2'>
			{erro && (
				<Card
					className={cn(
						baseCard,
						"border-destructive/40 bg-destructive/5 before:absolute before:inset-0 before:bg-gradient-to-br before:from-destructive/10 before:to-transparent"
					)}
				>
					<CardContent className='pt-3'>
						<div className='flex items-start gap-3'>
							<div className={cn(iconWrapper, "bg-destructive/10 text-destructive ring-destructive/40")}>
								{" "}
								<AlertCircle className='h-5 w-5' />{" "}
							</div>
							<div className='flex-1 space-y-1'>
								<p className='text-destructive font-semibold tracking-tight'>Erro</p>
								<p className='text-destructive/80 text-sm leading-relaxed'>{erro}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{sucesso && !erro && (
				<Card
					className={cn(
						baseCard,
						"border-emerald-500/40 bg-emerald-500/5 before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-400/10 before:to-transparent"
					)}
				>
					<CardContent className='pt-3'>
						<div className='flex items-start gap-3'>
							<div className={cn(iconWrapper, "bg-emerald-500/10 text-emerald-600 ring-emerald-400/40")}>
								{" "}
								<CheckCircle2 className='h-5 w-5' />{" "}
							</div>
							<div className='flex-1 space-y-1'>
								<p className='text-emerald-600 font-semibold tracking-tight'>Sucesso</p>
								<p className='text-emerald-700/80 text-sm leading-relaxed'>{sucesso}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
