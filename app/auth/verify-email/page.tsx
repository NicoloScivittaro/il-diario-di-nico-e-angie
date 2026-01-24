'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Mail, Sparkles, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying'); // In real app, this would be set by API check
  // For Supabase, usually you click a link in email which redirects you.
  // This page might just be a "Check your email" instruction page or a landing after verification logic.
  // Given current mock logic, I'll keep the mock logic but style it up.

  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    // Simulazione di verifica - in real Supabase usually happens on the backend or via a token in URL
    const timer = setTimeout(() => {
      setStatus('success'); // Just mocking success for the UI flow
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden py-10">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-pink-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-rose-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10 text-center">

          <div className="mb-8 flex justify-center">
            {status === 'verifying' ? (
              <div className="relative">
                <div className="absolute inset-0 bg-pink-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-pink-100 to-white border-2 border-pink-200 flex items-center justify-center shadow-inner">
                  <Mail className="h-10 w-10 text-pink-500 animate-bounce-slow" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-green-100 to-white border-2 border-green-200 flex items-center justify-center shadow-inner scale-110 transition-transform duration-500">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-handwritten text-pink-900 mb-2">
            {status === 'verifying' ? 'Controlla la posta' : 'Benvenuti a Bordo!'}
          </h1>

          <p className="text-pink-600/80 font-medium mb-6">
            {status === 'verifying'
              ? 'Abbiamo inviato una magia alla tua casella email...'
              : 'Il vostro diario segreto è pronto per essere scritto.'}
          </p>

          {status === 'verifying' ? (
            <div className="space-y-6">
              <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100">
                <p className="text-pink-800 text-sm">
                  Stiamo aspettando conferma da <br />
                  <span className="font-bold text-pink-600">{email || 'la vostra email'}</span>
                </p>
                <div className="mt-4 flex justify-center">
                  <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100">
                <p className="text-green-800 text-sm">
                  Email verificata con successo! <br />
                  Potete iniziare a scrivere la vostra storia.
                </p>
              </div>

              <Link
                href="/auth/login"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-pink-500/25 transform transition-all hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5" />
                Entra nel Diario
              </Link>
            </div>
          )}

          {status === 'verifying' && (
            <div className="mt-8 text-center text-sm text-pink-400">
              <p>
                Non è arrivato nulla?{' '}
                <button className="text-pink-600 font-bold hover:underline">
                  Invia di nuovo
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
