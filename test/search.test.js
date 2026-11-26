const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/search.js');

const segs = [
  { t: 0, text: "Bonjour à tous, c'est l'Été !" },
  { t: 5, text: 'On parle du XIXe SIÈCLE et' },
  { t: 12, text: 'de la révolution   industrielle.' },
  { t: 3725, text: 'Fin : l’été revient, été encore.' },
];
const idx = S.buildIndex(segs);
const hl = (r) => segs[r.seg].text.slice(r.start, r.end);

test('casse et accents ignorés, surlignage sur le texte d’origine', () => {
  const r = S.search(idx, 'ete');
  assert.deepEqual(r.map((x) => x.t), [0, 3725, 3725]);
  assert.deepEqual(r.map(hl), ['Été', 'été', 'été']);
  assert.deepEqual(S.search(idx, 'SIECLE').map(hl), ['SIÈCLE']);
});

test('expression à cheval sur deux segments', () => {
  const r = S.search(idx, 'siècle et de la');
  assert.equal(r.length, 1);
  assert.equal(r[0].t, 5);
  assert.equal(hl(r[0]), 'SIÈCLE et');
});

test('espaces multiples et apostrophes typographiques', () => {
  assert.equal(S.search(idx, 'révolution industrielle').length, 1);
  assert.equal(hl(S.search(idx, "l'ete revient")[0]), 'l’été revient');
});

test('requête vide ou absente', () => {
  assert.deepEqual(S.search(idx, '   '), []);
  assert.deepEqual(S.search(null, 'x'), []);
  assert.deepEqual(S.search(idx, 'introuvable'), []);
});

test('format des temps', () => {
  assert.equal(S.formatTime(5), '0:05');
  assert.equal(S.formatTime(3725), '1:02:05');
  assert.equal(S.toSeconds('1:02:05'), 3725);
});

test('lecture d’une vraie réponse get_panel', () => {
  const segs = S.parseTranscript(require('./fixture-panel.json'));
  assert.ok(segs.length > 20);
  assert.ok(segs.every((s) => Number.isFinite(s.t) && s.text));
  const r = S.search(S.buildIndex(segs), 'STRANGERS to love');
  assert.equal(r[0].t, 18);
});
