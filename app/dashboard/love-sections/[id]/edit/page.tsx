'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ArrowLeft, Loader2 } from 'lucide-react';
import LoveSectionForm from '../../_components/LoveSectionForm';

export default function EditLoveSectionPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = useMemo(() => getSupabaseClient(), []);

    const [section, setSection] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

            if (error) {
                console.warn("Section not found or error", error);
                router.push('/dashboard/love-sections');
                return;
            }
            setSection(data);
        } catch (error) {
            console.error('Error loading section:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20 text-rose-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Caricamento dati...
            </div>
        );
    }

    if (!section) return null;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link
                    href={`/dashboard/love-sections/${id}`}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-rose-600 transition-colors mb-4 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Annulla modifica
                </Link>
                <h1 className="text-3xl font-handwritten font-bold text-rose-800">
                    Modifica Sezione
                </h1>
                <p className="text-rose-600/70 mt-1">
                    Aggiorna i dettagli di "{section.title}"
                </p>
            </div>

            <LoveSectionForm initialData={section} isEditing={true} />
        </div>
    );
}
