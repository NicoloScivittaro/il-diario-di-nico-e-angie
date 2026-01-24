// lib/types.ts
export type PlaceStatus = 'visited' | 'to_visit';

export type Place = {
    id: string;
    name: string;
    category?: string | null;   // <-- QUI (definitivo)
    status: PlaceStatus;
    rating?: number | null;
    notes?: string | null;
    lat: number;
    lng: number;
    date?: string | null;

    author_id?: string | null;
    created_at?: string | null;
};
