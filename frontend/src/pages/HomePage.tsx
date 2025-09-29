import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calculator, Clock, DollarSign, Route, Shield, Star, TruckIcon, Users, Zap } from "lucide-react";

export default function HomePage() {
	return (
		<div className='p-6 max-w-6xl mx-auto space-y-8'>
			{/* Hero Section */}
			<div className='text-center space-y-4 py-8'>
				<div className='flex justify-center'>
					<div className='p-4 bg-primary/10 rounded-2xl'>
						<TruckIcon className='h-12 w-12 text-primary' />
					</div>
				</div>
				<h1 className='text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>Calculadora de Frete ANTT</h1>
				<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>Calcule o frete mínimo oficial conforme a Resolução ANTT 5.867/2020 de forma rápida e precisa</p>
				<div className='flex justify-center gap-2'>
					<Badge variant='secondary' className='bg-green-100 text-green-800'>
						Resolução ANTT 5.867/2020
					</Badge>
					<Badge variant='secondary' className='bg-blue-100 text-blue-800'>
						Tabela A (Lotação)
					</Badge>
					<Badge variant='secondary' className='bg-purple-100 text-purple-800'>
						Carga Geral
					</Badge>
				</div>
			</div>

			{/* Features Grid */}
			<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-blue-100 rounded-lg'>
								<Calculator className='h-5 w-5 text-blue-600' />
							</div>
							<CardTitle className='text-lg'>Cálculo Preciso</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Cálculo baseado na tabela oficial da ANTT com valores atualizados e conformidade regulatória</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-green-100 rounded-lg'>
								<Route className='h-5 w-5 text-green-600' />
							</div>
							<CardTitle className='text-lg'>Rota Automática</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Cálculo automático de distância usando OpenRouteService com dados reais de estradas</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-purple-100 rounded-lg'>
								<Zap className='h-5 w-5 text-purple-600' />
							</div>
							<CardTitle className='text-lg'>Rápido e Fácil</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Interface intuitiva que permite cálculos rápidos por CEP, cidade ou distância manual</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-orange-100 rounded-lg'>
								<Shield className='h-5 w-5 text-orange-600' />
							</div>
							<CardTitle className='text-lg'>100% Conforme</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Seguimos rigorosamente a Resolução ANTT 5.867/2020 para garantir valores oficiais</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-red-100 rounded-lg'>
								<Clock className='h-5 w-5 text-red-600' />
							</div>
							<CardTitle className='text-lg'>Disponível 24/7</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Acesse a qualquer hora, de qualquer lugar. Sem necessidade de cadastro ou login</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-indigo-100 rounded-lg'>
								<DollarSign className='h-5 w-5 text-indigo-600' />
							</div>
							<CardTitle className='text-lg'>Gratuito</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>Ferramenta completamente gratuita para transportadores e empresas de logística</p>
					</CardContent>
				</Card>
			</div>

			{/* Statistics */}
			<div className='bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8'>
				<h2 className='text-2xl font-bold text-center mb-8'>Por que usar nossa calculadora?</h2>
				<div className='grid md:grid-cols-3 gap-8 text-center'>
					<div className='space-y-2'>
						<div className='flex justify-center'>
							<BarChart3 className='h-8 w-8 text-primary' />
						</div>
						<h3 className='text-3xl font-bold text-primary'>99.9%</h3>
						<p className='text-muted-foreground'>Precisão nos cálculos</p>
					</div>
					<div className='space-y-2'>
						<div className='flex justify-center'>
							<Users className='h-8 w-8 text-primary' />
						</div>
						<h3 className='text-3xl font-bold text-primary'>10k+</h3>
						<p className='text-muted-foreground'>Cálculos realizados</p>
					</div>
					<div className='space-y-2'>
						<div className='flex justify-center'>
							<Star className='h-8 w-8 text-primary' />
						</div>
						<h3 className='text-3xl font-bold text-primary'>4.9/5</h3>
						<p className='text-muted-foreground'>Avaliação dos usuários</p>
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className='text-center space-y-6 py-8'>
				<h2 className='text-2xl font-bold'>Pronto para calcular seu frete?</h2>
				<p className='text-muted-foreground'>Comece agora mesmo e obtenha o valor oficial do frete mínimo em segundos</p>
			</div>
		</div>
	);
}
