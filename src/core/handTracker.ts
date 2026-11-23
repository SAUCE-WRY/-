import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import {
  classifyHands,
  classifySingleHand,
  IndexCircleDetector,
  type GestureFrame,
  type HandLandmark,
  type TrailSample,
} from './gestureClassifier';

export type TrackerStatus = 'idle' | 'loading' | 'active' | 'error';

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

const MODEL_URLS = [
  `${BASE_URL}models/hand_landmarker.task`,
  'https://cdn.jsdelivr.net/gh/google-ai-edge/mediapipe-samples@main/examples/hand_landmarker/android/app/src/main/assets/hand_landmarker.task',
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
];

export class WebcamHandTracker {
  private landmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;
  private rafId = 0;
  private lastVideoTime = -1;
  private running = false;
  private useMotionFallback = false;
  private prevMotionFrame: Uint8ClampedArray | null = null;
  private motionCanvas: HTMLCanvasElement | null = null;
  private circleDetector = new IndexCircleDetector();

  private async initLandmarker(): Promise<HandLandmarker | null> {
    if (this.landmarker) return this.landmarker;

    // Prefer locally bundled ABI-matched WASM, fallback to jsDelivr CDN
    const wasmBases = [
      `${BASE_URL}mediapipe-wasm`,
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm',
    ];

    let vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null = null;
    for (const wasmPath of wasmBases) {
      try {
        vision = await FilesetResolver.forVisionTasks(wasmPath);
        break;
      } catch {
        // Try next WASM base
      }
    }
    if (!vision) return null;

    for (const modelUrl of MODEL_URLS) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate,
            },
            runningMode: 'VIDEO',
            numHands: 4,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.48,
            minTrackingConfidence: 0.48,
          });
          return this.landmarker;
        } catch {
          // Try next delegate or model mirror
        }
      }
    }

    return null;
  }

  public async start(
    videoEl: HTMLVideoElement,
    overlayCanvas: HTMLCanvasElement | null,
    onFrame: (frame: GestureFrame) => void,
    onStatus: (status: TrackerStatus, message?: string) => void
  ): Promise<void> {
    if (this.running) return;
    onStatus('loading', '正在请求摄像头权限并加载手势识别引擎…');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onStatus('error', '当前浏览器不支持摄像头访问，请使用 Chrome/Edge/Safari 打开网址或按数字键 1-8 试玩');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      videoEl.srcObject = this.stream;
      videoEl.playsInline = true;
      videoEl.muted = true;
      await videoEl.play();
    } catch {
      onStatus('error', '未获取到摄像头权限，请在浏览器地址栏允许摄像头访问，或按数字键 1-8 试玩');
      return;
    }

    const landmarker = await this.initLandmarker();
    this.useMotionFallback = !landmarker;
    this.running = true;
    this.lastVideoTime = -1;
    this.prevMotionFrame = null;

    if (this.useMotionFallback) {
      onStatus('active', '摄像头已开启（动态挥手感应模式）· 挥动双手即可操控圣诞树');
    } else {
      onStatus('active', '摄像头手势识别已就绪 · 支持单手、双手与多人同框');
    }

    const detectLoop = () => {
      if (!this.running) return;
      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        const currentTime = videoEl.currentTime;
        if (currentTime !== this.lastVideoTime) {
          this.lastVideoTime = currentTime;

          if (this.landmarker && !this.useMotionFallback) {
            try {
              const nowMs = performance.now();
              const result = this.landmarker.detectForVideo(videoEl, nowMs);
              const hands: HandLandmark[][] = (result.landmarks ?? []).map((lmList) =>
                lmList.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z }))
              );

              // Track solo index-finger circular air drawing (食指划圈)
              let circleActive = false;
              if (hands.length === 1 && classifySingleHand(hands[0]).gesture === 'pointing') {
                const tip = hands[0][8];
                if (tip) {
                  circleActive = this.circleDetector.push(1 - tip.x, tip.y, nowMs);
                }
              } else {
                this.circleDetector.reset();
              }

              const frame = classifyHands(hands, {
                requireCircleForPointing: true,
                circleActive,
              });
              onFrame(frame);

              if (overlayCanvas) {
                this.drawHandOverlay(
                  overlayCanvas,
                  hands,
                  frame.gesture === 'multi_person_easter_egg',
                  this.circleDetector.getTrail(),
                  circleActive
                );
              }
            } catch {
              // Skip transient frame decode hiccup cleanly
            }
          } else {
            const motionFrame = this.detectWebcamMotionFallback(videoEl, overlayCanvas);
            onFrame(motionFrame);
          }
        }
      }
      this.rafId = requestAnimationFrame(detectLoop);
    };

    this.rafId = requestAnimationFrame(detectLoop);
  }

  /**
   * Lightweight optical motion-region fallback if external MediaPipe model CDN is unreachable.
   * Ensures real webcam waving still drives single-hand, dual-hand, and energetic firework interactions.
   */
  private detectWebcamMotionFallback(
    videoEl: HTMLVideoElement,
    overlayCanvas: HTMLCanvasElement | null
  ): GestureFrame {
    const w = 64;
    const h = 48;
    if (!this.motionCanvas) {
      this.motionCanvas = document.createElement('canvas');
      this.motionCanvas.width = w;
      this.motionCanvas.height = h;
    }
    const mCtx = this.motionCanvas.getContext('2d', { willReadFrequently: true });
    if (!mCtx) {
      return {
        gesture: 'idle',
        handCount: 0,
        centerX: 0,
        centerY: 0,
        spread: 0.5,
        pointerX: 0,
        pointerY: 0,
        confidence: 0,
      };
    }

    mCtx.drawImage(videoEl, 0, 0, w, h);
    const data = mCtx.getImageData(0, 0, w, h).data;
    const prev = this.prevMotionFrame;
    this.prevMotionFrame = new Uint8ClampedArray(data);

    if (!prev) {
      return {
        gesture: 'idle',
        handCount: 0,
        centerX: 0,
        centerY: 0,
        spread: 0.5,
        pointerX: 0,
        pointerY: 0,
        confidence: 0,
      };
    }

    let leftEnergy = 0;
    let rightEnergy = 0;
    let sumX = 0;
    let sumY = 0;
    let activePixels = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const diff =
          Math.abs(data[idx] - prev[idx]) +
          Math.abs(data[idx + 1] - prev[idx + 1]) +
          Math.abs(data[idx + 2] - prev[idx + 2]);
        if (diff > 68) {
          activePixels++;
          const mirroredX = 1 - x / w;
          sumX += mirroredX;
          sumY += 1 - y / h;
          if (mirroredX < 0.5) leftEnergy++;
          else rightEnergy++;
        }
      }
    }

    if (overlayCanvas) {
      const oCtx = overlayCanvas.getContext('2d');
      if (oCtx) {
        oCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        if (activePixels > 18) {
          const cx = (sumX / activePixels) * overlayCanvas.width;
          const cy = (1 - sumY / activePixels) * overlayCanvas.height;
          oCtx.strokeStyle = '#f7d570';
          oCtx.lineWidth = 2;
          oCtx.beginPath();
          oCtx.arc(cx, cy, 16, 0, Math.PI * 2);
          oCtx.stroke();
        }
      }
    }

    if (activePixels < 18) {
      return {
        gesture: 'idle',
        handCount: 0,
        centerX: 0,
        centerY: 0,
        spread: 0.5,
        pointerX: 0,
        pointerY: 0,
        confidence: 0,
      };
    }

    const cx = (sumX / activePixels) * 2 - 1;
    const cy = (sumY / activePixels) * 2 - 1;

    if (activePixels > 420 && leftEnergy > 140 && rightEnergy > 140) {
      return {
        gesture: 'multi_person_easter_egg',
        handCount: 3,
        centerX: cx,
        centerY: cy,
        spread: 1.3,
        pointerX: cx,
        pointerY: cy,
        confidence: 0.85,
      };
    }

    if (leftEnergy > 45 && rightEnergy > 45) {
      return {
        gesture: 'two_hand_halo',
        handCount: 2,
        centerX: cx,
        centerY: cy,
        spread: 1.05,
        pointerX: cx,
        pointerY: cy,
        confidence: 0.8,
      };
    }

    if (cy > 0.35) {
      return {
        gesture: 'victory',
        handCount: 1,
        centerX: cx,
        centerY: cy,
        spread: 0.6,
        pointerX: cx,
        pointerY: cy,
        confidence: 0.78,
      };
    }

    return {
      gesture: 'open_palm',
      handCount: 1,
      centerX: cx,
      centerY: cy,
      spread: 0.8,
      pointerX: cx,
      pointerY: cy,
      confidence: 0.78,
    };
  }

  private drawHandOverlay(
    canvas: HTMLCanvasElement,
    hands: HandLandmark[][],
    isEasterEgg: boolean,
    circleTrail: ReadonlyArray<TrailSample> = [],
    circleActive = false
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    if (hands.length === 0) return;

    const strokeColors = isEasterEgg
      ? ['#fde047', '#f472b6', '#38bdf8', '#4ade80']
      : ['#f7d570', '#7dd3fc', '#f9a8d4', '#5eead4'];

    hands.forEach((hand, hIdx) => {
      const color = strokeColors[hIdx % strokeColors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        const pa = hand[a];
        const pb = hand[b];
        if (!pa || !pb) continue;
        ctx.moveTo((1 - pa.x) * width, pa.y * height);
        ctx.lineTo((1 - pb.x) * width, pb.y * height);
      }
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      for (const pt of hand) {
        ctx.beginPath();
        ctx.arc((1 - pt.x) * width, pt.y * height, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render glowing fingertip circle trajectory when drawing circles with the index finger
    if (circleTrail.length >= 2) {
      ctx.strokeStyle = circleActive ? '#fef08a' : 'rgba(125, 211, 252, 0.78)';
      ctx.lineWidth = circleActive ? 3.2 : 2;
      ctx.beginPath();
      circleTrail.forEach((pt, idx) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  }

  public stop(videoEl?: HTMLVideoElement | null): void {
    this.running = false;
    this.prevMotionFrame = null;
    this.circleDetector.reset();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  public dispose(): void {
    this.stop(null);
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
  }
}
