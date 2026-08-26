import * as THREE from "three";

// Soft round sprite used for the drifting dust motes.
export function makeParticleTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,235,200,0.9)");
  gradient.addColorStop(0.4, "rgba(255,220,180,0.35)");
  gradient.addColorStop(1, "rgba(255,220,180,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
