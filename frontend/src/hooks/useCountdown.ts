import { useState, useEffect } from 'react';

export function useCountdown(targetDateStr?: string) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!targetDateStr) return;

    const target = new Date(targetDateStr).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        clearInterval(interval);
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr]);

  return timeLeft;
}
