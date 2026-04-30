importScripts("lib/constants.js", "lib/storage.js");

chrome.runtime.onInstalled.addListener(async (details) => {
  await globalThis.BreezeFill.storage.ensureDefaults();

  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message || typeof message !== "object") {
      sendResponse({ ok: false, error: "Invalid message." });
      return;
    }

    switch (message.type) {
      case "SAVE_RESPONSE_SET": {
        await globalThis.BreezeFill.storage.saveCandidates(
          message.origin,
          message.candidates || []
        );
        sendResponse({ ok: true });
        return;
      }

      case "IGNORE_ORIGIN": {
        await globalThis.BreezeFill.storage.ignoreOrigin(message.origin);
        sendResponse({ ok: true });
        return;
      }

      case "OPEN_OPTIONS": {
        chrome.runtime.openOptionsPage();
        sendResponse({ ok: true });
        return;
      }

      default:
        sendResponse({ ok: false, error: "Unknown message type." });
    }
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message });
  });

  return true;
});
