const API_URL = "https://purefind.vercel.app/api/search";
const TAG = "purefind-20";

const queryEl = document.getElementById("query");
const searchBtn = document.getElementById("search-btn");
const refineQueryEl = document.getElementById("refine-query");
const refineBtn = document.getElementById("refine-btn");
const newSearchBtn = document.getElementById("new-search-btn");
const initialSearchContainer = document.getElementById("initial-search-container");
const refineSearchContainer = document.getElementById("refine-search-container");
const resultsEl = document.getElementById("results");

let messageHistory = [];

// Restore last state including conversation history
chrome.storage.local.get(["lastQuery", "messageHistory"], (data) => {
  if (data.lastQuery) {
    queryEl.value = data.lastQuery;
  }
  if (data.messageHistory && data.messageHistory.length > 0) {
    messageHistory = data.messageHistory;
    // We don't auto-run, just restore state if needed. But usually, 
    // we want a fresh start unless we are persisting the whole results view (which we aren't doing yet fully).
    // For now, if there's history, we might just clear it to avoid confusion on reopen,
    // or keep it if the user wants to continue. Let's start fresh on popup open for simplicity,
    // or keep it if they just closed and reopened.
  }
});

queryEl.focus();
queryEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch(false);
});
searchBtn.addEventListener("click", () => runSearch(false));

refineQueryEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch(true);
});
refineBtn.addEventListener("click", () => runSearch(true));

newSearchBtn.addEventListener("click", () => {
  messageHistory = [];
  queryEl.value = "";
  refineQueryEl.value = "";
  initialSearchContainer.style.display = "block";
  refineSearchContainer.style.display = "none";
  resultsEl.innerHTML = `
    <div class="empty">
      <div class="empty-icon">✦</div>
      <div class="empty-title">AI-Powered Product Search</div>
      <div class="empty-sub">Type anything — "best headphones under $100", "quiet mechanical keyboard", "gift for a chef" — and get honest picks.</div>
    </div>`;
  chrome.storage.local.remove(["lastQuery", "messageHistory"]);
  queryEl.focus();
});

function extractAsinFromText(text) {
  const match = text.match(/(?:dp|product|gp\/product|d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match ? match[1].toUpperCase() : null;
}

function isAmazonUrl(text) {
  return /amazon\.com/i.test(text) && extractAsinFromText(text) !== null;
}

function buildAmazonUrl(rawAsin, title) {
  const cleanAsin = rawAsin ? String(rawAsin).trim() : "";
  if (!cleanAsin || cleanAsin === "SEARCH") {
    const q = encodeURIComponent(title ?? "");
    return `https://www.amazon.com/s?k=${q}&tag=${TAG}`;
  }

  // Clean it up if the AI returned a giant URL instead of the 10-char ASIN
  let asin = cleanAsin;
  const match = cleanAsin.match(/(?:dp|product|gp\/product|d)\/([A-Z0-9]{10})/i);
  if (match) {
    asin = match[1].toUpperCase();
  } else {
    asin = cleanAsin.split("?")[0].replace(/[^A-Z0-9]/gi, "");
  }

  return `https://www.amazon.com/dp/${asin}?tag=${TAG}&linkCode=ll1`;
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderResults(data) {
  if (!data || !Array.isArray(data.products) || data.products.length === 0) {
    resultsEl.innerHTML = `<div class="error-msg">No products found. Try a different search.</div>`;
    return;
  }

  let html = "";

  if (data.summary) {
    html += `<div class="summary">${escHtml(data.summary)}</div>`;
  }

  for (const p of data.products) {
    const isSearch = !p.asin || p.asin === "SEARCH";
    const url = buildAmazonUrl(p.asin, p.title);
    const rankClass = p.rank <= 3 ? "top" : "other";
    const rankLabel = p.rank === 1 ? "#1 Top Pick" : p.rank === 2 ? "#2 Runner-Up" : p.rank === 3 ? "#3 Best Value" : `#${p.rank}`;

    const pros = (p.pros ?? [])
      .map((x) => `<li>${escHtml(x)}</li>`)
      .join("");
    const cons = (p.cons ?? [])
      .map((x) => `<li>${escHtml(x)}</li>`)
      .join("");

    html += `
      <div class="card">
        <div class="card-rank ${rankClass}">${rankLabel}</div>
        <div class="card-title">${escHtml(p.title)}</div>
        <div class="card-meta">
          ${p.priceEstimate ? `<span class="card-price">${escHtml(p.priceEstimate)}</span>` : ""}
          ${p.category ? `<span class="card-category">${escHtml(p.category)}</span>` : ""}
        </div>
        ${p.whyThisPick ? `<div class="card-why">${escHtml(p.whyThisPick)}</div>` : ""}
        ${(pros || cons) ? `
        <div class="card-lists">
          ${pros ? `<ul class="card-list pros"><div class="card-list-label">Pros</div>${pros}</ul>` : ""}
          ${cons ? `<ul class="card-list cons"><div class="card-list-label">Cons</div>${cons}</ul>` : ""}
        </div>` : ""}
        <a href="${escHtml(url)}" data-url="${escHtml(url)}" class="buy-btn ${isSearch ? "search-amazon" : ""}">
          ${isSearch ? "🔍 Search Amazon →" : "Buy on Amazon →"}
        </a>
      </div>`;
  }

  resultsEl.innerHTML = html;

  // Bind click events to open tabs correctly (prevents blank pages in extensions)
  const buttons = resultsEl.querySelectorAll(".buy-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetUrl = btn.getAttribute("data-url");
      if (targetUrl) {
        chrome.tabs.create({ url: targetUrl });
      }
    });
  });
}

