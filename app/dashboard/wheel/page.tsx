'use client';

import { useState, useEffect } from 'react';
import { Dices, RefreshCw, Trophy, Heart } from 'lucide-react';

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
    // Pick random index
    const selectedIndex = Math.floor(Math.random() * options.length);
    const selectedOption = options[selectedIndex];

    // Compute rotation so that the chosen slice ends up at 0 degrees (top center)
    const spins = 5;
    const baseRotation = Math.floor(rotation / 360) * 360 + spins * 360;
    
    // offset needed to bring the center of the slice to the top
    const offset = 360 - (selectedIndex * sliceAngle + sliceAngle / 2);
    const newRotation = baseRotation + offset;

    setRotation(newRotation);

    // Wait for transition to finish
    setTimeout(() => {
      setResult(selectedOption);
      setExtracted(prev => [selectedOption, ...prev]);
      
      // Remove from available options
      const newOptions = options.filter((_, i) => i !== selectedIndex);
      setOptions(newOptions);
      setIsSpinning(false);

      // Instantly reset the rotation to 0 so the next spin works cleanly
      // We do this by disabling transition temporarily
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

  if (!isClient) return null;

  // Generate background gradient for the wheel
  const sliceAngle = options.length > 0 ? 360 / options.length : 360;
  const gradientParts = options.map((_, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
  }).join(', ');
  const background = options.length > 0 ? `conic-gradient(${gradientParts})` : '#f3f4f6';

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-140px)]">
      
      {/* Left Column: Wheel Area */}
      <div className="w-full lg:w-2/3 flex flex-col items-center">
        <div className="glass-card w-full p-6 sm:p-10 rounded-3xl shadow-xl flex flex-col items-center relative overflow-hidden">
          
          <h1 className="text-3xl sm:text-4xl font-handwritten font-bold text-rose-800 mb-2 flex items-center gap-3">
            <Dices className="w-8 h-8 text-rose-500" />
            Cosa facciamo oggi?
          </h1>
          <p className="text-rose-600/80 font-medium mb-8 text-center max-w-md">
            La sorte deciderà la nostra prossima avventura. Gira la ruota!
          </p>

          <div className="relative w-72 h-72 sm:w-[350px] sm:h-[350px] mb-8">
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
                  return (
                    <div 
                      key={opt + i}
                      className="absolute top-0 left-1/2 h-1/2 origin-bottom flex items-start justify-center"
                      style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
                    >
                      <span 
                        className="absolute right-[-10px] top-[20px] text-gray-800 font-bold text-sm whitespace-nowrap drop-shadow-sm max-w-[100px] sm:max-w-[140px] truncate" 
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'top right' }}
                      >
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full rounded-full border-[6px] border-white shadow-2xl flex items-center justify-center bg-gray-100 p-6 text-center">
                <span className="text-gray-500 font-medium text-lg">Tutte le opzioni sono state estratte!</span>
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
                <Trophy className="w-6 h-6 text-yellow-500" />
                {result}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Right Column: History & Controls */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        
        <div className="glass-card p-6 rounded-3xl shadow-xl flex flex-col h-[400px] lg:h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-handwritten font-bold text-rose-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              Opzioni Uscite
            </h2>
            <button
              onClick={handleReset}
              disabled={isSpinning}
              className="text-xs font-bold text-gray-500 hover:text-rose-600 transition-colors flex items-center gap-1 disabled:opacity-50 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {extracted.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-sm text-gray-400 italic">
                  Ancora nessuna opzione estratta.<br/>Inizia a girare!
                </p>
              </div>
            ) : (
              extracted.map((opt, i) => (
                <div key={i} className="bg-white/70 p-3 rounded-xl border border-rose-100 hover:border-rose-300 transition-colors flex items-center gap-3 shadow-sm animate-slide-up">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                    {extracted.length - i}
                  </div>
                  <span className="font-medium text-gray-700">{opt}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-rose-100">
             <p className="text-xs text-center text-rose-400 font-medium">
                {options.length} {options.length === 1 ? 'opzione rimanente' : 'opzioni rimanenti'} nella ruota
             </p>
          </div>
        </div>

      </div>

    </div>
  );
}
