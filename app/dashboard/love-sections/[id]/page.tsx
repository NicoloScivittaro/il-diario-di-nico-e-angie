'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ArrowLeft, Edit2, Trash2, Calendar, Loader2, Share2, Sparkles } from 'lucide-react';

const THEME_STYLES: Record<string, { bg: string, text: string }> = {
    rose: { bg: 'bg-rose-50', text: 'text-rose-800' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-800' },
    lavender: { bg: 'bg-violet-50', text: 'text-violet-800' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-800' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-800' },
};

export default function LoveSectionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = useMemo(() => getSupabaseClient(), []);

    const [section, setSection] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
        fetchSection();
    }, [id, supabase]);

    const fetchSection = async () => {
        try {
            if (!id) return;

            const { data, error } = await supabase
                .from('love_sections')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setSection(data);
        } catch (error) {
            console.error('Error loading section:', error);
            router.push('/dashboard/love-sections');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Sei sicuro di voler eliminare questa sezione e tutti i suoi contenuti?')) return;

        try {
            const { error } = await supabase
                .from('love_sections')
                .delete()
                .eq('id', id);

            if (error) throw error;
            router.push('/dashboard/love-sections');
        } catch (err: any) {
            alert('Errore eliminazione: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32 text-rose-400">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    if (!section) return null;

    // DB SCHEMA MAPPING EXACT
    const theme = THEME_STYLES[section.color] || THEME_STYLES['rose']; // COLUMN: color
    const imageUrl = section.cover_image_url ? encodeURI(section.cover_image_url) : null; // COLUMN: cover_image_url
    const isOwner = currentUser?.id === section.user_id; // COLUMN: user_id

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Nav */}
            <div className="flex items-center justify-between mb-8">
                <Link
                    href="/dashboard/love-sections"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 transition-colors font-medium rounded-full hover:bg-white px-4 py-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Torna alle sezioni
                </Link>

                {isOwner && (
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/dashboard/love-sections/${id}/edit`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                            title="Modifica"
                        >
                            <Edit2 className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Elimina"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-xl border border-white/60">

                {/* Cover Image Header */}
                <div className={`relative w-full ${imageUrl ? 'h-64 sm:h-96' : 'h-48'}`}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={section.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className={`w-full h-full ${theme.bg} opacity-50 flex items-center justify-center`}>
                            <Sparkles className="w-24 h-24 text-white opacity-40" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 p-8 sm:p-12 w-full">
                        <div className="flex items-end gap-6">
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-lg transform -mb-4 rotate-3">
                                {section.icon || '❤️'} {/* COLUMN: icon */}
                            </div>
                            <div className="flex-1 pb-2">
                                <h1 className="text-4xl sm:text-5xl font-handwritten font-bold text-white drop-shadow-md mb-2">
                                    {section.title}
                                </h1>
                                <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
                                    <span className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(section.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-8 sm:p-12 pt-16">
                    {section.description && (
                        <div className={`p-6 rounded-2xl ${theme.bg} ${theme.text} mb-10 font-medium text-lg border border-white/50 shadow-inner`}>
                            {section.description}
                        </div>
                    )}

                    {section.content ? (
                        <div className="prose prose-lg prose-rose max-w-none font-handwritten text-gray-700 leading-loose whitespace-pre-wrap">
                            {section.content}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 italic">
                            Nessun contenuto scritto qui... tocca a voi riempire questo spazio!
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono">
                    <span>ID: {section.id.split('-')[0]}...</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        Salvato in cloud
                    </div>
                </div>

            </div>
        </div>
    );
}
