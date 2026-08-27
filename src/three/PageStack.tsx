import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getPageEdgeTexture } from "./PageEdgeTexture";
import { PAGE_WIDTH, PAGE_HEIGHT } from "./Page";

const BAR_THICKNESS = 0.05;

// Thin paper-edge bars above and below the open spread, representing the
// book's actual page block. The right pair (still-to-read pages) shrinks
// and the left pair (already-turned pages) grows as progress advances,
// with total width conserved -- the same physical pages just redistribute
// between the two stacks, exactly like a real book being read through.
function EdgeBar({
  side,
  y,
  progressRef,
}: {
  side: "left" | "right";
  y: number;
  progressRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => getPageEdgeTexture(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, BAR_THICKNESS);
    // Pivot at the spine (x=0) so scaling grows/shrinks from the spine
    // outward instead of from the center.
    geo.translate(side === "right" ? 0.5 : -0.5, 0, 0);
    return geo;
  }, [side]);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = progressRef.current;
    const width =
      side === "right" ? PAGE_WIDTH * (1 - p) : PAGE_WIDTH * p;
    meshRef.current.scale.x = Math.max(width, 0.0001);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, y, -0.02]}>
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function PageStack({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const topY = PAGE_HEIGHT / 2 + BAR_THICKNESS / 2 + 0.01;
  const bottomY = -PAGE_HEIGHT / 2 - BAR_THICKNESS / 2 - 0.01;

  return (
    <>
      <EdgeBar side="right" y={topY} progressRef={progressRef} />
      <EdgeBar side="right" y={bottomY} progressRef={progressRef} />
      <EdgeBar side="left" y={topY} progressRef={progressRef} />
      <EdgeBar side="left" y={bottomY} progressRef={progressRef} />
    </>
  );
}
