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

  /* ---------- Lecteur modal ---------- */
  const modal = document.getElementById("videoModal");
  const modalFrame = document.getElementById("modalFrame");
  function openVideo(id) {
    if (!id) { window.open(CFG.channelUrl, "_blank", "noopener"); return; }
    modalFrame.innerHTML = `<iframe class="absolute inset-0 h-full w-full" src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
      title="Capture Média" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }
  function closeVideo() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modalFrame.innerHTML = "";
    document.body.classList.remove("overflow-hidden");
  }
  document.getElementById("modalClose").addEventListener("click", closeVideo);
  modal.addEventListener("click", e => { if (e.target === modal) closeVideo(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeVideo(); });

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
  heroPoster.addEventListener("click", () => openVideo(heroId));

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
    grid.querySelectorAll("button.card").forEach(b => b.addEventListener("click", () => openVideo(b.dataset.id)));
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
})();
