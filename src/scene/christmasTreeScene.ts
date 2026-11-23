import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  generateOrnamentAnchors,
  generateTreeParticles,
  TREE_DIMENSIONS,
} from '../core/treeGeometry';
import type { GestureFrame } from '../core/gestureClassifier';
import type { TreePalette } from '../core/themes';

export type SceneMode = 'welcome' | 'interactive' | 'genesis';

export interface SceneControlAPI {
  setPalette: (palette: TreePalette) => void;
  setGestureFrame: (frame: GestureFrame) => void;
  setMode: (mode: SceneMode) => void;
  setGenesisProgress: (progress: number) => void;
  setAuraIntensity: (intensity: number) => void;
  setMotionTrails: (enabled: boolean) => void;
  triggerBlessingBurst: () => void;
  triggerFireworkBurst: (intensity?: number) => void;
  resetCamera: () => void;
  getParticleCount: () => number;
  dispose: () => void;
}

const _tmpColor = new THREE.Color();
const _tmpColor2 = new THREE.Color();
const _dummy = new THREE.Object3D();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createSnowMicroReliefTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.6 + Math.random() * 2.2;
    const v = Math.floor(95 + Math.random() * 145);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarCoronaTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 4, half, half, half);
  grad.addColorStop(0, 'rgba(255, 250, 224, 0.92)');
  grad.addColorStop(0.24, 'rgba(252, 217, 118, 0.52)');
  grad.addColorStop(0.55, 'rgba(232, 178, 72, 0.16)');
  grad.addColorStop(1, 'rgba(232, 178, 72, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Delicate 4-ray diffraction flare
  ctx.save();
  ctx.translate(half, half);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    const rayGrad = ctx.createLinearGradient(-half * 0.9, 0, half * 0.9, 0);
    rayGrad.addColorStop(0, 'rgba(255, 244, 198, 0)');
    rayGrad.addColorStop(0.5, 'rgba(255, 247, 214, 0.42)');
    rayGrad.addColorStop(1, 'rgba(255, 244, 198, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(-half * 0.9, -2.2, size * 0.9, 4.4);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a true 3D diamond-faceted star BufferGeometry where every ray rises
 * sharply to front and back pyramidal crests for rich metallic reflections.
 */
function createFaceted3DStarGeometry(
  points: number,
  outerR: number,
  innerR: number,
  apexZ: number
): THREE.BufferGeometry {
  const ring: Array<[number, number]> = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ring.push([Math.cos(a) * r, Math.sin(a) * r]);
  }

  const verts: number[] = [];
  const total = ring.length;
  for (let i = 0; i < total; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % total];
    // Front pyramid facet
    verts.push(0, 0, apexZ, x1, y1, 0, x2, y2, 0);
    // Back pyramid facet (reversed winding for outward normal)
    verts.push(0, 0, -apexZ, x2, y2, 0, x1, y1, 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Museum-grade Composite Faceted Christmas Topper Star (THREE.Group)
 * featuring a diamond-cut 3D champagne-gold star, interlocking platinum starburst,
 * clearcoat crystal heart jewel, volumetric corona glow, double filigree rings, and brass finial.
 */
function createCompositeTopperStar(): {
  group: THREE.Group;
  starMat: THREE.MeshPhysicalMaterial;
  coreMat: THREE.MeshPhysicalMaterial;
  outerRing: THREE.Mesh;
  innerRing: THREE.Mesh;
  secondaryStar: THREE.Mesh;
  coronaSprite: THREE.Sprite;
} {
  const group = new THREE.Group();

  // 1. Primary 8-point 3D diamond-cut faceted champagne-gold star
  const primaryGeo = createFaceted3DStarGeometry(8, 0.56, 0.21, 0.18);
  const starMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f9dc7e'),
    emissive: new THREE.Color('#c27d16'),
    emissiveIntensity: 0.62,
    metalness: 0.96,
    roughness: 0.11,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    flatShading: true,
  });
  const starMesh = new THREE.Mesh(primaryGeo, starMat);
  group.add(starMesh);

  // 2. Interlocking rotated 8-point platinum-silver needle starburst for layered jewelry depth
  const secondaryGeo = createFaceted3DStarGeometry(8, 0.43, 0.12, 0.11);
  const secondaryMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fff9eb'),
    emissive: new THREE.Color('#9e7c38'),
    emissiveIntensity: 0.42,
    metalness: 0.92,
    roughness: 0.14,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    flatShading: true,
  });
  const secondaryStar = new THREE.Mesh(secondaryGeo, secondaryMat);
  secondaryStar.rotation.z = Math.PI / 8;
  group.add(secondaryStar);

  // 3. Cut-diamond central jewel core with gold bezel setting
  const coreGeo = new THREE.IcosahedronGeometry(0.155, 0);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fffdf4'),
    emissive: new THREE.Color('#fde68a'),
    emissiveIntensity: 1.45,
    metalness: 0.2,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    flatShading: true,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.scale.set(1, 1, 1.25);
  group.add(coreMesh);

  const bezelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e8be5a'),
    metalness: 0.95,
    roughness: 0.16,
  });
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.018, 12, 32), bezelMat);
  group.add(bezel);

  // 4. Outer celestial brushed-brass orbital ring with 8 pearl accent beads
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f3cd6c'),
    emissive: new THREE.Color('#825410'),
    emissiveIntensity: 0.38,
    metalness: 0.95,
    roughness: 0.18,
    clearcoat: 0.85,
  });
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.017, 14, 56), ringMat);
  outerRing.rotation.x = Math.PI * 0.24;
  group.add(outerRing);

  // 5. Inner pearl-silver counter-tilted ring
  const innerRingMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f8fafc'),
    emissive: new THREE.Color('#cbd5e1'),
    emissiveIntensity: 0.34,
    metalness: 0.82,
    roughness: 0.26,
    clearcoat: 0.8,
  });
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.012, 12, 44), innerRingMat);
  innerRing.rotation.y = Math.PI * 0.35;
  innerRing.rotation.x = -Math.PI * 0.22;
  group.add(innerRing);

  // 6. Lathe-turned luxury brass finial collar & mounting stem
  const stemProfile = [
    new THREE.Vector2(0.0, -0.62),
    new THREE.Vector2(0.062, -0.56),
    new THREE.Vector2(0.036, -0.44),
    new THREE.Vector2(0.088, -0.32),
    new THREE.Vector2(0.048, -0.22),
    new THREE.Vector2(0.065, -0.16),
  ];
  const stemGeo = new THREE.LatheGeometry(stemProfile, 24);
  const stemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ddb14c'),
    metalness: 0.92,
    roughness: 0.24,
  });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  group.add(stemMesh);

  // 7. Eight star-pearl accent beads orbiting the outer halo ring
  const beadGeo = new THREE.OctahedronGeometry(0.036, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bead = new THREE.Mesh(beadGeo, i % 2 === 0 ? coreMat : starMat);
    bead.position.set(Math.cos(angle) * 0.62, Math.sin(angle) * 0.62, 0);
    outerRing.add(bead);
  }

  // 8. Soft volumetric golden-ivory starlight corona halo behind the faceted star
  const coronaMat = new THREE.SpriteMaterial({
    map: createStarCoronaTexture(),
    color: new THREE.Color('#ffe7a8'),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const coronaSprite = new THREE.Sprite(coronaMat);
  coronaSprite.scale.set(2.15, 2.15, 1);
  group.add(coronaSprite);

  return { group, starMat, coreMat, outerRing, innerRing, secondaryStar, coronaSprite };
}

/**
 * Dedicated 3D Sacred Crystal Astrolabe Halo that materializes during the OK gesture (pinch).
 */
function createOkPrismAstrolabe(): {
  group: THREE.Group;
  outerHoop: THREE.Mesh;
  innerHoop: THREE.Mesh;
  gems: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.position.set(0, 0.95, 0);

  const outerMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#bae6fd'),
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 0.95,
    metalness: 0.75,
    roughness: 0.08,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.82,
  });
  const outerHoop = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.022, 12, 72), outerMat);
  outerHoop.rotation.x = Math.PI * 0.44;
  group.add(outerHoop);

  const innerMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fef08a'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.9,
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.85,
  });
  const innerHoop = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.018, 12, 64), innerMat);
  innerHoop.rotation.x = Math.PI * 0.56;
  innerHoop.rotation.y = Math.PI * 0.16;
  group.add(innerHoop);

  const gemGeo = new THREE.OctahedronGeometry(0.14, 0);
  const gemMatCyan = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#e0f7ff'),
    emissive: new THREE.Color('#7dd3fc'),
    emissiveIntensity: 1.25,
    metalness: 0.35,
    roughness: 0.04,
    clearcoat: 1.0,
    flatShading: true,
  });
  const gemMatGold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fff7d6'),
    emissive: new THREE.Color('#facc15'),
    emissiveIntensity: 1.15,
    metalness: 0.88,
    roughness: 0.08,
    clearcoat: 1.0,
    flatShading: true,
  });

  const gems: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const gem = new THREE.Mesh(gemGeo, i % 2 === 0 ? gemMatCyan : gemMatGold);
    gem.position.set(Math.cos(angle) * 2.95, Math.sin(angle) * 2.95, 0);
    gem.scale.set(0.85, 1.45, 0.85);
    outerHoop.add(gem);
    gems.push(gem);
  }

  group.scale.setScalar(0.001);
  group.visible = false;
  return { group, outerHoop, innerHoop, gems };
}

/**
 * Composite 5-part festive gift box (pivoted bottom-center at y=0).
 */
