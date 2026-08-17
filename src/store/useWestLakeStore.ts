import { create } from 'zustand';

// ── 个性化字段持久化（localStorage，沙箱不可用时静默降级）──
const lsGet = (key: string, fallback: string): string => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const lsSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 忽略：隐私模式 / 沙箱禁用 */
  }
};

export type SceneId =
  | 'overview'
  | 'su_di'       // 苏堤春晓
  | 'qu_yuan'     // 曲院风荷
  | 'san_tan'     // 三潭印月
  | 'duan_qiao'   // 断桥残雪
  | 'liu_lang'    // 柳浪闻莺
  | 'shuang_feng' // 双峰插云
  | 'lei_feng'    // 雷峰夕照
  | 'nan_ping'    // 南屏晚钟
  | 'ling_feng'   // 灵峰探梅
  | 'hua_gang';   // 花港观鱼

export type TimeOfDay = 'dawn' | 'noon' | 'sunset' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SceneData {
  id: SceneId;
  name: string;
  pinyin: string;
  season: Season;
  defaultTime: TimeOfDay;
  /** 该景可切换的时辰：景致本身决定（如雷峰夕照只能斜阳、三潭印月只能静夜） */
  allowedTimes: TimeOfDay[];
  /** 诗题 */
  poem: string;
  /** 作者 */
  poet: string;
  /** 朝代 */
  dynasty: string;
  /** 诗词卡正文：诗词原文（竖排展示），不作改写 */
  description: string;
  stampName: string;
  stampStyle: 'yang' | 'yin';
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const WEST_LAKE_SCENES: Record<Exclude<SceneId, 'overview'>, SceneData> = {
  su_di: {
    id: 'su_di',
    name: '苏堤春晓',
    pinyin: 'Sū Dī Chūn Xiǎo',
    season: 'spring',
    defaultTime: 'dawn',
    allowedTimes: ['dawn'],
    poem: '苏堤春晓',
    poet: '张宁',
    dynasty: '明',
    description: '杨柳满长堤\n花明路不迷\n画船人未起\n侧枕听莺啼',
    stampName: '春晓游吟',
    stampStyle: 'yang',
    cameraPos: [26, 16, 30],
    cameraTarget: [0, 2.5, 0]
  },
  qu_yuan: {
    id: 'qu_yuan',
    name: '曲院风荷',
    pinyin: 'Qū Yuàn Fēng Hé',
    season: 'summer',
    defaultTime: 'noon',
    allowedTimes: ['dawn', 'noon'],
    poem: '晓出净慈寺送林子方',
    poet: '杨万里',
    dynasty: '宋',
    description: '毕竟西湖六月中\n风光不与四时同\n接天莲叶无穷碧\n映日荷花别样红',
    stampName: '荷风酒香',
    stampStyle: 'yin',
    cameraPos: [16, 12, 20],
    cameraTarget: [0, 1.5, 0]
  },
  san_tan: {
    id: 'san_tan',
    name: '三潭印月',
    pinyin: 'Sān Tán Yìn Yuè',
    season: 'autumn',
    defaultTime: 'night',
    allowedTimes: ['night'],
    poem: '西湖十咏·三潭印月',
    poet: '尹廷高',
    dynasty: '元',
    description: '波仙鼎立据平湖\n天影清涵水墨图\n夜静老龙鳞甲冷\n冰壶深处浴明珠',
    stampName: '湖心印月',
    stampStyle: 'yin',
    cameraPos: [16, 8, 20],
    cameraTarget: [0, 2, 0]
  },
  duan_qiao: {
    id: 'duan_qiao',
    name: '断桥残雪',
    pinyin: 'Duàn Qiáo Cán Xuě',
    season: 'winter',
    defaultTime: 'dawn',
    allowedTimes: ['dawn', 'noon', 'sunset', 'night'],
    poem: '西湖十咏·断桥残雪',
    poet: '尹廷高',
    dynasty: '元',
    description: '数板琼瑶踏未乾\n沈吟不度据征鞍\n孤山霁色无寻处\n笑指梅花隔岁寒',
    stampName: '断桥雪痕',
    stampStyle: 'yang',
    cameraPos: [-22, 12, 24],
    cameraTarget: [0, 3, 0]
  },
  liu_lang: {
    id: 'liu_lang',
    name: '柳浪闻莺',
    pinyin: 'Liǔ Làng Wén Yīng',
    season: 'spring',
    defaultTime: 'dawn',
    allowedTimes: ['dawn', 'noon', 'sunset'],
    poem: '湖山十景·柳浪闻莺',
    poet: '王洧',
    dynasty: '宋',
    description: '如簧巧啭最高枝\n苑树青归万缕丝\n玉辇不来春又老\n声声诉与落花知',
    stampName: '莺啼柳浪',
    stampStyle: 'yang',
    cameraPos: [20, 11, 26],
    cameraTarget: [0, 4, -2]
  },
  shuang_feng: {
    id: 'shuang_feng',
    name: '双峰插云',
    pinyin: 'Shuāng Fēng Chā Yún',
    season: 'autumn',
    defaultTime: 'dawn',
    allowedTimes: ['dawn', 'noon', 'sunset'],
    poem: '湖山十景·两峰插云',
    poet: '王洧',
    dynasty: '宋',
    description: '浮图对立晓崔嵬\n积翠浮空霁霭迷\n试向凤凰山上望\n南高天近北烟低',
    stampName: '云间双峰',
    stampStyle: 'yin',
    cameraPos: [0, 16, 42],
    cameraTarget: [0, 12, 0]
  },
  lei_feng: {
    id: 'lei_feng',
    name: '雷峰夕照',
    pinyin: 'Léi Fēng Xī Zhào',
    season: 'autumn',
    defaultTime: 'sunset',
    allowedTimes: ['sunset'],
    poem: '西湖十咏·雷峰落照',
    poet: '尹廷高',
    dynasty: '元',
    description: '烟光山色淡溟濛\n千尺浮图兀倚空\n湖上画船归欲尽\n孤峰犹带夕阳红',
    stampName: '塔影晚霞',
    stampStyle: 'yang',
    cameraPos: [-18, 15, 30],
    cameraTarget: [0, 8, 0]
  },
  nan_ping: {
    id: 'nan_ping',
    name: '南屏晚钟',
    pinyin: 'Nán Píng Wǎn Zhōng',
    season: 'autumn',
    defaultTime: 'sunset',
    allowedTimes: ['sunset', 'night'],
    poem: '西湖十咏·南屏晚钟',
    poet: '尹廷高',
    dynasty: '元',
    description: '缥缈雷峰隔上方\n数声风送到幽窗\n柳昏花暝游人散\n付与山僧带月撞',
    stampName: '晚钟破晓',
    stampStyle: 'yin',
    cameraPos: [18, 12, 26],
    cameraTarget: [0, 5, 0]
  },
  ling_feng: {
    id: 'ling_feng',
    name: '灵峰探梅',
    pinyin: 'Líng Fēng Tàn Méi',
    season: 'winter',
    defaultTime: 'sunset',
    allowedTimes: ['sunset', 'night'],
    poem: '山园小梅',
    poet: '林逋',
    dynasty: '宋',
    description: '众芳摇落独暄妍\n占尽风情向小园\n疏影横斜水清浅\n暗香浮动月黄昏',
    stampName: '暗香疏影',
    stampStyle: 'yin',
    cameraPos: [20, 12, 26],
    cameraTarget: [0, 4, 0]
  },
  hua_gang: {
    id: 'hua_gang',
    name: '花港观鱼',
    pinyin: 'Huā Gǎng Guān Yú',
    season: 'spring',
    defaultTime: 'noon',
    allowedTimes: ['dawn', 'noon', 'sunset'],
    poem: '观游鱼',
    poet: '白居易',
    dynasty: '唐',
    description: '绕池闲步看鱼游\n正值儿童弄钓舟\n一种爱鱼心各异\n我来施食尔垂钩',
    stampName: '鱼乐国度',
    stampStyle: 'yang',
    cameraPos: [0, 20, 26],
    cameraTarget: [0, 0.5, 0]
  }
};

export const ALL_SCENE_IDS = Object.keys(WEST_LAKE_SCENES) as Exclude<SceneId, 'overview'>[];

interface WestLakeState {
  currentScene: SceneId;
  timeOfDay: TimeOfDay;
  season: Season;
  collectedStamps: Set<SceneId>;
  /** 盖印时拍下的视角明信片（已合成印章与落款的 JPEG dataURL） */
  scenePhotos: Partial<Record<SceneId, string>>;
  isAudioMuted: boolean;
  isTravelAlbumOpen: boolean;
  scrollProgress: number;

  // 景点专属交互参数
  temperature: number;      // 断桥残雪融雪温度 (0 ~ 15°C)
  towersLit: boolean[];     // 三潭印月三塔点亮状态
  sunProgress: number;      // 雷峰夕照太阳高度进度 (0 ~ 1)
  bellRungCount: number;    // 南屏晚钟撞钟次数
  cloudFlow: number;        // 双峰插云云海流速 (0 ~ 1)
  fishFedCount: number;     // 花港观鱼投食次数

  // 个性化（贴合小红书「和自己结合」的分享动机）
  userAlias: string;        // 用户题名/别号（默认「西湖客」）
  userHandbill: string | null; // 游历手札/口令（预设短句，null = 未选）
  aliasSet: boolean;        // 是否已题名（决定是否首次盖印弹窗）     // 花港观鱼投食次数

  // Actions
  setCurrentScene: (scene: SceneId) => void;
  setUserAlias: (alias: string) => void;
  setUserHandbill: (line: string | null) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setSeason: (season: Season) => void;
  collectStamp: (scene: SceneId, photo?: string) => void;
  toggleAudioMute: () => void;
  setTravelAlbumOpen: (open: boolean) => void;
  setScrollProgress: (progress: number) => void;
  setTemperature: (temp: number) => void;
  toggleTowerLit: (index: number) => void;
  setSunProgress: (progress: number) => void;
  ringBell: () => void;
  setCloudFlow: (flow: number) => void;
  feedFish: () => void;
}

export const useWestLakeStore = create<WestLakeState>((set) => ({
  currentScene: 'overview',
  timeOfDay: 'dawn',
  season: 'spring',
  collectedStamps: new Set<SceneId>(),
  scenePhotos: {},
  isAudioMuted: false,
  isTravelAlbumOpen: false,
  scrollProgress: 0,

  temperature: 0,
  towersLit: [false, false, false],
  sunProgress: 0.5,
  bellRungCount: 0,
  cloudFlow: 0.5,
  fishFedCount: 0,

  // 个性化初始值（localStorage 持久化，返回用户保留身份）
  userAlias: lsGet('wl_alias', '西湖客'),
  userHandbill: lsGet('wl_handbill', '') || null,
  aliasSet: lsGet('wl_aliasSet', 'false') === 'true',

  setCurrentScene: (scene) => set((state) => ({
    currentScene: scene,
    // 季节流转仅属于全景总览：进子场景不再改写全局季节，
    // 避免游完断桥残雪回到总览时整个西湖仍是冬态；时辰则跟随各景最佳观赏时段
    timeOfDay: scene !== 'overview' ? WEST_LAKE_SCENES[scene].defaultTime : state.timeOfDay,
    scrollProgress: 0
  })),

  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setSeason: (season) => set({ season }),

  collectStamp: (scene, photo) => set((state) => {
    const next = new Set(state.collectedStamps);
    next.add(scene);
    // 盖印即拍照：重拍时用新视角照片覆盖旧的
    return {
      collectedStamps: next,
      scenePhotos: photo ? { ...state.scenePhotos, [scene]: photo } : state.scenePhotos
    };
  }),

  toggleAudioMute: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
  setTravelAlbumOpen: (open) => set({ isTravelAlbumOpen: open }),
  setScrollProgress: (progress) => set({ scrollProgress: progress }),

  setTemperature: (temp) => set({ temperature: temp }),
  toggleTowerLit: (index) => set((state) => {
    const next = [...state.towersLit];
    next[index] = !next[index];
    return { towersLit: next };
  }),
  setSunProgress: (progress) => set({ sunProgress: progress }),
  ringBell: () => set((state) => ({ bellRungCount: state.bellRungCount + 1 })),
  setCloudFlow: (flow) => set({ cloudFlow: flow }),
  feedFish: () => set((state) => ({ fishFedCount: state.fishFedCount + 1 })),

  setUserAlias: (alias) =>
    set(() => {
      const clean = alias.trim() || '西湖客';
      lsSet('wl_alias', clean);
      lsSet('wl_aliasSet', 'true');
      return { userAlias: clean, aliasSet: true };
    }),
  setUserHandbill: (line) =>
    set(() => {
      lsSet('wl_handbill', line ?? '');
      return { userHandbill: line || null };
    })
}));
