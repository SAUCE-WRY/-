export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GestureId =
  | 'idle'
  | 'open_palm'
  | 'closed_fist'
  | 'pointing'
  | 'victory'
  | 'thumbs_up'
  | 'pinch'
  | 'heart_gesture'
  | 'two_hand_halo'
  | 'two_hand_snowglobe'
  | 'two_hand_meteor_shower'
  | 'multi_person_easter_egg';

export interface GestureFrame {
  gesture: GestureId;
  handCount: number;
  /** Normalized mirrored center X in [-1, 1] (left to right) */
  centerX: number;
  /** Normalized center Y in [-1, 1] (bottom to top) */
  centerY: number;
  /** Distance between two hands or thumb-index spread in [0, 1.5] */
  spread: number;
  /** Tip coordinate for pointing trail in [-1, 1] */
  pointerX: number;
  pointerY: number;
  confidence: number;
}

export interface GestureGuideItem {
  id: Exclude<GestureId, 'idle'>;
  name: string;
  category: 'single' | 'dual' | 'multi';
  shortcut: string;
  howTo: string;
  visualFeedback: string;
  audioFeedback: string;
}

export const GESTURE_GUIDE: GestureGuideItem[] = [
  {
    id: 'open_palm',
    name: '张开手掌 · 星散绽放',
    category: 'single',
    shortcut: '1',
    howTo: '单手五指自然张开并左右轻移',
    visualFeedback: '树体粒子如星云般呼吸舒展，随掌心方位丝滑旋转视角',
    audioFeedback: '清透风铃流光和弦',
  },
  {
    id: 'closed_fist',
    name: '握紧拳头 · 引力聚核',
    category: 'single',
    shortcut: '2',
    howTo: '单手收拢成拳停顿片刻',
    visualFeedback: '周身流光星尘向树心引力坍缩蓄能，核心金光脉冲',
    audioFeedback: '低频暖色共振与星尘回吸音',
  },
  {
    id: 'pointing',
    name: '食指划圈 · 螺旋星轨漩涡',
    category: 'single',
    shortcut: '3',
    howTo: '伸出单手食指在空中顺时针或逆时针画圈',
    visualFeedback: '识别划圈轨迹后，指尖牵引出环绕圣诞树的璀璨螺旋星轨与流星漩涡',
    audioFeedback: '竖琴回旋琶音与流星风铃',
  },
  {
    id: 'victory',
    name: '比耶手势 · 极光烟花',
    category: 'single',
    shortcut: '4',
    howTo: '伸出食指与中指比出 V 字',
    visualFeedback: '树冠四周绽放绚丽圣诞烟花粒子簇与扩散光环，背景雪花随之放大闪耀',
    audioFeedback: '烟花升空与星光铃铛齐鸣',
  },
  {
    id: 'thumbs_up',
    name: '点赞手势 · 鎏金圣星加冕',
    category: 'single',
    shortcut: '5',
    howTo: '竖起大拇指保持向上',
    visualFeedback: '双股金色凤凰光柱自树底螺旋冲顶，点燃八芒圣星光爆与金雨',
    audioFeedback: '圣咏钟琴上行凯旋和弦',
  },
  {
    id: 'pinch',
    name: 'OK 手势 · 圣晶棱镜圣殿',
    category: 'single',
    shortcut: '6',
    howTo: '摆出 OK 手势（拇指与食指扣圆，其余三指自然舒展）',
    visualFeedback: '开启凝时微距圣晶结界！双层反旋水晶星盘光环、悬浮菱钻与彩球星芒同步绽放',
    audioFeedback: '圣晶钟琴与空灵棱镜泛音共鸣',
  },
  {
    id: 'heart_gesture',
    name: '比心手势 · 绯粉星心绽放',
    category: 'single',
    shortcut: '7',
    howTo: '单手拇指食指交叉比心（其余三指收拢）或双手拱形比心',
    visualFeedback: '万千流光粒子汇聚成璀璨 3D 玫瑰金悬浮爱心星环，雪花放缓变大向圣诞树温柔汇聚',
    audioFeedback: '浪漫八音盒竖琴柔情琶音',
  },
  {
    id: 'two_hand_halo',
    name: '双手展开 · 双星流光环',
    category: 'dual',
    shortcut: '8',
    howTo: '双手同时入镜并向两侧大幅拉开',
    visualFeedback: '双手化作星辰双极，拉伸出高速旋转的双螺旋极光星环',
    audioFeedback: '空灵天籁和声与双钟共鸣',
  },
  {
    id: 'two_hand_snowglobe',
    name: '双手合拢 · 时空雪球结界',
    category: 'dual',
    shortcut: '9',
    howTo: '双手于胸前柔和合拢靠近',
    visualFeedback: '树周星尘化作晶莹透明的 3D 圣诞水晶雪球穹顶，细雪沿球面旋舞',
    audioFeedback: '天使玻璃琴穹顶和声',
  },
  {
    id: 'two_hand_meteor_shower',
    name: '双手高举 · 极光流星雨',
    category: 'dual',
    shortcut: '0',
    howTo: '双手同时举高至画面上方轻轻挥动',
    visualFeedback: '冬夜苍穹划过漫天金青交织的璀璨圣诞流星雨与流光尾迹',
    audioFeedback: '连续竖琴流星划空音阶',
  },
  {
    id: 'multi_person_easter_egg',
    name: '多人同框 · 彩蛋星河与圣诞礼盒',
    category: 'multi',
    shortcut: 'E',
    howTo: '两位及以上好友共举三只及以上手掌入镜（或双人同步比耶）',
    visualFeedback: '解锁隐藏彩蛋！幻彩极光星河盛典绽放，并赠送可拆开的中文手写插画圣诞贺卡礼盒',
    audioFeedback: '盛大圣诞大教堂钟声与八音盒华彩乐章',
  },
];

