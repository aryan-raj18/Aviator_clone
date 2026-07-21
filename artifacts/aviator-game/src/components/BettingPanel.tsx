import React, { useState, useEffect } from 'react';
import { GameStatus } from '../hooks/useGameLoop';

interface BettingPanelProps {
  slotId: 1 | 2;
  status: GameStatus;
  currentMultiplier: number;
  balance: number;
  activeBet: number | null;
  onPlaceBet: (amount: number, autoCashout?: number) => void;
  onCashOut: () => void;
  onCancelBet: () => void;
}

export function BettingPanel({ slotId, status, currentMultiplier, balance, activeBet, onPlaceBet, onCashOut, onCancelBet }: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState<string>('10.00');
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashout, setAutoCashout] = useState<string>('2.00');
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [queuedForNext, setQueuedForNext] = useState(false);

  useEffect(() => {
    if (status === 'WAITING' && autoBetEnabled && activeBet === null && !queuedForNext) {
      const amt = parseFloat(betAmount);
      if (!isNaN(amt) && amt >= 1 && amt <= balance) {
        const auto = autoCashoutEnabled && parseFloat(autoCashout) > 1 ? parseFloat(autoCashout) : undefined;
        onPlaceBet(amt, auto);
      } else {
        setAutoBetEnabled(false);
      }
    }
  }, [status, autoBetEnabled, activeBet, queuedForNext, betAmount, balance, autoCashoutEnabled, autoCashout, onPlaceBet]);

  useEffect(() => {
    if (status === 'WAITING' && queuedForNext && activeBet === null) {
      setQueuedForNext(false);
      const amt = parseFloat(betAmount);
      if (!isNaN(amt) && amt >= 1 && amt <= balance) {
        const auto = autoCashoutEnabled && parseFloat(autoCashout) > 1 ? parseFloat(autoCashout) : undefined;
        onPlaceBet(amt, auto);
      }
    }
  }, [status, queuedForNext, activeBet, betAmount, balance, autoCashoutEnabled, autoCashout, onPlaceBet]);

  const handleAction = () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 1 || amt > balance) return;

    if (activeBet !== null) {
      if (status === 'FLYING') {
        onCashOut();
      }
      return;
    }

    if (queuedForNext) {
      setQueuedForNext(false);
      onCancelBet();
      return;
    }

    const auto = autoCashoutEnabled && parseFloat(autoCashout) > 1 ? parseFloat(autoCashout) : undefined;

    if (status === 'WAITING') {
      onPlaceBet(amt, auto);
    } else {
      setQueuedForNext(true);
    }
  };

  const isActionDisabled = activeBet === null && !queuedForNext && (parseFloat(betAmount) > balance || parseFloat(betAmount) < 1) || autoBetEnabled;

  return (
    <div className="bg-[#1a2138] rounded-xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/5 flex flex-col w-full max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-[#0f1423] rounded-lg border border-white/10 p-2 relative flex items-center">
          <button 
            disabled={activeBet !== null || queuedForNext || autoBetEnabled} 
            onClick={() => { const v = parseFloat(betAmount) - 1; setBetAmount(Math.max(1, v).toFixed(2)); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 font-bold disabled:opacity-50"
          >-</button>
          <div className="flex-1 flex items-center justify-center">
             <span className="text-white/50 font-bold mr-1">$</span>
             <input
               type="number"
               value={betAmount}
               onChange={(e) => setBetAmount(e.target.value)}
               disabled={activeBet !== null || queuedForNext || autoBetEnabled}
               className="w-20 bg-transparent text-white font-bold text-lg text-center outline-none"
             />
          </div>
          <button 
            disabled={activeBet !== null || queuedForNext || autoBetEnabled} 
            onClick={() => { const v = parseFloat(betAmount) + 1; setBetAmount(Math.min(1000, v).toFixed(2)); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 font-bold disabled:opacity-50"
          >+</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {[1, 5, 10, 25].map(chip => (
          <button 
            key={chip}
            disabled={activeBet !== null || queuedForNext || autoBetEnabled}
            onClick={() => setBetAmount(chip.toFixed(2))}
            className="bg-[#242c46] hover:bg-[#2d3654] text-white/80 font-bold py-1.5 rounded-md text-sm border border-white/5 disabled:opacity-50"
          >
            ${chip}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <label className="flex items-center gap-2 cursor-pointer bg-[#0f1423] py-1.5 px-3 rounded-lg border border-white/5 flex-1 justify-center">
          <input 
            type="checkbox" 
            checked={autoBetEnabled}
            onChange={e => setAutoBetEnabled(e.target.checked)}
            className="accent-green-500 w-4 h-4 rounded"
          />
          <span className="text-white/70 font-bold">Auto Bet</span>
        </label>
        <div className="flex items-center gap-2 bg-[#0f1423] py-1.5 px-3 rounded-lg border border-white/5 flex-1">
          <input 
            type="checkbox" 
            checked={autoCashoutEnabled}
            onChange={e => setAutoCashoutEnabled(e.target.checked)}
            disabled={activeBet !== null || queuedForNext}
            className="accent-green-500 w-4 h-4 rounded"
          />
          <span className="text-white/70 font-bold whitespace-nowrap">Auto C.O.</span>
          {autoCashoutEnabled && (
            <input 
              type="number" 
              value={autoCashout}
              onChange={e => setAutoCashout(e.target.value)}
              disabled={activeBet !== null || queuedForNext}
              className="w-12 bg-transparent text-white font-bold text-center outline-none border-b border-white/20"
              step="0.1" min="1.01"
            />
          )}
        </div>
      </div>

      <button
        onClick={handleAction}
        disabled={isActionDisabled && !autoBetEnabled}
        className={`w-full h-16 rounded-xl font-black text-xl uppercase shadow-lg transition-all flex flex-col items-center justify-center leading-tight
          ${activeBet !== null && status === 'FLYING' 
            ? 'bg-[#f97316] hover:bg-[#ea580c] text-white pulse-cashout shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
            : activeBet !== null && status === 'WAITING'
            ? 'bg-[#22c55e]/20 text-green-500/50 border border-green-500/20 cursor-not-allowed'
            : queuedForNext
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : autoBetEnabled && status !== 'WAITING'
            ? 'bg-[#22c55e]/20 text-green-500/50 border border-green-500/20 cursor-not-allowed'
            : 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:bg-[#22c55e]/50'
          }
        `}
      >
        {activeBet !== null && status === 'FLYING' ? (
          <>
            <span>Cash Out</span>
            <span className="text-2xl">${(activeBet * currentMultiplier).toFixed(2)}</span>
          </>
        ) : activeBet !== null && status === 'WAITING' ? (
          <>
            <span>Waiting</span>
            <span className="text-sm font-bold">Bet Placed</span>
          </>
        ) : queuedForNext ? (
          <>
            <span>Cancel</span>
            <span className="text-sm font-bold">Waiting for round</span>
          </>
        ) : (
          <span>{autoBetEnabled ? 'Auto Bet Active' : status === 'FLYING' || status === 'CRASHED' ? 'Bet Next Round' : 'Bet'}</span>
        )}
      </button>
    </div>
  );
}