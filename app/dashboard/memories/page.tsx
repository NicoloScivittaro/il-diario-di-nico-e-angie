'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

import {
  Heart, Plus, Calendar, Image as ImageIcon, Search,
  ArrowRight, Loader2, BookOpen, Clock
} from 'lucide-react';

type Memory = {
  id: string;
  title: string;
  memory_date: string;
  content: string;
  author_id: string;
  author_role?: string;
  created_at: string;
  images: { image_url: string }[];
};

export default function MemoriesListPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch memories
      const { data, error } = await supabase
        .from('memories')
        .select(`
                *,
                images:memory_images(image_url)
            `)
        .order('memory_date', { ascending: false });

      if (error) {
        console.warn('[MEMORIES LIST] Supabase fetch error:', error.message);
      } else if (data) {
        console.log('[MEMORIES LIST] Fetched memories:', data.length);
        console.log('[MEMORIES LIST] Full data:', data);
        data.forEach((mem, idx) => {
          console.log(`[MEMORY ${idx}] Full object:`, mem);
          console.log(`[MEMORY ${idx}] Title: "${mem.title}"`);
          console.log(`[MEMORY ${idx}] Images array:`, mem.images);
          if (mem.images && mem.images.length > 0) {
            console.log(`[MEMORY ${idx}] Has ${mem.images.length} images`);
            console.log(`[MEMORY ${idx}] First image object:`, mem.images[0]);
            console.log(`[MEMORY ${idx}] First image URL:`, mem.images[0].image_url);
            console.log(`[MEMORY ${idx}] URL is valid:`, typeof mem.images[0].image_url === 'string' && mem.images[0].image_url.length > 0);
          } else {
            console.warn(`[MEMORY ${idx}] NO IMAGES FOUND for "${mem.title}"`);
          }
        });
        setMemories(data as any);
      }

      // 2. Fetch LocalStorage (Fallback)
      const local = JSON.parse(localStorage.getItem('memories-fallback') || '[]');
      if (local.length > 0) {
        // Simple merge: add local ones that aren't in remote
        const remoteIds = new Set(data?.map(m => m.id) || []);
        const newLocal = local.filter((m: Memory) => !remoteIds.has(m.id));

        // Note: local memories might need to conform to the type
        setMemories(prev => [...prev, ...newLocal].sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime()));
      }

    } catch (err) {
      console.error('Error fetching memories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMemories = memories.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-handwritten font-bold text-rose-800 mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-rose-500" />
            I Nostri Ricordi
          </h1>
          <p className="text-rose-600/80 font-medium ml-1">Pagine di vita scritte insieme...</p>
        </div>

        <Link
          href="/dashboard/memories/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-full shadow-lg shadow-rose-200 hover:shadow-rose-400 transform transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Scrivi Ricordo
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-rose-300" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-white/60 backdrop-blur-md border border-rose-100 rounded-2xl text-rose-900 placeholder-rose-300 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all shadow-sm"
          placeholder="Cerca tra i ricordi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-rose-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Sfoglio le pagine...</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-rose-200 bg-white/50">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-300">
            <Heart className="w-10 h-10 animate-pulse-soft" />
          </div>
          <h3 className="text-2xl font-handwritten text-rose-800 mb-2">Il diario è ancora vuoto</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Non avete ancora scritto nessun ricordo importante. <br />
            Iniziate oggi a raccontare la vostra storia!
          </p>
          <Link href="/dashboard/memories/new" className="text-rose-600 font-bold hover:underline">
            + Scrivi il primo ricordo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredMemories.map((memory) => {
            // Direct URL usage with encoding for spaces
            const rawCoverUrl = memory.images && memory.images.length > 0 ? memory.images[0].image_url : null;
            // Fix: encodeURI ensures spaces become %20 and other chars are safe
            const coverImageUrl = rawCoverUrl ? encodeURI(rawCoverUrl) : null;

            if (coverImageUrl) console.log(`[RENDER CARD] Memory: "${memory.title}", Encoded URL:`, coverImageUrl);

            return (
              <Link key={memory.id} href={`/dashboard/memories/${memory.id}`} className="group block">
                <article className="h-full glass-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/60 flex flex-col">
                  {/* Image Cover */}
                  <div className="aspect-video w-full bg-gradient-to-br from-rose-50 to-pink-50 relative overflow-hidden">
                    {coverImageUrl ? (
                      <img
                        src={coverImageUrl}
                        alt={memory.title}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        onLoad={() => {
                          console.log('[IMAGE LOADED]', coverImageUrl);
                        }}
                        onError={(e) => {
                          console.error('[IMAGE ERROR] Failed to load:', coverImageUrl);
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-full h-full flex items-center justify-center text-rose-200';
                            placeholder.innerHTML = '<svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-200">
                        <ImageIcon className="w-12 h-12 opacity-50" />
                      </div>
                    )}

                    {/* Overlay Date */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur text-rose-600 text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(memory.memory_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h2 className="text-2xl font-handwritten font-bold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors line-clamp-1">
                      {memory.title}
                    </h2>
                    <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed flex-1">
                      {memory.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-rose-50 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white shadow-sm ${memory.author_role === 'nicolo' ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-600'
                          }`}>
                          {(memory.author_role || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-rose-500 text-sm font-bold group-hover:translate-x-1 transition-transform">
                        Leggi <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
