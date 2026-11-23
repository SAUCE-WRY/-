import React, { useState } from 'react';
import {
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
  Gift,
  Music,
  Palette,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import {
  PRESET_THEMES,
  type CustomColorOverrides,
  type TreePalette,
} from '../core/themes';
import type { TrackerStatus } from '../core/handTracker';

interface BottomControlDockProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  cameraStatus: TrackerStatus;
  onToggleCamera: () => void;
  musicPlaying: boolean;
  onToggleMusic: () => void;
  muted: boolean;
  onToggleMuted: () => void;
  selectedThemeId: string;
  activePalette: TreePalette;
  customOverrides: Partial<CustomColorOverrides> | null;
  onSelectTheme: (themeId: string) => void;
  onUpdateCustomColor: (key: keyof CustomColorOverrides, hex: string) => void;
  onResetCustomColors: () => void;
  auraIntensity: number;
  onChangeAuraIntensity: (val: number) => void;
  motionTrailsEnabled: boolean;
  onToggleMotionTrails: () => void;
  easterEggUnlocked: boolean;
  onTriggerEasterEgg: () => void;
  onOpenGiftCard: () => void;
  onResetCamera: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  collapsed,
  onToggleCollapsed,
  cameraStatus,
  onToggleCamera,
  musicPlaying,
  onToggleMusic,
  muted,
  onToggleMuted,
  selectedThemeId,
  activePalette,
  customOverrides,
  onSelectTheme,
  onUpdateCustomColor,
  onResetCustomColors,
  auraIntensity,
  onChangeAuraIntensity,
  motionTrailsEnabled,
  onToggleMotionTrails,
  easterEggUnlocked,
  onTriggerEasterEgg,
  onOpenGiftCard,
  onResetCamera,
}) => {
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  const isCameraOn = cameraStatus === 'active' || cameraStatus === 'loading';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center max-w-[96vw]">
      {/* Custom Color Popover */}
      {!collapsed && colorPopoverOpen && (
        <div
          role="region"
          aria-label="自定义调色与流光设置"
          className="mb-2.5 w-[min(460px,92vw)] rounded-2xl bg-[#080d1c]/94 border border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.65)] p-4 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">圣诞树自由调色与流光强度</span>
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
                onClick={() => setColorPopoverOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { key: 'primary', label: '树体主色', value: activePalette.primary },
                { key: 'secondary', label: '枝梢高光', value: activePalette.secondary },
                { key: 'ribbon', label: '流光丝带', value: activePalette.ribbon },
                { key: 'aura', label: '树周流光', value: activePalette.aura },
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

          <div className="pt-2 border-t border-white/10 flex items-center gap-3">
            <label htmlFor="aura-intensity-slider" className="text-xs text-slate-300 whitespace-nowrap">
              流光粒子浓度
            </label>
            <input
              id="aura-intensity-slider"
              type="range"
              min={0.3}
              max={2.0}
              step={0.05}
              value={auraIntensity}
              onChange={(e) => onChangeAuraIntensity(parseFloat(e.target.value))}
              className="festive-slider flex-1"
            />
            <span className="text-xs text-[#E8C872] tabular-nums w-10 text-right">
              {Math.round(auraIntensity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Collapse / Expand Tab */}
      <button
        type="button"
        onClick={() => {
          setColorPopoverOpen(false);
          onToggleCollapsed();
        }}
        aria-expanded={!collapsed}
        aria-label={collapsed ? '展开底部控制栏' : '收起底部控制栏'}
        className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#080d1c]/88 hover:bg-[#111933]/95 border border-white/14 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-[#E8C872]" aria-hidden="true" />
            <span>展开控制栏</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-[#E8C872]" aria-hidden="true" />
            <span>隐藏控制栏</span>
          </>
        )}
      </button>

      {/* Main Horizontal Dock */}
      {!collapsed && (
        <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1.5 px-2.5 py-2 rounded-2xl bg-[#080d1c]/90 border border-white/14 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
          {/* Camera Toggle */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isCameraOn
                ? 'bg-[#E8C872] text-[#090d1a] hover:bg-[#f2d687]'
                : 'bg-white/[0.08] text-white hover:bg-white/[0.15]'
            }`}
          >
            {isCameraOn ? (
              <Camera className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <CameraOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {cameraStatus === 'loading'
                ? '连接摄像头…'
                : cameraStatus === 'active'
                  ? '关闭摄像头'
                  : '开启摄像头'}
            </span>
          </button>

          <span className="hidden sm:block w-px h-5 bg-white/12 shrink-0" aria-hidden="true" />

          {/* Theme Swatches */}
          <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label="主题色切换">
            {PRESET_THEMES.map((theme) => {
              const active = selectedThemeId === theme.id && !customOverrides;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onSelectTheme(theme.id)}
                  title={theme.name}
                  aria-label={`选择主题：${theme.name}`}
                  aria-pressed={active}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer overflow-hidden flex shrink-0 ${
                    active
                      ? 'border-[#F7D570] scale-110'
                      : 'border-white/25 hover:border-white/60 hover:scale-105'
                  }`}
                >
                  <span className="w-1/2 h-full" style={{ backgroundColor: theme.primary }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: theme.ribbon }} />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setColorPopoverOpen((v) => !v)}
              aria-expanded={colorPopoverOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                colorPopoverOpen || customOverrides
                  ? 'bg-white/16 text-[#F7D570] border border-[#E8C872]/50'
                  : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] border border-transparent'
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>调色盘</span>
            </button>
          </div>

          <span className="hidden sm:block w-px h-5 bg-white/12 shrink-0" aria-hidden="true" />

          {/* Motion Trails Toggle */}
          <button
            type="button"
            data-testid="motion-trails-toggle"
            onClick={onToggleMotionTrails}
            aria-pressed={motionTrailsEnabled}
            title="开启或关闭粒子拖尾流光 (快捷键 T)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
              motionTrailsEnabled
                ? 'bg-sky-400/16 text-[#BCE8FF] border-sky-300/45 hover:bg-sky-400/24'
                : 'bg-white/[0.06] text-slate-300 border-transparent hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{motionTrailsEnabled ? '流光拖尾 · 开' : '流光拖尾 · 关'}</span>
          </button>

          {/* Multi-Person Easter Egg + Unlocked Christmas Gift Box */}
          <button
            type="button"
            onClick={onTriggerEasterEgg}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/16 hover:bg-amber-500/26 border border-amber-300/35 text-xs font-medium text-[#FCE29B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>多人彩蛋</span>
          </button>

          {easterEggUnlocked && (
            <button
              type="button"
              data-testid="dock-gift-card-btn"
              onClick={onOpenGiftCard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/22 hover:bg-rose-500/34 border border-rose-300/50 text-xs font-semibold text-[#FFE4E6] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Gift className="w-3.5 h-3.5 shrink-0 text-[#FDE68A]" aria-hidden="true" />
              <span>彩蛋礼盒</span>
            </button>
          )}

          <span className="hidden sm:block w-px h-5 bg-white/12 shrink-0" aria-hidden="true" />

          {/* Audio Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleMusic}
              aria-label={musicPlaying ? '暂停圣诞旋律' : '播放圣诞旋律'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                musicPlaying
                  ? 'bg-white/14 text-[#F7D570]'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{musicPlaying ? '旋律中' : '圣诞旋律'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMuted}
              aria-label={muted ? '取消静音' : '静音'}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-300" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-200" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onResetCamera}
              aria-label="重置视角"
              title="重置视角"
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
