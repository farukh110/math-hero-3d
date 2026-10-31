import type { Quality } from "@/systems/save/progress";

export interface QualityConfig {
  label: string;
  /** Max device pixel ratio (render scale). Values below 1 render at reduced resolution. */
  dpr: number;
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: number;
  shadowRange: number;
  /** Multiplier on the number of decorative instances (trees, grass, flowers...). */
  decor: number;
  /** Multiplier on fog distance (shorter = fewer pixels shaded far away). */
  fog: number;
  /** Multiplier on particle/droplet counts. */
  particles: number;
  description: string;
}

export const QUALITY: Record<Quality, QualityConfig> = {
  low: {
    label: "Low", dpr: 0.75, antialias: false, shadows: false, shadowMapSize: 0, shadowRange: 0,
    decor: 0.35, fog: 0.7, particles: 0.4,
    description: "Best for older school laptops. Reduced resolution, no shadows, simpler scenery.",
  },
  medium: {
    label: "Medium", dpr: 1, antialias: false, shadows: true, shadowMapSize: 1024, shadowRange: 16,
    decor: 0.7, fog: 1, particles: 0.7,
    description: "Balanced. Native resolution with small, soft shadows around the explorer.",
  },
  high: {
    label: "High", dpr: 1.5, antialias: true, shadows: true, shadowMapSize: 2048, shadowRange: 22,
    decor: 1, fog: 1.2, particles: 1,
    description: "For computers with a graphics card. Sharper image, better shadows, full scenery.",
  },
};
