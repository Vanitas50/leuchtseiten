import { useLayoutEffect, useMemo } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "../content/chapters";
import { Page } from "./Page";
import { makeShadowTexture } from "./ShadowTexture";
import { Atmosphere } from "./Atmosphere";

// How much world-space vertical extent is always visible, regardless of the
// canvas's pixel size. An orthographic camera avoids the perspective skew a
// close, off-axis PerspectiveCamera produces once a page has rotated far
// from the optical center (it otherwise looks like the book slides off-frame
// mid-turn).
const VISIBLE_WORLD_HEIGHT = 3.2;

function FitOrthoCamera() {
  const camera = useThree((state) => state.camera as THREE.OrthographicCamera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  // useLayoutEffect (not useEffect) so the zoom is correct *before* R3F's
  // first render fires -- otherwise that first frame renders at the default
  // zoom=1 (the book shrinks to a near-invisible speck) and only self-heals
  // on the next animation frame.
  useLayoutEffect(() => {
    camera.zoom = size.height / VISIBLE_WORLD_HEIGHT;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);

  return null;
}

function GroundingShadow() {
  const texture = useMemo(() => makeShadowTexture(), []);
  return (
    <mesh position={[0, -0.15, -0.5]}>
      <planeGeometry args={[4.2, 3.2]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

export function Book({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const slice = 1 / chapters.length;

  return (
    <Canvas orthographic camera={{ position: [0, 0, 10], near: 0.1, far: 50 }}>
      <color attach="background" args={["#14100c"]} />
      <FitOrthoCamera />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} color="#ffdcb0" />
      <GroundingShadow />
      <Atmosphere />
      {chapters.map((chapter, i) => (
        <Page
          key={chapter.id}
          chapter={chapter}
          slice={[i * slice, (i + 1) * slice]}
          progressRef={progressRef}
          stackOffset={-i * 0.01}
        />
      ))}
    </Canvas>
  );
}
