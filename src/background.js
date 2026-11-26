// Clic sur l'icône ou raccourci (_execute_action) : on prévient l'onglet, sans erreur hors YouTube.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, 'toggle').catch(() => {});
});