function createCompositeGiftBox(
  w: number,
  h: number,
  d: number,
  boxColor: string,
  ribbonColor: string
): THREE.Group {
  const group = new THREE.Group();

  const boxMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(boxColor),
    roughness: 0.72,
    metalness: 0.12,
  });
  const lidMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(boxColor).multiplyScalar(1.12),
    roughness: 0.58,
    metalness: 0.18,
  });
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(ribbonColor),
    emissive: new THREE.Color(ribbonColor),
    emissiveIntensity: 0.15,
    roughness: 0.24,
    metalness: 0.84,
  });

  // 1. Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.82, d), boxMat);
  body.position.y = (h * 0.82) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 2. Overhanging lid
  const lidH = h * 0.22;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w * 1.07, lidH, d * 1.07), lidMat);
  lid.position.y = h * 0.82 + lidH * 0.4;
  lid.castShadow = true;
  group.add(lid);

  // 3. Cross satin ribbons
  const band1 = new THREE.Mesh(new THREE.BoxGeometry(w * 1.09, h * 1.02, Math.min(w, d) * 0.17), ribbonMat);
  band1.position.y = h * 0.51;
  group.add(band1);

  const band2 = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w, d) * 0.17, h * 1.02, d * 1.09), ribbonMat);
  band2.position.y = h * 0.51;
  group.add(band2);

  // 4. Sculpted twin ribbon bow loops on top
  const loopGeo = new THREE.TorusGeometry(Math.min(w, d) * 0.18, Math.min(w, d) * 0.04, 10, 20);
  const bowL = new THREE.Mesh(loopGeo, ribbonMat);
  bowL.position.set(-Math.min(w, d) * 0.12, h + 0.07, 0);
  bowL.rotation.z = 0.55;
  bowL.rotation.y = 0.35;
  group.add(bowL);

  const bowR = new THREE.Mesh(loopGeo, ribbonMat);
  bowR.position.set(Math.min(w, d) * 0.12, h + 0.07, 0);
  bowR.rotation.z = -0.55;
  bowR.rotation.y = -0.35;
  group.add(bowR);

  return group;
}

/**
 * Composite winter plinth, velvet tree skirt, brass trim ring, contact shadow, and gift boxes.
 */
function createCompositeBaseAndGifts(
  baseY: number,
  snowBumpTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  trimMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  group.position.y = baseY;

  // 1. Sculpted snow mound plinth (LatheGeometry, matte snow roughness 0.86)
  const moundProfile = [
    new THREE.Vector2(0.0, 0.08),
    new THREE.Vector2(1.4, 0.06),
    new THREE.Vector2(2.7, 0.0),
    new THREE.Vector2(3.55, -0.09),
    new THREE.Vector2(3.85, -0.2),
    new THREE.Vector2(0.0, -0.2),
  ];
  const moundGeo = new THREE.LatheGeometry(moundProfile, 48);
  const moundMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#131b31'),
    roughness: 0.86,
    metalness: 0.05,
    bumpMap: snowBumpTex,
    bumpScale: 0.03,
  });
  const mound = new THREE.Mesh(moundGeo, moundMat);
  mound.receiveShadow = true;
  group.add(mound);

  // 2. Brushed champagne brass ceremonial rim around the pedestal
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e6c269'),
    emissive: new THREE.Color('#6b4d12'),
    emissiveIntensity: 0.3,
    metalness: 0.94,
    roughness: 0.2,
  });
  const trimRing = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.036, 12, 72), trimMat);
  trimRing.rotation.x = Math.PI / 2;
  trimRing.position.y = -0.07;
  group.add(trimRing);

  // 3. Inner royal velvet tree skirt ring
  const skirtProfile = [
    new THREE.Vector2(0.32, 0.36),
    new THREE.Vector2(0.65, 0.22),
    new THREE.Vector2(1.42, 0.1),
    new THREE.Vector2(1.52, 0.07),
  ];
  const skirtMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1d2744'),
    roughness: 0.88,
    metalness: 0.06,
  });
  const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtProfile, 36), skirtMat);
  skirt.receiveShadow = true;
  group.add(skirt);

  // 4. Soft radial contact shadow beneath plinth
  const shadowGeo = new THREE.CircleGeometry(4.6, 40);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -0.22;
  group.add(shadowDisc);

  // 5. Five grounded festive gift boxes nestled around the skirt
  const giftSpecs = [
    { x: 1.48, z: 0.98, w: 0.56, h: 0.46, d: 0.56, rot: 0.35, box: '#8b1e3f', rib: '#f5d061' },
    { x: -1.52, z: 0.88, w: 0.64, h: 0.38, d: 0.5, rot: -0.45, box: '#1b4965', rib: '#f3d88b' },
    { x: 0.38, z: 1.78, w: 0.46, h: 0.52, d: 0.46, rot: 0.18, box: '#1f5e43', rib: '#f8d57e' },
    { x: -0.75, z: -1.58, w: 0.6, h: 0.44, d: 0.54, rot: 0.72, box: '#6b274b', rib: '#fde68a' },
    { x: 1.66, z: -0.85, w: 0.48, h: 0.36, d: 0.48, rot: -0.28, box: '#2a3d66', rib: '#f5d061' },
  ];

  for (const g of giftSpecs) {
    const gift = createCompositeGiftBox(g.w, g.h, g.d, g.box, g.rib);
    gift.position.set(g.x, 0.04, g.z);
    gift.rotation.y = g.rot;
    group.add(gift);
  }

  return { group, trimMat };
}

