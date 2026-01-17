
import React from 'react';
import { HistoryEntry } from '../types';
import { Trophy, Dumbbell, Calendar, ArrowRight, TrendingUp } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  weekCount: number;
}

const MonthlyReportModal: React.FC<Props> = ({ isOpen, onClose, history, weekCount }) => {
  if (!isOpen) return null;

  // Filter last 4 weeks of data
  // Since we are triggering this at end of week X, we want weeks X, X-1, X-2, X-3
  // weekCount passed in is the *completed* week number (e.g. 4)
  const recentHistory = history.filter(h => 
    h.weekNumber && h.weekNumber > weekCount - 4 && h.weekNumber <= weekCount
  );

  const totalWorkouts = recentHistory.length;
  
  // Calculate Volume (Weight * Sets * Reps) - approximate
  // Assuming reps is a string "8-12", we take average (10) for calculation if range
  let totalVolume = 0;
  recentHistory.forEach(workout => {
    workout.exercises.forEach(ex => {
       // Simple parser for reps
       let repVal = 0;
       if (ex.reps.includes('-')) {
          const parts = ex.reps.split('-').map(Number);
          repVal = (parts[0] + parts[1]) / 2;
       } else {
          repVal = parseInt(ex.reps) || 10;
       }
       
       totalVolume += (ex.weight * ex.sets * repVal);
    });
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
       <div className="bg-[#0f0728] border border-electric-purple/30 rounded-[2rem] max-w-lg w-full p-8 shadow-[0_0_100px_rgba(139,92,246,0.2)] animate-scaleIn text-center relative overflow-hidden">
          
          {/* Confetti/Glow Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-electric-purple/20 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-6 animate-blob">
                <Trophy size={40} className="text-white" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">
                Monthly Report
            </h2>
            <p className="text-electric-cyan font-bold uppercase tracking-widest text-xs mb-8">
                Cycle Complete: Weeks {weekCount - 3} - {weekCount}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
                        <Dumbbell size={12} /> Total Volume
                    </div>
                    <div className="text-2xl font-black text-white">
                        {(totalVolume / 1000).toFixed(1)}k <span className="text-sm text-slate-500">KG</span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
                        <Calendar size={12} /> Workouts
                    </div>
                    <div className="text-2xl font-black text-white">
                        {totalWorkouts}
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-electric-purple/10 border border-electric-purple/20 mb-8">
                <div className="flex items-start gap-3">
                    <TrendingUp className="text-electric-purple mt-1" size={20}/>
                    <div className="text-left">
                        <h4 className="font-bold text-white text-sm">Spartan Status: Active</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            You have completed another month of discipline. The system has calibrated your progress. Week {weekCount + 1} is ready.
                        </p>
                    </div>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-electric-blue via-electric-purple to-electric-pink text-white font-bold text-lg hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(236,72,153,0.4)] flex items-center justify-center gap-2"
            >
                Start Week {weekCount + 1} <ArrowRight />
            </button>

          </div>
       </div>
    </div>
  );
};

export default MonthlyReportModal;
