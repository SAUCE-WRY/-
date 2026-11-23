import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Sparkles, TreePine } from 'lucide-react';
import {
  DEFAULT_THEME_ID,
  resolveActivePalette,
  type CustomColorOverrides,
} from './core/themes';
import {
  GESTURE_GUIDE,
  type GestureFrame,
  type GestureId,
} from './core/gestureClassifier';
import { getGenesisStage } from './core/treeGeometry';
import { FestiveAudioEngine } from './core/audioEngine';
import { WebcamHandTracker, type TrackerStatus } from './core/handTracker';
import {
  createChristmasTreeScene,
  type SceneControlAPI,
  type SceneMode,
} from './scene/christmasTreeScene';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { GestureManualPanel } from './components/GestureManualPanel';
import { BottomControlDock } from './components/BottomControlDock';
import { GenesisShowcaseUI } from './components/GenesisShowcaseUI';
import { BlessingModal } from './components/BlessingModal';
import { ChristmasGiftCardModal } from './components/ChristmasGiftCardModal';
import { CameraPreviewPip } from './components/CameraPreviewPip';
import { CssSnowfallBackdrop } from './components/CssSnowfallBackdrop';

const IDLE_GESTURE_FRAME: GestureFrame = {
  gesture: 'idle',
  handCount: 0,
  centerX: 0,
  centerY: 0,
  spread: 0.5,
  pointerX: 0,
  pointerY: 0,
  confidence: 0,
};

