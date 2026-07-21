import { useState, useEffect, useRef, useCallback } from 'react';

export type GameStatus = 'WAITING' | 'FLYING' | 'CRASHED';

export function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.01) return 1.00;
  return Math.max(1.00, Math.min(Math.floor(99 / (1 - r)) / 100, 1000));
}

export function useGameLoop() {
  const [status, setStatus] = useState<GameStatus>('WAITING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [countdown, setCountdown] = useState(5.0);
  const [history, setHistory] = useState<number[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);

  const startGame = useCallback(() => {
    const cp = generateCrashPoint();
    crashPointRef.current = cp;
    setCrashPoint(cp);
    setStatus('FLYING');
    setMultiplier(1.00);
    setElapsedMs(0);
    startTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (status === 'WAITING') {
      let lastTime = performance.now();
      const tick = (time: number) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        setCountdown((c) => {
          const next = c - delta;
          if (next <= 0) {
            startGame();
            return 0;
          }
          return next;
        });
        requestRef.current = requestAnimationFrame(tick);
      };
      requestRef.current = requestAnimationFrame(tick);
    } else if (status === 'FLYING') {
      const tick = (time: number) => {
        const elapsed = time - startTimeRef.current;
        setElapsedMs(elapsed);
        const currentMultiplier = Math.max(1.00, Math.exp(0.00006 * elapsed));
        const cp = crashPointRef.current;
        
        if (currentMultiplier >= cp) {
          setMultiplier(cp);
          setStatus('CRASHED');
          setHistory(prev => [cp, ...prev].slice(0, 20));
          setTimeout(() => {
            setStatus('WAITING');
            setCountdown(5.0);
            setElapsedMs(0);
          }, 3500);
        } else {
          setMultiplier(currentMultiplier);
          requestRef.current = requestAnimationFrame(tick);
        }
      };
      requestRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [status, startGame]);

  return { status, multiplier, crashPoint, countdown, history, elapsedMs };
}