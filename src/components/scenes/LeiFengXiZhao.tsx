import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeHill, makePagoda, makePine, makeRock, createFlock, makeBoat } from '../../voxel/voxelModels';

const R = 26;

/** 像素落日 */
function buildSun(): THREE.InstancedMesh {
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', fog: false });
  const cells: [number, number][] = [];
  const RR = 4;
  for (let x = -RR; x <= RR; x++) {
    for (let y = -RR; y <= RR; y++) {
      if (Math.sqrt(x * x + y * y) <= RR + 0.3) cells.push([x, y]);
    }
  }
  const m = new THREE.InstancedMesh(geom, mat, cells.length);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  cells.forEach(([x, y], i) => {
    dummy.position.set(x * 1.05, y * 1.05, 0);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
    const d = Math.sqrt(x * x + y * y) / RR;
    c.set(d < 0.5 ? '#FFF3C4' : d < 0.85 ? '#FFC46B' : '#FF8A3C');
    m.setColorAt(i, c);
  });
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  return m;
}

export const LeiFengXiZhao: React.FC = () => {
  const { currentScene, sunProgress } = useWestLakeStore();
  const sunRef = useRef<THREE.InstancedMesh>(null!);
  const sunLightRef = useRef<THREE.DirectionalLight>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);
  const flock = useMemo(() => createFlock(16, new THREE.Vector3(0, 20, -10), 16, PAL.birdDark), []);

  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => z >= 12 && Math.sqrt(x * x + z * z) <= R - 2);
    // 夕照山
    makeHill(b, 0, 0, 13, 9);
    // 雷峰塔
    makePagoda(b, 0, 9, 0, 6, 4, { lit: true });
    // 左右松石
    makePine(b, -12, 2, 6, 6);
    makePine(b, 12, 2, 5, 7);
    makePine(b, -15, 1, -3, 5);
    makePine(b, 15, 1, -4, 5);
    makeRock(b, -10, 4, -6, 1.6);
    makeRock(b, 9, 4, -8, 1.4);
    // 湖上归舟
    makeBoat(b, -10, 0, 18, true);
    makeBoat(b, 8, 0, 20, false);
    return b;
  }, []);

  // 湖面金色倒影带
  const reflTrail = useMemo(() => {
    const b = new VoxelBuilder();
    for (let i = 0; i < 30; i++) {
      const x = -4 + Math.random() * 8;
      const z = 12 + Math.random() * 9;
      b.set(x, -0.3, z, PAL.goldBright, { emissive: PAL.sunOrange, emissiveIntensity: 1.5 });
    }
    return b;
  }, []);

  const sun = useMemo(() => buildSun(), []);
  useEffect(() => () => { sun.dispose(); sun.geometry.dispose(); (sun.material as THREE.Material).dispose(); }, [sun]);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 2; x <= R - 2; x++) {
      for (let z = 12; z <= R - 2; z++) {
        if (Math.sqrt(x * x + z * z) <= R - 2) out.push([x, z]);
      }
    }
    return out;
  }, []);

  useEffect(() => {
    return () => { flock.mesh.dispose(); flock.mesh.geometry.dispose(); };
  }, [flock]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // 太阳随进度下沉：高处 -> 山后
    const sunY = 24 - sunProgress * 20;
    const sunX = -6 + sunProgress * 2;
    if (sunRef.current) {
      sunRef.current.position.set(sunX, sunY, -30);
      sunRef.current.lookAt(0, 9, 0);
    }
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sunX * 2, Math.max(6, sunY), -34);
      const warmth = new THREE.Color('#FFD9A0').lerp(new THREE.Color('#FF5A1F'), sunProgress);
      sunLightRef.current.color.copy(warmth);
      sunLightRef.current.intensity = 2.0 + sunProgress * 1.4;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 2 + Math.sin(t * 2) * 0.4 + sunProgress * 3;
    }
    flock.update(t, 0.016, 0);
  });

  if (currentScene !== 'lei_feng') return null;

  return (
    <group>
      {/* 逆光金红主光 */}
      <directionalLight ref={sunLightRef} position={[-12, 20, -34]} color="#FF8A3C" intensity={2.4} castShadow />
      <ambientLight color="#FFB37E" intensity={0.5} />
      <pointLight ref={glowRef} position={[-6, 14, -28]} color="#FF9E4A" intensity={3} distance={60} />

      <VoxelMesh builder={world} />
      <VoxelWater cells={waterCells} y={-0.5} amplitude={0.2} speed={0.8} />
      <VoxelMesh builder={reflTrail} castShadow={false} receiveShadow={false} jitter={0.05} />

      {/* 落日 */}
      <primitive object={sun} ref={(o: THREE.InstancedMesh) => { if (o) sunRef.current = o; }} />

      {/* 归巢飞鸟 */}
      <primitive object={flock.mesh} />

      {/* 晚霞浮尘 */}
      <VoxelParticles
        count={180}
        mode="firefly"
        colors={[PAL.goldBright, PAL.sunOrange]}
        bounds={{ x: 0, z: 0, w: 46, h: 22, d: 46, floor: 6 }}
        size={0.16}
        emissive
      />
    </group>
  );
};
