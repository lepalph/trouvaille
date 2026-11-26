// Fonctions pures : lecture de la réponse YouTube, index et recherche.
// Chargé tel quel dans la page (content script) et dans les tests Node.
var TrouvailleSearch = (() => {
  // "1:02:03" → 3723
  const toSeconds = (ts) =>
    typeof ts === 'string' && /^\d+(:\d+)*$/.test(ts)
      ? ts.split(':').reduce((acc, n) => acc * 60 + Number(n), 0)
      : NaN;

  // Réponse de /youtubei/v1/get_panel (panneau « Transcription ») → [{ t, text }]
  function parseTranscript(json) {
    const out = [];
    (function walk(o) {
      if (!o || typeof o !== 'object') return;
      const m = o.macroMarkersPanelItemViewModel;
      if (m) {
        const item = m.item?.timelineItemViewModel;
        const text = (item?.contentItems || [])
          .map((c) => c.transcriptSegmentViewModel?.simpleText)
          .filter(Boolean)
          .join(' ')
          .trim();
        const t = m.onTap?.innertubeCommand?.watchEndpoint?.startTimeSeconds ?? toSeconds(item?.timestamp);
        if (text && Number.isFinite(t)) out.push({ t, text });
        return;
      }
      for (const k in o) walk(o[k]);
    })(json);
    return out;
  }

  // Un caractère d'origine → sa forme repliée (sans accents, minuscules, apostrophes et espaces unifiés).
  const fold = (ch) => {
    const f = ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’‘ʼ`´]/g, "'");
    return /^\s+$/.test(f) ? ' ' : f;
  };
  const foldQuery = (q) => [...q].map(fold).join('').replace(/\s+/g, ' ').trim();

  // Texte complet replié + correspondance de chaque caractère replié vers (segment, position d'origine).
  function buildIndex(segments) {
    let norm = '';
    const seg = [], off = [], len = [];
    const push = (s, i, o, l, f) => {
      for (const c of f) {
        if (c === ' ' && (norm === '' || norm.endsWith(' '))) continue;
        norm += c; seg.push(i); off.push(o); len.push(l);
      }
    };
    segments.forEach((s, i) => {
      if (i) push(s, i - 1, segments[i - 1].text.length, 0, ' '); // séparateur entre segments
      let o = 0;
      for (const ch of s.text) { push(s, i, o, ch.length, fold(ch)); o += ch.length; }
    });
    return { segments, norm, seg, off, len };
  }

  // → [{ seg, t, start, end }] : start/end = surlignage dans segments[seg].text
  function search(index, query) {
    const q = foldQuery(query || '');
    const results = [];
    if (!q || !index) return results;
    for (let i = index.norm.indexOf(q); i !== -1; i = index.norm.indexOf(q, i + q.length)) {
      const s = index.seg[i], last = i + q.length - 1;
      const text = index.segments[s].text;
      // Correspondance à cheval sur deux segments : on surligne jusqu'à la fin du premier.
      const end = index.seg[last] === s ? index.off[last] + index.len[last] : text.length;
      results.push({ seg: s, t: index.segments[s].t, start: index.off[i], end });
    }
    return results;
  }

  const formatTime = (t) => {
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };

  return { parseTranscript, buildIndex, search, formatTime, toSeconds };
})();

if (typeof module === 'object' && module.exports) module.exports = TrouvailleSearch;
