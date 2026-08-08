"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function useAnimatedNumber(value: number) {
  const spring = useSpring(0, { stiffness: 80, damping: 20, mass: 0.6 });
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return spring;
}

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("ru-RU"),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const spring = useAnimatedNumber(value);
  const display = useTransform(spring, (n) => format(n));
  return <motion.span className={className}>{display}</motion.span>;
}

export function PityRing({
  value,
  max,
  label,
  accent,
}: {
  value: number;
  max: number;
  label: string;
  accent: string;
}) {
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="12"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <AnimatedNumber
          value={value}
          className="font-genshin text-3xl leading-none text-foreground"
        />
        <span className="mt-1 text-[11px] font-bold text-muted-foreground">
          / {max}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
