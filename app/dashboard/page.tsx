'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, Heart, Image as ImageIcon, Smile, X, Calendar, Loader2, MessageSquare, Trash2, Pencil } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

type DiaryReply = {
  id: string;
  authorId: string;
  author: string;
  role?: string | null;
  content: string;
  date: string;
};

type DiaryEntry = {
  id: string;
  authorId: string;
  author: string;
  role?: string | null;
  content: string;
  date: string;
  imageUrl?: string;
  likes: number;
  isLiked: boolean;
  likedBy: string[];
  replies: DiaryReply[];
};

type EntryRow = {
  id: string;
  author_id: string;
  author_name: string | null;
  author_role: string | null;
  content: string;
  created_at: string;
  image_url: string | null;
  parent_id: string | null;
  likes_count: number | null;
  liked_by: string[] | null;
};

const rowToReply = (row: EntryRow): DiaryReply => ({
  id: row.id,
  authorId: row.author_id,
  author: row.author_name ?? 'Anonimo',
  role: row.author_role,
  content: row.content,
  date: row.created_at,
});

const rowToEntry = (
  row: EntryRow,
  currentUserId?: string,
  replies: DiaryReply[] = []
): DiaryEntry => ({
  id: row.id,
  authorId: row.author_id,
  author: row.author_name ?? 'Anonimo',
  role: row.author_role,
  content: row.content,
  date: row.created_at,
  imageUrl: row.image_url ?? undefined,
  likes: row.likes_count ?? 0,
  likedBy: row.liked_by ?? [],
  isLiked: currentUserId ? (row.liked_by ?? []).includes(currentUserId) : false,
  replies,
});

