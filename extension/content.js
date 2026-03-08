// PureFind AI — content script
// Injects a floating lux "PureFind" widget into Amazon

(function () {
  "use strict";

  const WIDGET_ID = "purefind-widget-container";
  let iframeRef = null;

  function inject() {
    if (document.getElementById(WIDGET_ID)) return;

    // Clean up old buttons
    const oldBtn = document.getElementById("purefind-fab");
    if (oldBtn) oldBtn.remove();
    const olderBtn = document.getElementById("purefind-btn");
    if (olderBtn) olderBtn.remove();

    const container = document.createElement("div");
    container.id = WIDGET_ID;

    // The iFrame that holds the actual extension UI
    const iframe = document.createElement("iframe");
    iframe.id = "purefind-iframe";
    iframe.src = chrome.runtime.getURL("popup.html");
    iframe.allow = "clipboard-write"; // Optional: if copy/paste needed later
    iframeRef = iframe;
    container.appendChild(iframe);

    // The FAB Button
    const btn = document.createElement("button");
    btn.id = "purefind-widget-fab";
    btn.type = "button";
    btn.title = "PureFind AI Assistant";
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
      PureFind AI
    `;
    container.appendChild(btn);
    document.body.appendChild(container);

    // Toggle logic
    btn.addEventListener("click", () => {
      container.classList.toggle("open");
    });
  }

  // Listen for close messages from the iframe (when user clicks the X inside the widget)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "closePureFindWidget") {
      const container = document.getElementById(WIDGET_ID);
      if (container) container.classList.remove("open");
    }
  });

  inject();
})();
