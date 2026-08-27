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
    uGrain: null,
    uGrainRepeat: 6.0,
    // Direction the light travels FROM (matches Book.tsx's directionalLight
    // at position [2,3,4] aimed at the origin) -- fixed rather than a real
    // uniform-per-light lookup since we only ever have the one light.
    uLightDir: [0.4576, 0.6863, 0.9151],
  },
  /* glsl vertex */ `
    uniform float uProgress;
    uniform float uCurl;
    uniform float uPageWidth;
    uniform vec3 uLightDir;
    varying vec2 vUv;
    varying float vDiffuse;
    varying float vRim;
    varying float vSpineAO;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float angle = uProgress * 3.14159265;
      float lengthFrac = pos.x / uPageWidth;
      float bendAmount = sin(lengthFrac * 3.14159265) * uCurl * sin(angle);

      float x = pos.x * cos(angle);
      float z = pos.x * sin(angle) + bendAmount;
      pos.x = x;
      pos.z = z;

      // Analytic derivative of z with respect to the page's own (unturned)
      // x-axis, used to build a curvature-aware normal -- a page that's
      // curling should shade like an actually-bent surface, not a flat
      // card with a single global brightness value.
      float dBendDx = (3.14159265 / uPageWidth) * cos(lengthFrac * 3.14159265) * uCurl * sin(angle);
      float dzdx = sin(angle) + dBendDx;
      vec3 normal = normalize(vec3(-dzdx, 0.0, cos(angle)));
      vDiffuse = max(dot(normal, normalize(uLightDir)), 0.0);

      float edgeOn = abs(sin(angle));
      vRim = edgeOn;
      // Bound pages sit tight against their neighbors at the spine -- a
      // faint contact shadow there sells the binding even at rest.
      vSpineAO = smoothstep(0.0, 0.35, lengthFrac);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl fragment */ `
    uniform sampler2D uMap;
    uniform sampler2D uGrain;
    uniform float uGrainRepeat;
    varying vec2 vUv;
    varying float vDiffuse;
    varying float vRim;
    varying float vSpineAO;

    void main() {
      vec4 tex = texture2D(uMap, vUv);
      float grain = texture2D(uGrain, vUv * uGrainRepeat).r;
      // Keep the grain subtle -- it should read as paper fiber up close,
      // not as visible noise from a normal viewing distance.
      float grainFactor = 0.94 + grain * 0.12;

      float shade = mix(0.55, 1.05, vDiffuse) * mix(0.85, 1.0, vSpineAO);
      vec3 warmRim = vec3(1.0, 0.85, 0.6) * vRim * 0.22;

      gl_FragColor = vec4(tex.rgb * grainFactor * shade + warmRim, tex.a);
    }
  `
);

extend({ PageMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    pageMaterial: any;
  }
}
