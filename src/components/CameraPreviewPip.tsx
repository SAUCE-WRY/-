import React from 'react';
import type { TrackerStatus } from '../core/handTracker';

interface CameraPreviewPipProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: TrackerStatus;
  statusMessage: string;
  handCount: number;
}

export const CameraPreviewPip: React.FC<CameraPreviewPipProps> = ({
  videoRef,
  canvasRef,
  status,
  statusMessage,
  handCount,
}) => {
  const showPreview = status === 'active' || status === 'loading';

  return (
    <div className="fixed right-4 bottom-24 z-20 flex flex-col items-end gap-2 pointer-events-none">
      {/* Error / Hint banner when camera cannot start */}
      {status === 'error' && statusMessage && (
        <div className="pointer-events-auto max-w-[280px] rounded-xl bg-[#080d1c]/92 border border-amber-300/35 px-3.5 py-2.5 text-xs text-amber-100 leading-relaxed shadow-xl">
          {statusMessage}
        </div>
      )}

      {/* Keep video element mounted so MediaPipe stream binds cleanly */}
      <div
        className={`relative w-[196px] h-[146px] rounded-2xl overflow-hidden border border-white/18 bg-[#070b18] shadow-[0_14px_40px_rgba(0,0,0,0.6)] transition-opacity duration-200 ${
          showPreview ? 'opacity-100 pointer-events-auto' : 'opacity-0 w-0 h-0 border-0 overflow-hidden'
        }`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
        <canvas
          ref={canvasRef}
          width={196}
          height={146}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 py-1.5 flex items-center justify-between text-[10px] text-slate-200 tabular-nums">
          <span>{status === 'loading' ? '引擎加载中…' : '手势追踪开启'}</span>
          <span>{handCount} 只手</span>
        </div>
      </div>
    </div>
  );
};
