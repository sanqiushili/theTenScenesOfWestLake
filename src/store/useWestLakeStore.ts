import { create } from 'zustand';

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
  poem: string;
  poet: string;
  dynasty: string;
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
    poem: '饮湖上初晴后雨二首·其二',
    poet: '苏轼',
    dynasty: '宋',
    description: '薄雾破晓，长堤卧波，两堤杨柳拂水，桃花夹岸竞相吐艳。微风划过，落英缤纷。',
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
    description: '盛夏荷塘，接天莲叶无穷碧，映日荷花别样红。清风拂过，荷香与酒香随水雾弥漫。',
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
    poem: '三潭印月',
    poet: '张岱',
    dynasty: '明',
    description: '夜色如水，三座石塔伫立湖心。月影沉璧，塔内烛光透出，波光粼粼，天月水月争辉。',
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
    poem: '钱塘湖春行',
    poet: '白居易',
    dynasty: '唐',
    description: '冬日残雪，桥阳面雪化水淌，阴面白雪皑皑。远望桥面若断若连，恍入琉璃世界。',
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
    poem: '钱塘湖春行',
    poet: '白居易',
    dynasty: '唐',
    description: '柳浪翻碧，黄莺啼翠。千丝柳带随湖风起伏，数声莺啭穿林而来，春意闹枝头。',
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
    poem: '六月二十七日望湖楼醉书',
    poet: '苏轼',
    dynasty: '宋',
    description: '南北两峰遥相对峙，云起时峰尖隐入天半。山岚流转，若浮玉出海，气象万千。',
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
    poem: '雷峰夕照',
    poet: '林景熙',
    dynasty: '宋',
    description: '夕阳西下，晚霞如金，雷峰塔凌空耸立。塔身在逆光中镀上暖金轮廓，影落湖心。',
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
    poem: '南屏晚钟',
    poet: '陈潦',
    dynasty: '宋',
    description: '暮色笼罩山林古刹，深沉梵钟声震破静谧。声波金环在空中扩散，惊飞林间白鹭。',
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
    description: '疏影横斜水清浅，暗香浮动月黄昏。寒梅著花，雪压枝头，踏雪寻香人未觉。',
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
    description: '绕池闲步看鱼游，正值儿童弄钓舟。锦鲤百尾戏碧波，落花瓣瓣点清涟。',
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

  // Actions
  setCurrentScene: (scene: SceneId) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setSeason: (season: Season) => void;
  collectStamp: (scene: SceneId) => void;
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
  isAudioMuted: false,
  isTravelAlbumOpen: false,
  scrollProgress: 0,

  temperature: 0,
  towersLit: [false, false, false],
  sunProgress: 0.5,
  bellRungCount: 0,
  cloudFlow: 0.5,
  fishFedCount: 0,

  setCurrentScene: (scene) => set((state) => ({
    currentScene: scene,
    // 季节流转仅属于全景总览：进子场景不再改写全局季节，
    // 避免游完断桥残雪回到总览时整个西湖仍是冬态；时辰则跟随各景最佳观赏时段
    timeOfDay: scene !== 'overview' ? WEST_LAKE_SCENES[scene].defaultTime : state.timeOfDay,
    scrollProgress: 0
  })),

  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setSeason: (season) => set({ season }),

  collectStamp: (scene) => set((state) => {
    const next = new Set(state.collectedStamps);
    next.add(scene);
    return { collectedStamps: next };
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
  feedFish: () => set((state) => ({ fishFedCount: state.fishFedCount + 1 }))
}));
