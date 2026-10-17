import React, { useState } from 'react';
import { Pause, Play, ChevronRight, TrendingUp } from 'lucide-react';

export default function LiveTicker({ items, onNavigate }) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="bg-[#e9eff6] border-b border-[#cbd7e6] text-[#1c334c] text-xs py-2 px-4 select-none">
      <div className="wrap flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#2b5caf] text-white font-extrabold uppercase text-[10px] tracking-wider">
            <TrendingUp className="w-3 h-3" />
            <span>Market Intelligence</span>
          </span>
        </div>

        {/* Scrolling or interactive item track */}
        <div className="overflow-hidden whitespace-nowrap flex-1 relative h-7 flex items-center">
          <div
            className={`inline-flex items-center space-x-8 transition-all ${
              isPaused ? '' : 'animate-ticker hover:pause-animation'
            }`}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            {items.concat(items).map((item, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(item.link)}
                className="inline-flex items-center space-x-2 text-left hover:text-[#2b5caf] transition font-medium cursor-pointer shrink-0 border-0 bg-transparent p-0 m-0"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
              >
                <span className="font-bold text-[#2b5caf] text-[11px] uppercase tracking-wide">
                  [{item.type}]
                </span>
                <span className="text-[#1c334c] hover:underline">{item.title}</span>
                <ChevronRight className="w-3 h-3 text-[#2b5caf] inline" />
              </button>
            ))}
          </div>
        </div>

        {/* Pause/Play Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-1 rounded text-[#3f5d81] hover:text-[#18365f] transition shrink-0"
          title={isPaused ? "Jalankan Ticker" : "Jeda Ticker"}
          aria-label={isPaused ? "Play ticker" : "Pause ticker"}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