function dist2D(a: HandLandmark, b: HandLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function isFingerExtended(
  landmarks: HandLandmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number
): boolean {
  const wrist = landmarks[0];
  const tipDist = dist2D(landmarks[tipIdx], wrist);
  const pipDist = dist2D(landmarks[pipIdx], wrist);
  const mcpDist = dist2D(landmarks[mcpIdx], wrist);
  return tipDist > pipDist * 1.07 && tipDist > mcpDist * 1.15;
}

function isThumbExtended(landmarks: HandLandmark[]): boolean {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  const palmWidth = Math.max(dist2D(indexMcp, pinkyMcp), 0.01);
  return (
    dist2D(thumbTip, pinkyMcp) > palmWidth * 1.15 &&
    dist2D(thumbTip, indexMcp) > dist2D(thumbIp, indexMcp) * 0.92
  );
}

export function classifySingleHand(landmarks: HandLandmark[]): {
  gesture: Exclude<
    GestureId,
    | 'idle'
    | 'two_hand_halo'
    | 'two_hand_snowglobe'
    | 'two_hand_meteor_shower'
    | 'multi_person_easter_egg'
  >;
  pinchDist: number;
} {
  if (landmarks.length < 21) {
    return { gesture: 'open_palm', pinchDist: 0.2 };
  }

  const indexExt = isFingerExtended(landmarks, 8, 6, 5);
  const middleExt = isFingerExtended(landmarks, 12, 10, 9);
  const ringExt = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);
  const thumbExt = isThumbExtended(landmarks);

  const palmScale = Math.max(dist2D(landmarks[0], landmarks[9]), 0.05);
  const pinchDist = dist2D(landmarks[4], landmarks[8]) / palmScale;
  const otherThreeExtended = [middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // Single-hand Finger Heart (比心): thumb & index tips close/crossed near upper palm,
  // while middle/ring/pinky are tucked down, and index tip is raised above knuckle
  if (
    pinchDist < 0.36 &&
    otherThreeExtended === 0 &&
    landmarks[8].y < landmarks[5].y - 0.025 &&
    landmarks[4].y < landmarks[5].y + 0.04
  ) {
    return { gesture: 'heart_gesture', pinchDist };
  }

  // OK / Precision Pinch (拇食捏合): thumb & index tips pinched while other fingers relaxed/extended
  if (pinchDist < 0.35 && otherThreeExtended >= 1) {
    return { gesture: 'pinch', pinchDist };
  }

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // Thumbs up: thumb clearly extended upward, four fingers curled
  if (thumbExt && extendedCount === 0 && landmarks[4].y < landmarks[2].y - 0.03) {
    return { gesture: 'thumbs_up', pinchDist };
  }

  // Closed fist: all 4 fingers curled and thumb not pointing up
  if (extendedCount === 0) {
    return { gesture: 'closed_fist', pinchDist };
  }

  // Victory / Peace: index & middle extended, ring & pinky curled
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'victory', pinchDist };
  }

  // Pointing: index extended, middle/ring/pinky curled
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'pointing', pinchDist };
  }

  // Open palm: 3+ fingers extended
  if (extendedCount >= 3) {
    return { gesture: 'open_palm', pinchDist };
  }

  return { gesture: 'pointing', pinchDist };
}

