'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
  MapPin, Search, Plus, Navigation, X, Loader2, Trash2, Map as MapIcon
} from 'lucide-react';
import type { Place } from '@/lib/types';
import type { Session } from '@supabase/supabase-js';
import type { LeafletMapProps } from '@/components/LeafletMap';

const Map = dynamic<LeafletMapProps>(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 rounded-3xl animate-pulse">
      <MapIcon className="w-12 h-12 text-rose-300 mb-2" />
      <p className="text-rose-400 font-medium">Carico la mappa di Roma...</p>
    </div>
  ),
});

const CATEGORIES = ['Ristorante', 'Passeggiata', 'Parco', 'Monumento', 'Museo', 'Altro'];

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'visited' | 'to_visit'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlacePosition, setNewPlacePosition] = useState<{ lat: number; lng: number } | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formStatus, setFormStatus] = useState<'visited' | 'to_visit'>('visited');
  const [formRating, setFormRating] = useState(10);
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const center: [number, number] = [41.9028, 12.4964];
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    fetchPlaces();
  }, [supabase]);

  useEffect(() => {
    let result = places;

    if (filter !== 'all') result = result.filter((p) => p.status === filter);
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    setFilteredPlaces(result);
  }, [places, filter, searchQuery]);

  const normalizePlace = (p: Place): Place => ({
    ...p,
    category: p.category ?? 'Altro', // ✅ normalizzazione centrale
  });

  const fetchPlaces = async () => {
    setIsLoading(true);
    let allPlaces: Place[] = [];

    try {
      const { data, error } = await supabase.from('places').select('*');
      if (!error && data) {
        allPlaces = (data as unknown as Place[]).map(normalizePlace);
      }
    } catch (err) {
      console.error('Supabase error:', err);
    }

    try {
      const local = localStorage.getItem('places-fallback');
      if (local) {
        const parsed = (JSON.parse(local) as Place[]).map(normalizePlace);
        const remoteIds = new Set(allPlaces.map((p) => p.id));
        const localOnly = parsed.filter((p) => !remoteIds.has(p.id));
        allPlaces = [...allPlaces, ...localOnly];
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }

    setPlaces(allPlaces);
    setIsLoading(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewPlacePosition({ lat, lng });
    setIsAdding(true);
    setSelectedPlace(null);
    setFormName('');
    setFormCategory('Passeggiata');
    setFormNotes('');
    setFormRating(10);
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlacePosition) return;

    setIsSaving(true);

    const tempId = crypto.randomUUID();

    const newPlace: Place = normalizePlace({
      id: tempId,
      name: formName,
      category: formCategory,
      status: formStatus,
      rating: formStatus === 'visited' ? formRating : null,
      notes: formNotes,
      lat: newPlacePosition.lat,
      lng: newPlacePosition.lng,
      date: new Date().toISOString(),
    });

    const dbPayload = {
      name: formName,
      category: formCategory,
      status: formStatus,
      rating: formStatus === 'visited' ? formRating : null,
      notes: formNotes,
      lat: newPlacePosition.lat,
      lng: newPlacePosition.lng,
      author_id: session?.user?.id,
    };

    let savedToDb = false;
    let dbErrorMsg = '';

    if (session?.user?.id) {
      try {
        const { data, error } = await supabase.from('places').insert(dbPayload).select().single();
        if (error) {
          dbErrorMsg = error.message;
        } else if (data) {
          setPlaces((prev) => [...prev, normalizePlace(data as unknown as Place)]);
          savedToDb = true;
        }
      } catch (err) {
        dbErrorMsg = (err as Error).message;
      }
    } else {
      dbErrorMsg = 'Utente non autenticato';
    }

    if (!savedToDb) {
      try {
        const existing = JSON.parse(localStorage.getItem('places-fallback') || '[]') as Place[];
        localStorage.setItem('places-fallback', JSON.stringify([...existing, newPlace]));
        setPlaces((prev) => [...prev, newPlace]);
        alert(`Luogo salvato in locale! (DB errore: ${dbErrorMsg})`);
      } catch {
        alert('Errore critico: impossibile salvare anche in locale.');
      }
    }

    setIsAdding(false);
    setNewPlacePosition(null);
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vuoi davvero cancellare questo luogo?')) return;
    try {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) throw error;
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setSelectedPlace(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center text-rose-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 relative">
      {/* Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-4 h-auto md:h-full max-h-[50vh] md:max-h-none">
        <div className="glass-card p-4 rounded-2xl flex flex-col gap-4">
          <h1 className="text-2xl font-handwritten font-bold text-rose-800 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-rose-500" />
            Le nostre passeggiate
          </h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca luogo..."
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-rose-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${filter === 'all' ? 'bg-rose-500 text-white' : 'bg-white text-gray-500'}`}>Tutti</button>
            <button onClick={() => setFilter('visited')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${filter === 'visited' ? 'bg-pink-500 text-white' : 'bg-white text-gray-500'}`}>Visitati</button>
            <button onClick={() => setFilter('to_visit')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${filter === 'to_visit' ? 'bg-purple-500 text-white' : 'bg-white text-gray-500'}`}>Futuri</button>
          </div>

          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>❤️ {places.filter((p) => p.status === 'visited').length} posti del cuore</span>
            <span>✨ {places.filter((p) => p.status === 'to_visit').length} sogni</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto glass-card rounded-2xl p-2 space-y-2 custom-scrollbar">
          {filteredPlaces.length === 0 ? (
            <div className="text-center p-8 text-rose-400">
              <MapIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun luogo trovato.<br />Clicca sulla mappa per aggiungerne uno!</p>
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => setSelectedPlace(normalizePlace(place))}
                className={`p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-rose-200 hover:shadow-md ${selectedPlace?.id === place.id ? 'bg-rose-50 border-rose-200' : 'bg-white/60'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800 text-sm">{place.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {place.category ?? 'Altro'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 min-h-[400px] md:min-h-0 glass-card rounded-3xl overflow-hidden shadow-xl border border-white/60 relative">
        <Map
          places={filteredPlaces}
          center={center}
          zoom={13}
          onMapClick={handleMapClick}
          onMarkerClick={(p) => setSelectedPlace(normalizePlace(p))}
        />

        {(isAdding || selectedPlace) && (
          <div className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl z-[1000] border border-rose-100 animate-slide-up">
            <button
              onClick={() => { setIsAdding(false); setSelectedPlace(null); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {isAdding ? (
              <form onSubmit={handleSavePlace} className="space-y-4">
                <h3 className="font-bold text-lg text-rose-800 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Nuovo Luogo
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nome</label>
                  <input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-sm p-2 rounded-lg bg-gray-50 border focus:border-rose-400 outline-none"
                    placeholder="Es. Colosseo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Categoria</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full text-sm p-2 rounded-lg bg-gray-50 border outline-none">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Stato</label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full text-sm p-2 rounded-lg bg-gray-50 border outline-none">
                      <option value="visited">Visitato</option>
                      <option value="to_visit">Da vedere</option>
                    </select>
                  </div>
                </div>

                {formStatus === 'visited' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Voto: {formRating}/10</label>
                    <input type="range" min="1" max="10" value={formRating} onChange={(e) => setFormRating(Number(e.target.value))} className="w-full accent-rose-500" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ricordo / Note</label>
                  <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full text-sm p-2 rounded-lg bg-gray-50 border focus:border-rose-400 outline-none h-20 resize-none font-handwritten" placeholder="Scrivi un pensiero..." />
                </div>

                <button type="submit" disabled={isSaving} className="w-full bg-rose-500 text-white font-bold py-2 rounded-xl shadow-md hover:bg-rose-600 transition flex justify-center">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Salva Luogo'}
                </button>
              </form>
            ) : selectedPlace ? (
              <div className="space-y-4">
                <h3 className="font-bold text-xl text-gray-800">{selectedPlace.name}</h3>

                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {selectedPlace.category ?? 'Altro'}
                  </span>
                </div>

                {selectedPlace.notes && (
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <p className="font-handwritten text-gray-700 leading-relaxed italic">
                      "{selectedPlace.notes}"
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button onClick={() => handleDelete(selectedPlace.id)} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Elimina
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
