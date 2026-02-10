// Cursor glow
const glow = document.querySelector(".cursor-glow");
document.addEventListener("mousemove", e => {
  glow.style.left = e.clientX + "px";
  glow.style.top = e.clientY + "px";
});

// Typewriter
const text = [
  "npm run build",
  "deploying to production...",
  "ship it 🚀"
];
let i = 0, j = 0;
const el = document.getElementById("type");

function type() {
  if (j < text[i].length) {
    el.textContent += text[i][j++];
    setTimeout(type, 80);
  } else {
    setTimeout(() => {
      el.textContent = "";
      j = 0;
      i = (i + 1) % text.length;
      type();
    }, 1200);
  }
}
type();

// Scroll reveal
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("visible");
  });
});
reveals.forEach(r => observer.observe(r));

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
