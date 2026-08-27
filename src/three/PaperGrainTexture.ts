import * as THREE from "three";

let cached: THREE.Texture | null = null;

// Subtle repeating fiber noise so paper reads as a physical material up
// close instead of a flat color fill. Generated once and shared across
// every page -- it's identical everywhere, no need to regenerate per page.
export function getPaperGrainTexture(): THREE.Texture {
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Mostly mid-gray with fine per-pixel variance, plus a few longer
    // streaks so it doesn't look like uniform TV static.
    const base = 180 + Math.random() * 50;
    imageData.data[i] = base;
    imageData.data[i + 1] = base;
    imageData.data[i + 2] = base;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  // A handful of soft, faint fiber streaks layered on top.
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#000000";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 4 + Math.random() * 10;
    const angle = Math.random() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}