function showLoading() {
  resultsEl.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      Finding the best products…
    </div>`;
}

function showError(msg) {
  resultsEl.innerHTML = `<div class="error-msg">${escHtml(msg)}</div>`;
}

async function runSearch(isRefine = false) {
  const activeInput = isRefine ? refineQueryEl : queryEl;
  let q = activeInput.value.trim();
  if (!q) return;

  // If user pasted an Amazon link, rewrite query
  if (isAmazonUrl(q) && !isRefine) {
    const asin = extractAsinFromText(q);
    q = `I'm looking at Amazon product ASIN ${asin}. Show me this exact product first, then find me similar alternatives that are better — better reviews, better price, or better overall value for the same use case.`;
  }

  // Update history
  messageHistory.push({ role: "user", content: q });
  chrome.storage.local.set({ lastQuery: q, messageHistory });

  if (isRefine) {
    refineBtn.disabled = true;
    refineQueryEl.value = ""; // clear input after sending
  } else {
    searchBtn.disabled = true;
  }

  showLoading();

  // Switch UI to Refine state
  initialSearchContainer.style.display = "none";
  refineSearchContainer.style.display = "block";

  let accumulated = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messageHistory }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showError(err.error ?? `Error ${res.status}. Please try again.`);
      return;
    }

    // Stream the response
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
    }

    // Find JSON in the accumulated text
    const jsonStart = accumulated.indexOf("{");
    const jsonEnd = accumulated.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      showError("Unexpected response. Please try again.");
      return;
    }

    const jsonStr = accumulated.slice(jsonStart, jsonEnd + 1);
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      showError("Could not parse response. Please try again.");
      return;
    }

    // Add assistant response to history
    messageHistory.push({ role: "assistant", content: jsonStr });
    chrome.storage.local.set({ messageHistory });

    renderResults(data);
  } catch (err) {
    if (err.name === "AbortError") return;
    showError("Connection error. Check your internet and try again.");
    // Pop the failed user message so they can try again
    messageHistory.pop();
  } finally {
    if (isRefine) {
      refineBtn.disabled = false;
    } else {
      searchBtn.disabled = false;
    }
  }
}
