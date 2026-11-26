<p align="center"><img src="icons/icon-512.png" width="112" alt=""></p>

# Trouvaille

Cherchez un mot dans ce qui est dit dans une vidéo YouTube, puis sautez au moment où il est prononcé.

Trouvaille lit la transcription de la vidéo, celle du bouton « Afficher la transcription » de YouTube. La recherche ignore les majuscules et les accents : « siecle » trouve « Siècle ». Chaque passage trouvé est aussi marqué en jaune sur la barre de progression.

## Installation

Trouvaille n'est pas encore sur le Chrome Web Store : on l'installe à la main, en mode développeur. Comptez deux minutes. Ça marche dans Chrome, Opera et les autres navigateurs Chromium (Brave, Edge, Arc).

### 1. Récupérer le dossier

1. Téléchargez `trouvaille.zip` depuis la page [Releases](https://github.com/lepalph/trouvaille/releases/latest).
2. Décompressez-le :
   - sur Mac, double-cliquez sur le fichier ;
   - sur Windows, faites un clic droit, puis « Extraire tout… » et « Extraire ».
3. Rangez le dossier obtenu à un endroit où il restera, par exemple dans Documents. Ne le supprimez pas après l'installation : le navigateur lit l'extension dans ce dossier.

Le bon dossier est celui qui contient directement `manifest.json`. Sur Windows, l'extraction crée parfois un dossier `trouvaille` dans un autre dossier `trouvaille` : prenez celui de l'intérieur.

### 2. L'ajouter au navigateur

| | Google Chrome | Opera |
|---|---|---|
| Page à ouvrir | `chrome://extensions` | `opera://extensions` |
| Puis | activer « Mode développeur », en haut à droite | activer « Mode développeur », en haut à droite |
| Puis | « Charger l'extension non empaquetée » | « Charger l'extension non empaquetée » |
| Garder l'icône visible | pièce de puzzle en haut à droite, puis l'épingle à côté de Trouvaille | icône du cube (extensions) dans la barre d'outils, puis l'épingle |

Dans la fenêtre de choix, sélectionnez le dossier sans l'ouvrir, puis validez avec « Sélectionner » (Mac) ou « Sélectionner un dossier » (Windows). Sur Mac, ⌘ ⇧ G permet de coller un chemin directement.

Une carte « Trouvaille » apparaît dans la liste. Rechargez ensuite les onglets YouTube déjà ouverts (⌘ R sur Mac, F5 sur Windows).

### En cas de problème

- « Fichier manifeste manquant » : le dossier choisi n'est pas le bon, il faut celui qui contient `manifest.json`.
- Au démarrage, Chrome propose de « Désactiver les extensions en mode développeur » : fermez la bulle avec la croix. Ce message apparaît pour toute extension installée hors du Chrome Web Store.
- Le raccourci ne fait rien : un autre programme l'utilise peut-être. Changez-le sur `chrome://extensions/shortcuts` (Opera : `opera://extensions/shortcuts`), ou cliquez sur l'icône de l'extension.

## Utilisation

Sur une page de vidéo YouTube :

| Action | Raccourci |
|---|---|
| Ouvrir ou fermer la recherche | ⌥ F sur Mac, Alt + Maj + F sur Windows et Linux, ou clic sur l'icône de l'extension |
| Passage suivant | Entrée ou ↓ |
| Passage précédent | Maj + Entrée ou ↑ |
| Fermer | Échap |

Un clic sur un extrait de la liste emmène aussi au moment voulu. Pour changer le raccourci : `chrome://extensions/shortcuts` (dans Opera : `opera://extensions/shortcuts`).

## Limites connues

- Il faut que la vidéo ait une transcription. C'est le cas de la plupart d'entre elles, grâce aux sous-titres générés automatiquement.
- La recherche porte sur la transcription proposée par défaut par YouTube. On ne peut pas encore choisir la langue.
- Le saut se fait à la seconde où commence la phrase, pas au mot exact.
- Trouvaille utilise une interface interne de YouTube. Si YouTube la modifie, l'extension peut cesser de fonctionner jusqu'à la prochaine mise à jour.
- Rien n'est envoyé ailleurs qu'à YouTube, et rien n'est enregistré.

## Retours

Indiquez le lien de la vidéo, le mot cherché, et ce qui s'est passé à la place de ce que vous attendiez.

## For English-speaking testers

Trouvaille lets you search the words spoken in a YouTube video and jump to the moment they're said. To install it, download `trouvaille.zip` from [Releases](https://github.com/lepalph/trouvaille/releases/latest), unzip it, open `chrome://extensions` (or `opera://extensions`), turn on Developer mode, click "Load unpacked" and pick the folder. Press ⌥F on Mac or Alt+Shift+F elsewhere (or click the extension icon) on a video page. Enter goes to the next match, Shift+Enter to the previous one, Esc closes the bar.

## Développement

```sh
npm install
npx playwright install chromium
npm test        # recherche (node:test)
npm run e2e     # extension chargée dans Chromium, sur le vrai YouTube (HEADED=1 pour voir, SHOTS=1 pour les captures)
npm run zip     # trouvaille.zip à envoyer aux testeurs
```

`src/search.js` contient les fonctions pures (lecture de la réponse YouTube, index, recherche) et `src/trouvaille.js` la barre injectée dans le lecteur. Les deux tournent dans le monde de la page, qui donne accès à `ytcfg` et à l'API du lecteur. `src/bridge.js` relaie le clic sur l'icône et le raccourci, et `src/background.js` contient le service worker.

Pour reprendre le projet (choix techniques, impasses déjà explorées, suite prévue) : [REPRISE.md](REPRISE.md).
