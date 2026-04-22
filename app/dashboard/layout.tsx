'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Image as ImageIcon, MapPin, Sparkles, Heart, Menu, X, Loader2, Dices, Trophy, Bell, Check } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { AppNotification } from '@/lib/types';

const navigation = [
  { name: 'Diario', href: '/dashboard', icon: BookOpen },
  { name: 'Album', href: '/dashboard/album', icon: ImageIcon },
  { name: 'Le nostre passeggiate', href: '/dashboard/map', icon: MapPin },
  { name: 'Classifica', href: '/dashboard/rankings', icon: Trophy },
  { name: 'Il nostro amore', href: '/dashboard/love-sections', icon: Sparkles },
  { name: 'I nostri ricordi', href: '/dashboard/memories', icon: Heart },
  { name: 'Cosa facciamo?', href: '/dashboard/wheel', icon: Dices },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const partnerRole = session?.user.user_metadata?.partner_role;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Errore durante il recupero della sessione Supabase', error);
      }

      if (!data.session) {
        router.push('/auth/login');
      } else {
        setSession(data.session);
      }
      setIsCheckingSession(false);
    };

    loadSession();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) {
        return;
      }

      setSession(newSession);
      if (!newSession) {
        router.push('/auth/login');
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Errore durante il logout', error);
    }
  };

  useEffect(() => {
    if (!partnerRole) return;

    let isMounted = true;
    
    // Fetch iniziale
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_role', partnerRole)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data && isMounted) {
        setNotifications(data as AppNotification[]);
      }
    };
    fetchNotifs();

    // Sottoscrizione Realtime
    const channel = supabase.channel('realtime:notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_role=eq.${partnerRole}` },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as AppNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as AppNotification : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [partnerRole, supabase]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // --- WEB PUSH LOGIC ---
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsPushSubscribed(sub !== null);
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) return alert('Browser non supportato');
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const padding = '='.repeat((4 - VAPID_PUBLIC_KEY.length % 4) % 4);
      const base64 = (VAPID_PUBLIC_KEY + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      setIsPushSubscribed(true);
      alert('Notifiche push attivate con successo!');
    } catch (e) {
      console.error(e);
      alert('Impossibile attivare le notifiche push. Hai negato il permesso?');
    }
  };
  // ----------------------

  const displayName =
    session?.user.user_metadata?.full_name || session?.user.email || 'Ospite';
  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || 'N';
  const roleLabel =
    partnerRole === 'angelica'
      ? 'Angelica'
      : partnerRole === 'nicolo'
        ? 'Nicolò'
        : undefined;

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-700">
        <Loader2 className="animate-spin mr-2" />
        <span>Caricamento del tuo spazio d&rsquo;amore...</span>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      
      {/* Notifications Bell */}
      <div className="fixed top-4 right-16 lg:top-8 lg:right-12 z-[60]">
        <button 
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2.5 sm:p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-rose-600 border border-rose-100 hover:bg-rose-50 transition"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce-short">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-100 overflow-hidden animate-slide-up origin-top-right flex flex-col">
            <div className="p-4 border-b border-rose-50 flex flex-col gap-3 bg-rose-50/50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Notifiche</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-rose-500 hover:text-rose-700 font-medium">
                    Segna lette
                  </button>
                )}
              </div>
              {!isPushSubscribed && (
                <button 
                  onClick={subscribeToPush}
                  className="w-full py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Attiva Notifiche Push
                </button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">
                  Nessuna notifica al momento.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-4 transition hover:bg-gray-50 flex gap-3 ${notif.is_read ? 'opacity-70' : 'bg-rose-50/30'}`}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        if (notif.link) router.push(notif.link);
                        setShowNotifs(false);
                      }}
                    >
                      <div className="mt-1">
                        {!notif.is_read ? (
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                        ) : (
                          <Check className="w-3 h-3 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 cursor-pointer">
                        <p className={`text-sm ${notif.is_read ? 'text-gray-600 font-medium' : 'text-gray-900 font-bold'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notif.body}</p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(notif.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          type="button"
          className="p-2 rounded-xl bg-white/80 backdrop-blur-md shadow-lg text-rose-600 border border-rose-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="sr-only">Apri menu</span>
          {sidebarOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Sidebar - Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-white/80 backdrop-blur-xl border-r border-rose-100 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center h-20 px-8 border-b border-rose-100">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse-soft mr-3" />
          <span className="text-2xl font-handwritten font-bold text-rose-800">Nico & Angie</span>
        </div>

        <nav className="p-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100'
                  : 'text-gray-600 hover:bg-white hover:text-rose-600 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-rose-500' : 'text-gray-400 group-hover:text-rose-400'
                    }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="absolute bottom-0 w-full p-6 border-t border-rose-100 bg-rose-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-200 to-pink-200 flex items-center justify-center text-rose-700 font-bold text-xl shadow-inner border-2 border-white">
              {avatarInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
              {roleLabel && <p className="text-xs text-rose-500 font-medium">{roleLabel}</p>}
            </div>
            <button
              className="p-2 text-gray-400 hover:text-rose-500 transition-colors bg-white rounded-full shadow-sm"
              onClick={handleLogout}
              title="Esci"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen p-4 sm:p-8 lg:p-12 transition-all">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Love Counter Card */}
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Heart className="w-32 h-32 rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-baseline justify-between gap-4">
              <div>
                <h2 className="text-3xl font-handwritten font-bold text-rose-800 mb-1">Il nostro amore</h2>
                <p className="text-rose-600/80 font-medium">Insieme dal 09/02/2025</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">
                  {Math.floor((new Date().getTime() - new Date('2025-02-09').getTime()) / (1000 * 60 * 60 * 24))}
                </span>
                <span className="text-rose-400 font-medium">giorni insieme</span>
              </div>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
