"use client";

import { useEffect, useState } from "react";

interface Props { 
  endDate: string;
  size?: 'small' | 'large';
}

export default function Countdown({ endDate, size = 'small' }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(endDate).getTime() - new Date().getTime();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  const isSmall = size === 'small';

  return (
    <div className={`flex justify-center space-x-1 ${isSmall ? 'text-xs' : 'text-lg'}`}>
      <div className={`countdown-digit rounded-lg text-center ${isSmall ? 'px-2 py-1' : 'px-4 py-3'}`}>
        <div className={`${isSmall ? 'text-sm' : 'text-2xl'} font-bold text-white`}>
          {String(days).padStart(2, '0')}
        </div>
        <div className="text-primary-400 text-xs font-medium">Days</div>
      </div>
      <div className={`countdown-digit rounded-lg text-center ${isSmall ? 'px-2 py-1' : 'px-4 py-3'}`}>
        <div className={`${isSmall ? 'text-sm' : 'text-2xl'} font-bold text-white`}>
          {String(hours).padStart(2, '0')}
        </div>
        <div className="text-primary-400 text-xs font-medium">Hrs</div>
      </div>
      <div className={`countdown-digit rounded-lg text-center ${isSmall ? 'px-2 py-1' : 'px-4 py-3'}`}>
        <div className={`${isSmall ? 'text-sm' : 'text-2xl'} font-bold text-white`}>
          {String(minutes).padStart(2, '0')}
        </div>
        <div className="text-primary-400 text-xs font-medium">Mins</div>
      </div>
      <div className={`countdown-digit rounded-lg text-center ${isSmall ? 'px-2 py-1' : 'px-4 py-3'}`}>
        <div className={`${isSmall ? 'text-sm' : 'text-2xl'} font-bold text-white`}>
          {String(seconds).padStart(2, '0')}
        </div>
        <div className="text-primary-400 text-xs font-medium">Secs</div>
      </div>
    </div>
  );
}
