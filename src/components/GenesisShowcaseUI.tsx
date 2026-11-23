import React, { useState } from 'react';
import {
  ArrowLeft,
  Music,
  Palette,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  PRESET_THEMES,
  type CustomColorOverrides,
  type TreePalette,
} from '../core/themes';
import { GENESIS_STAGES, getGenesisStage } from '../core/treeGeometry';

interface GenesisShowcaseUIProps {
  progress: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  onScrub: (value: number) => void;
  onExitGenesis: () => void;
  selectedThemeId: string;
  activePalette: TreePalette;
  customOverrides: Partial<CustomColorOverrides> | null;
  onSelectTheme: (themeId: string) => void;
  onUpdateCustomColor: (key: keyof CustomColorOverrides, hex: string) => void;
  onResetCustomColors: () => void;
  musicPlaying: boolean;
  onToggleMusic: () => void;
}

export const GenesisShowcaseUI: React.FC<GenesisShowcaseUIProps> = ({
  progress,
  isPlaying,
  onTogglePlay,
  onReplay,
  onScrub,
  onExitGenesis,
  selectedThemeId,
  activePalette,
  customOverrides,
  onSelectTheme,
  onUpdateCustomColor,
  onResetCustomColors,
  musicPlaying,
  onToggleMusic,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const stage = getGenesisStage(progress);

  return (
    <>
      {/* Top-Left Return Button + Ceremonial Title */}
      <div className="fixed top-4 left-4 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={onExitGenesis}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#080d1c]/88 hover:bg-[#111933]/95 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-[#E8C872]" aria-hidden="true" />
          <span>返回手势互动</span>
        </button>

        <div className="hidden sm:block">
          <span className="text-xs text-[#E8C872] font-medium">纯享粒子盛典 · 无手势干扰</span>
          <span className="mx-2 text-slate-500" aria-hidden="true">·</span>
          <span className="text-xs text-slate-300">从无到有 · 圣诞树完整绽放</span>
        </div>
      </div>

      {/* Subtle Poetic Stage Title near Top Center (unobtrusive, leaving tree center open) */}
      <div className="fixed top-16 sm:top-5 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none px-4 max-w-lg">
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-white tracking-wide">
          {stage.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">{stage.subtitle}</p>
      </div>

      {/* Bottom Ceremonial Timeline & Theme Palette Dock */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-[min(780px,94vw)] flex flex-col items-center gap-2.5">
        {showCustom && (
          <div className="w-[min(460px,92vw)] rounded-2xl bg-[#080d1c]/94 border border-white/15 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">完整展示自定义调色</span>
              <div className="flex items-center gap-3">
                {customOverrides && (
                  <button
                    type="button"
                    onClick={onResetCustomColors}
                    className="text-xs text-[#E8C872] hover:text-[#f7df99] cursor-pointer"
                  >
                    恢复预设
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  收起
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { key: 'primary', label: '树体主色', value: activePalette.primary },
                  { key: 'secondary', label: '枝梢高光', value: activePalette.secondary },
                  { key: 'ribbon', label: '流光丝带', value: activePalette.ribbon },
                  { key: 'aura', label: '星尘光晕', value: activePalette.aura },
                ] as const
              ).map((field) => (
                <label
                  key={field.key}
                  className="flex flex-col gap-1.5 text-[11px] text-slate-300 cursor-pointer"
                >
                  <span>{field.label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => onUpdateCustomColor(field.key, e.target.value)}
                      className="festive-color-input w-8 h-7"
                      aria-label={field.label}
                    />
                    <span className="font-mono text-[10px] text-slate-400 uppercase tabular-nums">
                      {field.value}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="w-full rounded-2xl bg-[#080d1c]/90 border border-white/14 shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 space-y-3">
          {/* Progress Scrubber + 5 Stage Markers */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={isPlaying ? '暂停生长动画' : '继续生长动画'}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#E8C872] hover:bg-[#f2d687] text-[#090d1a] transition-colors cursor-pointer shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Play className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.002}
                value={progress}
                onChange={(e) => onScrub(parseFloat(e.target.value))}
                aria-label="圣诞树生成进度"
                className="festive-slider flex-1"
              />

              <span className="text-xs font-medium text-[#E8C872] tabular-nums w-11 text-right">
                {Math.round(progress * 100)}%
              </span>

              <button
                type="button"
                onClick={onReplay}
                aria-label="重新从零播放"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>重播</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400 px-11">
              {GENESIS_STAGES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onScrub(Math.min(1, st.start + 0.04))}
                  className={`transition-colors cursor-pointer ${
                    stage.id === st.id ? 'text-[#E8C872] font-medium' : 'hover:text-slate-200'
                  }`}
                >
                  {st.title}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Selector & Melody Toggle */}
          <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">主题风格</span>
              {PRESET_THEMES.map((theme) => {
                const active = selectedThemeId === theme.id && !customOverrides;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white/14 text-white border border-[#E8C872]/70'
                        : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.1]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                      style={{ backgroundColor: theme.secondary }}
                      aria-hidden="true"
                    />
                    <span>{theme.name}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCustom((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  showCustom || customOverrides
                    ? 'bg-[#E8C872]/20 text-[#F7D570] border border-[#E8C872]/60'
                    : 'bg-white/[0.05] text-slate-200 border border-white/10 hover:bg-white/[0.1]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" aria-hidden="true" />
                <span>自调配色</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleMusic}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                musicPlaying
                  ? 'bg-white/14 text-[#F7D570]'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
            >
              <Music className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{musicPlaying ? '旋律播放中' : '播放圣诞旋律'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