function getInitialMode(): SceneMode {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'interactive';
    if (params.get('mode') === 'genesis') return 'genesis';
  }
  return 'welcome';
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneControlAPI | null>(null);
  const audioRef = useRef<FestiveAudioEngine | null>(null);
  const trackerRef = useRef<WebcamHandTracker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<SceneMode>(getInitialMode);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [customOverrides, setCustomOverrides] = useState<Partial<CustomColorOverrides> | null>(null);
  const [auraIntensity, setAuraIntensity] = useState<number>(1.0);
  const [motionTrailsEnabled, setMotionTrailsEnabled] = useState<boolean>(true);

  const [manualOpen, setManualOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [blessingOpen, setBlessingOpen] = useState<boolean>(false);
  const [easterEggUnlocked, setEasterEggUnlocked] = useState<boolean>(false);
  const [giftCardOpen, setGiftCardOpen] = useState<boolean>(false);

  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const [cameraStatus, setCameraStatus] = useState<TrackerStatus>('idle');
  const [cameraMessage, setCameraMessage] = useState<string>('');
  const [activeGesture, setActiveGesture] = useState<GestureId>('idle');
  const [handCount, setHandCount] = useState<number>(0);

  // Genesis showcase timeline state
  const [genesisProgress, setGenesisProgress] = useState<number>(0);
  const [genesisPlaying, setGenesisPlaying] = useState<boolean>(true);
  const lastGenesisStageRef = useRef<number>(-1);

  // Refs for low-latency / throttled UI sync
  const modeRef = useRef<SceneMode>(mode);
  modeRef.current = mode;
  const lastHudSyncRef = useRef<number>(0);
  const lastLiveGestureRef = useRef<GestureId>('idle');
  const simTimeoutRef = useRef<number | null>(null);
  const simActiveRef = useRef<boolean>(false);

  const activePalette = useMemo(
    () => resolveActivePalette(selectedThemeId, customOverrides),
    [selectedThemeId, customOverrides]
  );

  // Mount Three.js WebGL scene ONCE cleanly
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const initialPalette = resolveActivePalette(DEFAULT_THEME_ID, null);
    const api = createChristmasTreeScene(mount, initialPalette);
    api.setMode(modeRef.current);
    sceneRef.current = api;

    audioRef.current = new FestiveAudioEngine();
    trackerRef.current = new WebcamHandTracker();

    return () => {
      if (simTimeoutRef.current !== null) {
        window.clearTimeout(simTimeoutRef.current);
      }
      trackerRef.current?.dispose();
      audioRef.current?.dispose();
      api.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Push palette changes smoothly into GPU shader uniforms
  useEffect(() => {
    sceneRef.current?.setPalette(activePalette);
  }, [activePalette]);

  // Push aura intensity changes smoothly
  useEffect(() => {
    sceneRef.current?.setAuraIntensity(auraIntensity);
  }, [auraIntensity]);

  // Push motion blur / particle trails toggle into 3D scene
  useEffect(() => {
    sceneRef.current?.setMotionTrails(motionTrailsEnabled);
  }, [motionTrailsEnabled]);

  // Push mode changes smoothly
  useEffect(() => {
    sceneRef.current?.setMode(mode);
    if (mode !== 'interactive') {
      sceneRef.current?.setGestureFrame(IDLE_GESTURE_FRAME);
      setActiveGesture('idle');
      setHandCount(0);
    }
  }, [mode]);

  // Genesis Showcase animation progression loop (pure timer-driven, 12.5 seconds full ceremony)
  useEffect(() => {
    if (mode !== 'genesis' || !genesisPlaying) return;

    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.06, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      setGenesisProgress((prev) => {
        const next = Math.min(1, prev + dt / 12.5);
        sceneRef.current?.setGenesisProgress(next);

        const st = getGenesisStage(next);
        if (st.id !== lastGenesisStageRef.current) {
          lastGenesisStageRef.current = st.id;
          audioRef.current?.playGenesisStageChime(st.id);
          if (st.id === 4) {
            sceneRef.current?.triggerFireworkBurst(1.1);
          }
        }

        if (next >= 1) {
          setGenesisPlaying(false);
          return 1;
        }
        return next;
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [mode, genesisPlaying]);

  const stopCamera = useCallback(() => {
    trackerRef.current?.stop(videoRef.current);
    setCameraStatus('idle');
    setCameraMessage('');
    setHandCount(0);
    if (!simActiveRef.current) {
      setActiveGesture('idle');
      sceneRef.current?.setGestureFrame(IDLE_GESTURE_FRAME);
    }
  }, []);

  const startCamera = useCallback(async () => {
    const tracker = trackerRef.current;
    const videoEl = videoRef.current;
    if (!tracker || !videoEl) return;

    audioRef.current?.unlock();

    await tracker.start(
      videoEl,
      overlayCanvasRef.current,
      (frame) => {
        if (modeRef.current !== 'interactive') return;
        if (simActiveRef.current && frame.gesture === 'idle') return;

        // Low-latency direct push to WebGL uniforms
        sceneRef.current?.setGestureFrame(frame);

        // Trigger synchronized SFX immediately when gesture transitions or while painting sparkles
        if (frame.gesture !== 'idle') {
          if (frame.gesture === 'multi_person_easter_egg') {
            setEasterEggUnlocked(true);
          }
          if (frame.gesture !== lastLiveGestureRef.current || frame.gesture === 'pointing') {
            audioRef.current?.playGestureSfx(frame.gesture);
          }
        }
        lastLiveGestureRef.current = frame.gesture;

        // Throttled HUD state sync (<= 10Hz)
        const now = performance.now();
        if (now - lastHudSyncRef.current > 110) {
          lastHudSyncRef.current = now;
          setActiveGesture(frame.gesture);
          setHandCount(frame.handCount);
        }
      },
      (status, message) => {
        setCameraStatus(status);
        setCameraMessage(message ?? '');
      }
    );
  }, []);

  const handleToggleCamera = useCallback(() => {
    if (cameraStatus === 'active' || cameraStatus === 'loading') {
      stopCamera();
    } else {
      void startCamera();
    }
  }, [cameraStatus, startCamera, stopCamera]);

  const handleToggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const playing = audio.toggleMusic();
    setMusicPlaying(playing);
  }, []);

  const handleToggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleSelectTheme = useCallback((themeId: string) => {
    setSelectedThemeId(themeId);
    setCustomOverrides(null);
  }, []);

  const handleUpdateCustomColor = useCallback(
    (key: keyof CustomColorOverrides, hex: string) => {
      setCustomOverrides((prev) => ({
        ...(prev ?? {}),
        [key]: hex,
      }));
    },
    []
  );

  const handleResetCustomColors = useCallback(() => {
    setCustomOverrides(null);
  }, []);

  const handleEnterInteractive = useCallback(
    (shouldStartCamera: boolean) => {
      audioRef.current?.unlock();
      if (!audioRef.current?.getIsMusicPlaying()) {
        audioRef.current?.startMusic();
        setMusicPlaying(true);
      }
      setMode('interactive');
      sceneRef.current?.triggerFireworkBurst(0.95);
      if (shouldStartCamera) {
        void startCamera();
      }
    },
    [startCamera]
  );

  const handleOpenGenesis = useCallback(() => {
    stopCamera();
    audioRef.current?.unlock();
    if (!audioRef.current?.getIsMusicPlaying()) {
      audioRef.current?.startMusic();
      setMusicPlaying(true);
    }
    lastGenesisStageRef.current = -1;
    setGenesisProgress(0);
    setGenesisPlaying(true);
    sceneRef.current?.setGenesisProgress(0);
    setMode('genesis');
  }, [stopCamera]);

  const handleExitGenesis = useCallback(() => {
    setGenesisPlaying(false);
    sceneRef.current?.setGenesisProgress(1);
    setMode('interactive');
  }, []);

  const handleReplayGenesis = useCallback(() => {
    lastGenesisStageRef.current = -1;
    setGenesisProgress(0);
    sceneRef.current?.setGenesisProgress(0);
    setGenesisPlaying(true);
  }, []);

  const handleScrubGenesis = useCallback((value: number) => {
    setGenesisProgress(value);
    sceneRef.current?.setGenesisProgress(value);
    lastGenesisStageRef.current = getGenesisStage(value).id;
  }, []);

  const handleOpenBlessing = useCallback(() => {
    audioRef.current?.unlock();
    audioRef.current?.playBlessingChord();
    sceneRef.current?.triggerBlessingBurst();
    setBlessingOpen(true);
  }, []);

  const handleBlessingBurstAgain = useCallback(() => {
    audioRef.current?.playBlessingChord();
    sceneRef.current?.triggerBlessingBurst();
  }, []);

  const handleOpenGiftCard = useCallback(() => {
    audioRef.current?.unlock();
    setGiftCardOpen(true);
  }, []);

  const handleUnwrapGiftCard = useCallback(() => {
    audioRef.current?.unlock();
    audioRef.current?.playGiftUnwrapChime();
    sceneRef.current?.triggerBlessingBurst();
  }, []);

  const handleToggleMotionTrails = useCallback(() => {
    setMotionTrailsEnabled((prev) => !prev);
  }, []);

  const handleSimulateGesture = useCallback((gesture: Exclude<GestureId, 'idle'>) => {
    if (modeRef.current !== 'interactive') return;

    audioRef.current?.unlock();
    audioRef.current?.playGestureSfx(gesture);

    if (simTimeoutRef.current !== null) {
      window.clearTimeout(simTimeoutRef.current);
    }

    simActiveRef.current = true;
    const isDual =
      gesture === 'two_hand_halo' ||
      gesture === 'two_hand_snowglobe' ||
      gesture === 'two_hand_meteor_shower';

    const simulatedFrame: GestureFrame = {
      gesture,
      handCount: gesture === 'multi_person_easter_egg' ? 4 : isDual ? 2 : 1,
      centerX: gesture === 'open_palm' ? 0.35 : 0,
      centerY: gesture === 'two_hand_meteor_shower' ? 0.55 : gesture === 'open_palm' ? 0.2 : 0,
      spread:
        gesture === 'two_hand_halo'
          ? 1.15
          : gesture === 'two_hand_snowglobe'
            ? 0.28
            : gesture === 'two_hand_meteor_shower'
              ? 0.9
              : gesture === 'multi_person_easter_egg'
                ? 1.3
                : 0.4,
      pointerX: 0.45,
      pointerY: 0.35,
      confidence: 1,
    };

    setActiveGesture(gesture);
    setHandCount(simulatedFrame.handCount);
    sceneRef.current?.setGestureFrame(simulatedFrame);

    if (gesture === 'victory') {
      sceneRef.current?.triggerFireworkBurst(1.1);
    } else if (gesture === 'multi_person_easter_egg') {
      setEasterEggUnlocked(true);
      sceneRef.current?.triggerFireworkBurst(1.55);
    }

    const durationMs = gesture === 'multi_person_easter_egg' ? 10000 : 6500;
    simTimeoutRef.current = window.setTimeout(() => {
      simActiveRef.current = false;
      setActiveGesture('idle');
      setHandCount(0);
      sceneRef.current?.setGestureFrame(IDLE_GESTURE_FRAME);
    }, durationMs);
  }, []);

  // Keyboard shortcuts (1-9, 0, E gestures; T motion trails; H hide/show dock; M melody; Escape close modal)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (giftCardOpen) {
          setGiftCardOpen(false);
          return;
        }
        if (blessingOpen) {
          setBlessingOpen(false);
          return;
        }
      }
      if (mode !== 'interactive') return;

      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (GESTURE_GUIDE[idx]) {
          handleSimulateGesture(GESTURE_GUIDE[idx].id);
        }
        return;
      }
      if (e.key === '0') {
        handleSimulateGesture('two_hand_meteor_shower');
        return;
      }
      if (e.key === 'e' || e.key === 'E') {
        handleSimulateGesture('multi_person_easter_egg');
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        handleToggleMotionTrails();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMusic();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [blessingOpen, giftCardOpen, handleSimulateGesture, handleToggleMotionTrails, handleToggleMusic, mode]);

  const activeGuideMeta = useMemo(
    () => GESTURE_GUIDE.find((g) => g.id === activeGesture) ?? null,
    [activeGesture]
  );

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none bg-[#050814]"
      data-mode={mode}
      data-gesture={activeGesture}
      data-theme={selectedThemeId}
      data-trails={motionTrailsEnabled ? 'on' : 'off'}
      data-easter-unlocked={easterEggUnlocked ? '1' : '0'}
    >
      {/* Lightweight GPU-Composited CSS Particle Snowfall Layer (Strictly Beneath Canvas) */}
      <CssSnowfallBackdrop
        palette={activePalette}
        activeGesture={activeGesture}
        easterEggActive={activeGesture === 'multi_person_easter_egg'}
      />

      {/* Dedicated Isolated Full-Bleed Transparent WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        data-testid="christmas-tree-canvas-container"
        className="fixed inset-0 z-10 w-full h-full"
      />

      {/* Top-Left Action (Interactive & Welcome modes): 圣诞树完整展示 */}
      {mode !== 'genesis' && (
        <div className="fixed top-4 left-4 z-30 flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenGenesis}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#080d1c]/88 hover:bg-[#121c38]/95 border border-white/15 text-xs font-semibold text-[#F5F2EB] transition-colors cursor-pointer whitespace-nowrap shadow-lg"
          >
            <TreePine className="w-4 h-4 text-[#E8C872]" aria-hidden="true" />
            <span>圣诞树完整展示</span>
          </button>

          {mode === 'interactive' && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
              <span className="font-display text-sm font-semibold text-white tracking-wide">
                星辉圣诞
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-400">
                {customOverrides ? '自定义调色' : activePalette.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Top-Right Action (Always accessible): 祝福作者 */}
      <div className="fixed top-4 right-4 z-30">
        <button
          type="button"
          onClick={handleOpenBlessing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8C872] hover:bg-[#f2d687] text-[#090d1a] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-[0_10px_30px_rgba(232,200,114,0.28)]"
        >
          <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>祝福作者</span>
        </button>
      </div>

      {/* Live Active Gesture / Multi-Person Easter Egg Feedback Banner (Top Center) */}
      {mode === 'interactive' && activeGuideMeta && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 max-w-[min(520px,84vw)] ${
            activeGesture === 'multi_person_easter_egg' ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div
            role="status"
            aria-live="polite"
            className={`rounded-2xl px-4 py-2.5 border text-center shadow-xl ${
              activeGesture === 'multi_person_easter_egg'
                ? 'bg-[#1a1306]/94 border-[#F7D570]/80 text-[#FEF3C7]'
                : 'bg-[#080d1c]/88 border-white/15 text-white'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
              {activeGesture === 'multi_person_easter_egg' && (
                <Sparkles className="w-4 h-4 text-[#F7D570] shrink-0" aria-hidden="true" />
              )}
              <span>
                {activeGesture === 'multi_person_easter_egg'
                  ? '多人同框彩蛋达成 · 星河共庆圣诞夜！'
                  : activeGuideMeta.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              {activeGuideMeta.visualFeedback}
            </p>
            {activeGesture === 'multi_person_easter_egg' && (
              <div className="mt-2.5 flex justify-center">
                <button
                  type="button"
                  data-testid="open-gift-card-btn"
                  onClick={handleOpenGiftCard}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#E8C872] hover:bg-[#f5d98a] text-[#090d1a] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-[0_6px_22px_rgba(232,200,114,0.35)]"
                >
                  <Gift className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  打开圣诞礼物 · 拆阅手写贺卡
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial Entry Palette Selection Stage */}
      {mode === 'welcome' && (
        <WelcomeOverlay
          selectedThemeId={selectedThemeId}
          activePalette={activePalette}
          customOverrides={customOverrides}
          onSelectTheme={handleSelectTheme}
          onUpdateCustomColor={handleUpdateCustomColor}
          onResetCustomColors={handleResetCustomColors}
          onEnterInteractive={handleEnterInteractive}
          onOpenGenesis={handleOpenGenesis}
        />
      )}

      {/* Main Interactive Mode Overlays */}
      {mode === 'interactive' && (
        <>
          <GestureManualPanel
            isOpen={manualOpen}
            onToggle={() => setManualOpen((prev) => !prev)}
            activeGesture={activeGesture}
            handCount={handCount}
            cameraActive={cameraStatus === 'active'}
            onSimulateGesture={handleSimulateGesture}
          />

          <BottomControlDock
            collapsed={dockCollapsed}
            onToggleCollapsed={() => setDockCollapsed((prev) => !prev)}
            cameraStatus={cameraStatus}
            onToggleCamera={handleToggleCamera}
            musicPlaying={musicPlaying}
            onToggleMusic={handleToggleMusic}
            muted={muted}
            onToggleMuted={handleToggleMuted}
            selectedThemeId={selectedThemeId}
            activePalette={activePalette}
            customOverrides={customOverrides}
            onSelectTheme={handleSelectTheme}
            onUpdateCustomColor={handleUpdateCustomColor}
            onResetCustomColors={handleResetCustomColors}
            auraIntensity={auraIntensity}
            onChangeAuraIntensity={setAuraIntensity}
            motionTrailsEnabled={motionTrailsEnabled}
            onToggleMotionTrails={handleToggleMotionTrails}
            easterEggUnlocked={easterEggUnlocked}
            onTriggerEasterEgg={() => handleSimulateGesture('multi_person_easter_egg')}
            onOpenGiftCard={handleOpenGiftCard}
            onResetCamera={() => sceneRef.current?.resetCamera()}
          />

          <CameraPreviewPip
            videoRef={videoRef}
            canvasRef={overlayCanvasRef}
            status={cameraStatus}
            statusMessage={cameraMessage}
            handCount={handCount}
          />
        </>
      )}

      {/* Dedicated Zero-Gesture Genesis Showcase Mode */}
      {mode === 'genesis' && (
        <GenesisShowcaseUI
          progress={genesisProgress}
          isPlaying={genesisPlaying}
          onTogglePlay={() => setGenesisPlaying((p) => !p)}
          onReplay={handleReplayGenesis}
          onScrub={handleScrubGenesis}
          onExitGenesis={handleExitGenesis}
          selectedThemeId={selectedThemeId}
          activePalette={activePalette}
          customOverrides={customOverrides}
          onSelectTheme={handleSelectTheme}
          onUpdateCustomColor={handleUpdateCustomColor}
          onResetCustomColors={handleResetCustomColors}
          musicPlaying={musicPlaying}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Author Blessing Modal */}
      <BlessingModal
        open={blessingOpen}
        onClose={() => setBlessingOpen(false)}
        onSendAgain={handleBlessingBurstAgain}
      />

      {/* Easter Egg Christmas Gift Box & Handwritten Greeting Card Modal */}
      <ChristmasGiftCardModal
        open={giftCardOpen}
        onClose={() => setGiftCardOpen(false)}
        onUnwrap={handleUnwrapGiftCard}
      />
    </main>
  );
}
