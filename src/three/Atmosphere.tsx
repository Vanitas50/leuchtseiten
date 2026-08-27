import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeParticleTexture } from "./ParticleTexture";

const PARTICLE_COUNT = 110;

function DustMotes() {
  const groupRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => makeParticleTexture(), []);

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = THREE.MathUtils.randFloatSpread(6); // x: -3..3
      arr[i * 3 + 1] = THREE.MathUtils.randFloatSpread(3.6); // y: -1.8..1.8
      arr[i * 3 + 2] = THREE.MathUtils.randFloat(-3, -1); // behind the book
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Slow drift -- cheap, no per-particle physics, just a gentle rotation
    // so the dust reads as ambient depth rather than a static sprinkle.
    groupRef.current.rotation.y += delta * 0.02;
    groupRef.current.position.y = Math.sin(performance.now() * 0.00005) * 0.08;
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.09}
        transparent
        depthWrite={false}
        sizeAttenuation
        opacity={0.5}
      />
    </points>
  );
}

// Mouse parallax lives in Book.tsx's CameraRig -- it also owns the
// book-centering offset, and both need to drive the same camera.position.x
// without fighting each other.
export function Atmosphere() {
  return <DustMotes />;
}
