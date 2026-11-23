import React, { useState } from 'react';
import { Gift, RefreshCw, Sparkles, X } from 'lucide-react';

interface GreetingCardEdition {
  id: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  salutation: string;
  lines: string[];
  sealText: string;
  footerWish: string;
}

const CHRISTMAS_CARDS: GreetingCardEdition[] = [
  {
    id: 'winter-tree',
    title: '冬夜松辉 · 岁岁常安',
    imageUrl: '/src/assets/images/christmas_card_tree_snow_1795403269330.jpg',
    imageAlt: '冬夜雪村与金色发光圣诞树的水彩金箔插画',
    salutation: '亲爱的冬日同行者：',
    lines: [
      '铃声轻响，雪落成诗。',
      '愿这棵由星光与默契点亮的圣诞树，',
      '为你挡去岁末的寒风，留住满怀的温柔与热爱。',
      '愿你所念皆如愿，所行皆坦途，平安喜乐，万事顺遂。',
    ],
    sealText: '圣诞喜乐',
    footerWish: '星河长明 · 岁末安暖',
  },
  {
    id: 'aurora-sleigh',
    title: '极光雪橇 · 好运奔赴',
    imageUrl: '/src/assets/images/christmas_card_sleigh_aurora_1795403269566.jpg',
    imageAlt: '极光星空下驯鹿雪橇飞越雪山松林的梦幻水彩插画',
    salutation: '见字如晤，展信欢喜：',
    lines: [
      '驯鹿踏着极光而来，把整片星河的祝福装进礼盒。',
      '谢谢你和身边珍贵的人一起点亮了这份彩蛋奇迹。',
      '愿新的一年里，你的每一份奇思妙想都有回响，',
      '身边常有笑声相伴，眼底永远闪耀星辰与光。',
    ],
    sealText: '吉星高照',
    footerWish: '极光相赠 · 奔赴新岁',
  },
  {
    id: 'hearth-gifts',
    title: '暖炉星礼 · 满屋清欢',
    imageUrl: '/src/assets/images/christmas_card_hearth_gifts_1795403269986.jpg',
    imageAlt: '窗外飘雪与温暖烛光圣诞礼盒的复古水彩插画',
    salutation: '致被星光偏爱的你：',
    lines: [
      '窗外细雪纷飞，屋里暖烛微明。',
      '不需要等待远方的奇迹，此刻的相聚就是最好的礼物。',
      '祝你圣诞快乐，不止今天，而是朝朝暮暮、年年岁岁，',
      '都能被温柔善待，把平凡日子过得闪闪发光。',
    ],
    sealText: '岁岁安康',
    footerWish: '冬日有暖 · 喜乐常随',
  },
];

interface ChristmasGiftCardModalProps {
  open: boolean;
  onClose: () => void;
  onUnwrap: () => void;
}

