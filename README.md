[Français](README.fr.md) | English

<p align="center"><img src="icons/icon-512.png" width="112" alt=""></p>

# Trouvaille

Search for a word spoken in a YouTube video, then jump to the moment it's said.

Trouvaille reads the video's transcript, the one behind YouTube's "Show transcript" button. Search ignores case and accents, so "cafe" finds "Café". Every match is also marked in yellow on the progress bar.

## Installation

Trouvaille isn't on the Chrome Web Store yet, so you install it by hand in developer mode. It takes about two minutes and works in Chrome, Opera and other Chromium browsers (Brave, Edge, Arc).

### 1. Get the folder

1. Download `trouvaille.zip` from the [Releases](https://github.com/lepalph/trouvaille/releases/latest) page.
2. Unzip it:
   - on a Mac, double-click the file;
   - on Windows, right-click it, then choose "Extract All…" and "Extract".
3. Move the resulting folder somewhere it will stay, such as Documents. Don't delete it after installing: the browser loads the extension from that folder.

The right folder is the one that directly contains `manifest.json`. On Windows, extracting sometimes creates a `trouvaille` folder inside another `trouvaille` folder; pick the inner one.

### 2. Add it to your browser

| | Google Chrome | Opera |
|---|---|---|
| Open | `chrome://extensions` | `opera://extensions` |
| Then | turn on "Developer mode", top right | turn on "Developer mode", top right |
| Then | click "Load unpacked" | click "Load unpacked" |
| Keep the icon visible | puzzle piece at the top right, then the pin next to Trouvaille | cube icon (extensions) in the toolbar, then the pin |

In the file picker, select the folder without opening it, then confirm with "Select" (Mac) or "Select Folder" (Windows). On a Mac, ⌘ ⇧ G lets you paste a path.

A "Trouvaille" card shows up in the list. Reload any YouTube tabs that were already open (⌘ R on a Mac, F5 on Windows).

### Troubleshooting

- "Manifest file is missing or unreadable": you picked the wrong folder. Choose the one that contains `manifest.json`.
- At startup, Chrome offers to "Disable developer mode extensions": close the bubble with the cross. Chrome shows this for any extension installed outside the Web Store.
- The shortcut does nothing: another app may be using it. Change it at `chrome://extensions/shortcuts` (Opera: `opera://extensions/shortcuts`), or click the extension icon instead.

## Usage

On a YouTube video page:

| Action | Shortcut |
|---|---|
| Open or close search | ⌥ F on a Mac, Alt + Shift + F on Windows and Linux, or click the extension icon |
| Next match | Enter or ↓ |
| Previous match | Shift + Enter or ↑ |
| Close | Esc |

Clicking a snippet in the list also jumps to that moment. The interface is in English or French, depending on your browser's language.

## Known limitations

- The video needs a transcript. Most have one, thanks to YouTube's auto-generated captions.
- Search covers the transcript YouTube offers by default. You can't pick another language yet.
- The jump lands on the second where the sentence starts, not on the exact word.
- Trouvaille relies on an internal YouTube interface. If YouTube changes it, the extension may stop working until the next update.
- Nothing is sent anywhere except YouTube, and nothing is stored.

## Feedback

[Open an issue](https://github.com/lepalph/trouvaille/issues) with the video link, the word you searched for, and what happened instead of what you expected.

## Development

```sh
npm install
npx playwright install chromium
npm test        # search unit tests (node:test)
npm run e2e     # extension loaded in Chromium, on real YouTube (HEADED=1 to watch, SHOTS=1 for screenshots)
npm run zip     # trouvaille.zip for testers
```

`src/search.js` holds the pure functions (parsing YouTube's response, indexing, searching) and `src/trouvaille.js` the bar injected into the player. Both run in the page's main world, which gives them access to `ytcfg` and the player API. `src/bridge.js` relays the icon click and the shortcut, and `src/background.js` is the service worker.

Handover notes, written in French, cover the technical choices, the dead ends already explored and the next steps: [REPRISE.md](REPRISE.md).

## License

MIT
