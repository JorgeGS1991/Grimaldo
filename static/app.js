import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("scene");
const panels = [...document.querySelectorAll(".panel")];
const buttons = [...document.querySelectorAll("[data-jump]")];
const year = document.getElementById("year");

if (year) year.textContent = new Date().getFullYear();

/* ==============================
   TYPEWRITER
============================== */

const target = document.getElementById("typeTarget");
const lines = ["npm run build", "deploying…", "ship it 🚀"];
let li = 0;
let ci = 0;

(function type() {
  if (!target) return;

  if (ci < lines[li].length) {
    target.textContent += lines[li][ci++];
    setTimeout(type, 55);
  } else {
    setTimeout(() => {
      target.textContent = "";
      ci = 0;
      li = (li + 1) % lines.length;
      type();
    }, 900);
  }
})();

/* ==============================
   THREE.JS SETUP
============================== */

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.03);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

camera.position.set(0, 0.8, 8);

scene.add(new THREE.AmbientLight(0x88ccee, 0.35));

/* ==============================
   STARFIELD
============================== */

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(2000 * 3);

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * 20;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = -Math.random() * 120;
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 0.04,
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

const stars = createStars();
scene.add(stars);

/* ==============================
   SECTIONS
============================== */

const sections = [
  { id: "hero", z: 6.5 },
  { id: "about", z: -10 },
  { id: "work", z: -32 },
  { id: "nifty", z: -54 },
  { id: "contact", z: -76 }
];

// dynamic scroll height
function setScrollHeight() {
  const corridor = Math.abs(sections[sections.length - 1].z) + 30;
  document.body.style.height = `${corridor * 18}px`;
}
setScrollHeight();

let targetZ = sections[0].z;

/* ==============================
   NAVIGATION
============================== */

function jumpTo(id) {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;

  if (maxScroll <= 0) return;

  const zStart = sections[0].z;
  const zEnd = sections[sections.length - 1].z;
  const section = sections.find(s => s.id === id);

  if (!section) return;

  const progress = (section.z - zStart) / (zEnd - zStart);
  const scrollY = THREE.MathUtils.clamp(progress, 0, 1) * maxScroll;

  window.scrollTo({
    top: scrollY,
    behavior: "smooth"
  });
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    jumpTo(btn.dataset.jump);
  });
});

/* ==============================
   SCROLL HANDLING
============================== */

window.addEventListener("scroll", () => {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;

  if (maxScroll <= 0) return;

  const scrollProgress = window.scrollY / maxScroll;

  targetZ = THREE.MathUtils.lerp(
    sections[0].z,
    sections[sections.length - 1].z,
    scrollProgress
  );
});

/* ==============================
   ACTIVE PANEL
============================== */

function getNearestSection(z) {
  let closest = sections[0];
  let smallest = Infinity;

  for (const s of sections) {
    const distance = Math.abs(z - s.z);
    if (distance < smallest) {
      smallest = distance;
      closest = s;
    }
  }

  return closest.id;
}

/* ==============================
   ANIMATION LOOP
============================== */

function animate() {
  requestAnimationFrame(animate);

  // smooth camera movement
  camera.position.z += (targetZ - camera.position.z) * 0.06;
  camera.lookAt(0, 0.2, camera.position.z - 5);

  // subtle star drift
  stars.rotation.y += 0.0004;

  const active = getNearestSection(camera.position.z);

  panels.forEach(panel =>
    panel.classList.toggle(
      "active",
      panel.dataset.panel === active
    )
  );

  buttons.forEach(btn =>
    btn.classList.toggle(
      "active",
      btn.dataset.jump === active
    )
  );

  renderer.render(scene, camera);
}

animate();

/* ==============================
   RESIZE
============================== */

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  setScrollHeight();
});
