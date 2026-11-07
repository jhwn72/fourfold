"use client";
// A slow tunnel of cards around the viewer. Each card is a real listing parcel or a dot snippet of the city.
// Cards near the camera use a soft copy of their texture (depth blur); far cards fade into the background.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../viz/useReducedMotion";
import type { Theme } from "../theme";
import { blurred, decodeCity, drawCity, drawListing, paletteFor, TILE_H, TILE_W, type CityPoints, type TileListing } from "./tiles";

const VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
uniform sampler2D uSharp;
uniform sampler2D uSoft;
uniform float uBlur;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  vec4 c = mix(texture2D(uSharp, vUv), texture2D(uSoft, vUv), uBlur);
  gl_FragColor = vec4(c.rgb, c.a * uAlpha);
}`;

const COUNT = 34;
const NEAR_Z = 1.5;
const FAR_Z = -34;

type Card = { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; angle: number; radius: number; z: number; tex: number };

function rand(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export default function Tunnel({ listings, bbox, theme }: { listings: TileListing[]; bbox: number[]; theme: Theme }) {
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let disposed = false;
    let raf = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    const group = new THREE.Group();
    scene.add(group);
    const geo = new THREE.PlaneGeometry(1.2, 1.2 * (TILE_H / TILE_W));
    const textures: THREE.Texture[] = [];
    const cards: Card[] = [];

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + "px";
      renderer.domElement.style.height = h + "px";
      camera.aspect = w / Math.max(1, h);
      camera.fov = camera.aspect < 0.8 ? 78 : 60;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const place = (c: Card) => {
      const x = Math.cos(c.angle) * c.radius, y = Math.sin(c.angle) * c.radius;
      c.mesh.position.set(x, y, c.z);
      // Tilt each card toward the axis a little ahead of it, like the inside wall of a tunnel.
      c.mesh.lookAt(0, 0, c.z + 7);
      const near = THREE.MathUtils.smoothstep(c.z, -7, -1.2); // 0 far, 1 at the camera
      const fadeIn = THREE.MathUtils.smoothstep(c.z, FAR_Z, FAR_Z + 12);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(c.z, -0.4, NEAR_Z);
      c.mat.uniforms.uBlur.value = near;
      c.mat.uniforms.uAlpha.value = fadeIn * fadeOut * (1 - 0.4 * near) * (0.38 + 0.62 * THREE.MathUtils.smoothstep(c.z, -24, -6));
    };

    const build = async () => {
      const css = getComputedStyle(document.documentElement);
      const mono = (css.getPropertyValue("--font-dm-mono").trim() || "ui-monospace") + ", ui-monospace, Menlo, monospace";
      const accent = css.getPropertyValue("--accent").trim() || "#ffaa5f";
      try { await document.fonts.ready; } catch {}
      let city: CityPoints | null = null;
      try {
        const r = await fetch("/city-points.bin");
        if (r.ok) city = decodeCity(await r.arrayBuffer());
      } catch {}
      if (disposed) return;
      const pal = paletteFor(theme, accent);
      const canvases: HTMLCanvasElement[] = listings.map((l) => drawListing(l, pal, mono));
      if (city) {
        // City snippets centered on each listing's neighborhood (about 3,000 ft across).
        for (const l of listings.slice(0, 8)) {
          let sx = 0, sy = 0;
          for (const [x, y] of l.ring) { sx += x; sy += y; }
          const cx = (sx / l.ring.length - bbox[0]) / 10, cy = (sy / l.ring.length - bbox[1]) / 10;
          canvases.push(drawCity(city, cx, cy, 150, `NEAR №${l.n}`, pal, mono));
        }
      }
      for (const cv of canvases) {
        const sharp = new THREE.CanvasTexture(cv);
        sharp.colorSpace = THREE.SRGBColorSpace;
        sharp.anisotropy = 4;
        const soft = new THREE.CanvasTexture(blurred(cv));
        soft.colorSpace = THREE.SRGBColorSpace;
        textures.push(sharp, soft);
      }
      const rnd = rand(7);
      const kinds = canvases.length;
      for (let i = 0; i < COUNT; i++) {
        const t = i % kinds;
        const mat = new THREE.ShaderMaterial({
          vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
          uniforms: { uSharp: { value: textures[t * 2] }, uSoft: { value: textures[t * 2 + 1] }, uBlur: { value: 0 }, uAlpha: { value: 0 } },
        });
        const mesh = new THREE.Mesh(geo, mat);
        const scale = 0.75 + rnd() * 0.6;
        mesh.scale.setScalar(scale);
        const card: Card = {
          mesh, mat, tex: t,
          angle: (i / COUNT) * Math.PI * 2 * 3.0 + rnd() * 0.9,
          radius: 2.9 + rnd() * 2.2,
          z: FAR_Z + (i / COUNT) * (NEAR_Z - FAR_Z) + rnd() * 0.6,
        };
        place(card);
        group.add(mesh);
        cards.push(card);
      }
      start();
    };

    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      group.rotation.z += dt * 0.045;
      for (const c of cards) {
        c.z += dt * 1.1;
        if (c.z > NEAR_Z) c.z -= NEAR_Z - FAR_Z;
        place(c);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };
    const start = () => {
      if (disposed) return;
      if (reduced) { group.rotation.z = 0.3; renderer.render(scene, camera); return; }
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const onResizeRender = () => { if (reduced) renderer.render(scene, camera); };
    window.addEventListener("resize", onResizeRender);
    build();

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResizeRender);
      for (const c of cards) c.mat.dispose();
      for (const t of textures) t.dispose();
      geo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [listings, bbox, theme, reduced]);

  return <div ref={wrap} aria-hidden="true" style={{ position: "absolute", inset: 0 }} />;
}
