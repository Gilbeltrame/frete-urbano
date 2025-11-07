import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StatusConciliacao } from "@/types";
import { Download, Filter, Search, Trash2 } from "lucide-react";
import React from "react";

interface Props {
	termoPesquisa: string;
	onPesquisaChange: (value: string) => void;
	filtroStatus: StatusConciliacao | "TODOS";
	onFiltroChange: (value: StatusConciliacao | "TODOS") => void;
	onExportar: () => void;
	onLimpar: () => void;
	disabledExport?: boolean;
}

export const ResultadosFiltroPanel: React.FC<Props> = ({ termoPesquisa, onPesquisaChange, filtroStatus, onFiltroChange, onExportar, onLimpar, disabledExport }) => {
	return (
		<div className='flex flex-col sm:flex-row gap-4 mb-4'>
			<div className='flex items-center gap-2 w-full sm:w-auto sm:flex-1'>
				<Search className='h-4 w-4 text-gray-500 shrink-0' />
				<Input
					placeholder='Pesquisar transportadora, placa ou destino...'
					value={termoPesquisa}
					onChange={(e) => onPesquisaChange(e.target.value)}
					className='w-full'
					aria-label='Pesquisar resultados'
				/>
			</div>
			<div className='flex items-center gap-2'>
				<Filter className='h-4 w-4 text-gray-500 shrink-0' />
				<Select value={filtroStatus} onValueChange={(value) => onFiltroChange(value as StatusConciliacao | "TODOS")}>
					<SelectTrigger className='w-[200px]' aria-label='Filtrar por status'>
						<SelectValue placeholder='Filtrar por status' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='TODOS'>Todos os Status</SelectItem>
						<SelectItem value='CONFORME'>Conforme ANTT</SelectItem>
						<SelectItem value='DIVERGENTE'>Necessita Revisão</SelectItem>
						<SelectItem value='ERRO_CALCULO'>Não Conforme</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className='flex gap-2'>
				<Button onClick={onExportar} variant='outline' className='gap-2' disabled={disabledExport} aria-label='Exportar resultados'>
					<Download size={16} />
					Exportar
				</Button>
				<Button onClick={onLimpar} variant='outline' className='gap-2' aria-label='Limpar filtros'>
					<Trash2 size={16} />
					Limpar
				</Button>
			</div>
		</div>
	);
};

export default ResultadosFiltroPanel;
