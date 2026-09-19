"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate?: string;
  className?: string;
}

export function CountdownTimer({
  targetDate = "2026-10-24T09:00:00Z",
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 35, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 text-[11px] font-mono text-slate-300",
        className
      )}
    >
      <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
      <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">T-Minus:</span>
      <span className="text-white font-semibold">
        {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m{" "}
        <span className="text-cyan-400">{String(timeLeft.seconds).padStart(2, "0")}s</span>
      </span>
    </div>
  );
}
