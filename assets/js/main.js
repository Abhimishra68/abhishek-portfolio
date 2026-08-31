/* ============================================================
   Abhishek Mishra — Portfolio interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------
     preloader
     --------------------------------------------------------- */
  const reveal = () => document.body.classList.add("loaded");
  window.addEventListener("load", () => setTimeout(reveal, reduceMotion ? 0 : 550));
  setTimeout(reveal, 3000); // safety net if a font/asset stalls

  /* ---------------------------------------------------------
     year
     --------------------------------------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------
     theme
     --------------------------------------------------------- */
  const root = document.documentElement;
  const THEME_KEY = "am-portfolio-theme";

  let stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch (_) { /* private mode */ }
  if (stored === "light" || stored === "dark") root.dataset.theme = stored;

  $("#themeToggle")?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* noop */ }
  });

  /* ---------------------------------------------------------
     split hero title into characters
     --------------------------------------------------------- */
  $$("[data-split]").forEach((node, wordIndex) => {
    const text = node.textContent.trim();
    node.textContent = "";
    const frag = document.createDocumentFragment();

    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = ch === " " ? "char char--space" : "char";
      span.textContent = ch === " " ? "\u00A0" : ch;
      if (!reduceMotion) {
        span.style.animationDelay = `${450 + wordIndex * 90 + i * 42}ms`;
      } else {
        span.style.animation = "none";
      }
      frag.appendChild(span);
    });

    node.appendChild(frag);
    node.setAttribute("aria-hidden", "false");
  });

  /* ---------------------------------------------------------
     typewriter
     --------------------------------------------------------- */
  const typeTarget = $("#typewriter");
  const roles = [
    "Flutter Developer @ Ooumph",
    "Dart · Firebase · GraphQL",
    "Hackathon Champion 🏆",
    "Play Store App Publisher",
    "Full-Stack Problem Solver",
  ];

  if (typeTarget) {
    if (reduceMotion) {
      typeTarget.textContent = roles[0];
    } else {
      let r = 0, c = 0, deleting = false;
      const tick = () => {
        const word = roles[r];
        c += deleting ? -1 : 1;
        typeTarget.textContent = word.slice(0, c);

        let wait = deleting ? 38 : 78;
        if (!deleting && c === word.length) { deleting = true; wait = 1900; }
        else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; wait = 320; }

        setTimeout(tick, wait);
      };
      setTimeout(tick, 1600);
    }
  }

  /* ---------------------------------------------------------
     live-coding card: types itself out, preserving syntax colours
     --------------------------------------------------------- */
  (function liveCodeCard() {
    const card = $("#codeCard");
    const source = $("#codeSource");
    const gutter = $("#codeGutter");
    const buildText = $("#buildText");
    const buildMs = $("#buildMs");
    if (!card || !source) return;

    // snapshot every text node so colour spans survive the rewrite
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
    const parts = [];
    let n;
    while ((n = walker.nextNode())) parts.push({ node: n, text: n.nodeValue });

    const fullText = parts.map((p) => p.text).join("");
    const total = fullText.length;
    const lineCount = fullText.split("\n").length;

    // line-number gutter
    if (gutter) {
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= lineCount; i++) {
        const s = document.createElement("span");
        s.textContent = String(i);
        frag.appendChild(s);
      }
      gutter.replaceChildren(frag);
    }
    const gutterRows = gutter ? $$("span", gutter) : [];

    const caret = document.createElement("span");
    caret.className = "type-caret";
    caret.setAttribute("aria-hidden", "true");

    const setLine = (idx) => {
      gutterRows.forEach((row, i) => row.classList.toggle("is-active", i === idx));
    };

    const paint = (k) => {
      let left = k;
      let caretHost = null;

      for (const p of parts) {
        if (left <= 0) { p.node.nodeValue = ""; continue; }
        const take = Math.min(left, p.text.length);
        p.node.nodeValue = p.text.slice(0, take);
        left -= take;
        if (take === p.text.length) caretHost = p.node;
        else { caretHost = p.node; break; }
      }

      if (caretHost && caretHost.parentNode) {
        caretHost.parentNode.insertBefore(caret, caretHost.nextSibling);
      }

      // highlight the line the caret sits on
      let nl = 0;
      for (let i = 0; i < k; i++) if (fullText.charCodeAt(i) === 10) nl++;
      setLine(nl);
    };

    const finish = (ms) => {
      parts.forEach((p) => { p.node.nodeValue = p.text; });
      source.appendChild(caret);
      card.classList.remove("is-typing");
      card.classList.add("is-done");
      setLine(lineCount - 1);
      if (buildText) buildText.textContent = "compiled successfully · 0 issues";
      if (buildMs) buildMs.textContent = `${ms} ms`;
    };

    if (reduceMotion) { finish(412); return; }

    const CPS = 105; // characters per second
    let raf = null;
    let running = false;

    const run = () => {
      if (running) return;
      running = true;
      card.classList.remove("is-done");
      card.classList.add("is-typing");
      if (buildText) buildText.textContent = "compiling main.dart…";
      if (buildMs) buildMs.textContent = "";

      const t0 = performance.now();

      const step = (now) => {
        const elapsed = now - t0;
        const k = Math.min(Math.floor((elapsed / 1000) * CPS), total);
        paint(k);

        if (buildMs) buildMs.textContent = `${Math.round(elapsed)} ms`;

        if (k < total) { raf = requestAnimationFrame(step); return; }

        running = false;
        finish(Math.round(elapsed));
      };

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    };

    // start when the card is on screen (after the preloader clears)
    paint(0);
    if (buildText) buildText.textContent = "waiting…";

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setTimeout(run, 900);
    };

    const cardIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        start();
        cardIO.disconnect();
      });
    }, { threshold: 0.25 });
    cardIO.observe(card);

    $("#codeReplay")?.addEventListener("click", () => {
      if (running) return;
      paint(0);
      run();
    });
  })();

  /* ---------------------------------------------------------
     scroll reveal + counters + meters
     --------------------------------------------------------- */
  $$(".reveal").forEach((el) => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty("--d", `${d}ms`);
  });

  const animateCounter = (el) => {
    const raw = el.dataset.toRaw;
    const target = parseFloat(raw ?? el.dataset.to ?? "0");
    const decimals = raw && raw.includes(".") ? raw.split(".")[1].length : 0;
    const suffix = el.dataset.suffix || "";
    const dur = 1500;
    const start = performance.now();

    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };

    if (reduceMotion) el.textContent = target.toFixed(decimals) + suffix;
    else requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      el.classList.add("is-visible");

      $$(".counter", el).forEach((c) => {
        if (!c.dataset.done) { c.dataset.done = "1"; animateCounter(c); }
      });

      const meter = $(".meter", el);
      if (meter && !meter.dataset.done) {
        meter.dataset.done = "1";
        const bar = $("i", meter);
        setTimeout(() => { bar.style.width = `${meter.dataset.level || 0}%`; }, 220);
      }

      io.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });

  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------------------------------------------------------
     nav: stuck state, active link, sliding ink
     --------------------------------------------------------- */
  const nav = $("#nav");
  const navLinks = $$(".nav__links a");
  const ink = $(".nav__ink");
  const bar = $(".scroll-progress i");
  const toTop = $("#toTop");

  const moveInk = (link) => {
    if (!ink || !link) return;
    ink.style.width = `${link.offsetWidth}px`;
    ink.style.transform = `translateX(${link.offsetLeft - 5}px)`;
    ink.style.opacity = "1";
  };

  const setActive = (id) => {
    let match = null;
    navLinks.forEach((a) => {
      const on = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", on);
      if (on) match = a;
    });
    if (match) moveInk(match);
  };

  // hover preview for the ink pill
  const activeLink = () => navLinks.find((a) => a.classList.contains("is-active"));
  navLinks.forEach((a) => {
    a.addEventListener("mouseenter", () => moveInk(a));
    a.addEventListener("focus", () => moveInk(a));
  });
  $(".nav__links")?.addEventListener("mouseleave", () => moveInk(activeLink()));

  const sections = $$("main section[id]");
  const spy = new IntersectionObserver((entries) => {
    const vis = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (vis) setActive(vis.target.id);
  }, { threshold: [0.2, 0.5], rootMargin: `-${80}px 0px -40% 0px` });
  sections.forEach((s) => spy.observe(s));

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    nav?.classList.toggle("is-stuck", y > 24);
    toTop?.classList.toggle("is-on", y > 620);
    if (bar) bar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  window.addEventListener("resize", () => {
    moveInk(activeLink());
    if (window.innerWidth > 1000) closeMenu();
  });

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------
     mobile menu — explicit open state prevents duplicate nav
     --------------------------------------------------------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");

  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.hidden = true;
    burger?.setAttribute("aria-expanded", "false");
    burger?.setAttribute("aria-label", "Open menu");
  };

  closeMenu(); // enforce a clean initial state, including cached pages

  burger?.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    if (open) { closeMenu(); return; }
    menu.hidden = false;
    menu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
  });

  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  document.addEventListener("click", (e) => {
    if (!menu?.classList.contains("is-open")) return;
    if (!menu.contains(e.target) && !burger?.contains(e.target)) closeMenu();
  });

  /* ---------------------------------------------------------
     project filters
     --------------------------------------------------------- */
  const cards = $$("#projectGrid .pcard");
  $$(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;

      $$(".filter").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });

      cards.forEach((card, i) => {
        const cats = (card.dataset.cat || "").split(/\s+/);
        const show = f === "all" || cats.includes(f) || cats.includes("all");

        card.classList.toggle("is-hidden", !show);
        card.classList.remove("is-in");
        if (show && !reduceMotion) {
          card.style.animationDelay = `${i * 55}ms`;
          void card.offsetWidth; // restart animation
          card.classList.add("is-in");
        }
      });
    });
  });

  /* ---------------------------------------------------------
     GitHub profile + repositories (public API — never a token)
     --------------------------------------------------------- */
  (function githubShowcase() {
    const grid = $("#repoGrid");
    if (!grid) return;

    const USER = "Abhimishra68";
    const API = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;
    const languageColours = {
      Dart: "#00B4AB", JavaScript: "#f1e05a", TypeScript: "#3178c6",
      HTML: "#e34c26", CSS: "#563d7c", Python: "#3572A5",
      Java: "#b07219", "C++": "#f34b7d", C: "#555555",
      Kotlin: "#A97BFF", Swift: "#F05138", Shell: "#89e051"
    };

    // Offline fallback keeps the portfolio useful when GitHub rate-limits a visitor.
    const fallback = [
      ["asset-management-system", "TypeScript", "A typed system for organising and tracking digital or physical assets."],
      ["Resume_Chitra", "JavaScript", "An interactive resume-focused web experience with a polished visual presentation."],
      ["TaskProgressScreen", "Dart", "Flutter task management, progress analytics, smart scheduling and family collaboration UI."],
      ["crypto-marketplace-UI", "Dart", "A modern crypto wallet dashboard with balances, charts and transaction history."],
      ["financial-statistics-dashboard", "Dart", "A modular Flutter finance dashboard with donut, line and bar visualisations."],
      ["productivity-dashboard-UI", "Dart", "A premium Flutter productivity dashboard for reminders, insights and analytics."],
      ["Ai_component_generator", "JavaScript", "An AI-assisted interface that turns prompts into reusable web components."],
      ["Notes_App", "JavaScript", "A responsive React notes app with hooks, dynamic rendering and Tailwind styling."],
      ["gallery_project", "JavaScript", "A paginated React image gallery using Axios, reusable cards and loading states."],
      ["dynamic_routing", "JavaScript", "A React Router demonstration with URL parameters, shared layouts and navigation."],
      ["nested_routing", "JavaScript", "A React Router app demonstrating nested product routes and fallback pages."],
      ["itsmyvault", "JavaScript", "A personal vault concept for organising private notes and media."],
      ["dynamo-bf4d2b9-software-engineering", "C++", "A software-engineering exercise focused on a register-allocation hazard fix."]
    ].map(([name, language, description], i) => ({
      name, language, description,
      html_url: `https://github.com/${USER}/${encodeURIComponent(name)}`,
      stargazers_count: 0, forks_count: 0,
      updated_at: new Date(Date.now() - i * 86400000).toISOString(),
      fork: false, archived: false
    }));

    const sourceLinks = new Map([
      ["GenerativeUI", "Ai_component_generator"],
      ["My Vault", "itsmyvault"],
      ["Texcure", "texcurefinal"]
    ]);

    // Add real source links to the matching hand-curated projects.
    $$("#projectGrid .pcard").forEach((card) => {
      const title = $("h3", card)?.textContent || "";
      const match = [...sourceLinks].find(([prefix]) => title.startsWith(prefix));
      if (!match || $(".pcard__source", card)) return;
      const a = document.createElement("a");
      a.className = "pcard__source";
      a.href = `https://github.com/${USER}/${match[1]}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.append("View source ");
      const arrow = document.createElement("span");
      arrow.textContent = "↗";
      a.appendChild(arrow);
      card.appendChild(a);
    });

    let repos = [];
    let visibleLimit = 9;
    const search = $("#repoSearch");
    const language = $("#repoLanguage");
    const sort = $("#repoSort");
    const more = $("#repoMore");
    const result = $("#repoResult");

    const safeRepoUrl = (repo) => {
      const expected = `https://github.com/${USER}/`;
      return typeof repo.html_url === "string" && repo.html_url.startsWith(expected)
        ? repo.html_url
        : `${expected}${encodeURIComponent(String(repo.name || ""))}`;
    };

    const formatDate = (iso) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime())
        ? "Recently"
        : new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(d);
    };

    const svg = (path) => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      el.setAttribute("viewBox", "0 0 24 24");
      el.setAttribute("aria-hidden", "true");
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", path);
      el.appendChild(p);
      return el;
    };

    const createRepoCard = (repo, index) => {
      const a = document.createElement("a");
      a.className = "repo-card glass";
      a.href = safeRepoUrl(repo);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.animationDelay = `${Math.min(index * 55, 440)}ms`;

      const top = document.createElement("div");
      top.className = "repo-card__top";
      const folder = document.createElement("span");
      folder.className = "repo-card__folder";
      folder.appendChild(svg("M3 7.5V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z"));
      const arrow = document.createElement("span");
      arrow.className = "repo-card__arrow";
      arrow.appendChild(svg("M7 17 17 7M8 7h9v9"));
      top.append(folder, arrow);

      const h = document.createElement("h4");
      h.textContent = String(repo.name || "Untitled repository").replace(/[-_]+/g, " ");
      const p = document.createElement("p");
      p.textContent = repo.description || `${repo.language || "Software"} project from my public GitHub collection.`;

      const meta = document.createElement("div");
      meta.className = "repo-card__meta";
      if (repo.language) {
        const lang = document.createElement("span");
        const dot = document.createElement("i");
        dot.style.background = languageColours[repo.language] || "#8b949e";
        lang.append(dot, document.createTextNode(repo.language));
        meta.appendChild(lang);
      }
      const stars = document.createElement("span");
      stars.append(svg("m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9L7.6 20l1-6.1-4.4-4.3 6.1-.9L12 3Z"), document.createTextNode(String(repo.stargazers_count || 0)));
      const updated = document.createElement("span");
      updated.textContent = `Updated ${formatDate(repo.updated_at)}`;
      meta.append(stars, updated);

      a.append(top, h, p, meta);
      return a;
    };

    const renderLanguages = () => {
      const box = $("#ghLanguages");
      if (!box) return;
      const counts = new Map();
      repos.forEach((r) => { if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1); });
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
      const total = top.reduce((n, [, count]) => n + count, 0) || 1;

      const barEl = document.createElement("div");
      barEl.className = "github-languages__bar";
      const legend = document.createElement("div");
      legend.className = "github-languages__legend";

      top.forEach(([name, count], i) => {
        const colour = languageColours[name] || "#8b949e";
        const piece = document.createElement("i");
        piece.style.width = `${(count / total) * 100}%`;
        piece.style.background = colour;
        piece.style.animationDelay = `${i * 90}ms`;
        piece.title = `${name}: ${count} repositories`;
        barEl.appendChild(piece);

        const item = document.createElement("span");
        const dot = document.createElement("i");
        dot.style.background = colour;
        item.append(dot, document.createTextNode(`${name} ${Math.round((count / total) * 100)}%`));
        legend.appendChild(item);
      });
      box.replaceChildren(barEl, legend);
      const langCount = $("#ghLanguageCount");
      if (langCount) langCount.textContent = String(counts.size);
    };

    const populateLanguageFilter = () => {
      if (!language) return;
      const values = [...new Set(repos.map((r) => r.language).filter(Boolean))].sort();
      values.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        language.appendChild(option);
      });
    };

    const render = () => {
      const term = (search?.value || "").trim().toLowerCase();
      const lang = language?.value || "all";
      const order = sort?.value || "updated";
      let filtered = repos.filter((r) => {
        const haystack = `${r.name || ""} ${r.description || ""} ${r.language || ""}`.toLowerCase();
        return (!term || haystack.includes(term)) && (lang === "all" || r.language === lang);
      });

      filtered.sort((a, b) => {
        if (order === "name") return String(a.name).localeCompare(String(b.name));
        if (order === "stars") return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

      const shown = filtered.slice(0, visibleLimit);
      grid.replaceChildren();
      grid.setAttribute("aria-busy", "false");

      if (!shown.length) {
        const empty = document.createElement("div");
        empty.className = "repo-empty glass";
        empty.textContent = "No repositories match that search. Try another language or keyword.";
        grid.appendChild(empty);
      } else {
        const frag = document.createDocumentFragment();
        shown.forEach((repo, i) => frag.appendChild(createRepoCard(repo, i)));
        grid.appendChild(frag);
      }

      if (result) result.textContent = `${filtered.length} ${filtered.length === 1 ? "repository" : "repositories"} found · showing ${shown.length}`;
      if (more) {
        more.hidden = filtered.length <= shown.length;
        more.textContent = `Show all ${filtered.length} repositories`;
      }
    };

    const initialise = (data, live) => {
      repos = data.filter((r) => !r.fork && !r.archived);
      const stars = repos.reduce((n, r) => n + (r.stargazers_count || 0), 0);
      const repoCount = $("#ghRepoCount");
      const starCount = $("#ghStarCount");
      const status = $("#ghUpdated");
      if (repoCount) repoCount.textContent = String(repos.length);
      if (starCount) starCount.textContent = String(stars);
      if (status) status.textContent = live ? "Synced" : "Cached";
      if (search) search.placeholder = `Search ${repos.length} repositories…`;
      populateLanguageFilter();
      renderLanguages();
      render();
    };

    [search, language, sort].forEach((control) => control?.addEventListener("input", () => {
      visibleLimit = 9;
      render();
    }));
    more?.addEventListener("click", () => { visibleLimit = Number.POSITIVE_INFINITY; render(); });

    // ── stale-while-revalidate: paint cached repos instantly, refresh in background
    const CACHE_KEY = "am-portfolio-gh-cache-v1";
    const TTL = 15 * 60 * 1000; // 15 minutes considered fresh
    let painted = false;

    try {
      const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && Array.isArray(cached.data) && cached.data.length) {
          initialise(cached.data, true);
          painted = true;
          // If it's still fresh, skip the network round-trip entirely.
          if (Date.now() - cached.t < TTL) return;
        }
      }
    } catch (_) { /* corrupted cache — ignore */ }

    fetch(API, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "default"
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Unexpected payload");
        try {
          const payload = JSON.stringify({ t: Date.now(), data });
          sessionStorage.setItem(CACHE_KEY, payload);
          localStorage.setItem(CACHE_KEY, payload);
        } catch (_) { /* quota — non-fatal */ }
        initialise(data, true);
      })
      .catch(() => { if (!painted) initialise(fallback, false); });
  })();

  /* ---------------------------------------------------------
     pointer-driven effects (desktop only)
     --------------------------------------------------------- */
  if (fine && !reduceMotion) {
    // cursor glow
    const glow = $(".cursor-glow");
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy;

    document.addEventListener("pointermove", (e) => {
      gx = e.clientX; gy = e.clientY;
      document.body.classList.add("has-cursor");
    });

    const loop = () => {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      if (glow) glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // 3D tilt
    $$("[data-tilt]").forEach((el) => {
      const inner = el.classList.contains("tilt") ? el : el;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform =
          `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-5px)`;
      });
      el.addEventListener("pointerleave", () => { inner.style.transform = ""; });
    });

    // radial glow follows pointer inside project cards
    $$(".pcard").forEach((card) => {
      const g = $(".pcard__glow", card);
      if (!g) return;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        g.style.left = `${e.clientX - r.left}px`;
        g.style.top = `${e.clientY - r.top}px`;
      });
    });

    // magnetic buttons
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = `translate(${dx}px, ${dy - 2}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------
     constellation canvas
     --------------------------------------------------------- */
  const canvas = $("#constellation");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1, dots = [], raf = null;
    const pointer = { x: -9999, y: -9999 };

    const accent = () =>
      getComputedStyle(root).getPropertyValue("--a1").trim() || "#22d3ee";

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      const density = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 16000), 110);
      dots = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22 * dpr,
        vy: (Math.random() - 0.5) * 0.22 * dpr,
        r: (Math.random() * 1.4 + 0.5) * dpr,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const link = 132 * dpr;
      const col = accent();

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.55;
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const o = dots[j];
          const dx = d.x - o.x, dy = d.y - o.y;
          const dist = Math.hypot(dx, dy);
          if (dist > link) continue;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = col;
          ctx.globalAlpha = (1 - dist / link) * 0.16;
          ctx.lineWidth = dpr * 0.6;
          ctx.stroke();
        }

        // pointer interaction
        const pdx = d.x - pointer.x * dpr;
        const pdy = d.y - pointer.y * dpr;
        const pd = Math.hypot(pdx, pdy);
        if (pd < 170 * dpr) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(pointer.x * dpr, pointer.y * dpr);
          ctx.strokeStyle = col;
          ctx.globalAlpha = (1 - pd / (170 * dpr)) * 0.3;
          ctx.lineWidth = dpr * 0.7;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    let rt = null;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 180);
    });
    window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    window.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });

    // pause when the tab is hidden to save battery
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) raf = requestAnimationFrame(draw);
    });

    resize();
    raf = requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------
     smooth in-page scroll — custom easing, cancels on user input
     --------------------------------------------------------- */
  let scrollAnim = null;
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

  const smoothScrollTo = (targetY) => {
    if (reduceMotion) { window.scrollTo(0, targetY); return; }
    if (scrollAnim) cancelAnimationFrame(scrollAnim);

    const startY = window.scrollY;
    const delta = targetY - startY;
    const distance = Math.abs(delta);
    if (distance < 2) return;

    // long jumps get a bit more time, short ones stay snappy
    const duration = Math.min(1100, 380 + distance * 0.42);
    const t0 = performance.now();

    const cancel = () => {
      cancelAnimationFrame(scrollAnim);
      scrollAnim = null;
      window.removeEventListener("wheel", cancel, { passive: true });
      window.removeEventListener("touchstart", cancel, { passive: true });
      window.removeEventListener("keydown", cancel);
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);

    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      window.scrollTo(0, startY + delta * easeOutQuint(p));
      if (p < 1) scrollAnim = requestAnimationFrame(step);
      else cancel();
    };
    scrollAnim = requestAnimationFrame(step);
  };

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offset = id === "#hero" ? 0 : 70;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      smoothScrollTo(top);
      history.replaceState(null, "", id);
    });
  });

  /* ---------------------------------------------------------
     easter egg: konami-lite (type "flutter")
     --------------------------------------------------------- */
  let buf = "";
  document.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-7);
    if (buf === "flutter") {
      document.body.animate(
        [{ filter: "hue-rotate(0deg)" }, { filter: "hue-rotate(360deg)" }],
        { duration: 1600, easing: "ease-in-out" }
      );
      buf = "";
    }
  });
})();
