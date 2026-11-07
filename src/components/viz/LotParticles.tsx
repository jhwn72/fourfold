"use client";
// The real parcel, drawn in particles: it assembles, the split line draws, the two lots part slightly,
// and the homes rise. 3D = tilted with a slow drift; Flat = straight down, north up.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { LotModel } from "./lotModel";
import { pointInRing } from "./lotModel";
import { useReducedMotion } from "./useReducedMotion";

// Groups: 0 ground fill, 1 outline, 2 split line, 3 existing building, 4 new home, 5 existing home marker
const VERT = `
attribute vec3 aStart;
attribute float aGroup;
attribute float aSide;
attribute float aDelay;
attribute float aRise;
uniform float uT;
uniform vec2 uSep;
uniform float uRef;
uniform float uPR;
uniform float uScale;
varying float vGroup;
varying float vAlpha;
float ease(float x) { x = clamp(x, 0.0, 1.0); return 1.0 - pow(1.0 - x, 3.0); }
void main() {
  vec3 p = position;
  float a = 1.0;
  if (aGroup < 3.5 && aGroup != 2.0) {
    float k = ease((uT - aDelay * 0.7) / 0.9);
    p = mix(aStart, position, k);
    a = k;
  }
  if (aGroup == 2.0) { a = step(aDelay, (uT - 1.25) / 0.6); }
  float sep = ease((uT - 1.9) / 0.6);
  if (aSide > 0.5) { p.x += uSep.x * sep; p.z += uSep.y * sep; }
  if (aGroup > 3.5) {
    float r = ease((uT - 2.5 - aDelay * 0.5) / 0.8);
    p.y = position.y * r;
    a = r > 0.0 ? 1.0 : 0.0;
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float base = aGroup == 0.0 ? 1.1 : (aGroup == 2.0 ? 2.0 : (aGroup >= 4.0 ? 1.8 : 1.6));
  gl_PointSize = base * uScale * uPR * (uRef / -mv.z);
  vGroup = aGroup;
  vAlpha = a;
}`;
const FRAG = `
uniform vec3 uInk;
uniform vec3 uAccent;
varying float vGroup;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float soft = smoothstep(0.5, 0.05, d);
  vec3 col = uInk;
  float a = 0.9;
  if (vGroup == 0.0) a = 0.16;
  else if (vGroup == 2.0) { col = uAccent; a = 0.95; }
  else if (vGroup == 3.0) a = 0.45;
  else if (vGroup == 4.0) { col = uAccent; a = 0.8; }
  else if (vGroup == 5.0) a = 0.8;
  gl_FragColor = vec4(col, a * soft * vAlpha);
}`;

export type LotView = "3d" | "flat";

