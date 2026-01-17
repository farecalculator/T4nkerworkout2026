
import React, { useRef, useEffect } from 'react';

interface Props {
  currentWeek: number;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
}

const WeekSelector: React.FC<Props> = ({ currentWeek, selectedWeek, onSelectWeek }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate a range of weeks (e.g., 1 to Current + 2)
  const weeks = Array.from({ length: Math.max(currentWeek + 2, 4) }, (_, i) => i + 1);

  useEffect(() => {
    // Auto-scroll to selected week
    if (scrollRef.current) {
      const selectedBtn = scrollRef.current.children[selectedWeek - 1] as HTMLElement;
      if (selectedBtn) {
        scrollRef.current.scrollTo({
          left: selectedBtn.offsetLeft - scrollRef.current.clientWidth / 2 + selectedBtn.clientWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedWeek]);

  return (
    <div className="relative max-w-4xl mx-auto mb-6">
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 py-4 px-2 no-scrollbar snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {weeks.map((week) => {
          const isCurrent = week === currentWeek;
          const isSelected = week === selectedWeek;
          const isFuture = week > currentWeek;

          return (
            <button
              key={week}
              onClick={() => onSelectWeek(week)}
              disabled={isFuture && week !== currentWeek + 1}
              className={`
                flex-shrink-0 px-5 py-2 rounded-xl border-4 border-black font-display text-xl uppercase tracking-wider transition-all snap-center
                ${isSelected 
                  ? 'bg-yellow-400 text-black shadow-[4px_4px_0_0_#000] scale-110 z-10' 
                  : isFuture 
                    ? 'bg-gray-200 text-gray-400 border-gray-400 opacity-70 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                }
              `}
            >
              Week {week}
              {isCurrent && !isSelected && <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block" />}
            </button>
          );
        })}
      </div>
      
      {/* Fade Gradients for visual cue */}
      <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-[var(--theme-bg)] to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[var(--theme-bg)] to-transparent pointer-events-none"></div>
    </div>
  );
};

export default WeekSelector;
