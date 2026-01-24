'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Mail, ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const supabase = useMemo(() => getSupabaseClient(), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const redirectTo =
                typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/update-password`
                    : undefined;

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (resetError) {
                setError(resetError.message || 'Si è verificato un errore. Riprova.');
                return;
            }

            setMessage('Controlla la tua email! Ti abbiamo inviato il link magico per reimpostare la password.');
        } catch (err) {
            setError('Impossibile inviare la richiesta. Riprova più tardi.');
            console.error('Reset password error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden py-10">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-pink-200 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-purple-200 rounded-full blur-[100px] opacity-30 animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10">

                    <Link href="/auth/login" className="inline-flex items-center text-pink-500 hover:text-pink-700 font-medium mb-6 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Torna al login
                    </Link>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 text-pink-500 mb-4 shadow-sm">
                            <Sparkles className="w-8 h-8 fill-current animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-handwritten text-pink-900 mb-2">Password Dimenticata?</h1>
                        <p className="text-pink-600/80 font-medium">Non preoccuparti, capita a tutti!</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-shake">
                            <span className="text-lg">💔</span> {error}
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm flex items-center gap-2 animate-fade-in-up">
                            <span className="text-lg">💌</span> {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-pink-900 ml-1" htmlFor="email">La tua Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 transition-colors group-focus-within:text-pink-500" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/50 border border-pink-200 text-pink-900 rounded-xl px-11 py-3.5 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-pink-300/70"
                                    placeholder="la.tua@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-pink-500/25 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Invio in corso...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Invia Link Magico
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
