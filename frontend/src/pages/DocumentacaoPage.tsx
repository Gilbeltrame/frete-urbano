import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfiguracao } from "@/contexts/ConfiguracaoContext";
import { AlertCircle, Book, Calculator, CheckCircle, DollarSign, ExternalLink, FileText, Info, Route, Settings } from "lucide-react";

export default function DocumentacaoPage() {
	const { configuracao } = useConfiguracao();
	return (
		<div className='p-6 max-w-5xl mx-auto space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4 py-6'>
				<div className='flex justify-center'>
					<div className='p-4 bg-blue-100 rounded-2xl'>
						<FileText className='h-12 w-12 text-blue-600' />
					</div>
				</div>
				<h1 className='text-3xl font-bold'>Documentação</h1>
				<p className='text-lg text-muted-foreground'>Guia completo para usar o Sistema ULog de Frete ANTT</p>
			</div>

			{/* Guia Rápido */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<CheckCircle className='h-5 w-5 text-green-500' />
						Guia Rápido
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid md:grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<h4 className='font-semibold'>1. Escolha o Modo de Cálculo</h4>
							<p className='text-sm text-muted-foreground'>
								• <strong>Origem/Destino:</strong> Calcule automaticamente a distância entre dois pontos
								<br />• <strong>Distância Manual:</strong> Informe diretamente a quilometragem
							</p>
						</div>
						<div className='space-y-4'>
							<h4 className='font-semibold'>2. Configure os Parâmetros</h4>
							<p className='text-sm text-muted-foreground'>
								• Número de eixos do veículo
								<br />
								• Quantidade de lotes
								<br />
								• Retorno vazio (se aplicável)
								<br />• Valores de pedágio
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Modos de Cálculo */}
			<div className='grid md:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Route className='h-5 w-5 text-blue-500' />
							Cálculo por Origem/Destino
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-3'>
							<div>
								<h5 className='font-medium'>Por CEP</h5>
								<p className='text-sm text-muted-foreground'>Digite o CEP de origem e destino no formato 00000-000</p>
							</div>
							<div>
								<h5 className='font-medium'>Por Cidade/UF</h5>
								<p className='text-sm text-muted-foreground'>Selecione as cidades de origem e destino usando o campo de busca</p>
							</div>
						</div>
						<div className='bg-blue-50 p-3 rounded-lg'>
							<div className='flex items-start gap-2'>
								<Info className='h-4 w-4 text-blue-600 mt-0.5' />
								<div className='text-sm'>
									<p className='font-medium text-blue-900'>Dica</p>
									<p className='text-blue-700'>Use o botão "Calcular Rota" para obter automaticamente a distância real entre os pontos</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Calculator className='h-5 w-5 text-purple-500' />
							Distância Manual
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<p className='text-sm text-muted-foreground'>Quando você já conhece a distância total da viagem, pode informá-la diretamente no campo "Distância Total".</p>
						<div className='space-y-2'>
							<h5 className='font-medium'>Quando usar:</h5>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Rotas já conhecidas</li>
								<li>• Múltiplas paradas no trajeto</li>
								<li>• Distâncias obtidas de outros sistemas</li>
							</ul>
						</div>
						<div className='bg-purple-50 p-3 rounded-lg'>
							<div className='flex items-start gap-2'>
								<Info className='h-4 w-4 text-purple-600 mt-0.5' />
								<div className='text-sm'>
									<p className='font-medium text-purple-900'>Formato</p>
									<p className='text-purple-700'>Digite apenas números, usando ponto para decimais (ex: 850.5)</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Configurações */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='h-5 w-5 text-orange-500' />
						Configurações do Veículo
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid md:grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<div>
								<h4 className='font-semibold mb-2'>Número de Eixos</h4>
								<p className='text-sm text-muted-foreground mb-3'>Selecione a quantidade de eixos do veículo que fará o transporte:</p>
								<div className='space-y-1 text-sm'>
									<div className='flex justify-between'>
										<span>2 eixos</span>
										<Badge variant='secondary'>Caminhão leve</Badge>
									</div>
									<div className='flex justify-between'>
										<span>3 eixos</span>
										<Badge variant='secondary'>Caminhão médio</Badge>
									</div>
									<div className='flex justify-between'>
										<span>4-5 eixos</span>
										<Badge variant='secondary'>Caminhão pesado</Badge>
									</div>
									<div className='flex justify-between'>
										<span>6-9 eixos</span>
										<Badge variant='secondary'>Carreta/Bitrem</Badge>
									</div>
								</div>
							</div>
						</div>
						<div className='space-y-4'>
							<div>
								<h4 className='font-semibold mb-2'>Outros Parâmetros</h4>
								<div className='space-y-3'>
									<div>
										<h5 className='font-medium'>Número de Lotes</h5>
										<p className='text-sm text-muted-foreground'>Quantidade de lotes/cargas que serão transportados na viagem</p>
									</div>
									<div>
										<h5 className='font-medium'>Retorno Vazio</h5>
										<p className='text-sm text-muted-foreground'>Quilometragem adicional caso o veículo retorne sem carga</p>
									</div>
									<div>
										<h5 className='font-medium'>Pedágio</h5>
										<p className='text-sm text-muted-foreground'>Valor total dos pedágios da rota (ida e volta)</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Resultado */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<DollarSign className='h-5 w-5 text-green-500' />
						Interpretando o Resultado
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<p className='text-muted-foreground'>O resultado exibe o detalhamento completo do cálculo do frete mínimo:</p>
						<div className='grid md:grid-cols-2 gap-6'>
							<div className='space-y-3'>
								<div>
									<h5 className='font-medium'>Valor Base</h5>
									<p className='text-sm text-muted-foreground'>Valor calculado conforme a tabela ANTT para a distância e número de eixos</p>
								</div>
								<div>
									<h5 className='font-medium'>Retorno Vazio</h5>
									<p className='text-sm text-muted-foreground'>Adicional calculado sobre a quilometragem de retorno sem carga</p>
								</div>
							</div>
							<div className='space-y-3'>
								<div>
									<h5 className='font-medium'>Pedágio</h5>
									<p className='text-sm text-muted-foreground'>Valor dos pedágios informado pelo usuário</p>
								</div>
								<div>
									<h5 className='font-medium'>Total</h5>
									<p className='text-sm text-muted-foreground'>Soma de todos os componentes - valor mínimo legal do frete</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Legislação */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Book className='h-5 w-5 text-indigo-500' />
						Base Legal
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='bg-indigo-50 p-4 rounded-lg'>
						<h4 className='font-semibold text-indigo-900 mb-2'>Resolução ANTT 5.867/2020</h4>
						<p className='text-sm text-indigo-700 mb-3'>Estabelece a metodologia para cálculo do piso mínimo do frete rodoviário de cargas.</p>
						<Button variant='outline' size='sm' asChild>
							<a href='https://www.gov.br/antt/pt-br' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2'>
								<ExternalLink className='h-3 w-3' />
								Ver Legislação Original
							</a>
						</Button>
					</div>
					<div className='grid md:grid-cols-3 gap-4'>
						<Badge variant='secondary' className='bg-green-100 text-green-800 p-3 justify-center'>
							Tabela {configuracao.tabela} ({configuracao.modalidade === "lotacao" ? "Lotação" : "Carga Parcial"})
						</Badge>
						<Badge variant='secondary' className='bg-blue-100 text-blue-800 p-3 justify-center'>
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
						<Badge variant='secondary' className='bg-purple-100 text-purple-800 p-3 justify-center'>
							Valores Oficiais
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Importante */}
			<Card className='border-amber-200 bg-amber-50'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-amber-800'>
						<AlertCircle className='h-5 w-5' />
						Importante
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2 text-amber-700'>
						<p>
							• O sistema ULog fornece o valor do <strong>frete mínimo oficial</strong> conforme a legislação
						</p>
						<p>• Os valores são calculados automaticamente com base na Resolução ANTT 5.867/2020</p>
						<p>• Para casos específicos ou dúvidas sobre a legislação, consulte sempre um profissional especializado</p>
						<p>• A ferramenta é fornecida como referência e não substitui a consulta à legislação oficial</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
