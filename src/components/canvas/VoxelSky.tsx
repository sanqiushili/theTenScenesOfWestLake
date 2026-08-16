import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { SKY_PRESETS } from '../../voxel/palette';

/**
 * VoxelSky：负责体素世界的全局光照与天空氛围
 * - 昼夜四态（dawn/noon/sunset/night）颜色平滑插值
 * - 太阳 / 月亮体素天体 + 夜晚星辰
 */
export const VoxelSky: React.FC = () => {
  const { timeOfDay, currentScene } = useWestLakeStore();
  const { scene } = useThree();

  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const hemiRef = useRef<THREE.HemisphereLight>(null!);
  const dirRef = useRef<THREE.DirectionalLight>(null!);
  const sunMeshRef = useRef<THREE.InstancedMesh>(null!);
  const moonMeshRef = useRef<THREE.Mesh>(null!);
  const starsRef = useRef<THREE.InstancedMesh>(null!);

  // 当前插值状态
  const lerpState = useMemo(
    () => ({
      sky: new THREE.Color(SKY_PRESETS.dawn.sky),
      fog: new THREE.Color(SKY_PRESETS.dawn.fog),
      ambient: new THREE.Color(SKY_PRESETS.dawn.ambient),
      hemiSky: new THREE.Color(SKY_PRESETS.dawn.hemiSky),
      hemiGround: new THREE.Color(SKY_PRESETS.dawn.hemiGround),
      sun: new THREE.Color(SKY_PRESETS.dawn.sun),
      ambientIntensity: SKY_PRESETS.dawn.ambientIntensity,
      hemiIntensity: SKY_PRESETS.dawn.hemiIntensity,
      sunIntensity: SKY_PRESETS.dawn.sunIntensity,
      sunPos: new THREE.Vector3(...SKY_PRESETS.dawn.sunPos),
      fogNear: SKY_PRESETS.dawn.fogNear,
      fogFar: SKY_PRESETS.dawn.fogFar,
      starAlpha: 0,
      nightAmount: 0
    }),
    []
  );

  // 预生成各时段预设的 Color/Vector3 对象，避免每帧 new 造成 GC 压力
  const presetTargets = useMemo(() => {
    const out: Record<string, {
      sky: THREE.Color; fog: THREE.Color; ambient: THREE.Color;
      hemiSky: THREE.Color; hemiGround: THREE.Color; sun: THREE.Color;
      sunPos: THREE.Vector3;
    }> = {};
    for (const [key, p] of Object.entries(SKY_PRESETS)) {
      out[key] = {
        sky: new THREE.Color(p.sky),
        fog: new THREE.Color(p.fog),
        ambient: new THREE.Color(p.ambient),
        hemiSky: new THREE.Color(p.hemiSky),
        hemiGround: new THREE.Color(p.hemiGround),
        sun: new THREE.Color(p.sun),
        sunPos: new THREE.Vector3(...p.sunPos)
      };
    }
    return out;
  }, []);

  // 初始化雾与背景
  useEffect(() => {
    scene.fog = new THREE.Fog(lerpState.fog.clone(), lerpState.fogNear, lerpState.fogFar);
    scene.background = lerpState.sky.clone();
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, lerpState]);

  // 太阳体素（方块太阳更有体味）
  const sunMesh = useMemo(() => {
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: '#FFD98A', fog: false });
    const m = new THREE.InstancedMesh(geom, mat, 25);
    const dummy = new THREE.Object3D();
    // 5x5 像素太阳，中心亮外围暖
    let idx = 0;
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        const d = Math.max(Math.abs(x), Math.abs(y));
        if (d === 2 && Math.abs(x) === 2 && Math.abs(y) === 2) continue; // 去角
        dummy.position.set(x * 1.1, y * 1.1, 0);
        dummy.scale.setScalar(d === 0 ? 1.15 : d === 1 ? 1.0 : 0.85);
        dummy.updateMatrix();
        m.setMatrixAt(idx, dummy.matrix);
        const c = new THREE.Color(d === 0 ? '#FFF3C4' : d === 1 ? '#FFD98A' : '#FF9E4A');
        m.setColorAt(idx, c);
        idx++;
      }
    }
    m.count = idx;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    return m;
  }, []);

  // 星辰
  const starsMesh = useMemo(() => {
    const N = 220;
    const geom = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const mat = new THREE.MeshBasicMaterial({ color: '#FFFBEA', transparent: true, opacity: 0, fog: false });
    const m = new THREE.InstancedMesh(geom, mat, N);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      const r = 200 + Math.random() * 40;
      dummy.position.set(
        Math.cos(theta) * Math.sin(phi) * r,
        Math.cos(phi) * r * 0.75 + 18,
        Math.sin(theta) * Math.sin(phi) * r
      );
      dummy.scale.setScalar(0.4 + Math.random() * 1.1);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      c.set('#FFFBEA').multiplyScalar(0.6 + Math.random() * 0.4);
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    return m;
  }, []);

  useFrame((_, delta) => {
    const preset = SKY_PRESETS[timeOfDay];
    const target = presetTargets[timeOfDay];
    const k = Math.min(1, delta * 1.6);

    lerpState.sky.lerp(target.sky, k);
    lerpState.fog.lerp(target.fog, k);
    lerpState.ambient.lerp(target.ambient, k);
    lerpState.hemiSky.lerp(target.hemiSky, k);
    lerpState.hemiGround.lerp(target.hemiGround, k);
    lerpState.sun.lerp(target.sun, k);
    lerpState.ambientIntensity += (preset.ambientIntensity - lerpState.ambientIntensity) * k;
    lerpState.hemiIntensity += (preset.hemiIntensity - lerpState.hemiIntensity) * k;
    lerpState.sunIntensity += (preset.sunIntensity - lerpState.sunIntensity) * k;
    lerpState.sunPos.lerp(target.sunPos, k);
    lerpState.fogNear += (preset.fogNear - lerpState.fogNear) * k;
    lerpState.fogFar += (preset.fogFar - lerpState.fogFar) * k;

    const targetStar = timeOfDay === 'night' ? 1 : 0;
    lerpState.starAlpha += (targetStar - lerpState.starAlpha) * k;
    const targetNight = timeOfDay === 'night' ? 1 : 0;
    lerpState.nightAmount += (targetNight - lerpState.nightAmount) * k;

    if (scene.background instanceof THREE.Color) scene.background.copy(lerpState.sky);
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.color.copy(lerpState.fog);
      fog.near = lerpState.fogNear;
      fog.far = lerpState.fogFar;
    }

    if (ambientRef.current) {
      ambientRef.current.color.copy(lerpState.ambient);
      ambientRef.current.intensity = lerpState.ambientIntensity;
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(lerpState.hemiSky);
      hemiRef.current.groundColor.copy(lerpState.hemiGround);
      hemiRef.current.intensity = lerpState.hemiIntensity;
    }
    if (dirRef.current) {
      dirRef.current.color.copy(lerpState.sun);
      dirRef.current.intensity = lerpState.sunIntensity;
      dirRef.current.position.copy(lerpState.sunPos).multiplyScalar(1.6);
    }

    // 太阳位置随光源方向摆放（雷峰夕照场景由自身太阳主导，弱化全局太阳）
    if (sunMeshRef.current) {
      const p = lerpState.sunPos.clone().multiplyScalar(3.2);
      sunMeshRef.current.position.copy(p);
      sunMeshRef.current.lookAt(0, 8, 0);
      (sunMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - lerpState.nightAmount;
      (sunMeshRef.current.material as THREE.MeshBasicMaterial).transparent = true;
      sunMeshRef.current.visible = lerpState.nightAmount < 0.85;
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.visible = lerpState.nightAmount > 0.15;
      (moonMeshRef.current.material as THREE.MeshBasicMaterial).opacity = lerpState.nightAmount;
      (moonMeshRef.current.material as THREE.MeshBasicMaterial).transparent = true;
    }
    if (starsRef.current) {
      (starsRef.current.material as THREE.MeshBasicMaterial).opacity = lerpState.starAlpha * 0.9;
      starsRef.current.visible = lerpState.starAlpha > 0.02;
    }
  });

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.5} />
      <hemisphereLight ref={hemiRef} intensity={0.5} />
      <directionalLight
        ref={dirRef}
        position={[40, 40, 24]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
      />

      <primitive object={sunMesh} ref={(o: THREE.InstancedMesh) => { if (o) sunMeshRef.current = o; }} />

      {/* 体素月亮：圆形像素盘 */}
      <mesh ref={moonMeshRef} position={[90, 110, -80]} visible={false}>
        <boxGeometry args={[10, 10, 2]} />
        <meshBasicMaterial color="#FFF6D8" fog={false} transparent opacity={0} />
      </mesh>

      <primitive object={starsMesh} ref={(o: THREE.InstancedMesh) => { if (o) starsRef.current = o; }} />

      {/* 场景切换时短暂提亮环境，柔化转场 */}
      {currentScene === 'overview' && <ambientLight intensity={0.12} />}
    </group>
  );
};
