import type { LucideIcon } from "lucide-react";
import { Box, Globe, Layers, Terminal } from "lucide-react";

import type { ProjectIconKey } from "@/config/site";

const PROJECT_GLYPHS: Record<ProjectIconKey, LucideIcon> = {
  box: Box,
  layers: Layers,
  terminal: Terminal,
  globe: Globe,
};

export function ProjectGlyph({
  icon,
  className,
}: {
  icon: ProjectIconKey;
  className?: string;
}) {
  const Glyph = PROJECT_GLYPHS[icon];

  return <Glyph aria-hidden="true" className={className} />;
}
