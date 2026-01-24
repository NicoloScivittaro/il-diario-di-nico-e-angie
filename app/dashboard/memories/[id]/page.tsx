'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
    ArrowLeft, Calendar, Edit2, Trash2, Clock, Share2, Image as ImageIcon
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

export default function MemoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [memory, setMemory] = useState<Memory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = useMemo(() => getSupabaseClient(), []);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));

        const fetchMemory = async () => {
            // 1. Try DB
            const { data, error } = await supabase
                .from('memories')
                .select(`*, images:memory_images(image_url)`)
                .eq('id', id)
                .single();

            if (data) {
                console.log('[MEMORY DETAIL] Loaded memory:', data.id);
                console.log('[MEMORY DETAIL] Images:', data.images);
                if (data.images && data.images.length > 0) {
                    console.log('[MEMORY DETAIL] First image URL:', data.images[0].image_url);
                }
                setMemory(data as any);
            } else {
                // 2. Try Local
                const local = JSON.parse(localStorage.getItem('memories-fallback') || '[]');
                const found = local.find((m: Memory) => m.id === id);
                if (found) {
                    console.log('[MEMORY DETAIL] Loaded from local storage');
                    setMemory(found);
                }
            }
            setIsLoading(false);
        };

        if (id) fetchMemory();
    }, [id, supabase]);

    const handleDelete = async () => {
        if (!confirm('Sei sicuro di voler eliminare questo ricordo per sempre?')) return;

        const { error } = await supabase.from('memories').delete().eq('id', id);
        if (!error) {
            router.push('/dashboard/memories');
        } else {
            alert('Errore cancellazione: ' + error.message);
        }
    };

    if (isLoading) return <div className="p-20 text-center">Caricamento...</div>;
    if (!memory) return <div className="p-20 text-center">Ricordo non trovato.</div>;

    const isAuthor = session?.user?.id === memory.author_id;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header Navigation */}
            <div className="flex justify-between items-center mb-8">
                <Link href="/dashboard/memories" className="text-gray-400 hover:text-rose-500 flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Torna alla lista
                </Link>

                {isAuthor && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-rose-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        {/* Edit link could go here */}
                    </div>
                )}
            </div>

            {/* Article Card */}
            <article className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl bg-white/80">

                {/* Cover Image */}
                {memory.images && memory.images.length > 0 && (
                    <div className="w-full h-80 bg-gradient-to-br from-rose-50 to-pink-50 relative overflow-hidden">
                        <img
                            src={memory.images[0].image_url}
                            alt={memory.title}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                                console.error('[IMAGE ERROR] Failed to load:', memory.images[0].image_url);
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-rose-300"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>

                        <div className="absolute bottom-6 left-6 text-white text-shadow-sm z-10">
                            <h1 className="text-4xl md:text-5xl font-handwritten font-bold mb-2">{memory.title}</h1>
                            <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                                <span className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(memory.memory_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-8 md:p-12">
                    {/* Metadata if no image */}
                    {(!memory.images || memory.images.length === 0) && (
                        <div className="mb-8 border-b border-rose-100 pb-8">
                            <h1 className="text-4xl md:text-5xl font-handwritten font-bold text-rose-900 mb-4">{memory.title}</h1>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Calendar className="w-4 h-4 text-rose-400" />
                                {new Date(memory.memory_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-rose max-w-none text-gray-700 text-lg leading-loose font-handwritten whitespace-pre-wrap">
                        {memory.content}
                    </div>

                    {/* Gallery (Remaining Images) */}
                    {memory.images && memory.images.length > 1 && (
                        <div className="mt-12 pt-12 border-t border-rose-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-rose-500" /> Galleria
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {memory.images.slice(1).map((img, i) => (
                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        <img src={img.image_url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="Gallery" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
