/**
 * 个性化文案与选景工具（为小红书小工具注入「和自己结合」的分享动机）。
 * 所有内容均为离线静态常量，不依赖任何外部请求。
 */
import { ALL_SCENE_IDS, SceneId, WEST_LAKE_SCENES } from '../store/useWestLakeStore';

/** 首次题名时的快速别号建议（点选即可，也可手输） */
export const ALIAS_SUGGESTIONS: string[] = [
  '西湖客',
  '临安散人',
  '钱塘过客',
  '湖上闲人',
  '江南浪子',
  '苏堤看客',
  '断桥听雪',
  '三潭望月'
];

/**
 * 游历手札预设短句（星巴克取单口令风格：可俏皮可诗意，用户随机或自选一句）。
 * 印在《游历图册》封面作点睛，并带入小红书笔记文案。
 */
export const HANDBILL_PRESETS: string[] = [
  '偷得浮生半日闲',
  '西湖一杯敬自己',
  '人间清醒西湖醉',
  '把心事留给断桥雪',
  '来都来了，盖个印',
  '本日宜发呆不宜上班',
  '我是西湖临时居民',
  '到此一游，下次还来',
  '荷风十里不如你',
  '山外有山，湖外有我',
  '今日宜：虚度光阴',
  '钱塘潮我不管，只看湖',
  '一蓑烟雨任平生',
  '且将新火试新茶',
  '西湖限定·快乐浓度100%',
  '在西湖当一天闲人'
];

/** 从预设里随机挑一句（避免连续两次相同） */
export function randomHandbill(exclude?: string | null): string {
  const pool = exclude ? HANDBILL_PRESETS.filter((l) => l !== exclude) : HANDBILL_PRESETS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 今日宜访：按日期确定性地推荐一景（同日同景，隔日切换），
 * 用作轻互动回访钩子。点击可直达该景点。
 */
export function getDailySceneId(d: Date = new Date()): Exclude<SceneId, 'overview'> {
  const startOfYear = Date.UTC(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - startOfYear) / 86_400_000);
  const idx = dayOfYear % ALL_SCENE_IDS.length;
  return ALL_SCENE_IDS[idx];
}

/** 推荐景的展示名（含简短理由，营造「宜忌」仪式感） */
export function dailySceneHint(
  d: Date = new Date()
): { id: Exclude<SceneId, 'overview'>; name: string; reason: string } {
  const id = getDailySceneId(d);
  const data = WEST_LAKE_SCENES[id];
  const reasons: Record<SceneId, string> = {
    su_di: '春晓宜行，趁杨柳初醒',
    qu_yuan: '夏日宜荷，风过酒香',
    san_tan: '静夜宜月，三潭印心',
    duan_qiao: '残雪宜忆，白堤独步',
    liu_lang: '晨光宜莺，柳浪听啼',
    shuang_feng: '云开宜望，双峰插霄',
    lei_feng: '斜阳宜照，塔影沉金',
    nan_ping: '晚钟宜静，山寺听幽',
    ling_feng: '探梅宜雪，暗香浮动',
    hua_gang: '观鱼宜闲，投饵成趣',
    overview: '总览宜游，十景在望'
  };
  return { id, name: data.name, reason: reasons[id] ?? '今日宜游' };
}
