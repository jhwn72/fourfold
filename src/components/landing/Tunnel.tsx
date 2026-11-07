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

export default function Tunnel({ listings, bbox, theme, warp }: { listings: TileListing[]; bbox: number[]; theme: Theme; warp?: { current: number } }) {
  const warpRef = useRef(warp);
  warpRef.current = warp;
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
    // Particles that hint at the app: the real Santa Ana parcel cloud waiting at the end of the tunnel
    // (candidate lots in the accent color), plus faint dust drifting along the walls with the cards.
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, 0, -15);
    cityGroup.rotation.x = -0.5;
    scene.add(cityGroup);
    let cityGeo: THREE.BufferGeometry | null = null, cityMat: THREE.PointsMaterial | null = null;
    let cityStart: Float32Array | null = null, cityTarget: Float32Array | null = null;
    let cityT = reduced ? 1 : 0;
    const DUST = 900;
    const dustAngle = new Float32Array(DUST), dustRadius = new Float32Array(DUST), dustZ = new Float32Array(DUST);
    const dustPos = new Float32Array(DUST * 3);
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ size: 0.035, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: theme === "dark" ? 0.5 : 0.35, color: theme === "dark" ? 0xf0f0f0 : 0x222222, blending: theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending });
    const dust = new THREE.Points(dustGeo, dustMat);
    group.add(dust);
    const placeDust = () => {
      for (let i = 0; i < DUST; i++) {
        dustPos[i * 3] = Math.cos(dustAngle[i]) * dustRadius[i];
        dustPos[i * 3 + 1] = Math.sin(dustAngle[i]) * dustRadius[i];
        dustPos[i * 3 + 2] = dustZ[i];
      }
      dustGeo.attributes.position.needsUpdate = true;
    };

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
      {
        const dr = rand(11);
        for (let i = 0; i < DUST; i++) { dustAngle[i] = dr() * Math.PI * 2; dustRadius[i] = 2.4 + dr() * 3.6; dustZ[i] = FAR_Z + dr() * (NEAR_Z - FAR_Z); }
        placeDust();
      }
      if (city) {
        // Every other parcel of Santa Ana, scaled into the tunnel's opening.
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < city.n; i++) { minX = Math.min(minX, city.xs[i]); maxX = Math.max(maxX, city.xs[i]); minY = Math.min(minY, city.ys[i]); maxY = Math.max(maxY, city.ys[i]); }
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, k = 4.2 / Math.max(maxX - minX, maxY - minY);
        const m = Math.ceil(city.n / 2);
        cityTarget = new Float32Array(m * 3); cityStart = new Float32Array(m * 3);
        const col = new Float32Array(m * 3);
        const ink = new THREE.Color(theme === "dark" ? 0xd8d8d8 : 0x3a3a3a), amb = new THREE.Color(accent);
        const cr = rand(5);
        for (let j = 0, i = 0; i < city.n && j < m; i += 2, j++) {
          cityTarget[j * 3] = (city.xs[i] - cx) * k; cityTarget[j * 3 + 1] = (city.ys[i] - cy) * k; cityTarget[j * 3 + 2] = 0;
          const a = cr() * Math.PI * 2, r = 3 + cr() * 6;
          cityStart[j * 3] = Math.cos(a) * r; cityStart[j * 3 + 1] = Math.sin(a) * r; cityStart[j * 3 + 2] = 4 + cr() * 10;
          const c = city.codes[i] === 1 ? amb : ink;
          col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b;
        }
        cityGeo = new THREE.BufferGeometry();
        cityGeo.setAttribute("position", new THREE.BufferAttribute(reduced ? cityTarget.slice() : cityStart.slice(), 3));
        cityGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        cityMat = new THREE.PointsMaterial({ size: 0.028, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false, opacity: theme === "dark" ? 0.8 : 0.7, blending: theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending });
        cityGroup.add(new THREE.Points(cityGeo, cityMat));
      }
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
      // Warp (entering the app): cards speed up, the city rushes toward the camera and fills the view.
      const w = warpRef.current?.current ?? 0;
      const we = w * w * (3 - 2 * w);
      const speed = 1 + we * 14;
      group.rotation.z += dt * 0.045 * (1 + we * 2);
      cityGroup.rotation.z -= dt * 0.03;
      cityGroup.position.z = -15 + we * 14.2;
      cityGroup.rotation.x = -0.5 * (1 - we);
      if (cityMat) cityMat.opacity = (theme === "dark" ? 0.8 : 0.7) + we * 0.2;
      if (w > 0 && cityT < 1) cityT = 1;
      // The city assembles from scattered particles over the first few seconds.
      if (cityGeo && cityStart && cityTarget && cityT < 1) {
        cityT = Math.min(1, cityT + dt / 3.2);
        const e = 1 - Math.pow(1 - cityT, 3);
        const pos = cityGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length; i++) pos[i] = cityStart[i] + (cityTarget[i] - cityStart[i]) * e;
        cityGeo.attributes.position.needsUpdate = true;
      }
      for (let i = 0; i < DUST; i++) { dustZ[i] += dt * 1.1 * speed; if (dustZ[i] > NEAR_Z) dustZ[i] -= NEAR_Z - FAR_Z; }
      placeDust();
      for (const c of cards) {
        c.z += dt * 1.1 * speed;
        if (c.z > NEAR_Z) c.z -= NEAR_Z - FAR_Z;
        place(c);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };
    const start = () => {
      if (disposed) return;
      if (reduced) { group.rotation.z = 0.3; placeDust(); renderer.render(scene, camera); return; }
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
      dustGeo.dispose(); dustMat.dispose();
      cityGeo?.dispose(); cityMat?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [listings, bbox, theme, reduced]);

  return <div ref={wrap} aria-hidden="true" style={{ position: "absolute", inset: 0 }} />;
}
