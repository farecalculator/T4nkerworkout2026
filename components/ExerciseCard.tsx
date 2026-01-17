import React, { useState } from 'react';
import { Exercise } from '../types';
import { Youtube, Search, TrendingUp, RefreshCw, Check } from 'lucide-react';

interface Props {
  exercise: Exercise;
  lastWeight?: number;
  onSaveWeight: (weight: number) => void;
  onSwap?: () => void;
  onComplete?: () => void; 
  isActive?: boolean;
  isCompleted?: boolean;
}

const ExerciseCard: React.FC<Props> = ({ 
    exercise, lastWeight, onSaveWeight, onSwap, onComplete, isActive = false, isCompleted = false
}) => {
  const [weight, setWeight] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleWeightChange = (val: string) => {
    setWeight(val);
    setSaveStatus('saving');
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onSaveWeight(num);
      setTimeout(() => setSaveStatus('saved'), 600);
    } else {
      setSaveStatus('idle');
    }
  };

  const handleDonePress = () => {
    if (!weight && lastWeight) handleWeightChange(lastWeight.toString());
    if (onComplete) onComplete();
  };

  return (
    <>
    <div className={`
      relative p-6 rounded-2xl transition-all duration-300
      border-4 border-black
      ${isActive 
        ? 'bg-yellow-50 shadow-comic scale-[1.02] z-10' 
        : isCompleted 
            ? 'bg-green-50 opacity-90 grayscale-[0.3]' 
            : 'bg-white shadow-comic-sm'}
    `}>
      
      {isCompleted && (
          <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-lg border-2 border-black font-black uppercase text-xs z-20 shadow-[2px_2px_0_0_#000] rotate-3">
              COMPLETE
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4 max-w-[80%]">
          <div className="w-14 h-14 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border-2 border-black bg-white shadow-[2px_2px_0_0_#000]">
            <span className="text-[10px] font-black uppercase leading-none mb-1 text-gray-500">Sets</span>
            <span className="font-display text-3xl leading-none text-black">{exercise.sets}</span>
          </div>
          <div>
            <h3 className="font-display text-2xl md:text-3xl leading-none text-black uppercase">
                {exercise.name}
            </h3>
            {exercise.notes && <p className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-black inline-block mt-1 uppercase">{exercise.notes}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {onSwap && !isCompleted && (
                <button onClick={onSwap} className="p-2 bg-gray-100 border-2 border-black rounded-lg hover:bg-yellow-300 transition-colors" title="Swap">
                  <RefreshCw size={18} />
                </button>
            )}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-2">
            <div className="bg-white border-2 border-black rounded-xl p-2 flex flex-col items-center">
                <span className="text-[10px] uppercase font-black text-gray-400">Reps</span>
                <span className="font-display text-2xl text-black">{exercise.reps}</span>
            </div>
            {lastWeight ? (
              <div className="bg-yellow-50 border-2 border-black rounded-xl p-2 flex items-center justify-center gap-2">
                <TrendingUp size={14} className="text-black" />
                <span className="font-display text-xl text-black">{lastWeight}kg</span>
              </div>
            ) : (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-2 text-center text-xs font-bold text-gray-400">No Data</div>
            )}
        </div>

        <div className={`
          flex flex-col justify-center items-center p-2 rounded-xl border-2 border-black relative
          ${weight || isCompleted ? 'bg-green-100' : 'bg-white'}
        `}>
           <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] uppercase font-black text-black">Load (KG)</span>
               {saveStatus === 'saved' && <Check size={12} className="text-green-600" strokeWidth={4}/>}
           </div>
           <input 
              type="number" 
              inputMode="decimal"
              placeholder={lastWeight ? `${lastWeight}` : "-"}
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="w-full bg-transparent text-center text-4xl font-display text-black focus:outline-none placeholder-gray-300"
           />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
          <div className="flex gap-2 flex-1">
             <button onClick={() => window.open(`https://www.youtube.com/results?search_query=how+to+do+${exercise.name}`, '_blank')} className="flex-1 flex items-center justify-center py-3 rounded-xl border-2 border-black bg-red-100 hover:bg-red-200 transition-colors">
                <Youtube size={20} className="text-red-600" />
            </button>
            <button onClick={() => window.open(`https://www.google.com/search?q=${exercise.name}+form`, '_blank')} className="flex-1 flex items-center justify-center py-3 rounded-xl border-2 border-black bg-blue-100 hover:bg-blue-200 transition-colors">
                <Search size={18} className="text-blue-600" />
            </button>
          </div>

          <button 
            onClick={handleDonePress}
            className={`
                flex-[2] flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-wider text-sm border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all
                ${isCompleted ? 'bg-green-400 text-black' : 'bg-black text-white hover:bg-gray-800'}
            `}
          >
              {isCompleted ? 'DONE!' : 'FINISH SET'}
          </button>
      </div>

    </div>
    </>
  );
};

export default ExerciseCard;