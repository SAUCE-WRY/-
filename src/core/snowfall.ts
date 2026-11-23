import { createSeededRandom } from './treeGeometry';
import type { GestureId } from './gestureClassifier';

export interface CssSnowflake {
  id: number;
  leftPercent: number;
  sizePx: number;
  baseDurationSec: number;
  delayRatio: number;
  driftPx: number;
  opacity: number;
  layer: 'far' | 'mid' | 'near';
}

export type SnowfallPhysicsMode =
  | 'normal'
  | 'heart-bloom'
  | 'victory-burst'
  | 'converge-center'
  | 'ok-stasis'
  | 'meteor-rush'
  | 'easter-aurora';

export interface SnowfallGesturePhysics {
  mode: SnowfallPhysicsMode;
  speedMultiplier: number;
  scaleMultiplier: number;
  glowMultiplier: number;
  convergeStrength: number;
  colorOverride: string | null;
}

/**
 * Deterministically generates lightweight GPU-composited CSS snowfall particles
 * across three parallax depth planes (far, mid, near).
 */
export function generateSnowflakes(count = 72, seed = 20261224): CssSnowflake[] {
  const rand = createSeededRandom(seed);
  const flakes: CssSnowflake[] = [];

  for (let i = 0; i < count; i++) {
    const r = rand();
    const layer: CssSnowflake['layer'] = r < 0.45 ? 'far' : r < 0.82 ? 'mid' : 'near';

    const sizePx =
      layer === 'far'
        ? Number((2.0 + rand() * 1.6).toFixed(2))
        : layer === 'mid'
          ? Number((3.4 + rand() * 2.2).toFixed(2))
          : Number((5.2 + rand() * 2.8).toFixed(2));

    const baseDurationSec =
      layer === 'far'
        ? Number((15 + rand() * 9).toFixed(2))
        : layer === 'mid'
          ? Number((10 + rand() * 6).toFixed(2))
          : Number((7 + rand() * 4).toFixed(2));

    const opacity =
      layer === 'far'
        ? Number((0.26 + rand() * 0.22).toFixed(2))
        : layer === 'mid'
          ? Number((0.46 + rand() * 0.26).toFixed(2))
          : Number((0.68 + rand() * 0.26).toFixed(2));

    const driftSign = rand() > 0.5 ? 1 : -1;
    const driftPx = Math.round(driftSign * (18 + rand() * 54));

    flakes.push({
      id: i,
      leftPercent: Number((rand() * 100).toFixed(2)),
      sizePx,
      baseDurationSec,
      delayRatio: Number(rand().toFixed(4)),
      driftPx,
      opacity,
      layer,
    });
  }

  return flakes;
}

/**
 * Computes effective fall duration from a snowflake's base duration and theme speed multiplier.
 * Higher speed multiplier produces brisker (shorter duration) snowfall.
 */
export function computeEffectiveDuration(baseDurationSec: number, snowSpeed: number): number {
  const safeSpeed = Math.max(0.22, Math.min(3.2, snowSpeed));
  return Number((baseDurationSec / safeSpeed).toFixed(2));
}

/**
 * Resolves temporary physical snow transformations (size, fall speed, glow, color tint,
 * and radial convergence toward the Christmas tree center) when specific gestures trigger.
 */
export function getSnowfallGesturePhysics(
  gesture: GestureId = 'idle',
  easterEggActive = false
): SnowfallGesturePhysics {
  if (easterEggActive || gesture === 'multi_person_easter_egg') {
    return {
      mode: 'easter-aurora',
      speedMultiplier: 1.48,
      scaleMultiplier: 1.45,
      glowMultiplier: 1.9,
      convergeStrength: 0.22,
      colorOverride: '#fef08a',
    };
  }

  switch (gesture) {
    case 'heart_gesture':
      // Romantic slow-motion snowfall: flakes grow large, soften to rose-pearl, and drift gently toward the tree
      return {
        mode: 'heart-bloom',
        speedMultiplier: 0.44,
        scaleMultiplier: 1.72,
        glowMultiplier: 2.0,
        convergeStrength: 0.58,
        colorOverride: '#ffd6e8',
      };

    case 'victory':
      // Celebratory firework snow: flakes expand brightly with warm champagne luminance and brisk festive energy
      return {
        mode: 'victory-burst',
        speedMultiplier: 1.32,
        scaleMultiplier: 1.6,
        glowMultiplier: 2.1,
        convergeStrength: -0.22,
        colorOverride: '#fef3c7',
      };

    case 'closed_fist':
    case 'two_hand_snowglobe':
      // Gravitational pull / crystal snowglobe: snowflakes converge strongly toward the Christmas tree core
      return {
        mode: 'converge-center',
        speedMultiplier: 0.62,
        scaleMultiplier: 1.32,
        glowMultiplier: 1.65,
        convergeStrength: 0.84,
        colorOverride: gesture === 'two_hand_snowglobe' ? '#dbeafe' : null,
      };

    case 'pinch':
      // OK gesture crystal time-dilation: near-suspended diamond snow crystals
      return {
        mode: 'ok-stasis',
        speedMultiplier: 0.28,
        scaleMultiplier: 1.52,
        glowMultiplier: 2.2,
        convergeStrength: 0.32,
        colorOverride: '#e0f7ff',
      };

    case 'two_hand_meteor_shower':
      return {
        mode: 'meteor-rush',
        speedMultiplier: 1.75,
        scaleMultiplier: 1.18,
        glowMultiplier: 1.75,
        convergeStrength: 0,
        colorOverride: '#bae6fd',
      };

    default:
      return {
        mode: 'normal',
        speedMultiplier: 1.0,
        scaleMultiplier: 1.0,
        glowMultiplier: 1.0,
        convergeStrength: 0,
        colorOverride: null,
      };
  }
}
