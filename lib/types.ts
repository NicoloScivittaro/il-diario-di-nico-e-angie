export type Place = {
    id: string;
    name: string;
    category?: string;
    status: 'visited' | 'to_visit';
    rating?: number;
    lat: number;
    lng: number;
    notes?: string;
    image_url?: string;
    date?: string;
};
