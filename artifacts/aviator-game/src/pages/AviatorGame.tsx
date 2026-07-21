import React, { useState, useEffect, useRef } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useBotSimulation } from '../hooks/useBotSimulation';
import { useGameSounds } from '../hooks/useGameSounds';
import { FlightCanvas } from '../components/FlightCanvas';
import { BettingPanel } from '../components/BettingPanel';
import { GameHistory } from '../components/GameHistory';
import { LiveBets } from '../components/LiveBets';

interface MyBet {
  id: string;
  round: number;
  betAmount: number;
  status: 'win' | 'lose';
  cashoutMult?: number;
  profit: number;
}

export default function AviatorGame() {
  const { status, multiplier, crashPoint, countdown, history, elapsedMs } = useGameLoop();
  const bots = useBotSimulation(status, multiplier, countdown);
  const sounds = useGameSounds();
  
  const [balance, setBalance] = useState(3000.00);
  const roundCountRef = useRef(1);

  const [slot1Bet, setSlot1Bet] = useState<number | null>(null);
  const [slot1Auto, setSlot1Auto] = useState<number | undefined>();
  
  const [slot2Bet, setSlot2Bet] = useState<number | null>(null);
  const [slot2Auto, setSlot2Auto] = useState<number | undefined>();

  const [myBetsHistory, setMyBetsHistory] = useState<MyBet[]>([]);
  const [chatMessages, setChatMessages] = useState<{id: number, user: string, text: string}[]>([]);

  useEffect(() => {
    if (status === 'FLYING') {
      sounds.playTakeoff();
      setTimeout(sounds.playFlying, 800);
      roundCountRef.current += 1;
    } else if (status === 'CRASHED') {
      sounds.stopFlying();
      sounds.playCrash();
    }
  }, [status, sounds]);

  useEffect(() => {
    const msgs = [
      {u: "Degen101", t: "GG!"}, {u: "ApeSniper", t: "Too early?"}, 
      {u: "Whale", t: "Hold until 100x"}, {u: "CryptoKing", t: "Nice cashout"},
      {u: "MoonBoy", t: "LFG"}, {u: "LaserEyes", t: "Crashed again..."}
    ];
    let msgId = 0;
    const interval = setInterval(() => {
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setChatMessages(prev => [...prev.slice(-3), { id: ++msgId, user: msg.u, text: msg.t }]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaceBet = (slot: 1|2, amount: number, auto?: number) => {
    setBalance(b => b - amount);
    if (slot === 1) { setSlot1Bet(amount); setSlot1Auto(auto); }
    else { setSlot2Bet(amount); setSlot2Auto(auto); }
  };

  const processCashout = (slot: 1|2, amount: number, mult: number) => {
    const win = amount * mult;
    setBalance(b => b + win);
    sounds.playCashout();
    
    setMyBetsHistory(prev => [{
      id: `bet-${Date.now()}-${slot}`,
      round: roundCountRef.current,
      betAmount: amount,
      status: 'win',
      cashoutMult: mult,
      profit: win - amount
    }, ...prev]);

    if (slot === 1) { setSlot1Bet(null); setSlot1Auto(undefined); }
    else { setSlot2Bet(null); setSlot2Auto(undefined); }
  };

  const handleCashOut = (slot: 1|2) => {
    const amount = slot === 1 ? slot1Bet : slot2Bet;
    if (amount !== null && status === 'FLYING') {
      processCashout(slot, amount, multiplier);
    }
  };

  useEffect(() => {
    if (status === 'FLYING') {
      if (slot1Bet !== null && slot1Auto && multiplier >= slot1Auto) {
        processCashout(1, slot1Bet, slot1Auto);
      }
      if (slot2Bet !== null && slot2Auto && multiplier >= slot2Auto) {
        processCashout(2, slot2Bet, slot2Auto);
      }
    }
  }, [multiplier, status, slot1Bet, slot1Auto, slot2Bet, slot2Auto]);

  useEffect(() => {
    if (status === 'CRASHED') {
      if (slot1Bet !== null) {
        setMyBetsHistory(prev => [{
          id: `bet-${Date.now()}-1`, round: roundCountRef.current,
          betAmount: slot1Bet, status: 'lose', profit: -slot1Bet
        }, ...prev]);
        setSlot1Bet(null); setSlot1Auto(undefined);
      }
      if (slot2Bet !== null) {
        setMyBetsHistory(prev => [{
          id: `bet-${Date.now()}-2`, round: roundCountRef.current,
          betAmount: slot2Bet, status: 'lose', profit: -slot2Bet
        }, ...prev]);
        setSlot2Bet(null); setSlot2Auto(undefined);
      }
    }
  }, [status]);

  return (
    <div className="h-[100dvh] w-full bg-[#0a0e27] text-white flex flex-col font-sans overflow-hidden select-none">
      <div className="h-16 bg-[#1a2138] border-b border-white/5 flex items-center justify-between px-4 shrink-0 shadow-md z-20">
        <div className="font-black text-2xl tracking-tighter italic text-[#ff3b5c] drop-shadow-[0_0_10px_rgba(255,59,92,0.5)] mr-4">
          AVIATOR
        </div>
        <div className="flex-1 max-w-3xl overflow-hidden rounded-full bg-[#0f1423]/50 p-1 border border-white/5 hidden md:block">
          <GameHistory history={history} />
        </div>
        <div className="ml-4 flex items-center gap-4">
           <div className="flex flex-col items-end">
             <div className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest">Balance</div>
             <div className="font-black text-xl text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
               ${balance.toFixed(2)}
             </div>
           </div>
        </div>
      </div>
      <div className="h-12 bg-[#0f1423] border-b border-white/5 md:hidden">
         <GameHistory history={history} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative z-0 min-h-0 bg-[#060914]">
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="flex-1 relative overflow-hidden bg-[#060914] rounded-b-xl lg:rounded-br-3xl shadow-inner m-2 border border-white/5">
            <FlightCanvas status={status} multiplier={multiplier} countdown={countdown} elapsedMs={elapsedMs} crashPoint={crashPoint} />
            
            <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none">
              {chatMessages.map((m) => (
                <div key={m.id} className="text-xs bg-black/40 backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-left-4 duration-500">
                  <span className="text-white/60 font-bold mr-2">{m.user}:</span>
                  <span className="text-white/90">{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 shrink-0 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <BettingPanel 
              slotId={1} status={status} currentMultiplier={multiplier} balance={balance} activeBet={slot1Bet}
              onPlaceBet={(amt, auto) => handlePlaceBet(1, amt, auto)}
              onCashOut={() => handleCashOut(1)}
              onCancelBet={() => {}}
            />
            <BettingPanel 
              slotId={2} status={status} currentMultiplier={multiplier} balance={balance} activeBet={slot2Bet}
              onPlaceBet={(amt, auto) => handlePlaceBet(2, amt, auto)}
              onCashOut={() => handleCashOut(2)}
              onCancelBet={() => {}}
            />
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0 z-10 border-t lg:border-t-0 lg:border-l border-white/5 h-[400px] lg:h-auto">
          <LiveBets bots={bots} myBetsHistory={myBetsHistory} />
        </div>
      </div>
    </div>
  );
}