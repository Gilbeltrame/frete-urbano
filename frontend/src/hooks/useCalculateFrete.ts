import { apiService } from "@/services/api";
import type { FreteCalculationRequest, FreteCalculationResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";

export const useCalculateFrete = () => {
	return useMutation<FreteCalculationResponse, Error, FreteCalculationRequest>({
		mutationFn: (data) => apiService.calculateFrete(data),
		onError: (error) => {
			console.error("Erro ao calcular frete:", error);
		},
	});
};