const TREE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBloom;
  uniform float uImplode;
  uniform float uGoldenWave;
  uniform float uDualHalo;
  uniform float uHandSpread;
  uniform float uEasterEgg;
  uniform float uGenesis;
  uniform float uAuraIntensity;
  uniform float uPointerActive;
  uniform vec3 uPointerWorld;
  uniform float uFireworkTime;
  uniform float uFireworkIntensity;
  uniform float uBlessingPulse;
  uniform float uPinchPrism;
  uniform float uHeartMode;
  uniform float uSnowglobe;
  uniform float uMeteorShower;

  attribute vec3 aGenesisStart;
  attribute float aKind;
  attribute float aSeed;
  attribute float aSize;
  attribute float aHeightNorm;
  attribute vec3 aPolar;

  varying float vKind;
  varying float vSeed;
  varying float vHeightNorm;
  varying float vSparkle;
  varying float vGlowBoost;
  varying float vAlpha;

  void main() {
    vKind = aKind;
    vSeed = aSeed;
    vHeightNorm = aHeightNorm;

    vec3 targetPos = position;
    float angle = aPolar.x;
    float rNorm = aPolar.y;
    float layerIdx = aPolar.z;

    // Gentle living winter breath & spiral drift
    float breath = sin(uTime * 1.45 + aHeightNorm * 5.2 + aSeed * 6.2831) * 0.055;
    vec3 radialDir = normalize(vec3(targetPos.x, 0.0, targetPos.z) + vec3(0.0001));

    if (aKind < 0.5) {
      // Canopy boughs: delicate sway + open-palm bloom + fist implode
      targetPos += radialDir * (breath * rNorm);
      targetPos += radialDir * (uBloom * (0.6 + rNorm * 2.4) * (0.55 + aSeed * 0.9));
      targetPos.y += uBloom * (aSeed - 0.35) * 1.35;

      // Gravitational core implosion
      vec3 coreTarget = vec3(0.0, 0.35, 0.0);
      targetPos = mix(targetPos, coreTarget + radialDir * (0.28 + aSeed * 0.35), uImplode * 0.72);

      // Upgraded Thumbs-Up: subtle upward buoyant shimmer along pine tiers
      targetPos.y += uGoldenWave * sin(uTime * 4.0 - aHeightNorm * 10.0) * 0.12;
    } else if (aKind < 1.5) {
      // Flowing double-helix light ribbon: continuously streams upward & orbits
      float ribbonSpeed = 0.55 + uDualHalo * 1.4 + uEasterEgg * 1.8 + uGoldenWave * 1.5;
      float rot = uTime * ribbonSpeed;
      float cs = cos(rot);
      float sn = sin(rot);
      vec2 xz = mat2(cs, -sn, sn, cs) * targetPos.xz;
      targetPos.xz = xz;
      float expandR = 1.0 + uBloom * 0.55 + uDualHalo * (0.25 + uHandSpread * 0.45) - uImplode * 0.55 + uGoldenWave * 0.14;
      targetPos.xz *= expandR;
      targetPos.y += sin(uTime * 2.2 + aHeightNorm * 10.0) * 0.08 + uGoldenWave * 0.18;
    } else if (aKind < 2.5) {
      // Golden trunk core
      targetPos.xz *= (1.0 - uImplode * 0.35 + uBloom * 0.3);
    } else if (aKind < 3.5) {
      // Ambient swirling aurora & falling snow sparkles around the tree
      if (layerIdx > 0.5) {
        // Sweeping orbital aurora streams
        float orbitSpeed = (0.35 + aSeed * 0.45) * (1.0 + uDualHalo * 1.9 + uEasterEgg * 2.3);
        float a = angle + uTime * orbitSpeed;
        float baseR = length(position.xz);
        float targetR = baseR * (1.0 + uDualHalo * (uHandSpread - 0.5) * 0.55 - uImplode * 0.52);
        targetPos.x = cos(a) * targetR;
        targetPos.z = sin(a) * targetR;
        targetPos.y = position.y + sin(uTime * 1.2 + a * 2.0) * (0.45 + uDualHalo * 0.85);
      } else {
        // Gentle drifting snow starlight
        float fallSpeed = 0.42 + aSeed * 0.45 + uMeteorShower * 1.6;
        float span = 10.8;
        float yWrap = mod(position.y - uTime * fallSpeed + 3.5, span) - 3.5;
        targetPos.y = yWrap;
        targetPos.x += sin(uTime * 0.7 + aSeed * 12.0) * 0.45 - uMeteorShower * (mod(uTime * 2.4 + aSeed * 8.0, 6.0) - 3.0) * 0.45;
        targetPos.z += cos(uTime * 0.65 + aSeed * 10.0) * 0.45;
      }

      // Upgraded OK Gesture: coalesce aura into twin counter-rotating 8-facet crystal astrolabe rings!
      if (uPinchPrism > 0.01) {
        float isInnerRing = step(0.5, layerIdx);
        float dir = mix(1.0, -1.35, isInnerRing);
        float ringAngle = aSeed * 6.283185 + uTime * 1.05 * dir;
        float facet = 0.90 + 0.16 * cos(ringAngle * 8.0);
        float pr = (mix(3.05, 2.38, isInnerRing) + 0.55 * fract(aSeed * 13.7)) * facet;
        vec3 prismPos = vec3(
          cos(ringAngle) * pr,
          0.95 + sin(ringAngle * 2.0) * 0.45 + (isInnerRing - 0.5) * 0.55,
          sin(ringAngle) * pr
        );
        float tilt = mix(0.32, -0.38, isInnerRing);
        float ct = cos(tilt);
        float st = sin(tilt);
        prismPos.yz = mat2(ct, -st, st, ct) * (prismPos.yz - vec2(0.95, 0.0)) + vec2(0.95, 0.0);
        targetPos = mix(targetPos, prismPos, uPinchPrism * 0.92);
      }

      // New Heart Gesture: morph aura sparkles into a luminous 3D Rose-Gold Heart Constellation!
      if (uHeartMode > 0.01) {
        float t = aSeed * 6.283185;
        float hx = 16.0 * pow(sin(t), 3.0);
        float hy = 13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t);
        float shell = 0.21 + 0.055 * sin(uTime * 2.6 + aSeed * 17.0);
        float heartYaw = uTime * 0.55;
        float ch = cos(heartYaw);
        float sh = sin(heartYaw);
        vec3 heartPos = vec3(
          hx * shell,
          hy * shell + 1.55,
          (fract(aSeed * 29.3) - 0.5) * 1.15
        );
        heartPos.xz = mat2(ch, -sh, sh, ch) * heartPos.xz;
        targetPos = mix(targetPos, heartPos, uHeartMode * 0.9);
      }

      // New Dual-Hand Effect #2: Crystal Snowglobe Dome encapsulating the Christmas tree!
      if (uSnowglobe > 0.01) {
        float phi = acos(clamp(1.0 - 2.0 * aHeightNorm, -0.98, 0.98));
        float theta = angle + uTime * (0.45 + 0.35 * aHeightNorm);
        float domeR = 4.55 + sin(phi * 10.0 + uTime * 2.0) * 0.08;
        vec3 domePos = vec3(
          sin(phi) * cos(theta) * domeR,
          cos(phi) * domeR + 0.65,
          sin(phi) * sin(theta) * domeR
        );
        domePos.y = max(-3.1, domePos.y);
        targetPos = mix(targetPos, domePos, uSnowglobe * 0.92);
      }

      // Index-finger air-circling gesture (食指划圈): helical luminous vortex ribbon spiraling around the tree!
      if (uPointerActive > 0.01) {
        float spiralT = fract(aSeed + uTime * 0.32);
        float spiralAngle = spiralT * 18.8495 + uTime * 2.8 + layerIdx * 3.14159;
        float spiralR = mix(3.45, 0.85, spiralT) + 0.25 * sin(uTime * 3.5 + aSeed * 12.0);
        vec3 vortexPos = vec3(
          cos(spiralAngle) * spiralR + uPointerWorld.x * 0.16,
          mix(-2.6, 4.15, spiralT) + uPointerWorld.y * 0.08,
          sin(spiralAngle) * spiralR
        );
        targetPos = mix(targetPos, vortexPos, uPointerActive * (0.72 + 0.24 * aSeed));
      }
    } else {
      // Crown star sparks: dramatic golden flare on Thumbs-Up!
      float pulse = 1.0 + 0.22 * sin(uTime * 3.6 + aSeed * 6.28) + uGoldenWave * 1.05 + uEasterEgg * 0.8 + uPinchPrism * 0.45;
      vec3 starCenter = vec3(0.0, 4.32 + uGoldenWave * 0.25, 0.0);
      targetPos = starCenter + (position - vec3(0.0, 4.32, 0.0)) * pulse;
    }

    // Multi-person Easter egg: dramatic celestial galaxy swirl & iridescent expansion
    if (uEasterEgg > 0.01) {
      float vortexAngle = uEasterEgg * (0.85 + aHeightNorm * 2.4) * sin(uTime * 1.3 + aHeightNorm * 3.0);
      float cv = cos(vortexAngle);
      float sv = sin(vortexAngle);
      targetPos.xz = mat2(cv, -sv, sv, cv) * targetPos.xz;
      targetPos += radialDir * (uEasterEgg * sin(uTime * 3.0 + aHeightNorm * 9.0) * 0.32);
    }

    // Victory / Easter egg firework shockwave lift
    if (uFireworkIntensity > 0.01 && aKind > 2.5) {
      float wave = sin(uFireworkTime * 4.2 - aSeed * 6.2831);
      targetPos += radialDir * (uFireworkIntensity * (0.4 + 0.7 * aSeed) * max(0.0, wave));
      targetPos.y += uFireworkIntensity * 0.65 * aSeed;
    }

    // Genesis Showcase mode: assemble from cosmic dust -> trunk -> canopy -> ribbons -> crown star
    float stageReveal = 1.0;
    if (uGenesis < 0.999) {
      float startT = 0.0;
      float endT = 0.25;
      if (aKind > 1.5 && aKind < 2.5) {
        startT = 0.12 + aHeightNorm * 0.16;
        endT = startT + 0.18;
      } else if (aKind < 0.5) {
        startT = 0.26 + aHeightNorm * 0.36;
        endT = startT + 0.18;
      } else if (aKind < 1.5) {
        startT = 0.58 + aHeightNorm * 0.22;
        endT = startT + 0.14;
      } else if (aKind > 3.5) {
        startT = 0.82;
        endT = 0.98;
      } else {
        startT = 0.02 + aSeed * 0.15;
        endT = startT + 0.26;
      }

      float localP = smoothstep(startT, endT, uGenesis);
      float spin = (1.0 - localP) * (3.2 + aSeed * 3.8);
      float cSpin = cos(spin);
      float sSpin = sin(spin);
      vec3 swirledStart = aGenesisStart;
      swirledStart.xz = mat2(cSpin, -sSpin, sSpin, cSpin) * swirledStart.xz;
      targetPos = mix(swirledStart, targetPos, localP);
      stageReveal = mix(0.28, 1.0, smoothstep(0.0, 0.18, uGenesis) * (0.35 + 0.65 * localP));
    }

    // Upgraded Thumbs-Up twin golden ascending phoenix spirals
    float waveDist1 = abs(aHeightNorm - fract(uTime * 1.05));
    float waveDist2 = abs(aHeightNorm - fract(uTime * 1.05 + 0.5));
    float goldenHighlight = uGoldenWave * (smoothstep(0.24, 0.0, waveDist1) + smoothstep(0.2, 0.0, waveDist2) * 0.75);

    // Sparkle & twinkle
    float twinkleSpeed = (aKind > 0.5 && aKind < 1.5) ? 5.2 : 3.2;
    float twinkle = 0.55 + 0.45 * sin(uTime * twinkleSpeed + aSeed * 43.17);
    vSparkle = twinkle;
    vGlowBoost =
      goldenHighlight * 1.55 +
      uBlessingPulse * (0.6 + 0.6 * aSeed) +
      uEasterEgg * 0.75 +
      uFireworkIntensity * 0.5 +
      uPinchPrism * 0.65 +
      uHeartMode * 0.7 +
      uSnowglobe * 0.55;

    float auraVisibility = (aKind > 2.5 && aKind < 3.5) ? (0.45 + 0.75 * uAuraIntensity) : 1.0;
    vAlpha = stageReveal * auraVisibility;

    vec4 mvPosition = modelViewMatrix * vec4(targetPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float sizeBoost = 1.0 + goldenHighlight * 0.85 + uEasterEgg * 0.28 + uBlessingPulse * 0.35 + uPinchPrism * 0.26 + uHeartMode * 0.25;
    float perspectiveSize = aSize * sizeBoost * (29.0 / max(1.5, -mvPosition.z));
    gl_PointSize = clamp(perspectiveSize * uPixelRatio, 1.4, 28.0);
  }
