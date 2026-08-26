import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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

// Tiny, deliberately subtle camera nudge that follows the pointer -- gives
// the scene a sense of depth without ever being disorienting.
function MouseParallax() {
  const camera = useThree((state) => state.camera);
  const target = useRef({ x: 0, y: 0 });
  const basePosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (basePosition.current === null) {
      basePosition.current = { x: camera.position.x, y: camera.position.y };
    }
    const handlePointerMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      target.current.x = nx * 0.12;
      target.current.y = -ny * 0.08;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [camera]);

  useFrame(() => {
    if (!basePosition.current) return;
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      basePosition.current.x + target.current.x,
      0.04
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      basePosition.current.y + target.current.y,
      0.04
    );
  });

  return null;
}

export function Atmosphere() {
  return (
    <>
      <DustMotes />
      <MouseParallax />
    </>
  );
}
