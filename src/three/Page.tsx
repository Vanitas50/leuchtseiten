import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./PageMaterial";
import { makePlaceholderTexture } from "./PlaceholderTexture";
import { getPaperGrainTexture } from "./PaperGrainTexture";
import type { Chapter } from "../content/chapters";

export const PAGE_WIDTH = 1.6;
export const PAGE_HEIGHT = 2.2;

interface PageProps {
  chapter: Chapter;
  /** [start, end] slice of the global 0..1 scroll progress this page owns. */
  slice: [number, number];
  progressRef: MutableRefObject<number>;
  /** z-stacking offset so untouched/turned pages don't z-fight. */
  stackOffset: number;
}

// Geometry is translated so x spans [0, PAGE_WIDTH] -- the hinge (x=0) sits
// at the book's spine. See PageMaterial.ts for how that hinge is used.
function useHingedGeometry() {
  return useMemo(() => {
    const geometry = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 48, 1);
    geometry.translate(PAGE_WIDTH / 2, 0, 0);
    return geometry;
  }, []);
}

export function Page({ chapter, slice, progressRef, stackOffset }: PageProps) {
  const materialRef = useRef<any>(null);
  const geometry = useHingedGeometry();

  const texture = useMemo(() => {
    if (chapter.image) return new THREE.TextureLoader().load(chapter.image);
    return makePlaceholderTexture(chapter.title, chapter.date);
  }, [chapter.image, chapter.title, chapter.date]);

  useFrame(() => {
    if (!materialRef.current) return;
    const [start, end] = slice;
    const local = THREE.MathUtils.clamp(
      (progressRef.current - start) / (end - start),
      0,
      1
    );
    materialRef.current.uProgress = local;
  });

  return (
    <mesh geometry={geometry} position={[0, 0, stackOffset]}>
      {/* @ts-ignore custom shader element registered via extend() */}
      {/*
        Deliberately opaque (no `transparent`): our texture alpha is always 1,
        and marking this transparent pushed it into three.js's back-to-front
        object queue, which sorts by a cached rest-pose bounding-sphere center
        rather than the shader-displaced position. Once more than one page had
        diverged from its rest angle, that stale sort order drew pages in the
        wrong order and the depth test discarded ones that should've been
        visible. Opaque rendering uses the per-pixel depth buffer instead,
        which stays correct regardless of the vertex shader's rotation.
      */}
      <pageMaterial
        ref={materialRef}
        uMap={texture}
        uGrain={getPaperGrainTexture()}
        uPageWidth={PAGE_WIDTH}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
