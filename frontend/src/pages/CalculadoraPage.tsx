import { Alerts } from "@/components/Alerts";
import { CityCombobox } from "@/components/CityCombobox";
import RouteMap from "@/components/RouteMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfiguracao } from "@/contexts/ConfiguracaoContext";
import { useFreteForm } from "@/hooks/useFreteForm";
import type { LocalMode, ModoDistancia } from "@/types";
import { Calculator, DollarSign, Info, Loader2, MapPin, Navigation, Route, Ruler, Settings, Zap } from "lucide-react";

export default function CalculadoraPage() {
	const { configuracao } = useConfiguracao();
	const {
		form,
		alerts,
		rotaInfo,
		distanciaEscolhidaKm,
		isCalculatingFrete,
		isCalculatingRoute,
		freteResult,
		handleCalculateRoute,
		handleCalculateFrete,
		utils: { brl },
	} = useFreteForm();

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = form;

	const watchedValues = watch();

	const onSubmit = async (data: any) => {
		try {
			await handleCalculateFrete(data);
		} catch (error) {
			// Error is handled in the hook
		}
	};

	return (
		<div className='h-full overflow-auto bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative'>
			<div className='pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_center,white,transparent)] bg-[linear-gradient(120deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0)_70%)] dark:bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_70%)]'></div>
			{/* Alerts no topo */}
			<div className='p-6 pb-2 relative'>
				<Alerts erro={alerts.erro} sucesso={alerts.sucesso} />
			</div>

			{/* Configurações Ativas */}
			<div className='px-6 pb-2'>
				<Card className='py-3 backdrop-blur-sm bg-white/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow'>
					<CardContent>
						<div className='flex items-center gap-4'>
							<div className='p-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/30 text-primary shadow-inner'>
								<Info className='h-4 w-4 text-primary' />
							</div>
							<div className='flex-1'>
								<h3 className='text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-100'>Configuração Ativa</h3>
								<div className='flex flex-wrap gap-2 mt-1'>
									<Badge variant='secondary' className='bg-primary/10 text-primary border-primary/20 text-xs'>
										Tabela {configuracao.tabela}
									</Badge>
									<Badge variant='secondary' className='bg-secondary/80 text-secondary-foreground border-secondary text-xs'>
										{configuracao.modalidade === "lotacao" ? "Lotação" : "Carga Parcial"}
									</Badge>
									<Badge variant='secondary' className='bg-accent/80 text-accent-foreground border-accent text-xs'>
										{configuracao.tipoCarga === "geral"
											? "Carga Geral"
											: configuracao.tipoCarga === "neogranel"
											? "Neogranel"
											: configuracao.tipoCarga === "frigorificada"
											? "Frigorificada"
											: configuracao.tipoCarga === "perigosa"
											? "Perigosa"
											: "Veículos"}
									</Badge>
								</div>
							</div>
							<p className='text-xs text-neutral-500 dark:text-neutral-400 italic'>Use o painel de configurações para alterar parâmetros.</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Layout Principal */}
			<div className='p-6 pt-2'>
				<form onSubmit={handleSubmit(onSubmit)} className='h-full'>
					<div className='grid grid-cols-1 gap-6'>
						{/* Painel Esquerdo - Dados de Entrada */}

						{/* Painel Direito - Configurações e Resultado */}
						<div className='space-y-4'>
							{/* Informações da Rota */}
							<div className=' space-y-4'>
								{/* Tabs Horizontal Compacto */}
								<Tabs value={watchedValues.modo} onValueChange={(v) => setValue("modo", v as ModoDistancia)} className='h-full flex flex-col'>
									<TabsList className='grid grid-cols-2 h-11 mb-5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 p-1 shadow-inner'>
										<TabsTrigger
											value='origemdestino'
											className='flex items-center gap-2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-900 transition'
										>
											<Route className='h-4 w-4' />
											Origem/Destino
										</TabsTrigger>
										<TabsTrigger
											value='km'
											className='flex items-center gap-2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-900 transition'
										>
											<Ruler className='h-4 w-4' />
											Distância Manual
										</TabsTrigger>
									</TabsList>

									{/* Origem/Destino - Layout Horizontal */}
									<TabsContent value='origemdestino' className='flex-1 space-y-4'>
										<div className='grid grid-cols-2 gap-4 h-[50%]'>
											{/* ORIGEM */}
											<Card className='p-5 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow'>
												<div className='space-y-3'>
													<div className='flex items-center gap-2'>
														<Navigation className='h-4 w-4 text-primary' />
														<Label className='text-sm font-semibold text-primary'>Origem</Label>
													</div>
													<RadioGroup className='flex items-center gap-4' value={watchedValues.origemMode} onValueChange={(v) => setValue("origemMode", v as LocalMode)}>
														<div className='flex items-center space-x-2'>
															<RadioGroupItem value='cep' id='origem-cep' />
															<Label htmlFor='origem-cep' className='text-xs'>
																CEP
															</Label>
														</div>
														<div className='flex items-center space-x-2'>
															<RadioGroupItem value='cidade' id='origem-cidade' />
															<Label htmlFor='origem-cidade' className='text-xs'>
																Cidade/UF
															</Label>
														</div>
													</RadioGroup>
													{watchedValues.origemMode === "cep" ? (
														<Input placeholder='Ex.: 74000-000' {...register("origemCep")} className='h-10 border-primary/30 focus:border-primary' />
													) : (
														<CityCombobox
															value={watchedValues.origemCidade || ""}
															onValueChange={(value) => {
																setValue("origemCidade", value);
																if (value) form.clearErrors("modo");
															}}
															placeholder='Selecione a cidade de origem'
															className='border-primary/30 focus:border-primary'
														/>
													)}
												</div>
											</Card>

											{/* DESTINO */}
											<Card className='p-5 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow'>
												<div className='space-y-3'>
													<div className='flex items-center gap-2'>
														<MapPin className='h-4 w-4 text-accent-foreground' />
														<Label className='text-sm font-semibold text-accent-foreground'>Destino</Label>
													</div>
													<RadioGroup className='flex items-center gap-4' value={watchedValues.destinoMode} onValueChange={(v) => setValue("destinoMode", v as LocalMode)}>
														<div className='flex items-center space-x-2'>
															<RadioGroupItem value='cep' id='destino-cep' />
															<Label htmlFor='destino-cep' className='text-xs'>
																CEP
															</Label>
														</div>
														<div className='flex items-center space-x-2'>
															<RadioGroupItem value='cidade' id='destino-cidade' />
															<Label htmlFor='destino-cidade' className='text-xs'>
																Cidade/UF
															</Label>
														</div>
													</RadioGroup>
													{watchedValues.destinoMode === "cep" ? (
														<Input placeholder='Ex.: 01000-000' {...register("destinoCep")} className='h-10 border-accent/50 focus:border-accent-foreground' />
													) : (
														<CityCombobox
															value={watchedValues.destinoCidade || ""}
															onValueChange={(value) => {
																setValue("destinoCidade", value);
																if (value) form.clearErrors("modo");
															}}
															placeholder='Selecione a cidade de destino'
															className='border-accent/50 focus:border-accent-foreground'
														/>
													)}
												</div>
											</Card>
										</div>

										{/* Cálculo Automático */}
										<Card className='p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow'>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-secondary rounded-lg'>
														<Zap className='h-4 w-4 text-secondary-foreground' />
													</div>
													<div>
														<h3 className='font-semibold text-secondary-foreground text-sm'>Cálculo Automático</h3>
														<p className='text-xs text-secondary-foreground/80'>OpenRouteService</p>
													</div>
												</div>
												<Button type='button' onClick={handleCalculateRoute} disabled={isCalculatingRoute} size='sm'>
													{isCalculatingRoute ? (
														<>
															<Loader2 className='mr-2 h-4 w-4 animate-spin' />
															Calculando...
														</>
													) : (
														<>
															<Route className='mr-2 h-4 w-4' />
															Calcular Rota
														</>
													)}
												</Button>
											</div>
										</Card>
									</TabsContent>

									{/* Distância Manual */}
									<TabsContent value='km' className='flex-1'>
										<Card className='p-4 h-full flex items-center justify-center border-muted bg-muted/20'>
											<div className='space-y-6 w-full max-w-md'>
												<div className='text-center space-y-2'>
													<Ruler className='h-8 w-8 text-primary mx-auto mb-3' />
													<div className='space-y-1'>
														<Label className='text-lg font-semibold text-primary block'>Distância Total</Label>
														<p className='text-sm text-muted-foreground leading-relaxed'>Informe a quilometragem da viagem (Km)</p>
													</div>
												</div>
												<Input
													type='number'
													min={0}
													step='0.1'
													placeholder='Ex.: 850'
													{...register("kmTotal")}
													className='text-center text-lg font-semibold h-12 border-primary/30 focus:border-primary'
													aria-label='Distância total em quilômetros'
												/>
											</div>
										</Card>
									</TabsContent>
								</Tabs>
							</div>
							{rotaInfo && (
								<Card className='p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm'>
									<div className='space-y-3'>
										<div className='flex items-center justify-between gap-2'>
											<div className='flex items-center gap-2'>
												<Route className='h-4 w-4 text-secondary-foreground' />
												<span className='text-sm font-semibold text-secondary-foreground'>Rota Calculada</span>
											</div>
											<span className='text-xs text-secondary-foreground/70'>{rotaInfo.isEstimate ? "Distância estimada" : "Distância real"}</span>
										</div>
										<div className='grid md:grid-cols-2 gap-3'>
											<div className='text-xs text-secondary-foreground/80 space-y-1'>
												<p>📍 Origem: {rotaInfo.origem}</p>
												<p>📍 Destino: {rotaInfo.destino}</p>
												<p className='font-semibold mt-2 text-secondary-foreground'>
													🛣️ {rotaInfo.km.toFixed(1)} km • ⏱️ {rotaInfo.durMin} min
												</p>
											</div>
											<div className='min-h-[16rem]'>
												<RouteMap
													origemLabel={rotaInfo.origem}
													destinoLabel={rotaInfo.destino}
													isEstimate={rotaInfo.isEstimate}
													km={rotaInfo.km}
													durMin={rotaInfo.durMin}
													geometry={rotaInfo.geometry}
													origemCoords={rotaInfo.origemCoords}
													destinoCoords={rotaInfo.destinoCoords}
													isLoading={isCalculatingRoute}
													errorMessage={alerts.erro?.includes("rota") ? alerts.erro : null}
												/>
											</div>
										</div>
									</div>
								</Card>
							)}

							{rotaInfo && (
								<div className='mt-4 space-y-3 text-xs'>
									{rotaInfo.isEstimate ? (
										<div className='group relative overflow-hidden rounded-lg border border-yellow-300/50 dark:border-yellow-700/40 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 p-3 shadow-sm'>
											<div className='absolute inset-0 opacity-0 group-hover:opacity-10 transition bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.3),transparent)]'></div>
											<p className='font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2'>
												<span className='inline-block w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse'></span>
												Estimativa de distância
											</p>
											<p className='text-yellow-700/80 dark:text-yellow-200/80 leading-relaxed'>
												Rota exata indisponível. Usamos linha reta + fator rodoviário. Para maior precisão tente informar cidade + bairro ou use um ajuste manual (feature futura).
											</p>
										</div>
									) : (
										<div className='group relative overflow-hidden rounded-lg border border-blue-300/40 dark:border-blue-700/40 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-3 shadow-sm'>
											<div className='absolute inset-0 opacity-0 group-hover:opacity-10 transition bg-[radial-gradient(circle_at_70%_30%,rgba(0,0,0,0.25),transparent)]'></div>
											<p className='font-medium text-blue-800 dark:text-blue-100 flex items-center gap-2'>
												<span className='inline-block w-2.5 h-2.5 rounded-full bg-blue-500'></span>
												Rota real calculada
											</p>
											<p className='text-blue-700/80 dark:text-blue-200/80 leading-relaxed'>
												Para CEPs o ponto é aproximado. Se o bairro estiver diferente, informe bairro explicitamente ou aguarde opção de ajuste manual.
											</p>
										</div>
									)}
									{(rotaInfo.bairroMismatchOrigem || rotaInfo.bairroMismatchDestino) && (
										<div className='rounded-lg border border-orange-300/50 dark:border-orange-700/40 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 p-3 shadow-sm'>
											<p className='font-medium text-orange-800 dark:text-orange-200'>Bairro possivelmente impreciso</p>
											<ul className='mt-1 space-y-1 list-disc list-inside text-orange-700/80 dark:text-orange-200/80'>
												{rotaInfo.bairroMismatchOrigem && (
													<li>
														Origem: esperado “{rotaInfo.origemBairro}”, geocoder retornou “{rotaInfo.origem}”.
													</li>
												)}
												{rotaInfo.bairroMismatchDestino && (
													<li>
														Destino: esperado “{rotaInfo.destinoBairro}”, geocoder retornou “{rotaInfo.destino}”.
													</li>
												)}
											</ul>
											<p className='text-[11px] mt-2 text-orange-600/70 dark:text-orange-300/70'>
												Pode ocorrer por logradouros genéricos (Rua A, Rua C) ou dados divergentes. Tente recalcular usando "Cidade/UF" e digitando "Bairro, Cidade" ou futuramente
												ajuste o marcador no mapa.
											</p>
										</div>
									)}
								</div>
							)}

							{/* Configurações Compactas */}
							<Card className='p-5 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow'>
								<CardHeader className='p-0 pb-3'>
									<CardTitle className='text-sm flex items-center gap-2 text-foreground'>
										<Settings className='h-4 w-4 text-muted-foreground' />
										Configurações
									</CardTitle>
								</CardHeader>
								<CardContent className='p-0 space-y-3'>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<Label className='text-xs'>Eixos</Label>
											<Select value={watchedValues.eixos} onValueChange={(v) => setValue("eixos", v)}>
												<SelectTrigger className='h-9 w-full'>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='2'>2 eixos</SelectItem>
													<SelectItem value='3'>3 eixos</SelectItem>
													<SelectItem value='4'>4 eixos</SelectItem>
													<SelectItem value='5'>5 eixos</SelectItem>
													<SelectItem value='6'>6 eixos</SelectItem>
													<SelectItem value='7'>7 eixos</SelectItem>
													<SelectItem value='9'>9 eixos</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label className='text-xs'>Lotes</Label>
											<Input type='number' min={1} step='1' {...register("nLotes")} className='h-9' />
										</div>
									</div>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<Label className='text-xs'>Retorno Vazio (km)</Label>
											<Input type='number' min={0} step='0.1' {...register("retornoKm")} className='h-9' placeholder='0' />
										</div>
										<div>
											<Label className='text-xs'>Pedágio (R$)</Label>
											<Input type='number' min={0} step='0.01' {...register("pedagio")} className='h-9' placeholder='0,00' />
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Botão Principal e Resultado */}
							<Card className='p-5 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm shadow-md'>
								<div className='space-y-4'>
									<Button type='submit' disabled={isCalculatingFrete} className='w-full h-12 text-base font-semibold' size='lg'>
										{isCalculatingFrete ? (
											<>
												<Loader2 className='mr-2 h-5 w-5 animate-spin' />
												Calculando Frete...
											</>
										) : (
											<>
												<Calculator className='mr-2 h-5 w-5' />
												Calcular Frete Mínimo
											</>
										)}
									</Button>

									{/* Resultado */}
									{freteResult && (
										<div className='space-y-3 p-5 rounded-xl border border-neutral-200/60 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/70 shadow-inner'>
											<div className='flex items-center gap-3'>
												<div className='p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 text-primary shadow-sm'>
													<DollarSign className='h-5 w-5' />
												</div>
												<span className='font-semibold tracking-wide text-neutral-800 dark:text-neutral-100'>Resultado do Cálculo</span>
											</div>
											<div className='space-y-2 text-sm'>
												<div className='flex justify-between'>
													<span className='text-neutral-500 dark:text-neutral-400'>Distância</span>
													<span className='font-medium text-neutral-800 dark:text-neutral-100'>{distanciaEscolhidaKm.toFixed(1)} km</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-neutral-500 dark:text-neutral-400'>Valor base</span>
													<span className='font-medium text-neutral-800 dark:text-neutral-100'>{brl(freteResult.detalhamento.pisoBase)}</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-neutral-500 dark:text-neutral-400'>Retorno vazio</span>
													<span className='font-medium text-neutral-800 dark:text-neutral-100'>{brl(freteResult.detalhamento.retornoVazioValor)}</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-neutral-500 dark:text-neutral-400'>Pedágio</span>
													<span className='font-medium text-neutral-800 dark:text-neutral-100'>{brl(freteResult.detalhamento.pedagio_total)}</span>
												</div>
												<div className='h-px bg-gradient-to-r from-transparent via-neutral-300/60 dark:via-neutral-600 to-transparent my-2'></div>
												<div className='flex justify-between text-lg font-bold text-primary tracking-tight'>
													<span>Total</span>
													<span>{brl(freteResult.total)}</span>
												</div>
											</div>
										</div>
									)}
								</div>
							</Card>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
