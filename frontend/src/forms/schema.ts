import { z } from "zod";

export const freteFormSchema = z
	.object({
		modo: z.enum(["km", "origemdestino"]),
		eixos: z.string().min(1, "Selecione o número de eixos"),
		nLotes: z.string().min(1, "Número de lotes é obrigatório"),
		kmTotal: z.string(),
		origemMode: z.enum(["cep", "cidade"]),
		destinoMode: z.enum(["cep", "cidade"]),
		origemCep: z.string().optional(),
		destinoCep: z.string().optional(),
		origemCidade: z.string().optional(),
		destinoCidade: z.string().optional(),
		retornoKm: z.string(),
		pedagio: z.string(),
	})
	.refine(
		(data) => {
			if (data.modo === "origemdestino") {
				// Validar origem
				if (data.origemMode === "cep" && !data.origemCep?.trim()) {
					return false;
				}
				if (data.origemMode === "cidade" && !data.origemCidade?.trim()) {
					return false;
				}
				// Validar destino
				if (data.destinoMode === "cep" && !data.destinoCep?.trim()) {
					return false;
				}
				if (data.destinoMode === "cidade" && !data.destinoCidade?.trim()) {
					return false;
				}
			}
			return true;
		},
		{
			message: "Informe origem e destino (CEP ou Cidade/UF)",
			path: ["modo"], // Associar erro ao campo modo para melhor UX
		}
	);

export type FreteFormData = z.infer<typeof freteFormSchema>;
