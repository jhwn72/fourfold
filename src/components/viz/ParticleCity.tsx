"use client";
// Every dot is a real Santa Ana parcel (center point from the city parcel layer).
// Amber = passes the first SB 9 screen. Three views: 3D (tilted, slow drift), Flat (top-down), Technical (top-down, crisp, grid + scale).
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ViewMode } from "./ViewSwitch";
import { useReducedMotion } from "./useReducedMotion";

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
  gl_PointSize = base * uSize * uPR * (uRef / -mv.z);
  vCode = aCode;
  vRand = aRand;
}`;

const FRAG = `
uniform float uTech;
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
  float a = cand ? 0.55 : (dist ? 0.4 : 0.2);
  if (uTech > 0.5) a = cand ? 0.95 : (dist ? 0.55 : 0.3);
  gl_FragColor = vec4(col, a * soft * (0.75 + 0.25 * vRand));
}`;

type Props = { points: number[][]; bbox: number[]; mode: ViewMode; height?: number };

export default function ParticleCity({ points, bbox, mode, height = 520 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<ViewMode>(mode);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  modeRef.current = mode;

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
    const accent = new THREE.Color(css.getPropertyValue("--accent").trim() || "#ffb36b");
    const ink = new THREE.Color(css.getPropertyValue("--text").trim() || "#f4f4f4");
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: reducedRef.current ? 1 : 0 }, uSize: { value: 1 }, uTech: { value: 0 }, uRef: { value: 4000 }, uPR: { value: renderer.getPixelRatio() }, uAccent: { value: accent }, uInk: { value: ink } },
    });
    const cloud = new THREE.Points(geo, mat);
    const scene = new THREE.Scene();
    scene.add(cloud);

    const camera = new THREE.PerspectiveCamera(32, 1, 10, 40000);
    const extent = Math.max(w, h);
    let W = 1, H = 1;
    const fitDist = () => {
      const a = W / H;
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
      camera.aspect = W / H;
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
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const m = modeRef.current;
      const k = reducedRef.current ? 1 : 0.06;
      blend += ((m === "3d" ? 0 : 1) - blend) * k;
      tech += ((m === "tech" ? 1 : 0) - tech) * k;
      mat.uniforms.uT.value = reducedRef.current ? 1 : Math.min(1, t / 2.6);
      mat.uniforms.uTech.value = tech;
      mat.blending = tech > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
      if (!reducedRef.current && m === "3d") az += 0.0009;
      const d = fitDist();
      mat.uniforms.uRef.value = d;
      mat.uniforms.uSize.value = Math.min(1.25, Math.max(0.55, W / 1100));
      // 3D: tilted orbit. Top-down: straight above, north up.
      const tilt = THREE.MathUtils.lerp(0.95, 0.0001, blend); // angle from vertical
      const azUse = THREE.MathUtils.lerp(az, 0, blend);
      const dist = THREE.MathUtils.lerp(d * 0.78, d, blend);
      camera.position.set(Math.sin(tilt) * Math.sin(azUse) * dist, Math.cos(tilt) * dist, Math.sin(tilt) * Math.cos(azUse) * dist);
      camera.up.set(0, 1, 0).lerp(new THREE.Vector3(0, 0, -1), blend).normalize();
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      drawOverlay(tech);
      raf = requestAnimationFrame(tick);
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
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      const mono = getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace";
      ctx.font = `10px ${mono}`;
      ctx.fillStyle = "rgba(244,244,244,0.45)";
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
      ctx.strokeStyle = "rgba(244,244,244,0.7)";
      ctx.beginPath(); ctx.moveTo(16, H - 20); ctx.lineTo(16 + len, H - 20); ctx.moveTo(16, H - 24); ctx.lineTo(16, H - 16); ctx.moveTo(16 + len, H - 24); ctx.lineTo(16 + len, H - 16); ctx.stroke();
      ctx.fillText("1 MI  ·  GRID 1 MI  ·  STATE PLANE CA VI (FT)", 16, H - 30);
      // North arrow top right
      ctx.beginPath(); ctx.moveTo(W - 22, 84); ctx.lineTo(W - 22, 64); ctx.moveTo(W - 26, 69); ctx.lineTo(W - 22, 64); ctx.lineTo(W - 18, 69); ctx.stroke();
      ctx.fillText("N", W - 25, 97);
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [points, bbox]);

  return (
    <div style={{ position: "relative", height, width: "100%" }} aria-label="Map of every Santa Ana parcel; highlighted dots pass the first SB 9 screen" role="img">
      <div ref={wrap} style={{ position: "absolute", inset: 0 }} />
      <canvas ref={overlay} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    </div>
  );
}
