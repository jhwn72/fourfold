"use client";
// Every dot is a real Santa Ana parcel (center point from the city parcel layer).
// Amber = passes the first SB 9 screen. Three views: 3D (tilted, slow drift), Flat (top-down), Technical (top-down, crisp, grid + scale).
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ViewMode } from "./ViewSwitch";
import { CAMERA_TAU, lerpK, useReducedMotion } from "./useReducedMotion";
import { useTheme } from "../theme";

const VERT = `
attribute float aCode;
attribute float aRand;
uniform float uT;
uniform float uSize;
uniform float uTech;
uniform float uRef;
uniform float uPR;
varying float vCode;
varying float vRand;
void main() {
  vec3 p = position;
  float k = clamp(uT * 1.8 - aRand * 0.8, 0.0, 1.0);
  k = 1.0 - pow(1.0 - k, 3.0);
  p.y += (1.0 - k) * (200.0 + aRand * 1400.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  bool cand = aCode > 0.5 && aCode < 1.5;
  float base = cand ? 1.9 : 1.3;
  base = mix(base, cand ? 1.5 : 1.1, uTech);
  gl_PointSize = min(base * uSize * uPR * (uRef / -mv.z), 9.0 * uPR);
  vCode = aCode;
  vRand = aRand;
}`;

const FRAG = `
uniform float uTech;
uniform float uLight;
uniform vec3 uAccent;
uniform vec3 uInk;
varying float vCode;
varying float vRand;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float soft = mix(smoothstep(0.5, 0.0, d), step(d, 0.42), uTech);
  bool cand = vCode > 0.5 && vCode < 1.5;
  bool dist = vCode > 1.5;
  vec3 col = cand ? mix(uAccent, uInk, uTech) : uInk;
  float a = cand ? 0.42 : (dist ? 0.4 : 0.2);
  if (uTech > 0.5) a = cand ? 0.95 : (dist ? 0.55 : 0.3);
  if (uLight > 0.5) a = min(1.0, a * (cand ? 2.0 : 1.4));
  gl_FragColor = vec4(col, a * soft * (0.75 + 0.25 * vRand));
}`;

// ink/accent: explicit colors for a fixed dark stage (ignores the page theme). Without them, colors follow the theme.
export type CityMarker = { id: string; label: string; x: number; y: number; dim?: boolean; selected?: boolean }; // x, y in State Plane feet
export type CityFocus = { cx: number; cy: number; span: number } | null; // feet

type Props = {
  points: number[][]; bbox: number[]; mode: ViewMode; height?: number; ink?: string; accent?: string;
  markers?: CityMarker[]; onMarker?: (id: string) => void; focus?: CityFocus;
  /** Pixels on the left covered by a floating panel: the frame centers in the space to its right. */
  inset?: number;
  /** Skip rendering (e.g. while an opaque lot layer covers the city). The scene stays alive. */
  paused?: boolean;
};

