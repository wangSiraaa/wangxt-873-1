import { useState, useEffect, useRef } from 'react';

export function useTimer(intervalMs: number = 1000): number {
  const [tick, setTick] = useState<number>(() => Date.now());
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current) {
        setTick(Date.now());
      }
    }, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [intervalMs]);
  return tick;
}
