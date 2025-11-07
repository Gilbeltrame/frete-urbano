import { ConfiguracaoSistema } from "@/components/ConfiguracoesModal";
import { ConfiguracaoProvider } from "@/contexts/ConfiguracaoContext";
import AppLayout from "@/layouts/AppLayout";
import CalculadoraPage from "@/pages/CalculadoraPage";
import ConciliacaoAsyncPage from "@/pages/ConciliacaoAsyncPage";
import DocPage from "@/pages/DocPage";
import HomePage from "@/pages/HomePage";
import SobrePage from "@/pages/SobrePage";
import { useState } from "react";

export default function App() {
	const [currentPage, setCurrentPage] = useState("home");
	const [configuracao, setConfiguracao] = useState<ConfiguracaoSistema>({
		tabela: "A",
		tipoCarga: "geral",
		modalidade: "lotacao",
	});

	const renderPage = () => {
		switch (currentPage) {
			case "home":
				return <HomePage />;
			case "calculadora":
				return <CalculadoraPage />;
			case "conciliacao":
				return <ConciliacaoAsyncPage />;
			case "sobre":
				return <SobrePage />;
			case "documentacao":
				return <DocPage />;
			default:
				return <HomePage />;
		}
	};

	return (
		<ConfiguracaoProvider configuracao={configuracao} onConfigurationChange={setConfiguracao}>
			<AppLayout currentPage={currentPage} onNavigate={setCurrentPage} configuracao={configuracao} onConfigurationChange={setConfiguracao}>
				{renderPage()}
			</AppLayout>
		</ConfiguracaoProvider>
	);
}
