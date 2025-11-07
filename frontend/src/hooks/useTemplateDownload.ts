import { MAPEAMENTO_FILIAIS } from "@/data/filiais";
import * as XLSX from "xlsx";

export const useTemplateDownload = () => {
	// Ordem inicial para ajudar usuário: somente colunas esperadas + valores essenciais; extras vêm depois
	const downloadTemplate = (format: "xlsx" | "csv" = "xlsx") => {
		const templateData = [
			// 1 - Base média, deve ficar próxima do mínimo (pode gerar revisão)
			{
				Filial: "01",
				"Filial - Nome": "01-URBANO MATRIZ",
				"Data Emissao": "15/09/2025", // DD/MM/YYYY
				CFOP: "5102",
				"Cidade Destino": "SAO PAULO",
				"Cliente - UF": "SP",
				Lote: "L123456",
				Placa: "ABC1234",
				Transportadora: "TRANSPORTES EXEMPLO LTDA",
				"Peso Líq Calc": 1350.0,
				"Peso Bruto": 1500.0,
				"Tp Veículo": "3/4",
				"Tp Frota": "Própria",
				"Qt Eixos": 2,
				// Extras opcionais
				"Valor Frete": 820.0,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_geral",
				"Cidade Origem": MAPEAMENTO_FILIAIS["01-URBANO MATRIZ"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["01-URBANO MATRIZ"].uf,
				"Distancia Km": 625.8,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 15.5,
			},
			// 2 - Frete artificialmente baixo para gerar divergência
			{
				Filial: "04",
				"Filial - Nome": "04-SINOP",
				"Data Emissao": "25/09/2025",
				CFOP: "5102",
				"Cidade Destino": "CUIABA",
				"Cliente - UF": "MT",
				Lote: "L901234",
				Placa: "GHI9012",
				Transportadora: "TRANSPORTES MT LTDA",
				"Peso Líq Calc": 13500.0,
				"Peso Bruto": 15000.0,
				"Tp Veículo": "BI-TRUCK",
				"Tp Frota": "Própria",
				"Qt Eixos": 4,
				"Valor Frete": 950.0,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_geral",
				"Cidade Origem": MAPEAMENTO_FILIAIS["04-SINOP"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["04-SINOP"].uf,
				"Distancia Km": 502.3,
				"Retorno Vazio Km": 100.0,
				"Pedagio Total": 45.8,
			},
			// 3 - Linha corrigida (tipo carga válido + peso alto) – frete bem acima para Conforme
			{
				Filial: "07",
				"Filial - Nome": "07-FORTALEZA",
				"Data Emissao": "28/09/2025",
				CFOP: "5102",
				"Cidade Destino": "FORTALEZA",
				"Cliente - UF": "CE",
				Lote: "L678901",
				Placa: "PQR6789",
				Transportadora: "TRANSPORTES CE LTDA",
				"Peso Líq Calc": 31500.0,
				"Peso Bruto": 35000.0,
				"Tp Veículo": "BI-TREM",
				"Tp Frota": "Terceiro",
				"Qt Eixos": 7,
				"Valor Frete": 5850.0,
				"Tabela Frete": "B",
				"Tipo Carga": "granel_solido",
				"Cidade Origem": MAPEAMENTO_FILIAIS["07-FORTALEZA"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["07-FORTALEZA"].uf,
				"Distancia Km": 800.2,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 120.0,
			},
			// 4 - Curta distância, pedágio baixo, frete um pouco acima
			{
				Filial: "12",
				"Filial - Nome": "12-GUARULHOS 2",
				"Data Emissao": "04/10/2025",
				CFOP: "5102",
				"Cidade Destino": "GUARULHOS",
				"Cliente - UF": "SP",
				Lote: "L456123",
				Placa: "EFG4561",
				Transportadora: "TRANSPORTES GRU LTDA",
				"Peso Líq Calc": 10800.0,
				"Peso Bruto": 12000.0,
				"Tp Veículo": "CAV MEC SIMPLES",
				"Tp Frota": "Própria",
				"Qt Eixos": 4,
				"Valor Frete": 520.0,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_frigorificada",
				"Cidade Origem": MAPEAMENTO_FILIAIS["12-GUARULHOS 2"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["12-GUARULHOS 2"].uf,
				"Distancia Km": 97.5,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 8.25,
			},
			// 5 - Peso alto + retorno vazio significativo (deve elevar mínimo) frete baixo -> divergente
			{
				Filial: "21",
				"Filial - Nome": "21-FORMOSA",
				"Data Emissao": "05/10/2025",
				CFOP: "5102",
				"Cidade Destino": "CAUCAIA",
				"Cliente - UF": "CE",
				Lote: "L777777",
				Placa: "FOR7777",
				Transportadora: "CORAL TRANSPORTES LTDA",
				"Peso Líq Calc": 36800.0,
				"Peso Bruto": 37400.0,
				"Tp Veículo": "BI-TREM",
				"Tp Frota": "Pesado",
				"Qt Eixos": 7,
				"Valor Frete": 3100.0,
				"Tabela Frete": "A",
				"Tipo Carga": "granel_solido",
				"Cidade Origem": "FORMOSA",
				"Origem UF": "GO",
				"Distancia Km": 910.0,
				"Retorno Vazio Km": 150.0,
				"Pedagio Total": 180.0,
			},
			// 6 - Veículo leve, distância curta, frete muito acima (Conforme folgado)
			{
				Filial: "02",
				"Filial - Nome": "02-MATRIZ SUL",
				"Data Emissao": "06/10/2025",
				CFOP: "5102",
				"Cidade Destino": "PORTO ALEGRE",
				"Cliente - UF": "RS",
				Lote: "L654321",
				Placa: "RSX2222",
				Transportadora: "TRANSPORTES SUL LTDA",
				"Peso Líq Calc": 2800.0,
				"Peso Bruto": 3200.0,
				"Tp Veículo": "TRUCK",
				"Tp Frota": "Semi Pesado",
				"Qt Eixos": 3,
				"Valor Frete": 2100.0,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_geral",
				"Cidade Origem": "SAO GABRIEL",
				"Origem UF": "RS",
				"Distancia Km": 320.0,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 40.0,
			},
			// 7 - Veículo especial, frete ligeiramente acima
			{
				Filial: "06",
				"Filial - Nome": "06-CABO DE STO AGO",
				"Data Emissao": "07/10/2025",
				CFOP: "5102",
				"Cidade Destino": "RECIFE",
				"Cliente - UF": "PE",
				Lote: "L889900",
				Placa: "PEF8899",
				Transportadora: "TRANSPORTES PE LTDA",
				"Peso Líq Calc": 28000.0,
				"Peso Bruto": 30500.0,
				"Tp Veículo": "CARRETA PRANCHA",
				"Tp Frota": "Pesado",
				"Qt Eixos": 6,
				"Valor Frete": 5200.0,
				"Tabela Frete": "B",
				"Tipo Carga": "carga_geral",
				"Cidade Origem": "CABO DE SANTO AGOSTINHO",
				"Origem UF": "PE",
				"Distancia Km": 75.0,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 0.0,
			},
			// 8 - Rodo Trem, pedágio alto, frete baixo (divergência)
			{
				Filial: "03",
				"Filial - Nome": "03-BROTO LEGAL URUGUAIANA",
				"Data Emissao": "08/10/2025",
				CFOP: "5102",
				"Cidade Destino": "URUGUAIANA",
				"Cliente - UF": "RS",
				Lote: "L345012",
				Placa: "URU4501",
				Transportadora: "TRANSPORTES URU LTDA",
				"Peso Líq Calc": 7800.0,
				"Peso Bruto": 8500.0,
				"Tp Veículo": "RODO TREM",
				"Tp Frota": "Pesado",
				"Qt Eixos": 8,
				"Valor Frete": 1800.0,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_geral",
				"Cidade Origem": "CAMPINAS",
				"Origem UF": "SP",
				"Distancia Km": 1200.0,
				"Retorno Vazio Km": 100.0,
				"Pedagio Total": 250.0,
			},
			// 9 - Veículo leve urbano, frete moderado
			{
				Filial: "14",
				"Filial - Nome": "14-PONTA GROSSA",
				"Data Emissao": "09/10/2025",
				CFOP: "5102",
				"Cidade Destino": "GUARULHOS",
				"Cliente - UF": "SP",
				Lote: "L605577",
				Placa: "IAG6A89",
				Transportadora: "RODRIGO ALVES MAIA TRANSPORTES",
				"Peso Líq Calc": 39810.0,
				"Peso Bruto": 39810.0,
				"Tp Veículo": "BI-TREM",
				"Tp Frota": "Pesado",
				"Qt Eixos": 7,
				"Valor Frete": 6100.0,
				"Tabela Frete": "A",
				"Tipo Carga": "granel_solido",
				"Cidade Origem": "PONTA GROSSA",
				"Origem UF": "PR",
				"Distancia Km": 450.0,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 90.0,
			},
			// 10 - Caso borderline: frete quase igual ao mínimo esperado
			{
				Filial: "02",
				"Filial - Nome": "02-BROTO LEGAL PORTO FERREIRA",
				"Data Emissao": "10/10/2025",
				CFOP: "5102",
				"Cidade Destino": "PORTO FERREIRA",
				"Cliente - UF": "SP",
				Lote: "L678345",
				Placa: "PF6783",
				Transportadora: "TRANSPORTES PF LTDA",
				"Peso Líq Calc": 42000.0,
				"Peso Bruto": 45000.0,
				"Tp Veículo": "RODO TREM",
				"Tp Frota": "Pesado",
				"Qt Eixos": 8,
				"Valor Frete": 7500.0,
				"Tabela Frete": "A",
				"Tipo Carga": "granel_solido",
				"Cidade Origem": "PORTO FERREIRA",
				"Origem UF": "SP",
				"Distancia Km": 600.0,
				"Retorno Vazio Km": 50.0,
				"Pedagio Total": 130.0,
			},
		];

		if (format === "csv") {
			// Gerar CSV com apenas colunas esperadas primeiro
			const expectedOrder = [
				"Filial",
				"Filial - Nome",
				"Data Emissao",
				"CFOP",
				"Cidade Destino",
				"Cliente - UF",
				"Lote",
				"Placa",
				"Transportadora",
				"Peso Líq Calc",
				"Peso Bruto",
				"Tp Veículo",
				"Tp Frota",
				"Qt Eixos",
			];
			const header = expectedOrder.join(",");
			const lines = templateData.map((row) => expectedOrder.map((k) => row[k]).join(","));
			const csv = [header, ...lines].join("\n");
			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const a = document.createElement("a");
			const url = URL.createObjectURL(blob);
			a.href = url;
			a.download = "template_analise_frete_antt.csv";
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const ws = XLSX.utils.json_to_sheet(templateData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Template_Analise_ANTT");

		// Ajustar largura das colunas
		const colWidths = Object.keys(templateData[0]).map((key) => ({
			wch: Math.max(key.length, 18),
		}));
		ws["!cols"] = colWidths;

		XLSX.writeFile(wb, "template_analise_frete_antt.xlsx");
	};

	// Utilitário simples para validar se um conjunto de headers cobre o mínimo necessário
	const validarHeadersBasicos = (headers: string[]) => {
		const required = [
			"Filial",
			"Filial - Nome",
			"Data Emissao",
			"CFOP",
			"Cidade Destino",
			"Cliente - UF",
			"Lote",
			"Placa",
			"Transportadora",
			"Peso Líq Calc",
			"Peso Bruto",
			"Tp Veículo",
			"Tp Frota",
			"Qt Eixos",
		];
		const missing = required.filter((r) => !headers.some((h) => h.trim().toLowerCase() === r.toLowerCase()));
		return { ok: missing.length === 0, missing };
	};

	return { downloadTemplate, validarHeadersBasicos };
};
