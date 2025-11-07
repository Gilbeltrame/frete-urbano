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
		descricao: "",
		badge: "Padrão",
	},
	B: {
		nome: "Tabela B",
		descricao: "",
		badge: "Fracionada",
	},
	/* C: {
		nome: "Tabela C",
		descricao: "Cargas especiais - Condições específicas",
		badge: "Especial",
	}, */
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
				<Button variant='outline' size='lg' className='flex items-center gap-2 rounded-xl backdrop-blur-sm hover:bg-muted/40'>
					<Settings className='h-4 w-4' />
					<span className='hidden sm:inline'>Configurações</span>
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-[640px] rounded-2xl border-muted/40 bg-gradient-to-br from-background via-background to-muted/30 backdrop-blur-xl shadow-lg'>
				<DialogHeader className='text-left pb-2'>
					<DialogTitle className='flex items-center gap-2 text-left text-lg font-semibold tracking-tight'>
						<Settings className='h-5 w-5 text-muted-foreground' />
						Configurações do Sistema
					</DialogTitle>
					<DialogDescription className='text-left text-sm text-muted-foreground'>
						Ajuste tabela ANTT, tipo de carga e modalidade de transporte para cálculos precisos e contexto regulatório.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-8 py-4'>
					{/* Seleção de Tabela */}
					<div className='space-y-3'>
						<Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Tabela ANTT</Label>
						<Select value={localConfig.tabela} onValueChange={(value) => setLocalConfig({ ...localConfig, tabela: value as "A" | "B" | "C" })}>
							<SelectTrigger className='w-full rounded-md bg-background/70 backdrop-blur-sm border-muted focus:ring-1 focus:ring-primary/40'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className='rounded-md backdrop-blur-sm'>
								{Object.entries(tabelasInfo).map(([key, info]) => (
									<SelectItem key={key} value={key} className='text-sm data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary'>
										<div className='flex items-center justify-between w-full'>
											<div>
												<span className='font-medium'>{info.nome}</span>
												{info.descricao && <p className='text-xs text-muted-foreground'>{info.descricao}</p>}
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='flex items-center gap-2'>
							<Badge variant='secondary' className='bg-primary/10 text-primary border-primary/20 rounded-md'>
								{tabelaAtual.badge}
							</Badge>
							{tabelaAtual.descricao && <span className='text-xs text-muted-foreground'>{tabelaAtual.descricao}</span>}
						</div>
					</div>

					{/* Tipo de Carga */}
					<div className='space-y-3'>
						<Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Tipo de Carga</Label>
						<Select value={localConfig.tipoCarga} onValueChange={(value) => setLocalConfig({ ...localConfig, tipoCarga: value as any })}>
							<SelectTrigger className='w-full rounded-md bg-background/70 backdrop-blur-sm border-muted focus:ring-1 focus:ring-primary/40 text-left'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className='rounded-md backdrop-blur-sm'>
								{Object.entries(tiposCarga).map(([key, info]) => (
									<SelectItem key={key} value={key} className='text-sm data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary'>
										<div>
											<span className='font-medium'>{info.nome}</span>
											<p className='text-xs text-muted-foreground'>{info.descricao}</p>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='text-xs text-muted-foreground'>{cargaAtual.descricao}</div>
					</div>

					{/* Modalidade */}
					<div className='space-y-3'>
						<Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Modalidade de Transporte</Label>
						<Select value={localConfig.modalidade} onValueChange={(value) => setLocalConfig({ ...localConfig, modalidade: value as "lotacao" | "carga-parcial" })}>
							<SelectTrigger className='w-full rounded-md bg-background/70 backdrop-blur-sm border-muted focus:ring-1 focus:ring-primary/40 text-left'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className='rounded-md backdrop-blur-sm'>
								{Object.entries(modalidades).map(([key, info]) => (
									<SelectItem key={key} value={key} className='text-sm data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary'>
										<div>
											<span className='font-medium'>{info.nome}</span>
											<p className='text-xs text-muted-foreground'>{info.descricao}</p>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='text-xs text-muted-foreground'>{modalidadeAtual.descricao}</div>
					</div>

					{/* Preview da Configuração Atual */}
					<div className='p-4 rounded-xl border border-muted/40 bg-muted/20 backdrop-blur-sm space-y-2'>
						<h4 className='font-medium text-xs uppercase tracking-wide text-muted-foreground'>Resumo Atual</h4>
						<div className='flex flex-wrap gap-2'>
							<Badge variant='outline' className='bg-primary/10 text-primary border-primary/30 rounded-md'>
								Resolução ANTT 5.867/2020
							</Badge>
							<Badge variant='outline' className='bg-secondary/50 text-secondary-foreground border-secondary/40 rounded-md'>
								{tabelaAtual.nome} ({tabelaAtual.badge})
							</Badge>
							<Badge variant='outline' className='bg-accent/40 text-accent-foreground border-accent/40 rounded-md'>
								{cargaAtual.nome}
							</Badge>
							<Badge variant='outline' className='bg-muted text-muted-foreground border-muted-foreground/20 rounded-md'>
								{modalidadeAtual.nome}
							</Badge>
						</div>
					</div>
				</div>

				<DialogFooter className='gap-2 pt-2'>
					<Button variant='outline' onClick={handleReset} className='rounded-md'>
						<RotateCcw className='h-4 w-4 mr-2' />
						Restaurar Padrão
					</Button>
					<Button onClick={handleSave} className='rounded-md'>
						<Save className='h-4 w-4 mr-2' />
						Salvar Configurações
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
