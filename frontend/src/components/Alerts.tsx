import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AlertsProps {
	erro: string | null;
	sucesso: string | null;
}

export function Alerts({ erro, sucesso }: AlertsProps) {
	if (!erro && !sucesso) return null;

	return (
		<>
			{erro && (
				<Card className='border-destructive/50 bg-destructive/5'>
					<CardContent className='pt-1'>
						<div className='flex items-center gap-3'>
							<AlertCircle className='h-5 w-5 text-destructive' />
							<div className='flex-1'>
								<p className='text-destructive font-medium'>Erro</p>
								<p className='text-destructive/80 text-sm'>{erro}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{sucesso && !erro && (
				<Card className='border-secondary bg-secondary/20 py-1'>
					<CardContent className='pt-1'>
						<div className='flex items-center gap-3'>
							<CheckCircle2 className='h-5 w-5 text-secondary-foreground' />
							<div className='flex-1'>
								<p className='text-secondary-foreground font-medium'>Sucesso</p>
								<p className='text-secondary-foreground/80 text-sm'>{sucesso}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
}
