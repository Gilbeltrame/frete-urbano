import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAZILIAN_CITIES } from "@/data/cities";
import { cn } from "@/lib/utils";
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
			<SelectTrigger className={cn("group relative", className)}>
				<div className='absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none' />
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className='max-h-[340px] p-0 overflow-hidden rounded-lg shadow-lg border bg-background/95 backdrop-blur-sm'>
				{/* Sticky search header */}
				<div className='sticky top-0 z-10 flex items-center gap-2 px-3 py-2 bg-background/95 backdrop-blur-sm border-b shadow-sm'>
					<div className='flex items-center justify-center h-7 w-7 rounded-md bg-muted text-muted-foreground'>
						<Search className='h-4 w-4' />
					</div>
					<Input
						placeholder='Buscar cidade...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='h-8 text-sm focus-visible:ring-1 focus-visible:ring-primary/40'
					/>
				</div>
				{/* Body */}
				<div className='px-1 py-1'>
					{filteredCities.length === 0 && searchTerm && <div className='py-8 text-center text-sm text-muted-foreground'>Nenhuma cidade encontrada.</div>}
					{filteredCities.map((city) => (
						<SelectItem key={city.value} value={city.value} className='text-sm rounded-md data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary transition-colors'>
							<span className='flex items-center gap-2'>
								<span className='w-1.5 h-1.5 rounded-full bg-muted group-data-[state=checked]:bg-primary/70 transition-colors' />
								{city.label}
							</span>
						</SelectItem>
					))}
					{!searchTerm && BRAZILIAN_CITIES.length > 50 && <div className='py-3 text-center text-xs text-muted-foreground'>Digite para ver mais cidades...</div>}
				</div>
			</SelectContent>
		</Select>
	);
}
