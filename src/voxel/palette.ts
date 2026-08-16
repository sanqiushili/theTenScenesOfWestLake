// 体素西湖 · 调色板
// 一套柔和而饱和度分层的「青绿山水 × 玩具积木」体素配色

export const PAL = {
  // 水色
  waterDeep: '#2E7D8C',
  waterMid: '#4FA3B1',
  waterLight: '#7CC5C9',
  waterGlow: '#A9E2DC',

  // 土地
  grassLight: '#A8C877',
  grass: '#8AB562',
  grassDark: '#6B9950',
  moss: '#5E8C5A',
  sand: '#E9D8A6',
  sandDark: '#D8BE82',
  dirt: '#A98357',
  pathStone: '#B9B2A4',

  // 山石
  rockLight: '#A9A29A',
  rock: '#8A8378',
  rockDark: '#6C665D',
  cliff: '#585249',

  // 木与建筑
  woodLight: '#B07A4A',
  wood: '#8C5A3C',
  woodDark: '#5C3A28',
  vermilion: '#C1442E',
  vermilionDark: '#8F2E20',
  wallWhite: '#F2EBDC',
  wallGray: '#CFC7B8',
  roofDark: '#3E4A52',
  roofBlue: '#32506B',
  gold: '#E8B84B',
  goldBright: '#FFD97A',
  stone: '#A8A29A',
  stoneDark: '#7C766E',

  // 植物
  leaf: '#6FA85E',
  leafDark: '#4E8048',
  willow: '#9CC57C',
  willowDark: '#7FAE62',
  pine: '#3E6B4F',
  pineDark: '#2E5540',
  peachPink: '#F2A2B8',
  peachDeep: '#E07A96',
  plumWhite: '#F6E7E4',
  plumPink: '#EFC2C8',
  lotusLeaf: '#5D9E6B',
  lotusLeafDark: '#417E52',
  lotusPink: '#F2A0B4',
  lotusDeep: '#E56E92',
  lotusSeed: '#F2D06B',

  // 雪 / 云 / 雾
  snow: '#F4F6F5',
  snowShadow: '#D8E2E8',
  cloud: '#FFFFFF',
  mist: '#F7F3EA',

  // 天空 / 光体
  sunOrange: '#FF9E4A',
  sunCore: '#FFD98A',
  moon: '#FFF6D8',
  star: '#FFFBEA',

  // 生灵
  koiOrange: '#F2743C',
  koiWhite: '#F5EFE4',
  koiRed: '#D94A35',
  oriole: '#F2C94C',
  orioleWing: '#4A4A4A',
  egret: '#F5F2EA',
  birdDark: '#3A3A3A',

  // 夜色
  nightLantern: '#FFC55A',
  candle: '#FFD479'
} as const;

// 各时辰的天空 / 雾色 / 光照预设
export interface SkyPreset {
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambient: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sun: string;
  sunIntensity: number;
  sunPos: [number, number, number];
}

export const SKY_PRESETS: Record<'dawn' | 'noon' | 'sunset' | 'night', SkyPreset> = {
  dawn: {
    sky: '#FBE3CE', fog: '#F6D9C0', fogNear: 90, fogFar: 260,
    ambient: '#FFE9D2', ambientIntensity: 0.55,
    hemiSky: '#FFD9B0', hemiGround: '#8FA88A', hemiIntensity: 0.5,
    sun: '#FFC182', sunIntensity: 1.6, sunPos: [40, 30, 20]
  },
  noon: {
    sky: '#BFE3EC', fog: '#CDE9EF', fogNear: 110, fogFar: 300,
    ambient: '#EAF4F6', ambientIntensity: 0.7,
    hemiSky: '#CFEFF6', hemiGround: '#93B47E', hemiIntensity: 0.65,
    sun: '#FFF6E0', sunIntensity: 1.9, sunPos: [26, 56, 18]
  },
  sunset: {
    sky: '#FFB874', fog: '#F7A468', fogNear: 80, fogFar: 250,
    ambient: '#FFCFA0', ambientIntensity: 0.5,
    hemiSky: '#FF9E5E', hemiGround: '#7A5E58', hemiIntensity: 0.55,
    sun: '#FF7A3C', sunIntensity: 2.2, sunPos: [-46, 16, -18]
  },
  night: {
    sky: '#1B2547', fog: '#16203C', fogNear: 70, fogFar: 240,
    ambient: '#43558C', ambientIntensity: 0.4,
    hemiSky: '#3D4F8A', hemiGround: '#22283E', hemiIntensity: 0.45,
    sun: '#C9D6FF', sunIntensity: 0.9, sunPos: [30, 44, -26]
  }
};
