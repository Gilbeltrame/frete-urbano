import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export interface ConfiguracaoSistema {
	tabela: "A" | "B" | "C";
	tipoCarga: "geral" | "neogranel" | "frigorificada" | "perigosa" | "veiculo";
	modalidade: "lotacao" | "carga-parcial";
}

interface ConfiguracoesModalProps {
	configuracao: ConfiguracaoSistema;
	onConfigurationChange: (config: ConfiguracaoSistema) => void;
}

const tabelasInfo = {
	A: {
		nome: "Tabela A",
		descricao: "Carga lotação - Veículo completamente ocupado",
		badge: "Padrão",
	},
	B: {
		nome: "Tabela B",
		descricao: "Carga fracionada - Ocupação parcial do veículo",
		badge: "Fracionada",
	},
	C: {
		nome: "Tabela C",
		descricao: "Cargas especiais - Condições específicas",
		badge: "Especial",
	},
} as const;

const tiposCarga = {
	geral: {
		nome: "Carga Geral",
		descricao: "Mercadorias convencionais sem características especiais",
	},
	neogranel: {
		nome: "Neogranel",
		descricao: "Produtos paletizados, ensacados ou embalados",
	},
	frigorificada: {
		nome: "Carga Frigorificada",
		descricao: "Produtos que necessitam refrigeração",
	},
	perigosa: {
		nome: "Carga Perigosa",
		descricao: "Materiais com riscos especiais de transporte",
	},
	veiculo: {
		nome: "Transporte de Veículos",
		descricao: "Automóveis, motocicletas e similares",
	},
} as const;

const modalidades = {
	lotacao: {
		nome: "Lotação",
		descricao: "Veículo completamente ocupado por um cliente",
	},
	"carga-parcial": {
		nome: "Carga Parcial",
		descricao: "Compartilhamento do veículo entre clientes",
	},
} as const;

export default function ConfiguracoesModal({ configuracao, onConfigurationChange }: ConfiguracoesModalProps) {
	const [localConfig, setLocalConfig] = useState<ConfiguracaoSistema>(configuracao);
	const [isOpen, setIsOpen] = useState(false);

	// Sincronizar com configuração externa quando ela mudar
	useEffect(() => {
		setLocalConfig(configuracao);
	}, [configuracao]);

	const handleSave = () => {
		onConfigurationChange(localConfig);
		setIsOpen(false);
	};

	const handleReset = () => {
		const defaultConfig: ConfiguracaoSistema = {
			tabela: "A",
			tipoCarga: "geral",
			modalidade: "lotacao",
		};
		setLocalConfig(defaultConfig);
	};

	const tabelaAtual = tabelasInfo[localConfig.tabela];
	const cargaAtual = tiposCarga[localConfig.tipoCarga];
	const modalidadeAtual = modalidades[localConfig.modalidade];

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant='outline' size='lg' className='flex items-center gap-2'>
					<Settings className='h-4 w-4' />
					<span className='hidden sm:inline'>Configurações</span>
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-[600px]'>
				<DialogHeader className='text-left'>
					<DialogTitle className='flex items-center gap-2 text-left'>
						<Settings className='h-5 w-5' />
						Configurações do Sistema
					</DialogTitle>
					<DialogDescription className='text-left'>Configure a tabela ANTT, tipo de carga e modalidade de transporte para cálculos precisos</DialogDescription>
				</DialogHeader>

				<div className='space-y-6 py-4'>
					{/* Seleção de Tabela */}
					<div className='space-y-3 text-left'>
						<Label className='text-base font-semibold text-left'>Tabela ANTT</Label>
						<Select value={localConfig.tabela} onValueChange={(value) => setLocalConfig({ ...localConfig, tabela: value as "A" | "B" | "C" })}>
							<SelectTrigger className='w-full text-left'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(tabelasInfo).map(([key, info]) => (
									<SelectItem key={key} value={key}>
										<div className='flex items-center justify-between w-full text-left'>
											<div className='text-left'>
												<span className='font-medium'>{info.nome}</span>
												<p className='text-xs text-muted-foreground text-left'>{info.descricao}</p>
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='flex items-center gap-2 text-left'>
							<Badge variant='secondary' className='bg-primary/10 text-primary border-primary/20'>
								{tabelaAtual.badge}
							</Badge>
							<span className='text-sm text-muted-foreground text-left'>{tabelaAtual.descricao}</span>
						</div>
					</div>

					{/* Tipo de Carga */}
					<div className='space-y-3 text-left'>
						<Label className='text-base font-semibold text-left'>Tipo de Carga</Label>
						<Select value={localConfig.tipoCarga} onValueChange={(value) => setLocalConfig({ ...localConfig, tipoCarga: value as any })}>
							<SelectTrigger className='w-full text-left'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(tiposCarga).map(([key, info]) => (
									<SelectItem key={key} value={key}>
										<div className='text-left'>
											<span className='font-medium'>{info.nome}</span>
											<p className='text-xs text-muted-foreground text-left'>{info.descricao}</p>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='text-sm text-muted-foreground text-left'>{cargaAtual.descricao}</div>
					</div>

					{/* Modalidade */}
					<div className='space-y-3 text-left'>
						<Label className='text-base font-semibold text-left'>Modalidade de Transporte</Label>
						<Select value={localConfig.modalidade} onValueChange={(value) => setLocalConfig({ ...localConfig, modalidade: value as "lotacao" | "carga-parcial" })}>
							<SelectTrigger className='w-full text-left'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(modalidades).map(([key, info]) => (
									<SelectItem key={key} value={key}>
										<div className='text-left'>
											<span className='font-medium'>{info.nome}</span>
											<p className='text-xs text-muted-foreground text-left'>{info.descricao}</p>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='text-sm text-muted-foreground text-left'>{modalidadeAtual.descricao}</div>
					</div>

					{/* Preview da Configuração Atual */}
					<div className='bg-muted/50 p-4 rounded-lg space-y-2 text-left'>
						<h4 className='font-medium text-sm text-left'>Configuração Atual:</h4>
						<div className='flex flex-wrap gap-2 text-left'>
							<Badge variant='outline' className='bg-primary/10 text-primary border-primary/30'>
								Resolução ANTT 5.867/2020
							</Badge>
							<Badge variant='outline' className='bg-secondary/50 text-secondary-foreground border-secondary/60'>
								{tabelaAtual.nome} ({tabelaAtual.badge})
							</Badge>
							<Badge variant='outline' className='bg-accent/50 text-accent-foreground border-accent/60'>
								{cargaAtual.nome}
							</Badge>
							<Badge variant='outline' className='bg-muted text-muted-foreground border-muted-foreground/30'>
								{modalidadeAtual.nome}
							</Badge>
						</div>
					</div>
				</div>

				<DialogFooter className='gap-2'>
					<Button variant='outline' onClick={handleReset}>
						<RotateCcw className='h-4 w-4 mr-2' />
						Restaurar Padrão
					</Button>
					<Button onClick={handleSave}>
						<Save className='h-4 w-4 mr-2' />
						Salvar Configurações
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
