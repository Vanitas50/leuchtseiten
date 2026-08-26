import * as THREE from "three";

function drawPlaceholder(
  canvas: HTMLCanvasElement,
  title: string,
  date: string
) {
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4ecdd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#d8c9a8";
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.fillStyle = "#8a6f4e";
  ctx.textAlign = "center";
  ctx.font = "56px Caveat, cursive";
  ctx.fillText(date || "…", canvas.width / 2, canvas.height / 2 - 10);

  ctx.fillStyle = "#5b4636";
  ctx.font = "48px Fraunces, serif";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 + 50);
}

// Stand-in artwork for chapters that don't have a real scan yet, so the
// scaffold is visibly meaningful before any assets are dropped in.
export function makePlaceholderTexture(title: string, date: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;

  drawPlaceholder(canvas, title, date);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // The canvas draws with whatever font is loaded *right now* -- if
  // Fraunces/Caveat haven't finished loading yet, redraw once they have so
  // the placeholder doesn't get stuck on the fallback serif.
  document.fonts.ready.then(() => {
    drawPlaceholder(canvas, title, date);
    texture.needsUpdate = true;
  });

  return texture;
}
