import React, { useMemo } from 'react';
import {
  computeEffectiveDuration,
  generateSnowflakes,
  getSnowfallGesturePhysics,
} from '../core/snowfall';
import type { GestureId } from '../core/gestureClassifier';
import type { TreePalette } from '../core/themes';

interface CssSnowfallBackdropProps {
  palette: TreePalette;
  activeGesture?: GestureId;
  easterEggActive?: boolean;
}

export const CssSnowfallBackdrop: React.FC<CssSnowfallBackdropProps> = ({
  palette,
  activeGesture = 'idle',
  easterEggActive = false,
}) => {
  const flakes = useMemo(() => generateSnowflakes(76), []);
  const physics = useMemo(
    () => getSnowfallGesturePhysics(activeGesture, easterEggActive),
    [activeGesture, easterEggActive]
  );

  const effectiveSpeed = Number((palette.snowSpeed * physics.speedMultiplier).toFixed(2));
  const effectiveColor = physics.colorOverride ?? palette.snowColor;

  return (
    <div
      data-testid="css-snowfall-backdrop"
      data-snow-mode={physics.mode}
      data-snow-color={effectiveColor}
      data-snow-speed={effectiveSpeed.toFixed(2)}
      data-snow-scale={physics.scaleMultiplier.toFixed(2)}
      data-snow-converge={physics.convergeStrength.toFixed(2)}
      data-flake-count={flakes.length}
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-[background] duration-700"
      style={{
        background: `radial-gradient(ellipse 75% 65% at 50% 62%, ${palette.bgGlow} 0%, ${palette.skyTint} 68%, #03050d 100%)`,
      }}
    >
      {flakes.map((flake) => {
        const duration = computeEffectiveDuration(flake.baseDurationSec, effectiveSpeed);
        const negativeDelay = -Number((duration * flake.delayRatio).toFixed(2));
        const baseGlow = flake.layer === 'near' ? 10 : flake.layer === 'mid' ? 6 : 3;
        const glowRadius = Math.round(baseGlow * physics.glowMultiplier);
        const scaledSize = Number((flake.sizePx * physics.scaleMultiplier).toFixed(2));

        // Positive convergeStrength pulls flakes horizontally toward the Christmas tree at 50vw;
        // negative convergeStrength (e.g. Victory burst) gently expands outward for celebratory bloom.
        const convergeShiftVw = Number(
          ((50 - flake.leftPercent) * physics.convergeStrength * 0.72).toFixed(2)
        );
        const effectiveDriftPx = Math.round(
          flake.driftPx * (physics.convergeStrength > 0.3 ? 0.45 : 1.0)
        );

        return (
          <span
            key={flake.id}
            className="css-snowflake-wrapper"
            style={{
              left: `${flake.leftPercent}%`,
              transform: `translate3d(${convergeShiftVw}vw, 0, 0)`,
            }}
          >
            <span
              className="css-snowflake-particle"
              style={
                {
                  width: `${scaledSize}px`,
                  height: `${scaledSize}px`,
                  backgroundColor: effectiveColor,
                  boxShadow: `0 0 ${glowRadius}px ${effectiveColor}`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${negativeDelay}s`,
                  '--flake-opacity': Math.min(1, Number((flake.opacity * (physics.mode === 'normal' ? 1 : 1.2)).toFixed(2))),
                  '--drift-x': `${effectiveDriftPx}px`,
                } as React.CSSProperties
              }
            />
          </span>
        );
      })}
    </div>
  );
};
