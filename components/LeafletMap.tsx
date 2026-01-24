'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Place } from '@/lib/types';

export interface LeafletMapProps {
    places: Place[];
    center: [number, number];
    zoom: number;
    onMapClick: (lat: number, lng: number) => void;
    onMarkerClick: (place: Place) => void;
}

// --- icone (uguali alle tue) ---
const createCustomIcon = (type: 'visited' | 'to_visit') => {
    const color = type === 'visited' ? '#e11d48' : '#a855f7';
    const iconSvg =
        type === 'visited'
            ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8"><path d="M19 14c1.49-1.28 3.6-2.34 3.6-5a6 6 0 0 0-11.5-2 6 6 0 0 0-5.88 5.6C4.1 14.63 11 20 12 22v-3c2 0 4-1 6-4Z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

    return L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="transform:translate(-50%, -100%); filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));">${iconSvg}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

const visitedIcon = createCustomIcon('visited');
const toVisitIcon = createCustomIcon('to_visit');

export default function LeafletMap({
    places,
    center,
    zoom,
    onMapClick,
    onMarkerClick,
}: LeafletMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));

        mapInstanceRef.current = map;

        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            map.off();
            map.remove();
            mapInstanceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const currentMarkers = markersRef.current;
        const activeIds = new Set(places.map((p) => p.id));

        Object.keys(currentMarkers).forEach((id) => {
            if (!activeIds.has(id)) {
                currentMarkers[id].remove();
                delete currentMarkers[id];
            }
        });

        places.forEach((place) => {
            const icon = place.status === 'visited' ? visitedIcon : toVisitIcon;

            const popupContent = `
        <div class="font-sans text-sm min-w-[150px]">
          <p class="font-bold text-gray-800 mb-1">${place.name}</p>
          ${place.rating ? `<p class="text-yellow-500 text-xs">Rating: ${'★'.repeat(place.rating)}</p>` : ''}
        </div>
      `;

            if (currentMarkers[place.id]) {
                currentMarkers[place.id].setIcon(icon);
                currentMarkers[place.id].setPopupContent(popupContent);
            } else {
                const marker = L.marker([place.lat, place.lng], { icon })
                    .addTo(map)
                    .bindPopup(popupContent);

                marker.on('click', () => {
                    // ✅ passa un Place coerente (category può essere null/undefined)
                    onMarkerClick(place);
                });

                currentMarkers[place.id] = marker;
            }
        });
    }, [places, onMarkerClick]);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', minHeight: '400px', zIndex: 0 }}
            className="relative"
        />
    );
}
