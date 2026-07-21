import React from 'react';

interface GameHistoryProps {
  history: number[];
}

export function GameHistory({ history }: GameHistoryProps) {
  const getBadgeColor = (mult: number) => {
    if (mult < 2) return 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20';
    if (mult < 10) return 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20';
    if (mult < 50) return 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/20';
    return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
  };

  return (
    <div className="flex items-center gap-2 overflow-x-hidden p-2">
      <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {history.map((mult, i) => (
          <div
            key={`${i}-${mult}`}
            className={`px-3 py-1.5 rounded-full text-sm font-bold border whitespace-nowrap transition-all flex-shrink-0 ${getBadgeColor(mult)} ${i === 0 ? 'badge-new shadow-sm' : ''}`}
          >
            {mult.toFixed(2)}x
          </div>
        ))}
      </div>
    </div>
  );
}