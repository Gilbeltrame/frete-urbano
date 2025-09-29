import AppLayout from "@/layouts/AppLayout";
import CalculadoraPage from "@/pages/CalculadoraPage";
import DocumentacaoPage from "@/pages/DocumentacaoPage";
import HomePage from "@/pages/HomePage";
import SobrePage from "@/pages/SobrePage";
import { useState } from "react";

export default function App() {
	const [currentPage, setCurrentPage] = useState("home");

	const renderPage = () => {
		switch (currentPage) {
			case "home":
				return <HomePage />;
			case "calculadora":
				return <CalculadoraPage />;
			case "sobre":
				return <SobrePage />;
			case "documentacao":
				return <DocumentacaoPage />;
			default:
				return <HomePage />;
		}
	};

	return (
		<AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
			{renderPage()}
		</AppLayout>
	);
}
