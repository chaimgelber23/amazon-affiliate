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

    // Luxurious minimalist diamond spark SVG
    btn.innerHTML = `
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2L16.5 11.5L26 14L16.5 16.5L14 26L11.5 16.5L2 14L11.5 11.5L14 2Z" fill="url(#pf-grad)"/>
        <defs>
          <linearGradient id="pf-grad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop stop-color="#334155"/>
            <stop offset="1" stop-color="#0F172A"/>
          </linearGradient>
        </defs>
      </svg>
    `;

    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openPopup" });
    });
  }

  inject();
})();
