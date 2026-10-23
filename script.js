/* =========================================================
   Rishiverse – script.js
   Vanilla JavaScript, no libraries, no backend.
   ========================================================= */
(function () {
  "use strict";

  // Shortcut helpers
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Read the visitor's "reduce motion" setting once and keep it updated
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------
     1. Footer year (so you never have to update it by hand)
     --------------------------------------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     2. Toast: a small message bar used for feedback
     --------------------------------------------------------- */
  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3500);
  }

  /* ---------------------------------------------------------
     3. Mobile navigation menu
     --------------------------------------------------------- */
  const header = $(".site-header");
  const navToggle = $(".nav-toggle");
  const nav = $("#primary-nav");

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }

  if (navToggle && nav) {
    // Open or close when the hamburger button is pressed
    navToggle.addEventListener("click", () => {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    // Close after choosing a link
    $$("a", nav).forEach((link) => link.addEventListener("click", () => setMenu(false)));

    // Close with the Escape key and return focus to the button
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });

    // Close when clicking outside the header
    document.addEventListener("click", (event) => {
      if (nav.classList.contains("is-open") && !header.contains(event.target)) setMenu(false);
    });

    // Reset the menu if the window grows to desktop size
    window.matchMedia("(min-width: 860px)").addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------------------------------------------------------
     4. Header style on scroll
     --------------------------------------------------------- */
  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------------------------------------------------------
     5. Scroll-spy: highlight the nav link for the visible section
     --------------------------------------------------------- */
  const navLinks = $$(".nav-links a");
  const sections = navLinks
    .map((link) => $(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const active = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      // A section counts as "current" when it crosses the middle band of the screen
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* ---------------------------------------------------------
     6. Placeholder links (GitHub, live demo, LinkedIn)
        Links with data-placeholder show a reminder instead of
        jumping to the top. Remove that attribute once you set
        the real URL in index.html and the link works normally.
     --------------------------------------------------------- */
  $$("a[data-placeholder]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Placeholder: add your real URL for “" + link.dataset.placeholder + "” in index.html.");
    });
  });

  /* ---------------------------------------------------------
     7. Copy email button
     --------------------------------------------------------- */
  const copyBtn = $("#copy-email");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = "rishi208712@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        showToast("Email copied to clipboard.");
      } catch (error) {
        // Fallback for browsers that block clipboard access (e.g. some file:// setups)
        const temp = document.createElement("textarea");
        temp.value = email;
        document.body.appendChild(temp);
        temp.select();
        const ok = document.execCommand("copy");
        temp.remove();
        showToast(ok ? "Email copied to clipboard." : "Copy failed. Email: " + email);
      }
    });
  }

  /* ---------------------------------------------------------
     8. Contact form (no backend)
        Validates the fields, then opens the visitor's email app
        with a pre-filled message using a mailto: link.
     --------------------------------------------------------- */
  const form = $("#contact-form");
  if (form) {
    const status = $("#form-status");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Show or clear an error message under one field
    function setError(input, message) {
      const field = input.closest(".field");
      $(".error", field).textContent = message;
      field.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.elements.name;
      const email = form.elements.email;
      const message = form.elements.message;
      let firstInvalid = null;

      const checks = [
        [name, name.value.trim() === "", "Please enter your name."],
        [email, !emailPattern.test(email.value.trim()), "Please enter a valid email address."],
        [message, message.value.trim().length < 5, "Please write a short message."],
      ];

      checks.forEach(([input, invalid, text]) => {
        setError(input, invalid ? text : "");
        if (invalid && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        status.textContent = "";
        return;
      }

      // Build the mailto: link (encodeURIComponent keeps special characters safe)
      const subject = "Portfolio message from " + name.value.trim();
      const body =
        message.value.trim() +
        "\n\n— " + name.value.trim() +
        "\n" + email.value.trim();
      const href =
        "mailto:rishi208712@gmail.com?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      status.textContent = "Opening your email app. If nothing opens, email rishi208712@gmail.com directly.";
      window.location.href = href;
    });

    // Clear an error as soon as the visitor starts fixing it
    $$("input, textarea", form).forEach((input) =>
      input.addEventListener("input", () => setError(input, ""))
    );
  }

  /* ---------------------------------------------------------
     9. Hero constellation (decorative canvas animation)
        Small points drift slowly and connect when close.
        Static if reduced motion is on; paused when off-screen
        or when the tab is hidden, to save battery.
     --------------------------------------------------------- */
  const canvas = $("#constellation");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    const LINK_DISTANCE = 130;
    let width = 0, height = 0, nodes = [], frame = null, heroVisible = true;

    // Size the canvas for sharp rendering on high-DPI screens and create the points
    function resize() {
      const rect = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fewer points on small screens
      const count = Math.round(Math.min(70, Math.max(24, (width * height) / 18000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.7,
      }));
      draw();
    }

    // Move each point and wrap around the edges
    function step() {
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;
      });
    }

    // Draw connecting lines first, then the points on top
    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            ctx.strokeStyle = "rgba(139, 92, 246," + (0.28 * (1 - dist / LINK_DISTANCE)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgba(167, 190, 255, 0.85)";
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function loop() {
      step();
      draw();
      frame = requestAnimationFrame(loop);
    }

    // Start or stop animation depending on motion setting, visibility and tab state
    function update() {
      cancelAnimationFrame(frame);
      frame = null;
      if (!reduceMotion.matches && heroVisible && !document.hidden) loop();
      else draw(); // still show one static frame
    }

    resize();
    update();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); update(); }, 150);
    });
    document.addEventListener("visibilitychange", update);
    reduceMotion.addEventListener("change", update);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        update();
      }).observe(hero);
    }
  }
})();
