export interface ParticleAttributeData {
  count: number;
  /** Target Christmas tree positions (xyz * count) */
  positions: Float32Array;
  /** Initial scattered cosmic dust positions for Genesis mode (xyz * count) */
  genesisStart: Float32Array;
  /** Per-particle kind: 0 = canopy, 1 = ribbon, 2 = trunk/core, 3 = ambient aura, 4 = crown star sparks */
  kinds: Float32Array;
  /** Random seed / phase per particle */
  seeds: Float32Array;
  /** Base visual size per particle */
  sizes: Float32Array;
  /** Normalized height [0, 1] along tree for wave & genesis timing */
  heightNorm: Float32Array;
  /** Radial angle & distance metadata (angle, radiusNorm, layerIndex) */
  polarMeta: Float32Array;
}

export interface GenesisStage {
  id: number;
  title: string;
  subtitle: string;
  start: number;
  end: number;
}

export const GENESIS_STAGES: GenesisStage[] = [
  {
    id: 0,
    title: '一 · 星尘初醒',
    subtitle: '冬夜深空的万千星尘悄然苏醒，回应冬日召唤',
    start: 0.0,
    end: 0.18,
  },
  {
    id: 1,
    title: '二 · 鎏金树脊',
    subtitle: '暖金光脉汇聚成挺拔树干，扎根雪域星台',
    start: 0.18,
    end: 0.36,
  },
  {
    id: 2,
    title: '三 · 翠影成形',
    subtitle: '七重松枝自下而上螺旋舒展，织就繁密华冠',
    start: 0.36,
    end: 0.68,
  },
  {
    id: 3,
    title: '四 · 流光缠绕',
    subtitle: '双螺旋流光彩带轻盈跃起，彩球与星辉缀满枝梢',
    start: 0.68,
    end: 0.88,
  },
  {
    id: 4,
    title: '五 · 冠星加冕',
    subtitle: '八芒圣星于树巅璀璨绽放，圣诞奇境完美落成',
    start: 0.88,
    end: 1.01,
  },
];

export function getGenesisStage(progress: number): GenesisStage {
  const clamped = Math.max(0, Math.min(1, progress));
  for (const stage of GENESIS_STAGES) {
    if (clamped >= stage.start && clamped < stage.end) {
      return stage;
    }
  }
  return GENESIS_STAGES[GENESIS_STAGES.length - 1];
}

/** Deterministic Mulberry32 PRNG for reproducible, evenly balanced aesthetics */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TreeDimensions {
  baseY: number;
  treeHeight: number;
  maxRadius: number;
  tiers: number;
}

export const TREE_DIMENSIONS: TreeDimensions = {
  baseY: -3.2,
  treeHeight: 7.4,
  maxRadius: 2.85,
  tiers: 7,
};

/**
 * Generates 30,000+ layered Christmas tree particles with graceful pine tiers,
 * double-helix light ribbons, glowing core trunk, floating aura field, and crown sparks.
 */
