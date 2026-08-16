import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { Effect, ToneMappingMode } from 'postprocessing';
import { useWestLakeStore, Season } from '../../store/useWestLakeStore';

/* ------------------------------------------------------------------ */
/*  季节调色：设计文档 §2.1.2 季节色温偏移，全局 Color Grading 通道      */
/* ------------------------------------------------------------------ */

interface SeasonGrade {
  /** RGB 通道加法偏移 */
  add: [number, number, number];
  saturation: number;
  brightness: number;
  contrast: number;
}

const SEASON_GRADE: Record<Season, SeasonGrade> = {
  // 春：整体提亮 +0.05，红色通道 +0.03（偏暖粉）
  spring: { add: [0.03, 0.008, 0.012], saturation: 0.04, brightness: 0.05, contrast: 0 },
  // 夏：饱和度 +0.08，绿色通道 +0.05（偏翠绿）
  summer: { add: [0.0, 0.05, 0.012], saturation: 0.08, brightness: 0.01, contrast: 0 },
  // 秋：色温 +300K（红升蓝降近似），对比度 +0.05（偏琥珀）
  autumn: { add: [0.035, 0.012, -0.02], saturation: 0.05, brightness: 0, contrast: 0.05 },
  // 冬：降饱和 -0.15，蓝色通道 +0.03（偏冷灰）
  winter: { add: [0.002, 0.01, 0.03], saturation: -0.15, brightness: 0.02, contrast: 0 }
};

const SEASON_GRADE_SHADER = `
uniform vec3 uChannelAdd;
uniform float uSaturation;
uniform float uBrightness;
uniform float uContrast;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb + uChannelAdd;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, 1.0 + uSaturation);
  c = (c - 0.5) * (1.0 + uContrast) + 0.5 + uBrightness;
  outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
}`;

class SeasonGradeEffect extends Effect {
  constructor() {
    super('SeasonGrade', SEASON_GRADE_SHADER, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uChannelAdd', new THREE.Uniform(new THREE.Vector3())],
        ['uSaturation', new THREE.Uniform(0)],
        ['uBrightness', new THREE.Uniform(0)],
        ['uContrast', new THREE.Uniform(0)]
      ])
    });
  }
}

/** 季节调色通道：uniform 缓动到目标值，切季节时平滑过渡而非突变 */
const SeasonGradePass: React.FC<{ season: Season }> = ({ season }) => {
  const effect = useMemo(() => new SeasonGradeEffect(), []);
  const targetRef = useMemo(() => ({ add: new THREE.Vector3(), saturation: 0, brightness: 0, contrast: 0 }), []);

  useEffect(() => {
    const g = SEASON_GRADE[season];
    targetRef.add.set(g.add[0], g.add[1], g.add[2]);
    targetRef.saturation = g.saturation;
    targetRef.brightness = g.brightness;
    targetRef.contrast = g.contrast;
  }, [season, targetRef]);

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.001, delta); // 帧率无关的指数缓动
    const u = effect.uniforms;
    (u.get('uChannelAdd')!.value as THREE.Vector3).lerp(targetRef.add, k);
    const sat = u.get('uSaturation')!;
    sat.value += (targetRef.saturation - sat.value) * k;
    const bri = u.get('uBrightness')!;
    bri.value += (targetRef.brightness - bri.value) * k;
    const con = u.get('uContrast')!;
    con.value += (targetRef.contrast - con.value) * k;
  });

  return <primitive object={effect} dispose={null} />;
};

export const PostProcessingPipeline: React.FC = () => {
  const { timeOfDay, season } = useWestLakeStore();

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const bloomIntensity = isNight ? 1.15 : isSunset ? 0.95 : 0.5;

  return (
    <EffectComposer enableNormalPass={false} multisampling={4}>
      {/* 体素夜景 / 夕照的柔和泛光 */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={isNight ? 0.5 : 0.78}
        luminanceSmoothing={0.4}
        height={340}
      />
      {/* 去除景深：它会大范围虚化焦外体素（发糊），且是最耗 GPU 的后处理通道；
          光影氛围由阴影贴图 + 泛光 + MSAA 共同保证 */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* 季节色温偏移（设计文档 §2.1.2）：单全屏着色器，开销可忽略 */}
      <SeasonGradePass season={season} />
      {/* 体素边缘靠 MSAA 4x 保持锐利（比 8x 省一半开销，SMAA 对方块边缘发虚） */}
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
    </EffectComposer>
  );
};
