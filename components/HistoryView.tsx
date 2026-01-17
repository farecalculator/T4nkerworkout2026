import React, { useMemo, useState } from 'react';
import { HistoryEntry, CheckIn, WorkoutDay } from '../types';
import { ArrowLeft, Calendar, Dumbbell, Trash2, Activity, Flame, PlusSquare, Save, ChevronLeft, ChevronRight, X, Clock, Trophy } from 'lucide-react';
import { WORKOUT_PLAN } from '../constants';

interface Props {
  history: HistoryEntry[];
  checkIns?: CheckIn[];
  skippedDates?: string[];
  onBack: () => void;
  onClear: () => void;
  onRetroactiveWorkout?: (date: string, workoutId: string) => void;
  onDeleteWorkout?: (id: string) => void;
  customPlan?: WorkoutDay[];
}

const HistoryView: React.FC<Props> = ({ history, checkIns = [], skippedDates = [], onBack, onClear, onRetroactiveWorkout, onDeleteWorkout, customPlan }) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [logWorkoutId, setLogWorkoutId] = useState('');
  const [selectedDayDetails, setSelectedDayDetails] = useState<{date: string, workouts: HistoryEntry[], checkIn?: CheckIn} | null>(null);
  const [viewingEntry, setViewingEntry] = useState<HistoryEntry | null>(null); 
  const [viewDate, setViewDate] = useState(new Date());
  const activePlan = customPlan || WORKOUT_PLAN;

  const toLocalYMD = (dateInput: string | Date) => {
    try {
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      if (isNaN(year)) return null; 
      return `${year}-${month}-${day}`;
    } catch (e) { return null; }
  };

  const getLogDate = (entry: HistoryEntry | CheckIn) => entry.localDate || toLocalYMD(entry.date) || 'Invalid';

  const { calendarDays, currentStreak, monthlyConsistency, viewMonthLabel } = useMemo(() => {
    const today = new Date();
    const todayYMD = toLocalYMD(today)!;
    
    // 1. Determine User Start Date (Fairness Logic)
    let userStartDateYMD = todayYMD;
    if (history.length > 0) {
        const sortedHistory = [...history].sort((a,b) => (getLogDate(a) > getLogDate(b) ? 1 : -1));
        const firstLog = getLogDate(sortedHistory[0]);
        if (firstLog < userStartDateYMD) userStartDateYMD = firstLog;
    }

    const activeDates = new Set<string>();
    const workoutDates = new Set<string>();
    const skippedSet = new Set<string>(skippedDates);

    if (history.length > 0) {
        history.forEach(h => {
            const ymd = getLogDate(h);
            if (ymd !== 'Invalid') { activeDates.add(ymd); workoutDates.add(ymd); }
        });
    }
    
    checkIns.forEach(c => { const ymd = getLogDate(c); if (ymd !== 'Invalid') activeDates.add(ymd); });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDay = firstDayOfMonth.getDay(); 
    if (startDay === 0) startDay = 7;
    const paddingDays = startDay - 1;

    const daysArray = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = paddingDays - 1; i >= 0; i--) daysArray.push({ date: toLocalYMD(new Date(year, month - 1, prevMonthLastDay - i)), isCurrentMonth: false, dayNum: new Date(year, month - 1, prevMonthLastDay - i).getDate() });
    for (let i = 1; i <= daysInMonth; i++) daysArray.push({ date: toLocalYMD(new Date(year, month, i)), isCurrentMonth: true, dayNum: i });
    const totalCells = daysArray.length > 35 ? 42 : 35;
    for (let i = 1; i <= totalCells - daysArray.length; i++) daysArray.push({ date: toLocalYMD(new Date(year, month + 1, i)), isCurrentMonth: false, dayNum: i });

    const mappedDays = daysArray.map(d => {
        if (!d.date) return { ...d, intensity: 0 };
        const isFuture = d.date > todayYMD;
        const isToday = d.date === todayYMD;
        const hasWorkout = workoutDates.has(d.date);
        const hasCheckIn = activeDates.has(d.date);
        const isSkippedExplicitly = skippedSet.has(d.date);
        const [y, m, day] = d.date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, day);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let intensity = 0; // 0=Empty, 1=CheckIn, 2=Workout, 3=Rest, -1=Skip, -2=Miss
        
        // Priority Logic:
        if (isSkippedExplicitly) intensity = -1; // Explicit Red Block overrides everything
        else if (hasWorkout) intensity = 2; // Blue
        else if (hasCheckIn) intensity = 1; // Purple
        else if (isWeekend) intensity = 3; // Gold (Rest)
        else if (isFuture) intensity = 0; // Empty
        // Miss Logic: Only if date is AFTER user start date AND is a weekday AND is in past
        else if (d.date >= userStartDateYMD) intensity = -2; // Light Red (Missed)
        
        return { ...d, isToday, intensity };
    });

    // Streak Logic (Local Time Safe)
    let streak = 0;
    let checkDate = new Date(); // Today
    // Check today first
    if (workoutDates.has(toLocalYMD(checkDate)!)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
    } else {
        // If not today, check yesterday (allow 1 day gap for active streak)
        checkDate.setDate(checkDate.getDate() - 1);
        if (!workoutDates.has(toLocalYMD(checkDate)!)) {
             // Streak broken if neither today nor yesterday has workout
             streak = 0;
        }
    }
    
    // Count backwards
    let lookingBack = streak > 0; // Only look back if we established a start
    while(lookingBack) {
        if (workoutDates.has(toLocalYMD(checkDate)!)) { 
            streak++; 
            checkDate.setDate(checkDate.getDate() - 1); 
        } else { 
            lookingBack = false; 
        }
    }

    // Consistency Logic (Fair)
    // Formula: (Workouts Completed) / (Workouts Completed + Missed Weekdays)
    // Only counts from userStartDateYMD up to Yesterday
    let totalWorkoutsAllTime = workoutDates.size;
    let missedWeekdaysAllTime = 0;
    
    // Iterate from start date to yesterday
    let iterDate = new Date(userStartDateYMD);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    while(iterDate <= yesterday) {
        const iterYMD = toLocalYMD(iterDate)!;
        const dayOfWeek = iterDate.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        if (isWeekday && !workoutDates.has(iterYMD) && !skippedSet.has(iterYMD)) {
            missedWeekdaysAllTime++;
        }
        iterDate.setDate(iterDate.getDate() + 1);
    }
    
    const consistencyScore = (totalWorkoutsAllTime + missedWeekdaysAllTime) > 0 
        ? Math.round((totalWorkoutsAllTime / (totalWorkoutsAllTime + missedWeekdaysAllTime)) * 100) 
        : 100;

    return { calendarDays: mappedDays, currentStreak: streak, monthlyConsistency: consistencyScore, viewMonthLabel: viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  }, [history, checkIns, viewDate, skippedDates]);

  const handleDayClick = (dateStr: string | null) => {
      if (!dateStr) return;
      const workouts = history.filter(h => getLogDate(h) === dateStr);
      const checkIn = checkIns.find(c => getLogDate(c) === dateStr);
      if (workouts.length > 0 || checkIn) setSelectedDayDetails({ date: dateStr, workouts, checkIn });
      else setSelectedDayDetails(null);
  };

  return (
    <div className="animate-fadeIn pb-10">
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-black hover:text-white transition-colors text-sm font-black group bg-white hover:bg-black px-4 py-2 rounded-lg border-2 border-black shadow-comic-sm">
            <ArrowLeft size={16} className="mr-1" /> DASHBOARD
        </button>
        <div className="flex gap-2">
            {onRetroactiveWorkout && (
                <button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 text-xs font-black text-black bg-yellow-400 px-3 py-1 rounded border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none transition-all">
                    <PlusSquare size={14} /> LOG MISSING
                </button>
            )}
            {history.length > 0 && (
                <button onClick={onClear} className="flex items-center gap-2 text-xs font-black text-white bg-red-600 px-3 py-1 rounded border-2 border-black hover:bg-red-500 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none transition-all">
                    <Trash2 size={14} /> RESET
                </button>
            )}
        </div>
      </div>

      {showLogModal && (
        <div className="mb-8 p-6 bg-white border-4 border-black rounded-2xl shadow-comic animate-popIn">
            <h3 className="font-display text-2xl text-black mb-4">LOG PAST WORKOUT</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="p-3 rounded-lg border-2 border-black font-bold text-black"/>
                <select value={logWorkoutId} onChange={(e) => setLogWorkoutId(e.target.value)} className="p-3 rounded-lg border-2 border-black font-bold text-black">
                    <option value="">Select Workout...</option>
                    {activePlan.map(day => <option key={day.id} value={day.id}>{day.title}</option>)}
                </select>
                <button disabled={!logDate || !logWorkoutId} onClick={() => { if(logDate && logWorkoutId && onRetroactiveWorkout) { onRetroactiveWorkout(logDate, logWorkoutId); setShowLogModal(false); setLogDate(''); setLogWorkoutId(''); }}} className="p-3 rounded-lg bg-black text-white font-black border-2 border-black hover:bg-gray-800 disabled:opacity-50">CONFIRM</button>
            </div>
            <button onClick={() => setShowLogModal(false)} className="text-xs font-bold text-gray-500 underline">Cancel</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border-4 border-black shadow-comic flex flex-col justify-center items-center">
             <Flame className={`mb-3 ${currentStreak > 0 ? 'text-orange-500 fill-orange-500 animate-bounce-slow' : 'text-gray-300'}`} size={48} />
             <div className="font-display text-6xl text-black mb-1 leading-none">{currentStreak}</div>
             <div className="text-sm font-black text-gray-500 uppercase tracking-widest">Day Streak</div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-2xl border-4 border-black shadow-comic relative">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-display text-3xl text-black uppercase">{viewMonthLabel}</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 rounded-lg bg-gray-100 border-2 border-black hover:bg-yellow-200 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none"><ChevronLeft size={20} color="black"/></button>
                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 rounded-lg bg-gray-100 border-2 border-black hover:bg-yellow-200 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none"><ChevronRight size={20} color="black"/></button>
                 </div>
             </div>
             
             <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => <div key={i} className="text-center text-[10px] sm:text-xs font-black text-gray-500 uppercase">{d}</div>)}
             </div>

             <div className="grid grid-cols-7 gap-1 md:gap-2">
                {calendarDays.map((d, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleDayClick(d.date)}
                        className={`
                            aspect-square rounded-lg border-2 border-black flex items-center justify-center relative font-black text-sm transition-transform hover:scale-105 active:scale-95
                            ${!d.isCurrentMonth ? 'opacity-30' : ''}
                            ${d.intensity === -1 ? 'bg-red-600 text-white' : 
                              d.intensity === 2 ? 'bg-blue-400 text-white' : 
                              d.intensity === 1 ? 'bg-purple-300 text-white' : 
                              d.intensity === 3 ? 'bg-yellow-300 text-black' : // Rest (Black text)
                              d.intensity === -2 ? 'bg-red-100 text-red-400' : 
                              d.isToday ? 'bg-white ring-4 ring-yellow-400 text-black' : // Today (Black text)
                              'bg-gray-50 text-black'} 
                        `}
                    >
                        {d.dayNum}
                        {d.isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full border border-black"></div>}
                    </button>
                ))}
             </div>
             
             {selectedDayDetails && (
                 <div className="mt-4 p-4 bg-yellow-50 border-2 border-black rounded-xl relative shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                     <button onClick={() => setSelectedDayDetails(null)} className="absolute top-2 right-2 hover:bg-red-100 rounded p-1"><X size={14} /></button>
                     <h4 className="font-black uppercase text-black mb-2">{new Date(selectedDayDetails.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                     {selectedDayDetails.workouts.map(w => <div key={w.id} className="font-bold text-blue-600 flex items-center gap-2 text-sm">💪 {w.workoutTitle}</div>)}
                     {selectedDayDetails.checkIn && <div className="font-bold text-purple-600 flex items-center gap-2 text-sm">⚡ Mood: {selectedDayDetails.checkIn.mood} | {selectedDayDetails.checkIn.bodyWeight}kg</div>}
                 </div>
             )}

             <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-gray-100">
                <span className={`font-black uppercase text-sm ${monthlyConsistency >= 80 ? 'text-green-600' : 'text-orange-500'}`}>Consistency: {monthlyConsistency}%</span>
                <div className="flex gap-2 md:gap-3 text-[10px] font-black uppercase text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-600 border border-black"></span> Miss</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 border border-black"></span> Work</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-200 border border-black"></span> Rest</span>
                </div>
             </div>
          </div>
      </div>

      <h3 className="font-display text-2xl text-white text-outline mb-4">Recent Logs</h3>
      <div className="space-y-3">
        {history.map((entry) => (
            <div 
                key={entry.id} 
                className="flex items-stretch bg-white rounded-xl border-4 border-black shadow-comic-sm overflow-hidden relative group"
            >
                {/* Clickable Area for Details */}
                <button 
                    type="button"
                    className="flex-1 p-4 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col justify-center text-left focus:outline-none focus:bg-blue-50"
                    onClick={() => setViewingEntry(entry)}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] sm:text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-black">{getLogDate(entry)}</span>
                        {entry.rating && (
                            <span className="text-[10px] sm:text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded border border-black flex items-center gap-1">
                                🔥 {entry.rating}/10
                            </span>
                        )}
                    </div>
                    <h4 className="font-display text-lg sm:text-xl text-black truncate">{entry.workoutTitle}</h4>
                </button>
                
                {/* Separator Line */}
                <div className="w-[2px] bg-black relative z-10"></div>

                {/* Explicit Delete Action Area */}
                {onDeleteWorkout && (
                    <button 
                        type="button"
                        className="w-16 sm:w-20 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white cursor-pointer transition-colors flex items-center justify-center active:bg-red-600 relative z-50 focus:outline-none"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            if(onDeleteWorkout) onDeleteWorkout(entry.id);
                        }}
                    >
                        <Trash2 size={24} strokeWidth={2.5} className="pointer-events-none" />
                    </button>
                )}
            </div>
        ))}
      </div>

      {/* LOG DETAIL MODAL */}
      {viewingEntry && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-md w-full shadow-comic animate-popIn relative max-h-[85vh] overflow-y-auto">
                <button onClick={() => setViewingEntry(null)} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-red-100 border-2 border-black rounded-lg transition-colors">
                    <X size={20} />
                </button>
                
                <div className="mb-6 border-b-2 border-black pb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-black text-white text-xs font-black uppercase rounded-full">
                            {getLogDate(viewingEntry)}
                        </span>
                        {viewingEntry.rating && (
                            <span className="px-3 py-1 bg-orange-500 text-white text-xs font-black uppercase rounded-full border border-black">
                                Intensity: {viewingEntry.rating}/10
                            </span>
                        )}
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl text-black leading-none uppercase">{viewingEntry.workoutTitle}</h2>
                </div>

                <div className="space-y-4">
                    <h3 className="font-black uppercase text-sm text-gray-400">Session Report</h3>
                    {viewingEntry.exercises.map((ex, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border-2 border-black/10">
                            <div>
                                <h4 className="font-bold text-black uppercase text-sm sm:text-base">{ex.name}</h4>
                                <div className="text-xs font-bold text-gray-500">{ex.sets} Sets × {ex.reps}</div>
                            </div>
                            <div className="text-lg sm:text-xl font-display text-black">
                                {ex.weight} <span className="text-xs font-bold text-gray-400">KG</span>
                            </div>
                        </div>
                    ))}
                    
                    {viewingEntry.exercises.length === 0 && (
                        <p className="text-gray-400 italic text-sm">No exercise details recorded.</p>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={() => setViewingEntry(null)}
                        className="flex-1 py-3 bg-yellow-400 text-black font-black uppercase rounded-xl border-2 border-black shadow-comic active:translate-y-1 active:shadow-none transition-all"
                    >
                        Close Report
                    </button>
                    {onDeleteWorkout && (
                         <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWorkout(viewingEntry.id); 
                                setViewingEntry(null);
                            }}
                            className="w-14 flex items-center justify-center bg-red-100 text-red-600 border-2 border-black rounded-xl hover:bg-red-200 active:bg-red-300 transition-colors"
                            title="Delete this record"
                        >
                            <Trash2 size={24} className="pointer-events-none" />
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;