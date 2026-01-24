'use client';

import { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Plus, X, Calendar, Heart, ChevronLeft, ChevronRight, Loader2, ZoomIn } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

type AlbumPhoto = {
  id: string;
  url: string;
  content: string;
  date: string;
  author: string;
  authorRole: string | null;
  likes: number;
};

export default function AlbumPage() {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Initialize Supabase client
  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('id, content, created_at, image_url, author_name, author_role, likes_count')
          .not('image_url', 'is', null) // Filter for entries with images
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedPhotos = data
            .filter(item => item.image_url) // Double check ts filtering
            .map((item) => ({
              id: item.id,
              url: item.image_url!, // We know it's not null here
              content: item.content,
              date: item.created_at,
              author: item.author_name || 'Anonimo',
              authorRole: item.author_role,
              likes: item.likes_count || 0,
            }));
          setPhotos(mappedPhotos);
        }
      } catch (err) {
        console.error('Error fetching photos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [supabase]);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
    document.body.style.overflow = 'unset';
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
  };

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <div className="w-full">
      {/* Header & CTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-handwritten text-rose-800 mb-2">Il Nostro Album</h1>
          <p className="text-rose-600/80 font-medium">I momenti più belli catturati nel tempo</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-full shadow-lg shadow-rose-200 hover:shadow-rose-400 transform transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Foto
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ros-400">
          <Loader2 className="w-10 h-10 animate-spin text-rose-400 mb-4" />
          <p className="text-rose-500 font-medium">Sviluppo le foto...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-rose-200 bg-white/50">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-300">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-handwritten text-rose-800 mb-2">L'album è vuoto</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Non avete ancora salvato nessuna foto. Corri nel diario e aggiungi il primo scatto del vostro amore!</p>
          <Link href="/dashboard" className="text-rose-600 font-bold hover:underline">
            Vai al Diario
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => openLightbox(index)}
              className="group cursor-pointer perspective-1000"
            >
              <div className="bg-white p-3 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:rotate-1 border border-gray-100 relative overflow-hidden">
                {/* Image Container */}
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={photo.url}
                    alt="Ricordo"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur rounded-full p-2 text-rose-600 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Badge Author */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 border-white ${photo.authorRole === 'nicolo' ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-600'
                      }`}>
                      {photo.author.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-1">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(photo.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-rose-400">
                      <Heart className="w-3 h-3 fill-current" />
                      {photo.likes}
                    </div>
                  </div>
                  <p className="text-gray-700 font-handwritten text-lg leading-tight line-clamp-2">
                    {photo.content || "Un momento speciale..."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/50 hover:text-white p-2 transition-colors z-[70]"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={prevPhoto}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 transition-colors z-[70] hidden md:block"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <button
            onClick={nextPhoto}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 transition-colors z-[70] hidden md:block"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          <div
            className="relative max-w-5xl w-full max-h-[90vh] grid grid-cols-1 md:grid-cols-[1fr_350px] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Image */}
            <div className="bg-black flex items-center justify-center relative min-h-[50vh] md:min-h-full">
              <img
                src={selectedPhoto.url}
                alt="Full size"
                className="max-h-[85vh] max-w-full object-contain"
              />
            </div>

            {/* Right: Info */}
            <div className="p-8 flex flex-col h-full bg-white">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm border border-gray-100 ${selectedPhoto.authorRole === 'nicolo' ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-600'
                    }`}>
                    {selectedPhoto.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{selectedPhoto.author}</p>
                    <p className="text-xs text-gray-400">{new Date(selectedPhoto.date).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <p className="text-xl font-handwritten text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedPhoto.content}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-rose-500">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-rose-500" />
                  <span className="font-bold">{selectedPhoto.likes} mi piace</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
