import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// Hinge lives at local x=0 (the spine). The plane geometry passed to this
// material must already be translated so its vertices span [0, width] --
// i.e. "closed" pages lie to the right of the spine, matching a real book.
// As uProgress goes 0 -> 1 the page rotates 0 -> 180deg around that hinge,
// sweeping from "lying flat right" through "standing edge-on" to "lying
// flat left" -- so a fully turned page ends up on the opposite side of the
// spine instead of mirrored back onto itself.
export const PageMaterial = shaderMaterial(
  {
    uProgress: 0,
    uCurl: 0.3,
    uPageWidth: 1.6,
    uMap: null,
  },
  /* glsl vertex */ `
    uniform float uProgress;
    uniform float uCurl;
    uniform float uPageWidth;
    varying vec2 vUv;
    varying float vShade;
    varying float vRim;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float angle = uProgress * 3.14159265;
      float lengthFrac = pos.x / uPageWidth;
      float bend = sin(lengthFrac * 3.14159265) * uCurl * sin(angle);

      float x = pos.x * cos(angle);
      float z = pos.x * sin(angle) + bend;
      pos.x = x;
      pos.z = z;

      float edgeOn = abs(sin(angle));
      vShade = 1.0 - edgeOn * 0.55;
      vRim = edgeOn;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl fragment */ `
    uniform sampler2D uMap;
    varying vec2 vUv;
    varying float vShade;
    varying float vRim;

    void main() {
      vec4 tex = texture2D(uMap, vUv);
      vec3 warmRim = vec3(1.0, 0.85, 0.6) * vRim * 0.25;
      gl_FragColor = vec4(tex.rgb * vShade + warmRim, tex.a);
    }
  `
);

extend({ PageMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    pageMaterial: any;
  }
}