const buildEntriesFromRows = (rows: EntryRow[], currentUserId?: string): DiaryEntry[] => {
  const repliesMap = new Map<string, DiaryReply[]>();

  rows
    .filter((row) => row.parent_id)
    .forEach((row) => {
      const replyList = repliesMap.get(row.parent_id!) ?? [];
      replyList.push(rowToReply(row));
      repliesMap.set(row.parent_id!, replyList);
    });

  return rows
    .filter((row) => !row.parent_id)
    .map((row) => {
      const replies = repliesMap.get(row.id) ?? [];
      replies.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      return rowToEntry(row, currentUserId, replies);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export default function DiaryPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);

  const isEditing = Boolean(editingRecordId);
  const isEditingEntry = Boolean(isEditing && !editingParentId);
  const isEditingReply = Boolean(isEditing && editingParentId);
  const editingEntry = isEditingEntry
    ? entries.find((entry) => entry.id === editingRecordId)
    : null;
  const editingReplyParent = isEditingReply
    ? entries.find((entry) => entry.id === editingParentId)
    : null;
  const editingReply =
    isEditingReply && editingReplyParent
      ? editingReplyParent.replies.find((reply) => reply.id === editingRecordId) ?? null
      : null;
  const replyingEntry = replyingTo
    ? entries.find((entry) => entry.id === replyingTo)
    : null;

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error) {
        console.error('Errore durante il recupero della sessione', error);
      }
      setSession(data.session ?? null);
    };

    syncSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (!isMounted) return;
      setSession(activeSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchEntries = useCallback(async () => {
    if (!session) return;
    setEntriesError(null);
    setEntriesLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select(
        'id, author_id, author_name, author_role, content, created_at, image_url, parent_id, likes_count, liked_by'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore durante il recupero dei ricordi', error);
      setEntriesError('Non riesco a recuperare i vostri ricordi in questo momento.');
    } else if (data) {
      setEntries(buildEntriesFromRows(data as EntryRow[], session.user.id));
    }
    setEntriesLoading(false);
  }, [session, supabase]);

  useEffect(() => {
    if (!session) return;
    fetchEntries();

    const channel = supabase
      .channel('entries-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabase, fetchEntries]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('Per favore seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'immagine non può superare i 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const focusComposer = () => {
    document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetComposer = () => {
    setNewEntry('');
    setImagePreview(null);
    setReplyingTo(null);
    setEditingRecordId(null);
    setEditingParentId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelEditing = () => {
    if (!isEditing) return;
    setEditingRecordId(null);
    setEditingParentId(null);
    setReplyingTo(null);
    setNewEntry('');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEditingEntry = (entry: DiaryEntry) => {
    setReplyingTo(null);
    setEditingRecordId(entry.id);
    setEditingParentId(null);
    setNewEntry(entry.content);
    setImagePreview(entry.imageUrl ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    focusComposer();
  };

  const startEditingReply = (parentId: string, reply: DiaryReply) => {
    setReplyingTo(null);
    setEditingRecordId(reply.id);
    setEditingParentId(parentId);
    setNewEntry(reply.content);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    focusComposer();
  };

  const startReplyToEntry = (entryId: string) => {
    setEditingRecordId(null);
    setEditingParentId(null);
    setImagePreview(null);
    setNewEntry('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setReplyingTo(entryId);
    focusComposer();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      setEntriesError('Devi essere autenticato per scrivere nel diario.');
      return;
    }

    if (!newEntry.trim() && !imagePreview) {
      return;
    }

    setIsSending(true);
    setEntriesError(null);

    try {
      if (editingRecordId) {
        // Editing logic same as before...
        const updatePayload: { content: string; image_url?: string | null } = {
          content: newEntry.trim(),
        };

        if (!editingParentId) {
          updatePayload.image_url = imagePreview;
        }

        const { data, error } = await supabase
          .from('entries')
          .update(updatePayload)
          .eq('id', editingRecordId)
          .select(
            'id, author_id, author_name, author_role, content, created_at, image_url, parent_id, likes_count, liked_by'
          )
          .single<EntryRow>();

        if (error) throw error;

        if (data) {
          if (editingParentId) {
            const updatedReply = rowToReply(data);
            setEntries((prev) =>
              prev.map((entry) =>
                entry.id === editingParentId
                  ? {
                    ...entry,
                    replies: entry.replies.map((reply) =>
                      reply.id === updatedReply.id ? updatedReply : reply
                    ),
                  }
                  : entry
              )
            );
          } else {
            setEntries((prev) =>
              prev.map((entry) =>
                entry.id === data.id
                  ? rowToEntry(data, session.user.id, entry.replies)
                  : entry
              )
            );
          }
        }
        resetComposer();
        return;
      }

      // New entry logic
      const payload = {
        content: newEntry.trim(),
        image_url: imagePreview,
        author_id: session.user.id,
        author_name: session.user.user_metadata?.full_name ?? session.user.email,
        author_role: session.user.user_metadata?.partner_role ?? null,
        parent_id: replyingTo,
      };

      const { data, error } = await supabase
        .from('entries')
        .insert(payload)
        .select(
          'id, author_id, author_name, author_role, content, created_at, image_url, parent_id, likes_count, liked_by'
        )
        .single<EntryRow>();

      if (error) throw error;

      if (data) {
        if (data.parent_id) {
          const reply = rowToReply(data);
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === data.parent_id
                ? {
                  ...entry,
                  replies: [...entry.replies, reply].sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  ),
                }
                : entry
            )
          );
        } else {
          setEntries((prev) => [rowToEntry(data, session.user.id), ...prev]);
        }
      }

      resetComposer();
    } catch (error) {
      console.error('Errore durante il salvataggio del ricordo', error);
      setEntriesError('Non sono riuscito a salvare il ricordo. Riprova tra poco.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!session) return;
    if (!window.confirm('Sei sicuro di voler eliminare questo ricordo per sempre?')) {
      return;
    }

    const snapshot = entries;
    if (editingRecordId === id || editingParentId === id) {
      resetComposer();
    }
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

    try {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Errore durante la cancellazione del ricordo', error);
      setEntries(snapshot);
      setEntriesError('Non sono riuscito a eliminare il ricordo.');
      fetchEntries();
    }
  };

  const handleToggleLike = async (entry: DiaryEntry) => {
    if (!session) {
      setEntriesError('Accedi per lasciare un cuore sul ricordo.');
      return;
    }

    const alreadyLiked = entry.isLiked;
    const updatedLikedBy = alreadyLiked
      ? entry.likedBy.filter((userId) => userId !== session.user.id)
      : [...entry.likedBy, session.user.id];

    setEntries((prev) =>
      prev.map((item) =>
        item.id === entry.id
          ? {
            ...item,
            isLiked: !alreadyLiked,
            likes: updatedLikedBy.length,
            likedBy: updatedLikedBy,
          }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          liked_by: updatedLikedBy,
          likes_count: updatedLikedBy.length,
        })
        .eq('id', entry.id);

      if (error) throw error;
    } catch (error) {
      console.error('Errore durante il salvataggio del like', error);
      setEntriesError('Non riesco a salvare il tuo cuore. Riprova più tardi.');
      fetchEntries();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-handwritten text-rose-800 mb-2">Il Nostro Diario Segreto</h1>
        <div className="h-1 w-24 bg-rose-300 mx-auto rounded-full"></div>
      </div>

      {entriesError && (
        <div className="mb-6 rounded-2xl bg-red-100 p-4 text-sm text-red-800 shadow-sm animate-shake border border-red-200">
          {entriesError}
        </div>
      )}

      {/* New Entry Form */}
      <form onSubmit={handleSubmit} id="post-form" className="mb-12 relative z-10">
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/50 bg-white/60 backdrop-blur-md transform transition-transform hover:scale-[1.01] duration-300">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner border-2 border-white flex-shrink-0 ${isEditing ? 'bg-amber-100 text-amber-600' : replyingTo ? 'bg-rose-100 text-rose-600' : 'bg-pink-100 text-pink-600'
              }`}>
              {isEditing ? '✏️' : replyingTo ? '💌' : '📝'}
            </div>

            <div className="flex-1">
              {isEditingEntry && editingEntry && (
                <div className="mb-3 flex flex-wrap items-center justify-between rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700 border border-amber-100">
                  <div className="flex flex-col">
                    <span className="font-semibold">Stai modificando un ricordo</span>
                    <span className="text-xs text-amber-500 truncate max-w-[200px] sm:max-w-xs">{editingEntry.content}</span>
                  </div>
                  <button type="button" onClick={cancelEditing} className="mt-2 sm:mt-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-100 transition">
                    Annulla
                  </button>
                </div>
              )}

              {isEditingReply && editingReplyParent && editingReply && (
                <div className="mb-3 flex flex-wrap items-center justify-between rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700 border border-amber-100">
                  <div className="flex flex-col">
                    <span className="font-semibold">Modifichi una risposta per {editingReplyParent.author}</span>
                    <span className="text-xs text-amber-500 truncate max-w-[200px] sm:max-w-xs">{editingReply.content}</span>
                  </div>
                  <button type="button" onClick={cancelEditing} className="mt-2 sm:mt-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-100 transition">
                    Annulla
                  </button>
                </div>
              )}

              {!isEditing && replyingEntry && (
                <div className="mb-3 flex flex-wrap items-center justify-between rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700 border border-rose-100">
                  <div className="flex flex-col">
                    <span className="font-semibold">Rispondi a {replyingEntry.author}</span>
                    <span className="text-xs text-rose-500 truncate max-w-[200px] sm:max-w-xs">{replyingEntry.content}</span>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="mt-2 sm:mt-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-100 transition">
                    Annulla
                  </button>
                </div>
              )}

              <div className="relative group">
                <textarea
                  rows={4}
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  className="w-full rounded-2xl border-2 border-pink-100 bg-white/80 p-4 text-lg text-rose-900 placeholder:text-pink-300 focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100/50 transition-all resize-none shadow-inner font-handwritten leading-relaxed"
                  placeholder={
                    replyingTo
                      ? 'Scrivi una dolce risposta...'
                      : 'Racconta un momento speciale...'
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="p-2 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                    title="Aggiungi immagine"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Simple emoji picker shim
                      const emojis = ['❤️', '✨', '🌟', '🦄', '🦁', '💑', '🌹', '💌'];
                      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                      setNewEntry(prev => prev + randomEmoji);
                    }}
                    className="p-2 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                    title="Inserisci emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const formattedDate = now.toLocaleString('it-IT', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      });
                      setNewEntry((prev) => prev + `\n${formattedDate} - `);
                    }}
                    className="p-2 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                    title="Inserisci data"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSending || (!newEntry.trim() && !imagePreview)}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-rose-200 hover:shadow-rose-400 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSending ? 'Salvando...' : replyingTo ? 'Invia risposta' : 'Pubblica'}
                </button>
              </div>

              {imagePreview && (
                <div className="mt-4 relative inline-block rounded-2xl overflow-hidden border-2 border-pink-100 shadow-md group">
                  <img src={imagePreview} alt="Anteprima" className="max-h-60 object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Entries List */}
      <div className="space-y-8">
        {entriesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-rose-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>Recupero i ricordi preziosi...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-rose-400 border border-dashed border-rose-200">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Non ci sono ancora ricordi qui.</p>
            <p>Iniziate a scrivere la vostra storia d'amore! ✨</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isAuthor = entry.authorId === session?.user.id;
            // Alternate alignment or style based on role could be fun, but keeping it consistent for now is safer.
            // Let's us a subtle rotation for fun.
            const rotation = index % 2 === 0 ? '-rotate-1' : 'rotate-1';

            return (
              <div key={entry.id} className={`glass-card p-6 sm:p-8 rounded-[2rem] relative group transition-all hover:shadow-xl hover:scale-[1.005] duration-300 ${rotation} hover:rotate-0`}>
                {/* Pin style decorator */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-md border border-gray-100 z-10 flex items-center justify-center text-xs font-bold text-gray-500">
                  {entry.role === 'angelica' ? '🦄' : entry.role === 'nicolo' ? '🦁' : '❤️'}
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl font-bold shadow-sm border-2 border-white ${entry.role === 'nicolo' ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-600'
                    }`}>
                    {entry.author.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between mb-2 gap-2">
                      <h3 className="text-xl font-handwritten font-bold text-gray-800">
                        {entry.author}
                      </h3>
                      <span className="text-xs text-gray-400 font-medium">{formatDate(entry.date)}</span>
                    </div>

                    <div className="text-gray-700 text-lg font-handwritten leading-relaxed whitespace-pre-line mb-4">
                      {entry.content}
                    </div>

                    {entry.imageUrl && (
                      <div className="mb-6 rounded-2xl overflow-hidden shadow-md border border-white hover:shadow-lg transition-shadow">
                        <img src={entry.imageUrl} alt="Ricordo" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center gap-4 pt-4 border-t border-rose-50">
                      <button
                        onClick={() => handleToggleLike(entry)}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${entry.isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                          }`}
                      >
                        <Heart className={`w-5 h-5 ${entry.isLiked ? 'fill-current animate-pulse-soft' : ''}`} />
                        <span>{entry.likes > 0 ? entry.likes : 'Mi piace'}</span>
                      </button>

                      <button
                        onClick={() => startReplyToEntry(entry.id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-purple-500 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Rispondi</span>
                      </button>

                      {isAuthor && (
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => startEditingEntry(entry)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                            title="Modifica"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Replies */}
                    {entry.replies.length > 0 && (
                      <div className="mt-6 space-y-4 pl-4 sm:pl-6 border-l-2 border-rose-100">
                        {entry.replies.map(reply => (
                          <div key={reply.id} className="bg-white/50 rounded-xl p-4 border border-rose-50/50">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-handwritten font-bold text-gray-800 text-lg flex items-center gap-2">
                                {reply.author}
                                <span className="text-[10px] py-0.5 px-1.5 bg-rose-100 text-rose-600 rounded-full font-sans font-medium uppercase tracking-wide">risponde</span>
                              </span>
                              <span className="text-xs text-gray-400">{new Date(reply.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-gray-600 font-handwritten text-lg leading-snug">{reply.content}</p>

                            {reply.authorId === session?.user.id && (
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  onClick={() => startEditingReply(entry.id, reply)}
                                  className="text-xs text-gray-400 hover:text-blue-500"
                                >
                                  Modifica
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(reply.id)}
                                  className="text-xs text-gray-400 hover:text-red-500"
                                >
                                  Elimina
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
