import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "../content/chapters";
import { Page, PAGE_WIDTH } from "./Page";
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

// A closed book only shows one page, which sits to the right of the spine
// (see Page.tsx's hinge geometry) -- left uncorrected, the resting book
// reads as jarringly off-center. This recenters on that single page at the
// very start and very end (the only times just one page is showing) and
// glides back to 0 -- true spine-center -- for the two-page spread that's
// on screen the rest of the time. Mouse parallax rides on top of the same
// camera, so it lives here too instead of fighting a separate controller.
function CameraRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const camera = useThree((state) => state.camera);
  const mouseTarget = useRef({ x: 0, y: 0 });

  // Set the starting position before the first paint (see FitOrthoCamera
  // above for why useLayoutEffect matters here) so the book opens already
  // centered instead of popping in from x=0 over the first few frames.
  useLayoutEffect(() => {
    camera.position.x = PAGE_WIDTH / 2;
  }, [camera]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      mouseTarget.current.x = nx * 0.12;
      mouseTarget.current.y = -ny * 0.08;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame(() => {
    const n = chapters.length;
    const p = progressRef.current;
    const centerReach = PAGE_WIDTH / 2;

    const openingLocal = THREE.MathUtils.clamp(p * n, 0, 1);
    const closingLocal = THREE.MathUtils.clamp((p - (n - 1) / n) * n, 0, 1);
    const centeringOffset =
      centerReach * (1 - openingLocal) - centerReach * closingLocal;

    const targetX = centeringOffset + mouseTarget.current.x;
    const targetY = mouseTarget.current.y;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
  });

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
      <CameraRig progressRef={progressRef} />
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
