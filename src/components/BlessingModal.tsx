import React from 'react';
import { Heart, Sparkles, X } from 'lucide-react';

interface BlessingModalProps {
  open: boolean;
  onClose: () => void;
  onSendAgain: () => void;
}

export const BlessingModal: React.FC<BlessingModalProps> = ({
  open,
  onClose,
  onSendAgain,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030612]/65"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blessing-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-[#0a1124]/96 border border-[#E8C872]/45 shadow-[0_24px_80px_rgba(0,0,0,0.75)] p-7 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭祝福卡片"
          className="absolute top-3.5 right-3.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#E8C872]/15 border border-[#E8C872]/40 flex items-center justify-center mb-4">
          <Heart className="w-6 h-6 text-[#F5C76B]" aria-hidden="true" />
        </div>

        <p className="text-xs tracking-[0.2em] text-[#E8C872] font-medium">
          冬日暖意 · 双向奔赴
        </p>

        <h2
          id="blessing-modal-title"
          className="font-display text-2xl sm:text-[26px] font-semibold text-white mt-3 leading-snug"
        >
          源收到你的祝福啦，
          <br />
          也要祝你天天开心哦！
        </h2>

        <p className="text-sm text-slate-300 mt-3 leading-relaxed">
          愿这棵为你点亮的流光粒子圣诞树，把冬夜里的温暖、星光与好运轻轻送到你身边。
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onSendAgain}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8C872] hover:bg-[#f2d687] text-[#090d1a] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            再放一束祝福星雨
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            收下祝福
          </button>
        </div>
      </div>
    </div>
  );
};
