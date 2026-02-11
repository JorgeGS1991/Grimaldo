import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("scene");
const panels = [...document.querySelectorAll(".panel")];
const buttons = [...document.querySelectorAll("[data-jump]")];
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

/* ---------- Typewriter ---------- */
const target = document.getElementById("typeTarget");
const lines = ["npm run build", "deploying…", "ship it 🚀"];
let li=0, ci=0;
(function type(){
  if(!target) return;
  if(ci < lines[li].length){
    target.textContent += lines[li][ci++];
    setTimeout(type,60);
  } else {
    setTimeout(()=>{
      target.textContent="";
      ci=0;
      li=(li+1)%lines.length;
      type();
    },900);
  }
})();

/* ---------- Three.js ---------- */
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a,.03);

const camera = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,200);
camera.position.set(0,.8,8);

scene.add(new THREE.AmbientLight(0x88ccee,.35));

const stars = (() => {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(2000*3);
  for(let i=0;i<p.length;i+=3){
    p[i]=(Math.random()-.5)*20;
    p[i+1]=(Math.random()-.5)*10;
    p[i+2]=-Math.random()*120;
  }
  g.setAttribute("position",new THREE.BufferAttribute(p,3));
  return new THREE.Points(g,new THREE.PointsMaterial({
    size:.04,color:0xa5f3fc,opacity:.6,transparent:true,depthWrite:false
  }));
})();
scene.add(stars);

/* ---------- Sections ---------- */
const sections=[
  {id:"hero",z:6.5},
  {id:"about",z:-10},
  {id:"work",z:-32},
  {id:"nifty",z:-54},
  {id:"contact",z:-76}
];

document.body.style.height = "6000px";

let targetZ = sections[0].z;

function jumpTo(id){
  const max = document.documentElement.scrollHeight - innerHeight;
  const a = sections[0].z;
  const b = sections.at(-1).z;
  const s = sections.find(x=>x.id===id);
  if(!s) return;
  scrollTo({top:((s.z-a)/(b-a))*max,behavior:"smooth"});
}

buttons.forEach(b=>{
  b.addEventListener("click",()=>jumpTo(b.dataset.jump));
});

addEventListener("scroll",()=>{
  const max = document.documentElement.scrollHeight - innerHeight;
  const t = scrollY / max;
  targetZ = THREE.MathUtils.lerp(sections[0].z,sections.at(-1).z,t);
});

function nearest(z){
  return sections.reduce((a,b)=>Math.abs(b.z-z)<Math.abs(a.z-z)?b:a).id;
}

/* ---------- Animate ---------- */
(function animate(){
  requestAnimationFrame(animate);
  camera.position.z += (targetZ-camera.position.z)*.06;
  camera.lookAt(0,.2,camera.position.z-5);
  stars.rotation.y += .0004;

  const active = nearest(camera.position.z);
  panels.forEach(p=>p.classList.toggle("active",p.dataset.panel===active));
  buttons.forEach(b=>b.classList.toggle("active",b.dataset.jump===active));

  renderer.render(scene,camera);
})();

addEventListener("resize",()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});
