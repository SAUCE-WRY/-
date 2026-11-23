import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_THEMES,
  resolveActivePalette,
  hexToRgbNormalized,
  isValidHexColor,
} from './themes';
import {
  classifyHands,
  GESTURE_GUIDE,
  IndexCircleDetector,
  isCircularTrajectory,
  type HandLandmark,
} from './gestureClassifier';
import {
  generateTreeParticles,
  generateOrnamentAnchors,
  getGenesisStage,
  GENESIS_STAGES,
} from './treeGeometry';
import {
  generateSnowflakes,
  computeEffectiveDuration,
  getSnowfallGesturePhysics,
} from './snowfall';

function makeHand(options: {
  cx?: number;
  cy?: number;
  indexUp?: boolean;
  middleUp?: boolean;
  ringUp?: boolean;
  pinkyUp?: boolean;
  thumbUp?: boolean;
  pinch?: boolean;
}): HandLandmark[] {
  const cx = options.cx ?? 0.5;
  const cy = options.cy ?? 0.65;
  const lm: HandLandmark[] = Array.from({ length: 21 }, () => ({ x: cx, y: cy, z: 0 }));

  // Wrist
  lm[0] = { x: cx, y: cy + 0.18, z: 0 };

  // MCP joints
  lm[5] = { x: cx - 0.06, y: cy, z: 0 };
  lm[9] = { x: cx, y: cy - 0.02, z: 0 };
  lm[13] = { x: cx + 0.05, y: cy, z: 0 };
  lm[17] = { x: cx + 0.1, y: cy + 0.02, z: 0 };

  // Thumb
  lm[1] = { x: cx - 0.08, y: cy + 0.12, z: 0 };
  lm[2] = { x: cx - 0.11, y: cy + 0.06, z: 0 };
  if (options.pinch) {
    lm[3] = { x: cx - 0.09, y: cy - 0.03, z: 0 };
    lm[4] = { x: cx - 0.06, y: cy - 0.1, z: 0 };
  } else if (options.thumbUp) {
    lm[3] = { x: cx - 0.14, y: cy - 0.02, z: 0 };
    lm[4] = { x: cx - 0.16, y: cy - 0.14, z: 0 };
  } else {
    lm[3] = { x: cx - 0.05, y: cy + 0.04, z: 0 };
    lm[4] = { x: cx - 0.01, y: cy + 0.03, z: 0 };
  }

  const placeFinger = (mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number, extended: boolean, pinchTarget = false) => {
    const mcp = lm[mcpIdx];
    if (pinchTarget) {
      lm[pipIdx] = { x: mcp.x, y: mcp.y - 0.06, z: 0 };
      lm[dipIdx] = { x: mcp.x, y: mcp.y - 0.09, z: 0 };
      lm[tipIdx] = { x: cx - 0.055, y: cy - 0.095, z: 0 };
    } else if (extended) {
      lm[pipIdx] = { x: mcp.x, y: mcp.y - 0.09, z: 0 };
      lm[dipIdx] = { x: mcp.x, y: mcp.y - 0.15, z: 0 };
      lm[tipIdx] = { x: mcp.x, y: mcp.y - 0.21, z: 0 };
    } else {
      lm[pipIdx] = { x: mcp.x, y: mcp.y - 0.03, z: 0 };
      lm[dipIdx] = { x: mcp.x, y: mcp.y + 0.02, z: 0 };
      lm[tipIdx] = { x: mcp.x, y: mcp.y + 0.06, z: 0 };
    }
  };

  placeFinger(5, 6, 7, 8, Boolean(options.indexUp), Boolean(options.pinch));
  placeFinger(9, 10, 11, 12, Boolean(options.middleUp));
  placeFinger(13, 14, 15, 16, Boolean(options.ringUp));
  placeFinger(17, 18, 19, 20, Boolean(options.pinkyUp));

  return lm;
}

test('themes: hex validation, RGB conversion, and custom color override resolution', () => {
  assert.equal(PRESET_THEMES.length >= 5, true);
  assert.equal(isValidHexColor('#f7d570'), true);
  assert.equal(isValidHexColor('not-a-hex'), false);

  const [r, g, b] = hexToRgbNormalized('#ff8000');
  assert.equal(r, 1);
  assert.ok(Math.abs(g - 128 / 255) < 0.001);
  assert.equal(b, 0);

  const resolved = resolveActivePalette('arctic-frost', {
    primary: '#112233',
    ribbon: 'invalid',
  });
  assert.equal(resolved.primary, '#112233');
  assert.equal(resolved.ribbon, '#f0f9ff');
});

