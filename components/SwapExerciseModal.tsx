import React from 'react';
import { Exercise } from '../types';
import { ALTERNATIVE_EXERCISES } from '../constants';
import { X, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onSelect: (newExercise: Partial<Exercise>) => void;
}

const SwapExerciseModal: React.FC<Props> = ({ isOpen, onClose, category, onSelect }) => {
  if (!isOpen) return null;

  const alternatives = ALTERNATIVE_EXERCISES[category] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-scaleIn">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Swap Exercise</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">Category: {category}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                <X size={20} />
            </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {alternatives.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No alternatives available for this category.</p>
            ) : (
                alternatives.map((alt, index) => (
                    <button 
                        key={index}
                        onClick={() => onSelect(alt)}
                        className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 group transition-all"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {alt.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    Recommended: {alt.sets} Sets x {alt.reps} Reps
                                </p>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default SwapExerciseModal;