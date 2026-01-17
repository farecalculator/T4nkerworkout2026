
import React from 'react';
import { WorkoutDay, DayStatus } from '../types';
import { Check, ArrowRight, Battery, Sun, X } from 'lucide-react';

interface Props {
  onSelectDay: (day: WorkoutDay) => void;
  weekStatus: Record<string, DayStatus>;
  plan: WorkoutDay[];
}

const WeekView: React.FC<Props> = ({ onSelectDay, weekStatus, plan }) => {
  const completedCount = Object.values(weekStatus).filter(s => s === 'completed').length;
  // Calculate total workouts based on non-rest days in the plan, defaulting to 5 if calculation fails
  const totalWorkouts = plan.filter(d => d.title !== 'REST DAY').length || 5;
  const progressPercentage = Math.round((completedCount / totalWorkouts) * 100);

  return (
    <div className="animate-fadeIn w-full max-w-4xl mx-auto">
      
      {/* Synchronization Bar */}
      <div className="mb-8 flex items-center gap-4 bg-white p-2 border-4 border-black rounded-xl shadow-comic-sm">
        <span className="font-black text-xs uppercase px-2">Progress</span>
        <div className="flex-1 h-6 bg-gray-200 rounded-md border-2 border-black overflow-hidden relative">
            <div 
                className="h-full bg-yellow-400 border-r-2 border-black transition-all duration-1000 ease-out flex items-center justify-end px-2" 
                style={{ width: `${Math.max(progressPercentage, 5)}%` }}
            >
            </div>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
        </div>
        <span className="font-mono text-sm font-black text-black min-w-[3rem] text-right">{progressPercentage}%</span>
      </div>

      <div className="flex flex-col gap-6">
        {plan.map((day) => {
          // Identify Rest Days from the plan itself
          const isRestDay = day.title === 'REST DAY';
          
          if (isRestDay) {
              return (
                <div key={day.id} className="relative flex items-center justify-between rounded-xl bg-gray-100 border-4 border-black border-dashed opacity-80 hover:opacity-100 transition-opacity">
                     <div className="flex-1 py-6 px-6 flex items-center gap-6">
                        <div className="flex items-center justify-center w-14 h-14 bg-white border-2 border-black rounded-full shrink-0">
                            <Battery size={24} className="text-black" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-display text-2xl text-gray-500 uppercase leading-none">{day.day}</h3>
                            <p className="font-bold text-sm text-gray-400 uppercase">Rest / Recovery</p>
                        </div>
                     </div>
                </div>
              );
          }

          const status = weekStatus[day.id] || 'pending';
          const isCompleted = status === 'completed';
          const isSkipped = status === 'skipped';

          return (
            <div
              key={day.id}
              onClick={() => onSelectDay(day)}
              className={`
                relative flex items-center justify-between rounded-xl cursor-pointer transition-all duration-200 overflow-hidden group
                border-4 border-black shadow-comic
                ${isCompleted 
                    ? 'bg-green-400 hover:bg-green-300' 
                    : isSkipped
                        ? 'bg-red-100 border-red-600 hover:bg-red-200' 
                        : 'bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'}
              `}
            >
                <div className="flex-1 py-6 px-6 flex items-center gap-6">
                    
                    {/* Icon/Day Indicator */}
                    <div className={`flex flex-col items-center justify-center w-14 h-14 bg-white border-2 border-black rounded-full shadow-comic-sm shrink-0 ${isSkipped ? 'border-red-600' : ''}`}>
                         {isCompleted ? (
                             <Check size={28} strokeWidth={4} className="text-green-600" />
                         ) : isSkipped ? (
                             <X size={28} strokeWidth={4} className="text-red-600" />
                         ) : (
                             <span className="font-display text-xl text-black">
                                 {day.day.substring(0,3)}
                             </span>
                         )}
                    </div>

                    {/* Text Info */}
                    <div className="flex-1">
                        <h3 className={`font-display text-3xl uppercase leading-none mb-1 ${isCompleted ? 'text-black/50 line-through' : isSkipped ? 'text-red-600' : 'text-black'}`}>
                            {day.title}
                        </h3>
                        <p className={`font-bold text-sm uppercase tracking-wide ${isCompleted ? 'text-black/50' : isSkipped ? 'text-red-500' : 'text-gray-500'}`}>
                            {isSkipped ? 'MISSED WORKOUT' : day.focus}
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className={`w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center transition-colors border-2 border-transparent group-hover:border-black ${isSkipped ? 'bg-red-600 group-hover:bg-red-500' : 'group-hover:bg-yellow-400 group-hover:text-black'}`}>
                        <ArrowRight size={24} strokeWidth={3} />
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