export function generateTreeParticles(
  counts = {
    canopy: 19000,
    ribbon: 4600,
    trunk: 1800,
    aura: 5600,
    crown: 1000,
  },
  seed = 20261225
): ParticleAttributeData {
  const total =
    counts.canopy + counts.ribbon + counts.trunk + counts.aura + counts.crown;
  const positions = new Float32Array(total * 3);
  const genesisStart = new Float32Array(total * 3);
  const kinds = new Float32Array(total);
  const seeds = new Float32Array(total);
  const sizes = new Float32Array(total);
  const heightNorm = new Float32Array(total);
  const polarMeta = new Float32Array(total * 3);

  const rand = createSeededRandom(seed);
  const { baseY, treeHeight, maxRadius, tiers } = TREE_DIMENSIONS;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  let idx = 0;

  const setParticle = (
    x: number,
    y: number,
    z: number,
    kind: number,
    size: number,
    hNorm: number,
    angle: number,
    rNorm: number,
    layerIndex: number
  ) => {
    const i3 = idx * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Scattered starry nebula start position for Genesis mode
    const gTheta = rand() * Math.PI * 2;
    const gPhi = Math.acos(2 * rand() - 1);
    const gDist = 6.5 + rand() * 8.5;
    genesisStart[i3] = Math.sin(gPhi) * Math.cos(gTheta) * gDist;
    genesisStart[i3 + 1] = Math.cos(gPhi) * gDist * 0.65 + 0.5;
    genesisStart[i3 + 2] = Math.sin(gPhi) * Math.sin(gTheta) * gDist;

    kinds[idx] = kind;
    seeds[idx] = rand();
    sizes[idx] = size;
    heightNorm[idx] = Math.max(0, Math.min(1, hNorm));
    polarMeta[i3] = angle;
    polarMeta[i3 + 1] = rNorm;
    polarMeta[i3 + 2] = layerIndex;
    idx++;
  };

  // 1. Sculpted Pine Canopy (7 sweeping evergreen tiers with natural branch scallops)
  for (let i = 0; i < counts.canopy; i++) {
    // Slightly denser toward the lower-middle boughs for lush realistic silhouette
    const u = Math.pow(rand(), 0.78);
    const h = u;
    const tierFloat = h * tiers;
    const tierIndex = Math.min(tiers - 1, Math.floor(tierFloat));
    const tierLocal = tierFloat - tierIndex; // 0 at bottom of tier, 1 at top

    // Taper envelope with dramatic evergreen tier flare
    const globalCone = Math.pow(1 - h, 0.92);
    const tierFlare = 0.68 + 0.42 * (1 - tierLocal);
    const maxRAtH = maxRadius * globalCone * tierFlare;

    // Distribute mostly along outer bough shell + soft inner pine depth
    const radialWeight = rand() < 0.76 ? 0.52 + 0.48 * Math.pow(rand(), 0.45) : 0.15 + 0.45 * rand();
    const angle = i * goldenAngle + (rand() - 0.5) * 0.35;

    // Natural fluted pine-branch lobes (7-10 radiating boughs per tier)
    const lobeCount = 6 + Math.round((1 - h) * 4);
    const lobeWave = 0.86 + 0.18 * Math.cos(angle * lobeCount + tierIndex * 1.15);
    const r = maxRAtH * radialWeight * lobeWave;

    // Graceful branch droop at outer tips
    const droop = radialWeight * radialWeight * (1 - h * 0.65) * 0.34;
    const y = baseY + 0.62 + h * (treeHeight - 0.72) - droop + (rand() - 0.5) * 0.08;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const size = (0.85 + rand() * 1.45) * (radialWeight > 0.82 ? 1.18 : 0.92);
    setParticle(x, y, z, 0, size, h, angle, radialWeight, tierIndex);
  }

  // 2. Double-Helix Flowing Light Ribbons (流光溢彩丝带)
  for (let i = 0; i < counts.ribbon; i++) {
    const strand = i % 2;
    const t = i / counts.ribbon;
    const turns = 5.5;
    const baseAngle = t * Math.PI * 2 * turns + strand * Math.PI;
    const coneR = maxRadius * Math.pow(1 - t, 0.9) * 1.06 + 0.12;

    // Ribbon width & gentle vertical silk spread
    const jitterR = (rand() - 0.5) * 0.16;
    const jitterY = (rand() - 0.5) * 0.14;
    const r = Math.max(0.08, coneR + jitterR);
    const y = baseY + 0.65 + t * (treeHeight - 0.85) + jitterY;
    const x = Math.cos(baseAngle) * r;
    const z = Math.sin(baseAngle) * r;

    const size = 1.15 + rand() * 1.65;
    setParticle(x, y, z, 1, size, t, baseAngle, 1.0, strand);
  }

  // 3. Warm Golden Core & Trunk (鎏金树脊)
  for (let i = 0; i < counts.trunk; i++) {
    const h = rand();
    const isBaseTrunk = h < 0.18;
    const y = baseY + h * (treeHeight * 0.88);
    const maxTrunkR = isBaseTrunk ? 0.36 * (1 - h * 1.5) : 0.22 * (1 - h * 0.75);
    const r = maxTrunkR * Math.sqrt(rand());
    const angle = rand() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const size = isBaseTrunk ? 1.1 + rand() * 0.9 : 0.9 + rand() * 1.1;
    setParticle(x, y, z, 2, size, h * 0.85, angle, r / 0.36, 0);
  }

  // 4. Ambient Swirling Aurora & Snowdrift Aura (树周流光溢彩粒子特效)
  for (let i = 0; i < counts.aura; i++) {
    const isRing = i < counts.aura * 0.45;
    if (isRing) {
      // Sweeping orbital aurora streams around the tree
      const t = rand();
      const angle = rand() * Math.PI * 2;
      const radius = 3.1 + Math.pow(rand(), 0.7) * 4.4;
      const y = baseY + 0.2 + t * (treeHeight + 1.8) + Math.sin(angle * 2.0) * 0.55;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const size = 0.85 + rand() * 1.9;
      setParticle(x, y, z, 3, size, t, angle, radius / 7.5, 1);
    } else {
      // Delicate falling winter starlight & snow sparkles
      const angle = rand() * Math.PI * 2;
      const radius = 1.4 + Math.sqrt(rand()) * 8.2;
      const y = baseY - 0.3 + rand() * (treeHeight + 3.4);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const size = 0.7 + rand() * 1.5;
      setParticle(x, y, z, 3, size, (y - baseY) / (treeHeight + 3.4), angle, radius / 9.6, 0);
    }
  }

  // 5. Crown Star Halo Sparks (顶星华彩)
  const starY = baseY + treeHeight + 0.12;
  for (let i = 0; i < counts.crown; i++) {
    const ray = i % 8;
    const rayAngle = (ray / 8) * Math.PI * 2;
    const dist = Math.pow(rand(), 1.4) * 0.92;
    const spreadAngle = rayAngle + (rand() - 0.5) * 0.28;
    const phi = (rand() - 0.5) * Math.PI * 0.65;
    const x = Math.cos(spreadAngle) * Math.cos(phi) * dist;
    const y = starY + Math.sin(phi) * dist * 0.85 + (rand() - 0.5) * 0.15;
    const z = Math.sin(spreadAngle) * Math.cos(phi) * dist;
    const size = 1.3 + rand() * 2.1;
    setParticle(x, y, z, 4, size, 1.0, spreadAngle, dist, ray);
  }

  return {
    count: total,
    positions,
    genesisStart,
    kinds,
    seeds,
    sizes,
    heightNorm,
    polarMeta,
  };
}

/**
 * Generates anchor coordinates for hanging 3D PBR jewel ornaments on the tree boughs.
 */
export function generateOrnamentAnchors(count = 72, seed = 991225): Array<{
  x: number;
  y: number;
  z: number;
  scale: number;
  variant: number;
}> {
  const rand = createSeededRandom(seed);
  const { baseY, treeHeight, maxRadius } = TREE_DIMENSIONS;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const anchors: Array<{ x: number; y: number; z: number; scale: number; variant: number }> = [];

  for (let i = 0; i < count; i++) {
    const t = 0.08 + (i / count) * 0.82;
    const angle = i * goldenAngle * 2.1 + rand() * 0.25;
    const r = maxRadius * Math.pow(1 - t, 0.92) * (0.88 + rand() * 0.12);
    const y = baseY + 0.65 + t * (treeHeight - 0.85);
    anchors.push({
      x: Math.cos(angle) * r,
      y,
      z: Math.sin(angle) * r,
      scale: 0.78 + rand() * 0.44,
      variant: i % 3,
    });
  }

  return anchors;
}
