declare module "papaparse" {
	export interface ParseResult<T> {
		data: T[];
		errors: any[];
		meta: any;
	}
	export interface ParseConfig {
		delimiter?: string;
		skipEmptyLines?: boolean | "greedy";
	}
	export function parse<T = any>(input: string, config?: ParseConfig): ParseResult<T>;
}
