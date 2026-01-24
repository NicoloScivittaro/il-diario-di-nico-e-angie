export type Place = {
    id: string;
    name: string;
    category?: string | null;  // ✅ prima era obbligatoria
    status: 'visited' | 'to_visit';
    rating?: number;
    notes?: string;
    lat: number;
    lng: number;
    date?: string;
    author_id?: string;
};
