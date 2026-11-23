export interface TreePalette {
  id: string;
  name: string;
  subtitle: string;
  /** Primary deep foliage color */
  primary: string;
  /** Luminous bough tip / highlight color */
  secondary: string;
  /** Flowing spiral ribbon & starlight accent */
  ribbon: string;
  /** Ambient aura & firework sparkle accent */
  aura: string;
  /** Ornament accent color */
  ornament: string;
  /** Deep horizon/sky tint */
  skyTint: string;
  /** Subtle lower horizon radial glow behind the tree */
  bgGlow: string;
  /** Dynamic CSS snowfall particle color */
  snowColor: string;
  /** Dynamic CSS snowfall speed multiplier (higher = faster snowfall) */
  snowSpeed: number;
}

export interface CustomColorOverrides {
  primary: string;
  secondary: string;
  ribbon: string;
  aura: string;
}

export const PRESET_THEMES: TreePalette[] = [
  {
    id: 'emerald-gold',
    name: '松影鎏金',
    subtitle: '经典北欧冷杉 · 香槟金流光',
    primary: '#167a48',
    secondary: '#52e3a1',
    ribbon: '#f7d570',
    aura: '#ff9e64',
    ornament: '#e63956',
    skyTint: '#060c18',
    bgGlow: '#0d2330',
    snowColor: '#fff4d6',
    snowSpeed: 1.05,
  },
  {
    id: 'arctic-frost',
    name: '极夜冰晶',
    subtitle: '冰川蔚蓝 · 银白月华极光',
    primary: '#1e50b8',
    secondary: '#7dd3fc',
    ribbon: '#f0f9ff',
    aura: '#a78bfa',
    ornament: '#38bdf8',
    skyTint: '#050b1c',
    bgGlow: '#0c2142',
    snowColor: '#bae6fd',
    snowSpeed: 1.5,
  },
  {
    id: 'crimson-velvet',
    name: '绯红丝绒',
    subtitle: '红宝石华章 · 暖珀星火',
    primary: '#9f1239',
    secondary: '#fb7185',
    ribbon: '#fcd34d',
    aura: '#fda4af',
    ornament: '#fbbf24',
    skyTint: '#140710',
    bgGlow: '#2b0f20',
    snowColor: '#ffe4e6',
    snowSpeed: 1.18,
  },
  {
    id: 'rose-champagne',
    name: '玫瑰香槟',
    subtitle: '粉晶星雾 · 柔金珍珠光韵',
    primary: '#be3b7c',
    secondary: '#f9a8d4',
    ribbon: '#fef08a',
    aura: '#f5d0fe',
    ornament: '#fff1f2',
    skyTint: '#120816',
    bgGlow: '#291230',
    snowColor: '#fbcfe8',
    snowSpeed: 0.88,
  },
  {
    id: 'amethyst-nebula',
    name: '暮紫星云',
    subtitle: '皇家暮紫 · 极光翡翠星河',
    primary: '#4f3cc9',
    secondary: '#c084fc',
    ribbon: '#5eead4',
    aura: '#fde047',
    ornament: '#f472b6',
    skyTint: '#09071c',
    bgGlow: '#1a1442',
    snowColor: '#ddd6fe',
    snowSpeed: 1.32,
  },
  {
    id: 'champagne-ivory',
    name: '圣夜白金',
    subtitle: '象牙雪霜 · 流金香槟华冕',
    primary: '#b48a3c',
    secondary: '#fef3c7',
    ribbon: '#ffffff',
    aura: '#f5d061',
    ornament: '#e2e8f0',
    skyTint: '#0a0b16',
    bgGlow: '#211c12',
    snowColor: '#fef9c3',
    snowSpeed: 0.78,
  },
];

export const DEFAULT_THEME_ID = PRESET_THEMES[0].id;

export function getThemeById(id: string): TreePalette {
  return PRESET_THEMES.find((t) => t.id === id) ?? PRESET_THEMES[0];
}

export function isValidHexColor(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim());
}

export function hexToRgbNormalized(hex: string): [number, number, number] {
  const clean = isValidHexColor(hex) ? hex.trim().slice(1) : 'ffffff';
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b];
}

/** Softly lifts a hex color toward crisp wintry snow-white so custom themes tint snowfall tastefully */
export function blendHexTowardWhite(hex: string, whiteRatio = 0.58): string {
  const [r, g, b] = hexToRgbNormalized(hex);
  const ratio = Math.max(0, Math.min(1, whiteRatio));
  const nr = Math.round((r * (1 - ratio) + ratio) * 255);
  const ng = Math.round((g * (1 - ratio) + ratio) * 255);
  const nb = Math.round((b * (1 - ratio) + ratio) * 255);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

export function resolveActivePalette(
  themeId: string,
  customOverrides: Partial<CustomColorOverrides> | null
): TreePalette {
  const base = getThemeById(themeId);
  if (!customOverrides) {
    return base;
  }

  const primary =
    customOverrides.primary && isValidHexColor(customOverrides.primary)
      ? customOverrides.primary
      : base.primary;
  const secondary =
    customOverrides.secondary && isValidHexColor(customOverrides.secondary)
      ? customOverrides.secondary
      : base.secondary;
  const ribbon =
    customOverrides.ribbon && isValidHexColor(customOverrides.ribbon)
      ? customOverrides.ribbon
      : base.ribbon;
  const aura =
    customOverrides.aura && isValidHexColor(customOverrides.aura)
      ? customOverrides.aura
      : base.aura;

  // Dynamically adapt snowfall color when user customizes aura or highlight tint
  const customTintSource =
    customOverrides.aura && isValidHexColor(customOverrides.aura)
      ? aura
      : customOverrides.secondary && isValidHexColor(customOverrides.secondary)
        ? secondary
        : null;

  return {
    ...base,
    primary,
    secondary,
    ribbon,
    aura,
    snowColor: customTintSource ? blendHexTowardWhite(customTintSource, 0.55) : base.snowColor,
  };
}
