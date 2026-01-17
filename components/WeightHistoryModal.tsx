
import React, { useState, useMemo } from 'react';
import { X, Scale, TrendingUp, TrendingDown, Minus, PlusCircle, CalendarPlus, ChevronDown, Trash2 } from 'lucide-react';
import { CheckIn } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  checkIns: CheckIn[];
  onTriggerCheckIn?: () => void;
  onRetroactiveCheckIn?: (date: string, mood: string, weight: number) => void;
  onDeleteCheckIn?: (timestamp?: string, date?: string) => void;
}

const MOODS = [
  { emoji: '🔥', label: 'Beast' },
  { emoji: '⚡', label: 'Hyper' },
  { emoji: '🧘', label: 'Focus' },
  { emoji: '💀', label: 'Dead' },
  { emoji: '🤬', label: 'Angry' },
];

const WeightHistoryModal: React.FC<Props> = ({ isOpen, onClose, checkIns, onTriggerCheckIn, onRetroactiveCheckIn, onDeleteCheckIn }) => {
  const [isAddingPast, setIsAddingPast] = useState(false);
  
  // States for retroactive entry
  const [retroDate, setRetroDate] = useState('');
  const [retroWeight, setRetroWeight] = useState('');
  const [retroMood, setRetroMood] = useState<string | null>(null);

  // Robust Sort: Prioritize Date String comparison
  const sortedLogs = useMemo(() => {
    return [...checkIns].sort((a, b) => {
      const dateA = a.localDate || a.date;
      const dateB = b.localDate || b.date;
      if (dateA !== dateB) {
          return dateB.localeCompare(dateA); 
      }
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [checkIns]);

  // Chart Logic
  const chartPath = useMemo(() => {
    // Get last 7 entries chronologically (reverse the sorted list, take last 7)
    // Actually sortedLogs is Descending (Newest first). So take first 7 and reverse to get Oldest -> Newest
    const dataPoints = sortedLogs.slice(0, 7).reverse();
    
    if (dataPoints.length < 2) return null;

    const weights = dataPoints.map(d => d.bodyWeight);
    const minWeight = Math.min(...weights) - 0.5;
    const maxWeight = Math.max(...weights) + 0.5;
    const range = maxWeight - minWeight || 1;

    const width = 300;
    const height = 80;
    const padding = 5;

    // Calculate points
    const points = dataPoints.map((d, i) => {
        const x = (i / (dataPoints.length - 1)) * (width - (padding * 2)) + padding;
        // Invert Y because SVG 0 is top
        const normalizedWeight = (d.bodyWeight - minWeight) / range;
        const y = height - (normalizedWeight * (height - (padding * 2))) - padding;
        return { x, y, val: d.bodyWeight, date: d.localDate || d.date };
    });

    // Create Path Command
    const pathCmd = points.reduce((acc, p, i) => {
        return acc + (i === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`);
    }, "");

    // Create Fill Command (close the loop at bottom)
    const fillCmd = `${pathCmd} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`;

    return { pathCmd, fillCmd, points, width, height };
  }, [sortedLogs]);


  if (!isOpen) return null;

  const getTrend = (current: number, index: number) => {
    if (index === sortedLogs.length - 1) return <Minus size={14} className="text-slate-400 dark:text-slate-500" />;
    const prev = sortedLogs[index + 1].bodyWeight;
    if (current > prev) return <TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400" />;
    if (current < prev) return <TrendingDown size={14} className="text-red-500 dark:text-red-400" />;
    return <Minus size={14} className="text-slate-400 dark:text-slate-500" />;
  };

  const getTrendVal = (current: number, index: number) => {
     if (index === sortedLogs.length - 1) return '';
     const prev = sortedLogs[index + 1].bodyWeight;
     const diff = (current - prev).toFixed(1);
     return diff === "0.0" ? '' : (current > prev ? `+${diff}` : diff);
  };

  const formatLogDate = (log: CheckIn) => {
      const dateStr = log.localDate || log.date;
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [y, m, d] = dateStr.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      }
      if (log.timestamp) {
          return new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      }
      return log.date;
  };

  const formatLogTime = (log: CheckIn) => {
      if (log.timestamp) {
          return new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return ''; 
  };

  const handleRetroSubmit = () => {
      if (retroDate && retroWeight && retroMood && onRetroactiveCheckIn) {
          onRetroactiveCheckIn(retroDate, retroMood, parseFloat(retroWeight));
          setIsAddingPast(false);
          // Reset form
          setRetroDate('');
          setRetroWeight('');
          setRetroMood(null);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0f0728] border border-slate-200 dark:border-electric-cyan/30 rounded-3xl w-full max-w-md shadow-2xl dark:shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-scaleIn flex flex-col max-h-[85vh]">
        
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-t-3xl relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-indigo-100 dark:bg-electric-cyan/10 rounded-lg text-indigo-600 dark:text-electric-cyan">
                    <Scale size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mass Records</h3>
                    <p className="text-xs text-indigo-500 dark:text-electric-cyan font-mono">TRACKING PROGRESS</p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative z-10"
            >
                <X size={20} />
            </button>
        </div>

        {/* CHART SECTION */}
        {chartPath && (
            <div className="w-full h-[120px] bg-indigo-50/50 dark:bg-electric-cyan/5 border-b border-indigo-100 dark:border-white/5 relative flex items-center justify-center p-4">
                 <svg viewBox={`0 0 ${chartPath.width} ${chartPath.height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" className="text-indigo-500 dark:text-electric-cyan" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="currentColor" className="text-indigo-500 dark:text-electric-cyan" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Fill */}
                    <path d={chartPath.fillCmd} fill="url(#chartGradient)" />
                    {/* Line */}
                    <path 
                        d={chartPath.pathCmd} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        className="text-indigo-500 dark:text-electric-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Dots */}
                    {chartPath.points.map((p, i) => (
                        <circle 
                            key={i} 
                            cx={p.x} 
                            cy={p.y} 
                            r="3" 
                            className="fill-white dark:fill-[#0f0728] stroke-indigo-500 dark:stroke-electric-cyan stroke-2" 
                        />
                    ))}
                 </svg>
                 <div className="absolute top-2 left-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">7 Day Trend</div>
            </div>
        )}

        {/* Retroactive Entry Panel */}
        {isAddingPast ? (
            <div className="p-4 bg-indigo-50 dark:bg-electric-cyan/5 border-b border-indigo-100 dark:border-electric-cyan/10 animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarPlus size={16} className="text-indigo-500 dark:text-electric-cyan"/>
                        Add Past Record
                    </h4>
                    <button onClick={() => setIsAddingPast(false)} className="text-xs text-slate-500 hover:text-red-500">Cancel</button>
                </div>
                
                <div className="space-y-3">
                    <input 
                        type="date" 
                        value={retroDate}
                        onChange={(e) => setRetroDate(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm"
                    />
                    <div className="flex gap-3">
                         <input 
                            type="number" 
                            placeholder="Weight (KG)"
                            value={retroWeight}
                            onChange={(e) => setRetroWeight(e.target.value)}
                            className="flex-1 p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm"
                        />
                        <div className="flex gap-1">
                            {MOODS.map(m => (
                                <button 
                                    key={m.label} 
                                    onClick={() => setRetroMood(m.emoji)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg border transition-all ${retroMood === m.emoji ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10'}`}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button 
                        disabled={!retroDate || !retroWeight || !retroMood}
                        onClick={handleRetroSubmit}
                        className="w-full py-2 bg-indigo-600 dark:bg-electric-cyan text-white dark:text-black font-bold rounded-xl text-sm disabled:opacity-50"
                    >
                        Save Entry
                    </button>
                </div>
            </div>
        ) : (
             onRetroactiveCheckIn && (
                <div className="px-4 pt-2">
                    <button 
                        onClick={() => setIsAddingPast(true)}
                        className="w-full py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-electric-cyan flex items-center justify-center gap-1 transition-colors"
                    >
                        <CalendarPlus size={12} /> Add Missing / Past Entry <ChevronDown size={12} />
                    </button>
                </div>
             )
        )}

        <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar flex-1 bg-white dark:bg-transparent">
            {sortedLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p>No weight data recorded yet.</p>
                    <p className="text-xs mt-2">Check-in daily to build your chart.</p>
                </div>
            ) : (
                sortedLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-electric-cyan/30 transition-colors group">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-200">
                                {formatLogDate(log)}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono uppercase tracking-widest group-hover:text-indigo-500 dark:group-hover:text-electric-cyan transition-colors min-h-[1em]">
                                {formatLogTime(log)} {log.timestamp && log.timestamp.includes('12:00:00') ? '(Retro)' : ''}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                                 <span className="text-lg">{log.mood}</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
                            <div className="flex flex-col items-end min-w-[80px]">
                                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">
                                    {log.bodyWeight} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">KG</span>
                                </div>
                                <div className="text-xs font-mono font-bold flex items-center gap-1 opacity-60 dark:text-slate-300 text-slate-600 mt-1">
                                    {getTrend(log.bodyWeight, index)}
                                    <span>{getTrendVal(log.bodyWeight, index)}</span>
                                </div>
                            </div>
                            
                            {onDeleteCheckIn && (
                                <button 
                                    onClick={() => onDeleteCheckIn(log.timestamp, log.date)}
                                    className="p-2 ml-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Entry"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Manual Update Footer */}
        {onTriggerCheckIn && (
            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-b-3xl">
                <button 
                    onClick={onTriggerCheckIn}
                    className="w-full py-3 rounded-xl bg-indigo-600 dark:bg-electric-cyan/10 hover:bg-indigo-700 dark:hover:bg-electric-cyan/20 text-white dark:text-electric-cyan font-bold transition-all flex items-center justify-center gap-2 text-sm border border-transparent dark:border-electric-cyan/30"
                >
                    <PlusCircle size={16} /> Update Today's Stats
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default WeightHistoryModal;
