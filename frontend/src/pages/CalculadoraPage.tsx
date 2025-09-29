import { Alerts } from "@/components/Alerts";
import { CityCombobox } from "@/components/CityCombobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFreteForm } from "@/hooks/useFreteForm";
import type { LocalMode, ModoDistancia } from "@/types";
import { Calculator, DollarSign, Loader2, MapPin, Navigation, Route, Ruler, Settings, Zap } from "lucide-react";

export default function CalculadoraPage() {
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
		<div className='h-full overflow-auto'>
			{/* Alerts no topo */}
			<div className='p-6 pb-2'>
				<Alerts erro={alerts.erro} sucesso={alerts.sucesso} />
			</div>

			{/* Layout Principal */}
			<div className='p-6 pt-2'>
				<form onSubmit={handleSubmit(onSubmit)} className='h-full'>
					<div className='grid grid-cols-12 gap-6'>
						{/* Painel Esquerdo - Dados de Entrada */}
						<div className='col-span-7 space-y-4'>
							{/* Tabs Horizontal Compacto */}
							<Tabs value={watchedValues.modo} onValueChange={(v) => setValue("modo", v as ModoDistancia)} className='h-full flex flex-col'>
								<TabsList className='grid grid-cols-2 h-10 mb-4'>
									<TabsTrigger value='origemdestino' className='flex items-center gap-2 text-sm'>
										<Route className='h-4 w-4' />
										Origem/Destino
									</TabsTrigger>
									<TabsTrigger value='km' className='flex items-center gap-2 text-sm'>
										<Ruler className='h-4 w-4' />
										Distância Manual
									</TabsTrigger>
								</TabsList>

								{/* Origem/Destino - Layout Horizontal */}
								<TabsContent value='origemdestino' className='flex-1 space-y-4'>
									<div className='grid grid-cols-2 gap-4 h-[50%]'>
										{/* ORIGEM */}
										<Card className='p-4'>
											<div className='space-y-3'>
												<div className='flex items-center gap-2'>
													<Navigation className='h-4 w-4 text-green-600' />
													<Label className='text-sm font-semibold text-green-700'>Origem</Label>
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
													<Input placeholder='Ex.: 74000-000' {...register("origemCep")} className='h-10 border-green-200 focus:border-green-400' />
												) : (
													<CityCombobox
														value={watchedValues.origemCidade || ""}
														onValueChange={(value) => {
															setValue("origemCidade", value);
															if (value) form.clearErrors("modo");
														}}
														placeholder='Selecione a cidade de origem'
														className='border-green-200 focus:border-green-400'
													/>
												)}
											</div>
										</Card>

										{/* DESTINO */}
										<Card className='p-4'>
											<div className='space-y-3'>
												<div className='flex items-center gap-2'>
													<MapPin className='h-4 w-4 text-red-600' />
													<Label className='text-sm font-semibold text-red-700'>Destino</Label>
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
													<Input placeholder='Ex.: 01000-000' {...register("destinoCep")} className='h-10 border-red-200 focus:border-red-400' />
												) : (
													<CityCombobox
														value={watchedValues.destinoCidade || ""}
														onValueChange={(value) => {
															setValue("destinoCidade", value);
															if (value) form.clearErrors("modo");
														}}
														placeholder='Selecione a cidade de destino'
														className='border-red-200 focus:border-red-400'
													/>
												)}
											</div>
										</Card>
									</div>

									{/* Cálculo Automático */}
									<Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-4'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-100 rounded-lg'>
													<Zap className='h-4 w-4 text-blue-600' />
												</div>
												<div>
													<h3 className='font-semibold text-blue-900 text-sm'>Cálculo Automático</h3>
													<p className='text-xs text-blue-700'>OpenRouteService</p>
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
									<Card className='p-4 h-full flex items-center justify-center'>
										<div className='space-y-4 w-full max-w-md'>
											<div className='text-center'>
												<Ruler className='h-8 w-8 text-purple-600 mx-auto mb-2' />
												<Label className='text-lg font-semibold text-purple-800'>Distância Total</Label>
												<p className='text-sm text-purple-600'>Digite a quilometragem da viagem</p>
											</div>
											<Input
												type='number'
												min={0}
												step='0.1'
												placeholder='Ex.: 850'
												{...register("kmTotal")}
												className='text-center text-lg font-semibold h-12 border-purple-200 focus:border-purple-400'
											/>
										</div>
									</Card>
								</TabsContent>
							</Tabs>
						</div>

						{/* Painel Direito - Configurações e Resultado */}
						<div className='col-span-5 space-y-4'>
							{/* Informações da Rota */}
							{rotaInfo && (
								<Card className='p-4 bg-green-50 border-green-200'>
									<div className='space-y-2'>
										<div className='flex items-center gap-2'>
											<Route className='h-4 w-4 text-green-600' />
											<span className='text-sm font-semibold text-green-800'>Rota Calculada</span>
										</div>
										<div className='text-xs text-green-700'>
											<p>📍 {rotaInfo.origem}</p>
											<p>📍 {rotaInfo.destino}</p>
											<p className='font-semibold mt-2'>
												🛣️ {rotaInfo.km.toFixed(1)} km • ⏱️ {rotaInfo.durMin} min
											</p>
										</div>
									</div>
								</Card>
							)}

							{/* Configurações Compactas */}
							<Card className='p-4'>
								<CardHeader className='p-0 pb-3'>
									<CardTitle className='text-sm flex items-center gap-2'>
										<Settings className='h-4 w-4' />
										Configurações
									</CardTitle>
								</CardHeader>
								<CardContent className='p-0 space-y-3'>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<Label className='text-xs'>Eixos</Label>
											<Select value={watchedValues.eixos} onValueChange={(v) => setValue("eixos", v)}>
												<SelectTrigger className='h-9'>
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
							<Card className='p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20'>
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
										<div className='space-y-3 p-4 bg-white rounded-lg border'>
											<div className='flex items-center gap-2'>
												<DollarSign className='h-5 w-5 text-primary' />
												<span className='font-semibold'>Resultado do Cálculo</span>
											</div>
											<div className='space-y-2 text-sm'>
												<div className='flex justify-between'>
													<span>Distância:</span>
													<span className='font-medium'>{distanciaEscolhidaKm.toFixed(1)} km</span>
												</div>
												<div className='flex justify-between'>
													<span>Valor base:</span>
													<span className='font-medium'>{brl(freteResult.detalhamento.pisoBase)}</span>
												</div>
												<div className='flex justify-between'>
													<span>Retorno vazio:</span>
													<span className='font-medium'>{brl(freteResult.detalhamento.retornoVazioValor)}</span>
												</div>
												<div className='flex justify-between'>
													<span>Pedágio:</span>
													<span className='font-medium'>{brl(freteResult.detalhamento.pedagio_total)}</span>
												</div>
												<hr />
												<div className='flex justify-between text-lg font-bold text-primary'>
													<span>Total:</span>
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
