// Test de bout en bout : l'extension chargée dans Chromium, sur le vrai YouTube.
// Usage : npm run e2e   (HEADED=1 pour voir le navigateur, SHOTS=1 pour les captures dans test/shots/)
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ext = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = process.env.SHOTS && join(ext, 'test', 'shots');
if (shots) mkdirSync(shots, { recursive: true });

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'trouvaille-')), {
  channel: 'chromium',
  headless: !process.env.HEADED,
  locale: 'fr-FR',
  viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--disable-blink-features=AutomationControlled'],
});
// Bandeau cookies européen : déjà « refusé ».
await ctx.addCookies([{ name: 'SOCS', value: 'CAI', domain: '.youtube.com', path: '/' }]);
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));
const page = ctx.pages()[0] ?? (await ctx.newPage());

let failures = 0;
async function step(name, fn) {
  try {
    await fn();
    console.log('✔', name);
  } catch (e) {
    failures++;
    console.log('✖', name, '\n   ', e.message.split('\n').slice(0, 4).join('\n    '));
  }
}

const sel = (s) => page.locator('#trouvaille').locator(s); // Playwright traverse le Shadow DOM ouvert
const time = () => page.evaluate(() => document.querySelector('#movie_player video').currentTime);
// Passe par le vrai chemin : service worker → bridge (monde isolé) → script de la page.
const toggle = () =>
  sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, 'toggle');
  });

async function openVideo(id) {
  await page.goto('https://www.youtube.com/watch?v=' + id, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#movie_player video') && window.__trouvaille);
  // Pub éventuelle : on attend qu'elle finisse (ou on la passe).
  await page
    .waitForFunction(
      () => {
        document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button-modern')?.click();
        return !document.querySelector('#movie_player.ad-showing');
      },
      null,
      { timeout: 60000, polling: 500 },
    )
    .catch(() => {});
  await page.evaluate(() => document.getElementById('movie_player').pauseVideo?.());
}

await step('ouverture par le message de l’extension, champ focalisé', async () => {
  await openVideo('dQw4w9WgXcQ');
  await toggle();
  await sel('input').waitFor();
  assert.equal(await page.evaluate(() => document.getElementById('trouvaille').shadowRoot.activeElement?.tagName), 'INPUT');
});

await step('recherche insensible à la casse, compteur et liste', async () => {
  await sel('input').fill('STRANGERS');
  await sel('.item').first().waitFor({ timeout: 15000 });
  assert.ok((await sel('.item').count()) >= 1);
  assert.match(await sel('.count').textContent(), /^–\/\d+$/);
  assert.equal(await sel('.item mark').first().textContent(), 'strangers');
  if (shots) await page.screenshot({ path: join(shots, 'resultats.png') });
});

await step('Entrée va au premier passage (0:18)', async () => {
  await sel('input').press('Enter');
  await page.waitForTimeout(800);
  const t = await time();
  assert.ok(t >= 17.5 && t < 21, 'currentTime = ' + t);
  assert.match(await sel('.count').textContent(), /^1\/\d+$/);
  assert.equal(await page.locator('#trouvaille-markers > div').count(), Number((await sel('.count').textContent()).split('/')[1]));
});

await step('clic sur un extrait = saut au bon moment', async () => {
  await sel('input').fill('give you up');
  await sel('.item').nth(1).waitFor();
  const label = await sel('.item').nth(1).locator('.time').textContent();
  const expected = label.split(':').reduce((a, n) => a * 60 + Number(n), 0);
  await sel('.item').nth(1).click();
  await page.waitForTimeout(800);
  const t = await time();
  assert.ok(Math.abs(t - expected) < 1.5, `currentTime ${t}, attendu ${expected}`);
  assert.equal(await sel('.item[aria-current="true"] .time').textContent(), label);
});

await step('les touches tapées ne pilotent pas le lecteur (k, f, m, flèches)', async () => {
  const before = await page.evaluate(() => ({ paused: document.querySelector('#movie_player video').paused, muted: document.querySelector('#movie_player video').muted }));
  const t0 = await time();
  await sel('input').fill('');
  await sel('input').pressSequentially('kfm j l');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ paused: document.querySelector('#movie_player video').paused, muted: document.querySelector('#movie_player video').muted, fs: !!document.fullscreenElement }));
  assert.deepEqual({ paused: after.paused, muted: after.muted }, before);
  assert.equal(after.fs, false);
  assert.ok(Math.abs((await time()) - t0) < 1, 'la vidéo a bougé');
  assert.equal(await sel('input').inputValue(), 'kfm j l');
});

await step('aucun résultat : message clair', async () => {
  await sel('input').fill('zzzqqq');
  assert.match(await sel('.status').textContent(), /zzzqqq/);
  assert.equal(await sel('.count').textContent(), '0');
});

await step('Échap ferme la barre et retire les repères', async () => {
  await sel('input').press('Escape');
  assert.equal(await page.locator('#trouvaille').isHidden(), true);
  assert.equal(await page.locator('#trouvaille-markers').count(), 0);
});

await step('vidéo française longue : « siecle » trouve « siècle »', async () => {
  await openVideo('_hKZ7RPK3-Q');
  await toggle();
  await sel('input').fill('siecle');
  await sel('.item').first().waitFor({ timeout: 15000 });
  assert.match(await sel('.item mark').first().textContent(), /si[èe]cle/i);
  if (shots) await page.screenshot({ path: join(shots, 'francais.png') });
});

await step('navigation YouTube sans rechargement : la barre suit la nouvelle vidéo', async () => {
  const body = () => page.evaluate(() => document.getElementById('trouvaille').shadowRoot.querySelector('.body').textContent);
  await sel('input').fill('e');
  await sel('.item').first().waitFor();
  const old = await body();
  const before = page.url();
  await page.evaluate(() => { window.__sameDocument = true; });
  // Clic sur une suggestion : YouTube change de vidéo sans recharger la page.
  await page.locator('#secondary a[href*="/watch?v="]:visible').first().click();
  await page.waitForFunction((b) => location.href !== b && location.pathname === '/watch', before, { timeout: 15000 });
  assert.equal(await page.evaluate(() => window.__sameDocument), true, 'la page a été rechargée');
  await page.waitForTimeout(1500);
  await sel('input').fill('e');
  await page.waitForFunction((o) => {
    const t = document.getElementById('trouvaille').shadowRoot.querySelector('.body').textContent;
    return t && t !== o && !/Lecture de la transcription|Loading/.test(t);
  }, old, { timeout: 15000 });
  if (shots) await page.screenshot({ path: join(shots, 'navigation.png') });
});

await step('second message : la barre se ferme', async () => {
  await sel('input').focus();
  await toggle();
  assert.equal(await page.locator('#trouvaille').isHidden(), true);
});

await ctx.close();
console.log(failures ? `\n${failures} échec(s)` : '\nTout est vert.');
process.exit(failures ? 1 : 0);
