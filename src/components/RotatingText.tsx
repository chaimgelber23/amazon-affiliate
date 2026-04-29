"use client";

import { useEffect, useState } from "react";

export interface RotatingTextProps {
  words: string[];
  intervalMs?: number;
  className?: string;
}

export function RotatingText({
  words,
  intervalMs = 2400,
  className = "",
}: RotatingTextProps) {
  const [idx, setIdx] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || words.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, words.length, reduceMotion]);

  if (words.length === 0) return null;

  if (reduceMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  const longest = words.reduce((l, w) => (w.length > l.length ? w : l), "");

  return (
    <span className={`relative inline-block align-baseline ${className}`}>
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {longest}
      </span>
      <span className="absolute inset-0 flex items-baseline justify-start whitespace-nowrap overflow-hidden">
        {words.map((w, i) => (
          <span
            key={w}
            aria-hidden={i !== idx}
            className="absolute inset-0 flex items-baseline justify-start"
            style={{
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? "translateY(0)" : "translateY(0.5em)",
              filter: i === idx ? "blur(0px)" : "blur(6px)",
              transition: "opacity 460ms cubic-bezier(0.22,1,0.36,1), transform 460ms cubic-bezier(0.22,1,0.36,1), filter 460ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}
