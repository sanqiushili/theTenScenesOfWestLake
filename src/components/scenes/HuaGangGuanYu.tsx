import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeArchBridge, makePavilion, makeRock, makePine, makePeach } from '../../voxel/voxelModels';

const R = 26;
const KOI_COUNT = 26;

export const HuaGangGuanYu: React.FC = () => {
  const { currentScene, feedFish } = useWestLakeStore();
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null!);
  const tailMeshRef = useRef<THREE.InstancedMesh>(null!);
  const rippleRef = useRef<THREE.Mesh>(null!);
  const feedTimeRef = useRef(-100);
  const feedPointRef = useRef(new THREE.Vector3(0, 0, 0));

  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => Math.sqrt(x * x + z * z) <= 19);
    // 池岸牡丹花坛
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const x = Math.round(Math.cos(a) * 21);
      const z = Math.round(Math.sin(a) * 21);
      if (Math.sqrt(x * x + z * z) > R - 3) continue;
      b.set(x, 0, z, [PAL.peachDeep, PAL.lotusPink, PAL.goldBright, PAL.vermilion][i % 4]);
    }
    // 曲桥跨池一角
    makeArchBridge(b, -14, 13, 'x', 9, 2, 2, PAL.pathStone, PAL.wallWhite, -1);
    // 观鱼亭
    b.disk(16, -1, -16, 3.6, PAL.sand, { edgeSkip: 0.2 });
    b.disk(16, 0, -16, 2.6, PAL.grass);
    makePavilion(b, 16, 0, -16, 1.5, PAL.roofDark);
    makeRock(b, -19, -1, -10, 1.6);
    makeRock(b, 20, -1, 8, 1.3);
    makePine(b, -20, -1, -4, 5);
    makePeach(b, 21, -1, -2, 3);
    makePeach(b, -21, -1, 6, 3);
    return b;
  }, []);

  // 锦鲤群（实例化身体 + 尾）：转向式漫游，每条鱼有独立的巡航节奏与摆尾相位
  const { bodyMesh, tailMesh, kois } = useMemo(() => {
    const bodyGeom = new THREE.BoxGeometry(1.7, 0.5, 0.6);
    // 尾鳍几何原点平移到连接处，旋转时绕尾根摆动而非自身中心
    const tailGeom = new THREE.BoxGeometry(0.5, 0.4, 0.7);
    tailGeom.translate(-0.25, 0, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, flatShading: true });
    const bm = new THREE.InstancedMesh(bodyGeom, mat, KOI_COUNT);
    const tm = new THREE.InstancedMesh(tailGeom, mat.clone(), KOI_COUNT);
    const c = new THREE.Color();
    const kois = Array.from({ length: KOI_COUNT }).map((_, i) => {
      const color = [PAL.koiOrange, PAL.koiWhite, PAL.koiRed][i % 3];
      c.set(color);
      bm.setColorAt(i, c);
      tm.setColorAt(i, c.set(color).multiplyScalar(0.85));
      // 随机散布在池内，朝向各异
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 15;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        heading: Math.random() * Math.PI * 2,   // 实际游动朝向（= 速度方向）
        cruise: 1.1 + Math.random() * 1.1,      // 巡航速度
        speedFreq: 0.22 + Math.random() * 0.2,  // 缓行↔疾游的呼吸节奏
        speedPhase: Math.random() * Math.PI * 2,
        wanderFreq: 0.5 + Math.random() * 0.5,  // 摆头转弯频率
        wanderPhase: Math.random() * Math.PI * 2,
        turnDir: Math.random() > 0.5 ? 1 : -1,  // 每尾鱼偏爱的回旋方向
        wagPhase: Math.random() * Math.PI * 2,
        wag: 0,
        hopFreq: 0.2 + Math.random() * 0.13,    // 跃水周期（约 15~31s 一次）
        hopPhase: Math.random() * Math.PI * 2
      };
    });
    if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
    if (tm.instanceColor) tm.instanceColor.needsUpdate = true;
    bm.castShadow = true;
    return { bodyMesh: bm, tailMesh: tm, kois };
  }, []);

  useEffect(() => () => {
    bodyMesh.dispose(); bodyMesh.geometry.dispose(); (bodyMesh.material as THREE.Material).dispose();
    tailMesh.dispose(); tailMesh.geometry.dispose(); (tailMesh.material as THREE.Material).dispose();
  }, [bodyMesh, tailMesh]);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -19; x <= 19; x++) {
      for (let z = -19; z <= 19; z++) {
        if (Math.sqrt(x * x + z * z) <= 19) out.push([x, z]);
      }
    }
    return out;
  }, []);

  const bodyDummy = useMemo(() => new THREE.Object3D(), []);
  const tailDummy = useMemo(() => new THREE.Object3D(), []);
  const feedEnergyRef = useRef(0);

  const handleFeed = (x: number, z: number) => {
    feedPointRef.current.set(x, 0, z);
    feedTimeRef.current = performance.now() / 1000;
    audioManager.playWaterDropSound();
    feedFish();
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);
    const sinceFeed = performance.now() / 1000 - feedTimeRef.current;
    // 投食兴奋度：攻击时缓升、结束后缓降，聚散都不突跳
    const feedTarget = sinceFeed < 6 ? 1 : 0;
    feedEnergyRef.current += (feedTarget - feedEnergyRef.current) * Math.min(1, dt * (feedTarget ? 2.5 : 0.7));
    const energy = feedEnergyRef.current;

    kois.forEach((k, i) => {
      /* --- 转向：漫游摆头 + 池岸回转 + 投食趋食 --- */
      const wander = Math.sin(t * k.wanderFreq + k.wanderPhase) * 0.9 * k.turnDir;
      let steer = wander;

      // 近岸柔和回转，绝不撞岸急折
      const dist = Math.hypot(k.x, k.z);
      if (dist > 16.5) {
        const inward = Math.atan2(-k.z, -k.x);
        let d = inward - k.heading;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        steer += d * Math.min(3, (dist - 16.5) * 1.6);
      }
      // 轻微环池巡游偏向，走姿更像池鲤而非无头苍蝇
      steer += 0.1 * k.turnDir;

      // 投食：朝食点转向 + 到达后绕食点小圈巡游，各自留岍位不叠成一点
      if (energy > 0.02) {
        const fx = feedPointRef.current.x * 0.8;
        const fz = feedPointRef.current.z * 0.8;
        const offA = k.wanderPhase;
        const tx = fx + Math.cos(offA) * 2.4;
        const tz = fz + Math.sin(offA) * 2.4;
        const toFood = Math.atan2(tz - k.z, tx - k.x);
        let d = toFood - k.heading;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        steer = THREE.MathUtils.lerp(steer, d * 2.4, energy);
      }
      k.heading += steer * dt;

      /* --- 速度：巡航呼吸节奏 + 投食冲刺 --- */
      let speed = k.cruise * (0.55 + 0.45 * Math.sin(t * k.speedFreq + k.speedPhase));
      speed *= 1 + energy * 1.9;
      speed = Math.max(0.3, speed);
      k.x += Math.cos(k.heading) * speed * dt;
      k.z += Math.sin(k.heading) * speed * dt;

      /* --- 垂直：贴水缓游 + 偶尔跃出（稀疏、抛物线、带俯仰） --- */
      let y = -0.32 + Math.sin(t * 0.9 + k.speedPhase) * 0.07;
      let pitch = 0;
      const hopWin = Math.sin(t * k.hopFreq + k.hopPhase);
      if (hopWin > 0.96) {
        const u = (hopWin - 0.96) / 0.04; // 0→1→0
        const arc = Math.sin(u * Math.PI);
        y += arc * (1.0 + energy * 0.7);
        const vy = Math.cos(u * Math.PI);
        pitch = -vy * 0.55; // 出水仰头、入水俯冲
      }

      /* --- 身体：朝向=速度方向，摆头与转向同源 --- */
      bodyDummy.position.set(k.x, y, k.z);
      bodyDummy.rotation.set(pitch, -k.heading, wander * 0.08);
      bodyDummy.updateMatrix();
      if (bodyMeshRef.current) bodyMeshRef.current.setMatrixAt(i, bodyDummy.matrix);

      /* --- 尾鳍：摆频随游速（游得快摆得急），尾根跟随身体朝向 --- */
      const wagTarget = Math.sin(t * (3.5 + speed * 2.8) + k.wagPhase) * (0.3 + speed * 0.1);
      k.wag += (wagTarget - k.wag) * Math.min(1, dt * 14);
      tailDummy.position.set(
        k.x - Math.cos(k.heading) * 1.02,
        y,
        k.z - Math.sin(k.heading) * 1.02
      );
      tailDummy.rotation.set(pitch * 0.6, -(k.heading - k.wag), 0);
      tailDummy.updateMatrix();
      if (tailMeshRef.current) tailMeshRef.current.setMatrixAt(i, tailDummy.matrix);
    });
    if (bodyMeshRef.current) bodyMeshRef.current.instanceMatrix.needsUpdate = true;
    if (tailMeshRef.current) tailMeshRef.current.instanceMatrix.needsUpdate = true;

    // 投食涟漪
    if (rippleRef.current) {
      if (energy > 0.05) {
        const s = 1 + (sinceFeed % 1.2) * 6;
        rippleRef.current.visible = true;
        rippleRef.current.position.set(feedPointRef.current.x, 0.15, feedPointRef.current.z);
        rippleRef.current.scale.set(s, s, s);
        (rippleRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - (sinceFeed % 1.2) * 0.65);
      } else {
        rippleRef.current.visible = false;
      }
    }
  });

  if (currentScene !== 'hua_gang') return null;

  return (
    <group>
      {/* 正午明亮光 */}
      <directionalLight position={[16, 42, 10]} color="#FFF8E8" intensity={1.8} castShadow />
      <ambientLight color="#F0F4E8" intensity={0.55} />

      <VoxelMesh builder={world} />
      <VoxelWater
        cells={waterCells}
        y={-0.5}
        amplitude={0.13}
        speed={1.1}
        opacity={0.92}
      />

      {/* 投食隐形拾取面：单个圆面代替上千个水格实例的射线检测 */}
      <mesh
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.3, 0]}
        onClick={(e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
          e.stopPropagation();
          handleFeed(Math.round(e.point.x), Math.round(e.point.z));
        }}
      >
        <circleGeometry args={[19, 32]} />
      </mesh>

      {/* 锦鲤 */}
      <primitive object={bodyMesh} ref={(o: THREE.InstancedMesh) => { if (o) bodyMeshRef.current = o; }} />
      <primitive object={tailMesh} ref={(o: THREE.InstancedMesh) => { if (o) tailMeshRef.current = o; }} />

      {/* 涟漪 */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.85, 1.05, 32]} />
        <meshBasicMaterial color={PAL.waterGlow} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* 花瓣点清涟 */}
      <VoxelParticles
        count={360}
        mode="petal"
        colors={[PAL.peachPink, PAL.plumPink, '#FFE9F0']}
        bounds={{ x: 0, z: 0, w: 44, h: 14, d: 44, floor: -0.4 }}
        size={0.2}
        speed={0.6}
        mouseVortex
      />
    </group>
  );
};
