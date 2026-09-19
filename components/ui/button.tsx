import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost" | "ai" | "cyan";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      default: "bg-indigo-600 text-white shadow hover:bg-indigo-500",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
      outline: "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60 hover:text-white",
      destructive: "bg-rose-600/80 text-white hover:bg-rose-600 border border-rose-500/50",
      ghost: "hover:bg-slate-800/70 text-slate-300 hover:text-white",
      ai: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-aiGlow hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/30",
      cyan: "bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyanGlow border border-cyan-400/30",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-md px-8 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
