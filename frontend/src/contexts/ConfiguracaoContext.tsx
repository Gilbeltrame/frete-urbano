import { ConfiguracaoSistema } from "@/components/ConfiguracoesModal";
import { createContext, ReactNode, useContext } from "react";

interface ConfiguracaoContextType {
	configuracao: ConfiguracaoSistema;
	updateConfiguracao: (config: ConfiguracaoSistema) => void;
}

const ConfiguracaoContext = createContext<ConfiguracaoContextType | undefined>(undefined);

interface ConfiguracaoProviderProps {
	children: ReactNode;
	configuracao: ConfiguracaoSistema;
	onConfigurationChange: (config: ConfiguracaoSistema) => void;
}

export function ConfiguracaoProvider({ children, configuracao, onConfigurationChange }: ConfiguracaoProviderProps) {
	return (
		<ConfiguracaoContext.Provider
			value={{
				configuracao,
				updateConfiguracao: onConfigurationChange,
			}}
		>
			{children}
		</ConfiguracaoContext.Provider>
	);
}

export function useConfiguracao() {
	const context = useContext(ConfiguracaoContext);
	if (context === undefined) {
		throw new Error("useConfiguracao must be used within a ConfiguracaoProvider");
	}
	return context;
}
