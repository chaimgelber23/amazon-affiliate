// PureFind AI — content script
// Injects a floating lux "PureFind" button in the bottom corner of Amazon

(function () {
  "use strict";

  const FAB_ID = "purefind-fab";

  function inject() {
    if (document.getElementById(FAB_ID)) return;

    // Clean up any old navbar buttons left over from previous versions
    const oldBtn = document.getElementById("purefind-btn");
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement("button");
    btn.id = FAB_ID;
    btn.type = "button";
    btn.title = "PureFind AI Assistant";

    // Friendly Smiley Face SVG
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
      PureFind AI
    `;

    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openPopup" });
    });
  }

  inject();
})();
