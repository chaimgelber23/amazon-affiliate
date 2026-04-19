// PureFind AI — content script
// Injects a "✦ PureFind AI" button next to Amazon's search bar

(function () {
  "use strict";

  const BTN_ID = "purefind-btn";

  function inject() {
    if (document.getElementById(BTN_ID)) return;

    const searchForm = document.getElementById("nav-search-bar-form");
    if (!searchForm) return;

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.textContent = "✦ PureFind AI";
    btn.title = "Search with PureFind AI";

    // Insert right after the search form
    searchForm.parentNode.insertBefore(btn, searchForm.nextSibling);

    btn.addEventListener("click", () => {
      // Open extension popup via chrome.runtime message isn't possible from content,
      // so we open the popup URL directly as a small window
      // The popup is already available via the toolbar icon — clicking this button
      // just opens the popup.html as a standalone window (works for unpacked extensions)
      chrome.runtime.sendMessage({ action: "openPopup" });
    });
  }

  // Try immediately, then observe for dynamic DOM changes
  inject();

  const observer = new MutationObserver(() => {
    if (!document.getElementById(BTN_ID)) inject();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
