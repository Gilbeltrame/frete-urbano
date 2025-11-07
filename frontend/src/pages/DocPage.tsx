export default function DocPage() {
	return (
		<div className='max-w-3xl mx-auto p-8 space-y-6'>
			<h1 className='text-2xl font-bold'>Documentação do Sistema</h1>
			<h2 className='text-xl font-semibold'>Fluxos Principais</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Cálculo individual de frete mínimo ANTT</li>
				<li>Distância automática via serviço de rota (origem/destino) ou distância manual</li>
				<li>Conciliação em lote (upload → processamento assíncrono → resultado)</li>
				<li>Exportação de resultados e logs</li>
			</ul>
			<h2 className='text-xl font-semibold'>Componentes Chave</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Modal de configurações (tabela, modalidade, tipo de carga)</li>
				<li>Serviço de rotas com cache e métricas</li>
				<li>Worker para conciliação de planilhas</li>
				<li>Hooks especializados (cálculo, rota, conciliação, limites)</li>
			</ul>
			<h2 className='text-xl font-semibold'>Campos do Cálculo</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Origem e destino (CEP ou cidade/UF) ou distância total</li>
				<li>Tipo de carga / modalidade / tabela</li>
				<li>Número de eixos e lotes</li>
				<li>Pedágio e retorno vazio</li>
			</ul>
			<h2 className='text-xl font-semibold'>Saída</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Valor piso mínimo</li>
				<li>Componentes: base, retorno, pedágio</li>
				<li>Classificação de conformidade (lote)</li>
			</ul>
			<h2 className='text-xl font-semibold'>Limites</h2>
			<p className='text-sm'>Processamento em lote limitado a 200 linhas por operação (demais são truncadas).</p>
			<h2 className='text-xl font-semibold'>Boas Práticas</h2>
			<ul className='list-disc pl-6 space-y-1 text-sm'>
				<li>Validar CEPs ou cidades antes de iniciar rota automática</li>
				<li>Adicionar pedágio apenas quando o percurso efetivamente tiver praças</li>
				<li>Retorno vazio: aplicar somente quando não houver carga na volta</li>
				<li>Exportar resultados para registro e auditoria</li>
			</ul>
			<h2 className='text-xl font-semibold'>Observação Legal</h2>
			<p className='text-sm'>
				Os valores calculados seguem metodologia da Resolução ANTT vigente e servem como referência operacional. Sempre consulte a legislação oficial para casos específicos.
			</p>
		</div>
	);
}
