"use client";

import { useEffect, useState } from "react";

const BLUR_LAYERS = [
  { blur: 0.5, start: "0%" },
  { blur: 1, start: "15%" },
  { blur: 2, start: "30%" },
  { blur: 4, start: "50%" },
  { blur: 8, start: "70%" },
];

export function BottomBlur() {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("page-end");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setAtBottom(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-testid="bottom-blur"
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 transition-opacity duration-200"
      style={{ opacity: atBottom ? 0 : 1 }}
    >
      {BLUR_LAYERS.map((layer) => (
        <div
          key={layer.blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${layer.blur}px)`,
            WebkitBackdropFilter: `blur(${layer.blur}px)`,
            maskImage: `linear-gradient(to bottom, transparent ${layer.start}, black 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent ${layer.start}, black 100%)`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent, var(--blur-veil))",
        }}
      />
    </div>
  );
}
