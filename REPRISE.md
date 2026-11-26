# Reprendre Trouvaille

Ce document s'adresse à la personne, ou à l'agent, qui reprend le code. Le [README](README.md) couvre l'installation et l'usage.

## État au 26 novembre 2026 (v0.1.0)

L'extension fonctionne sur youtube.com dans Chrome et les navigateurs Chromium. Elle est installée à la main, en mode développeur, par une première vague de testeurs.

Ce qui marche :
- un raccourci (⌥F sur Mac, Alt+Maj+F ailleurs) ou un clic sur l'icône ouvre une barre de recherche posée sur le lecteur ;
- la recherche ignore la casse et les accents, et trouve les expressions à cheval sur deux segments du transcript ;
- Entrée et Maj+Entrée parcourent les passages, et un clic sur un extrait y saute ;
- les passages sont marqués en jaune sur la barre de progression ;
- la barre suit les changements de vidéo, que YouTube fait sans recharger la page ;
- l'interface est en français ou en anglais, selon la langue du navigateur.

Ce qui n'a pas été vérifié : le fonctionnement avec un compte YouTube connecté (les tests tournent déconnectés), le comportement dans un vrai Opera, sous Windows, et sur une vidéo sans aucune transcription.

## Organisation du code

```
manifest.json         MV3 : deux content scripts, un service worker, la commande _execute_action
src/search.js         fonctions pures : lecture de la réponse YouTube, index, recherche, format des temps
src/trouvaille.js     barre (Shadow DOM), chargement du transcript, navigation, repères sur la timeline
src/bridge.js         monde isolé : reçoit le message de l'extension et le relaie à la page
src/background.js     service worker : clic sur l'icône ou raccourci → message à l'onglet
_locales/             nom et description de l'extension (fr, en)
icons/                logo (SVG source et PNG)
test/search.test.js   tests unitaires (node:test)
test/e2e.mjs          test de bout en bout : extension chargée dans Chromium, sur le vrai YouTube
```

Le chemin d'un appui sur ⌥F : la commande `_execute_action` déclenche `chrome.action.onClicked` (`src/background.js`). Le service worker envoie `'toggle'` à l'onglet, `src/bridge.js` le reçoit et émet l'événement `trouvaille:toggle` sur `window`, et `src/trouvaille.js:304` ouvre ou ferme la barre.

## Choix techniques et pourquoi

### Le transcript vient de `get_panel`, pas des sous-titres

C'est le point le plus fragile du projet, et celui qui a coûté le plus de temps.

- La voie classique, les URL `/api/timedtext` listées dans `captionTracks`, renvoie un 200 avec un corps vide. Même l'URL signée par le lecteur (avec le jeton `pot`) revient vide sous Playwright.
- `/youtubei/v1/get_transcript` renvoie 400 `FAILED_PRECONDITION`.
- Ce qui marche, c'est la requête du panneau « Afficher la transcription » : un POST sur `/youtubei/v1/get_panel` avec `{ context: ytcfg.get('INNERTUBE_CONTEXT'), panelId: 'PAmodern_transcript_view', params }`.

`params` est un petit protobuf en base64 qu'on construit à partir de l'identifiant de la vidéo (`src/trouvaille.js:48`) : `aa 09 <len> 0a 0b <videoId> 18 01`. On ne dépend donc pas de `ytInitialData`, qui n'est plus à jour après une navigation interne.

La réponse contient des `macroMarkersPanelItemViewModel` : texte dans `transcriptSegmentViewModel.simpleText`, temps dans `onTap.innertubeCommand.watchEndpoint.startTimeSeconds` (`src/search.js:11`). Ce temps est à la seconde, d'où un saut au début de la phrase et pas au mot exact. Testé jusqu'à une vidéo de 3 h 10 (1 444 segments, transcript complet en une requête).

La requête part avec `credentials: 'omit'`. Elle est donc anonyme, et se comporte pareil que l'utilisateur soit connecté ou non.

**Si l'extension casse**, regardez d'abord la réponse de `get_panel` dans l'onglet Réseau, en ouvrant le panneau de transcription de YouTube à la main. La structure, le `panelId` ou le format de `params` ont probablement changé.

### Pas de choix de langue

`get_panel` renvoie la piste par défaut. Les champs 2, 4, 5 et 6 du protobuf ont été essayés avec un code de langue, sans effet (ou avec un 400). Le menu de langue prévu au départ a donc été abandonné en v1.

