// Sistema de logging centralizado para debug e auditoria
export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: string;
	data?: any;
	stack?: string;
}

class Logger {
	private logs: LogEntry[] = [];
	private maxLogs = 1000; // Máximo de logs mantidos em memória
	private isDevelopment = import.meta.env.DEV;

	// Adicionar log ao sistema
	private addLog(level: LogLevel, message: string, context?: string, data?: any, error?: Error) {
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			data,
			stack: error?.stack,
		};

		// Adicionar ao array de logs
		this.logs.push(logEntry);

		// Manter apenas os últimos logs para evitar memory leak
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Log no console durante desenvolvimento
		if (this.isDevelopment) {
			const contextStr = context ? `[${context}]` : "";
			const dataStr = data ? JSON.stringify(data, null, 2) : "";

			switch (level) {
				case "debug":
					console.debug(`🔍 ${contextStr} ${message}`, dataStr);
					break;
				case "info":
					console.info(`ℹ️ ${contextStr} ${message}`, dataStr);
					break;
				case "warn":
					console.warn(`⚠️ ${contextStr} ${message}`, dataStr);
					break;
				case "error":
					console.error(`❌ ${contextStr} ${message}`, dataStr, error?.stack);
					break;
				case "critical":
					console.error(`🚨 CRITICAL ${contextStr} ${message}`, dataStr, error?.stack);
					break;
			}
		}
	}

	// Métodos públicos
	debug(message: string, context?: string, data?: any) {
		this.addLog("debug", message, context, data);
	}

	info(message: string, context?: string, data?: any) {
		this.addLog("info", message, context, data);
	}

	warn(message: string, context?: string, data?: any) {
		this.addLog("warn", message, context, data);
	}

	error(message: string, context?: string, data?: any, error?: Error) {
		this.addLog("error", message, context, data, error);
	}

	critical(message: string, context?: string, data?: any, error?: Error) {
		this.addLog("critical", message, context, data, error);
	}

	// Obter logs filtrados
	getLogs(level?: LogLevel, context?: string, limit = 100): LogEntry[] {
		let filteredLogs = [...this.logs];

		if (level) {
			filteredLogs = filteredLogs.filter((log) => log.level === level);
		}

		if (context) {
			filteredLogs = filteredLogs.filter((log) => log.context?.includes(context));
		}

		return filteredLogs.slice(-limit);
	}

	// Obter estatísticas de logs
	getStats(): { [key in LogLevel]: number } {
		const stats = { debug: 0, info: 0, warn: 0, error: 0, critical: 0 };

		for (const log of this.logs) {
			stats[log.level]++;
		}

		return stats;
	}

	// Exportar logs para download
	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}

	// Limpar logs
	clearLogs() {
		this.logs = [];
		this.info("Logs limpos", "LOGGER");
	}

	// Validação de dados com log automático
	validateData(data: any, rules: ValidationRule[], context: string): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		this.debug(`Iniciando validação`, context, { rulesCount: rules.length });

		for (const rule of rules) {
			try {
				const result = rule.validate(data);

				if (!result.valid) {
					if (result.severity === "error") {
						errors.push(result.message);
						this.error(`Validação falhou: ${result.message}`, context, { rule: rule.name, data });
					} else {
						warnings.push(result.message);
						this.warn(`Validação com warning: ${result.message}`, context, { rule: rule.name, data });
					}
				}
			} catch (error) {
				const errorMsg = `Erro na regra de validação ${rule.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
				errors.push(errorMsg);
				this.error(errorMsg, context, { rule: rule.name, data }, error instanceof Error ? error : undefined);
			}
		}

		const isValid = errors.length === 0;

		this.info(`Validação concluída`, context, {
			valid: isValid,
			errorsCount: errors.length,
			warningsCount: warnings.length,
		});

		return {
			valid: isValid,
			errors,
			warnings,
		};
	}
}

// Interfaces para validação
export interface ValidationRule {
	name: string;
	validate: (data: any) => { valid: boolean; message: string; severity: "error" | "warning" };
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

// Instância singleton do logger
export const logger = new Logger();

// Regras de validação comuns para conciliação
export const conciliacaoValidationRules: ValidationRule[] = [
	{
		name: "cidadeOrigem",
		validate: (item: any) => ({
			valid: item.cidadeOrigem && item.cidadeOrigem.trim().length > 0,
			message: "Cidade de origem é obrigatória",
			severity: "error" as const,
		}),
	},
	{
		name: "cidadeDestino",
		validate: (item: any) => ({
			valid: item.cidadeDestino && item.cidadeDestino.trim().length > 0,
			message: "Cidade de destino é obrigatória",
			severity: "error" as const,
		}),
	},
	{
		name: "valorFrete",
		validate: (item: any) => ({
			valid: item.valorFrete && item.valorFrete > 0,
			message: "Valor do frete deve ser maior que zero",
			severity: "error" as const,
		}),
	},
	{
		name: "qtEixos",
		validate: (item: any) => ({
			valid: item.qtEixos && item.qtEixos > 0 && item.qtEixos <= 9,
			message: "Quantidade de eixos deve estar entre 1 e 9",
			severity: "error" as const,
		}),
	},
	{
		name: "tipoCarga",
		validate: (item: any) => ({
			valid: item.tipoCarga && item.tipoCarga.trim().length > 0,
			message: "Tipo de carga é obrigatório",
			severity: "error" as const,
		}),
	},
	{
		name: "tabelaFrete",
		validate: (item: any) => ({
			valid: item.tabelaFrete && ["A", "B"].includes(item.tabelaFrete.toUpperCase()),
			message: "Tabela de frete deve ser A ou B",
			severity: "error" as const,
		}),
	},
	{
		name: "placa",
		validate: (item: any) => {
			if (!item.placa) return { valid: true, message: "", severity: "warning" as const };

			const placaLimpa = item.placa.replace(/[\s-]/g, "").toUpperCase();
			const padrao1 = /^[A-Z]{3}[0-9]{4}$/; // ABC1234
			const padrao2 = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // ABC1D23

			return {
				valid: padrao1.test(placaLimpa) || padrao2.test(placaLimpa),
				message: "Formato de placa inválido",
				severity: "warning" as const,
			};
		},
	},
	{
		name: "transportadora",
		validate: (item: any) => ({
			valid: item.transportadora && item.transportadora.trim().length >= 3,
			message: "Nome da transportadora deve ter pelo menos 3 caracteres",
			severity: "warning" as const,
		}),
	},
];