export default function ParticleCity({ points, bbox, mode, height = 520, ink: inkProp, accent: accentProp, markers, onMarker, focus = null, inset = 0, paused = false }: Props) {
  const insetRef = useRef(inset);
  insetRef.current = inset;
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const onMarkerRef = useRef(onMarker);
  onMarkerRef.current = onMarker;
  const hits = useRef<{ id: string; x: number; y: number; w: number; h: number }[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<ViewMode>(mode);
  const reduced = useReducedMotion();
  const pageTheme = useTheme();
  const fixed = Boolean(inkProp);
  const theme = fixed ? "dark" : pageTheme;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  modeRef.current = mode;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const matRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const el = wrap.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    // Points are in 10 ft units from the bbox min; x east, y north. World: x east, z = -north, y up.
    const w = (bbox[2] - bbox[0]) / 10, h = (bbox[3] - bbox[1]) / 10;
    const n = points.length;
    const pos = new Float32Array(n * 3), code = new Float32Array(n), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const [x, y, c] = points[i];
      pos[i * 3] = x - w / 2;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -(y - h / 2);
      code[i] = c;
      rnd[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aCode", new THREE.BufferAttribute(code, 1));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    const css = getComputedStyle(document.documentElement);
    const accent = new THREE.Color(accentProp || css.getPropertyValue("--accent").trim() || "#ffb36b");
    const ink = new THREE.Color(inkProp || css.getPropertyValue("--text").trim() || "#f4f4f4");
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: themeRef.current === "light" ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: { uT: { value: reducedRef.current ? 1 : 0 }, uSize: { value: 1 }, uTech: { value: 0 }, uLight: { value: themeRef.current === "light" || fixed ? 1 : 0 }, uRef: { value: 4000 }, uPR: { value: renderer.getPixelRatio() }, uAccent: { value: accent }, uInk: { value: ink } },
    });
    matRef.current = mat;
    const cloud = new THREE.Points(geo, mat);
    const scene = new THREE.Scene();
    scene.add(cloud);

    const camera = new THREE.PerspectiveCamera(32, 1, 10, 40000);
    const extent = Math.max(w, h);
    let W = 1, H = 1;
    const insetPx = () => Math.max(0, Math.min(insetRef.current, W * 0.5));
    const fitDist = () => {
      const a = (W - insetPx()) / H;
      const half = THREE.MathUtils.degToRad(camera.fov / 2);
      const needH = (h * 1.08) / 2 / Math.tan(half);
      const needW = (w * 1.08) / 2 / Math.tan(half) / a;
      return Math.max(needH, needW);
    };
    const resize = () => {
      W = el.clientWidth; H = el.clientHeight;
      renderer.setSize(W, H, false);
      renderer.domElement.style.width = W + "px";
      renderer.domElement.style.height = H + "px";
      const L = insetPx();
      camera.aspect = (W - L) / H;
      if (L) camera.setViewOffset(W - L, H, -L, 0, W, H); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      const c = overlay.current;
      if (!c) return;
      c.width = W * renderer.getPixelRatio(); c.height = H * renderer.getPixelRatio();
      c.style.width = W + "px"; c.style.height = H + "px";
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Camera state blends between views.
    let blend = modeRef.current === "3d" ? 0 : 1; // 0 = 3D, 1 = top-down
    let tech = modeRef.current === "tech" ? 1 : 0;
    let az = 0.6;
    const toU = (xf: number, yf: number) => [(xf - bbox[0]) / 10 - w / 2, -((yf - bbox[1]) / 10 - h / 2)];
    const look = { x: 0, z: 0 };
    let zoom = 1; // 1 = whole city
    const start = performance.now();
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      // Pause when unseen (tab hidden) or covered by the lot layer; camera state holds.
      if (pausedRef.current || document.hidden) return;
      const t = (now - start) / 1000;
      const m = modeRef.current;
      const k = reducedRef.current ? 1 : lerpK(dt, CAMERA_TAU);
      blend += ((m === "3d" ? 0 : 1) - blend) * k;
      tech += ((m === "tech" ? 1 : 0) - tech) * k;
      mat.uniforms.uT.value = reducedRef.current ? 1 : Math.min(1, t / 2.6);
      mat.uniforms.uTech.value = tech;
      mat.blending = tech > 0.5 || themeRef.current === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
      if (!reducedRef.current && m === "3d") az += Math.min(0.05, dt) * 0.054;
      const d = fitDist();
      mat.uniforms.uRef.value = d;
      // Focus: zoom the camera to a site or group (feet), else the whole city.
      const f = focusRef.current;
      let tz = 1, tx = 0, tzz = 0;
      if (f) { const [ux, uz] = toU(f.cx, f.cy); tx = ux; tzz = uz; tz = Math.min(1, Math.max(0.01, (f.span / 10) / extent)); }
      look.x += (tx - look.x) * k; look.z += (tzz - look.z) * k; zoom += (tz - zoom) * k;
      mat.uniforms.uSize.value = Math.min(1.25, Math.max(0.55, W / 1100));
      // 3D: tilted orbit. Top-down: straight above, north up.
      const tilt = THREE.MathUtils.lerp(0.95, 0.0001, blend); // angle from vertical
      const azUse = THREE.MathUtils.lerp(az, 0, blend);
      const dist = THREE.MathUtils.lerp(d * 0.78, d, blend) * zoom;
      camera.position.set(look.x + Math.sin(tilt) * Math.sin(azUse) * dist, Math.cos(tilt) * dist, look.z + Math.sin(tilt) * Math.cos(azUse) * dist);
      camera.up.set(0, 1, 0).lerp(new THREE.Vector3(0, 0, -1), blend).normalize();
      camera.lookAt(look.x, 0, look.z);
      renderer.render(scene, camera);
      drawOverlay(tech);
      drawMarkers();
    };

    // Technical overlay: 1-mile grid, scale bar, north arrow, in mono labels.
    const MILE = 528; // 5,280 ft in 10 ft units
    const project = (x: number, z: number) => {
      const v = new THREE.Vector3(x, 0, z).project(camera);
      return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
    };
    const drawOverlay = (a: number) => {
      const c = overlay.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const pr = renderer.getPixelRatio();
      ctx.setTransform(pr, 0, 0, pr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (a < 0.02) return;
      ctx.globalAlpha = a;
      const cssNow = getComputedStyle(document.documentElement);
      const v = (name: string, dark: string) => (fixed ? dark : cssNow.getPropertyValue(name).trim() || dark);
      ctx.strokeStyle = v("--grid", "rgba(255,255,255,0.08)");
      ctx.lineWidth = 1;
      const mono = getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace";
      ctx.font = `10px ${mono}`;
      ctx.fillStyle = v("--faint", "rgba(244,244,244,0.5)");
      for (let gx = -Math.ceil(w / 2 / MILE) * MILE; gx <= w / 2; gx += MILE) {
        const [x1, y1] = project(gx, -h / 2), [x2, y2] = project(gx, h / 2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      for (let gz = -Math.ceil(h / 2 / MILE) * MILE; gz <= h / 2; gz += MILE) {
        const [x1, y1] = project(-w / 2, gz), [x2, y2] = project(w / 2, gz);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // Scale bar (1 mile) bottom left
      const [sx1] = project(0, 0), [sx2] = project(MILE, 0);
      const len = Math.abs(sx2 - sx1);
      ctx.strokeStyle = v("--muted", "rgba(244,244,244,0.7)");
      ctx.beginPath(); ctx.moveTo(16, H - 20); ctx.lineTo(16 + len, H - 20); ctx.moveTo(16, H - 24); ctx.lineTo(16, H - 16); ctx.moveTo(16 + len, H - 24); ctx.lineTo(16 + len, H - 16); ctx.stroke();
      ctx.fillText("1 MI  ·  GRID 1 MI  ·  STATE PLANE CA VI (FT)", 16, H - 30);
      // North arrow top right
      ctx.beginPath(); ctx.moveTo(W - 22, 84); ctx.lineTo(W - 22, 64); ctx.moveTo(W - 26, 69); ctx.lineTo(W - 22, 64); ctx.lineTo(W - 18, 69); ctx.stroke();
      ctx.fillText("N", W - 25, 97);
      ctx.globalAlpha = 1;
    };
    // "№" tags for listings, kept apart from each other, clickable.
    const drawMarkers = () => {
      const ms = markersRef.current;
      hits.current = [];
      if (!ms || !ms.length) return;
      const c = overlay.current; if (!c) return;
      const ctx = c.getContext("2d"); if (!ctx) return;
      const mono = getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace";
      ctx.font = `11px ${mono}`;
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const hit = (b: { x: number; y: number; w: number; h: number }) => placed.some((q) => b.x < q.x + q.w + 3 && b.x + b.w + 3 > q.x && b.y < q.y + q.h + 3 && b.y + b.h + 3 > q.y);
      for (const m of ms) {
        const [ux, uz] = toU(m.x, m.y);
        const [X, Y] = project(ux, uz);
        if (X < -40 || Y < -40 || X > W + 40 || Y > H + 40) continue;
        const tw = ctx.measureText(m.label).width + 12;
        const tries: [number, number][] = [[10, -26], [-10 - tw, -26], [10, 8], [-10 - tw, 8], [10, -48], [-10 - tw, -48], [10, 30], [-10 - tw, 30]];
        let bx = X + 10, by = Y - 26;
        for (const [dx, dy] of tries) { const b = { x: X + dx, y: Y + dy, w: tw, h: 18 }; if (!hit(b)) { bx = b.x; by = b.y; break; } }
        placed.push({ x: bx, y: by, w: tw, h: 18 });
        const line = m.dim ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(bx < X ? bx + tw : bx, by + 9); ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(bx, by, tw, 18);
        ctx.strokeStyle = m.selected ? "#fff" : line; ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, 17);
        ctx.fillStyle = m.dim ? "rgba(255,255,255,0.55)" : "#fff"; ctx.fillText(m.label, bx + 6, by + 13);
        ctx.strokeStyle = m.selected ? "#fff" : line; ctx.lineWidth = m.selected ? 2 : 1.4;
        ctx.strokeRect(X - 4, Y - 4, 8, 8);
        hits.current.push({ id: m.id, x: Math.min(bx, X - 8), y: Math.min(by, Y - 8), w: Math.abs(bx - X) + tw + 8, h: Math.abs(by - Y) + 26 });
      }
    };
    const onClick = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const hb = hits.current.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      if (hb && onMarkerRef.current) onMarkerRef.current(hb.id);
    };
    el.addEventListener("click", onClick);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [points, bbox, fixed]);

  // Theme and colors update uniforms in place: no new renderer, no replayed intro.
  useEffect(() => {
    const mat = matRef.current;
    if (!mat) return;
    const css = getComputedStyle(document.documentElement);
    mat.uniforms.uAccent.value.set(accentProp || css.getPropertyValue("--accent").trim() || "#ffb36b");
    mat.uniforms.uInk.value.set(inkProp || css.getPropertyValue("--text").trim() || "#f4f4f4");
    mat.uniforms.uLight.value = theme === "light" || fixed ? 1 : 0;
  }, [theme, inkProp, accentProp, fixed]);

  return (
    <div style={{ position: "relative", height, width: "100%" }} aria-label="Map of every Santa Ana parcel; highlighted dots pass the first SB 9 screen" role="img">
      <div ref={wrap} style={{ position: "absolute", inset: 0 }} />
      <canvas ref={overlay} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    </div>
  );
}
