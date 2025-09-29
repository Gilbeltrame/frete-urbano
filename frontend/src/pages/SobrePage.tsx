import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Database, ExternalLink, Github, Heart, Shield, TruckIcon, Users, Zap } from "lucide-react";

export default function SobrePage() {
	return (
		<div className='p-6 max-w-4xl mx-auto space-y-8'>
			{/* Hero Section */}
			<div className='text-center space-y-4 py-8'>
				<div className='flex justify-center'>
					<div className='p-4 bg-primary/10 rounded-2xl'>
						<TruckIcon className='h-12 w-12 text-primary' />
					</div>
				</div>
				<h1 className='text-3xl font-bold'>Sobre a Calculadora de Frete ANTT</h1>
				<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>Uma ferramenta gratuita e precisa para calcular o frete mínimo oficial conforme a legislação brasileira</p>
			</div>

			{/* Missão */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Heart className='h-5 w-5 text-red-500' />
						Nossa Missão
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<p className='text-muted-foreground'>
						Democratizar o acesso ao cálculo correto do frete mínimo, oferecendo uma ferramenta gratuita, precisa e fácil de usar para transportadores, empresas de logística e
						profissionais do setor.
					</p>
					<p className='text-muted-foreground'>
						Acreditamos que todos devem ter acesso às informações necessárias para calcular o frete de forma justa e conforme a legislação vigente, sem a necessidade de sistemas
						complexos ou pagos.
					</p>
				</CardContent>
			</Card>

			{/* Características */}
			<div className='grid md:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5 text-green-500' />
							100% Conforme
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground mb-4'>
							Nossa calculadora segue rigorosamente a Resolução ANTT 5.867/2020, garantindo que os valores calculados estejam sempre em conformidade com a legislação oficial.
						</p>
						<div className='space-y-2'>
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Zap className='h-5 w-5 text-yellow-500' />
							Tecnologia Moderna
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground mb-4'>Utilizamos tecnologias modernas para oferecer uma experiência rápida, responsiva e confiável.</p>
						<div className='space-y-2'>
							<div className='flex items-center gap-2 text-sm'>
								<Code className='h-4 w-4' />
								<span>React + TypeScript</span>
							</div>
							<div className='flex items-center gap-2 text-sm'>
								<Database className='h-4 w-4' />
								<span>OpenRouteService API</span>
							</div>
							<div className='flex items-center gap-2 text-sm'>
								<Zap className='h-4 w-4' />
								<span>Interface moderna com Tailwind CSS</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Funcionalidades */}
			<Card>
				<CardHeader>
					<CardTitle>Principais Funcionalidades</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid md:grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<h4 className='font-semibold'>Cálculo por Origem/Destino</h4>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>• Busca por CEP ou cidade/UF</li>
								<li>• Cálculo automático de rota</li>
								<li>• Integração com OpenRouteService</li>
								<li>• Dados reais de estradas brasileiras</li>
							</ul>
						</div>
						<div className='space-y-4'>
							<h4 className='font-semibold'>Configurações Avançadas</h4>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>• Suporte a veículos de 2 a 9 eixos</li>
								<li>• Cálculo de múltiplos lotes</li>
								<li>• Retorno vazio configurável</li>
								<li>• Pedágios personalizados</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Equipe */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5 text-blue-500' />
						Desenvolvido com ❤️
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<p className='text-muted-foreground'>
						Esta ferramenta foi desenvolvida por profissionais apaixonados por tecnologia e logística, com o objetivo de contribuir para a transparência e eficiência do setor de
						transportes no Brasil.
					</p>
					<div className='flex gap-4'>
						<Button variant='outline' asChild>
							<a href='https://github.com' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2'>
								<Github className='h-4 w-4' />
								Ver no GitHub
								<ExternalLink className='h-3 w-3' />
							</a>
						</Button>
						<Button variant='outline' disabled>
							<Heart className='h-4 w-4 mr-2' />
							Apoie o Projeto
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Licença */}
			<Card>
				<CardHeader>
					<CardTitle>Licença e Uso</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>
						Esta ferramenta é disponibilizada gratuitamente para uso pessoal e comercial. Os cálculos são baseados na legislação oficial e devem ser utilizados como referência.
						Recomendamos sempre consultar a legislação vigente e profissionais especializados para casos específicos.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
