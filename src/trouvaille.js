// Barre de recherche dans le transcript, injectée dans le lecteur YouTube (monde de la page).
// Pas d'innerHTML : YouTube impose Trusted Types, tout le DOM est construit à la main.
(() => {
  if (window.__trouvaille) return;
  window.__trouvaille = true;

  const S = window.TrouvailleSearch;
  const MAX_ITEMS = 300; // au-delà, la liste ne sert plus ; le compteur et Entrée couvrent tout
  const MARK = '#ffd60a';
  const T = {
    fr: {
      placeholder: 'Rechercher dans la vidéo',
      loading: 'Lecture de la transcription…',
      none: "Cette vidéo n'a pas de transcription.",
      error: 'Impossible de charger la transcription. Vérifiez votre connexion puis réessayez.',
      retry: 'Réessayer',
      empty: (q) => `Aucun passage ne contient « ${q} ».`,
      hint: 'Tapez un mot puis Entrée pour aller au passage suivant.',
      more: (n) => `${n} premiers passages affichés. Entrée parcourt tous les autres.`,
      prev: 'Passage précédent (Maj+Entrée)',
      next: 'Passage suivant (Entrée)',
      close: 'Fermer (Échap)',
      count: (n) => `${n} passage${n > 1 ? 's' : ''}`,
    },
    en: {
      placeholder: 'Search this video',
      loading: 'Loading transcript…',
      none: 'This video has no transcript.',
      error: "Couldn't load the transcript. Check your connection and try again.",
      retry: 'Try again',
      empty: (q) => `No passage contains “${q}”.`,
      hint: 'Type a word, then press Enter to jump to the next passage.',
      more: (n) => `Showing the first ${n} passages. Enter goes through all of them.`,
      prev: 'Previous passage (Shift+Enter)',
      next: 'Next passage (Enter)',
      close: 'Close (Esc)',
      count: (n) => `${n} passage${n > 1 ? 's' : ''}`,
    },
  }[navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'];

  const player = () => document.getElementById('movie_player');
  const videoId = () => (location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') : null);

  // ---------- Transcript ----------
  const cache = new Map(); // videoId → Promise<segments>

  // Paramètre du panneau « Transcription » : protobuf { 149: { 1: videoId, 3: 1 } } en base64.
  const panelParams = (id) => {
    const inner = [0x0a, id.length, ...[...id].map((c) => c.charCodeAt(0)), 0x18, 1];
    return btoa(String.fromCharCode(0xaa, 0x09, inner.length, ...inner));
  };

  class NoTranscript extends Error {}

  function load(id) {
    if (!cache.has(id)) {
      const pr = player()?.getPlayerResponse?.();
      const p =
        pr?.videoDetails?.videoId === id && !pr.captions
          ? Promise.reject(new NoTranscript())
          : fetch('/youtubei/v1/get_panel?prettyPrint=false', {
              method: 'POST',
              credentials: 'omit', // requête anonyme, identique connecté ou non
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                context: window.ytcfg?.get?.('INNERTUBE_CONTEXT'),
                panelId: 'PAmodern_transcript_view',
                params: panelParams(id),
              }),
            })
              .then((r) => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
              })
              .then((json) => {
                const segs = S.parseTranscript(json);
                if (!segs.length) throw new NoTranscript();
                return segs;
              });
      p.catch((e) => { if (!(e instanceof NoTranscript)) cache.delete(id); }); // une erreur réseau peut être retentée
      cache.set(id, p);
    }
    return cache.get(id);
  }

  // ---------- État ----------
  let ui = null;
  let st = { id: null, index: null, results: [], cur: -1 };

  // ---------- DOM ----------
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    el.append(...kids);
    return el;
  }
  function icon(d) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    svg.append(path);
    return svg;
  }

  const CSS = `
    :host { all: initial; position: absolute; top: 12px; right: 12px; bottom: 64px; z-index: 70;
      width: min(380px, calc(100% - 24px)); display: flex; flex-direction: column; pointer-events: none;
      font: 400 13px/1.45 Roboto, Arial, sans-serif; color: #f1f1f1; -webkit-font-smoothing: antialiased; }
    :host([hidden]) { display: none; }
    .panel { pointer-events: auto; display: flex; flex-direction: column; min-height: 0; max-height: 100%;
      background: rgb(28 28 28 / .94); border-radius: 12px; box-shadow: 0 8px 24px rgb(0 0 0 / .45); overflow: hidden; }
    .bar { display: flex; align-items: center; gap: 2px; padding: 4px 4px 4px 14px; }
    input { flex: 1; min-width: 0; height: 36px; padding: 0; border: 0; outline: 0; background: none;
      color: inherit; font: inherit; font-size: 14px; caret-color: #f03; }
    input::placeholder { color: #aaa; }
    input::selection, .text::selection { background: rgb(62 166 255 / .45); }
    .count { color: #aaa; font-variant-numeric: tabular-nums; padding: 0 6px; white-space: nowrap; }
    button { all: unset; box-sizing: border-box; cursor: pointer; }
    .btn { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 50%; }
    .btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .btn:hover { background: rgb(255 255 255 / .1); }
    .btn:disabled { opacity: .38; cursor: default; background: none; }
    button:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
    .body { min-height: 0; display: flex; flex-direction: column; border-top: 1px solid rgb(255 255 255 / .1); }
    .body:empty { display: none; }
    .list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 4px;
      scrollbar-width: thin; scrollbar-color: rgb(255 255 255 / .3) transparent; }
    .list:empty { display: none; }
    .item { display: flex; gap: 12px; width: 100%; padding: 8px 10px; border-radius: 8px; }
    .item:hover { background: rgb(255 255 255 / .08); }
    .item[aria-current="true"] { background: rgb(255 255 255 / .14); box-shadow: inset 2px 0 0 #f03; }
    .time { flex: none; min-width: 4.5ch; color: #aaa; font-variant-numeric: tabular-nums; }
    .text { min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-wrap: pretty; }
    mark { background: ${MARK}; color: #0f0f0f; border-radius: 2px; padding: 0 1px; }
    .status { padding: 10px 14px 12px; color: #aaa; text-wrap: pretty; }
    .status button { margin-left: 6px; color: #f1f1f1; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
  `;

  function ensureUI() {
    if (ui?.host.isConnected) return ui;
    const pl = player();
    if (!pl) return null;
    const host = h('div', { id: 'trouvaille', hidden: '' });
    // Le lecteur réagit aux touches (k, f, flèches…) et aux clics : rien ne sort de la barre.
    for (const ev of ['keydown', 'keyup', 'keypress', 'click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu'])
      host.addEventListener(ev, (e) => e.stopPropagation());
    const shadow = host.attachShadow({ mode: 'open' });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    shadow.adoptedStyleSheets = [sheet];

    const input = h('input', { type: 'text', placeholder: T.placeholder, 'aria-label': T.placeholder, spellcheck: 'false', autocomplete: 'off' });
    const count = h('span', { class: 'count', 'aria-live': 'polite', 'aria-atomic': 'true' });
    const prev = h('button', { class: 'btn', title: T.prev, 'aria-label': T.prev, onclick: () => go(-1) }, icon('M6 15l6-6 6 6'));
    const next = h('button', { class: 'btn', title: T.next, 'aria-label': T.next, onclick: () => go(1) }, icon('M6 9l6 6 6-6'));
    const close = h('button', { class: 'btn', title: T.close, 'aria-label': T.close, onclick: hide }, icon('M6 6l12 12M18 6L6 18'));
    const list = h('div', { class: 'list' });
    const body = h('div', { class: 'body' });

    input.addEventListener('input', run);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey) ? -1 : 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      }
    });

    shadow.append(h('div', { class: 'panel', role: 'search' }, h('div', { class: 'bar' }, input, count, prev, next, close), body));
    pl.append(host);
    ui = { host, shadow, input, count, prev, next, list, body };
    return ui;
  }

  function status(text, action) {
    const kids = [text];
    if (action) kids.push(h('button', { onclick: action.fn }, action.label));
    return h('p', { class: 'status', role: 'status' }, ...kids);
  }

  // ---------- Comportement ----------
  function show() {
    if (!videoId() || !ensureUI()) return;
    ui.host.hidden = false;
    ui.input.focus();
    ui.input.select();
    refresh();
  }

  function hide() {
    if (!ui) return;
    ui.host.hidden = true;
    markers(false);
    player()?.focus(); // rend les raccourcis clavier au lecteur
  }

  function refresh() {
    const id = videoId();
    if (id !== st.id) st = { id, index: null, results: [], cur: -1 };
    if (st.index) return run();
    const timer = setTimeout(() => st.id === id && !st.index && ui.body.replaceChildren(status(T.loading)), 300);
    load(id)
      .then((segs) => {
        if (st.id !== id) return;
        st.index = S.buildIndex(segs);
        run();
      })
      .catch((e) => {
        if (st.id !== id) return;
        ui.body.replaceChildren(e instanceof NoTranscript ? status(T.none) : status(T.error, { label: T.retry, fn: refresh }));
        updateCount();
      })
      .finally(() => clearTimeout(timer));
  }

  function run() {
    if (videoId() !== st.id) return refresh();
    if (!st.index) return;
    const q = ui.input.value.trim();
    st.results = S.search(st.index, q);
    st.cur = -1;
    const kids = [];
    if (!q) kids.push(status(T.hint));
    else if (!st.results.length) kids.push(status(T.empty(q)));
    else {
      ui.list.replaceChildren(...st.results.slice(0, MAX_ITEMS).map(item));
      ui.list.scrollTop = 0;
      kids.push(ui.list);
      if (st.results.length > MAX_ITEMS) kids.push(status(T.more(MAX_ITEMS)));
    }
    ui.body.replaceChildren(...kids);
    updateCount();
    markers(true);
  }

  function item(r, i) {
    const text = st.index.segments[r.seg].text;
    return h(
      'button',
      { class: 'item', onclick: () => select(i) },
      h('span', { class: 'time' }, S.formatTime(r.t)),
      h('span', { class: 'text' }, text.slice(0, r.start), h('mark', {}, text.slice(r.start, r.end)), text.slice(r.end)),
    );
  }

  function go(delta) {
    const n = st.results.length;
    if (!n) return;
    select(st.cur < 0 ? (delta > 0 ? 0 : n - 1) : (st.cur + delta + n) % n);
  }

  function select(i) {
    st.cur = i;
    const t = st.results[i].t;
    const pl = player();
    if (pl?.seekTo) pl.seekTo(t, true);
    else document.querySelector('video').currentTime = t;
    ui.list.querySelector('[aria-current]')?.removeAttribute('aria-current');
    const el = ui.list.children[i];
    if (el) {
      el.setAttribute('aria-current', 'true');
      el.scrollIntoView({ block: 'nearest' });
    }
    updateCount();
    markers(true);
  }

  function updateCount() {
    const n = st.results.length;
    const q = ui.input.value.trim();
    ui.count.textContent = !st.index || !q ? '' : n ? `${st.cur < 0 ? '–' : st.cur + 1}/${n}` : '0';
    ui.count.title = n ? T.count(n) : '';
    ui.prev.disabled = ui.next.disabled = !n;
  }

  // Moment signature : chaque passage trouvé devient un repère sur la barre de progression.
  function markers(on) {
    document.getElementById('trouvaille-markers')?.remove();
    const bar = document.querySelector('#movie_player .ytp-progress-bar');
    const dur = player()?.getDuration?.() || document.querySelector('#movie_player video')?.duration;
    if (!on || !bar || !dur || !st.results.length) return;
    const box = document.createElement('div');
    box.id = 'trouvaille-markers';
    box.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:40';
    st.results.forEach((r, i) => {
      const m = document.createElement('div');
      const cur = i === st.cur;
      m.style.cssText = `position:absolute;top:${cur ? -2 : 0}px;bottom:${cur ? -2 : 0}px;width:${cur ? 4 : 3}px;` +
        `left:calc(${Math.min(100, (r.t / dur) * 100)}% - 1px);border-radius:1px;background:${cur ? '#fff' : MARK}`;
      box.append(m);
    });
    bar.append(box);
  }

  // ---------- Déclencheurs ----------
  addEventListener('trouvaille:toggle', () => {
    if (ui && !ui.host.hidden && ui.shadow.activeElement === ui.input) hide();
    else show();
  });

  // YouTube change de vidéo sans recharger la page ; l'URL n'est pas toujours à jour au premier événement.
  for (const ev of ['yt-navigate-finish', 'yt-page-data-updated'])
    document.addEventListener(ev, () => {
      if (!ui || ui.host.hidden || videoId() === st.id) return; // émis aussi sans changement de vidéo
      if (videoId()) refresh();
      else hide();
    });
})();
