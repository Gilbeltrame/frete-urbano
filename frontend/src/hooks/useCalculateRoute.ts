import { routeService } from "@/services/route";
import type { RouteInfo } from "@/types";
import { useMutation } from "@tanstack/react-query";

interface RouteCalculationParams {
	origemMode: "cep" | "cidade";
	origemCep: string;
	origemCidade: string;
	destinoMode: "cep" | "cidade";
	destinoCep: string;
	destinoCidade: string;
}

export const useCalculateRoute = () => {
	return useMutation<RouteInfo, Error, RouteCalculationParams>({
		mutationFn: (params) => routeService.calculateFullRoute(params.origemMode, params.origemCep, params.origemCidade, params.destinoMode, params.destinoCep, params.destinoCidade),
		onError: (error) => {
			console.error("Erro ao calcular rota:", error);
		},
	});
};
