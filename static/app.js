import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("scene");
const panels = Array.from(document.querySelectorAll(".panel"));
const navBtns = Array.from(document.querySelectorAll(".nav-btn"));
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ----------------------------
// Typewriter (hero)
// ----------------------------
const typeTarget = document.getElementById("typeTarget");
const lines = [
  "npm run build",
  "deploying…",
  "ship it 🚀",
  "building clean UI + reliable systems",
];
let li = 0, ci = 0;
function typeLoop(){
  if (!typeTarget) return;
  const txt = lines[li];
  if (ci < txt.length){
    typeTarget.textContent += txt[ci++];
    setTimeout(typeLoop, 55);
  } else {
    setTimeout(() => {
      typeTarget.textContent = "";
      ci = 0;
      li = (li + 1) % lines.length;
      typeLoop();
    }, 1000);
  }
}
typeLoop();

// ----------------------------
// Help modal
// ----------------------------
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
helpBtn?.addEventListener("click", () => helpModal?.showModal());
closeHelp?.addEventListener("click", () => helpModal?.close());

// ----------------------------
// Three.js setup
// ----------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.03);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 0.8, 8);

const clock = new THREE.Clock();

// Lights (subtle)
const ambient = new THREE.AmbientLight(0x88ccee, 0.35);
scene.add(ambient);

const key = new THREE.DirectionalLight(0x88ddff, 0.7);
key.position.set(3, 4, 2);
scene.add(key);

// ----------------------------
// Starfield particles
// ----------------------------
function makeStarfield(count = 2500){
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++){
    const i3 = i * 3;
    // Spread in a long corridor (z)
    positions[i3 + 0] = (Math.random() - 0.5) * 22;
    positions[i3 + 1] = (Math.random() - 0.5) * 12;
    positions[i3 + 2] = -Math.random() * 120;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  return points;
}
const stars = makeStarfield();
scene.add(stars);

// ----------------------------
// Section Nodes (clickable)
// ----------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function makeLabelTexture(text){
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const w = 640, h = 256;
  c.width = w; c.height = h;

  // background
  ctx.fillStyle = "rgba(10,12,18,0.0)";
  ctx.fillRect(0,0,w,h);

  // glow plate
  const grd = ctx.createLinearGradient(0,0,w,h);
  grd.addColorStop(0, "rgba(56,189,248,0.22)");
  grd.addColorStop(1, "rgba(165,243,252,0.06)");
  ctx.fillStyle = grd;
  roundRect(ctx, 22, 60, w-44, 120, 40);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(165,243,252,0.30)";
  ctx.stroke();

  // text
  ctx.font = "800 58px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w/2, h/2);

  // small subtitle
  ctx.font = "650 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas";
  ctx.fillStyle = "rgba(165,243,252,0.75)";
  ctx.fillText("click to jump", w/2, h/2 + 48);

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

  // soft glow behind
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

// z positions define “chapters”
const chapters = [
  { id: "hero",   z:  6.5, x:  0.0 },
  { id: "about",  z: -10,  x: -2.2 },
  { id: "work",   z: -32,  x:  2.2 },
  { id: "nifty",  z: -54,  x: -2.2 },
  { id: "contact",z: -76,  x:  2.2 },
];

const nodeGroup = new THREE.Group();
scene.add(nodeGroup);

const clickable = [];
for (const c of chapters){
  if (c.id === "hero") continue;
  const label = c.id === "nifty" ? "NiftyTechs" : capitalize(c.id);
  const { mesh, glow } = makeNode(label, c.z, c.x);
  nodeGroup.add(glow);
  nodeGroup.add(mesh);
  clickable.push(mesh);
}

function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

// ----------------------------
// Scroll → camera movement
// ----------------------------
let scrollProgress = 0; // 0..1
let targetZ = chapters[0].z;

function setScrollHeight(){
  // enough scroll room for corridor length
  const total = Math.abs(chapters[chapters.length - 1].z) + 30;
  document.body.style.height = `${Math.max(1200, total * 18)}px`;
}
setScrollHeight();

function onScroll(){
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const s = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  scrollProgress = THREE.MathUtils.clamp(s, 0, 1);

  // map progress to a z corridor between hero z and last chapter z
  const zStart = chapters[0].z;
  const zEnd = chapters[chapters.length - 1].z;
  targetZ = THREE.MathUtils.lerp(zStart, zEnd, scrollProgress);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Smooth “jump to section”
function jumpTo(id){
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const zStart = chapters[0].z;
  const zEnd = chapters[chapters.length - 1].z;

  const chap = chapters.find(c => c.id === id);
  if (!chap) return;

  // invert mapping: given chap.z -> scrollY
  const t = (chap.z - zStart) / (zEnd - zStart);
  const y = THREE.MathUtils.clamp(t, 0, 1) * maxScroll;

  window.scrollTo({ top: y, behavior: "smooth" });
}

// Nav buttons
navBtns.forEach(btn => {
  btn.addEventListener("click", () => jumpTo(btn.dataset.jump));
});

// Brand click recenters to hero
document.getElementById("brandBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ----------------------------
// Active overlay panel based on camera z
// ----------------------------
function setActivePanel(id){
  panels.forEach(p => p.classList.toggle("active", p.dataset.panel === id));
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.jump === id));
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

// ----------------------------
// Pointer parallax + click raycast
// ----------------------------
let mouseX = 0, mouseY = 0;
window.addEventListener("pointermove", (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  pointer.set(mouseX, mouseY);
}, { passive: true });

window.addEventListener("click", (e) => {
  // Ignore clicks on UI / overlay controls
  const isUI = e.target.closest(".hud, .overlay, dialog");
  if (isUI) return;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  if (hits.length){
    const hit = hits[0].object;
    const label = hit.userData.jump; // "about" / "work" / "niftytechs"? we mapped lowercase label
    if (label === "niftytechs") jumpTo("nifty");
    else if (label === "about") jumpTo("about");
    else if (label === "work") jumpTo("work");
    else if (label === "contact") jumpTo("contact");
  }
});

// ----------------------------
// Resize
// ----------------------------
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  setScrollHeight();
  onScroll();
});

// ----------------------------
// Animation loop
// ----------------------------
function animate(){
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  // Smooth camera
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);

  // Add gentle parallax
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 0.9, 0.05);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.6 + mouseY * 0.35, 0.05);
  camera.lookAt(0, 0.2, camera.position.z - 5);

  // Drift starfield
  stars.rotation.y = Math.sin(t * 0.12) * 0.05;
  stars.rotation.x = Math.cos(t * 0.08) * 0.03;

  // Float nodes + subtle glow pulse
  nodeGroup.children.forEach((obj, idx) => {
    obj.position.y = 0.2 + Math.sin(t * 1.2 + idx) * 0.12;
    if (obj.material?.opacity !== undefined && obj.material.color){
      // glow planes are every other object depending on creation order; safe to pulse subtly
      obj.material.opacity = obj.material.opacity ? obj.material.opacity : obj.material.opacity;
    }
  });

  // Switch overlay panel by proximity to chapter
  const active = nearestChapter(camera.position.z);
  setActivePanel(active);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