`;

const TREE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uRibbonColor;
  uniform vec3 uAuraColor;
  uniform float uTime;
  uniform float uEasterEgg;
  uniform float uGoldenWave;
  uniform float uBlessingPulse;
  uniform float uPinchPrism;
  uniform float uHeartMode;
  uniform float uSnowglobe;

  varying float vKind;
  varying float vSeed;
  varying float vHeightNorm;
  varying float vSparkle;
  varying float vGlowBoost;
  varying float vAlpha;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    // Luminous 6-ray star-bokeh radial falloff with crisp diamond diffraction
    float core = exp(-d * d * 26.0);
    float halo = pow(max(0.0, 1.0 - d * 2.0), 2.05) * 0.68;
    float crossSpark = exp(-abs(uv.x) * 28.0) * exp(-abs(uv.y) * 5.2) +
                       exp(-abs(uv.y) * 28.0) * exp(-abs(uv.x) * 5.2);
    float diagSpark = exp(-abs(uv.x + uv.y) * 22.0) * exp(-abs(uv.x - uv.y) * 6.0) * (0.35 + uPinchPrism * 0.55);
    float shape = core + halo + (crossSpark * (0.24 + uPinchPrism * 0.48) + diagSpark * 0.25) * vSparkle;

    vec3 col;
    if (vKind < 0.5) {
      // Richer evergreen velvet depth: deeper shadow core transitioning to gilded bough tips
      float tipMix = clamp(vHeightNorm * 0.48 + vSeed * 0.62, 0.0, 1.0);
      vec3 deepBase = uPrimaryColor * 0.72;
      col = mix(deepBase, uSecondaryColor * 1.12, smoothstep(0.12, 0.92, tipMix));
      float isFairyLight = step(0.86, vSeed);
      col = mix(col, mix(uRibbonColor * 1.32, vec3(1.0, 0.97, 0.86), 0.35), isFairyLight * (0.68 + 0.32 * vSparkle));
    } else if (vKind < 1.5) {
      float crest = 0.65 + 0.35 * sin(uTime * 4.2 - vHeightNorm * 14.0);
      col = mix(uRibbonColor, vec3(1.0, 0.98, 0.9), crest * 0.52);
    } else if (vKind < 2.5) {
      col = mix(vec3(0.58, 0.38, 0.16), uRibbonColor, 0.45 + 0.35 * vHeightNorm);
    } else if (vKind < 3.5) {
      col = mix(uAuraColor, uSecondaryColor, vSeed * 0.5);
      col = mix(col, vec3(0.95, 0.98, 1.0), 0.35 * vSparkle);
    } else {
      col = mix(uRibbonColor, vec3(1.0, 0.99, 0.94), 0.68);
    }

    // Upgraded Thumbs-Up golden ascending crown radiance
    col = mix(col, vec3(1.0, 0.87, 0.42), clamp(uGoldenWave * (0.35 + vGlowBoost * 0.42), 0.0, 0.92));

    // Upgraded OK gesture crystalline diamond & prismatic rainbow-frost shimmer
    if (uPinchPrism > 0.01) {
      vec3 diamondFrost = mix(vec3(0.74, 0.96, 1.0), vec3(1.0, 0.93, 0.68), fract(vSeed * 7.3 + uTime * 0.3));
      float okWeight = (vKind > 2.5) ? 0.84 : (step(0.84, vSeed) * 0.55);
      col = mix(col, diamondFrost, uPinchPrism * okWeight);
    }

    // Heart gesture romantic rose-gold & cherry-blossom luminance
    if (uHeartMode > 0.01) {
      vec3 roseGold = mix(vec3(1.0, 0.48, 0.72), vec3(1.0, 0.86, 0.64), vSeed);
      float heartWeight = (vKind > 2.5 && vKind < 3.5) ? 0.88 : 0.32;
      col = mix(col, roseGold, uHeartMode * heartWeight);
    }

    // Snowglobe crystal dome ice-pearl refraction
    if (uSnowglobe > 0.01 && vKind > 2.5 && vKind < 3.5) {
      col = mix(col, vec3(0.84, 0.95, 1.0), uSnowglobe * 0.78);
    }

    // Warm rose-gold blessing shower tint
    col = mix(col, vec3(1.0, 0.82, 0.68), clamp(uBlessingPulse * 0.55, 0.0, 0.7));

    // Multi-person Easter egg prismatic aurora iridescence (vivid jewel hues without white-out)
    if (uEasterEgg > 0.01) {
      float hue = fract(vHeightNorm * 0.85 + uTime * 0.22 + vSeed * 0.35);
      vec3 prism = hsv2rgb(vec3(hue, 0.78, 0.96));
      col = mix(col, prism, uEasterEgg * 0.74);
    }

    float easterSoftener = mix(1.0, 0.74, uEasterEgg);
    float intensity = (0.72 + 0.38 * vSparkle + vGlowBoost * 0.25) * easterSoftener;
    float alpha = clamp(shape * vAlpha * (0.58 + 0.36 * vSparkle) * mix(1.0, 0.82, uEasterEgg), 0.0, 1.0);
    gl_FragColor = vec4(col * intensity, alpha);
  }
`;

const TRAIL_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTrailsEnabled;
  uniform float uTrailLag;
  uniform float uBloom;
  uniform float uImplode;
  uniform float uDualHalo;
  uniform float uHandSpread;
  uniform float uEasterEgg;
  uniform float uGenesis;

  attribute float aKind;
  attribute float aSeed;
  attribute float aGhostStep;
  attribute float aHeightNorm;

  varying float vGhostStep;
  varying float vKind;
  varying float vSeed;
  varying float vAlpha;

  void main() {
    vGhostStep = aGhostStep;
    vKind = aKind;
    vSeed = aSeed;

    vec3 pos = position;
    vec3 radialDir = normalize(vec3(pos.x, 0.0, pos.z) + vec3(0.0001));

    if (aKind < 0.5) {
      pos += radialDir * (uBloom * (0.5 + aSeed * 1.4));
      pos = mix(pos, vec3(0.0, 0.35, 0.0) + radialDir * 0.35, uImplode * 0.65);
    } else if (aKind < 1.5) {
      float ribbonSpeed = 0.55 + uDualHalo * 1.4 + uEasterEgg * 1.8;
      float rot = uTime * ribbonSpeed;
      float cs = cos(rot);
      float sn = sin(rot);
      pos.xz = mat2(cs, -sn, sn, cs) * pos.xz;
      pos.xz *= (1.0 + uBloom * 0.5 + uDualHalo * (0.25 + uHandSpread * 0.4) - uImplode * 0.5);
    } else if (aKind > 2.5 && aKind < 3.5) {
      float orbitSpeed = (0.35 + aSeed * 0.45) * (1.0 + uDualHalo * 1.9 + uEasterEgg * 2.3);
      float a = uTime * orbitSpeed;
      float cs = cos(a);
      float sn = sin(a);
      pos.xz = mat2(cs, -sn, sn, cs) * pos.xz;
    }

    // Temporal angular trail lag proportional to real-time rig velocity & gesture spin
    float lagAngle = -uTrailLag * aGhostStep;
    float cl = cos(lagAngle);
    float sl = sin(lagAngle);
    pos.xz = mat2(cl, -sl, sl, cl) * pos.xz;
    pos.y -= uTrailLag * aGhostStep * 0.06;

    float ghostFade = (aGhostStep < 1.5) ? 0.46 : (aGhostStep < 2.5 ? 0.25 : 0.12);
    float motionVis = smoothstep(0.015, 0.14, abs(uTrailLag) + 0.06);
    vAlpha = uTrailsEnabled * ghostFade * motionVis * smoothstep(0.45, 0.95, uGenesis);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float baseSize = (aKind > 0.5 && aKind < 1.5) ? 1.85 : 1.45;
    float shrink = 1.0 - (aGhostStep - 1.0) * 0.18;
    float pSize = baseSize * shrink * (28.0 / max(1.5, -mvPosition.z));
    gl_PointSize = clamp(pSize * uPixelRatio, 1.0, 22.0);
  }
`;

const TRAIL_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSecondaryColor;
  uniform vec3 uRibbonColor;
  uniform vec3 uAuraColor;
  uniform float uEasterEgg;
  uniform float uHeartMode;
  uniform float uTime;

  varying float vGhostStep;
  varying float vKind;
  varying float vSeed;
  varying float vAlpha;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    if (vAlpha <= 0.008) discard;
    vec2 uv = gl_PointCoord - vec2(0.5);
    // Subtle horizontally stretched comet streak for velvety motion-blur feel
    vec2 stretched = vec2(uv.x * 0.72, uv.y * 1.18);
    float d = length(stretched);
    if (d > 0.5) discard;

    float glow = exp(-d * d * 18.0);
    vec3 col = (vKind > 0.5 && vKind < 1.5)
      ? uRibbonColor
      : (vKind > 2.5 ? uAuraColor : uSecondaryColor);

    if (uHeartMode > 0.01) {
      col = mix(col, vec3(1.0, 0.62, 0.8), uHeartMode * 0.65);
    }
    if (uEasterEgg > 0.01) {
      vec3 prism = hsv2rgb(vec3(fract(vSeed + uTime * 0.25), 0.75, 1.0));
      col = mix(col, prism, uEasterEgg * 0.7);
    }

    gl_FragColor = vec4(col * 1.05, glow * vAlpha);
  }
`;

/** Dedicated burst system for Victory fireworks, Easter egg sky blooms, and Blessing star showers */
interface BurstParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
}

