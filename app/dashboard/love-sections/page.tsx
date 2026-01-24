'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Search, Plus, Sparkles, Loader2, ArrowRight } from 'lucide-react';

// DB SCHEMA EXACT
type LoveSection = {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;            // DB: color
    cover_image_url: string | null; // DB: cover_image_url
    created_at: string;
};

const THEME_STYLES: Record<string, string> = {
    rose: 'from-rose-50 to-rose-100 hover:shadow-rose-100 border-rose-100 text-rose-800',
    pink: 'from-pink-50 to-pink-100 hover:shadow-pink-100 border-pink-100 text-pink-800',
    lavender: 'from-violet-50 to-violet-100 hover:shadow-violet-100 border-violet-100 text-violet-800',
    amber: 'from-amber-50 to-amber-100 hover:shadow-amber-100 border-amber-100 text-amber-800',
    sky: 'from-sky-50 to-sky-100 hover:shadow-sky-100 border-sky-100 text-sky-800',
};

export default function LoveSectionsHub() {
    const supabase = useMemo(() => getSupabaseClient(), []);
    const [sections, setSections] = useState<LoveSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSections();
    }, [supabase]);

    const fetchSections = async () => {
        try {
            const { data, error } = await supabase
                .from('love_sections')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSections(data || []);
        } catch (error) {
            console.error('Error fetching sections:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="w-full max-w-7xl mx-auto">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-handwritten font-bold text-rose-800 mb-2 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-rose-500 fill-rose-100" />
                        Le Nostre Sezioni
                    </h1>
                    <p className="text-rose-600/80 font-medium ml-1">Spazi speciali per custodire tutto ciò che amiamo.</p>
                </div>

                <Link
                    href="/dashboard/love-sections/new"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-full shadow-lg shadow-rose-200 hover:shadow-rose-400 transform transition-all hover:-translate-y-1"
                >
                    <Plus className="w-6 h-6" />
                    Crea Sezione
                </Link>
            </div>

            {/* Search Bar */}
            <div className="relative mb-12 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-rose-300" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-md border border-rose-100 rounded-2xl text-rose-900 placeholder-rose-300 focus:ring-4 focus:ring-rose-100 focus:border-rose-300 transition-all shadow-sm text-lg"
                    placeholder="Cerca una sezione del cuore..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-rose-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="text-lg font-medium">Caricamento amore in corso...</p>
                </div>
            ) : filteredSections.length === 0 ? (
                <div className="text-center py-20 px-4">
                    <div className="inline-block p-6 rounded-full bg-rose-50 mb-6 animate-bounce-slow">
                        <Sparkles className="w-12 h-12 text-rose-300" />
                    </div>
                    <h3 className="text-2xl font-handwritten font-bold text-rose-800 mb-2">Nessuna sezione trovata</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        {searchQuery ? 'Prova a cercare qualcos\'altro.' : 'Non avete ancora creato nessuna sezione speciale. Iniziate ora!'}
                    </p>
                    {!searchQuery && (
                        <Link href="/dashboard/love-sections/new" className="text-rose-600 font-bold hover:underline">
                            + Crea la prima sezione
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSections.map((section) => {
                        // MAPPING DB EXACT
                        const themeClass = THEME_STYLES[section.color] || THEME_STYLES['rose']; // DB: color
                        const imageUrl = section.cover_image_url ? encodeURI(section.cover_image_url) : null; // DB: cover_image_url

                        return (
                            <Link key={section.id} href={`/dashboard/love-sections/${section.id}`} className="group h-full">
                                <article className={`h-full relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${themeClass} bg-opacity-10 border border-white/50 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col`}>

                                    {/* Cover Image Area */}
                                    <div className="h-48 w-full relative overflow-hidden bg-white/40">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={section.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                                <Sparkles className="w-20 h-20" />
                                            </div>
                                        )}

                                        {/* Icon Badge */}
                                        <div className="absolute -bottom-6 left-8 w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md border-4 border-white transform group-hover:rotate-12 transition-transform">
                                            {section.icon || '❤️'}
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="pt-10 pb-8 px-8 flex-1 flex flex-col">
                                        <h3 className="text-2xl font-handwritten font-bold mb-3 line-clamp-1">
                                            {section.title}
                                        </h3>
                                        {section.description && (
                                            <p className="text-sm font-medium opacity-70 line-clamp-3 mb-6 flex-1 text-gray-700 leading-relaxed">
                                                {section.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex items-center text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity gap-1">
                                            Esplora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