export interface TrailSample {
  x: number;
  y: number;
  t: number;
}

/**
 * Pure geometric detector that checks whether a recent 2D fingertip trajectory
 * traces a deliberate clockwise or counter-clockwise circle in mid-air.
 */
export function isCircularTrajectory(points: Array<{ x: number; y: number }>): boolean {
  if (points.length < 8) return false;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
    sumX += pt.x;
    sumY += pt.y;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  // Require both horizontal and vertical extent so straight lines or tiny jitter never trigger
  if (spanX < 0.065 || spanY < 0.065) return false;
  const aspect = Math.min(spanX, spanY) / Math.max(spanX, spanY);
  if (aspect < 0.32) return false;

  const cx = sumX / points.length;
  const cy = sumY / points.length;

  let totalAngle = 0;
  let positiveSteps = 0;
  let negativeSteps = 0;
  let radiusSum = 0;

  for (let i = 0; i < points.length; i++) {
    radiusSum += Math.hypot(points[i].x - cx, points[i].y - cy);
  }
  const avgRadius = radiusSum / points.length;
  if (avgRadius < 0.04) return false;

  for (let i = 1; i < points.length; i++) {
    const v1x = points[i - 1].x - cx;
    const v1y = points[i - 1].y - cy;
    const v2x = points[i].x - cx;
    const v2y = points[i].y - cy;
    const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
    if (mag < 1e-5) continue;
    const cross = v1x * v2y - v1y * v2x;
    const dot = v1x * v2x + v1y * v2y;
    const delta = Math.atan2(cross, dot);
    totalAngle += delta;
    if (delta > 0.015) positiveSteps++;
    else if (delta < -0.015) negativeSteps++;
  }

  const directionalSteps = positiveSteps + negativeSteps;
  if (directionalSteps < 6) return false;
  const consistency = Math.max(positiveSteps, negativeSteps) / directionalSteps;

  // At least ~205 degrees of consistent winding sweep around the centroid
  return Math.abs(totalAngle) >= Math.PI * 1.14 && consistency >= 0.72;
}

/**
 * Stateful real-time tracker for index-finger air-circling motion (食指划圈).
 */
export class IndexCircleDetector {
  private samples: TrailSample[] = [];
  private activeUntilMs = 0;
  private readonly windowMs: number;
  private readonly holdMs: number;

  constructor(windowMs = 1500, holdMs = 2200) {
    this.windowMs = windowMs;
    this.holdMs = holdMs;
  }

  public push(x: number, y: number, nowMs: number): boolean {
    const cutoff = nowMs - this.windowMs;
    while (this.samples.length > 0 && this.samples[0].t < cutoff) {
      this.samples.shift();
    }

    const last = this.samples[this.samples.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) >= 0.012) {
      this.samples.push({ x, y, t: nowMs });
      if (this.samples.length > 42) {
        this.samples.shift();
      }
    }

    if (isCircularTrajectory(this.samples)) {
      this.activeUntilMs = nowMs + this.holdMs;
    }

    return nowMs <= this.activeUntilMs;
  }

  public getTrail(): ReadonlyArray<TrailSample> {
    return this.samples;
  }

  public reset(): void {
    this.samples = [];
    this.activeUntilMs = 0;
  }
}

export interface ClassifyHandsOptions {
  /** When true, solo index pose only emits 'pointing' once a circular motion is confirmed */
  requireCircleForPointing?: boolean;
  /** Whether the temporal IndexCircleDetector currently confirms a circling motion */
  circleActive?: boolean;
}

/**
 * Classifies 0 to 4+ detected hands into a unified low-latency GestureFrame.
 * Coordinates are mirrored on X so moving your hand right moves the scene right.
 */
