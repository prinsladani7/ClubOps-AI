"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkloadGaugeProps {
  score: number;
  label?: string;
  taskCount?: number;
  showBadge?: boolean;
  className?: string;
}

export function WorkloadGauge({
  score,
  label,
  taskCount,
  showBadge = true,
  className,
}: WorkloadGaugeProps) {
  const isBurnout = score > 80;
  const isHigh = score > 60 && score <= 80;
  const isOptimal = score <= 60;

  const statusText = isBurnout ? "BURNOUT THREAT" : isHigh ? "HIGH LOAD" : "OPTIMAL";
  const badgeVariant = isBurnout ? "destructive" : isHigh ? "warning" : "success";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {label && <span className="font-medium text-slate-200 truncate">{label}</span>}
          {showBadge && (
            <Badge variant={badgeVariant} className="text-[9px] py-0 px-1">
              {statusText}
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {score}% capacity {taskCount !== undefined && `(${taskCount} tasks)`}
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            isBurnout
              ? "bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
              : isHigh
              ? "bg-gradient-to-r from-amber-500 to-amber-400"
              : "bg-gradient-to-r from-emerald-500 to-cyan-400"
          )}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>
    </div>
  );
}
