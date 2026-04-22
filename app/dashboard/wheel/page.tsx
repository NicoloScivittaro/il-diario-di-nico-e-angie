'use client';

import { useState, useEffect } from 'react';
import { Dices, RefreshCw, Trophy, Heart, Plus, Trash2, Settings2, Undo2 } from 'lucide-react';

const INITIAL_OPTIONS = [
  "Cena sushi",
  "Passeggiata al parco",
  "Gelato insieme",
  "Cinema",
  "Pizza",
  "Serata film",
  "Hot pot",
  "Ristorante coreano"
];

const COLORS = [
  '#fda4af', // rose-300
  '#f9a8d4', // pink-300
  '#fbcfe8', // pink-200
  '#fecdd3', // rose-200
  '#f0abfc', // fuchsia-300
  '#e879f9', // fuchsia-400
  '#fb7185', // rose-400
  '#f472b6', // pink-400
];

export default function WheelPage() {
  const [options, setOptions] = useState<string[]>([]);
  const [extracted, setExtracted] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedOptions = localStorage.getItem('wheel-options');
    const savedExtracted = localStorage.getItem('wheel-extracted');

    if (savedOptions && savedExtracted) {
      try {
        setOptions(JSON.parse(savedOptions));
        setExtracted(JSON.parse(savedExtracted));
      } catch {
        setOptions(INITIAL_OPTIONS);
        setExtracted([]);
      }
    } else {
      setOptions(INITIAL_OPTIONS);
      setExtracted([]);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('wheel-options', JSON.stringify(options));
      localStorage.setItem('wheel-extracted', JSON.stringify(extracted));
    }
  }, [options, extracted, isClient]);

  const handleSpin = () => {
    if (options.length === 0 || isSpinning) return;

    setResult(null);
    setIsSpinning(true);
    setTransitionEnabled(true);

    const sliceAngle = 360 / options.length;
    const selectedIndex = Math.floor(Math.random() * options.length);
    const selectedOption = options[selectedIndex];

    const spins = 5;
    const baseRotation = Math.floor(rotation / 360) * 360 + spins * 360;
    
    const offset = 360 - (selectedIndex * sliceAngle + sliceAngle / 2);
    const newRotation = baseRotation + offset;

    setRotation(newRotation);

    setTimeout(() => {
      setResult(selectedOption);
      setExtracted(prev => [selectedOption, ...prev]);
      
      const newOptions = options.filter((_, i) => i !== selectedIndex);
      setOptions(newOptions);
      setIsSpinning(false);

      setTimeout(() => {
        setTransitionEnabled(false);
        setRotation(0);
      }, 50);

    }, 3000);
  };

  const handleReset = () => {
    if (isSpinning) return;
    if (!confirm('Vuoi ripristinare tutte le opzioni iniziali e svuotare la lista?')) return;
    
    setTransitionEnabled(false);
    setRotation(0);
    setOptions(INITIAL_OPTIONS);
    setExtracted([]);
    setResult(null);
  };

  const handleAddOption = () => {
    if (isSpinning) return;
    setOptions([...options, "Nuova opzione"]);
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (isSpinning) return;
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (isSpinning) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleRestoreOption = (index: number) => {
    if (isSpinning) return;
    const optToRestore = extracted[index];
    
    // Rimuovi dalle estratte
    const newExtracted = extracted.filter((_, i) => i !== index);
    setExtracted(newExtracted);

    // Aggiungi di nuovo alla ruota se non c'è già
    if (!options.includes(optToRestore)) {
      setOptions([...options, optToRestore]);
    }

    // Se era l'ultimo risultato, lo togliamo dal display principale
    if (result === optToRestore) {
      setResult(null);
    }
  };

  if (!isClient) return null;

  const sliceAngle = options.length > 0 ? 360 / options.length : 360;
  const gradientParts = options.map((_, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
  }).join(', ');
  const background = options.length > 0 ? `conic-gradient(${gradientParts})` : '#f3f4f6';

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center max-w-7xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-140px)]">
      
      {/* Left Column: Wheel Area */}
      <div className="w-full lg:w-1/2 flex flex-col items-center">
        <div className="glass-card w-full p-6 sm:p-10 rounded-3xl shadow-xl flex flex-col items-center relative overflow-hidden h-full">
          
          <h1 className="text-3xl sm:text-4xl font-handwritten font-bold text-rose-800 mb-2 flex items-center gap-3">
            <Dices className="w-8 h-8 text-rose-500" />
            La Ruota Magica
          </h1>
          <p className="text-rose-600/80 font-medium mb-8 text-center max-w-md">
            Gira la ruota e lascia che sia il destino a scegliere la vostra prossima avventura!
          </p>

          <div className="relative w-72 h-72 sm:w-[360px] sm:h-[360px] mb-10">
            {/* Pointer (Freccia in alto) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-rose-600 drop-shadow-md"></div>
            
            {options.length > 0 ? (
              <div 
                className="w-full h-full rounded-full border-[6px] border-white shadow-2xl relative overflow-hidden"
                style={{
                  background: background,
                  transform: `rotate(${rotation}deg)`,
                  transition: transitionEnabled ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                }}
              >
                {/* Lines separating slices */}
                {options.map((_, i) => (
                  <div
                    key={`line-${i}`}
                    className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-white/40 origin-bottom"
                    style={{ transform: `translateX(-50%) rotate(${i * sliceAngle}deg)` }}
                  />
                ))}

                {/* Text for each slice */}
                {options.map((opt, i) => {
                  const angle = i * sliceAngle + sliceAngle / 2;
                  // Se l'angolo punta verso il basso (tra 90 e 270 gradi), capovolgiamo il testo per renderlo leggibile
                  const isUpsideDown = angle > 90 && angle < 270;
                  
                  return (
                    <div 
                      key={opt + i}
                      className="absolute top-1/2 left-1/2 w-[42%] h-8 -translate-y-1/2 origin-left flex items-center justify-end"
                      style={{ transform: `rotate(${angle - 90}deg)` }}
                    >
                      <span 
                        className="text-gray-800 font-bold text-[11px] sm:text-[13px] drop-shadow-sm px-1 max-w-full truncate leading-tight" 
                        style={{ transform: isUpsideDown ? 'rotate(180deg)' : 'none' }}
                      >
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full rounded-full border-[6px] border-white shadow-2xl flex items-center justify-center bg-gray-100 p-6 text-center">
                <span className="text-gray-500 font-medium text-lg">Aggiungi qualche opzione!</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning || options.length === 0}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-4 px-10 rounded-2xl shadow-lg hover:shadow-pink-500/30 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xl flex items-center gap-3"
          >
            <RefreshCw className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'Girando...' : 'Gira la Ruota!'}
          </button>

          {/* Result Alert */}
          {result && !isSpinning && (
            <div className="mt-8 animate-slide-up bg-white/90 border border-rose-200 p-6 rounded-2xl shadow-xl text-center w-full max-w-sm">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Il destino ha scelto:</p>
              <p className="text-2xl font-bold text-rose-600 flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500 shrink-0" />
                <span className="truncate">{result}</span>
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Right Column: Configuration & History */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        
        {/* Editor Card */}
        <div className="glass-card p-6 rounded-3xl shadow-xl flex flex-col flex-1 max-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-handwritten font-bold text-rose-800 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-rose-500" />
              Opzioni della Ruota
            </h2>
            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-full">
              {options.length} spicchi
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 animate-slide-up">
                <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleUpdateOption(i, e.target.value)}
                  disabled={isSpinning}
                  className="flex-1 bg-white/60 border border-rose-100 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50"
                  placeholder="Scrivi qualcosa..."
                />
                <button
                  onClick={() => handleRemoveOption(i)}
                  disabled={isSpinning}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Elimina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {options.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center mt-4">
                Non ci sono opzioni nella ruota.
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-rose-100">
            <button
              onClick={handleAddOption}
              disabled={isSpinning}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-colors font-bold text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Aggiungi opzione
            </button>
          </div>
        </div>

        {/* History Card */}
        <div className="glass-card p-6 rounded-3xl shadow-xl flex flex-col flex-1 max-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-handwritten font-bold text-rose-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              Già Uscite
            </h2>
            <button
              onClick={handleReset}
              disabled={isSpinning}
              className="text-xs font-bold text-gray-500 hover:text-rose-600 transition-colors flex items-center gap-1 disabled:opacity-50 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> Reset Tutto
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {extracted.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-sm text-gray-400 italic">
                  Ancora nessuna opzione estratta.
                </p>
              </div>
            ) : (
              extracted.map((opt, i) => (
                <div key={i} className="bg-white/70 p-3 rounded-xl border border-rose-100 flex items-center justify-between gap-3 shadow-sm animate-slide-up">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                      {extracted.length - i}
                    </div>
                    <span className="font-medium text-gray-700 truncate">{opt}</span>
                  </div>
                  <button
                    onClick={() => handleRestoreOption(i)}
                    disabled={isSpinning}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                    title="Ripristina nella ruota"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
