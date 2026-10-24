"use client";

import { lazy, Suspense, useEffect, useState } from "react";

// Kyoto Dusk is from ascii.rest by bas3line, MIT licensed. Keep the supplied artwork intact.
// Load the canvas renderer only after the browser has had a chance to process critical content.
const Ascii = lazy(() =>
  import("ascii.rest/react").then((module) => ({ default: module.Ascii })),
);

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function KyotoDuskBanner() {
  const [rendererReady, setRendererReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const idleWindow = window as IdleWindow;

    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(
        () => {
          if (!cancelled) setRendererReady(true);
        },
        { timeout: 1200 },
      );

      return () => {
        cancelled = true;
        idleWindow.cancelIdleCallback?.(handle);
      };
    }

    const timer = window.setTimeout(() => {
      if (!cancelled) setRendererReady(true);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      data-testid="kyoto-dusk"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {rendererReady ? (
        <Suspense fallback={null}>
          <Ascii
            piece="kyoto-dusk"
            options={{ fps: 12 }}
            style={{ width: "100%", aspectRatio: "2 / 1" }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
