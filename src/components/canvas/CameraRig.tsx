import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { useWestLakeStore, WEST_LAKE_SCENES } from '../../store/useWestLakeStore';

export const CameraRig: React.FC = () => {
  const { camera } = useThree();
  const { currentScene } = useWestLakeStore();
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const isTransitioningRef = useRef(false);
  const firstRunRef = useRef(true);
  const lookTarget = useRef(new THREE.Vector3(0, 2, 0));

  useEffect(() => {
    const controls = controlsRef.current;

    let targetPos: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    if (currentScene === 'overview') {
      targetPos = new THREE.Vector3(0, 46, 66);
      targetLookAt = new THREE.Vector3(0, 0, 0);
    } else {
      const data = WEST_LAKE_SCENES[currentScene];
      targetPos = new THREE.Vector3(...data.cameraPos);
      targetLookAt = new THREE.Vector3(...data.cameraTarget);
    }

    // 首次进入直接落位
    if (firstRunRef.current) {
      firstRunRef.current = false;
      camera.position.copy(targetPos);
      lookTarget.current.copy(targetLookAt);
      if (controls) {
        controls.target.copy(targetLookAt);
        controls.update();
      }
      camera.lookAt(targetLookAt);
      return;
    }

    isTransitioningRef.current = true;
    if (controls) controls.enabled = false;

    // 三维贝塞尔弧线飞行：先扬起再俯冲落位
    const startPos = camera.position.clone();
    const startLook = lookTarget.current.clone();
    const midHeight = Math.max(startPos.y, targetPos.y) + 14;
    const midPos = new THREE.Vector3(
      (startPos.x + targetPos.x) / 2,
      midHeight,
      (startPos.z + targetPos.z) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(startPos, midPos, targetPos);

    const anim = { t: 0 };
    const tween = gsap.to(anim, {
      t: 1,
      duration: currentScene === 'overview' ? 2.2 : 2.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = curve.getPoint(anim.t);
        camera.position.copy(p);
        lookTarget.current.lerpVectors(startLook, targetLookAt, anim.t);
        camera.lookAt(lookTarget.current);
        if (controls) {
          controls.target.copy(lookTarget.current);
        }
      },
      onComplete: () => {
        isTransitioningRef.current = false;
        if (controls) {
          controls.target.copy(targetLookAt);
          controls.enabled = true;
          controls.update();
        }
      }
    });

    return () => {
      tween.kill();
    };
  }, [currentScene, camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls && !isTransitioningRef.current) {
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      enablePan={false}
      minDistance={10}
      maxDistance={110}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.06}
      autoRotate={currentScene === 'overview'}
      autoRotateSpeed={0.45}
      target={[0, 2, 0]}
    />
  );
};