test('gestureClassifier: detects all single-hand, dual-hand, and multi-person Easter egg states', () => {
  assert.equal(GESTURE_GUIDE.length, 11);
  assert.equal(classifyHands([]).gesture, 'idle');

  const palm = makeHand({ indexUp: true, middleUp: true, ringUp: true, pinkyUp: true, thumbUp: true });
  assert.equal(classifyHands([palm]).gesture, 'open_palm');

  const fist = makeHand({});
  assert.equal(classifyHands([fist]).gesture, 'closed_fist');

  const point = makeHand({ indexUp: true });
  assert.equal(classifyHands([point]).gesture, 'pointing');

  const victory = makeHand({ indexUp: true, middleUp: true });
  assert.equal(classifyHands([victory]).gesture, 'victory');

  const thumbsUp = makeHand({ thumbUp: true });
  assert.equal(classifyHands([thumbsUp]).gesture, 'thumbs_up');

  // Precision OK-pinch (other fingers extended)
  const pinch = makeHand({ pinch: true, middleUp: true, ringUp: true, pinkyUp: true });
  assert.equal(classifyHands([pinch]).gesture, 'pinch');

  // Single-hand Finger Heart (thumb & index tips close, middle/ring/pinky tucked)
  const fingerHeart = makeHand({ pinch: true });
  assert.equal(classifyHands([fingerHeart]).gesture, 'heart_gesture');

  // Two-hand Arch Heart (index tips touch above, thumb tips touch below)
  const leftArch = makeHand({ cx: 0.42, cy: 0.58 });
  const rightArch = makeHand({ cx: 0.58, cy: 0.58 });
  leftArch[8] = { x: 0.48, y: 0.42, z: 0 };
  rightArch[8] = { x: 0.52, y: 0.42, z: 0 };
  leftArch[4] = { x: 0.48, y: 0.56, z: 0 };
  rightArch[4] = { x: 0.52, y: 0.56, z: 0 };
  assert.equal(classifyHands([leftArch, rightArch]).gesture, 'heart_gesture');

  // Dual Effect #1: Two hands spread wide -> Twin Aurora Halo
  const twoHands = [
    makeHand({ cx: 0.25, cy: 0.65, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
    makeHand({ cx: 0.75, cy: 0.65, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
  ];
  const twoFrame = classifyHands(twoHands);
  assert.equal(twoFrame.gesture, 'two_hand_halo');
  assert.equal(twoFrame.handCount, 2);
  assert.ok(twoFrame.spread > 0.5);

  // Dual Effect #2: Two hands close together -> Crystal Snowglobe Dome
  const closeHands = [
    makeHand({ cx: 0.42, cy: 0.65, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
    makeHand({ cx: 0.58, cy: 0.65, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
  ];
  assert.equal(classifyHands(closeHands).gesture, 'two_hand_snowglobe');

  // Dual Effect #3: Two hands raised high -> Aurora Meteor Shower
  const highHands = [
    makeHand({ cx: 0.3, cy: 0.28, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
    makeHand({ cx: 0.7, cy: 0.28, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
  ];
  assert.equal(classifyHands(highHands).gesture, 'two_hand_meteor_shower');

  // Multi-person Easter egg with 3+ hands
  const threeHands = [
    makeHand({ cx: 0.2, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
    makeHand({ cx: 0.5, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
    makeHand({ cx: 0.8, indexUp: true, middleUp: true, ringUp: true, pinkyUp: true }),
  ];
  const multiFrame = classifyHands(threeHands);
  assert.equal(multiFrame.gesture, 'multi_person_easter_egg');
  assert.equal(multiFrame.handCount, 3);

  // Cooperative dual victory Easter egg
  const dualVictory = [
    makeHand({ cx: 0.3, indexUp: true, middleUp: true }),
    makeHand({ cx: 0.7, indexUp: true, middleUp: true }),
  ];
  assert.equal(classifyHands(dualVictory).gesture, 'multi_person_easter_egg');
});

test('treeGeometry: generates complete particle cloud, ornaments, and genesis stages', () => {
  const data = generateTreeParticles();
  assert.equal(data.count, 32000);
  assert.equal(data.positions.length, 32000 * 3);
  assert.equal(data.genesisStart.length, 32000 * 3);

  // Ensure no NaNs
  for (let i = 0; i < 600; i += 3) {
    assert.ok(Number.isFinite(data.positions[i]));
    assert.ok(Number.isFinite(data.genesisStart[i]));
  }

  const ornaments = generateOrnamentAnchors(64);
  assert.equal(ornaments.length, 64);

  assert.equal(getGenesisStage(0).id, 0);
  assert.equal(getGenesisStage(0.5).id, 2);
  assert.equal(getGenesisStage(1).id, GENESIS_STAGES.length - 1);
});

test('snowfall: dynamic theme snow color, speed differentiation, custom color adaptation, and deterministic flakes', () => {
  const emerald = resolveActivePalette('emerald-gold', null);
  const arctic = resolveActivePalette('arctic-frost', null);
  const ivory = resolveActivePalette('champagne-ivory', null);

  assert.notEqual(emerald.snowColor, arctic.snowColor);
  assert.ok(arctic.snowSpeed > emerald.snowSpeed);
  assert.ok(emerald.snowSpeed > ivory.snowSpeed);

  const customPalette = resolveActivePalette('emerald-gold', { aura: '#ff0088' });
  assert.notEqual(customPalette.snowColor, emerald.snowColor);
  assert.equal(isValidHexColor(customPalette.snowColor), true);

  const flakes = generateSnowflakes(76);
  assert.equal(flakes.length, 76);
  const arcticDuration = computeEffectiveDuration(flakes[0].baseDurationSec, arctic.snowSpeed);
  const ivoryDuration = computeEffectiveDuration(flakes[0].baseDurationSec, ivory.snowSpeed);
  assert.ok(arcticDuration < ivoryDuration, 'Faster arctic theme must yield shorter fall duration');

  // Gesture-reactive snowfall physics (Heart slows + enlarges + converges; Victory enlarges + bursts; OK slows to stasis)
  const heartSnow = getSnowfallGesturePhysics('heart_gesture');
  assert.equal(heartSnow.mode, 'heart-bloom');
  assert.ok(heartSnow.speedMultiplier < 0.6);
  assert.ok(heartSnow.scaleMultiplier > 1.5);
  assert.ok(heartSnow.convergeStrength > 0.4);

  const victorySnow = getSnowfallGesturePhysics('victory');
  assert.equal(victorySnow.mode, 'victory-burst');
  assert.ok(victorySnow.scaleMultiplier > 1.4);

  const okSnow = getSnowfallGesturePhysics('pinch');
  assert.equal(okSnow.mode, 'ok-stasis');
  assert.ok(okSnow.speedMultiplier < 0.4);
});

test('gestureClassifier: index-finger circle drawing detection & OK gesture copy', () => {
  const okGuide = GESTURE_GUIDE.find((g) => g.id === 'pinch');
  assert.ok(okGuide?.howTo.includes('摆出 OK 手势') || okGuide?.howTo.includes('摆出OK手势'));
  const circleGuide = GESTURE_GUIDE.find((g) => g.id === 'pointing');
  assert.ok(circleGuide?.name.includes('食指划圈'));

  // Circular path (16 points around a circle of radius 0.14) must trigger
  const circlePts = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 15) * Math.PI * 1.7;
    return { x: 0.5 + Math.cos(a) * 0.14, y: 0.5 + Math.sin(a) * 0.14 };
  });
  assert.equal(isCircularTrajectory(circlePts), true);

  // Straight horizontal line must NOT trigger circle detection
  const straightPts = Array.from({ length: 16 }, (_, i) => ({
    x: 0.2 + i * 0.03,
    y: 0.5 + (i % 2) * 0.004,
  }));
  assert.equal(isCircularTrajectory(straightPts), false);

  // Stateful detector + classifyHands gating
  const detector = new IndexCircleDetector();
  let triggered = false;
  circlePts.forEach((pt, i) => {
    triggered = detector.push(pt.x, pt.y, 1000 + i * 50);
  });
  assert.equal(triggered, true);

  const soloIndex = makeHand({ indexUp: true });
  assert.equal(
    classifyHands([soloIndex], { requireCircleForPointing: true, circleActive: false }).gesture,
    'idle'
  );
  assert.equal(
    classifyHands([soloIndex], { requireCircleForPointing: true, circleActive: true }).gesture,
    'pointing'
  );
});

