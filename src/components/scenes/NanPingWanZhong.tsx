import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeHill, makeBellFrame, makePine, makeRock, makeLantern, createFlock } from '../../voxel/voxelModels';

const R = 26;

/** 体素古梵钟 */
function buildBell(): VoxelBuilder {
  const b = new VoxelBuilder();
  b.disk(0, 0, 0, 1.3, PAL.gold);
  b.cylinder(0, 1, 0, 1.2, 1.0, 2, '#3A3228');
  b.cylinder(0, 3, 0, 1.0, 0.7, 1, '#4A4238');
  b.set(0, 4, 0, PAL.gold);
  // 钟乳纹
  for (let w = 0; w < 6; w++) {
    const a = (w / 6) * Math.PI * 2;
    b.set(Math.cos(a) * 1.15, 1.5, Math.sin(a) * 1.15, PAL.goldBright);
  }
  return b;
}

export const NanPingWanZhong: React.FC = () => {
  const { currentScene, ringBell } = useWestLakeStore();
  const bellGroupRef = useRef<THREE.Group>(null!);
  const startleRef = useRef(0);
  const strikeTimeRef = useRef(-100);
  const rippleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flock = useMemo(() => createFlock(22, new THREE.Vector3(0, 12, 0), 14, PAL.egret), []);

  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => z >= 14 && Math.sqrt(x * x + z * z) <= R - 2);
    // 南屏山
    makeHill(b, 0, -4, 13, 8);
    // 山顶松林
    makePine(b, -9, 6, -9, 6);
    makePine(b, 9, 6, -9, 7);
    makePine(b, -13, 5, -2, 5);
    makePine(b, 13, 5, -3, 5);
    makePine(b, 0, 8, -11, 6);
    makeRock(b, -6, 7, -12, 1.4);
    makeRock(b, 7, 7, -12, 1.2);
    // 钟楼平台
    b.disk(0, 7, -2, 5, PAL.pathStone);
    makeBellFrame(b, 0, 8, -2);
    makeLantern(b, -6, 7, 3);
    makeLantern(b, 6, 7, 3);
    return b;
  }, []);

  const bell = useMemo(() => buildBell(), []);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 2; x <= R - 2; x++) {
      for (let z = 14; z <= R - 2; z++) {
        if (Math.sqrt(x * x + z * z) <= R - 2) out.push([x, z]);
      }
    }
    return out;
  }, []);

  useEffect(() => () => { flock.mesh.dispose(); flock.mesh.geometry.dispose(); }, [flock]);

  const handleRing = () => {
    audioManager.playBellSound();
    ringBell();
    startleRef.current = 1;
    strikeTimeRef.current = performance.now() / 1000;
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // 钟声后钟体摆动
    const since = performance.now() / 1000 - strikeTimeRef.current;
    if (bellGroupRef.current) {
      if (since < 3) {
        bellGroupRef.current.rotation.z = Math.sin(since * 9) * Math.exp(-since * 1.2) * 0.35;
      } else {
        bellGroupRef.current.rotation.z *= 0.9;
      }
    }
    // 声波金环扩散
    rippleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const local = since - i * 0.25;
      if (local > 0 && local < 2.2) {
        const s = 1 + local * 14;
        mesh.visible = true;
        mesh.scale.set(s, s, s);
        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - local / 2.2));
      } else {
        mesh.visible = false;
      }
    });
    // 惊鹭：能量衰减
    startleRef.current = Math.max(0, startleRef.current - 0.003);
    flock.update(t, 0.016, startleRef.current);
  });

  if (currentScene !== 'nan_ping') return null;

  return (
    <group>
      {/* 暮色暖光 */}
      <directionalLight position={[-26, 22, 18]} color="#FF9E5E" intensity={1.8} castShadow />
      <ambientLight color="#D98A5E" intensity={0.5} />

      <VoxelMesh builder={world} />
      <VoxelWater cells={waterCells} y={-0.5} amplitude={0.18} speed={0.8} />

      {/* 可撞击的古梵钟 */}
      <group
        ref={bellGroupRef}
        position={[0, 10, -2]}
        onClick={(e) => { e.stopPropagation(); handleRing(); }}
      >
        <VoxelMesh builder={bell} />
        {/* 声波金环 */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(el) => { rippleRefs.current[i] = el; }}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <ringGeometry args={[0.9, 1.05, 32]} />
            <meshBasicMaterial color={PAL.goldBright} transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* 林间白鹭 */}
      <primitive object={flock.mesh} />
    </group>
  );
};