export const ChristmasGiftCardModal: React.FC<ChristmasGiftCardModalProps> = ({
  open,
  onClose,
  onUnwrap,
}) => {
  const [unwrapped, setUnwrapped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [signature, setSignature] = useState('圣诞夜的星光赠礼');
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const card = CHRISTMAS_CARDS[cardIndex % CHRISTMAS_CARDS.length];

  const handleOpenGift = () => {
    setUnwrapped(true);
    onUnwrap();
  };

  const handleNextCard = () => {
    setCardIndex((prev) => (prev + 1) % CHRISTMAS_CARDS.length);
    onUnwrap();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030612]/72"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-card-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[820px] max-h-[92vh] overflow-y-auto festive-scroll"
      >
        {!unwrapped ? (
          /* Step 1: Ceremonial Gift Box Waiting to Be Unwrapped */
          <div className="mx-auto max-w-md rounded-2xl bg-[#0c1328]/96 border border-[#E8C872]/55 shadow-[0_28px_90px_rgba(0,0,0,0.8)] p-8 text-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭圣诞礼盒"
              className="absolute top-3.5 right-3.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9f1239] to-[#7c1d2e] border-2 border-[#F5D061] flex items-center justify-center shadow-[0_12px_36px_rgba(245,208,97,0.3)] mb-5">
              <Gift className="w-10 h-10 text-[#FEF3C7]" aria-hidden="true" />
            </div>

            <p className="text-xs tracking-[0.22em] text-[#E8C872] font-medium">
              多人彩蛋达成 · 专属节日惊喜
            </p>
            <h2
              id="gift-card-modal-title"
              className="font-handwriting text-3xl sm:text-4xl text-white mt-3 tracking-wide"
            >
              你收到一份圣诞神秘礼盒
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              彩蛋星河已经点亮，盒中藏着一份带有水彩插画与中文手写祝福的限定圣诞贺卡，点击解开丝带开启吧。
            </p>

            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenGift}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8C872] hover:bg-[#f4d98d] text-[#090d1a] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-[0_10px_30px_rgba(232,200,114,0.35)]"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                解开丝带 · 打开圣诞贺卡
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Unfolded Chinese Handwritten Illustrated Christmas Greeting Card */
          <div className="relative rounded-2xl bg-[#FAF4E6] text-[#2D221B] border-2 border-[#D4AF5A] shadow-[0_30px_100px_rgba(0,0,0,0.82)] overflow-hidden">
            {/* Inner Antique Gold Hairline Frame */}
            <div className="m-2.5 sm:m-3.5 rounded-xl border border-[#C8A455]/55 p-4 sm:p-6">
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭圣诞贺卡"
                className="absolute top-5 right-5 z-10 p-2 rounded-lg bg-[#2D221B]/10 hover:bg-[#2D221B]/20 text-[#2D221B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-7 items-stretch">
                {/* Left Column: Fine Watercolor & Gold-Foil Illustration */}
                <div className="md:col-span-6 flex flex-col justify-center gap-3.5">
                  <div className="relative rounded-xl overflow-hidden border border-[#C8A455]/60 bg-[#1B2236] aspect-[4/3] shadow-inner">
                    {!imgErrorMap[card.id] ? (
                      <img
                        src={card.imageUrl}
                        alt={card.imageAlt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrorMap((prev) => ({ ...prev, [card.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#142038] via-[#1f2e4d] to-[#2c1c28] text-[#FAF4E6]">
                        <Sparkles className="w-8 h-8 text-[#F5D061] mb-2" aria-hidden="true" />
                        <span className="font-handwriting text-2xl">{card.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B543E] px-1">
                    <span className="font-handwriting text-lg text-[#7C2D12]">
                      {card.title}
                    </span>
                    <span className="tabular-nums">
                      典藏插画 {cardIndex + 1} / {CHRISTMAS_CARDS.length}
                    </span>
                  </div>
                </div>

                {/* Right Column: Chinese Handwritten Calligraphy Blessings */}
                <div className="md:col-span-6 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-3 pr-8">
                      <div>
                        <p className="text-[11px] tracking-[0.22em] text-[#9A7130] font-semibold">
                          MERRY CHRISTMAS · 彩蛋限定手写贺卡
                        </p>
                        <h2
                          id="gift-card-modal-title"
                          className="font-handwriting text-[28px] sm:text-[31px] text-[#7C1D2E] mt-1.5 leading-tight whitespace-nowrap"
                        >
                          圣诞快乐，万事胜意
                        </h2>
                      </div>
                      {/* Traditional Festive Vermilion Seal */}
                      <div
                        aria-hidden="true"
                        className="shrink-0 w-11 h-11 rounded-md border-2 border-[#A62639] text-[#A62639] flex items-center justify-center text-[11px] leading-tight font-serif font-bold text-center px-1 rotate-[-4deg]"
                      >
                        {card.sealText}
                      </div>
                    </div>

                    <div className="mt-5 space-y-2.5 border-t border-[#D4AF5A]/45 pt-4">
                      <p className="font-handwriting text-xl text-[#4A3525]">
                        {card.salutation}
                      </p>
                      <div className="space-y-1.5">
                        {card.lines.map((line, i) => (
                          <p
                            key={i}
                            className="font-handwriting text-[21px] sm:text-[23px] leading-[1.65] text-[#2D221B]"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Handwritten Signature & Card Actions */}
                  <div className="mt-6 pt-3.5 border-t border-[#D4AF5A]/40 space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#8A6D4B]">{card.footerWish}</span>
                      <label className="flex items-center gap-2 text-xs text-[#6B543E]">
                        <span className="sr-only">自定义贺卡落款</span>
                        <input
                          type="text"
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          maxLength={18}
                          placeholder="写下你的落款"
                          className="font-handwriting-script text-2xl text-right text-[#7C1D2E] bg-transparent border-b border-dashed border-[#C8A455]/75 focus:outline-none focus:border-[#7C1D2E] w-44 px-1"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={handleNextCard}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFE4CC] hover:bg-[#E6D5B3] text-[#4A3525] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        换一张祝福贺卡
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-[#7C1D2E] hover:bg-[#932338] text-[#FAF4E6] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        珍藏这份祝福
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
