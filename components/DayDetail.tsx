
import React, { useState, useRef } from 'react';
import { WorkoutDay, DayStatus, Exercise } from '../types';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import SwapExerciseModal from './SwapExerciseModal';

interface Props {
  day: WorkoutDay;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onWeightUpdate: (exerciseId: string, weight: number) => void;
  onSwapExercise: (dayId: string, oldExerciseId: string, newExercise: Partial<Exercise>) => void;
  weights: Record<string, number>;
  status: DayStatus;
}

const DayDetail: React.FC<Props> = ({ day, onBack, onComplete, onSkip, onWeightUpdate, onSwapExercise, weights, status }) => {
  const [swappingExercise, setSwappingExercise] = useState<Exercise | null>(null);
  const [manuallyCompleted, setManuallyCompleted] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToExercise = (index: number) => {
      const nextEx = day.exercises[index];
      if (nextEx && cardRefs.current[nextEx.id]) {
          cardRefs.current[nextEx.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const handleCardComplete = (exId: string, index: number) => {
      setManuallyCompleted(prev => ({ ...prev, [exId]: true }));
      setTimeout(() => scrollToExercise(index + 1), 400);
  };

  const activeExerciseIndex = day.exercises.findIndex(ex => !weights[ex.id] && !manuallyCompleted[ex.id]);
  const activeExerciseId = activeExerciseIndex !== -1 ? day.exercises[activeExerciseIndex].id : null;

  return (
    <div className="animate-slideUp pb-40"> {/* Increased padding-bottom for scroll clearance */}
      <SwapExerciseModal 
        isOpen={!!swappingExercise}
        onClose={() => setSwappingExercise(null)}
        category={swappingExercise?.category || 'push'}
        onSelect={(newEx) => { if(swappingExercise) { onSwapExercise(day.id, swappingExercise.id, newEx); setSwappingExercise(null); } }}
      />

      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={onBack} 
            className="flex items-center text-black bg-white hover:bg-gray-100 border-2 border-black px-4 py-3 rounded-xl font-black text-sm shadow-comic-sm active:scale-95 transition-transform"
        >
            <ArrowLeft size={18} className="mr-1" /> BACK
        </button>
        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase border-2 border-black ${status === 'completed' ? 'bg-green-400 text-black' : 'bg-gray-200 text-gray-500'}`}>
            {status}
        </span>
      </div>
      
      <div className="mb-8 text-center sm:text-left">
        {/* Responsive Text Scaling */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white text-outline tracking-wider leading-none mb-2 break-words">
            {day.title}
        </h1>
        <div className="inline-block bg-yellow-300 text-black px-3 py-1 font-bold uppercase text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0_0_#000] rotate-[-1deg]">
            {day.focus}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-12">
        {day.exercises.map((exercise, index) => {
           const isDone = !!weights[exercise.id] || !!manuallyCompleted[exercise.id];
           const isActive = !isDone && (exercise.id === activeExerciseId);
           return (
            <div key={exercise.id} ref={el => cardRefs.current[exercise.id] = el}>
                <ExerciseCard 
                    exercise={exercise}
                    lastWeight={weights[exercise.id]}
                    onSaveWeight={(w) => onWeightUpdate(exercise.id, w)}
                    onSwap={() => setSwappingExercise(exercise)}
                    onComplete={() => handleCardComplete(exercise.id, index)}
                    isActive={isActive}
                    isCompleted={isDone}
                />
            </div>
           );
        })}
      </div>

      {/* Fixed Bottom Bar with Safe Area Padding */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 md:pb-4 bg-white border-t-4 border-black z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex gap-4">
            <button 
                onClick={onSkip} 
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-black uppercase border-2 border-black active:scale-95 transition-transform"
            >
                <AlertCircle size={20} /> <span className="hidden sm:inline">Can't Train</span><span className="sm:hidden">Skip</span>
            </button>
            <button 
                onClick={onComplete} 
                className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase border-2 border-black shadow-comic active:translate-y-1 active:shadow-none active:scale-[0.98] transition-all"
            >
                <Check size={24} strokeWidth={4} /> FINISH WORKOUT
            </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetail;
