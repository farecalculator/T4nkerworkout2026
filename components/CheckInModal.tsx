import React, { useState, useEffect } from 'react';
import { ArrowRight, Scale, Calendar, X } from 'lucide-react';
import { CheckIn } from '../types';

interface Props {
  isOpen: boolean;
  onComplete: (mood: string, weight: number) => void;
  onClose?: () => void;
  initialData?: { mood: string; weight: number };
  history?: CheckIn[];
}

const MOODS = [
  { emoji: '🔥', label: 'Beast' },
  { emoji: '⚡', label: 'Hyper' },
  { emoji: '🧘', label: 'Focus' },
  { emoji: '💀', label: 'Dead' },
  { emoji: '🤬', label: 'Angry' },
];

const CheckInModal: React.FC<Props> = ({ isOpen, onComplete, onClose, initialData }) => {
  const [mood, setMood] = useState<string | null>(null);
  const [weight, setWeight] = useState<string>('');
  
  useEffect(() => {
    if (isOpen && initialData) { setMood(initialData.mood); setWeight(initialData.weight.toString()); }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-sm w-full shadow-comic animate-popIn relative">
        {onClose && <button onClick={onClose} className="absolute top-4 right-4 text-black hover:bg-gray-100 rounded p-1"><X size={24} /></button>}
        
        <div className="text-center mb-8">
            <h2 className="font-display text-4xl text-black leading-none mb-1">DAILY CHECK-IN</h2>
            <p className="font-bold text-gray-400 text-sm uppercase">Track your stats</p>
        </div>

        <div className="space-y-8">
            <div>
                <label className="block text-xs font-black uppercase text-black mb-4 text-center tracking-widest bg-yellow-300 inline-block px-2 py-1 border-2 border-black rotate-[-2deg] mx-auto">VIBE CHECK</label>
                <div className="flex justify-between gap-2">
                    {MOODS.map((m) => (
                        <button key={m.label} onClick={() => setMood(m.emoji)} className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 border-black transition-transform hover:scale-110 ${mood === m.emoji ? 'bg-yellow-400 shadow-[3px_3px_0_0_#000]' : 'bg-gray-100'}`}>
                            <span className="text-2xl">{m.emoji}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-black mb-4 text-center tracking-widest bg-blue-300 inline-block px-2 py-1 border-2 border-black rotate-[2deg] mx-auto">WEIGH IN</label>
                <div className="relative max-w-[160px] mx-auto">
                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" className="w-full text-center py-3 bg-white border-2 border-black rounded-xl font-display text-3xl text-black focus:outline-none focus:bg-blue-50 placeholder-gray-300" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">KG</span>
                </div>
            </div>

            <button disabled={!mood || !weight} onClick={() => { if(mood && weight) onComplete(mood, parseFloat(weight)); }} className="w-full py-4 rounded-xl bg-black text-white font-black text-xl uppercase border-2 border-black shadow-comic hover:bg-gray-800 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                LOCKED IN
            </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;