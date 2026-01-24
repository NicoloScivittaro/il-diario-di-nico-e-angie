'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Correct import for App Router
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
    ArrowLeft, Save, Calendar, Image as ImageIcon, X, UploadCloud, Loader2
} from 'lucide-react';

export default function NewMemoryPage() {
    const router = useRouter();
    // No useParams needed here unless we are in [id]/edit, but reuse same component logic if possible?
    // For simplicity, I'll make NewMemoryPage specific to create, and reuse it for edit with props later if needed or separate file.

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<{ file?: File, url: string, isNew: boolean }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const supabase = useMemo(() => getSupabaseClient(), []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));

        // Verify storage bucket is accessible
        supabase.storage.listBuckets().then(({ data, error }) => {
            if (error) {
                console.error('[STORAGE] Error listing buckets:', error);
            } else {
                const tetsExists = data?.some(b => b.name === 'tets');
                console.log('[STORAGE] Available buckets:', data?.map(b => b.name));
                console.log('[STORAGE] Bucket "tets" exists:', tetsExists);
                if (!tetsExists) {
                    console.warn('[STORAGE] WARNING: Bucket "tets" not found! Uploads will fail.');
                }
            }
        });
    }, [supabase]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages = Array.from(e.target.files).map(file => ({
                file,
                url: URL.createObjectURL(file), // Preview URL
                isNew: true
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) {
            alert('Non sei loggato!');
            return;
        }

        setIsSaving(true);
        const authorId = session.user.id;
        const authorRole = session.user.user_metadata?.partner_role || 'unknown';

        try {
            // A recipient ID is generated client-side for path consistency
            const memoryId = crypto.randomUUID();

            console.log('Starting save process for memory:', memoryId);

            // 1. SAVE MEMORY TO DB (Critical Path)
            const memoryPayload = {
                id: memoryId,
                author_id: authorId,
                author_role: authorRole,
                title,
                memory_date: date,
                content,
            };

            const { error: dbError } = await supabase
                .from('memories')
                .insert(memoryPayload);

            if (dbError) {
                console.error('CRITICAL: DB Insert Failed:', dbError);
                throw new Error(`Database save failed: ${dbError.message}`);
            }

            console.log('Memory record saved. Starting image uploads...');

            // 2. PREPARE UPLOADS WITH ENHANCED ERROR HANDLING
            const uploadsToPerform = images
                .filter(img => img.isNew && img.file)
                .map(async (img) => {
                    const file = img.file!;

                    // AGGRESSIVE filename sanitization
                    // 1. Remove extension temporarily
                    const lastDotIndex = file.name.lastIndexOf('.');
                    const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
                    const extension = lastDotIndex > 0 ? file.name.substring(lastDotIndex) : '';

                    // 2. Clean the name: only alphanumeric, replace everything else with underscore
                    // 2. Clean the name: only alphanumeric, replace spaces with DASH
                    const cleanName = nameWithoutExt
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents (è -> e)
                        .replace(/\s+/g, '-')           // spaces to dashes
                        .replace(/[^a-zA-Z0-9_-]/g, '') // remove non-alphanumeric chars (except - and _)
                        .replace(/-+/g, '-')            // collapse multiple dashes
                        .replace(/_+/g, '_')            // collapse multiple underscores
                        .replace(/^-+|-+$/g, '');       // trim dashes from start/end

                    // 3. Clean extension too
                    const cleanExt = extension.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();

                    const timestamp = Date.now();
                    const sanitizedName = `${cleanName}${cleanExt}`;

                    // Path: {authorId}/{memoryId}/{timestamp}-{sanitizedName}
                    const path = `${authorId}/${memoryId}/${timestamp}-${sanitizedName}`;

                    console.log(`[UPLOAD START] Original: "${file.name}" -> Sanitized: "${sanitizedName}"`);
                    console.log(`[UPLOAD PATH] ${path}`);
                    console.log(`[UPLOAD TYPE] ${file.type || 'unknown'}`);
                    console.log(`[UPLOAD SIZE] ${file.size} bytes`);

                    try {
                        const { data, error } = await supabase.storage
                            .from('tets')
                            .upload(path, file, {
                                cacheControl: '3600',
                                upsert: false,
                                contentType: file.type || 'application/octet-stream' // CRITICAL: Always pass contentType
                            });

                        if (error) {
                            console.error(`[UPLOAD FAILED] ${file.name}:`, {
                                message: error.message,
                                statusCode: (error as any).statusCode,
                                error: error
                            });
                            throw new Error(`${file.name}: ${error.message}`);
                        }

                        // Get Public URL
                        const { data: publicUrlData } = supabase.storage
                            .from('tets')
                            .getPublicUrl(path);

                        console.log(`[UPLOAD SUCCESS] ${file.name} -> ${publicUrlData.publicUrl}`);
                        return publicUrlData.publicUrl;
                    } catch (err: any) {
                        console.error(`[UPLOAD EXCEPTION] ${file.name}:`, err);
                        throw new Error(`${file.name}: ${err.message || 'Unknown error'}`);
                    }
                });

            // 3. EXECUTE UPLOADS IN PARALLEL
            const results = await Promise.allSettled(uploadsToPerform);

            const successfulUrls: string[] = [];
            const failedFiles: string[] = [];

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    successfulUrls.push(result.value);
                } else {
                    const reason = result.reason as Error;
                    failedFiles.push(reason.message);
                }
            });

            // Add existing images (if editing)
            images.forEach(img => {
                if (!img.isNew) successfulUrls.push(img.url);
            });

            // 4. SAVE IMAGE LINKS TO DB
            if (successfulUrls.length > 0) {
                const imagesPayload = successfulUrls.map(url => ({
                    memory_id: memoryId,
                    image_url: url
                }));

                const { error: imgDbError } = await supabase
                    .from('memory_images')
                    .insert(imagesPayload);

                if (imgDbError) {
                    console.error('Error linking images to memory:', imgDbError);
                    alert('Ricordo salvato, ma errore nel collegamento immagini nel DB.');
                }
            }

            // 5. FINAL FEEDBACK WITH DETAILED REPORTING
            console.log(`[UPLOAD SUMMARY] Total: ${images.filter(i => i.isNew).length}, Success: ${successfulUrls.length}, Failed: ${failedFiles.length}`);

            if (failedFiles.length > 0) {
                console.warn('[FAILED UPLOADS]', failedFiles);
                const errorDetails = failedFiles.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
                alert(
                    `✅ Ricordo salvato!\n\n` +
                    `📸 Immagini caricate: ${successfulUrls.length}\n` +
                    `❌ Immagini NON caricate: ${failedFiles.length}\n\n` +
                    `Dettagli errori:\n${errorDetails}\n\n` +
                    `Controlla la console del browser (F12) per maggiori dettagli.`
                );
            } else if (successfulUrls.length > 0) {
                console.log('[SUCCESS] All uploads completed successfully!');
            } else {
                console.log('[INFO] Memory saved without images.');
            }

            router.push('/dashboard/memories');

        } catch (err: any) {
            console.error('Save failed:', err);

            // Local Fallback ONLY if main DB insert completely failed (e.g. offline)
            // If we are here because of DB error in step 1:
            const newMemory = {
                id: crypto.randomUUID(),
                title, date, content,
                images: images.map(i => ({ image_url: i.url })),
                author_id: authorId,
                created_at: new Date().toISOString(),
                isLocal: true
            };

            const local = JSON.parse(localStorage.getItem('memories-fallback') || '[]');
            localStorage.setItem('memories-fallback', JSON.stringify([...local, newMemory]));

            alert(`Errore salvataggio cloud: ${err.message || 'Sconosciuto'}. Salvato in copia locale.`);
            router.push('/dashboard/memories');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Nav */}
            <div className="mb-8">
                <Link href="/dashboard/memories" className="text-gray-400 hover:text-rose-500 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Torna ai ricordi
                </Link>
                <h1 className="text-3xl font-handwritten font-bold text-rose-800">Scrivi un nuovo ricordo</h1>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl space-y-8 relative">

                {/* Title & Date */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Titolo</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Es. La nostra gita al mare..."
                            className="w-full text-xl font-bold p-4 bg-white/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none placeholder:text-gray-300 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Data
                        </label>
                        <input
                            required
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full text-lg p-4 bg-white/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none text-gray-600"
                        />
                    </div>
                </div>

                {/* Images Dropzone */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Foto (Opzionale)
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="aspect-square relative rounded-xl overflow-hidden group border border-gray-100 shadow-sm">
                                <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-rose-200 rounded-xl text-rose-300 hover:text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-all"
                        >
                            <UploadCloud className="w-8 h-8 mb-1" />
                            <span className="text-xs font-bold">Aggiungi</span>
                        </button>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Il racconto</label>
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="C'era una volta..."
                        className="w-full min-h-[300px] p-6 bg-white/50 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-200 outline-none text-lg leading-relaxed font-handwritten text-gray-700 resize-y"
                    />
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-rose-50 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-full shadow-lg shadow-rose-200 hover:shadow-rose-400 transform transition-all hover:-translate-y-1 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Salvataggio...' : 'Salva nel Diario'}
                    </button>
                </div>

            </form>
        </div>
    );
}
