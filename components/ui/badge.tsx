import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "ai"
    | "cyan";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30",
    secondary: "bg-slate-800 text-slate-300 border border-slate-700",
    destructive: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
    outline: "text-slate-300 border border-slate-700",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    ai: "bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 shadow-aiGlow",
    cyan: "bg-cyan-950/60 text-cyan-400 border border-cyan-500/40",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
