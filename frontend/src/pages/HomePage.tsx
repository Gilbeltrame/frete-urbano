import UlogIcon from "@/components/UlogIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfiguracao } from "@/contexts/ConfiguracaoContext";
import { Calculator, Clock, DollarSign, Route, Shield, Zap } from "lucide-react";

export default function HomePage() {
	const { configuracao } = useConfiguracao();
	return (
		<div className='p-6 max-w-6xl mx-auto space-y-8'>
			{/* Hero Section */}
			<div className='text-center space-y-4 py-8'>
				<div className='flex justify-center'>
					<div className='p-1 bg-primary/10 rounded-2xl'>
						<UlogIcon className='text-primary' size={80} />
					</div>
				</div>
				<h1 className='text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>ULog - Sistema de Frete ANTT</h1>
				<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
					Calcule o frete mínimo oficial conforme a Resolução ANTT 5.867/2020 com a precisão e confiabilidade da ULog
				</p>
				<div className='flex justify-center gap-2'>
					<Badge variant='secondary' className='bg-primary/10 text-primary border-primary/20'>
						Resolução ANTT 5.867/2020
					</Badge>
					<Badge variant='secondary' className='bg-secondary/80 text-secondary-foreground border-secondary'>
						Tabela {configuracao.tabela} ({configuracao.modalidade === "lotacao" ? "Lotação" : "Carga Parcial"})
					</Badge>
					<Badge variant='secondary' className='bg-accent/80 text-accent-foreground border-accent'>
						{configuracao.tipoCarga === "geral"
							? "Carga Geral"
							: configuracao.tipoCarga === "neogranel"
							? "Neogranel"
							: configuracao.tipoCarga === "frigorificada"
							? "Carga Frigorificada"
							: configuracao.tipoCarga === "perigosa"
							? "Carga Perigosa"
							: "Transporte de Veículos"}
					</Badge>
				</div>
			</div>

			{/* Features Grid */}
			<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
				<Card className='hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								<Calculator className='h-5 w-5 text-primary' />
							</div>
							<CardTitle className='text-lg'>Cálculo Preciso</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Cálculo baseado na tabela oficial da ANTT com valores atualizados e conformidade regulatória</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow border-secondary/40 hover:border-secondary'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-secondary/30 rounded-lg'>
								<Route className='h-5 w-5 text-secondary-foreground' />
							</div>
							<CardTitle className='text-lg'>Rota Automática</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Cálculo automático de distância usando OpenRouteService com dados reais de estradas</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow border-accent/40 hover:border-accent'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-accent/30 rounded-lg'>
								<Zap className='h-5 w-5 text-accent-foreground' />
							</div>
							<CardTitle className='text-lg'>Rápido e Fácil</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Interface intuitiva que permite cálculos rápidos por CEP, cidade ou distância manual</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow border-muted hover:border-muted-foreground/30'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-muted rounded-lg'>
								<Shield className='h-5 w-5 text-muted-foreground' />
							</div>
							<CardTitle className='text-lg'>100% Conforme</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Seguimos rigorosamente a Resolução ANTT 5.867/2020 para garantir valores oficiais</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								<Clock className='h-5 w-5 text-primary' />
							</div>
							<CardTitle className='text-lg'>Disponível 24/7</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Acesse a qualquer hora, de qualquer lugar. Sem necessidade de cadastro ou login</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow border-secondary/40 hover:border-secondary'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-secondary/30 rounded-lg'>
								<DollarSign className='h-5 w-5 text-secondary-foreground' />
							</div>
							<CardTitle className='text-lg'>Gratuito</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Ferramenta completamente gratuita para transportadores e empresas de logística</p>
					</CardContent>
				</Card>
			</div>

			{/* CTA Section */}
			<div className='text-center space-y-6 py-8'>
				<h2 className='text-2xl font-bold'>Pronto para calcular seu frete?</h2>
				<p className='text-muted-foreground'>Comece agora mesmo e obtenha o valor oficial do frete mínimo em segundos</p>
			</div>
		</div>
	);
}
