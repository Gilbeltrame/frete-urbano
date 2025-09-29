import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAZILIAN_CITIES } from "@/data/cities";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface CityComboboxProps {
	value?: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function CityCombobox({ value, onValueChange, placeholder = "Selecione uma cidade", className }: CityComboboxProps) {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredCities = useMemo(() => {
		if (!searchTerm) return BRAZILIAN_CITIES.slice(0, 50); // Mostrar apenas 50 primeiras inicialmente

		return BRAZILIAN_CITIES.filter((city) => city.label.toLowerCase().includes(searchTerm.toLowerCase()) || city.value.toLowerCase().includes(searchTerm.toLowerCase())).slice(
			0,
			100
		); // Limitar a 100 resultados
	}, [searchTerm]);

	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger className={className}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className='max-h-[300px]'>
				<div className='flex items-center border-b px-3 pb-2 mb-2'>
					<Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
					<Input
						placeholder='Buscar cidade...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8'
					/>
				</div>
				{filteredCities.length === 0 && searchTerm && <div className='py-6 text-center text-sm text-muted-foreground'>Nenhuma cidade encontrada.</div>}
				{filteredCities.map((city) => (
					<SelectItem key={city.value} value={city.value}>
						{city.label}
					</SelectItem>
				))}
				{!searchTerm && BRAZILIAN_CITIES.length > 50 && <div className='py-2 text-center text-xs text-muted-foreground'>Digite para ver mais cidades...</div>}
			</SelectContent>
		</Select>
	);
}