export function classifyHands(
  hands: HandLandmark[][],
  options?: ClassifyHandsOptions
): GestureFrame {
  if (!hands || hands.length === 0) {
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

  // Multi-person surprise Easter egg: 3 or more hands in frame simultaneously!
  if (hands.length >= 3) {
    let sumX = 0;
    let sumY = 0;
    for (const h of hands) {
      const palm = h[9] ?? h[0];
      sumX += 1 - palm.x;
      sumY += 1 - palm.y;
    }
    const avgX = (sumX / hands.length) * 2 - 1;
    const avgY = (sumY / hands.length) * 2 - 1;
    return {
      gesture: 'multi_person_easter_egg',
      handCount: hands.length,
      centerX: avgX,
      centerY: avgY,
      spread: 1.25,
      pointerX: avgX,
      pointerY: avgY,
      confidence: 1,
    };
  }

  // Two-hand cooperative controls (3 unique two-hand effects + two-hand heart + dual-victory Easter egg)
  if (hands.length === 2) {
    const h1 = hands[0];
    const h2 = hands[1];
    const p1 = h1[9] ?? h1[0];
    const p2 = h2[9] ?? h2[0];
    const midX = (1 - (p1.x + p2.x) * 0.5) * 2 - 1;
    const midY = (1 - (p1.y + p2.y) * 0.5) * 2 - 1;
    const palmDist = dist2D(p1, p2);
    const spread = Math.min(1.5, Math.max(0.1, palmDist * 1.9));

    const g1 = classifySingleHand(h1).gesture;
    const g2 = classifySingleHand(h2).gesture;

    // Cooperative dual victory Easter egg
    if (g1 === 'victory' && g2 === 'victory') {
      return {
        gesture: 'multi_person_easter_egg',
        handCount: 2,
        centerX: midX,
        centerY: midY,
        spread: 1.2,
        pointerX: midX,
        pointerY: midY,
        confidence: 1,
      };
    }

    // Two-hand Heart gesture: index tips touch near top AND thumb tips touch below them
    if (h1.length >= 21 && h2.length >= 21) {
      const indexTipDist = dist2D(h1[8], h2[8]);
      const thumbTipDist = dist2D(h1[4], h2[4]);
      const avgIndexY = (h1[8].y + h2[8].y) * 0.5;
      const avgThumbY = (h1[4].y + h2[4].y) * 0.5;
      if (
        (indexTipDist < 0.14 && thumbTipDist < 0.14 && avgIndexY < avgThumbY - 0.03) ||
        (g1 === 'heart_gesture' && g2 === 'heart_gesture')
      ) {
        return {
          gesture: 'heart_gesture',
          handCount: 2,
          centerX: midX,
          centerY: midY,
          spread: 0.9,
          pointerX: midX,
          pointerY: midY,
          confidence: 0.96,
        };
      }
    }

    // Dual Effect #2: Hands raised high -> Aurora Meteor Shower (极光流星雨)
    if (midY > 0.25 && palmDist >= 0.24) {
      return {
        gesture: 'two_hand_meteor_shower',
        handCount: 2,
        centerX: midX,
        centerY: midY,
        spread,
        pointerX: midX,
        pointerY: midY,
        confidence: 0.94,
      };
    }

    // Dual Effect #3: Hands brought close together -> Crystal Snowglobe Dome (时空雪球结界)
    if (palmDist < 0.28) {
      return {
        gesture: 'two_hand_snowglobe',
        handCount: 2,
        centerX: midX,
        centerY: midY,
        spread,
        pointerX: midX,
        pointerY: midY,
        confidence: 0.94,
      };
    }

    // Dual Effect #1: Hands spread wide -> Twin Aurora Halo (双星流光环)
    return {
      gesture: 'two_hand_halo',
      handCount: 2,
      centerX: midX,
      centerY: midY,
      spread,
      pointerX: midX,
      pointerY: midY,
      confidence: 0.95,
    };
  }

  // Single-hand interaction
  const hand = hands[0];
  const { gesture: rawGesture, pinchDist } = classifySingleHand(hand);
  const palm = hand[9] ?? hand[0];
  const indexTip = hand[8] ?? palm;

  const centerX = (1 - palm.x) * 2 - 1;
  const centerY = (1 - palm.y) * 2 - 1;
  const pointerX = (1 - indexTip.x) * 2 - 1;
  const pointerY = (1 - indexTip.y) * 2 - 1;

  // For live camera tracking, solo index-finger pointing requires an actual air-circle motion (食指划圈)
  const gesture: GestureId =
    rawGesture === 'pointing' && options?.requireCircleForPointing && !options.circleActive
      ? 'idle'
      : rawGesture;

  return {
    gesture,
    handCount: 1,
    centerX,
    centerY,
    spread: Math.min(1.2, Math.max(0.1, pinchDist)),
    pointerX,
    pointerY,
    confidence: gesture === 'idle' ? 0.45 : 0.92,
  };
}
