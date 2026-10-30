/* Capture Média — logique du site (ne pas modifier : éditez videos.js) */
(function () {
  const CFG = window.CAPTURE_CONFIG || {};
  const CATS = {
    enquetes: { label: "Enquête", badge: "bg-red-600 text-white", grad: "from-red-900" },
    societe:  { label: "Société", badge: "bg-blue-600 text-white", grad: "from-blue-900" },
    jeunesse: { label: "Jeunesse & Culture", badge: "bg-brand text-slate-950", grad: "from-yellow-700" }
  };

  /* ---------- Utilitaires ---------- */
  function ytId(input) {
    if (!input) return "";
    input = String(input).trim();
    if (/^[\w-]{11}$/.test(input)) return input;
    const m = input.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
    return m ? m[1] : "";
  }
  const thumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const esc = (s) => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Stockage local (son, j'aime, reprise de lecture) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  let muted = !!store.get("cm_muted", false);
  let likes = new Set(store.get("cm_likes", []));
  let positions = store.get("cm_pos", {});
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const savePositions = () => {
    const keys = Object.keys(positions);
    if (keys.length > 40) keys.slice(0, keys.length - 40).forEach(k => delete positions[k]);
    store.set("cm_pos", positions);
  };

  /* ---------- Lecteur façon TikTok ---------- */
  const modal = document.getElementById("videoModal");
  const feed = document.getElementById("feed");
  const toast = document.getElementById("feedToast");
  let items = [], current = -1, player = null, playerId = null, io2 = null, isOpen = false, ytReady = null;
  let toastT, tickT, tapT, lastTap = 0, tick = 0;
  const baseUrl = () => location.origin === "null" ? location.href.split("#")[0] : location.origin + location.pathname;
  const shareUrl = id => `${baseUrl()}#video=${id}`;

  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(res => {
      if (window.YT && YT.Player) return res(true);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(true); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => res(false);
      document.head.appendChild(s);
      setTimeout(() => res(!!(window.YT && YT.Player)), 6000);
    });
    return ytReady;
  }

  function showToast(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  const icoSound = () => muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
  function refreshRail() {
    feed.querySelectorAll('[data-act="mute"]').forEach(b => { b.innerHTML = icoSound(); b.setAttribute("aria-label", muted ? "Activer le son" : "Couper le son"); });
    feed.querySelectorAll('[data-act="like"]').forEach(b => b.classList.toggle("liked", likes.has(items[+b.closest(".slide").dataset.i].id)));
  }

  function slideHTML(v, i) {
    const c = CATS[v.category];
    const th = thumb(v.id);
    return `<section class="slide" data-i="${i}" aria-label="${esc(v.title)}">
      <div class="slide-bg" style="background-image:url('${th}')"></div>
      <div class="stage">
        <div class="pl"><div class="poster" style="background-image:url('${th}')"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-white/80"></i></div></div>
        <div class="tap" data-tap></div>
        <div class="flash"></div>
        <div class="heart"><i class="fa-solid fa-heart"></i></div>
        <div class="bar" data-bar aria-hidden="true"><i></i></div>
      </div>
      <div class="slide-info">
        ${c ? `<span class="mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${c.badge}">${c.label}</span>` : ""}
        <h3 class="text-base font-bold leading-snug sm:text-lg">${esc(v.title)}</h3>
        ${v.desc ? `<p class="mt-1 line-clamp-2 text-sm text-white/75">${esc(v.desc)}</p>` : ""}
        <p class="mt-1 text-xs text-white/60">${i + 1} / ${items.length}${v.date ? " · " + esc(v.date) : ""} · Capture Média</p>
      </div>
      <div class="rail">
        <button type="button" data-act="up" aria-label="Vidéo précédente" class="nav-btn"><i class="fa-solid fa-chevron-up"></i></button>
        <button type="button" data-act="down" aria-label="Vidéo suivante" class="nav-btn"><i class="fa-solid fa-chevron-down"></i></button>
        <button type="button" data-act="like" aria-label="J'aime"><i class="fa-solid fa-heart"></i></button>
        <button type="button" data-act="mute"></button>
        <button type="button" data-act="share" aria-label="Partager"><i class="fa-solid fa-share"></i></button>
        <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir sur YouTube"><i class="fa-brands fa-youtube"></i></a>
      </div>
    </section>`;
  }

  /* Position de lecture : sauvegardée pour reprendre là où on s'est arrêté */
  function rememberPosition(save) {
    if (!player || !player.getCurrentTime || !playerId) return;
    try {
      const id = playerId, t = player.getCurrentTime(), d = player.getDuration();
      if (d > 0 && t > 5 && d - t > 8) { delete positions[id]; positions[id] = Math.floor(t); }
      else if (d > 0 && d - t <= 8) delete positions[id];
      if (save) savePositions();
    } catch (_) {}
  }

  function updateBar() {
    if (!player || !player.getCurrentTime || current < 0) return;
    try {
      const t = player.getCurrentTime(), d = player.getDuration();
      const bar = feed.querySelector(`.slide[data-i="${current}"] .bar i`);
      if (bar && d > 0) bar.style.width = Math.min(100, (t / d) * 100) + "%";
      rememberPosition(++tick % 4 === 0);
    } catch (_) {}
  }

  function destroyPlayer() {
    clearInterval(tickT);
    rememberPosition(true);
    if (player) { try { player.destroy(); } catch (e) {} player = null; playerId = null; }
    feed.querySelectorAll(".pl").forEach(pl => {
      if (!pl.querySelector(".poster")) {
        const v = items[+pl.closest(".slide").dataset.i];
        pl.innerHTML = `<div class="poster" style="background-image:url('${thumb(v.id)}')"></div>`;
      }
    });
    feed.querySelectorAll(".bar i").forEach(i => i.style.width = "0");
  }

  async function playSlide(i) {
    if (i === current || i < 0 || i >= items.length) return;
    current = i;
    destroyPlayer();
    const v = items[i], id = v.id;
    // Garde l'adresse à jour : copier-coller du lien ouvre directement cette vidéo
    try { history.replaceState({ feed: 1 }, "", `#video=${id}`); } catch (_) {}
    if (items[i + 1]) new Image().src = thumb(items[i + 1].id); // précharge la miniature suivante (léger)
    const pl = feed.querySelector(`.slide[data-i="${i}"] .pl`);
    const ok = await loadYT();
    if (current !== i) return; // l'utilisateur a déjà changé de vidéo
    pl.innerHTML = '<div id="ytTarget"></div>';
    const saved = positions[id];
    if (ok) {
      const vars = { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, iv_load_policy: 3 };
      if (saved > 5) { vars.start = saved; showToast(`Reprise à ${fmt(saved)}`); }
      playerId = id;
      player = new YT.Player("ytTarget", {
        videoId: id,
        host: "https://www.youtube-nocookie.com",
        playerVars: vars,
        events: {
          onReady: e => { try { if (muted) e.target.mute(); e.target.playVideo(); } catch (_) {} },
          onAutoplayBlocked: () => { try { player.mute(); player.playVideo(); muted = true; refreshRail(); showToast("Touchez 🔇 pour activer le son"); } catch (_) {} },
          onError: () => { showToast("Vidéo indisponible"); if (current < items.length - 1) setTimeout(() => { if (current === i) goTo(i + 1); }, 1200); },
          onStateChange: e => {
            if (e.data === 0) { // terminée -> vidéo suivante, comme TikTok
              delete positions[id]; savePositions();
              if (current < items.length - 1) goTo(current + 1);
              else { try { e.target.seekTo(0); e.target.playVideo(); } catch (_) {} }
            }
          }
        }
      });
      tickT = setInterval(updateBar, 500);
    } else {
      pl.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0" title="Capture Média" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
  }

  function goTo(i, instant) {
    i = Math.max(0, Math.min(items.length - 1, i));
    const s = feed.querySelector(`.slide[data-i="${i}"]`);
    if (s) s.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
  }

  function share(v) {
    const url = shareUrl(v.id);
    if (navigator.share) { navigator.share({ title: v.title, text: v.title, url }).catch(() => {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast("Lien copié"), () => showToast(url));
    else showToast(url);
  }

  function flash(slide, cls, html) {
    const el = slide.querySelector("." + cls);
    if (html) el.innerHTML = html;
    el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
  }
  function toggleLike(v, slide, force) {
    const was = likes.has(v.id);
    if (force && was) { flash(slide, "heart"); return; } // double-tap sur une vidéo déjà aimée : juste l'animation
    was ? likes.delete(v.id) : likes.add(v.id);
    store.set("cm_likes", [...likes]);
    if (!was) flash(slide, "heart");
    refreshRail();
  }
  function togglePlay(slide) {
    if (!player || !player.getPlayerState) return;
    try {
      if (player.getPlayerState() === 1) { player.pauseVideo(); flash(slide, "flash", '<i class="fa-solid fa-pause"></i>'); }
      else { player.playVideo(); flash(slide, "flash", '<i class="fa-solid fa-play ml-1"></i>'); }
    } catch (_) {}
  }
  function setMuted(m) {
    muted = m; store.set("cm_muted", m);
    try { m ? player.mute() : player.unMute(); } catch (_) {}
    refreshRail();
  }

  function openFeed(list, start) {
    items = list.filter(v => v.id);
    if (!items.length) { window.open(CFG.channelUrl, "_blank", "noopener"); return; }
    feed.innerHTML = items.map(slideHTML).join("");
    refreshRail();
    modal.classList.add("open"); isOpen = true;
    document.body.classList.add("overflow-hidden");
    current = -1;
    if (io2) io2.disconnect();
    io2 = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting && en.intersectionRatio >= 0.6) playSlide(+en.target.dataset.i);
    }), { root: feed, threshold: [0.6] });
    feed.querySelectorAll(".slide").forEach(s => io2.observe(s));
    history.pushState({ feed: 1 }, "");
    goTo(start || 0, true);
    if (!start) playSlide(0);
    showGuide();
  }

  /* ---------- Guide de geste (affiché tant que le visiteur n'a pas glissé) ---------- */
  let guideEl = null, guideT, guideAt = 0;
  function hideGuide(done) {
    clearTimeout(guideT);
    if (done) store.set("cm_swiped", true);
    if (!guideEl) return;
    const g = guideEl; guideEl = null;
    g.classList.add("out"); setTimeout(() => g.remove(), 350);
  }
  function showGuide() {
    if (items.length < 2 || store.get("cm_swiped", false)) return;
    const n = store.get("cm_guide_n", 0);
    if (n >= 4) return; // jamais plus de 4 ouvertures
    store.set("cm_guide_n", n + 1);
    const touch = window.matchMedia("(hover: none)").matches;
    const g = document.createElement("div");
    g.className = "swipe-guide"; g.setAttribute("aria-hidden", "true");
    g.innerHTML = `<div class="swipe-track"><span class="swipe-chev"></span><span class="swipe-chev"></span><span class="swipe-finger"></span></div>
      <p class="swipe-text">${touch ? "Glissez vers le haut" : "Molette ou flèches ↑ ↓"}<small>pour voir la vidéo suivante</small></p>`;
    modal.appendChild(g); guideEl = g; guideAt = Date.now();
    guideT = setTimeout(() => hideGuide(false), 6500);
  }
  feed.addEventListener("scroll", () => { if (guideEl && Date.now() - guideAt > 900 && feed.scrollTop > 40) hideGuide(true); }, { passive: true });

  function closeFeed(fromPop) {
    if (!isOpen) return;
    isOpen = false;
    if (io2) { io2.disconnect(); io2 = null; }
    destroyPlayer();
    clearTimeout(tapT);
    hideGuide(false);
    feed.innerHTML = ""; current = -1;
    modal.classList.remove("open");
    document.body.classList.remove("overflow-hidden");
    if (!fromPop && history.state && history.state.feed) history.back();
  }

  feed.addEventListener("click", e => {
    const slideEl = e.target.closest(".slide");
    if (!slideEl) return;
    const v = items[+slideEl.dataset.i];
    const bar = e.target.closest("[data-bar]");
    if (bar) { // toucher la barre de progression = avancer / reculer
      if (player && player.getDuration && +slideEl.dataset.i === current) {
        const r = bar.getBoundingClientRect();
        try { player.seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * player.getDuration(), true); updateBar(); } catch (_) {}
      }
      return;
    }
    if (e.target.closest("[data-tap]")) {
      const now = Date.now();
      if (now - lastTap < 300) { clearTimeout(tapT); lastTap = 0; toggleLike(v, slideEl, true); }
      else { lastTap = now; tapT = setTimeout(() => togglePlay(slideEl), 260); }
      return;
    }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "up") goTo(current - 1);
    else if (act === "down") goTo(current + 1);
    else if (act === "share") share(v);
    else if (act === "like") toggleLike(v, slideEl);
    else if (act === "mute") setMuted(!muted);
  });
  document.getElementById("modalClose").addEventListener("click", () => closeFeed());
  window.addEventListener("popstate", () => closeFeed(true));
  document.addEventListener("keydown", e => {
    if (!isOpen) return;
    if (e.key === "Escape") closeFeed();
    else if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); goTo(current + 1); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); goTo(current - 1); }
    else if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(feed.querySelector(`.slide[data-i="${current}"]`)); }
    else if (e.key === "m") setMuted(!muted);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) rememberPosition(true); });
  window.addEventListener("pagehide", () => rememberPosition(true));

  /* ---------- Hero : vidéo à la une ---------- */
  const heroId = ytId(CFG.featured && CFG.featured.url);
  const heroPoster = document.getElementById("playerPoster");
  if (heroId) {
    const img = document.getElementById("heroThumb");
    img.src = `https://img.youtube.com/vi/${heroId}/maxresdefault.jpg`;
    img.onerror = () => { img.onerror = null; img.src = thumb(heroId); };
    img.classList.remove("hidden");
    document.getElementById("heroTitle").textContent = (CFG.featured.title || "Regarder le grand reportage");
  }
  heroPoster.addEventListener("click", () => {
    if (!heroId) { window.open(CFG.channelUrl, "_blank", "noopener"); return; }
    openFeed(fullList(), 0);
  });

  /* ---------- Grille des reportages ---------- */
  const grid = document.getElementById("grid");
  const list = (CFG.videos || []).map(v => ({ ...v, id: ytId(v.url) })).filter(v => v.id || v.title);

  function card(v) {
    const c = CATS[v.category] || CATS.societe;
    if (!v.id) {
      const q = encodeURIComponent(v.title);
      return `
    <a href="${CFG.channelUrl}/search?query=${q}" target="_blank" rel="noopener noreferrer" data-cat="${esc(v.category)}"
      class="card group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-slate-600">
      <div class="relative aspect-video overflow-hidden bg-gradient-to-br ${c.grad} via-slate-800 to-slate-900">
        <img src="logo.png" alt="" class="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-xl opacity-40" />
        <span class="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${c.badge}">${c.label}</span>
        <span class="play-overlay absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-950"><i class="fa-solid fa-play ml-1"></i></span>
        </span>
      </div>
      <div class="p-4 sm:p-5">
        <h3 class="text-base font-bold leading-snug text-white group-hover:text-brand sm:text-lg">${esc(v.title)}</h3>
        <p class="mt-4 text-xs font-medium text-slate-500"><i class="fa-brands fa-youtube mr-1 text-red-500"></i> Regarder sur YouTube</p>
      </div>
    </a>`;
    }
    return `
    <button type="button" data-cat="${esc(v.category)}" data-id="${v.id}"
      class="card group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-left transition hover:-translate-y-1 hover:border-slate-600">
      <div class="relative aspect-video overflow-hidden bg-gradient-to-br ${c.grad} via-slate-800 to-slate-900">
        <img src="logo.png" alt="" class="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-xl opacity-40" />
        <img data-thumb src="${thumb(v.id)}" alt="${esc(v.title)}" loading="lazy" class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        <span class="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${c.badge}">${c.label}</span>
        <span class="play-overlay absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-950"><i class="fa-solid fa-play ml-1"></i></span>
        </span>
      </div>
      <div class="p-4 sm:p-5">
        <h3 class="text-base font-bold leading-snug text-white group-hover:text-brand sm:text-lg">${esc(v.title)}</h3>
        ${v.desc ? `<p class="mt-2 line-clamp-2 text-sm text-slate-400">${esc(v.desc)}</p>` : ""}
        <p class="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
          <span><i class="fa-brands fa-youtube mr-1 text-red-500"></i> Regarder</span>
          <span>${esc(v.date)}</span>
        </p>
      </div>
    </button>`;
  }

  function placeholder(cat, title, desc) {
    const c = CATS[cat];
    return `
    <a href="${CFG.channelUrl}" target="_blank" rel="noopener noreferrer" data-cat="${cat}"
      class="card group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-slate-600">
      <div class="relative aspect-video overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br ${c.grad} via-slate-800 to-slate-900 transition duration-500 group-hover:scale-110"></div>
        <img src="logo.png" alt="" class="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-xl opacity-30" />
        <span class="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${c.badge}">${c.label}</span>
      </div>
      <div class="p-5">
        <h3 class="text-lg font-bold text-white group-hover:text-brand">${title}</h3>
        <p class="mt-2 text-sm text-slate-400">${desc}</p>
        <p class="mt-4 text-xs font-medium text-slate-500"><i class="fa-brands fa-youtube mr-1 text-red-500"></i> Voir la chaîne</p>
      </div>
    </a>`;
  }

  if (list.length) {
    grid.innerHTML = list.map(card).join("");
    // Miniature absente ou invalide (YouTube renvoie une image grise de 120 px) -> on garde le logo
    grid.querySelectorAll("img[data-thumb]").forEach(img => {
      const bad = () => img.remove();
      img.addEventListener("error", bad);
      img.addEventListener("load", () => { if (img.naturalWidth <= 120) bad(); });
      if (img.complete && img.naturalWidth) { if (img.naturalWidth <= 120) bad(); }
    });
    grid.querySelectorAll("button.card").forEach(b => b.addEventListener("click", () => {
      // Le fil suit le filtre actif : on ne garde que les cartes visibles
      const ids = [...grid.querySelectorAll("button.card:not(.hidden)")].map(x => x.dataset.id);
      const feedList = ids.map(id => list.find(v => v.id === id));
      openFeed(feedList, Math.max(0, ids.indexOf(b.dataset.id)));
    }));
  } else {
    grid.innerHTML =
      placeholder("enquetes", "Enquêtes de terrain", "Investigations, preuves et témoignages.") +
      placeholder("societe", "Société", "Reportages au plus près des réalités du quotidien.") +
      placeholder("jeunesse", "Jeunesse & Culture", "Portraits de talents et de créateurs africains.");
  }

  /* ---------- Filtres ---------- */
  const buttons = document.querySelectorAll(".filter-btn");
  function applyFilter(f) {
    buttons.forEach(b => {
      const on = b.dataset.filter === f;
      b.classList.toggle("bg-brand", on);
      b.classList.toggle("text-slate-950", on);
      b.classList.toggle("border-brand", on);
      b.classList.toggle("text-slate-300", !on);
      b.classList.toggle("border-slate-700", !on);
    });
    let shown = 0;
    grid.querySelectorAll(".card").forEach(c => {
      const hide = f !== "all" && c.dataset.cat !== f;
      c.classList.toggle("hidden", hide);
      if (!hide) shown++;
    });
    document.getElementById("emptyState").classList.toggle("hidden", shown !== 0);
  }
  buttons.forEach(b => b.addEventListener("click", () => applyFilter(b.dataset.filter)));
  document.querySelectorAll("[data-filter-link]").forEach(l =>
    l.addEventListener("click", () => applyFilter(l.dataset.filterLink)));

  /* ---------- Menu mobile ---------- */
  const menu = document.getElementById("mobileMenu");
  const menuBtn = document.getElementById("menuBtn");
  function setMenu(open) {
    menu.classList.toggle("hidden", !open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }
  menuBtn.addEventListener("click", () => setMenu(menu.classList.contains("hidden")));
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", e => { if (!menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false); });
  window.matchMedia("(min-width: 768px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

  /* ---------- Formulaire -> WhatsApp ---------- */
  document.getElementById("topicForm").addEventListener("submit", e => {
    e.preventDefault();
    const nom = document.getElementById("nom").value.trim();
    const msg = document.getElementById("message").value.trim();
    const text = `Bonjour Capture Média,\n\nNom/Pseudo : ${nom}\n\nSujet / Alerte :\n${msg}`;
    window.open(`https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    e.target.reset();
  });

  /* ---------- Apparition au scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("reveal-in"); io.unobserve(en.target); }
  }), { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---------- Liste complète (à la une + reportages) et lien direct #video=ID ---------- */
  function fullList() {
    const out = [];
    if (heroId) out.push({ id: heroId, title: (CFG.featured && CFG.featured.title) || "À la une", category: "" });
    list.forEach(v => { if (v.id && v.id !== heroId) out.push(v); });
    return out;
  }
  function openFromHash() {
    const m = location.hash.match(/^#video=([\w-]{11})$/);
    if (!m || isOpen) return;
    let all = fullList(), idx = all.findIndex(v => v.id === m[1]);
    if (idx < 0) { all = [{ id: m[1], title: "Capture Média", category: "" }, ...all]; idx = 0; }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
    openFeed(all, idx);
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  /* ---------- Bouton « Télécharger l'app » (Android uniquement) ---------- */
  const isAndroid = /Android/i.test(navigator.userAgent);
  const inApp = /CaptureMediaApp/.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  const apkOn = !!(CFG.apkUrl && isAndroid && !inApp);
  if (apkOn) {
    document.querySelectorAll("[data-apk]").forEach(a => { a.href = CFG.apkUrl; a.classList.remove("hidden"); });
    document.querySelectorAll("[data-apk-menu]").forEach(d => d.classList.remove("hidden"));
  }

  /* ---------- iPhone / iPad : guide « Sur l'écran d'accueil » ---------- */
  const ua = navigator.userAgent;
  const isIPad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isIOS = /iPhone|iPod/.test(ua) || isIPad;
  const iosStandalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if (isIOS && !iosStandalone) {
    const sheet = document.getElementById("iosSheet");
    document.querySelectorAll("[data-ios-open]").forEach(b => b.classList.remove("hidden"));
    if (isIPad) { sheet.classList.add("ipad"); sheet.querySelector(".ios-where").textContent = "en haut à droite"; }
    const openSheet = () => { sheet.classList.add("open"); };
    const closeSheet = () => { sheet.classList.remove("open"); };
    document.querySelectorAll("[data-ios-open]").forEach(b => b.addEventListener("click", () => { setMenu(false); openSheet(); }));
    sheet.querySelectorAll("[data-ios-close]").forEach(b => b.addEventListener("click", closeSheet));
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
  }

  /* ---------- Appli installable (PWA) ---------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  let deferredInstall = null;
  const installBtn = document.getElementById("installBtn");
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    if (store.get("cm_install_dismissed", false) || apkOn) return; // sur Android, on propose l'APK à la place
    deferredInstall = e;
    installBtn.classList.remove("hidden"); installBtn.classList.add("flex");
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    if (outcome === "dismissed") store.set("cm_install_dismissed", true);
    deferredInstall = null; installBtn.classList.add("hidden"); installBtn.classList.remove("flex");
  });
  window.addEventListener("appinstalled", () => installBtn.classList.add("hidden"));
})();
