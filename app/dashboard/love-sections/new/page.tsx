'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoveSectionForm from '../_components/LoveSectionForm';

export default function NewLoveSectionPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/dashboard/love-sections"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-rose-600 transition-colors mb-4 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Torna alle sezioni
                </Link>
                <h1 className="text-3xl font-handwritten font-bold text-rose-800">
                    Nuova Sezione d'Amore
                </h1>
                <p className="text-rose-600/70 mt-1">
                    Crea un nuovo spazio tutto vostro.
                </p>
            </div>

            <LoveSectionForm />
        </div>
    );
}