export function createChristmasTreeScene(
  container: HTMLElement,
  initialPalette: TreePalette
): SceneControlAPI {
  const isSoftwareGl = detectSoftwareGl();

  const scene = new THREE.Scene();
  const skyColor = new THREE.Color(initialPalette.skyTint);
  // Keep scene background transparent so the lightweight CSS snowfall backdrop beneath the canvas shines through
  scene.background = null;
  scene.fog = new THREE.FogExp2(skyColor.getHex(), 0.036);

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 240);

  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 120);
  camera.position.set(1.8, 1.65, 13.6);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Mandatory Studio PBR RoomEnvironment reflection on every device
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  // Warm/Cool 3-point festive studio lighting rig
  const hemiLight = new THREE.HemisphereLight(0x8cb8ff, 0x161d34, 0.95);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffe1b0, 2.2);
  keyLight.position.set(6, 10, 7);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 28;
  keyLight.shadow.camera.left = -7;
  keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x6fa8ff, 1.1);
  rimLight.position.set(-7, 5, -6);
  scene.add(rimLight);

  const starPointLight = new THREE.PointLight(0xffdc88, 3.2, 12, 1.6);
  starPointLight.position.set(0, TREE_DIMENSIONS.baseY + TREE_DIMENSIONS.treeHeight + 0.35, 0);
  scene.add(starPointLight);

  // OrbitControls with damped interaction
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.6, 0);
  controls.enablePan = false;
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.minDistance = 6.2;
  controls.maxDistance = 19.5;
  controls.minPolarAngle = Math.PI * 0.14;
  controls.maxPolarAngle = Math.PI * 0.64;
  controls.update();

  let userDragging = false;
  controls.addEventListener('start', () => {
    userDragging = true;
  });
  controls.addEventListener('end', () => {
    userDragging = false;
  });

  // Main hero pivot group (rotates smoothly with gesture/auto-turn)
  const treeRig = new THREE.Group();
  scene.add(treeRig);

  // 1. Composite grounded plinth & festive gift boxes
  const snowBumpTex = createSnowMicroReliefTexture(renderer.capabilities.getMaxAnisotropy());
  const baseBundle = createCompositeBaseAndGifts(TREE_DIMENSIONS.baseY, snowBumpTex);
  treeRig.add(baseBundle.group);

  // 2. Museum-grade Faceted 3D Diamond Topper Star
  const starBundle = createCompositeTopperStar();
  starBundle.group.position.set(0, TREE_DIMENSIONS.baseY + TREE_DIMENSIONS.treeHeight + 0.25, 0);
  treeRig.add(starBundle.group);

  // 2b. Dedicated 3D Sacred Crystal Astrolabe Halo for upgraded OK gesture
  const okPrismBundle = createOkPrismAstrolabe();
  treeRig.add(okPrismBundle.group);

  // 3. Instanced clearcoat glass-blown PBR baubles + brushed-gold crown caps
  const ornamentAnchors = generateOrnamentAnchors(72);
  const ornamentGeo = new THREE.SphereGeometry(0.118, 20, 16);
  const ornamentMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.11,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color('#281608'),
    emissiveIntensity: 0.28,
  });
  const ornamentMesh = new THREE.InstancedMesh(ornamentGeo, ornamentMat, ornamentAnchors.length);
  ornamentMesh.frustumCulled = false;

  const capGeo = new THREE.CylinderGeometry(0.032, 0.042, 0.045, 10);
  const capMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f3cf72'),
    metalness: 0.95,
    roughness: 0.18,
  });
  const ornamentCapMesh = new THREE.InstancedMesh(capGeo, capMat, ornamentAnchors.length);
  ornamentCapMesh.frustumCulled = false;

  const updateOrnamentPalette = (pal: TreePalette, scaleMultiplier = 1) => {
    const cRibbon = new THREE.Color(pal.ribbon);
    const cOrn = new THREE.Color(pal.ornament);
    const cSec = new THREE.Color(pal.secondary);
    ornamentAnchors.forEach((a, idx) => {
      const s = a.scale * scaleMultiplier;
      _dummy.position.set(a.x, a.y, a.z);
      _dummy.rotation.set(idx * 0.3, idx * 0.7, 0);
      _dummy.scale.setScalar(s);
      _dummy.updateMatrix();
      ornamentMesh.setMatrixAt(idx, _dummy.matrix);

      // Place tiny brushed-gold ornament cap right atop each bauble
      _dummy.position.set(a.x, a.y + 0.118 * s, a.z);
      _dummy.rotation.set(0, idx * 0.5, 0);
      _dummy.scale.setScalar(s);
      _dummy.updateMatrix();
      ornamentCapMesh.setMatrixAt(idx, _dummy.matrix);

      const chosen = a.variant === 0 ? cRibbon : a.variant === 1 ? cOrn : cSec;
      ornamentMesh.setColorAt(idx, chosen);
    });
    ornamentMesh.instanceMatrix.needsUpdate = true;
    ornamentCapMesh.instanceMatrix.needsUpdate = true;
    if (ornamentMesh.instanceColor) ornamentMesh.instanceColor.needsUpdate = true;
    ornamentMesh.computeBoundingSphere();
    ornamentCapMesh.computeBoundingSphere();
  };
  updateOrnamentPalette(initialPalette, 1);
  treeRig.add(ornamentMesh);
  treeRig.add(ornamentCapMesh);

  // 4. Massive 32,000-particle Christmas Tree & Flowing Aurora Cloud
  const particleData = generateTreeParticles();
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
  particleGeo.setAttribute('aGenesisStart', new THREE.BufferAttribute(particleData.genesisStart, 3));
  particleGeo.setAttribute('aKind', new THREE.BufferAttribute(particleData.kinds, 1));
  particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(particleData.seeds, 1));
  particleGeo.setAttribute('aSize', new THREE.BufferAttribute(particleData.sizes, 1));
  particleGeo.setAttribute('aHeightNorm', new THREE.BufferAttribute(particleData.heightNorm, 1));
  particleGeo.setAttribute('aPolar', new THREE.BufferAttribute(particleData.polarMeta, 3));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uPrimaryColor: { value: new THREE.Color(initialPalette.primary) },
    uSecondaryColor: { value: new THREE.Color(initialPalette.secondary) },
    uRibbonColor: { value: new THREE.Color(initialPalette.ribbon) },
    uAuraColor: { value: new THREE.Color(initialPalette.aura) },
    uBloom: { value: 0 },
    uImplode: { value: 0 },
    uGoldenWave: { value: 0 },
    uDualHalo: { value: 0 },
    uHandSpread: { value: 0.5 },
    uEasterEgg: { value: 0 },
    uGenesis: { value: 1 },
    uAuraIntensity: { value: 1 },
    uPointerActive: { value: 0 },
    uPointerWorld: { value: new THREE.Vector3(0, 1.0, 2.0) },
    uFireworkTime: { value: 0 },
    uFireworkIntensity: { value: 0 },
    uBlessingPulse: { value: 0 },
    uPinchPrism: { value: 0 },
    uHeartMode: { value: 0 },
    uSnowglobe: { value: 0 },
    uMeteorShower: { value: 0 },
  };

  const particleMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: TREE_VERTEX_SHADER,
    fragmentShader: TREE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particlePoints = new THREE.Points(particleGeo, particleMat);
  particlePoints.frustumCulled = false;
  treeRig.add(particlePoints);

  // 4b. Dedicated 3D Multi-Ghost Particle Motion Blur / Trails System (toggleable via setMotionTrails)
  const TRAIL_GHOSTS = 3;
  const trailSampleIndices: number[] = [];
  for (let i = 0; i < particleData.count; i++) {
    const kind = particleData.kinds[i];
    // Sample flowing ribbons densely, plus shimmering outer canopy tips and orbital aurora
    if (
      (kind > 0.5 && kind < 1.5 && i % 2 === 0) ||
      (kind < 0.5 && i % 10 === 0) ||
      (kind > 2.5 && kind < 3.5 && i % 6 === 0)
    ) {
      trailSampleIndices.push(i);
    }
  }
  const totalTrailVerts = trailSampleIndices.length * TRAIL_GHOSTS;
  const trailPositions = new Float32Array(totalTrailVerts * 3);
  const trailKinds = new Float32Array(totalTrailVerts);
  const trailSeeds = new Float32Array(totalTrailVerts);
  const trailGhosts = new Float32Array(totalTrailVerts);
  const trailHeights = new Float32Array(totalTrailVerts);

  let tCursor = 0;
  for (let s = 0; s < trailSampleIndices.length; s++) {
    const src = trailSampleIndices[s];
    const px = particleData.positions[src * 3];
    const py = particleData.positions[src * 3 + 1];
    const pz = particleData.positions[src * 3 + 2];
    const k = particleData.kinds[src];
    const sd = particleData.seeds[src];
    const hn = particleData.heightNorm[src];
    for (let g = 1; g <= TRAIL_GHOSTS; g++) {
      trailPositions[tCursor * 3] = px;
      trailPositions[tCursor * 3 + 1] = py;
      trailPositions[tCursor * 3 + 2] = pz;
      trailKinds[tCursor] = k;
      trailSeeds[tCursor] = sd;
      trailGhosts[tCursor] = g;
      trailHeights[tCursor] = hn;
      tCursor++;
    }
  }

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeo.setAttribute('aKind', new THREE.BufferAttribute(trailKinds, 1));
  trailGeo.setAttribute('aSeed', new THREE.BufferAttribute(trailSeeds, 1));
  trailGeo.setAttribute('aGhostStep', new THREE.BufferAttribute(trailGhosts, 1));
  trailGeo.setAttribute('aHeightNorm', new THREE.BufferAttribute(trailHeights, 1));

  const trailUniforms = {
    uTime: uniforms.uTime,
    uPixelRatio: uniforms.uPixelRatio,
    uTrailsEnabled: { value: 1.0 },
    uTrailLag: { value: 0.08 },
    uBloom: uniforms.uBloom,
    uImplode: uniforms.uImplode,
    uDualHalo: uniforms.uDualHalo,
    uHandSpread: uniforms.uHandSpread,
    uEasterEgg: uniforms.uEasterEgg,
    uGenesis: uniforms.uGenesis,
    uHeartMode: uniforms.uHeartMode,
    uSecondaryColor: uniforms.uSecondaryColor,
    uRibbonColor: uniforms.uRibbonColor,
    uAuraColor: uniforms.uAuraColor,
  };

  const trailMat = new THREE.ShaderMaterial({
    uniforms: trailUniforms,
    vertexShader: TRAIL_VERTEX_SHADER,
    fragmentShader: TRAIL_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const trailPoints = new THREE.Points(trailGeo, trailMat);
  trailPoints.frustumCulled = false;
  treeRig.add(trailPoints);

  // 5. Dedicated Dynamic Burst / Firework / Blessing Particle System (2,400 particles)
  const MAX_BURST = 2400;
  const burstPositions = new Float32Array(MAX_BURST * 3);
  const burstColors = new Float32Array(MAX_BURST * 3);
  const burstAlphas = new Float32Array(MAX_BURST);
  const burstPool: BurstParticle[] = [];

  for (let i = 0; i < MAX_BURST; i++) {
    burstPool.push({
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1,
      r: 1,
      g: 0.9,
      b: 0.6,
    });
    burstPositions[i * 3 + 1] = -999;
  }

  const burstGeo = new THREE.BufferGeometry();
  const burstPosAttr = new THREE.BufferAttribute(burstPositions, 3);
  const burstColAttr = new THREE.BufferAttribute(burstColors, 3);
  const burstAlphaAttr = new THREE.BufferAttribute(burstAlphas, 1);
  burstGeo.setAttribute('position', burstPosAttr);
  burstGeo.setAttribute('aColor', burstColAttr);
  burstGeo.setAttribute('aAlpha', burstAlphaAttr);

  const burstMat = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      attribute vec3 aColor;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp((42.0 / max(1.5, -mvPosition.z)) * uPixelRatio * (0.4 + 0.8 * aAlpha), 1.5, 22.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.01) discard;
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        float glow = exp(-d * d * 22.0) + pow(max(0.0, 1.0 - d * 2.0), 2.0) * 0.5;
        gl_FragColor = vec4(vColor * 1.35, glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const burstPoints = new THREE.Points(burstGeo, burstMat);
  burstPoints.frustumCulled = false;
  scene.add(burstPoints);

  let burstCursor = 0;
  const spawnBurstCluster = (
    cx: number,
    cy: number,
    cz: number,
    count: number,
    speed: number,
    paletteColors: THREE.Color[],
    heartShaped = false
  ) => {
    for (let i = 0; i < count; i++) {
      const p = burstPool[burstCursor];
      burstCursor = (burstCursor + 1) % MAX_BURST;

      let vx: number;
      let vy: number;
      let vz: number;

      if (heartShaped) {
        // Parametric glowing heart burst for the Author Blessing celebration!
        const t = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const spread = 0.08 + Math.random() * 0.04;
        vx = hx * spread * speed * 0.25;
        vy = hy * spread * speed * 0.25 + 0.55;
        vz = (Math.random() - 0.5) * speed * 0.45;
      } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const mag = speed * (0.45 + Math.random() * 0.75);
        vx = Math.sin(phi) * Math.cos(theta) * mag;
        vy = Math.cos(phi) * mag + 0.4;
        vz = Math.sin(phi) * Math.sin(theta) * mag;
      }

      const c = paletteColors[i % paletteColors.length];
      p.x = cx;
      p.y = cy;
      p.z = cz;
      p.vx = vx;
      p.vy = vy;
      p.vz = vz;
      p.life = 1.6 + Math.random() * 1.1;
      p.maxLife = p.life;
      p.r = c.r;
      p.g = c.g;
      p.b = c.b;
    }
  };

  // Distant winter night starfield backdrop (purely procedural, 1,200 stars)
  const bgStarCount = 1200;
  const bgStarPos = new Float32Array(bgStarCount * 3);
  for (let i = 0; i < bgStarCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dist = 28 + Math.random() * 28;
    bgStarPos[i * 3] = Math.sin(phi) * Math.cos(theta) * dist;
    bgStarPos[i * 3 + 1] = Math.abs(Math.cos(phi)) * dist * 0.8 - 2;
    bgStarPos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * dist;
  }
  const bgStarGeo = new THREE.BufferGeometry();
  bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
  const bgStarMat = new THREE.PointsMaterial({
    color: 0xdbeafe,
    size: 0.14,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const bgStars = new THREE.Points(bgStarGeo, bgStarMat);
  scene.add(bgStars);

  // Target animated state (smoothly damped each frame)
  let currentPalette = initialPalette;
  const targetPrimary = new THREE.Color(initialPalette.primary);
  const targetSecondary = new THREE.Color(initialPalette.secondary);
  const targetRibbon = new THREE.Color(initialPalette.ribbon);
  const targetAura = new THREE.Color(initialPalette.aura);
  const targetSky = new THREE.Color(initialPalette.skyTint);

  let mode: SceneMode = 'welcome';
  let targetGenesis = 1.0;
  let targetAuraIntensity = 1.0;

  let currentGesture: GestureFrame = {
    gesture: 'idle',
    handCount: 0,
    centerX: 0,
    centerY: 0,
    spread: 0.5,
    pointerX: 0,
    pointerY: 0,
    confidence: 0,
  };

  let targetBloom = 0;
  let targetImplode = 0;
  let targetGoldenWave = 0;
  let targetDualHalo = 0;
  let targetEasterEgg = 0;
  let targetPointerActive = 0;
  let targetPinchPrism = 0;
  let targetHeartMode = 0;
  let targetSnowglobe = 0;
  let targetMeteorShower = 0;
  let targetTrailsEnabled = 1.0;
  let targetFireworkIntensity = 0;
  let blessingPulse = 0;
  let easterEggFireworkTimer = 0;
  let specialEffectTimer = 0;
  let lastOrnamentScale = 1;
  let prevRigRotY = 0;

  // Camera smooth zoom, elevation & look-target choreography state
  let targetCamDist = 13.4;
  let targetCamY = 1.65;
  let targetLookX = 0;
  let targetLookY = 0.6;
  let targetRigRotSpeed = 0.24;
  let manualGestureYawOffset = 0;

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // Context lost / restored resilience
  const onContextLost = (e: Event) => {
    e.preventDefault();
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

  // Resize observer for crisp full-bleed viewport
  const onResize = () => {
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 240);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    const pr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pr);
    uniforms.uPixelRatio.value = pr;
    burstMat.uniforms.uPixelRatio.value = pr;
  };
  window.addEventListener('resize', onResize);

  // Software-WebGL fence-sync afterDraw pacing (never starves CPU or headless browser)
  let frameId = 0;
  let disposed = false;

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  let prevTime = performance.now();
  let elapsed = 0;

  function tick() {
    if (disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;

    // Dreamy slow-motion time dilation during upgraded Pinch micro-crystal focus
    const timeScale = THREE.MathUtils.lerp(1.0, 0.42, uniforms.uPinchPrism.value);
    elapsed += dt * timeScale;

    uniforms.uTime.value = elapsed;

    // Smooth color transitions
    const colorLerp = 1 - Math.exp(-4.5 * dt);
    uniforms.uPrimaryColor.value.lerp(targetPrimary, colorLerp);
    uniforms.uSecondaryColor.value.lerp(targetSecondary, colorLerp);
    uniforms.uRibbonColor.value.lerp(targetRibbon, colorLerp);
    uniforms.uAuraColor.value.lerp(targetAura, colorLerp);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.lerp(targetSky, colorLerp);
    }

    starBundle.starMat.color.lerp(targetRibbon, colorLerp);
    baseBundle.trimMat.color.lerp(targetRibbon, colorLerp);

    // Derive target animation parameters from current mode & gesture
    if (mode === 'genesis') {
      targetBloom = 0;
      targetImplode = 0;
      targetGoldenWave = targetGenesis > 0.86 ? 0.65 : 0;
      targetDualHalo = 0;
      targetEasterEgg = 0;
      targetPointerActive = 0;
      targetPinchPrism = 0;
      targetHeartMode = 0;
      targetSnowglobe = 0;
      targetMeteorShower = 0;
      targetRigRotSpeed = 0.28;
      targetCamDist = 13.6 - targetGenesis * 0.4;
      targetCamY = 1.65;
      targetLookX = 0;
      targetLookY = 0.6;
    } else if (mode === 'welcome') {
      targetBloom = 0.04;
      targetImplode = 0;
      targetGoldenWave = 0.15;
      targetDualHalo = 0;
      targetEasterEgg = 0;
      targetPointerActive = 0;
      targetPinchPrism = 0;
      targetHeartMode = 0;
      targetSnowglobe = 0;
      targetMeteorShower = 0;
      targetRigRotSpeed = 0.22;
      targetCamDist = 13.5;
      targetCamY = 1.6;
      targetLookX = container.clientWidth >= 1024 ? 2.15 : 0;
      targetLookY = 0.6;
    } else {
      // Interactive gesture-driven mode
      const g = currentGesture.gesture;
      targetBloom = g === 'open_palm' ? 0.85 : 0;
      targetImplode = g === 'closed_fist' ? 0.92 : 0;
      targetGoldenWave = g === 'thumbs_up' ? 1.0 : 0;
      targetDualHalo = g === 'two_hand_halo' ? 1.0 : 0;
      targetEasterEgg = g === 'multi_person_easter_egg' ? 1.0 : 0;
      targetPointerActive = g === 'pointing' ? 1.0 : 0;
      targetPinchPrism = g === 'pinch' ? 1.0 : 0;
      targetHeartMode = g === 'heart_gesture' ? 1.0 : 0;
      targetSnowglobe = g === 'two_hand_snowglobe' ? 1.0 : 0;
      targetMeteorShower = g === 'two_hand_meteor_shower' ? 1.0 : 0;

      if (g === 'pointing') {
        uniforms.uPointerWorld.value.set(
          currentGesture.pointerX * 3.8,
          currentGesture.pointerY * 3.2 + 0.8,
          2.2
        );
      }

      // Physically-motivated cinematic camera zoom, elevation & framing per gesture
      switch (g) {
        case 'open_palm':
          // Canopy blooms wide -> dolly back & follow palm height/horizontal framing
          targetCamDist = 15.0;
          targetCamY = 1.7 + currentGesture.centerY * 1.35;
          targetLookX = currentGesture.centerX * 0.72;
          targetLookY = 0.65;
          break;
        case 'closed_fist':
          // Gravitational implosion -> push tightly into the glowing tree heart
          targetCamDist = 10.4;
          targetCamY = 1.15;
          targetLookX = 0;
          targetLookY = 0.45;
          break;
        case 'pointing':
          // Index air-circle vortex -> elevated sweeping medium close-up
          targetCamDist = 11.6;
          targetCamY = 2.75;
          targetLookX = currentGesture.pointerX * 0.45;
          targetLookY = 0.9;
          break;
        case 'victory':
          // Crown fireworks -> heroic low-angle pull-back tilted up toward the bursts
          targetCamDist = 14.8;
          targetCamY = 0.95;
          targetLookX = 0;
          targetLookY = 1.55;
          break;
        case 'thumbs_up':
          // Golden star coronation -> zoom & pan heroically up onto the Topper Star
          targetCamDist = 9.8;
          targetCamY = 3.15;
          targetLookX = 0;
          targetLookY = 2.35;
          break;
        case 'pinch':
          // OK crystal astrolabe -> intimate macro dolly-in onto mid-crown crystal rings
          targetCamDist = 8.2;
          targetCamY = 1.45;
          targetLookX = 0;
          targetLookY = 0.92;
          break;
        case 'heart_gesture':
          // Floating 3D rose-gold heart -> warm eye-level medium close-up on the heart
          targetCamDist = 11.2;
          targetCamY = 2.05;
          targetLookX = 0;
          targetLookY = 1.38;
          break;
        case 'two_hand_halo':
          // Wide twin aurora halo -> pull back dynamically with hand spread
          targetCamDist = 14.5 + Math.min(1.5, currentGesture.spread) * 1.4;
          targetCamY = 2.25;
          targetLookX = 0;
          targetLookY = 0.75;
          break;
        case 'two_hand_snowglobe':
          // Spherical crystal snowglobe -> wide balanced frame enclosing the full dome
          targetCamDist = 15.4;
          targetCamY = 1.9;
          targetLookX = 0;
          targetLookY = 0.68;
          break;
        case 'two_hand_meteor_shower':
          // Shooting-star meteor shower -> low stargazing tilt-up toward winter sky
          targetCamDist = 15.0;
          targetCamY = 0.65;
          targetLookX = 0;
          targetLookY = 1.95;
          break;
        case 'multi_person_easter_egg':
          // Grand multi-person celestial celebration -> sweeping panoramic vantage
          targetCamDist = 15.8;
          targetCamY = 2.35;
          targetLookX = 0;
          targetLookY = 1.0;
          break;
        default:
          targetCamDist = 13.4;
          targetCamY = 1.65;
          targetLookX = 0;
          targetLookY = 0.6;
          break;
      }

      if (g === 'open_palm') {
        manualGestureYawOffset = THREE.MathUtils.damp(
          manualGestureYawOffset,
          currentGesture.centerX * 1.8,
          4.0,
          dt
        );
        targetRigRotSpeed = 0.14;
      } else if (g === 'multi_person_easter_egg') {
        targetRigRotSpeed = 0.92;
      } else if (g === 'two_hand_halo') {
        targetRigRotSpeed = 0.72;
      } else if (g === 'thumbs_up') {
        targetRigRotSpeed = 0.58;
      } else if (g === 'pinch') {
        targetRigRotSpeed = 0.14;
      } else {
        targetRigRotSpeed = 0.24;
      }
    }

    // Smooth exponential damping on all shader uniforms
    uniforms.uBloom.value = THREE.MathUtils.damp(uniforms.uBloom.value, targetBloom, 4.2, dt);
    uniforms.uImplode.value = THREE.MathUtils.damp(uniforms.uImplode.value, targetImplode, 4.8, dt);
    uniforms.uGoldenWave.value = THREE.MathUtils.damp(uniforms.uGoldenWave.value, targetGoldenWave, 4.0, dt);
    uniforms.uDualHalo.value = THREE.MathUtils.damp(uniforms.uDualHalo.value, targetDualHalo, 4.0, dt);
    uniforms.uHandSpread.value = THREE.MathUtils.damp(uniforms.uHandSpread.value, currentGesture.spread, 5.0, dt);
    uniforms.uEasterEgg.value = THREE.MathUtils.damp(uniforms.uEasterEgg.value, targetEasterEgg, 3.0, dt);
    uniforms.uPointerActive.value = THREE.MathUtils.damp(uniforms.uPointerActive.value, targetPointerActive, 5.5, dt);
    uniforms.uPinchPrism.value = THREE.MathUtils.damp(uniforms.uPinchPrism.value, targetPinchPrism, 4.2, dt);
    uniforms.uHeartMode.value = THREE.MathUtils.damp(uniforms.uHeartMode.value, targetHeartMode, 3.8, dt);
    uniforms.uSnowglobe.value = THREE.MathUtils.damp(uniforms.uSnowglobe.value, targetSnowglobe, 3.8, dt);
    uniforms.uMeteorShower.value = THREE.MathUtils.damp(uniforms.uMeteorShower.value, targetMeteorShower, 4.0, dt);
    uniforms.uGenesis.value = THREE.MathUtils.damp(
      uniforms.uGenesis.value,
      mode === 'genesis' ? targetGenesis : 1.0,
      5.0,
      dt
    );
    uniforms.uAuraIntensity.value = THREE.MathUtils.damp(uniforms.uAuraIntensity.value, targetAuraIntensity, 4.5, dt);
    trailUniforms.uTrailsEnabled.value = THREE.MathUtils.damp(
      trailUniforms.uTrailsEnabled.value,
      targetTrailsEnabled,
      5.0,
      dt
    );

    if (targetFireworkIntensity > 0.005) {
      uniforms.uFireworkTime.value += dt;
      targetFireworkIntensity = THREE.MathUtils.damp(targetFireworkIntensity, 0, 1.35, dt);
    }
    uniforms.uFireworkIntensity.value = targetFireworkIntensity;

    if (blessingPulse > 0.005) {
      blessingPulse = THREE.MathUtils.damp(blessingPulse, 0, 1.2, dt);
    }
    uniforms.uBlessingPulse.value = blessingPulse;

    // Periodic special burst choreography for Easter Egg, Meteor Shower, Heart Gesture, and Thumbs-Up Crown
    if (targetEasterEgg > 0.5) {
      easterEggFireworkTimer -= dt;
      if (easterEggFireworkTimer <= 0) {
        easterEggFireworkTimer = 0.65;
        const fx = (Math.random() - 0.5) * 6.4;
        const fy = 2.0 + Math.random() * 3.4;
        const fz = (Math.random() - 0.5) * 4.2;
        spawnBurstCluster(fx, fy, fz, 190, 3.6, [
          new THREE.Color('#fde047'),
          new THREE.Color('#f472b6'),
          new THREE.Color('#38bdf8'),
          new THREE.Color('#4ade80'),
        ]);
      }
    }

    if (targetMeteorShower > 0.5 || targetHeartMode > 0.5 || targetGoldenWave > 0.7) {
      specialEffectTimer -= dt;
      if (specialEffectTimer <= 0) {
        if (targetMeteorShower > 0.5) {
          // Spawn diagonal glowing shooting-star meteor streaks across the winter night sky!
          specialEffectTimer = 0.24;
          const sx = 3.2 + Math.random() * 4.5;
          const sy = 3.4 + Math.random() * 3.2;
          const sz = -2.8 + Math.random() * 3.2;
          const meteorColors = [
            new THREE.Color('#fef08a'),
            new THREE.Color('#7dd3fc'),
            new THREE.Color('#ffffff'),
            new THREE.Color('#c084fc'),
          ];
          const chosen = meteorColors[Math.floor(Math.random() * meteorColors.length)];
          for (let m = 0; m < 26; m++) {
            const p = burstPool[burstCursor];
            burstCursor = (burstCursor + 1) % MAX_BURST;
            const tailOffset = m * 0.14;
            p.x = sx + tailOffset * 0.9;
            p.y = sy + tailOffset * 0.55;
            p.z = sz;
            p.vx = -6.8 - Math.random() * 1.4;
            p.vy = -3.8 - Math.random() * 0.8;
            p.vz = 0.4 + (Math.random() - 0.5) * 0.4;
            p.life = 0.95 - m * 0.025;
            p.maxLife = 0.95;
            p.r = chosen.r;
            p.g = chosen.g;
            p.b = chosen.b;
          }
        } else if (targetHeartMode > 0.5) {
          // Periodic glowing 3D rose-gold heart bursts
          specialEffectTimer = 0.85;
          spawnBurstCluster(0, 1.9, 0.5, 200, 3.3, [
            new THREE.Color('#ff7eb6'),
            new THREE.Color('#fde68a'),
            new THREE.Color('#fbcfe8'),
          ], true);
        } else if (targetGoldenWave > 0.7) {
          // Golden supernova crown sparks radiating from the 8-point Topper Star!
          specialEffectTimer = 0.58;
          spawnBurstCluster(0, TREE_DIMENSIONS.baseY + TREE_DIMENSIONS.treeHeight + 0.3, 0, 140, 3.2, [
            new THREE.Color('#fef08a'),
            new THREE.Color('#f59e0b'),
            new THREE.Color('#ffffff'),
          ]);
        }
      }
    }

    // Rotate tree rig & topper star filigree rings gracefully
    prevRigRotY = treeRig.rotation.y;
    treeRig.rotation.y += dt * targetRigRotSpeed;
    if (mode === 'interactive' && currentGesture.gesture === 'open_palm') {
      treeRig.rotation.y += (manualGestureYawOffset - treeRig.rotation.y * 0.02) * dt * 0.5;
    }

    // Compute real-time angular velocity to drive smooth 3D particle motion-blur trail lag!
    const angularSpeed = (treeRig.rotation.y - prevRigRotY) / Math.max(dt, 0.001);
    const gestureEnergy =
      uniforms.uDualHalo.value * 0.14 +
      uniforms.uEasterEgg.value * 0.22 +
      uniforms.uBloom.value * 0.12 +
      uniforms.uGoldenWave.value * 0.12;
    const desiredLag = THREE.MathUtils.clamp(angularSpeed * 0.14 + gestureEnergy, -0.45, 0.45);
    trailUniforms.uTrailLag.value = THREE.MathUtils.damp(
      trailUniforms.uTrailLag.value,
      desiredLag,
      6.0,
      dt
    );

    starBundle.group.rotation.y = elapsed * (0.72 + uniforms.uGoldenWave.value * 1.4 + uniforms.uPinchPrism.value * 0.65);
    starBundle.secondaryStar.rotation.z = Math.PI / 8 - elapsed * (0.45 + uniforms.uPinchPrism.value * 0.9);
    starBundle.outerRing.rotation.z = elapsed * (0.9 + uniforms.uPinchPrism.value * 1.5);
    starBundle.innerRing.rotation.z = -elapsed * (1.25 + uniforms.uGoldenWave.value * 1.6);
    const coronaPulse = 2.05 + Math.sin(elapsed * 2.8) * 0.22 + uniforms.uGoldenWave.value * 0.85 + uniforms.uPinchPrism.value * 0.65;
    starBundle.coronaSprite.scale.set(coronaPulse, coronaPulse, 1);

    const gVal = uniforms.uGenesis.value;

    // Animate 3D Sacred Crystal Astrolabe Halo during upgraded OK gesture
    const okVal = uniforms.uPinchPrism.value;
    okPrismBundle.group.visible = okVal > 0.02;
    if (okPrismBundle.group.visible) {
      okPrismBundle.group.scale.setScalar(0.35 + okVal * 0.65);
      okPrismBundle.outerHoop.rotation.z = elapsed * 1.35;
      okPrismBundle.innerHoop.rotation.z = -elapsed * 1.85;
      okPrismBundle.gems.forEach((gem, idx) => {
        gem.rotation.y = elapsed * 2.6 + idx * 0.8;
      });
    }

    // Synchronize topper star & ornament visibility with Genesis progress & gestures
    const starScale = THREE.MathUtils.smoothstep(gVal, 0.84, 0.98);
    const starBoost = 1 + uniforms.uGoldenWave.value * 0.42 + uniforms.uEasterEgg.value * 0.3 + uniforms.uPinchPrism.value * 0.22;
    starBundle.group.scale.setScalar(Math.max(0.001, starScale * starBoost));
    starBundle.group.position.y =
      TREE_DIMENSIONS.baseY + TREE_DIMENSIONS.treeHeight + 0.25 + uniforms.uGoldenWave.value * 0.26;
    starBundle.group.visible = starScale > 0.01;
    starPointLight.intensity =
      (2.8 + Math.sin(elapsed * 3.2) * 0.55 + uniforms.uEasterEgg.value * 2.5 + uniforms.uGoldenWave.value * 3.4 + uniforms.uPinchPrism.value * 1.8) *
      starScale;

    // Pulse bauble sheen softly during OK crystal focus
    ornamentMat.emissiveIntensity = 0.28 + uniforms.uPinchPrism.value * 0.95 + uniforms.uGoldenWave.value * 0.45;

    const ornScale =
      THREE.MathUtils.smoothstep(gVal, 0.66, 0.88) *
      (1 - uniforms.uBloom.value * 0.45 + uniforms.uPinchPrism.value * 0.16);
    if (Math.abs(ornScale - lastOrnamentScale) > 0.015) {
      lastOrnamentScale = ornScale;
      updateOrnamentPalette(currentPalette, Math.max(0.001, ornScale));
      ornamentMesh.visible = ornScale > 0.02;
      ornamentCapMesh.visible = ornScale > 0.02;
    }

    // Update burst particle physics (zero-allocation in-place array updates)
    let hasActiveBurst = false;
    for (let i = 0; i < MAX_BURST; i++) {
      const p = burstPool[i];
      if (p.life > 0) {
        hasActiveBurst = true;
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 1.35 * dt; // soft holiday gravity
        p.vx *= 1 - 0.8 * dt;
        p.vz *= 1 - 0.8 * dt;

        const alpha = Math.max(0, p.life / p.maxLife);
        burstPositions[i * 3] = p.x;
        burstPositions[i * 3 + 1] = p.y;
        burstPositions[i * 3 + 2] = p.z;
        burstColors[i * 3] = p.r;
        burstColors[i * 3 + 1] = p.g;
        burstColors[i * 3 + 2] = p.b;
        burstAlphas[i] = alpha;
      } else if (burstAlphas[i] > 0) {
        burstAlphas[i] = 0;
        burstPositions[i * 3 + 1] = -999;
        hasActiveBurst = true;
      }
    }
    if (hasActiveBurst) {
      burstPosAttr.needsUpdate = true;
      burstColAttr.needsUpdate = true;
      burstAlphaAttr.needsUpdate = true;
    }

    // Gentle camera distance, elevation & look-target damping when user is not manually dragging OrbitControls
    if (!userDragging) {
      controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookX, 3.6, dt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookY, 3.4, dt);
      const currentDist = camera.position.distanceTo(controls.target);
      const nextDist = THREE.MathUtils.damp(currentDist, targetCamDist, 3.4, dt);
      if (Math.abs(nextDist - currentDist) > 0.005) {
        camera.position
          .sub(controls.target)
          .normalize()
          .multiplyScalar(nextDist)
          .add(controls.target);
      }
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.0, dt);
    }

    controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  return {
    setPalette(palette: TreePalette) {
      currentPalette = palette;
      targetPrimary.set(palette.primary);
      targetSecondary.set(palette.secondary);
      targetRibbon.set(palette.ribbon);
      targetAura.set(palette.aura);
      targetSky.set(palette.skyTint);
      updateOrnamentPalette(palette, Math.max(0.001, lastOrnamentScale));
    },

    setGestureFrame(frame: GestureFrame) {
      const prev = currentGesture.gesture;
      currentGesture = frame;
      if (frame.gesture !== prev) {
        specialEffectTimer = 0;
      }
      if (frame.gesture === 'victory' && prev !== 'victory') {
        this.triggerFireworkBurst(1.0);
      } else if (frame.gesture === 'multi_person_easter_egg' && prev !== 'multi_person_easter_egg') {
        this.triggerFireworkBurst(1.5);
      } else if (frame.gesture === 'heart_gesture' && prev !== 'heart_gesture') {
        spawnBurstCluster(0, 1.9, 0.6, 260, 3.6, [
          new THREE.Color('#ff7eb6'),
          new THREE.Color('#fde68a'),
          new THREE.Color('#ffffff'),
        ], true);
      } else if (frame.gesture === 'pinch' && prev !== 'pinch') {
        // Upgraded OK gesture diamond-crystal burst halo around the tree waist
        spawnBurstCluster(0, 0.95, 0.3, 240, 3.5, [
          new THREE.Color('#bae6fd'),
          new THREE.Color('#fef08a'),
          new THREE.Color('#ffffff'),
        ]);
      } else if (frame.gesture === 'thumbs_up' && prev !== 'thumbs_up') {
        spawnBurstCluster(0, TREE_DIMENSIONS.baseY + TREE_DIMENSIONS.treeHeight + 0.3, 0, 220, 3.8, [
          new THREE.Color('#fef08a'),
          new THREE.Color('#f59e0b'),
          new THREE.Color('#ffffff'),
        ]);
      }
    },

    setMode(nextMode: SceneMode) {
      mode = nextMode;
      if (nextMode !== 'genesis') {
        targetGenesis = 1.0;
      }
      if (nextMode === 'welcome' && container.clientWidth >= 1024) {
        targetLookX = 2.15;
        controls.target.x = 2.15;
        camera.position.set(2.15, 1.6, 13.5);
        controls.update();
      } else if (nextMode === 'interactive' || nextMode === 'genesis') {
        targetLookX = 0;
      }
    },

    setGenesisProgress(progress: number) {
      targetGenesis = Math.max(0, Math.min(1, progress));
    },

    setAuraIntensity(intensity: number) {
      targetAuraIntensity = Math.max(0.2, Math.min(2.0, intensity));
    },

    setMotionTrails(enabled: boolean) {
      targetTrailsEnabled = enabled ? 1.0 : 0.0;
    },

    triggerBlessingBurst() {
      blessingPulse = 1.0;
      _tmpColor.set('#fde68a');
      _tmpColor2.set('#fda4af');
      spawnBurstCluster(0, 1.35, 0.8, 360, 4.2, [
        _tmpColor.clone(),
        _tmpColor2.clone(),
        new THREE.Color('#ffffff'),
      ], true);
      spawnBurstCluster(0, 3.6, 0, 220, 3.8, [
        new THREE.Color(currentPalette.ribbon),
        new THREE.Color('#fef08a'),
        new THREE.Color('#fbcfe8'),
      ]);
    },

    triggerFireworkBurst(intensity = 1.0) {
      targetFireworkIntensity = Math.min(1.6, intensity);
      uniforms.uFireworkTime.value = 0;
      const colors = [
        new THREE.Color(currentPalette.ribbon),
        new THREE.Color(currentPalette.secondary),
        new THREE.Color(currentPalette.aura),
        new THREE.Color('#ffffff'),
      ];
      spawnBurstCluster(2.2, 3.4, 0.6, 220, 3.4 * intensity, colors);
      spawnBurstCluster(-2.3, 2.9, -0.4, 220, 3.4 * intensity, colors);
      if (intensity > 1.2) {
        spawnBurstCluster(0, 4.6, 0, 320, 4.4, [
          new THREE.Color('#fde047'),
          new THREE.Color('#f472b6'),
          new THREE.Color('#38bdf8'),
          new THREE.Color('#4ade80'),
        ]);
      }
    },

    resetCamera() {
      targetCamDist = 13.4;
      targetCamY = 1.65;
      targetLookX = 0;
      targetLookY = 0.6;
      camera.position.set(0, 1.65, 13.4);
      controls.target.set(0, 0.6, 0);
      controls.update();
    },

    getParticleCount() {
      return particleData.count + MAX_BURST + bgStarCount;
    },

    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      snowBumpTex.dispose();
      envTex.dispose();
      renderer.dispose();
    },
  };
}
