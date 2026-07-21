import { useState, useEffect, useRef } from 'react';
import { GameStatus } from './useGameLoop';

export interface Bot {
  id: string;
  username: string;
  betAmount: number;
  status: 'PLAYING' | 'CASHED_OUT' | 'CRASHED';
  cashOutMultiplier?: number;
  targetMultiplier: number;
  winAmount?: number;
}

const FIRST_NAMES = ["Cry", "Moo", "Dia", "Las", "HOD", "Deg", "Wha", "Ape", "Cha", "Pep", "Pl", "A", "K", "us"];
const LAST_NAMES = ["ing", "per", "boy", "nds", "god", "unk", "oge", "der", "ord", "ter", "***er", "***a", "***g", "er_"];

function generateUsername() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const nums = Math.floor(Math.random() * 9999);
  return Math.random() > 0.5 ? `${first}${last}` : `${first}${last}${nums}`;
}

const getBetAmount = () => {
  const r = Math.random();
  if (r < 0.6) return Math.floor(Math.random() * 195) + 5;
  if (r < 0.9) return Math.floor(Math.random() * 300) + 200;
  return Math.floor(Math.random() * 1500) + 500;
};

const getTargetMultiplier = () => {
  const r = Math.random();
  if (r < 0.4) return 1.2 + Math.random() * 0.8;
  if (r < 0.7) return 2.0 + Math.random() * 3.0;
  if (r < 0.9) return 5.0 + Math.random() * 15.0;
  return 20.0 + Math.random() * 80.0;
};

export function useBotSimulation(status: GameStatus, currentMultiplier: number, countdown: number) {
  const [bots, setBots] = useState<Bot[]>([]);
  const lastCountdownRef = useRef(countdown);

  useEffect(() => {
    if (status === 'WAITING' && bots.length === 0) {
      const botCount = Math.floor(Math.random() * 31) + 20;
      const newBots: Bot[] = [];
      for (let i = 0; i < botCount; i++) {
        newBots.push({
          id: `bot-${i}-${Date.now()}`,
          username: generateUsername(),
          betAmount: getBetAmount(),
          status: 'PLAYING',
          targetMultiplier: getTargetMultiplier()
        });
      }
      setBots(newBots);
    }
  }, [status, bots.length]);

  useEffect(() => {
    if (status === 'WAITING') {
      const prev = lastCountdownRef.current;
      const curr = countdown;
      if (Math.floor(prev) > Math.floor(curr) && curr > 0) {
        if (Math.random() > 0.3) {
          const newBot: Bot = {
            id: `bot-late-${Date.now()}-${Math.random()}`,
            username: generateUsername(),
            betAmount: getBetAmount(),
            status: 'PLAYING',
            targetMultiplier: getTargetMultiplier()
          };
          setBots(b => [...b, newBot]);
        }
      }
      lastCountdownRef.current = curr;
    }
  }, [countdown, status]);

  useEffect(() => {
    if (status === 'WAITING' && countdown > 4.9 && bots.length > 0 && bots.some(b => b.status === 'CRASHED')) {
      setBots([]);
    }
  }, [status, countdown, bots]);

  useEffect(() => {
    if (status === 'FLYING') {
      setBots((currentBots) => {
        let changed = false;
        const updated = currentBots.map(bot => {
          const fuzz = Math.random() * 0.1;
          if (bot.status === 'PLAYING' && currentMultiplier >= bot.targetMultiplier + fuzz) {
            changed = true;
            return {
              ...bot,
              status: 'CASHED_OUT' as const,
              cashOutMultiplier: bot.targetMultiplier,
              winAmount: bot.betAmount * bot.targetMultiplier
            };
          }
          return bot;
        });
        return changed ? updated : currentBots;
      });
    } else if (status === 'CRASHED') {
      setBots((currentBots) => {
        let changed = false;
        const updated = currentBots.map(bot => {
          if (bot.status === 'PLAYING') {
            changed = true;
            return { ...bot, status: 'CRASHED' as const };
          }
          return bot;
        });
        return changed ? updated : currentBots;
      });
    }
  }, [status, currentMultiplier]);

  const sortedBots = [...bots].sort((a, b) => {
    if (a.status === 'CASHED_OUT' && b.status !== 'CASHED_OUT') return -1;
    if (b.status === 'CASHED_OUT' && a.status !== 'CASHED_OUT') return 1;
    if (a.status === 'CASHED_OUT' && b.status === 'CASHED_OUT') {
      return (b.winAmount || 0) - (a.winAmount || 0);
    }
    if (a.status === 'PLAYING' && b.status !== 'PLAYING') return -1;
    if (b.status === 'PLAYING' && a.status !== 'PLAYING') return 1;
    if (a.status === 'PLAYING' && b.status === 'PLAYING') {
      return b.betAmount - a.betAmount;
    }
    return b.betAmount - a.betAmount;
  });

  return sortedBots;
}