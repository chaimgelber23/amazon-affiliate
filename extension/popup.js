const API_URL = "https://purefind.vercel.app/api/search";
const TAG = "purefind-20";

const queryEl = document.getElementById("query");
const searchBtn = document.getElementById("search-btn");
const searchContainer = document.getElementById("search-container");
const resultsEl = document.getElementById("results");
const clearBtn = document.getElementById("clear-btn");

let messages = []; // Track conversation history for multi-turn search

// Restore last query
chrome.storage.local.get("lastQuery", ({ lastQuery }) => {
  if (lastQuery) queryEl.value = lastQuery;
});

queryEl.focus();
queryEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
searchBtn.addEventListener("click", runSearch);

clearBtn.addEventListener("click", () => {
  messages = [];
  queryEl.value = "";
  queryEl.placeholder = "What are you looking for?";
  searchContainer.classList.remove("follow-up");
  searchBtn.textContent = "Search";
  clearBtn.style.display = "none";
  chrome.storage.local.remove("lastQuery");

  resultsEl.innerHTML = `
    <div class="empty">
      <div class="empty-icon">✦</div>
      <div class="empty-title">AI-Powered Product Search</div>
      <div class="empty-sub">Type anything — "best headphones under $100", "quiet mechanical keyboard", "gift for a chef" — and get honest picks.</div>
    </div>`;

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

  // Remove linkCode parameters that trigger adblockers on blank windows
  return `https://www.amazon.com/dp/${asin}?tag=${TAG}`;
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

async function runSearch() {
  let q = queryEl.value.trim();
  if (!q) return;
  // If user pasted an Amazon link, rewrite query
  if (isAmazonUrl(q)) {
    const asin = extractAsinFromText(q);
    q = `I'm looking at Amazon product ASIN ${asin}. Show me this exact product first, then find me similar alternatives that are better — better reviews, better price, or better overall value for the same use case.`;
  }

  chrome.storage.local.set({ lastQuery: q });
  searchBtn.disabled = true;
  showLoading();

  // Add the new user query to the active conversation history
  messages.push({ role: "user", content: q });

  let accumulated = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }), // Send the full conversation history
    });

    if (!res.ok) {
      messages.pop(); // Remove the failed query so they can try again
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
      messages.pop(); // Remove failed query to avoid poisoning history Context
      showError("Could not parse response. Please try again.");
      return;
    }

    // Save the AI's response to the memory so it knows what products it recommended for future questions
    const aiContext = `SUMMARY: ${data.summary}\nPRODUCTS SHOWN: ${data.products.map(p => p.title).join(" | ")}`;
    messages.push({ role: "assistant", content: aiContext });

    // Change input to show it is now a follow-up
    queryEl.value = "";
    queryEl.placeholder = "Ask a follow up... (e.g. which is best for the money?)";
    searchContainer.classList.add("follow-up");
    searchBtn.textContent = "Ask AI";
    clearBtn.style.display = "block";

    renderResults(data);
  } catch (err) {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") messages.pop();
    if (err.name === "AbortError") return;
    showError("Connection error. Check your internet and try again.");
  } finally {
    searchBtn.disabled = false;
  }
}
