import { useConciliacao } from "@/hooks/useConciliacao";
import * as XLSX from "xlsx";

export const useTemplateDownload = () => {
	const { exportarResultados } = useConciliacao();

	const downloadTemplate = () => {
		const templateData = [
			{
				Filial: "01",
				"Filial - Nome": "01-URBANO MATRIZ",
				"Data Emissao": "15/09/2025",
				CFOP: "VENDA",
				"Cidade Destino": "SAO PAULO",
				"Cliente - UF": "SP",
				Lote: "123456",
				Placa: "ABC1234",
				Transportadora: "TRANSPORTES EXEMPLO LTDA",
				"Peso Líq Calc": 1500.0,
				"Peso Bruto": 1600.0,
				"Tp Veículo": "3/4",
				"Tp Frota": "Leve/Extraleve",
				"Qt Eixos": 2,
			},
			{
				Filial: "04",
				"Filial - Nome": "04-SINOP",
				"Data Emissao": "25/09/2025",
				CFOP: "VENDA",
				"Cidade Destino": "CUIABA",
				"Cliente - UF": "MT",
				Lote: "901234",
				Placa: "GHI9012",
				Transportadora: "TRANSPORTES MT LTDA",
				"Peso Líq Calc": 15000.0,
				"Peso Bruto": 16500.0,
				"Tp Veículo": "BI-TRUCK",
				"Tp Frota": "Pesado",
				"Qt Eixos": 4,
			},
			{
				Filial: "07",
				"Filial - Nome": "07-FORTALEZA",
				"Data Emissao": "28/09/2025",
				CFOP: "VENDA",
				"Cidade Destino": "FORTALEZA",
				"Cliente - UF": "CE",
				Lote: "678901",
				Placa: "PQR6789",
				Transportadora: "TRANSPORTES CE LTDA",
				"Peso Líq Calc": 35000.0,
				"Peso Bruto": 38000.0,
				"Tp Veículo": "BI-TREM",
				"Tp Frota": "Pesado",
				"Qt Eixos": 7,
			},
			{
				Filial: "12",
				"Filial - Nome": "12-GUARULHOS 2",
				"Data Emissao": "04/10/2025",
				CFOP: "VENDA",
				"Cidade Destino": "GUARULHOS",
				"Cliente - UF": "SP",
				Lote: "456123",
				Placa: "EFG4561",
				Transportadora: "TRANSPORTES GRU LTDA",
				"Peso Líq Calc": 12000.0,
				"Peso Bruto": 13200.0,
				"Tp Veículo": "CAV MEC SIMPLES",
				"Tp Frota": "Semi Pesado",
				"Qt Eixos": 4,
			},
		];

		const ws = XLSX.utils.json_to_sheet(templateData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Template_Orcamentos");

		// Ajustar largura das colunas
		const colWidths = Object.keys(templateData[0]).map((key) => ({
			wch: Math.max(key.length, 15),
		}));
		ws["!cols"] = colWidths;

		XLSX.writeFile(wb, "template_orcamentos.xlsx");
	};

	return { downloadTemplate };
};
