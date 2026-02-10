(() => {
  const root = document.documentElement;

  // ---------- Theme ----------
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = themeToggle?.querySelector(".theme-icon");

  const getPreferredTheme = () => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;

    // Default: system preference, fallback to dark
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;

    return prefersLight ? "light" : "dark";
  };

  const setTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (themeIcon) themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
    themeToggle?.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  setTheme(getPreferredTheme());

  themeToggle?.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // ---------- Mobile nav ----------
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");

  const closeNav = () => {
    if (!navLinks) return;
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  };

  navToggle?.addEventListener("click", () => {
    if (!navLinks) return;
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close nav on link click (mobile)
  navLinks?.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.tagName === "A") closeNav();
  });

  // Close nav if clicking outside
  document.addEventListener("click", (e) => {
    if (!navLinks || !navToggle) return;
    const withinNav = navLinks.contains(e.target) || navToggle.contains(e.target);
    if (!withinNav) closeNav();
  });

  // ---------- Active nav highlight ----------
  const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = navAnchors
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    navAnchors.forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("active", href === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      // find the most visible intersecting section
      const visible = entries
        .filter((x) => x.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) setActive(visible.target.id);
    },
    { root: null, threshold: [0.15, 0.25, 0.35, 0.5] }
  );

  sections.forEach((s) => observer.observe(s));

  // ---------- Contact form (mailto) ----------
  const form = document.getElementById("contactForm");
  const hint = document.getElementById("formHint");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent(`Website message from ${name || "Someone"}`);
    const body = encodeURIComponent(
      `Name: ${name || "-"}\nEmail: ${email || "-"}\n\nMessage:\n${message || "-"}\n`
    );

    // Update this email if you want a different inbox
    const to = "hello@jgrimaldo.com";
    const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

    window.location.href = mailto;

    if (hint) {
      hint.textContent = "Opening your email app… (If nothing happens, check popup settings.)";
    }
  });

  // ---------- Footer year ----------
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
