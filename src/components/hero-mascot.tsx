"use client";

import { Mascot } from "page-mascot";

export function AvatarMascot() {
  return (
    <div
      data-testid="avatar-mascot-frame"
      className="absolute inset-0"
    >
      <Mascot
        directions="/mascots/lain-directions.webp"
        reactions="/mascots/lain-reactions.webp"
        size={160}
        label="Lain mascot"
        className="!absolute !inset-0 !size-full lain-avatar-mascot rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    </div>
  );
}
