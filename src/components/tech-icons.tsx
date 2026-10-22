import type { ComponentType } from "react";
import {
  SiCplusplus,
  SiGo,
  SiGooglecloud,
  SiJavascript,
  SiPython,
} from "@icons-pack/react-simple-icons";

import { AwsIcon } from "@/components/icons/aws";
import type { TechIconKey } from "@/config/site";
import { cn } from "@/lib/utils";

type TechGlyphProps = {
  className?: string;
  size?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
  focusable?: boolean | "true" | "false";
};

const TECH_ICONS: Record<
  TechIconKey,
  { Glyph: ComponentType<TechGlyphProps>; color: string }
> = {
  python: { Glyph: SiPython, color: "text-brand-python" },
  go: { Glyph: SiGo, color: "text-brand-go" },
  javascript: { Glyph: SiJavascript, color: "text-brand-javascript" },
  cpp: { Glyph: SiCplusplus, color: "text-brand-cpp" },
  aws: { Glyph: AwsIcon, color: "text-brand-aws" },
  "google-cloud": { Glyph: SiGooglecloud, color: "text-brand-google-cloud" },
};

export function TechGlyph({
  name,
  className,
}: {
  name: TechIconKey;
  className?: string;
}) {
  const { Glyph, color } = TECH_ICONS[name];

  return (
    <Glyph
      aria-hidden="true"
      focusable="false"
      size={44}
      className={cn("size-10 md:size-11", color, className)}
    />
  );
}
