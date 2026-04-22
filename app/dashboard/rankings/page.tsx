'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Trophy, Star, Award, Loader2 } from 'lucide-react';
import type { Place } from '@/lib/types';

export default function RankingsPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const normalizePlace = (p: Place): Place => ({
    ...p,
    category: p.category ?? 'Altro',
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

  // Group and sort places
  const groupedRankings = useMemo(() => {
    const groups: Record<string, Place[]> = {};

    places.forEach((place) => {
      // Includiamo tutti i posti. Quelli senza voto andranno in fondo alla categoria.
      const cat = place.category || 'Altro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(place);
    });

    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => {
        // Voto null o undefined -> vale -1 per andare in fondo
        const ratingA = (a.rating !== null && a.rating !== undefined) ? a.rating : -1;
        const ratingB = (b.rating !== null && b.rating !== undefined) ? b.rating : -1;
        
        if (ratingA !== ratingB) {
          return ratingB - ratingA; // Ordine decrescente
        }
        
        // Criterio secondario: ordine alfabetico
        return (a.name || '').localeCompare(b.name || '');
      });
    });

    // Ordiniamo le categorie alfabeticamente, magari tenendo "Altro" alla fine
    return Object.keys(groups).sort((a, b) => {
      if (a === 'Altro') return 1;
      if (b === 'Altro') return -1;
      return a.localeCompare(b);
    }).reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, Place[]>);

  }, [places]);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center text-rose-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-12">
      {/* Header Classifica */}
      <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl border border-white/60">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-40 h-40 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 text-yellow-600 mb-6 shadow-md border-4 border-white">
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-handwritten font-bold text-rose-800 mb-4">
            La nostra Classifica
          </h1>
          <p className="text-rose-600/80 font-medium max-w-xl mx-auto text-lg">
            I luoghi migliori delle nostre passeggiate, ordinati in base ai voti che abbiamo dato.
          </p>
        </div>
      </div>

      {/* Classifiche raggruppate per categoria */}
      {Object.keys(groupedRankings).length === 0 ? (
        <div className="text-center p-12 glass-card rounded-3xl">
          <p className="text-gray-500 font-medium">Nessun luogo salvato al momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {Object.entries(groupedRankings).map(([category, categoryPlaces]) => (
            <div key={category} className="glass-card rounded-3xl p-6 shadow-lg border border-white/60 flex flex-col h-full">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-100">
                <div className="bg-rose-100 p-2 rounded-xl text-rose-500 shadow-inner">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {category}
                </h2>
                <span className="ml-auto bg-white/60 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-100">
                  {categoryPlaces.length} {categoryPlaces.length === 1 ? 'luogo' : 'luoghi'}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {categoryPlaces.map((place, index) => {
                  const hasRating = place.rating !== null && place.rating !== undefined;
                  const isTop3 = index < 3 && hasRating;
                  
                  // Styling delle medaglie per i primi 3 posti
                  let positionBadge = "bg-gray-100 text-gray-500 border-gray-200";
                  if (hasRating) {
                    if (index === 0) positionBadge = "bg-gradient-to-br from-yellow-300 to-amber-400 text-amber-900 border-yellow-200 shadow-md scale-110";
                    else if (index === 1) positionBadge = "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 border-gray-300 shadow-sm scale-105";
                    else if (index === 2) positionBadge = "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 border-orange-300 shadow-sm scale-105";
                  }

                  return (
                    <div 
                      key={place.id} 
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                        isTop3 ? 'bg-white/90 border-transparent hover:border-yellow-200 hover:shadow-lg transform hover:-translate-y-0.5' : 'bg-white/40 border-transparent hover:bg-white/80 hover:shadow-md'
                      }`}
                    >
                      {/* Medaglia/Posizione */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 shrink-0 ${positionBadge} transition-transform`}>
                        {index + 1}
                      </div>

                      {/* Info Luogo */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold truncate ${isTop3 ? 'text-gray-900 text-lg' : 'text-gray-700'}`}>
                          {place.name}
                        </h3>
                        {place.notes && (
                          <p className="text-xs text-gray-500 truncate mt-0.5 italic">
                            "{place.notes}"
                          </p>
                        )}
                      </div>

                      {/* Voto Risaltato */}
                      <div className="shrink-0 text-right">
                        {hasRating ? (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                            isTop3 ? 'bg-rose-50 border-rose-200 shadow-inner' : 'bg-white border-rose-100'
                          }`}>
                            <span className="font-bold text-rose-700 text-lg">{place.rating}</span>
                            <span className="text-xs text-rose-400 font-bold hidden sm:inline">/10</span>
                            <Star className={`w-4 h-4 ml-0.5 ${isTop3 ? 'text-yellow-500 fill-yellow-500' : 'text-rose-300 fill-rose-300'}`} />
                          </div>
                        ) : (
                          <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-400 font-medium">Non valutato</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
