'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Sparkles, User, Mail, Lock, Heart, Loader2 } from 'lucide-react';

type UserRole = 'nicolo' | 'angelica';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('nicolo');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Le password non corrispondono, amore!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/login`
          : undefined;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: name,
            partner_role: role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Registrazione non riuscita. Riprova.');
        return;
      }

      router.push('/auth/verify-email');
    } catch (err) {
      setError('Si è verificato un errore durante la registrazione. Riprova.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden py-10">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-pink-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 text-pink-500 mb-4 shadow-sm animate-bounce-slow">
              <Sparkles className="w-8 h-8 fill-current" />
            </div>
            <h1 className="text-4xl font-handwritten text-pink-900 mb-2">Crea il Diario</h1>
            <p className="text-pink-600/80 font-medium">Iniziate la vostra avventura insieme</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-shake">
              <span className="text-lg">💔</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-pink-900 ml-1" htmlFor="name">Il tuo nome</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 transition-colors group-focus-within:text-pink-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/50 border border-pink-200 text-pink-900 rounded-xl px-11 py-3.5 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-pink-300/70"
                  placeholder="Come ti chiami?"
                  required
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-pink-900 ml-1">
                Chi sei?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('nicolo')}
                  className={`relative p-4 border-2 rounded-2xl transition-all ${role === 'nicolo'
                    ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-md transform scale-[1.02]'
                    : 'border-pink-100 bg-white/50 text-pink-400 hover:border-pink-300 hover:bg-white'
                    }`}
                >
                  <div className="text-3xl mb-2 text-center">🦁</div>
                  <div className="font-bold text-center">Nicolò</div>
                  <div className="text-xs text-center opacity-70 mt-1">Cuoricino</div>
                  {role === 'nicolo' && <div className="absolute top-2 right-2 text-pink-500"><Heart className="w-4 h-4 fill-current" /></div>}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('angelica')}
                  className={`relative p-4 border-2 rounded-2xl transition-all ${role === 'angelica'
                    ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-md transform scale-[1.02]'
                    : 'border-pink-100 bg-white/50 text-pink-400 hover:border-pink-300 hover:bg-white'
                    }`}
                >
                  <div className="text-3xl mb-2 text-center">🦄</div>
                  <div className="font-bold text-center">Angelica</div>
                  <div className="text-xs text-center opacity-70 mt-1">Stellina</div>
                  {role === 'angelica' && <div className="absolute top-2 right-2 text-pink-500"><Heart className="w-4 h-4 fill-current" /></div>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-pink-900 ml-1" htmlFor="password">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 transition-colors group-focus-within:text-pink-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/50 border border-pink-200 text-pink-900 rounded-xl px-11 py-3.5 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-pink-300/70"
                    placeholder="Min. 8 caratteri"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-pink-900 ml-1" htmlFor="confirmPassword">Conferma</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 w-5 h-5 transition-colors group-focus-within:text-pink-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/50 border border-pink-200 text-pink-900 rounded-xl px-11 py-3.5 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-pink-300/70"
                    placeholder="Riscrivila"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-pink-500/25 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sto creando il diario...
                </>
              ) : (
                'Crea Account ❤️'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-pink-600/80">
              Hai già la chiave segreta?{' '}
              <Link href="/auth/login" className="text-pink-700 font-bold hover:underline decoration-2 underline-offset-2">
                Accedi subito
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
