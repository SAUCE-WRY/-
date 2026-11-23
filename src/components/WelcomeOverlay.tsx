import React, { useState } from 'react';
import { Camera, SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  PRESET_THEMES,
  type CustomColorOverrides,
  type TreePalette,
} from '../core/themes';

interface WelcomeOverlayProps {
  selectedThemeId: string;
  activePalette: TreePalette;
  customOverrides: Partial<CustomColorOverrides> | null;
  onSelectTheme: (themeId: string) => void;
  onUpdateCustomColor: (key: keyof CustomColorOverrides, hex: string) => void;
  onResetCustomColors: () => void;
  onEnterInteractive: (startCamera: boolean) => void;
  onOpenGenesis: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  selectedThemeId,
  activePalette,
  customOverrides,
  onSelectTheme,
  onUpdateCustomColor,
  onResetCustomColors,
  onEnterInteractive,
  onOpenGenesis,
}) => {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:pr-12 xl:pr-16 pointer-events-none">
      <div
        role="region"
        aria-label="圣诞树配色定制"
        className="pointer-events-auto w-full max-w-[510px] rounded-2xl bg-[#070c1b]/88 border border-white/14 shadow-[0_24px_80px_rgba(0,0,0,0.65)] p-6 sm:p-7 text-[#F5F2EB]"
      >
        <div className="text-left space-y-2">
          <p className="text-xs tracking-[0.2em] text-[#E8C872] font-medium">
            星辉圣诞 · 沉浸式粒子光影剧场
          </p>
          <h1 className="font-display text-3xl sm:text-[34px] font-semibold tracking-tight text-white [text-wrap:balance]">
            定制你的专属粒子圣诞树
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            挑选冬日主题色系或自由调色，左侧粒子圣诞树将实时焕彩；进入后即可挥手互动并解锁多人同框彩蛋。
          </p>
        </div>

        {/* Preset Themes Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-300">精选节日主题配色</span>
            <button
              type="button"
              onClick={() => setShowCustom((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E8C872] hover:text-[#f7df99] transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              {showCustom ? '收起自由调色' : '自由调色'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_THEMES.map((theme) => {
              const isSelected = selectedThemeId === theme.id && !customOverrides;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onSelectTheme(theme.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 border-[#E8C872]/70'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/25'
                  }`}
                >
                  <span
                    className="flex shrink-0 w-9 h-9 rounded-lg border border-white/20 overflow-hidden"
                    aria-hidden="true"
                  >
                    <span className="w-1/2 h-full" style={{ backgroundColor: theme.primary }} />
                    <span className="w-1/4 h-full" style={{ backgroundColor: theme.secondary }} />
                    <span className="w-1/4 h-full" style={{ backgroundColor: theme.ribbon }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">
                      {theme.name}
                    </span>
                    <span className="block text-xs text-slate-400 truncate mt-0.5">
                      {theme.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Grading Drawer */}
        {showCustom && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">实时自定义调色盘</span>
              {customOverrides && (
                <button
                  type="button"
                  onClick={onResetCustomColors}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  恢复主题默认
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { key: 'primary', label: '树体主色', value: activePalette.primary },
                  { key: 'secondary', label: '枝梢高光', value: activePalette.secondary },
                  { key: 'ribbon', label: '流光丝带', value: activePalette.ribbon },
                  { key: 'aura', label: '星尘光晕', value: activePalette.aura },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="flex flex-col gap-1.5 text-xs text-slate-300 cursor-pointer"
                >
                  <span>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.value}
                      onChange={(e) => onUpdateCustomColor(item.key, e.target.value)}
                      className="festive-color-input w-9 h-8"
                      aria-label={item.label}
                    />
                    <span className="text-[11px] font-mono text-slate-400 uppercase tabular-nums">
                      {item.value}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action CTAs */}
        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => onEnterInteractive(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E8C872] hover:bg-[#f2d687] text-[#090d1a] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
            开启摄像头 · 进入手势奇境
          </button>
          <button
            type="button"
            onClick={() => onEnterInteractive(false)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/14 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            先静赏与试玩
          </button>
        </div>

        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>35,600 枚实时流光粒子 · 支持多人同框彩蛋</span>
          <button
            type="button"
            onClick={onOpenGenesis}
            className="inline-flex items-center gap-1 text-[#E8C872] hover:text-[#f7df99] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            先看从无到有完整展示
          </button>
        </div>
      </div>
    </div>
  );
};
