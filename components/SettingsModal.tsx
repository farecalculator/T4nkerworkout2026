
import React, { useRef } from 'react';
import { X, Trash2, AlertTriangle, Calendar, RefreshCw, Upload, Image as ImageIcon, Palette, Layout, Database } from 'lucide-react';
import { APP_THEMES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResetWeek: () => void;
  onResetWeights: () => void;
  onHardReset: () => void;
  onSetBackground: (url: string | undefined, opacity: number) => void;
  onSetTheme: (themeId: string) => void;
  onOpenPrograms: () => void; // New Prop
  onPopulateDemo?: () => void; // New prop for demo data
  activeTheme: string;
  currentWeek: number;
  currentBackground?: string;
  currentOpacity?: number;
  detectedTimezone?: string;
}

const SettingsModal: React.FC<Props> = ({ 
  isOpen, onClose, onResetWeek, onResetWeights, onHardReset, 
  onSetBackground, onSetTheme, onOpenPrograms, onPopulateDemo, activeTheme, currentWeek,
  currentBackground, currentOpacity = 0.3, detectedTimezone 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; // Limit size for localStorage
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          onSetBackground(compressedDataUrl, 0.5); // Default to mid opacity
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-md w-full shadow-comic animate-popIn relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-black hover:bg-gray-100 p-2 rounded-lg border-2 border-transparent hover:border-black transition-all">
          <X size={24} />
        </button>

        <h2 className="font-display text-4xl text-black mb-2">SETTINGS</h2>
        {detectedTimezone && <div className="inline-block bg-gray-100 border-2 border-black px-2 py-0.5 rounded text-[10px] font-black uppercase mb-6">📍 {detectedTimezone}</div>}

        <div className="space-y-6">
          
          {/* THEME SELECTOR */}
          <div className="p-4 rounded-xl border-4 border-black bg-gray-50">
            <h3 className="font-black text-lg text-black mb-3 flex items-center gap-2">
                <Palette size={20} /> VIBE / THEME
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(APP_THEMES).map(theme => (
                    <button 
                        key={theme.id}
                        onClick={() => onSetTheme(theme.id)}
                        className={`p-2 rounded-lg border-2 border-black font-bold text-xs uppercase transition-all ${activeTheme === theme.id ? 'bg-black text-white shadow-comic-sm' : 'bg-white text-gray-500 hover:bg-yellow-200 hover:text-black'}`}
                    >
                        {theme.name}
                    </button>
                ))}
            </div>
          </div>

          {/* PROGRAMS */}
          <div className="p-4 rounded-xl border-4 border-black bg-green-50">
            <h3 className="font-black text-lg text-black mb-3 flex items-center gap-2">
                <Layout size={20} /> WORKOUT PROGRAMS
            </h3>
            <p className="text-xs text-gray-500 mb-3 font-bold">Create or switch your active plan.</p>
            <button 
                onClick={onOpenPrograms}
                className="w-full py-3 bg-green-500 text-white font-black rounded-lg border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
            >
                MANAGE PROGRAMS
            </button>
          </div>

          {/* CUSTOM BACKGROUND */}
          <div className="p-4 rounded-xl border-4 border-black bg-gray-50">
            <h3 className="font-black text-lg text-black mb-3 flex items-center gap-2">
                <ImageIcon size={20} /> BACKGROUND
            </h3>
            
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-white hover:bg-gray-100 text-black font-bold rounded-lg border-2 border-black flex items-center justify-center gap-2"
                >
                    <Upload size={16} /> Upload Photo
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
                
                {currentBackground && (
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase">Image Intensity</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            value={currentOpacity}
                            onChange={(e) => onSetBackground(currentBackground, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer border-2 border-black accent-black"
                        />
                        <button 
                            onClick={() => onSetBackground(undefined, 0.3)}
                            className="w-full py-2 bg-red-100 text-red-600 font-bold rounded-lg border-2 border-black text-xs uppercase hover:bg-red-200"
                        >
                            Remove Custom Image
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border-4 border-black">
            <h3 className="font-black text-lg text-black mb-2 flex items-center gap-2"><Calendar size={20}/> PROGRESSION</h3>
            <p className="text-sm text-gray-500 mb-4 font-bold">Week {currentWeek} Complete?</p>
            <button onClick={onResetWeek} className="w-full py-3 bg-blue-500 text-white font-black rounded-lg border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1 active:shadow-none">START NEXT WEEK</button>
          </div>

          <div className="p-4 rounded-xl bg-yellow-50 border-4 border-black">
             <h3 className="font-black text-lg text-black mb-2 flex items-center gap-2"><Trash2 size={20}/> WEIGHTS</h3>
            <button onClick={onResetWeights} className="w-full py-3 bg-yellow-400 text-black font-black rounded-lg border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1 active:shadow-none">RESET WEIGHTS ONLY</button>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border-4 border-black">
            <h3 className="font-black text-lg text-red-600 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> DANGER ZONE</h3>
            <button onClick={onHardReset} className="w-full py-3 bg-red-600 text-white font-black rounded-lg border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1 active:shadow-none">FACTORY RESET</button>
            
            {onPopulateDemo && (
              <button 
                  onClick={onPopulateDemo} 
                  className="w-full mt-3 py-3 bg-purple-100 text-purple-600 font-black rounded-lg border-2 border-black hover:bg-purple-200 flex items-center justify-center gap-2"
              >
                  <Database size={16} /> POPULATE DEMO DATA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
