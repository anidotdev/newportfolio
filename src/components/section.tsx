import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionSeparator() {
  return (
    <div
      data-testid="section-separator"
      aria-hidden="true"
      className="col-[full] h-8 w-full border-y border-hairline"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent 0 4px, var(--hatch) 4px 5px)",
      }}
    />
  );
}

export function SectionRow({
  children,
  className,
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      data-testid="section-row"
      className={cn(
        "col-[full] w-full",
        bordered && "border-b border-hairline",
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[var(--container-max)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
