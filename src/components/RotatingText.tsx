"use client";

import { useEffect, useState } from "react";

export interface RotatingTextProps {
  words: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * Swaps a single word/short phrase in place with an opacity crossfade. An
 * invisible copy of the longest option reserves the width, so the surrounding
 * sentence never reflows or shifts as the word changes. Reduced-motion safe.
 */
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
  if (reduceMotion) return <span className={className}>{words[0]}</span>;

  // Invisible longest option holds the box width so nothing around it reflows.
  const longest = words.reduce((l, w) => (w.length > l.length ? w : l), "");

  return (
    <span className={`relative inline-block align-baseline ${className}`}>
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {longest}
      </span>
      {words.map((w, i) => (
        <span
          key={w}
          aria-hidden={i !== idx}
          className="absolute inset-0 flex items-baseline justify-start whitespace-nowrap"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
