'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Heart, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email o password non corretti. Riprova, amore!');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Qualcosa è andato storto. Riprova più tardi.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10 transform transition-all hover:scale-[1.01]">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 text-pink-500 mb-4 shadow-sm animate-bounce-slow">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h1 className="text-4xl font-handwritten text-pink-900 mb-2">Bentornati</h1>
            <p className="text-pink-600/80 font-medium">Il vostro mondo segreto vi aspetta</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-shake">
              <span className="text-lg">💔</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-pink-900 ml-1" htmlFor="email">Email</label>
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-pink-900" htmlFor="password">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-pink-500 hover:text-pink-700 font-medium transition-colors">
                  Dimenticata?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 transition-colors group-focus-within:text-pink-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-pink-200 text-pink-900 rounded-xl px-11 py-3.5 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-pink-300/70"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-pink-500/25 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Apro il diario...
                </>
              ) : (
                'Entra nel Diario ❤️'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-pink-600/80">
              Non hai ancora la chiave?{' '}
              <Link href="/auth/register" className="text-pink-700 font-bold hover:underline decoration-2 underline-offset-2">
                Creala subito
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-pink-400 font-medium">
            Protetto con amore e crittografia 🔒
          </p>
        </div>
      </div>
    </div>
  );
}
