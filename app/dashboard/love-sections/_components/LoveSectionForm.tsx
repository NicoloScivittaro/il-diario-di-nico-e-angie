'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Loader2, UploadCloud, X, Image as ImageIcon, Smile } from 'lucide-react';

const THEME_COLORS = [
    { id: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', ring: 'ring-rose-200' },
    { id: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', ring: 'ring-pink-200' },
    { id: 'lavender', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', ring: 'ring-violet-200' },
    { id: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', ring: 'ring-amber-200' },
    { id: 'sky', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', ring: 'ring-sky-200' },
];

// SCHEMA ESATTO DAL DB (Screenshot)
type LoveSectionData = {
    id?: string;
    user_id?: string;
    title: string;
    description: string;
    icon: string;
    color: string;            // DB: color
    content: string;
    cover_image_url?: string | null; // DB: cover_image_url
};

interface LoveSectionFormProps {
    initialData?: LoveSectionData;
    isEditing?: boolean;
}

export default function LoveSectionForm({ initialData, isEditing = false }: LoveSectionFormProps) {
    const router = useRouter();
    const supabase = useMemo(() => getSupabaseClient(), []);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        icon: initialData?.icon || '❤️',
        color: initialData?.color || 'rose', // DB: color
        content: initialData?.content || '',
    });

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover_image_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const removeCover = () => {
        setCoverFile(null);
        setCoverPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utente non autenticato');

            let finalCoverUrl = initialData?.cover_image_url;

            // 1. Upload logic matches exact DB columns
            if (coverFile) {
                const nameWithoutExt = coverFile.name.substring(0, coverFile.name.lastIndexOf('.'));
                const ext = coverFile.name.substring(coverFile.name.lastIndexOf('.'));
                const cleanName = nameWithoutExt
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
                    .replace(/\s+/g, '-')             // spaces to dashes
                    .replace(/[^a-zA-Z0-9_-]/g, '')   // remove weird chars
                    .replace(/-+/g, '-')              // collapse dashes
                    .replace(/^-+|-+$/g, '');         // trim

                const filename = `${user.id}/${Date.now()}-${cleanName}${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('love-sections')
                    .upload(filename, coverFile, { upsert: false, contentType: coverFile.type });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('love-sections')
                    .getPublicUrl(filename);

                finalCoverUrl = publicUrlData.publicUrl;
            } else if (coverPreview === null) {
                finalCoverUrl = null;
            }

            // 2. Prepare Payload using EXACT DB column names
            const payload = {
                user_id: user.id,
                title: formData.title,
                description: formData.description,
                icon: formData.icon,
                color: formData.color,           // DB: color
                content: formData.content,
                cover_image_url: finalCoverUrl   // DB: cover_image_url
            };

            let error;
            if (isEditing && initialData?.id) {
                const res = await supabase
                    .from('love_sections')
                    .update(payload)
                    .eq('id', initialData.id);
                error = res.error;
            } else {
                const res = await supabase
                    .from('love_sections')
                    .insert(payload);
                error = res.error;
            }

            if (error) {
                console.error('[Supabase Error]', error);
                throw error;
            }

            router.refresh();
            router.push('/dashboard/love-sections');
        } catch (error: any) {
            console.error('Save error:', error);
            alert(`Errore: ${error.message || 'Errore sconosciuto'}`);
        } finally {
            setLoading(false);
        }
    };

    const currentTheme = THEME_COLORS.find(t => t.id === formData.color) || THEME_COLORS[0];

    return (
        <form onSubmit={handleSubmit} className={`glass-card p-6 md:p-8 rounded-3xl space-y-8 border-2 ${currentTheme.border}`}>
            {/* Header: Icon & Title */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Icona</label>
                    <div className="relative">
                        <input
                            type="text"
                            maxLength={2}
                            value={formData.icon}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                            className="w-16 h-16 text-center text-3xl rounded-2xl border-2 border-gray-100 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 outline-none transition-all shadow-sm"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100 pointer-events-none">
                            <Smile className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Titolo</label>
                    <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Es. Le nostre canzoni..."
                        className="w-full text-xl font-bold p-4 bg-white/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none text-gray-800 placeholder:text-gray-300 transition-all font-handwritten"
                    />
                </div>
            </div>

            {/* Color Theme */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Colore Tema</label>
                <div className="flex flex-wrap gap-3">
                    {THEME_COLORS.map(theme => (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: theme.id })}
                            className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 ${theme.bg} ${theme.border} ${formData.color === theme.id
                                ? `ring-4 ${theme.ring} scale-110 shadow-md`
                                : 'opacity-70 hover:opacity-100'
                                }`}
                            title={theme.id}
                        />
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Breve Descrizione</label>
                <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Di cosa parla questa sezione?"
                    className="w-full p-4 bg-white/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none text-gray-600"
                />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Immagine di Copertina (Opzionale)
                </label>

                {coverPreview ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md group border-2 border-gray-100">
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={removeCover}
                            className="absolute top-4 right-4 bg-white/90 text-rose-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[3/1] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer gap-2"
                    >
                        <UploadCloud className="w-8 h-8" />
                        <span className="text-sm font-medium">Clicca per caricare un'immagine</span>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contenuto Libero</label>
                <textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Scrivi qui tutto quello che vuoi..."
                    className="w-full min-h-[300px] p-6 bg-white/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-rose-200 outline-none text-lg text-gray-700 font-handwritten leading-relaxed resize-y"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 md:pt-8 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                >
                    Annulla
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transform transition-all hover:-translate-y-1 flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-600'}`}
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? 'Salvataggio...' : isEditing ? 'Aggiorna' : 'Crea'}
                </button>
            </div>
        </form>
    );
}
