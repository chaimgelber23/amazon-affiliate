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

    // Vibrant icon + text for the wider pill button
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
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
