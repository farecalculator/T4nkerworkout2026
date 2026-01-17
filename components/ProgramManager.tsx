
import React, { useState } from 'react';
import { Program, WorkoutDay, Exercise } from '../types';
import { WORKOUT_PLAN } from '../constants';
import { X, Calendar, Plus, Edit3, Check, ArrowRight, Trash2, Layout, Clock, Eye, Dumbbell, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
  onSaveProgram: (program: Program) => void;
  onSetActive: (id: string) => void;
  onDeleteProgram: (id: string) => void;
  onInitializeDefault?: () => void;
}

const ProgramManager: React.FC<Props> = ({ isOpen, onClose, programs, onSaveProgram, onSetActive, onDeleteProgram, onInitializeDefault }) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Partial<Program>>({});
  const [editingDayId, setEditingDayId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Fallback to first program if active flag is missing to prevents UI lock
  const activeProgram = programs.find(p => p.isActive) || programs[0];
  const archivedPrograms = programs.filter(p => p.id !== activeProgram?.id);

  const handleStartCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    // Default start date is tomorrow if active program exists, else today
    let defaultStart = today;
    if (activeProgram) {
        const d = new Date(activeProgram.startDate);
        d.setDate(d.getDate() + (activeProgram.durationWeeks * 7));
        defaultStart = d.toISOString().split('T')[0];
    }

    setDraft({
      id: `prog_${Date.now()}`,
      name: '',
      startDate: defaultStart,
      durationWeeks: 12,
      schedule: JSON.parse(JSON.stringify(WORKOUT_PLAN)), // Clone default plan as base
      isActive: false,
      createdAt: new Date().toISOString()
    });
    setStep(1);
    setEditingDayId(null);
    setView('create');
  };

  const handleStartEdit = (program: Program) => {
    setDraft(JSON.parse(JSON.stringify(program)));
    setStep(1);
    setEditingDayId(null);
    setView('edit');
  };

  const updateDraftSchedule = (dayId: string, updates: Partial<WorkoutDay>) => {
    if (!draft.schedule) return;
    setDraft(prev => ({
      ...prev,
      schedule: prev.schedule?.map(d => d.id === dayId ? { ...d, ...updates } : d)
    }));
  };

  const handleSave = () => {
    if (draft.name && draft.schedule) {
      onSaveProgram(draft as Program);
      setView('list');
    }
  };

  // --- RENDER STEPS ---

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="font-black uppercase text-sm mb-2 block">Program Name</label>
        <input 
          type="text" 
          value={draft.name} 
          onChange={e => setDraft({...draft, name: e.target.value})}
          placeholder="e.g., Summer Shred 2025"
          className="w-full p-4 border-4 border-black rounded-xl font-display text-2xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="font-black uppercase text-sm mb-2 block">Start Date</label>
           <input 
             type="date" 
             value={draft.startDate}
             onChange={e => setDraft({...draft, startDate: e.target.value})}
             className="w-full p-3 border-4 border-black rounded-xl font-bold"
           />
        </div>
        <div>
           <label className="font-black uppercase text-sm mb-2 block">Duration</label>
           <div className="flex items-center gap-2">
             <input 
               type="number" 
               min="1" max="52"
               value={draft.durationWeeks}
               onChange={e => setDraft({...draft, durationWeeks: parseInt(e.target.value)})}
               className="w-full p-3 border-4 border-black rounded-xl font-bold"
             />
             <span className="font-black uppercase">Wks</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
      <p className="font-bold text-gray-500 text-sm mb-4">Customize your weekly schedule. Rename days or mark as Rest.</p>
      {draft.schedule?.map((day) => (
        <div key={day.id} className="p-4 border-2 border-black rounded-xl bg-gray-50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <span className="font-black uppercase bg-black text-white px-2 py-1 rounded text-xs">{day.day}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={day.title !== 'REST DAY'}
                        onChange={(e) => {
                            if (!e.target.checked) updateDraftSchedule(day.id, { title: 'REST DAY', focus: 'Recovery', color: 'gray' });
                            else updateDraftSchedule(day.id, { title: 'WORKOUT', focus: 'Muscle Group', color: 'blue' });
                        }}
                        className="w-5 h-5 accent-black"
                    />
                    <span className="font-bold text-xs uppercase">Active Day</span>
                </label>
            </div>
            
            {day.title !== 'REST DAY' && (
                <div className="grid grid-cols-1 gap-2">
                    <input 
                        type="text" 
                        value={day.title}
                        onChange={(e) => updateDraftSchedule(day.id, { title: e.target.value })}
                        className="p-2 border-2 border-black rounded-lg font-display text-xl uppercase"
                        placeholder="Workout Name"
                    />
                    <input 
                        type="text" 
                        value={day.focus}
                        onChange={(e) => updateDraftSchedule(day.id, { focus: e.target.value })}
                        className="p-2 border-2 border-gray-300 rounded-lg text-sm font-bold"
                        placeholder="Focus (e.g. Chest, Legs)"
                    />
                    <button 
                        onClick={() => setEditingDayId(day.id)}
                        className="mt-2 w-full py-2 bg-yellow-100 border-2 border-black rounded-lg text-xs font-black uppercase hover:bg-yellow-200 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Dumbbell size={14} /> Edit Exercises ({day.exercises.length})
                    </button>
                </div>
            )}
        </div>
      ))}
    </div>
  );

  const renderExerciseEditor = () => {
    const day = draft.schedule?.find(d => d.id === editingDayId);
    if (!day) return null;

    const handleUpdateEx = (exId: string, field: keyof Exercise, val: any) => {
        const updated = day.exercises.map(ex => ex.id === exId ? { ...ex, [field]: val } : ex);
        updateDraftSchedule(day.id, { exercises: updated });
    };

    const handleAddEx = () => {
        const newEx: Exercise = {
            id: `new_${Date.now()}`,
            name: '',
            sets: 3,
            reps: '10-12',
            category: 'push'
        };
        updateDraftSchedule(day.id, { exercises: [...day.exercises, newEx] });
    };

    const handleDeleteEx = (exId: string) => {
        updateDraftSchedule(day.id, { exercises: day.exercises.filter(ex => ex.id !== exId) });
    };

    return (
        <div className="flex flex-col h-full animate-slideUp">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-200">
                <button 
                    onClick={() => setEditingDayId(null)} 
                    className="p-2 bg-gray-100 border-2 border-black rounded-lg hover:bg-gray-200"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 className="font-display text-2xl uppercase leading-none">{day.day} Exercises</h3>
                    <p className="text-xs font-bold text-gray-500">Editing {day.exercises.length} movements</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {day.exercises.map((ex, i) => (
                    <div key={ex.id} className="p-4 bg-white border-4 border-black rounded-xl shadow-[4px_4px_0_0_#000] relative group">
                        <button 
                            onClick={() => handleDeleteEx(ex.id)}
                            className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                            <Trash2 size={14} />
                        </button>
                        
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-black text-white text-[10px] font-black px-1.5 py-0.5 rounded">#{i+1}</span>
                             <input 
                                type="text" 
                                value={ex.name}
                                onChange={e => handleUpdateEx(ex.id, 'name', e.target.value)}
                                placeholder="Exercise Name"
                                className="flex-1 font-display text-xl uppercase border-b-2 border-transparent focus:border-black outline-none bg-transparent"
                             />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-gray-50 p-2 rounded-lg border-2 border-black/10 flex items-center gap-2">
                                 <span className="text-[10px] font-black uppercase text-gray-400">Sets</span>
                                 <input 
                                    type="number" 
                                    value={ex.sets}
                                    onChange={e => handleUpdateEx(ex.id, 'sets', parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent font-bold text-center outline-none"
                                 />
                             </div>
                             <div className="bg-gray-50 p-2 rounded-lg border-2 border-black/10 flex items-center gap-2">
                                 <span className="text-[10px] font-black uppercase text-gray-400">Reps</span>
                                 <input 
                                    type="text" 
                                    value={ex.reps}
                                    onChange={e => handleUpdateEx(ex.id, 'reps', e.target.value)}
                                    className="w-full bg-transparent font-bold text-center outline-none"
                                 />
                             </div>
                        </div>
                    </div>
                ))}

                <button 
                    onClick={handleAddEx}
                    className="w-full py-4 border-4 border-black border-dashed rounded-xl text-gray-400 font-black uppercase hover:bg-yellow-50 hover:text-black hover:border-solid transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Add Exercise
                </button>
            </div>
            
             <button 
                onClick={() => setEditingDayId(null)}
                className="mt-4 w-full py-3 bg-black text-white font-black uppercase rounded-xl border-2 border-black shadow-comic active:translate-y-1 active:shadow-none"
            >
                Done Editing Day
            </button>
        </div>
    );
  };

  const renderStep3 = () => {
    const end = new Date(draft.startDate!);
    end.setDate(end.getDate() + (draft.durationWeeks! * 7));

    return (
        <div className="space-y-6 text-center">
             <div className="p-6 border-4 border-black rounded-2xl bg-yellow-50 shadow-comic-sm">
                <h3 className="font-display text-3xl mb-1">{draft.name}</h3>
                <p className="font-bold text-gray-500 uppercase text-sm mb-4">{draft.durationWeeks} Weeks • Starts {draft.startDate}</p>
                <div className="inline-block bg-black text-white px-3 py-1 rounded-full text-xs font-black uppercase">
                    Ends: {end.toLocaleDateString()}
                </div>
             </div>

             <div className="text-left">
                <h4 className="font-black uppercase text-sm mb-2">Weekly Snapshot:</h4>
                <div className="flex flex-wrap gap-1">
                    {draft.schedule?.map(d => (
                        <div key={d.id} className={`w-8 h-8 rounded border border-black flex items-center justify-center text-[10px] font-black ${d.title === 'REST DAY' ? 'bg-gray-200 text-gray-400' : 'bg-blue-400 text-white'}`}>
                            {d.day.substring(0,1)}
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-black rounded-3xl w-full max-w-lg shadow-comic animate-popIn flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-yellow-400 rounded-t-2xl">
           <h2 className="font-display text-3xl uppercase tracking-wider flex items-center gap-2">
             <Layout size={28}/> {view === 'list' ? 'Program Manager' : editingDayId ? 'Exercise Editor' : view === 'create' ? 'New Program' : 'Edit Program'}
           </h2>
           <button onClick={onClose} className="p-2 bg-white border-2 border-black rounded-lg hover:bg-red-100 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            
            {view === 'list' ? (
                <div className="space-y-8">
                    {/* Active Program */}
                    <div>
                        <h3 className="font-black uppercase text-sm text-gray-400 mb-3 tracking-widest">Active Program</h3>
                        {activeProgram ? (
                            <div className="border-4 border-black p-4 rounded-xl bg-green-50 shadow-comic-sm relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-display text-3xl mb-1">{activeProgram.name}</h4>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-black text-white rounded text-[10px] font-black uppercase">Start: {activeProgram.startDate}</span>
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-black uppercase">{activeProgram.durationWeeks} Weeks</span>
                                        </div>
                                    </div>
                                    <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-black uppercase border-2 border-black">Active</span>
                                </div>
                                
                                <div className="bg-white/50 p-2 rounded-lg border-2 border-black/10 mb-4 grid grid-cols-2 gap-1">
                                    {activeProgram.schedule.filter(d => d.title !== 'REST DAY').map(d => (
                                        <div key={d.id} className="text-[10px] font-bold text-gray-600 truncate">
                                            <span className="font-black text-black mr-1">{d.day.substring(0,3)}:</span> {d.title}
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => handleStartEdit(activeProgram)} className="w-full py-3 bg-white border-2 border-black rounded-xl font-bold text-sm uppercase hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none">
                                    <Edit3 size={16} /> Edit Plan Details
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 border-4 border-black border-dashed rounded-xl text-center font-bold bg-gray-50 flex flex-col items-center gap-3">
                                <p className="text-gray-400">No active program found.</p>
                                {onInitializeDefault && (
                                    <button 
                                        onClick={onInitializeDefault}
                                        className="px-4 py-2 bg-yellow-400 text-black border-2 border-black rounded-lg font-black uppercase shadow-comic-sm hover:translate-y-1 hover:shadow-none active:translate-y-[2px] transition-all flex items-center gap-2"
                                    >
                                        <RefreshCw size={16}/> Initialize Default Program
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Archive */}
                    <div>
                        <h3 className="font-black uppercase text-sm text-gray-400 mb-3 tracking-widest">Archive / Drafts</h3>
                        <div className="space-y-3">
                            {archivedPrograms.length === 0 && <p className="text-sm text-gray-400 italic">No past programs.</p>}
                            {archivedPrograms.map(p => (
                                <div key={p.id} className="p-4 border-2 border-black rounded-xl flex justify-between items-center hover:bg-gray-50 transition-colors bg-white">
                                    <div>
                                        <div className="font-bold text-lg leading-none mb-1">{p.name}</div>
                                        <div className="text-[10px] uppercase font-black text-gray-400">{p.durationWeeks} Weeks • {p.schedule.filter(d => d.title !== 'REST DAY').length} Workouts/Wk</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onSetActive(p.id)} className="p-2 bg-blue-100 border-2 border-black rounded-lg hover:bg-blue-200 transition-colors" title="Make Active"><Check size={16}/></button>
                                        <button onClick={() => onDeleteProgram(p.id)} className="p-2 bg-red-100 border-2 border-black rounded-lg hover:bg-red-200 transition-colors" title="Delete"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : editingDayId ? (
                renderExerciseEditor()
            ) : (
                /* WIZARD VIEW */
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            {[1,2,3].map(s => (
                                <div key={s} className={`w-10 h-3 rounded-full border-2 border-black ${step >= s ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                        <span className="font-black uppercase text-xs text-gray-400">Step {step} of 3</span>
                    </div>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>
            )}
        </div>

        {/* FOOTER ACTIONS */}
        {/* Hide main footer when in Exercise Editor */}
        {!editingDayId && (
            <div className="p-6 border-t-4 border-black bg-gray-50 rounded-b-2xl">
                {view === 'list' ? (
                    <button 
                        onClick={handleStartCreate}
                        className="w-full py-4 bg-black text-white font-display text-xl rounded-xl border-2 border-black shadow-comic active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={24} /> Create New Program
                    </button>
                ) : (
                    <div className="flex gap-3">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 bg-white text-black font-bold border-2 border-black rounded-xl hover:bg-gray-100">Back</button>
                        ) : (
                            <button onClick={() => setView('list')} className="flex-1 py-3 bg-white text-black font-bold border-2 border-black rounded-xl hover:bg-gray-100">Cancel</button>
                        )}
                        
                        {step < 3 ? (
                            <button disabled={!draft.name} onClick={() => setStep(step + 1)} className="flex-[2] py-3 bg-yellow-400 text-black font-black uppercase border-2 border-black rounded-xl shadow-comic active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none">Next <ArrowRight size={16} className="inline ml-1"/></button>
                        ) : (
                            <button onClick={handleSave} className="flex-[2] py-3 bg-green-500 text-white font-black uppercase border-2 border-black rounded-xl shadow-comic active:translate-y-1 active:shadow-none">Save & Activate</button>
                        )}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default ProgramManager;
