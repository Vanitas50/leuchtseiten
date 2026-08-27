import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "../content/chapters";
import { Page, PAGE_WIDTH } from "./Page";
import { makeShadowTexture } from "./ShadowTexture";
import { Atmosphere } from "./Atmosphere";
import { PageStack } from "./PageStack";

// How much world-space vertical extent is always visible, regardless of the
// canvas's pixel size. An orthographic camera avoids the perspective skew a
// close, off-axis PerspectiveCamera produces once a page has rotated far
// from the optical center (it otherwise looks like the book slides off-frame
// mid-turn).
const VISIBLE_WORLD_HEIGHT = 3.2;
const WIDTH_MARGIN = 0.3;

// How much horizontal room the book actually needs right now: just one
// page's width at rest (closed, or fully turned at the very end), growing
// to a full two-page spread while pages are actively being turned. Using a
// *dynamic* width here (rather than always reserving room for the widest
// possible spread) is what lets the book fill a narrow phone screen while
// closed instead of sitting tiny in the middle with dead space on both
// sides -- the zoom only pulls back when the spread genuinely needs it.
function currentRequiredWidth(progress: number) {
  const n = chapters.length;
  const openingLocal = THREE.MathUtils.clamp(progress * n, 0, 1);
  const closingLocal = THREE.MathUtils.clamp((progress - (n - 1) / n) * n, 0, 1);
  return PAGE_WIDTH + PAGE_WIDTH * openingLocal - PAGE_WIDTH * closingLocal;
}

// A closed book only shows one page, which sits to the right of the spine
// (see Page.tsx's hinge geometry) -- left uncorrected, the resting book
// reads as jarringly off-center. This recenters on that single page at the
// very start and very end (the only times just one page is showing) and
// glides back to 0 -- true spine-center -- for the two-page spread that's
// on screen the rest of the time. Zoom is handled here too (rather than a
// separate static fit-to-height component) since it needs the same
// progress-aware "how much width is needed right now" logic as centering
// does, and both write to the same camera every frame.
function CameraRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const camera = useThree((state) => state.camera as THREE.OrthographicCamera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const mouseTarget = useRef({ x: 0, y: 0 });

  // Correct position *and* zoom before the first paint (useLayoutEffect,
  // not useEffect) -- otherwise the first frame renders at the default
  // zoom=1 (a near-invisible speck) and/or un-centered, popping into place
  // over the next few frames instead of opening already correct.
  useLayoutEffect(() => {
    camera.position.x = PAGE_WIDTH / 2;
    const heightZoom = size.height / VISIBLE_WORLD_HEIGHT;
    const widthZoom = size.width / (currentRequiredWidth(progressRef.current) + WIDTH_MARGIN);
    camera.zoom = Math.min(heightZoom, widthZoom);
    camera.updateProjectionMatrix();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size, invalidate]);

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

    const heightZoom = size.height / VISIBLE_WORLD_HEIGHT;
    const widthZoom = size.width / (currentRequiredWidth(p) + WIDTH_MARGIN);
    const targetZoom = Math.min(heightZoom, widthZoom);
    // Asymmetric easing: zooming *out* (content needs more room) has to
    // keep up with a fast flick-scroll or the spread clips off the edge of
    // the screen for a frame or two, so that direction snaps quickly.
    // Zooming back *in* is never at risk of clipping anything, so it can
    // ease slowly for a calmer feel.
    const zoomLerp = targetZoom < camera.zoom ? 0.35 : 0.06;
    if (Math.abs(camera.zoom - targetZoom) > 0.01) {
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, zoomLerp);
      camera.updateProjectionMatrix();
    }
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
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], near: 0.1, far: 50 }}
      // Phones commonly report a devicePixelRatio of 3+; rendering at full
      // native resolution there is a lot of wasted GPU work (and battery)
      // for a visual difference nobody will see. Capping at 2 keeps things
      // sharp while staying smooth on mid-range hardware.
      dpr={[1, 2]}
      // We have no interactive meshes (no onClick/onPointerOver), but R3F's
      // event manager still attaches pointer listeners to the canvas by
      // default. A canvas covering the full viewport can swallow the touch
      // gesture that would otherwise scroll the page -- explicitly allow
      // vertical panning so touch-scrolling on mobile keeps working.
      style={{ touchAction: "pan-y" }}
      events={() => ({ enabled: false, priority: 0 })}
    >
      <color attach="background" args={["#14100c"]} />
      <CameraRig progressRef={progressRef} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} color="#ffdcb0" />
      <GroundingShadow />
      <PageStack progressRef={progressRef} />
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
