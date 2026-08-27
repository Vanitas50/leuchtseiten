import * as THREE from "three";

let cached: THREE.Texture | null = null;

// The edge of a stack of paper -- thin, slightly irregular horizontal
// striations (individual sheets) plus an overall warm cream tone, so the
// book reads as having real thickness instead of being a single floating
// sheet.
export function getPageEdgeTexture(): THREE.Texture {
  if (cached) return cached;

  const w = 128;
  const h = 64;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#e4d8bd";
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 1) {
    const shade = 0.85 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(120, 100, 70, ${0.08 * shade})`;
    ctx.fillRect(0, y, w, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}
