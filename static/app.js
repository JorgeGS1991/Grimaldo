import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* ===============================
   STATIC + IMMERSIVE TOGGLE
================================ */
const immersiveRoot = document.getElementById("immersive");
const immersiveToggle = document.getElementById("immersiveToggle");
const enterImmersiveBtn = document.getElementById("enterImmersive");
const exitImmersiveBtn = document.getElementById("exitImmersive");

const year1 = document.getElementById("year");
const year2 = document.getElementById("year2");
const yr = String(new Date().getFullYear());
if (year1) year1.textContent = yr;
if (year2) year2.textContent = yr;

function setImmersive(on){
  immersiveRoot.classList.toggle("on", on);
  immersiveRoot.setAttribute("aria-hidden", on ? "false" : "true");
  immersiveToggle.setAttribute("aria-pressed", on ? "true" : "false");

  // When immersive is on, we want scroll to drive the camera.
  // Set body height big; when off, reset.
  document.body.style.minHeight = on ? "7000px" : "auto";

  // Reset scroll when entering immersive for predictable start
  if (on) window.scrollTo({ top: 0, behavior: "instant" });
}

immersiveToggle?.addEventListener("click", () => {
  const on = immersiveToggle.getAttribute("aria-pressed") !== "true";
  setImmersive(on);
});

enterImmersiveBtn?.addEventListener("click", () => setImmersive(true));
exitImmersiveBtn?.addEventListener("click", () => setImmersive(false));

/* ===============================
   IMMERSIVE (THREE) — only run when immersive is ON
================================ */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("scene");
const panels = Array.from(document.querySelectorAll(".panel"));
const hudBtns = Array.from(document.querySelectorAll(".hud-btn"));
const typeTarget = document.getElementById("typeTarget");

let renderer, scene, camera, clock, stars, nodeGroup;
let raycaster, pointer;
let clickable = [];

let targetZ = 6.5;
let scrollProgress = 0;
let lastInteraction = performance.now();
let isActive = true;

const chapters = [
  { id: "hero",   z:  6.5,  x:  0.0 },
  { id: "about",  z: -10,   x: -2.2 },
  { id: "work",   z: -32,   x:  2.2 },
  { id: "nifty",  z: -54,   x: -2.2 },
  { id: "contact",z: -76,   x:  2.2 },
];

function markInteraction(){
  lastInteraction = performance.now();
  isActive = true;
}
["scroll","mousemove","pointermove","touchstart"].forEach(evt => {
  window.addEventListener(evt, markInteraction, { passive: true });
});

/* ---------- helpers ---------- */
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function setActivePanel(id){
  panels.forEach(p => p.classList.toggle("active", p.dataset.panel === id));
  hudBtns.forEach(b => b.classList.toggle("active", b.dataset.jump === id));
}

function nearestChapter(z){
  let best = chapters[0];
  let bestD = Infinity;
  for (const c of chapters){
    const d = Math.abs(z - c.z);
    if (d < bestD){ bestD = d; best = c; }
  }
  return best.id;
}

function setScrollHeight(){
  const total = Math.abs(chapters[chapters.length - 1].z) + 30;
  document.body.style.height = `${Math.max(2400, total * 18)}px`;
}

function onScroll(){
  if (!immersiveRoot.classList.contains("on")) return;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const s = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  scrollProgress = THREE.MathUtils.clamp(s, 0, 1);

  const zStart = chapters[0].z;
  const zEnd = chapters[chapters.length - 1].z;
  targetZ = THREE.MathUtils.lerp(zStart, zEnd, scrollProgress);
}

function jumpTo(id){
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const zStart = chapters[0].z;
  const zEnd = chapters[chapters.length - 1].z;
  const chap = chapters.find(c => c.id === id);
  if (!chap) return;

  const t = (chap.z - zStart) / (zEnd - zStart);
  const y = THREE.MathUtils.clamp(t, 0, 1) * maxScroll;

  window.scrollTo({ top: y, behavior: "smooth" });
}

/* ===============================
   TYPEWRITER (calm)
================================ */
const lines = ["npm run build", "deploying…", "ship it 🚀", "calm default • wow on hover"];
let li = 0, ci = 0;
function typeLoop(){
  if (!typeTarget) return;
  const txt = lines[li];
  if (ci < txt.length){
    typeTarget.textContent += txt[ci++];
    setTimeout(typeLoop, 60);
  } else {
    setTimeout(() => {
      typeTarget.textContent = "";
      ci = 0;
      li = (li + 1) % lines.length;
      typeLoop();
    }, 950);
  }
}
typeLoop();

/* ===============================
   THREE INIT
================================ */
let mouseX = 0, mouseY = 0;

