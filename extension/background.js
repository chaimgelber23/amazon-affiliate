// Background service worker for PureFind extension
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "openPopup") {
    // Open as a standard window since content scripts cannot bypass user-gesture constraints on openPopup()
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 420,
      height: 650
    });
  }
});
