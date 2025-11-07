export default function SobrePage() {
	return (
		<div className='max-w-3xl mx-auto p-8 space-y-6'>
			<h1 className='text-2xl font-bold'>Sobre a Tabela de Frete ANTT</h1>
			<p className='text-sm text-muted-foreground'>
				A Política Nacional de Pisos Mínimos do Transporte Rodoviário de Cargas (Lei 13.703/2018) surgiu após a paralisação dos caminhoneiros em 2018 para garantir remuneração
				mínima digna, reduzindo a concorrência predatória em cenário de alta de custos (especialmente diesel).
			</p>
			<h2 className='text-xl font-semibold'>Origem</h2>
			<p>
				Após forte oscilação do preço do diesel e excesso de oferta de caminhões, estabeleceu-se uma política de pisos mínimos calculados por quilômetro rodado e eixo carregado
				considerando tipo de carga e distância da viagem.
			</p>
			<h2 className='text-xl font-semibold'>Objetivo</h2>
			<p>Evitar fretes abaixo dos custos operacionais básicos e assegurar sustentabilidade econômica ao transporte rodoviário.</p>
			<h2 className='text-xl font-semibold'>Principais Fatores do Cálculo</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Tipo de carga (geral, neogranel, granel, frigorificada, perigosa, veículos)</li>
				<li>Quantidade de eixos</li>
				<li>Distância (km)</li>
				<li>Componentes econômicos: CCD (custos de deslocamento) e CC (carga/descarga)</li>
				<li>Pedágio (acréscimo à parte quando houver)</li>
				<li>Retorno vazio (ajuste quando não há carga de volta)</li>
			</ul>
			<h2 className='text-xl font-semibold'>Custos Embutidos</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Depreciação e remuneração de capital</li>
				<li>Tributos e documentação</li>
				<li>Seguro casco</li>
				<li>Combustível / ARLA 32</li>
				<li>Manutenção (pneus, peças, lubrificantes)</li>
			</ul>
			<h2 className='text-xl font-semibold'>Fórmula Básica</h2>
			<pre className='rounded-md bg-muted p-4 text-sm'>Piso Mínimo (R$/viagem) = (Distância × CCD) + CC [+ Pedágio] [+ Ajuste Retorno]</pre>
			<h2 className='text-xl font-semibold'>Penalidades</h2>
			<p>Pagamentos abaixo do piso podem gerar multas e indenização: diferença paga em dobro conforme Lei 13.703/2018.</p>
			<h2 className='text-xl font-semibold'>Como o Sistema Usa Isso</h2>
			<p>
				A calculadora aplica CCD/CC de acordo com modalidade, tipo de carga e tabela selecionada. Permite adicionar pedágio e retorno vazio; em lote valida linhas e classifica
				conformidade.
			</p>
		</div>
	);
}
