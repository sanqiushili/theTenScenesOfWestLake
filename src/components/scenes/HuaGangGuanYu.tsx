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

  // 锦鲤群（实例化身体 + 尾）
  const { bodyMesh, tailMesh, kois } = useMemo(() => {
    const bodyGeom = new THREE.BoxGeometry(1.7, 0.5, 0.6);
    const tailGeom = new THREE.BoxGeometry(0.5, 0.4, 0.7);
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, flatShading: true });
    const bm = new THREE.InstancedMesh(bodyGeom, mat, KOI_COUNT);
    const tm = new THREE.InstancedMesh(tailGeom, mat.clone(), KOI_COUNT);
    const c = new THREE.Color();
    const kois = Array.from({ length: KOI_COUNT }).map((_, i) => {
      const color = [PAL.koiOrange, PAL.koiWhite, PAL.koiRed][i % 3];
      c.set(color);
      bm.setColorAt(i, c);
      tm.setColorAt(i, c.set(color).multiplyScalar(0.85));
      return {
        radius: 4 + Math.random() * 13,
        angle: Math.random() * Math.PI * 2,
        speed: (0.25 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
        hopPhase: Math.random() * Math.PI * 2,
        hopFreq: 0.3 + Math.random() * 0.4
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

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const handleFeed = (x: number, z: number) => {
    feedPointRef.current.set(x, 0, z);
    feedTimeRef.current = performance.now() / 1000;
    audioManager.playWaterDropSound();
    feedFish();
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const sinceFeed = performance.now() / 1000 - feedTimeRef.current;
    const feeding = sinceFeed < 5;

    kois.forEach((k, i) => {
      // 投食时加速聚拢
      let speed = k.speed;
      let cx = 0;
      let cz = 0;
      if (feeding) {
        speed = k.speed * 2.6;
        cx = feedPointRef.current.x * 0.75;
        cz = feedPointRef.current.z * 0.75;
      }
      k.angle += speed * 0.016;
      const x = cx + Math.cos(k.angle) * k.radius * (feeding ? 0.45 : 1);
      const z = cz + Math.sin(k.angle) * k.radius * 0.85 * (feeding ? 0.45 : 1);
      // 偶尔跃出水面（投食时更欢腾）
      const hop = Math.max(0, Math.sin(t * k.hopFreq * 2 + k.hopPhase));
      const hopAmp = feeding ? 1.6 : 0.7;
      const y = -0.3 + Math.pow(hop, 3) * hopAmp;

      const dir = Math.atan2(Math.cos(k.angle) * Math.sign(k.speed), -Math.sin(k.angle) * Math.sign(k.speed));
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, -k.angle + (k.speed > 0 ? 0 : Math.PI), Math.sin(t * 2 + i) * 0.1);
      void dir;
      dummy.updateMatrix();
      if (bodyMeshRef.current) bodyMeshRef.current.setMatrixAt(i, dummy.matrix);

      // 尾部跟随（简化：同位置后移）
      dummy.position.x -= Math.cos(k.angle) * 1.1 * Math.sign(k.speed);
      dummy.position.z -= Math.sin(k.angle) * 1.1 * Math.sign(k.speed);
      dummy.rotation.z = Math.sin(t * 6 + i) * 0.5;
      dummy.updateMatrix();
      if (tailMeshRef.current) tailMeshRef.current.setMatrixAt(i, dummy.matrix);
    });
    if (bodyMeshRef.current) bodyMeshRef.current.instanceMatrix.needsUpdate = true;
    if (tailMeshRef.current) tailMeshRef.current.instanceMatrix.needsUpdate = true;

    // 投食涟漪
    if (rippleRef.current) {
      if (feeding) {
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