function initThree(){
  if (renderer) return; // init once

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.03);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0.8, 8);

  clock = new THREE.Clock();

  const ambient = new THREE.AmbientLight(0x88ccee, 0.35);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0x88ddff, 0.7);
  key.position.set(3, 4, 2);
  scene.add(key);

  // Starfield
  stars = makeStarfield(2200);
  scene.add(stars);

  // Nodes
  nodeGroup = new THREE.Group();
  scene.add(nodeGroup);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  clickable = [];

  for (const c of chapters){
    if (c.id === "hero") continue;
    const label = c.id === "nifty" ? "NiftyTechs" : capitalize(c.id);
    const { mesh, glow } = makeNode(label, c.z, c.x);
    nodeGroup.add(glow);
    nodeGroup.add(mesh);
    clickable.push(mesh);
  }

  // HUD buttons
  hudBtns.forEach(btn => btn.addEventListener("click", () => jumpTo(btn.dataset.jump)));

  // Overlay buttons (inside panels)
  document.querySelectorAll("[data-jump]").forEach(el => {
    el.addEventListener("click", () => jumpTo(el.dataset.jump));
  });

  // Pointer for gentle parallax (wow on hover)
  window.addEventListener("pointermove", (e) => {
    if (!immersiveRoot.classList.contains("on")) return;
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    pointer.set(mouseX, mouseY);
  }, { passive: true });

  // Click nodes only if clicking the canvas (prevents UI headaches)
  window.addEventListener("click", (e) => {
    if (!immersiveRoot.classList.contains("on")) return;
    if (e.target !== canvas) return;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickable, false);
    if (!hits.length) return;

    const label = hits[0].object.userData.jump;
    if (label === "niftytechs") jumpTo("nifty");
    else jumpTo(label);
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  setScrollHeight();
  onScroll();

  window.addEventListener("resize", () => {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    setScrollHeight();
    onScroll();
  });

  animate();
}

/* ===============================
   STARFIELD + NODES
================================ */
function makeStarfield(count = 2200){
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++){
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * 22;
    positions[i3 + 1] = (Math.random() - 0.5) * 12;
    positions[i3 + 2] = -Math.random() * 120;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

function makeLabelTexture(text){
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const w = 640, h = 256;
  c.width = w; c.height = h;

  ctx.clearRect(0,0,w,h);

  const grd = ctx.createLinearGradient(0,0,w,h);
  grd.addColorStop(0, "rgba(56,189,248,0.20)");
  grd.addColorStop(1, "rgba(165,243,252,0.06)");
  ctx.fillStyle = grd;
  roundRect(ctx, 22, 60, w-44, 120, 40);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(165,243,252,0.28)";
  ctx.stroke();

  ctx.font = "800 58px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w/2, h/2);

  ctx.font = "650 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas";
  ctx.fillStyle = "rgba(165,243,252,0.70)";
  ctx.fillText("click", w/2, h/2 + 48);

  const texture = new THREE.CanvasTexture(c);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeNode(label, z, x = 0){
  const tex = makeLabelTexture(label);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const geo = new THREE.PlaneGeometry(4.2, 1.65);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 0.2, z);
  mesh.userData = { jump: label.toLowerCase() };

  const glowGeo = new THREE.PlaneGeometry(5.2, 2.2);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.10,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(mesh.position);
  glow.position.z -= 0.01;

  return { mesh, glow };
}

/* ===============================
   ANIMATION — calm default, wow on engagement
================================ */
function animate(){
  if (!renderer) return;
  requestAnimationFrame(animate);

  // Don’t animate heavy stuff when immersive is off
  if (!immersiveRoot.classList.contains("on")) return;

  const t = clock.getElapsedTime();

  // Idle detection: if user stops interacting, calm everything down
  const idle = performance.now() - lastInteraction;
  const active = idle < 1100;

  // Camera movement is always smooth, but reduced intensity
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);

  // "Wow on hover": only apply parallax when actively interacting AND motion allowed
  const parallaxOn = active && !reduceMotion;
  const px = parallaxOn ? mouseX * 0.35 : 0;
  const py = parallaxOn ? mouseY * 0.15 : 0;

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, px, 0.04);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.6 + py, 0.04);
  camera.lookAt(0, 0.2, camera.position.z - 5);

  // Star drift only when active (prevents headaches)
  if (parallaxOn){
    stars.rotation.y = Math.sin(t * 0.12) * 0.04;
    stars.rotation.x = Math.cos(t * 0.08) * 0.025;
  } else {
    stars.rotation.y *= 0.96;
    stars.rotation.x *= 0.96;
  }

  // Float nodes only near camera (one focal point)
  nodeGroup.children.forEach((obj, idx) => {
    const near = Math.abs(obj.position.z - camera.position.z) < 6;

    if (!reduceMotion && parallaxOn && near){
      obj.position.y = 0.2 + Math.sin(t * 1.2 + idx) * 0.10;
    } else {
      obj.position.y = THREE.MathUtils.lerp(obj.position.y, 0.2, 0.08);
    }

    // Soft glow pulse for glow planes (opacity <= 0.12)
    if (!reduceMotion && obj.material && typeof obj.material.opacity === "number"){
      if (obj.material.opacity <= 0.12){
        const base = 0.08;
        const amp = near && parallaxOn ? 0.06 : 0.02;
        obj.material.opacity = base + amp * (0.5 + 0.5 * Math.sin(t * 1.8 + idx));
      }
    }
  });

  // Switch overlay panel based on camera z
  const activePanel = nearestChapter(camera.position.z);
  setActivePanel(activePanel);

  renderer.render(scene, camera);
}

/* ===============================
   BOOT
================================ */
function boot(){
  // Start in static mode (calm default)
  setImmersive(false);

  // Initialize Three.js lazily when immersive is turned on
  const observer = new MutationObserver(() => {
    if (immersiveRoot.classList.contains("on")) initThree();
  });
  observer.observe(immersiveRoot, { attributes: true, attributeFilter: ["class"] });
}
boot();
