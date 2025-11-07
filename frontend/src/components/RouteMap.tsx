import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

// Ícone neutro custom (cinza) usando imagem padrão recolorida simples (data URI) para evitar dependência externa
// Poderíamos usar divIcon para círculos, mas mantemos anchor consistente.
const NeutralIcon = L.icon({
	iconUrl:
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='25' height='41' viewBox='0 0 25 41'%3E%3Cpath fill='%239ca3af' stroke='%234b5563' d='M12.5.5C5.9.5.5 5.9.5 12.5c0 9.6 10.3 17.7 11.5 27.7 1.2-10 11.5-18.1 11.5-27.7C24.5 5.9 19.1.5 12.5.5Z'/%3E%3Ccircle cx='12.5' cy='12.5' r='5.5' fill='%23ffffff' stroke='%234b5563'/%3E%3C/svg%3E",
	iconRetinaUrl:
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='25' height='41' viewBox='0 0 25 41'%3E%3Cpath fill='%239ca3af' stroke='%234b5563' d='M12.5.5C5.9.5.5 5.9.5 12.5c0 9.6 10.3 17.7 11.5 27.7 1.2-10 11.5-18.1 11.5-27.7C24.5 5.9 19.1.5 12.5.5Z'/%3E%3Ccircle cx='12.5' cy='12.5' r='5.5' fill='%23ffffff' stroke='%234b5563'/%3E%3C/svg%3E",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [0, 0],
});
L.Marker.prototype.options.icon = NeutralIcon;

interface RouteMapProps {
	origemLabel?: string;
	destinoLabel?: string;
	origemCoords?: { lat: number; lon: number } | null;
	destinoCoords?: { lat: number; lon: number } | null;
	geometry?: { lat: number; lon: number }[]; // lista completa da geometria
	isEstimate?: boolean;
	km?: number;
	durMin?: number;
	isLoading?: boolean;
	dark?: boolean; // força tema dark para tiles
	errorMessage?: string | null; // exibir overlay de erro
}

export const RouteMap: React.FC<RouteMapProps> = ({ origemLabel, destinoLabel, origemCoords, destinoCoords, geometry, isEstimate, km, durMin, isLoading, dark, errorMessage }) => {
	const center = useMemo(() => {
		if (geometry && geometry.length > 0) {
			// centro aproximado da geometria (média simples)
			const lat = geometry.reduce((a, c) => a + c.lat, 0) / geometry.length;
			const lon = geometry.reduce((a, c) => a + c.lon, 0) / geometry.length;
			return [lat, lon] as [number, number];
		}
		if (origemCoords && destinoCoords) {
			return [(origemCoords.lat + destinoCoords.lat) / 2, (origemCoords.lon + destinoCoords.lon) / 2] as [number, number];
		}
		if (origemCoords) return [origemCoords.lat, origemCoords.lon] as [number, number];
		if (destinoCoords) return [destinoCoords.lat, destinoCoords.lon] as [number, number];
		return [-15.793889, -47.882778]; // Centro aproximado do Brasil (Brasília)
	}, [geometry, origemCoords, destinoCoords]);

	const linePositions = useMemo(() => {
		if (geometry && geometry.length > 1) {
			return geometry.map((p) => [p.lat, p.lon]) as [number, number][];
		}
		if (origemCoords && destinoCoords) {
			return [
				[origemCoords.lat, origemCoords.lon],
				[destinoCoords.lat, destinoCoords.lon],
			] as [number, number][];
		}
		return [];
	}, [geometry, origemCoords, destinoCoords]);

	const bounds = useMemo(() => {
		if (linePositions.length > 1) return linePositions as [number, number][];
		return undefined;
	}, [linePositions]);

	return (
		<div className='relative w-full h-64 rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm'>
			<MapContainer
				center={center as any}
				zoom={6}
				style={{ height: "100%", width: "100%" }}
				scrollWheelZoom
				whenCreated={(map) => {
					if (bounds) {
						map.fitBounds(bounds as any, { padding: [30, 30] });
					}
				}}
			>
				<TileLayer
					attribution='&copy; OpenStreetMap contributors'
					url={dark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
				/>
				{linePositions.length > 1 && <Polyline positions={linePositions as any} pathOptions={{ color: isEstimate ? "#f59e0b" : "#2563eb", weight: 4, opacity: 0.7 }} />}
				{origemCoords && (
					<Marker position={[origemCoords.lat, origemCoords.lon]}>
						<Popup>
							<strong>Origem</strong>
							<br />
							{origemLabel}
						</Popup>
					</Marker>
				)}
				{destinoCoords && (
					<Marker position={[destinoCoords.lat, destinoCoords.lon]}>
						<Popup>
							<strong>Destino</strong>
							<br />
							{destinoLabel}
						</Popup>
					</Marker>
				)}
			</MapContainer>
			{isLoading && !errorMessage && (
				<div className='absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/50 backdrop-blur-sm'>
					<div className='flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300'>
						<LoaderSpinner /> Carregando rota...
					</div>
				</div>
			)}
			{errorMessage && (
				<div className='absolute inset-0 flex items-center justify-center bg-red-500/10 dark:bg-red-900/20 backdrop-blur-sm p-4'>
					<div className='text-center space-y-2 max-w-xs'>
						<p className='text-sm font-medium text-red-700 dark:text-red-300'>Falha ao obter rota</p>
						<p className='text-xs text-red-600 dark:text-red-400'>{errorMessage}</p>
					</div>
				</div>
			)}
			{km !== undefined && durMin !== undefined && !isLoading && !errorMessage && (
				<div className='absolute bottom-2 left-2 bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 rounded text-xs shadow flex items-center gap-2'>
					<span>{km.toFixed(1)} km</span>
					<span>• {durMin} min</span>
					{isEstimate && <span className='text-yellow-600 font-medium'>(estimativa)</span>}
				</div>
			)}
		</div>
	);
};

const LoaderSpinner: React.FC = () => <div className='inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin' />;

export default RouteMap;