### Le script tourne dans le monde de la page

`src/search.js` et `src/trouvaille.js` sont déclarés avec `"world": "MAIN"`. Ils ont ainsi accès à `ytcfg` (contexte Innertube) et à l'API du lecteur (`movie_player.seekTo`, `getPlayerResponse`, `getDuration`). En contrepartie, `chrome.*` n'y existe pas : c'est pour ça que `bridge.js` tourne dans le monde isolé, et que les textes de l'interface sont dans un petit dictionnaire au lieu de `chrome.i18n`.

### Pas d'`innerHTML`

YouTube impose Trusted Types : toute affectation d'`innerHTML` lève une exception. Le DOM est construit avec `createElement`, à travers le petit utilitaire `h()` (`src/trouvaille.js:91`), et le CSS passe par `adoptedStyleSheets`.

### La barre est dans `#movie_player`, isolée

Elle est ajoutée dans le lecteur pour rester visible en plein écran, et enfermée dans un Shadow DOM pour que le CSS de YouTube ne la touche pas. Le lecteur écoute les touches (k, f, m, flèches) et les clics. Comme l'événement sort du Shadow DOM avec l'hôte pour cible, YouTube ne voit pas qu'on tape dans un champ. Les événements clavier et souris sont donc arrêtés sur l'hôte (`ensureUI`, `src/trouvaille.js:145`). Le test de bout en bout vérifie que taper « kfm j l » ne met ni pause, ni plein écran, ni sourdine.

### Navigation interne de YouTube

YouTube change de vidéo sans recharger la page. On écoute `yt-navigate-finish` et `yt-page-data-updated` (`src/trouvaille.js:310`), mais l'URL n'est pas toujours à jour au premier événement. Par sécurité, `run()` recharge aussi le transcript si l'identifiant de la vidéo a changé depuis le dernier chargement.

### Raccourci

`_execute_action` plutôt qu'une commande personnalisée : un seul écouteur sert au clic sur l'icône et au raccourci. Alt+F ouvre le menu du navigateur sous Windows et Linux, d'où Alt+Maj+F hors Mac.

### Safari abandonné

Le code est une WebExtension standard. Pour Safari, il faudrait Xcode complet pour la conversion, et un compte Apple Developer (99 $/an) pour la diffuser à des testeurs. Abandonné tant que l'idée n'est pas validée sur Chrome.

## Tests

```sh
npm install
npx playwright install chromium
npm test                 # 7 tests unitaires de la recherche
SHOTS=1 npm run e2e      # 10 étapes sur le vrai YouTube, captures dans test/shots/
HEADED=1 npm run e2e     # même test, navigateur visible
```

Pièges du test de bout en bout :
- le bandeau cookies européen bloque la page : on pose le cookie `SOCS=CAI` avant de charger ;
- un faux événement `yt-navigate` ne change pas vraiment de vidéo : pour tester la navigation interne, on clique sur une suggestion (`#secondary a[href*="/watch?v="]`) ;
- une pub peut précéder la vidéo : `openVideo` attend sa fin et clique sur « Passer » ;
- le test dépend du réseau et de YouTube. Un échec peut donc venir d'un changement côté YouTube, et c'est précisément ce qu'on veut détecter.

`test/fixture-panel.json` est une vraie réponse de `get_panel` (Rick Astley, « Never Gonna Give You Up »). Le test unitaire de lecture s'appuie dessus.

## Publier une version

1. Monter `version` dans `manifest.json` et `package.json`.
2. `npm run zip` produit `trouvaille.zip` (sans le PNG 512, réservé au README).
3. `gh release create vX.Y.Z trouvaille.zip` : le README renvoie vers la dernière Release.

## Suite possible

Par ordre d'intérêt, d'après ce qu'on sait aujourd'hui :

1. Recueillir les retours des testeurs, en particulier sur les comptes connectés et sur Windows.
2. Chrome Web Store en mode non répertorié (5 $ une fois) : installation en un clic et mises à jour automatiques. Le logo existe déjà, il faudra des captures et une politique de confidentialité (l'extension ne collecte rien).
3. Partir du passage le plus proche de la position de lecture, et non du premier, quand on appuie sur Entrée.
4. Choix de la langue, si une piste se présente (voir plus haut).
5. Recherche floue, pour les mots mal transcrits par les sous-titres automatiques.
