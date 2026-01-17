
import React, { useState, useEffect } from 'react';
import { ViewState, WorkoutDay, UserData, DayStatus, HistoryEntry, Exercise, CheckIn, Program } from './types';
import { WORKOUT_PLAN, APP_THEMES } from './constants';
import WeekView from './components/WeekView';
import DayDetail from './components/DayDetail';
import SettingsModal from './components/SettingsModal';
import HistoryView from './components/HistoryView';
import CheckInModal from './components/CheckInModal';
import WeightHistoryModal from './components/WeightHistoryModal';
import MonthlyReportModal from './components/MonthlyReportModal';
import WeekSelector from './components/WeekSelector';
import ProgramManager from './components/ProgramManager';
import { Zap, Settings, BarChart3, Shield, Scale, Activity, Dumbbell, Play } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.WEEK_VIEW);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWeightHistory, setShowWeightHistory] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showProgramManager, setShowProgramManager] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  
  // -- PERSISTENCE LOGIC START --
  const loadData = (): UserData => {
    try {
      const saved = localStorage.getItem('t4nker_data_v2'); 
      if (!saved) return { currentWeek: 1, weights: {}, weekStatus: {}, history: [], checkIns: [], skippedDates: [], programs: [], customPlan: undefined, bgOverlayOpacity: 0.5, activeTheme: 'cartoon' };
      const parsed = JSON.parse(saved);
      
      // MIGRATION: Programs Structure
      if (!parsed.programs || parsed.programs.length === 0) {
          const legacyPlan = parsed.customPlan || WORKOUT_PLAN;
          const defaultProgram: Program = {
              id: 'prog_default',
              name: 'Spartan Protocol (Classic)',
              startDate: new Date().toISOString().split('T')[0], // Default start to today if migrating
              durationWeeks: 52,
              schedule: legacyPlan,
              isActive: true,
              createdAt: new Date().toISOString()
          };
          parsed.programs = [defaultProgram];
      }

      // FAILSAFE: Ensure at least one program is active
      if (parsed.programs && parsed.programs.length > 0) {
         const hasActive = parsed.programs.some((p: Program) => p.isActive);
         if (!hasActive) {
             // Activate the most recently created program
             parsed.programs.sort((a: Program, b: Program) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
             parsed.programs[0].isActive = true;
         }
      }

      if (!parsed.customPlan) parsed.customPlan = WORKOUT_PLAN;
      // Force cartoon theme if legacy
      if (!parsed.activeTheme || parsed.activeTheme === 'cyberpunk') parsed.activeTheme = 'cartoon';
      
      // MIGRATION: Backfill localDate
      if (parsed.history) {
        parsed.history = parsed.history.map((h: HistoryEntry) => {
            if (!h.localDate && h.date) {
                try { h.localDate = h.date.split('T')[0]; } catch (e) { h.localDate = '2024-01-01'; }
            }
            return h;
        });
        const uniqueHistory = Array.from(new Map(parsed.history.map((item: HistoryEntry) => [item.id, item])).values());
        parsed.history = uniqueHistory;
      }

      return parsed;
    } catch (e) {
      // Emergency Fallback
      const defaultProgram: Program = {
        id: 'prog_default',
        name: 'Spartan Protocol (Classic)',
        startDate: new Date().toISOString().split('T')[0],
        durationWeeks: 52,
        schedule: WORKOUT_PLAN,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      return { currentWeek: 1, weights: {}, weekStatus: {}, history: [], checkIns: [], skippedDates: [], programs: [defaultProgram], customPlan: WORKOUT_PLAN, bgOverlayOpacity: 0.5, activeTheme: 'cartoon' };
    }
  };

  const [userData, setUserData] = useState<UserData>(loadData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewingWeek, setViewingWeek] = useState<number>(userData.currentWeek);

  // Derived Active Program
  const activeProgram = userData.programs?.find(p => p.isActive) || userData.programs?.[0];
  const activeSchedule = activeProgram ? activeProgram.schedule : WORKOUT_PLAN;

  // STORAGE OPTIMIZATION FOR LONG TERM USAGE
  const optimizeStorage = () => {
      try {
          const rawSize = JSON.stringify(userData).length;
          // If data > 2MB (Browser limit usually 5MB), start optimizing
          if (rawSize > 2000000) {
             console.log("Optimizing storage...");
             const oneYearAgo = new Date();
             oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
             
             setUserData(prev => ({
                 ...prev,
                 history: prev.history.map(h => {
                     // For very old records, strip optional large metadata
                     if (new Date(h.date) < oneYearAgo) {
                         return {
                             id: h.id,
                             date: h.date,
                             localDate: h.localDate,
                             workoutTitle: h.workoutTitle, // Keep title
                             exercises: h.exercises.map(ex => ({
                                 name: ex.name,
                                 weight: ex.weight,
                                 sets: ex.sets,
                                 reps: ex.reps
                             }))
                             // Removing weekNumber or other future meta if exists
                         } as HistoryEntry;
                     }
                     return h;
                 })
             }));
             console.log("Storage optimized.");
          }
      } catch(e) { console.error("Optimization failed", e); }
  };

  useEffect(() => {
    if (!isInitialized) { 
        setIsInitialized(true); 
        setViewingWeek(userData.currentWeek);
        optimizeStorage();
        return; 
    }
    try { localStorage.setItem('t4nker_data_v2', JSON.stringify(userData)); } catch (e) { console.error("Auto-save failed", e); }
  }, [userData, isInitialized]);

  // SELF HEALING: Ensure programs never empty
  useEffect(() => {
    if (isInitialized && (!userData.programs || userData.programs.length === 0)) {
        console.log("Self-healing: Creating default program");
        const defaultProgram: Program = {
            id: 'prog_default_heal',
            name: 'Spartan Protocol (Classic)',
            startDate: new Date().toISOString().split('T')[0],
            durationWeeks: 52,
            schedule: WORKOUT_PLAN,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        setUserData(prev => ({ ...prev, programs: [defaultProgram] }));
    }
  }, [userData.programs, isInitialized]);

  // Sync viewing week when current week changes
  useEffect(() => {
    setViewingWeek(userData.currentWeek);
  }, [userData.currentWeek]);

  // Theme Injection
  useEffect(() => {
      const themeId = userData.activeTheme || 'cartoon';
      const theme = APP_THEMES[themeId as keyof typeof APP_THEMES] || APP_THEMES['cartoon'];
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(key, value);
      });
  }, [userData.activeTheme]);

  const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getUserTimezone = () => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return "Unknown Location"; }
  };

  useEffect(() => {
    const today = getLocalToday();
    const hasCheckedInToday = userData.checkIns.some(entry => entry.localDate === today || entry.date === today);
    if (!hasCheckedInToday && view === ViewState.WEEK_VIEW) {
        const timer = setTimeout(() => setShowCheckIn(true), 800);
        return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const handleUpdateWeight = (exerciseId: string, weight: number) => {
    const oldWeight = userData.weights[exerciseId] || 0;
    setUserData(prev => ({ ...prev, weights: { ...prev.weights, [exerciseId]: weight } }));
    if (oldWeight > 0 && weight > oldWeight) {
        setTimeout(() => showToast(`NEW PR! 🏆 +${(weight - oldWeight).toFixed(1)}kg`), 800);
    }
  };

  const handleDayStatus = (status: DayStatus, rating?: number) => {
    if (selectedDay) {
      const today = getLocalToday();
      setUserData(prev => {
          let newHistory = [...prev.history];
          if (status === 'completed') {
            const entry: HistoryEntry = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              localDate: today,
              workoutTitle: selectedDay.title,
              weekNumber: prev.currentWeek,
              rating: rating,
              exercises: selectedDay.exercises.map(ex => ({
                name: ex.name,
                weight: prev.weights[ex.id] || 0,
                sets: ex.sets,
                reps: ex.reps
              }))
            };
            newHistory = [entry, ...newHistory];
          }
          let newSkippedDates = prev.skippedDates || [];
          if (status === 'skipped') {
              if (!newSkippedDates.includes(today)) newSkippedDates = [...newSkippedDates, today];
          }
          return {
            ...prev,
            weekStatus: { ...prev.weekStatus, [selectedDay.id]: status },
            history: newHistory,
            skippedDates: newSkippedDates
          };
      });
      showToast(status === 'completed' ? "BOOM! DAY COMPLETE!" : "REST UP, WARRIOR.");
      goBack();
    }
  };

  const handleCheckInComplete = (mood: string, bodyWeight: number) => {
    const today = getLocalToday();
    setUserData(prev => {
        const filteredCheckIns = prev.checkIns.filter(c => c.localDate !== today && c.date !== today);
        return {
            ...prev,
            checkIns: [{ date: today, localDate: today, timestamp: new Date().toISOString(), mood, bodyWeight }, ...filteredCheckIns]
        };
    });
    setShowCheckIn(false);
    showToast("STATS LOCKED IN!");
  };

  const handleManualCheckInTrigger = () => {
    setShowWeightHistory(false);
    setShowCheckIn(true);
  };

  const handleRetroactiveCheckIn = (date: string, mood: string, weight: number) => {
    const syntheticTimestamp = new Date(date + 'T12:00:00').toISOString();
    setUserData(prev => {
         const filtered = prev.checkIns.filter(c => c.localDate !== date && c.date !== date);
         return { ...prev, checkIns: [{ date: date, localDate: date, timestamp: syntheticTimestamp, mood, bodyWeight: weight }, ...filtered] };
    });
    showToast(`Saved record for ${date}`);
  };

  const handleRetroactiveWorkout = (date: string, workoutId: string) => {
      // Use Active Schedule for lookup
      const plan = activeSchedule;
      const day = plan.find(d => d.id === workoutId);
      if (!day) { showToast("Invalid workout ID"); return; }

      const entry: HistoryEntry = {
          id: `retro_${Date.now()}`,
          date: new Date().toISOString(),
          localDate: date,
          workoutTitle: day.title,
          weekNumber: userData.currentWeek,
          exercises: day.exercises.map(ex => ({
              name: ex.name,
              weight: userData.weights[ex.id] || 0,
              sets: ex.sets,
              reps: ex.reps
          }))
      };
      setUserData(prev => ({ ...prev, history: [entry, ...prev.history] }));
      showToast(`Logged ${day.title} for ${date}`);
  };

  const handleDeleteWorkout = (id: string) => {
      if (window.confirm("Delete this workout record?")) {
          setUserData(prev => ({ ...prev, history: prev.history.filter(h => h.id !== id) }));
          showToast("Record Deleted");
      }
  };

  const handleDeleteCheckIn = (timestamp?: string, date?: string) => {
      if (window.confirm("Remove this log entry?")) {
          setUserData(prev => ({ ...prev, checkIns: prev.checkIns.filter(c => { if (timestamp && c.timestamp) return c.timestamp !== timestamp; return c.date !== date; }) }));
          showToast("Log Removed");
      }
  };
  
  const handleClearHistory = () => {
      if (window.confirm("Delete all workout history logs?")) {
          setUserData(prev => ({ ...prev, history: [] }));
          showToast("Workout Logs Cleared");
      }
  };

  const handleStartNewWeek = (skipConfirmation = false) => {
    if (!skipConfirmation && userData.currentWeek > 0 && userData.currentWeek % 4 === 0) {
       setShowMonthlyReport(true);
       return; 
    }
    if (skipConfirmation || window.confirm(`Finish Week ${userData.currentWeek} and start Week ${userData.currentWeek + 1}?`)) {
      setUserData(prev => ({ ...prev, currentWeek: prev.currentWeek + 1, weekStatus: {} }));
      setShowSettings(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!skipConfirmation) showToast(`LEVEL UP: WEEK ${userData.currentWeek + 1}`);
      goBack(); 
    }
  };

  const handleCloseReportAndAdvance = () => { setShowMonthlyReport(false); handleStartNewWeek(true); };
  const handleResetWeights = () => { if (window.confirm("Delete all weight history?")) { setUserData(prev => ({ ...prev, weights: {} })); setShowSettings(false); showToast("Weights reset"); } };
  
  const handleHardReset = () => { 
      if (window.confirm("Permanently delete ALL data?")) { 
          const defaultProgram: Program = {
            id: 'prog_default_reset',
            name: 'Spartan Protocol (Classic)',
            startDate: new Date().toISOString().split('T')[0],
            durationWeeks: 52,
            schedule: WORKOUT_PLAN,
            isActive: true,
            createdAt: new Date().toISOString()
          };
          setUserData({ 
              currentWeek: 1, weights: {}, weekStatus: {}, history: [], checkIns: [], skippedDates: [], 
              programs: [defaultProgram], 
              customPlan: WORKOUT_PLAN, bgOverlayOpacity: 0.5, activeTheme: 'cartoon' 
          }); 
          setShowSettings(false); 
          showToast("System reset"); 
          goBack(); 
          setTimeout(() => window.location.reload(), 500); 
      } 
  };

  const handleInitializeDefaultProgram = () => {
     const defaultProgram: Program = {
        id: 'prog_default_manual',
        name: 'Spartan Protocol (Classic)',
        startDate: new Date().toISOString().split('T')[0],
        durationWeeks: 52,
        schedule: WORKOUT_PLAN,
        isActive: true,
        createdAt: new Date().toISOString()
     };
     setUserData(prev => ({ ...prev, programs: [defaultProgram] }));
     showToast("Program Initialized!");
  };

  // --- DEMO DATA GENERATOR ---
  const handlePopulateDemoData = () => {
    if(!window.confirm("This will clear current logs and generate 60 days of demo history. Continue?")) return;

    const today = new Date();
    const demoHistory: HistoryEntry[] = [];
    const demoCheckIns: CheckIn[] = [];
    const demoWeights: Record<string, number> = {};
    const moods = ['🔥', '⚡', '🧘', '🔥', '🔥', '⚡'];

    let currentWeight = 85.0; // Start weight
    let currentSquat = 100;

    // Go back 60 days
    for (let i = 60; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const ymd = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...

        // 1. Generate Body Weight (Trending down then up slightly)
        if (i % 2 === 0) {
            currentWeight += (Math.random() - 0.6) * 0.4; // Fluctuate
            demoCheckIns.push({
                date: ymd,
                localDate: ymd,
                timestamp: new Date(d.setHours(8,0,0)).toISOString(),
                mood: moods[Math.floor(Math.random() * moods.length)],
                bodyWeight: parseFloat(currentWeight.toFixed(1))
            });
        }

        // 2. Generate Workouts (Mon, Tue, Thu, Fri)
        let workoutId = '';
        if (dayOfWeek === 1) workoutId = 'mon'; // Push 1
        if (dayOfWeek === 2) workoutId = 'tue'; // Pull 1
        if (dayOfWeek === 4) workoutId = 'thu'; // Push 2
        if (dayOfWeek === 5) workoutId = 'fri'; // Legs 2

        if (workoutId && Math.random() > 0.1) { // 90% chance to workout
             const planDay = activeSchedule.find(p => p.id === workoutId);
             if (planDay) {
                 // Simulate Strength Gains
                 currentSquat += 0.5;
                 
                 demoHistory.push({
                     id: `demo_${ymd}`,
                     date: new Date(d.setHours(18,0,0)).toISOString(),
                     localDate: ymd,
                     workoutTitle: planDay.title,
                     weekNumber: Math.ceil((60 - i) / 7),
                     exercises: planDay.exercises.map(ex => ({
                         name: ex.name,
                         weight: ex.category === 'legs' ? Math.floor(currentSquat) : 50,
                         sets: ex.sets,
                         reps: ex.reps
                     }))
                 });
             }
        }
    }

    setUserData(prev => ({
        ...prev,
        history: demoHistory,
        checkIns: demoCheckIns,
        weights: demoWeights,
        currentWeek: 9,
    }));
    setShowSettings(false);
    showToast("DEMO DATA LOADED! 🚀");
  };


  const handleSetBackground = (url: string | undefined, opacity: number) => { setUserData(prev => ({ ...prev, backgroundImage: url, bgOverlayOpacity: opacity })); };
  const handleSetTheme = (themeId: string) => { setUserData(prev => ({ ...prev, activeTheme: themeId })); showToast(`Theme updated`); };

  const handleSaveProgram = (program: Program) => {
    setUserData(prev => {
        const existing = prev.programs?.findIndex(p => p.id === program.id);
        let newPrograms = prev.programs ? [...prev.programs] : [];
        if (existing !== undefined && existing !== -1) {
            newPrograms[existing] = program;
        } else {
            newPrograms.push(program);
        }
        
        // If new program is active, deactivate others
        if (program.isActive) {
            newPrograms = newPrograms.map(p => ({ ...p, isActive: p.id === program.id }));
        }
        
        // SAFETY CHECK: If no program is active after this operation (e.g. saving a draft but nothing else was active), force this one active
        const hasActive = newPrograms.some(p => p.isActive);
        if (!hasActive && newPrograms.length > 0) {
            // Default to the one being saved/edited
             newPrograms = newPrograms.map(p => ({ ...p, isActive: p.id === program.id }));
        }

        return { ...prev, programs: newPrograms };
    });
    showToast("Program Saved!");
  };

  const handleSetActiveProgram = (id: string) => {
    setUserData(prev => ({
        ...prev,
        programs: prev.programs?.map(p => ({ ...p, isActive: p.id === id }))
    }));
    showToast("Program Switched!");
  };
  
  const handleDeleteProgram = (id: string) => {
      if (window.confirm("Archive/Delete this program?")) {
          setUserData(prev => ({
              ...prev,
              programs: prev.programs?.filter(p => p.id !== id)
          }));
          showToast("Program Deleted");
      }
  };

  const handleSwapExercise = (dayId: string, oldExerciseId: string, newExercise: Partial<Exercise>) => {
    // We must update the ACTIVE PROGRAM
    if (!activeProgram) return;

    const updatedSchedule = activeSchedule.map(day => {
      if (day.id !== dayId) return day;
      const updatedExercises = day.exercises.map(ex => {
        if (ex.id !== oldExerciseId) return ex;
        return { ...ex, ...newExercise, id: `${dayId}_custom_${Date.now()}`, notes: 'Swapped: ' + (newExercise.name) } as Exercise;
      });
      return { ...day, exercises: updatedExercises };
    });
    
    // Save back to program
    const updatedProgram = { ...activeProgram, schedule: updatedSchedule };
    handleSaveProgram(updatedProgram);

    if (selectedDay && selectedDay.id === dayId) {
        const updatedDay = updatedSchedule.find(d => d.id === dayId);
        if (updatedDay) setSelectedDay(updatedDay);
    }
    showToast("Exercise Swapped!");
  };

  const selectDay = (day: WorkoutDay) => { setSelectedDay(day); setView(ViewState.DAY_VIEW); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goBack = () => { setSelectedDay(null); setView(ViewState.WEEK_VIEW); };

  const handleWeekSelect = (week: number) => {
    if (week === userData.currentWeek + 1) {
        handleStartNewWeek(false);
    } else if (week <= userData.currentWeek) {
        setViewingWeek(week);
        if (week !== userData.currentWeek) {
             showToast(`Viewing Week ${week} (Read Only)`);
        } else {
             showToast(`Back to Active Week ${week}`);
        }
    }
  };

  const totalWorkouts = userData.history.length;
  const completedThisWeek = Object.values(userData.weekStatus).filter(s => s === 'completed').length;
  const isWeekComplete = completedThisWeek >= 5;

  const latestCheckIn = userData.checkIns[0]; 
  const currentWeight = latestCheckIn ? latestCheckIn.bodyWeight : '--';
  const currentMood = latestCheckIn ? latestCheckIn.mood : '🚀';

  return (
    <div className="min-h-screen font-sans selection:bg-yellow-400 selection:text-black relative bg-[var(--theme-bg)] transition-colors duration-500 overflow-x-hidden">
      
      {/* Background Logic */}
      {userData.backgroundImage ? (
         <>
             <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: `url(${userData.backgroundImage})` }}
             />
             <div 
                className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 bg-gradient-to-b from-transparent via-transparent to-black"
                style={{ opacity: 1 - (userData.bgOverlayOpacity || 0.3) }}
             />
         </>
      ) : (
        /* LOONEY RINGS BACKGROUND + STICKERS */
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
             {/* Dynamic Rings using Theme Colors */}
             <div 
                className="absolute inset-[-100%] w-[300%] h-[300%] opacity-20 origin-center animate-spin-slow"
                style={{ 
                    background: 'repeating-radial-gradient(circle at center, var(--theme-primary) 0, var(--theme-primary) 60px, var(--theme-secondary) 60px, var(--theme-secondary) 120px)' 
                }}
             ></div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/30 to-[var(--theme-bg)]"></div>
             
             {/* TOON STICKERS LAYER */}
             {userData.activeTheme === 'cartoon' && (
               <div className="absolute inset-0 overflow-hidden opacity-30">
                  <div className="absolute top-10 left-10 text-6xl animate-float-slow">🥕</div>
                  <div className="absolute top-1/3 right-20 text-5xl animate-float-medium">🧨</div>
                  <div className="absolute bottom-20 left-1/4 text-6xl animate-float-fast">⭐</div>
                  <div className="absolute top-1/2 left-10 text-4xl animate-float-slow" style={{animationDelay: '1s'}}>🌪️</div>
                  <div className="absolute bottom-10 right-10 text-5xl animate-float-medium" style={{animationDelay: '2s'}}>🔨</div>
                  <div className="absolute top-20 left-1/2 text-4xl animate-float-fast" style={{animationDelay: '1.5s'}}>💣</div>
               </div>
             )}
        </div>
      )}

      <CheckInModal 
        isOpen={showCheckIn} 
        onComplete={handleCheckInComplete} 
        onClose={() => setShowCheckIn(false)}
        initialData={userData.checkIns.find(entry => entry.localDate === getLocalToday()) ? { mood: userData.checkIns.find(entry => entry.localDate === getLocalToday())!.mood, weight: userData.checkIns.find(entry => entry.localDate === getLocalToday())!.bodyWeight } : undefined}
        history={userData.checkIns} 
      />

      <WeightHistoryModal
        isOpen={showWeightHistory}
        onClose={() => setShowWeightHistory(false)}
        checkIns={userData.checkIns}
        onTriggerCheckIn={handleManualCheckInTrigger}
        onRetroactiveCheckIn={handleRetroactiveCheckIn}
        onDeleteCheckIn={handleDeleteCheckIn}
      />
      
      <MonthlyReportModal 
         isOpen={showMonthlyReport}
         onClose={handleCloseReportAndAdvance}
         history={userData.history}
         weekCount={userData.currentWeek}
      />

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onResetWeek={() => handleStartNewWeek(false)}
        onResetWeights={handleResetWeights}
        onHardReset={handleHardReset}
        onSetBackground={handleSetBackground}
        onSetTheme={handleSetTheme}
        onOpenPrograms={() => { setShowSettings(false); setShowProgramManager(true); }}
        onPopulateDemo={handlePopulateDemoData}
        activeTheme={userData.activeTheme || 'cartoon'}
        currentWeek={userData.currentWeek}
        currentBackground={userData.backgroundImage}
        currentOpacity={userData.bgOverlayOpacity}
        detectedTimezone={getUserTimezone()}
      />

      <ProgramManager 
        isOpen={showProgramManager}
        onClose={() => setShowProgramManager(false)}
        programs={userData.programs || []}
        onSaveProgram={handleSaveProgram}
        onSetActive={handleSetActiveProgram}
        onDeleteProgram={handleDeleteProgram}
        onInitializeDefault={handleInitializeDefaultProgram}
      />

      {/* TOAST Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-black border-4 border-black px-8 py-4 rounded-2xl shadow-comic z-[100] animate-popIn font-black text-xl flex items-center gap-3 text-center w-max max-w-[90vw]">
           <span className="text-2xl">💬</span>
           {toastMessage}
        </div>
      )}

      {/* Header - Made Responsive */}
      <header className="sticky top-0 z-50 transition-all duration-300 px-2 sm:px-4 pt-4">
        <div className="max-w-4xl mx-auto min-h-[4rem] md:h-20 py-2 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between bg-white border-4 border-black rounded-2xl px-4 md:px-6 shadow-comic gap-2">
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={goBack}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 border-2 border-black rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Zap className="text-black fill-black" size={20} />
            </div>
            <div className="flex flex-col">
                 <h1 className="font-display text-2xl md:text-3xl text-black leading-none tracking-wide">
                  T4nker
                </h1>
                <span className="text-[10px] md:text-xs font-black bg-[var(--theme-primary)] text-white px-1 py-0.5 -mt-1 -ml-1 rotate-2 inline-block border border-black uppercase">PROTOCOL</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             <button 
              onClick={() => setView(ViewState.HISTORY_VIEW)}
              className={`p-2 rounded-lg border-2 border-black transition-all active:translate-y-1 active:shadow-none ${view === ViewState.HISTORY_VIEW ? 'bg-yellow-400 shadow-none' : 'bg-white shadow-comic-sm hover:bg-gray-50'}`}
            >
              <BarChart3 size={20} className="text-black" />
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg border-2 border-black bg-white shadow-comic-sm hover:bg-gray-50 transition-all active:translate-y-1 active:shadow-none"
            >
              <Settings size={20} className="text-black" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        
        {view === ViewState.WEEK_VIEW && (
          <div className="animate-fadeIn space-y-8">
            
            {/* WEEK SELECTOR */}
            <WeekSelector 
                currentWeek={userData.currentWeek} 
                selectedWeek={viewingWeek} 
                onSelectWeek={handleWeekSelect} 
            />

            {/* Active Program Banner */}
            {activeProgram && (
                <div className="text-center mb-4 animate-slideUp">
                    <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest border-2 border-white/20 truncate max-w-full">
                        Program: {activeProgram.name}
                    </span>
                </div>
            )}

            {/* Stats Grid - Responsive Text */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                
                {/* Weight Card */}
                <button 
                    onClick={() => setShowWeightHistory(true)}
                    className="bg-white p-3 md:p-4 rounded-xl border-4 border-black shadow-comic hover:-translate-y-1 transition-transform relative overflow-hidden group text-left"
                >
                     <div className="flex items-center gap-2 mb-2 text-black font-black uppercase text-xs md:text-sm">
                        <Scale size={16} /> Mass
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p className="font-display text-3xl sm:text-4xl md:text-5xl text-black">{currentWeight}</p>
                        <span className="text-xs font-bold text-gray-500">KG</span>
                    </div>
                </button>

                {/* Vibe Card */}
                 <button 
                    onClick={() => setView(ViewState.HISTORY_VIEW)}
                    className="bg-white p-3 md:p-4 rounded-xl border-4 border-black shadow-comic hover:-translate-y-1 transition-transform relative overflow-hidden group text-left"
                >
                     <div className="flex items-center gap-2 mb-2 text-black font-black uppercase text-xs md:text-sm">
                        <Activity size={16} /> Vibe
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl">{currentMood}</div>
                </button>

                {/* Session Card */}
                <button 
                    onClick={() => setView(ViewState.HISTORY_VIEW)}
                    className="bg-white p-3 md:p-4 rounded-xl border-4 border-black shadow-comic hover:-translate-y-1 transition-transform relative overflow-hidden group text-left"
                >
                    <div className="flex items-center gap-2 mb-2 text-black font-black uppercase text-xs md:text-sm">
                        <Dumbbell size={16} /> XP
                    </div>
                    <p className="font-display text-3xl sm:text-4xl md:text-5xl text-black">{totalWorkouts}</p>
                </button>

                {/* Progress Card */}
                 <div className="bg-white p-3 md:p-4 rounded-xl border-4 border-black shadow-comic relative overflow-hidden text-left">
                     <div className="flex items-center gap-2 mb-2 text-black font-black uppercase text-xs md:text-sm">
                        <Shield size={16} /> Weekly
                    </div>
                    <div className="flex items-end gap-1">
                      <p className="font-display text-3xl sm:text-4xl md:text-5xl text-black">{completedThisWeek}</p>
                      <span className="text-gray-400 text-sm md:text-xl font-bold mb-1">/ 5</span>
                    </div>
                </div>
            </div>

            {viewingWeek === userData.currentWeek ? (
                <WeekView 
                    onSelectDay={selectDay} 
                    weekStatus={userData.weekStatus} 
                    plan={activeSchedule} 
                />
            ) : (
                 /* Placeholder for Past Weeks - In future could show history snapshot */
                <div className="p-8 bg-white/50 border-4 border-black border-dashed rounded-2xl text-center">
                    <h3 className="font-display text-2xl text-white text-outline mb-2">Viewing History for Week {viewingWeek}</h3>
                    <p className="text-white font-bold mb-4">You can browse your logs in the History Tab.</p>
                    <button onClick={() => setViewingWeek(userData.currentWeek)} className="px-4 py-2 bg-yellow-400 text-black font-black border-2 border-black rounded-lg shadow-comic-sm">Return to Current Week</button>
                </div>
            )}

            {/* Quick Advance Button */}
            {isWeekComplete && viewingWeek === userData.currentWeek && (
                <div className="flex justify-center pt-8 pb-4 animate-slideUp">
                     <button 
                        onClick={() => handleStartNewWeek(false)}
                        className="flex items-center gap-3 px-8 py-4 rounded-xl bg-yellow-400 border-4 border-black shadow-comic hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-yellow-500 transition-all text-black font-display text-2xl tracking-wide"
                     >
                        <Play fill="black" /> START WEEK {userData.currentWeek + 1}
                     </button>
                </div>
            )}
          </div>
        )}

        {/* DAY VIEW */}
        {view === ViewState.DAY_VIEW && selectedDay && (
          <DayDetail 
            day={selectedDay}
            onBack={goBack}
            onComplete={() => handleDayStatus('completed')}
            onSkip={() => handleDayStatus('skipped')}
            onWeightUpdate={handleUpdateWeight}
            onSwapExercise={handleSwapExercise}
            weights={userData.weights} 
            status={userData.weekStatus[selectedDay.id] || 'pending'}
          />
        )}

        {/* HISTORY VIEW */}
        {view === ViewState.HISTORY_VIEW && (
          <HistoryView 
            history={userData.history} 
            checkIns={userData.checkIns}
            skippedDates={userData.skippedDates || []} 
            onBack={goBack}
            onClear={handleClearHistory}
            onRetroactiveWorkout={handleRetroactiveWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            customPlan={activeSchedule}
          />
        )}

      </main>
    </div>
  );
};

export default App;
