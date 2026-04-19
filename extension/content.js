// PureFind AI — content script
// =====================================================================
// DOM access contract (privacy-critical — keep in sync with /privacy):
//
//   RUNS ON: https://www.amazon.com/s* ONLY (manifest-enforced).
//
//   READS (from Amazon search pages only):
//     - document.body (to appendChild the widget container)
//     - document.getElementById("purefind-widget-container" / legacy IDs)
//       for dedupe and cleanup
//
//   DOES NOT READ:
//     - form fields, search input values, URL query params
//     - page content, product titles, prices, or any rendered data
//     - cookies, localStorage, or any site-set data
//
//   WRITES:
//     - Appends one <div id="purefind-widget-container"> to <body>,
//       containing an <iframe src=popup.html> (isolated context) and
//       a floating <button> to toggle the widget open/closed.
//
//   POSTMESSAGE:
//     - Listens for {action: "closePureFindWidget"} from the widget iframe
//       to close. No other messages are read or forwarded.
//
// Everything that searches Amazon / calls our API lives inside the
// iframe (popup.js), which runs in its own extension context — it never
// sees the host page's DOM.
// =====================================================================

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

    // --- Drag logic ---
    let isDragging = false;
    let wasDragged = false;
    let dragStartX, dragStartY, startLeft, startTop;

    btn.addEventListener("mousedown", (e) => {
      isDragging = true;
      wasDragged = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = container.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      // Switch from right-positioned to left-positioned for dragging
      container.style.right = "auto";
      container.style.left = startLeft + "px";
      container.style.top = startTop + "px";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
      container.style.left = startLeft + dx + "px";
      container.style.top = startTop + dy + "px";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Toggle logic — only toggle if the user clicked without dragging
    btn.addEventListener("click", () => {
      if (!wasDragged) container.classList.toggle("open");
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