export default function LotParticles({ model, view, height = 420, replayKey = 0 }: { model: LotModel; view: LotView; height?: number; replayKey?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    const el = wrap.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const P: number[] = [], S: number[] = [], G: number[] = [], SIDE: number[] = [], DL: number[] = [], R: number[] = [];
    const E = model.extent;
    const sideOf = (x: number, y: number) => (model.lotB && pointInRing([x, y], model.lotB) ? 1 : 0);
    const push = (x: number, y: number, h: number, g: number, delay: number, side?: number) => {
      // world: x east, z = -north, y up
      P.push(x, h, -y);
      const ang = Math.random() * Math.PI * 2, rr = E * (0.6 + Math.random() * 0.9);
      S.push(x + Math.cos(ang) * rr, E * (0.3 + Math.random() * 0.8), -y + Math.sin(ang) * rr);
      G.push(g); DL.push(delay); R.push(h > 0 ? 1 : 0);
      SIDE.push(side ?? sideOf(x, y));
    };
    const edges = (ring: number[][], spacing: number, cb: (x: number, y: number, t: number) => void) => {
      let total = 0;
      for (let i = 1; i < ring.length; i++) total += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
      let acc = 0;
      for (let i = 1; i < ring.length; i++) {
        const [x1, y1] = ring[i - 1], [x2, y2] = ring[i];
        const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / spacing));
        for (let k = 0; k < n; k++) { const t = k / n; cb(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, (acc + L * t) / total); }
        acc += L;
      }
    };
    // Ground fill: random points inside the parcel.
    const xs = model.ring.map((p) => p[0]), ys = model.ring.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    let placed = 0;
    for (let tries = 0; placed < 2200 && tries < 20000; tries++) {
      const x = minX + Math.random() * (maxX - minX), y = minY + Math.random() * (maxY - minY);
      if (pointInRing([x, y], model.ring)) { push(x, y, 0, 0, Math.random()); placed++; }
    }
    // Outlines: the parcel and, if split, each lot's own edge so both halves look closed when they part.
    const spacing = E / 260;
    const outlines = model.lotA && model.lotB ? [model.lotA, model.lotB] : [model.ring];
    outlines.forEach((r, i) => edges(r, spacing, (x, y, t) => push(x, y, 0, 1, t, model.lotA && model.lotB ? i : 0)));
    // Split line: drawn in order, end to end.
    if (model.line) {
      const [a, b] = model.line;
      const n = 120;
      for (let k = 0; k <= n; k++) push(a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n), 0.2, 2, k / n, 0);
    }
    // Existing buildings: footprint outline as a low wireframe.
    const BH = 12;
    model.buildings.forEach((b) => {
      edges(b, spacing * 1.2, (x, y) => { push(x, y, 0.3, 3, Math.random()); push(x, y, BH, 3, Math.random()); });
      b.slice(0, -1).forEach(([x, y]) => { for (let h = 0; h <= BH; h += 1.5) push(x, y, h, 3, Math.random()); });
    });
    // Homes: small wireframe boxes that rise. New homes in accent; the kept house is drawn by its footprint above.
    const HW = Math.min(22, E * 0.13), HD = Math.min(26, E * 0.15), HH = 18;
    let hi = 0;
    model.homes.forEach((h) => {
      if (h.existing) return;
      const box = [[h.x - HW / 2, h.y - HD / 2], [h.x + HW / 2, h.y - HD / 2], [h.x + HW / 2, h.y + HD / 2], [h.x - HW / 2, h.y + HD / 2], [h.x - HW / 2, h.y - HD / 2]];
      const delay = hi++ / 4;
      const side = sideOf(h.x, h.y);
      edges(box, spacing * 0.9, (x, y) => { push(x, y, 0.4, 4, delay, side); push(x, y, HH * 0.7, 4, delay, side); });
      box.slice(0, -1).forEach(([x, y]) => { for (let z = 0; z <= HH * 0.7; z += 1.2) push(x, y, z, 4, delay, side); });
      // Roof ridge
      for (let k = 0; k <= 20; k++) { const t = k / 20; push(h.x - HW / 2 + HW * t, h.y, HH, 4, delay, side); }
      [[h.x - HW / 2, h.y - HD / 2], [h.x + HW / 2, h.y - HD / 2], [h.x + HW / 2, h.y + HD / 2], [h.x - HW / 2, h.y + HD / 2]].forEach(([x, y]) => {
        for (let k = 0; k <= 10; k++) { const t = k / 10; push(x + (h.x - x) * 0 , y + (h.y - y) * t, HH * 0.7 + (HH * 0.3) * t, 4, delay, side); }
      });
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute("aStart", new THREE.Float32BufferAttribute(S, 3));
    geo.setAttribute("aGroup", new THREE.Float32BufferAttribute(G, 1));
    geo.setAttribute("aSide", new THREE.Float32BufferAttribute(SIDE, 1));
    geo.setAttribute("aDelay", new THREE.Float32BufferAttribute(DL, 1));
    geo.setAttribute("aRise", new THREE.Float32BufferAttribute(R, 1));
    const css = getComputedStyle(document.documentElement);
    const sepAmt = E * 0.035;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 }, uSep: { value: new THREE.Vector2(model.sepDir[0] * sepAmt, -model.sepDir[1] * sepAmt) },
        uRef: { value: 300 }, uPR: { value: renderer.getPixelRatio() }, uScale: { value: 1 },
        uInk: { value: new THREE.Color(css.getPropertyValue("--text").trim() || "#f4f4f4") },
        uAccent: { value: new THREE.Color(css.getPropertyValue("--accent").trim() || "#ffaa5f") },
      },
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Points(geo, mat));
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
    let W = 1, H = 1;
    const resize = () => {
      W = el.clientWidth; H = el.clientHeight;
      renderer.setSize(W, H, false);
      renderer.domElement.style.width = W + "px"; renderer.domElement.style.height = H + "px";
      camera.aspect = W / H; camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let blend = viewRef.current === "3d" ? 0 : 1;
    let az = 0.5;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const k = reducedRef.current ? 1 : 0.07;
      blend += ((viewRef.current === "3d" ? 0 : 1) - blend) * k;
      if (!reducedRef.current && viewRef.current === "3d") az += 0.0012;
      mat.uniforms.uT.value = reducedRef.current ? 10 : t;
      const half = THREE.MathUtils.degToRad(camera.fov / 2);
      const span = E * 1.02;
      const d = Math.max(span / 2 / Math.tan(half), span / 2 / Math.tan(half) / camera.aspect);
      mat.uniforms.uRef.value = d;
      mat.uniforms.uScale.value = Math.min(1.4, Math.max(0.7, W / 700));
      const tilt = THREE.MathUtils.lerp(0.9, 0.0001, blend);
      const a = THREE.MathUtils.lerp(az, 0, blend);
      const dist = THREE.MathUtils.lerp(d * 1.3, d * 1.05, blend);
      camera.position.set(Math.sin(tilt) * Math.sin(a) * dist, Math.cos(tilt) * dist + THREE.MathUtils.lerp(4, 0, blend), Math.sin(tilt) * Math.cos(a) * dist);
      camera.up.set(0, 1, 0).lerp(new THREE.Vector3(0, 0, -1), blend).normalize();
      camera.lookAt(0, THREE.MathUtils.lerp(6, 0, blend), 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); mat.dispose(); renderer.dispose(); if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement); };
  }, [model, replayKey]);

  return <div ref={wrap} style={{ height, width: "100%" }} role="img" aria-label="Particle drawing of the real parcel, split into two lots with homes" />;
}
