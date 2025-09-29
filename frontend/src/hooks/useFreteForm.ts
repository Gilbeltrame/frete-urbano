import { freteFormSchema, type FreteFormData } from "@/forms/schema";
import type { RouteInfo } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useCalculateFrete } from "./useCalculateFrete";
import { useCalculateRoute } from "./useCalculateRoute";

// Utility functions
const brl = (n: number | undefined | null) => (typeof n === "number" ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—");

const toNum = (v: string | number | undefined) => (typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", ".")) || 0);

export const useFreteForm = () => {
	const [rotaInfo, setRotaInfo] = useState<RouteInfo | null>(null);
	const [alerts, setAlerts] = useState<{
		erro: string | null;
		sucesso: string | null;
	}>({ erro: null, sucesso: null });

	const form = useForm<FreteFormData>({
		resolver: zodResolver(freteFormSchema),
		defaultValues: {
			modo: "origemdestino",
			eixos: "5",
			nLotes: "1",
			kmTotal: "",
			origemMode: "cep",
			destinoMode: "cep",
			origemCep: "",
			destinoCep: "",
			origemCidade: "",
			destinoCidade: "",
			retornoKm: "0",
			pedagio: "0",
		},
	});

	const calculateFrete = useCalculateFrete();
	const calculateRoute = useCalculateRoute();

	const watchedValues = form.watch();

	// Distância escolhida conforme o modo
	const distanciaEscolhidaKm = useMemo(() => {
		if (watchedValues.modo === "km") return toNum(watchedValues.kmTotal);
		return rotaInfo?.km ? Number(rotaInfo.km.toFixed(1)) : 0;
	}, [watchedValues.modo, watchedValues.kmTotal, rotaInfo]);

	const clearAlerts = () => {
		setAlerts({ erro: null, sucesso: null });
	};

	const setError = (message: string) => {
		setAlerts({ erro: message, sucesso: null });
	};

	const setSuccess = (message: string) => {
		setAlerts({ erro: null, sucesso: message });
	};

	const handleCalculateRoute = async () => {
		clearAlerts();
		setRotaInfo(null);

		const values = form.getValues();

		// Validação dos campos antes de tentar calcular
		const origemValid = (values.origemMode === "cep" && values.origemCep?.trim()) || (values.origemMode === "cidade" && values.origemCidade?.trim());

		const destinoValid = (values.destinoMode === "cep" && values.destinoCep?.trim()) || (values.destinoMode === "cidade" && values.destinoCidade?.trim());

		if (!origemValid) {
			setError("Preencha o campo de origem (CEP ou Cidade)");
			return;
		}

		if (!destinoValid) {
			setError("Preencha o campo de destino (CEP ou Cidade)");
			return;
		}

		try {
			const routeData = await calculateRoute.mutateAsync({
				origemMode: values.origemMode,
				origemCep: values.origemCep || "",
				origemCidade: values.origemCidade || "",
				destinoMode: values.destinoMode,
				destinoCep: values.destinoCep || "",
				destinoCidade: values.destinoCidade || "",
			});

			setRotaInfo(routeData);
			form.setValue("kmTotal", String(Number(routeData.km.toFixed(1))));

			if (routeData.isEstimate) {
				setSuccess(
					`⚠️ Estimativa calculada! Distância aproximada: ${routeData.km.toFixed(1)} km - Tempo estimado: ${
						routeData.durMin
					} min (baseado em distância em linha reta + margem rodoviária)`
				);
			} else {
				setSuccess(`Rota calculada! Distância: ${routeData.km.toFixed(1)} km - Tempo estimado: ${routeData.durMin} min`);
			}
		} catch (error: any) {
			setError(error?.message || "Falha ao calcular rota automática");
		}
	};

	const handleCalculateFrete = async (data: FreteFormData) => {
		clearAlerts();

		let distancia_km = distanciaEscolhidaKm;

		if (data.modo === "origemdestino") {
			if (distancia_km <= 0) {
				setError("Preencha o 'KM total' ou use o cálculo automático de rota para determinar a distância.");
				return;
			}
		} else {
			if (distancia_km <= 0) {
				setError("Informe a distância total em KM.");
				return;
			}
		}

		const requestBody = {
			tabela: "A", // Tabela A (Lotação)
			tipoCarga: "carga_geral", // Carga Geral
			eixos: Number(data.eixos),
			distancia_km,
			retorno_vazio_km: toNum(data.retornoKm),
			pedagio_total: toNum(data.pedagio),
		};

		try {
			const result = await calculateFrete.mutateAsync(requestBody);

			// Considerar nº de lotes (viagens)
			const lotes = Math.max(1, Number(data.nLotes) || 1);
			const totalComLotes = result.total * lotes;

			const finalResult = {
				...result,
				total: totalComLotes,
			};

			setSuccess(`Cálculo realizado com sucesso! Valor total: ${brl(totalComLotes)}`);
			return finalResult;
		} catch (error: any) {
			setError(error?.message || "Falha ao chamar API");
			throw error;
		}
	};

	return {
		form,
		alerts,
		rotaInfo,
		distanciaEscolhidaKm,
		isCalculatingFrete: calculateFrete.isPending,
		isCalculatingRoute: calculateRoute.isPending,
		freteResult: calculateFrete.data,
		handleCalculateRoute,
		handleCalculateFrete,
		clearAlerts,
		utils: { brl, toNum },
	};
};
