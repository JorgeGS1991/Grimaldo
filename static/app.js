import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("scene");
const panels = [...document.querySelectorAll(".panel")];
const cmdBtns = [...document.querySelectorAll(".command-strip button")];
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Typewriter ---------- */
const typeTarget = document.getElementById("typeTarget");
const lines = ["npm run build", "deploying…", "ship it 🚀"];
let li=0, ci=0;
(function loop(){
  if(!typeTarget) return;
  if(ci < lines[li].length){
    typeTarget.textContent += lines[li][ci++];
    setTimeout(loop,60);
  } else {
    setTimeout(()=>{
      typeTarget.textContent="";
      ci=0;
      li=(li+1)%lines.length;
      loop();
    },900);
  }
})();

/* ---------- Three.js ---------- */
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a,0.03);

const camera = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,200);
camera.position.set(0,.8,8);

const ambient = new THREE.AmbientLight(0x88ccee,.35);
scene.add(ambient);

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
  {id
