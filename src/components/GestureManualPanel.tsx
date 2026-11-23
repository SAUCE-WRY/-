import React from 'react';
import { BookOpen, ChevronLeft, Play, Sparkles } from 'lucide-react';
import { GESTURE_GUIDE, type GestureId } from '../core/gestureClassifier';

interface GestureManualPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeGesture: GestureId;
  handCount: number;
  cameraActive: boolean;
  onSimulateGesture: (gesture: Exclude<GestureId, 'idle'>) => void;
}

const CATEGORY_TITLES: Record<'single' | 'dual' | 'multi', string> = {
  single: '单手交互手势',
  dual: '双手协作特效',
  multi: '多人同框惊喜彩蛋',
};

export const GestureManualPanel: React.FC<GestureManualPanelProps> = ({
  isOpen,
  onToggle,
  activeGesture,
  handCount,
  cameraActive,
  onSimulateGesture,
}) => {
  if (!isOpen) {
    return (
      <div className="fixed left-4 top-20 z-20">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label="展开手势说明书"
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#080d1c]/88 hover:bg-[#10182f]/95 border border-white/14 text-xs font-medium text-[#F5F2EB] transition-colors cursor-pointer shadow-lg whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4 text-[#E8C872]" aria-hidden="true" />
          <span>手势说明书</span>
        </button>
      </div>
    );
  }

  const groups: Array<'single' | 'dual' | 'multi'> = ['single', 'dual', 'multi'];

  return (
    <aside
      aria-label="手势操作说明书"
      className="fixed left-4 top-20 bottom-24 z-20 w-[300px] sm:w-[324px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl bg-[#080d1c]/88 border border-white/14 shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white">手势操作说明书</h2>
          <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
            {cameraActive
              ? `摄像头实时追踪中 · 识别到 ${handCount} 只手`
              : '点击任意条目或按快捷键 1-9 / 0 / E 立即试玩'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={true}
          aria-label="收起手势说明书"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Gesture List */}
      <div className="flex-1 overflow-y-auto festive-scroll px-3.5 py-3 space-y-4">
        {groups.map((cat) => {
          const items = GESTURE_GUIDE.filter((g) => g.category === cat);
          return (
            <section key={cat} className="space-y-2">
              <h3 className="text-[11px] font-medium tracking-wider text-[#E8C872] px-1">
                {CATEGORY_TITLES[cat]}
              </h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const isActive = activeGesture === item.id;
                  const isEasterEgg = item.id === 'multi_person_easter_egg';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSimulateGesture(item.id)}
                      className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#E8C872]/16 border-[#E8C872]/70'
                          : isEasterEgg
                            ? 'bg-amber-500/[0.08] border-amber-300/25 hover:bg-amber-500/[0.14] hover:border-amber-300/50'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/22'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          {isEasterEgg && (
                            <Sparkles className="w-3.5 h-3.5 text-[#F7D570] shrink-0" aria-hidden="true" />
                          )}
                          <span>{item.name}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#E8C872] shrink-0">
                          <Play className="w-2.5 h-2.5" aria-hidden="true" />
                          <span>键 {item.shortcut}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                        动作：{item.howTo}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        视效：{item.visualFeedback}
                      </p>
                      <p className="text-[11px] text-[#E8C872]/85 mt-1 leading-relaxed">
                        音效：{item.audioFeedback}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer Tip */}
      <div className="px-4 py-2.5 border-t border-white/10 text-[11px] text-slate-400 shrink-0">
        鼠标拖拽 360° 环视 · 按 T 开关拖尾 · 按 H 收起底栏
      </div>
    </aside>
  );
};
