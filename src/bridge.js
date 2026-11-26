// Monde isolé → monde de la page : seul ce script reçoit les messages de l'extension.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg === 'toggle') dispatchEvent(new CustomEvent('trouvaille:toggle'));
});
