import React, { useState } from 'react';
import { Bot } from '../hooks/useBotSimulation';

interface MyBet {
  id: string;
  round: number;
  betAmount: number;
  status: 'win' | 'lose';
  cashoutMult?: number;
  profit: number;
}

interface LiveBetsProps {
  bots: Bot[];
  myBetsHistory: MyBet[];
}

export function LiveBets({ bots, myBetsHistory }: LiveBetsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');

  const totalBetsAmt = bots.reduce((sum, b) => sum + b.betAmount, 0);
  const totalBotsPlaying = bots.filter(b => b.status === 'PLAYING').length;

  const topWins = [...bots].filter(b => b.status === 'CASHED_OUT').sort((a, b) => (b.winAmount || 0) - (a.winAmount || 0)).slice(0, 10);

  return (
    <div className="flex flex-col h-full bg-[#111729] border-l border-white/5 overflow-hidden font-sans">
      <div className="flex bg-[#1a2138] p-2 gap-2 shrink-0">
        <button onClick={() => setActiveTab('all')} className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'all' ? 'bg-[#2a3454] text-white' : 'text-white/50 hover:text-white/80'}`}>All Bets</button>
        <button onClick={() => setActiveTab('my')} className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'my' ? 'bg-[#2a3454] text-white' : 'text-white/50 hover:text-white/80'}`}>My Bets</button>
        <button onClick={() => setActiveTab('top')} className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'top' ? 'bg-[#2a3454] text-white' : 'text-white/50 hover:text-white/80'}`}>Top</button>
      </div>

      {activeTab === 'all' && (
        <div className="p-3 border-b border-white/5 shrink-0 flex justify-between items-center text-sm">
          <div>
            <div className="text-white font-bold mb-0.5">ALL BETS</div>
            <div className="text-[#22c55e] font-bold text-xs">{totalBotsPlaying} playing</div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold mb-0.5">${totalBetsAmt.toFixed(2)}</div>
            <div className="text-white/50 text-xs">Total Wagered</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] text-white/40 uppercase tracking-wider font-bold shrink-0 bg-[#0f1423]/50">
        <div className="col-span-5">{activeTab === 'my' ? 'Round/Mult' : 'User'}</div>
        <div className="col-span-3 text-right">Bet</div>
        <div className="col-span-4 text-right">{activeTab === 'my' ? 'Profit' : 'Win'}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
        {activeTab === 'all' && bots.map(bot => (
          <div key={bot.id} className={`grid grid-cols-12 gap-2 px-2 py-1.5 text-sm rounded-md items-center ${bot.status === 'CASHED_OUT' ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' : bot.status === 'CRASHED' ? 'opacity-40' : 'bg-white/5 border border-transparent'}`}>
            <div className="col-span-5 truncate text-white/80 font-medium">
              {bot.username}
            </div>
            <div className="col-span-3 text-right text-white/70 font-mono text-xs">
              {bot.betAmount.toFixed(2)}
            </div>
            <div className="col-span-4 text-right font-mono font-bold text-xs">
              {bot.status === 'CASHED_OUT' ? (
                <div className="text-[#22c55e]">
                  <div className="text-[10px] leading-tight">{bot.cashOutMultiplier?.toFixed(2)}x</div>
                  <div className="leading-tight">${bot.winAmount?.toFixed(2)}</div>
                </div>
              ) : bot.status === 'CRASHED' ? (
                <span className="text-white/30">—</span>
              ) : (
                <span className="text-white/30">...</span>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'top' && topWins.map(bot => (
          <div key={bot.id} className="grid grid-cols-12 gap-2 px-2 py-1.5 text-sm rounded-md items-center bg-[#22c55e]/10 border border-[#22c55e]/20">
            <div className="col-span-5 truncate text-white/80 font-medium">
              {bot.username}
            </div>
            <div className="col-span-3 text-right text-white/70 font-mono text-xs">
              {bot.betAmount.toFixed(2)}
            </div>
            <div className="col-span-4 text-right font-mono font-bold text-xs text-[#22c55e]">
              <div className="text-[10px] leading-tight">{bot.cashOutMultiplier?.toFixed(2)}x</div>
              <div className="leading-tight">${bot.winAmount?.toFixed(2)}</div>
            </div>
          </div>
        ))}

        {activeTab === 'my' && myBetsHistory.map(bet => (
          <div key={bet.id} className={`grid grid-cols-12 gap-2 px-2 py-2 text-sm rounded-md items-center ${bet.status === 'win' ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className="col-span-5 flex flex-col text-xs font-mono">
              <span className="text-white/50">Round {bet.round}</span>
              {bet.status === 'win' ? (
                <span className="text-[#22c55e] font-bold">{bet.cashoutMult?.toFixed(2)}x</span>
              ) : (
                <span className="text-red-500 font-bold">Crashed</span>
              )}
            </div>
            <div className="col-span-3 text-right text-white/70 font-mono text-xs">
              {bet.betAmount.toFixed(2)}
            </div>
            <div className={`col-span-4 text-right font-mono font-bold text-xs ${bet.status === 'win' ? 'text-[#22c55e]' : 'text-red-500'}`}>
              {bet.status === 'win' ? '+' : ''}{bet.profit.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}