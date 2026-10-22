"use client";

// Kyoto Dusk is from ascii.rest by bas3line, MIT licensed. Keep the supplied artwork intact.
import { Ascii } from "ascii.rest/react";
import * as kyotoDusk from "ascii.rest/pieces/kyoto-dusk";

export function KyotoDuskBanner() {
  return (
    <div
      data-testid="kyoto-dusk"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <Ascii
        piece={kyotoDusk}
        style={{ width: "100%", aspectRatio: "2 / 1" }}
      />
    </div>
  );
}
