// Background service worker for PureFind extension
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "openPopup") {
    chrome.action.openPopup().catch(() => {
      // openPopup() requires user gesture in some contexts — the toolbar click handles this naturally
    });
  }
});
