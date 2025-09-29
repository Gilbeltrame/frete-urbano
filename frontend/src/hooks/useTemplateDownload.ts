import { MAPEAMENTO_FILIAIS } from "@/data/filiais";
import * as XLSX from "xlsx";

export const useTemplateDownload = () => {
	const downloadTemplate = () => {
		const templateData = [
			{
				"Filial - Nome": "01-URBANO MATRIZ",
				"Data Emissao": "15/09/2025",
				CFOP: "5102",
				"Cidade Origem": MAPEAMENTO_FILIAIS["01-URBANO MATRIZ"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["01-URBANO MATRIZ"].uf,
				"Cidade Destino": "SAO PAULO",
				"Destino UF": "SP",
				Lote: "L123456",
				Placa: "ABC1234",
				Transportadora: "TRANSPORTES EXEMPLO LTDA",
				"Valor Frete": 850.0,
				"Distancia Km": 625.8,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_geral",
				"Peso Líq Calc": 1350.0,
				"Peso Bruto": 1500.0,
				"Tp Veículo": "3/4",
				"Tp Frota": "Própria",
				"Qt Eixos": 2,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 15.5,
			},
			{
				"Filial - Nome": "04-SINOP",
				"Data Emissao": "25/09/2025",
				CFOP: "5102",
				"Cidade Origem": MAPEAMENTO_FILIAIS["04-SINOP"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["04-SINOP"].uf,
				"Cidade Destino": "CUIABA",
				"Destino UF": "MT",
				Lote: "L901234",
				Placa: "GHI9012",
				Transportadora: "TRANSPORTES MT LTDA",
				"Valor Frete": 1250.0,
				"Distancia Km": 502.3,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_geral",
				"Peso Líq Calc": 13500.0,
				"Peso Bruto": 15000.0,
				"Tp Veículo": "BI-TRUCK",
				"Tp Frota": "Própria",
				"Qt Eixos": 4,
				"Retorno Vazio Km": 100.0,
				"Pedagio Total": 45.8,
			},
			{
				"Filial - Nome": "07-FORTALEZA",
				"Data Emissao": "28/09/2025",
				CFOP: "5102",
				"Cidade Origem": MAPEAMENTO_FILIAIS["07-FORTALEZA"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["07-FORTALEZA"].uf,
				"Cidade Destino": "FORTALEZA",
				"Destino UF": "CE",
				Lote: "L678901",
				Placa: "PQR6789",
				Transportadora: "TRANSPORTES CE LTDA",
				"Valor Frete": 2150.0,
				"Distancia Km": 800.2,
				"Tabela Frete": "B",
				"Tipo Carga": "neogranel",
				"Peso Líq Calc": 31500.0,
				"Peso Bruto": 35000.0,
				"Tp Veículo": "BI-TREM",
				"Tp Frota": "Terceiro",
				"Qt Eixos": 7,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 120.0,
			},
			{
				"Filial - Nome": "12-GUARULHOS 2",
				"Data Emissao": "04/10/2025",
				CFOP: "5102",
				"Cidade Origem": MAPEAMENTO_FILIAIS["12-GUARULHOS 2"].cidade,
				"Origem UF": MAPEAMENTO_FILIAIS["12-GUARULHOS 2"].uf,
				"Cidade Destino": "GUARULHOS",
				"Destino UF": "SP",
				Lote: "L456123",
				Placa: "EFG4561",
				Transportadora: "TRANSPORTES GRU LTDA",
				"Valor Frete": 420.0,
				"Distancia Km": 97.5,
				"Tabela Frete": "A",
				"Tipo Carga": "carga_frigorificada",
				"Peso Líq Calc": 10800.0,
				"Peso Bruto": 12000.0,
				"Tp Veículo": "CAV MEC SIMPLES",
				"Tp Frota": "Própria",
				"Qt Eixos": 4,
				"Retorno Vazio Km": 0,
				"Pedagio Total": 8.25,
			},
		];

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

	return { downloadTemplate };
};
