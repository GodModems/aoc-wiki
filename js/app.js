(function () {
  const elNav = document.getElementById("nav");
  const elContent = document.getElementById("content");
  const elCrumbs = document.getElementById("crumbs");
  const elTocWrap = document.getElementById("tocWrap");
  const elToc = document.getElementById("toc");
  const btnTheme = document.getElementById("btnTheme");
  const btnSidebar = document.getElementById("btnSidebar");
  const sidebar = document.getElementById("sidebar");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");


  // Theme
  const savedTheme = localStorage.getItem("wikiTheme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
  btnTheme.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("wikiTheme", next);
  });

  // Sidebar (mobile)
  btnSidebar.addEventListener("click", () => sidebar.classList.toggle("open"));
  window.addEventListener("hashchange", () => sidebar.classList.remove("open"));

  // Flatten nav for routing + search
  const NAV = window.WIKI_NAV || [];
  const PAGES = NAV.flatMap(s => s.items.map(it => ({ ...it, section: s.section })));

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function sanitizeUrl(u) {
    const url = String(u || "").trim();
    if (/^javascript:/i.test(url)) return "#";
    return url;
  }

  function slugify(s) {
    return s.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function renderInline(s) {
    // images ![alt](url)
    // supports optional fragments:
    //   ...png#icon  => adds class md-img--icon and strips fragment from src
    //   ...png#card  => adds class md-img--card and strips fragment from src
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, urlRaw) => {
      const raw = String(urlRaw || "").trim();
      const [srcPart, frag] = raw.split("#");
      const src = sanitizeUrl(srcPart);
      const safeAlt = escapeAttr(alt || "");

      let cls = "md-img";
      if ((frag || "").toLowerCase() === "icon") cls += " md-img--icon";
      if ((frag || "").toLowerCase() === "card") cls += " md-img--card";

      return `<img class="${cls}" src="${escapeAttr(src)}" alt="${safeAlt}" loading="lazy" decoding="async">`;
    });

    // code
    s = s.replace(/`([^`]+)`/g, (_, a) => `<code>${escapeHtml(a)}</code>`);

    // bold
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // italics (simple)
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // links [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safeText = escapeHtml(text);
      const safeUrl = escapeAttr(sanitizeUrl(url));
      return `<a href="${safeUrl}">${safeText}</a>`;
    });

    return s;
  }


  function renderMarkdown(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let inCode = false;
    let codeLang = "";
    let inUl = false;
    let inOl = false;

    function closeLists() {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (inOl) { html += "</ol>"; inOl = false; }
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trimEnd();

      // Code fences
      const fence = line.match(/^```(\w+)?\s*$/);
      if (fence) {
        if (!inCode) {
          closeLists();
          inCode = true;
          codeLang = fence[1] || "";
          html += `<pre><code data-lang="${escapeHtml(codeLang)}">`;
        } else {
          inCode = false;
          html += "</code></pre>";
        }
        continue;
      }
      if (inCode) {
        html += escapeHtml(raw) + "\n";
        continue;
      }

      // Raw HTML passthrough (for grids/cards authored in MD)
      // Skips a few dangerous tags.
      const t = line.trim();
      if (t.startsWith("<") && t.endsWith(">")) {
        if (/^<\s*\/?\s*(script|iframe|object|embed)\b/i.test(t)) {
          continue;
        }
        closeLists();
        html += raw + "\n";
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        closeLists();
        html += "<hr />";
        continue;
      }

      // Headings
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        closeLists();
        const level = h[1].length;
        const text = h[2].trim();
        const id = slugify(text);
        html += `<h${level} id="${id}">${renderInline(escapeHtml(text))}</h${level}>`;
        continue;
      }

      // Lists
      const ul = line.match(/^[-*+]\s+(.*)$/);
      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ul) {
        if (!inUl) { closeLists(); html += "<ul>"; inUl = true; }
        html += `<li>${renderInline(escapeHtml(ul[1]))}</li>`;
        continue;
      }
      if (ol) {
        if (!inOl) { closeLists(); html += "<ol>"; inOl = true; }
        html += `<li>${renderInline(escapeHtml(ol[1]))}</li>`;
        continue;
      }

      // Blank line
      if (line.trim() === "") {
        closeLists();
        continue;
      }

      // Paragraph
      closeLists();
      html += `<p>${renderInline(escapeHtml(line.trim()))}</p>`;
    }

    // Close anything left open
    if (inCode) html += "</code></pre>";
    if (inUl) html += "</ul>";
    if (inOl) html += "</ol>";

    return html;
  }

function hrefToWikiPath(href) {
  // Accept "#/pieces/pawn" and "#/rules/special#manifest-destiny"
  // Return "pieces/pawn" or "rules/special" (base page path only)
  if (!href) return null;
  const s = String(href).trim();
  if (!s.startsWith("#/")) return null;

  // strip leading "#/"
  const rest = s.slice(2);

  // base path ends at next "#", or "?", or end
  const cutHash = rest.indexOf("#");
  const cutQ = rest.indexOf("?");
  let end = rest.length;
  if (cutHash !== -1) end = Math.min(end, cutHash);
  if (cutQ !== -1) end = Math.min(end, cutQ);

  const path = rest.slice(0, end).replace(/\/+$/, "");
  return path || null;
}

function applyHeadingPaddingToBlocks() {
  const kids = Array.from(elContent.children);
  let curPad = "0px";

  for (const el of kids) {
    const tag = el.tagName;

    // When we hit a heading, update current padding from CSS
    if (/^H[1-6]$/.test(tag)) {
      curPad = getComputedStyle(el).paddingLeft || "0px";
      continue;
    }

    // Skip things you never want indented
    if (tag === "IMG") continue;
    if (el.hasAttribute && el.hasAttribute("data-noindent")) continue;

    // Apply to paragraphs (and common “text blocks” if desired)
    const isIndentedBlock =
      tag === "P" ||
      tag === "UL" ||
      tag === "OL" ||
      tag === "PRE" ||
      tag === "BLOCKQUOTE" ||
      el.classList?.contains("aoc-board");

    if (!isIndentedBlock) continue;

        // Paragraphs: heading indent + 1em
    if (tag === "P") {
      el.style.paddingLeft = `calc(${curPad} + 1em)`;
      continue;
    }

    // Lists: paragraph indent + 1em (=> heading + 2em)
    if (tag === "UL" || tag === "OL") {
      el.style.paddingLeft = `calc(${curPad} + 3em)`;
      el.style.marginLeft = "0";
      continue;
    }

    // Other common blocks: follow paragraph behavior (heading + 1em)
    if (tag === "PRE" || tag === "BLOCKQUOTE" ) {
      el.style.paddingLeft = `calc(${curPad} + 1em)`;
      continue;
    }
  }
}


function titleForWikiPath(path) {
  const p = PAGES.find(x => x.path === path);
  if (p && p.title) return p.title;

  // Fallback: last segment -> Title Case
  const slug = (path.split("/").pop() || path).trim();
  return slug
    .split("-")
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

  function buildToc(currentPath) {
    elToc.innerHTML = "";

    const links = Array.from(elContent.querySelectorAll('a[href^="#/"]'));
    const seen = new Set();
    const tocItems = [];

    for (const a of links) {
      const href = a.getAttribute("href") || "";
      const path = hrefToWikiPath(href);
      if (!path) continue;

      // optional: don’t include link to the page you're already on
      if (currentPath && path === currentPath) continue;

      if (seen.has(path)) continue;
      seen.add(path);

      tocItems.push({
        href,                 // keep the FIRST href we saw for that page
        title: titleForWikiPath(path),
      });
    }

    if (!tocItems.length) {
      elTocWrap.style.display = "none";
      return;
    }

    elTocWrap.style.display = "";

    for (const it of tocItems) {
      const a = document.createElement("a");
      a.href = it.href;
      a.textContent = it.title;
      elToc.appendChild(a);
    }
  }



  function getSectionLandingPath(sectionName) {
    const sec = NAV.find(s => s.section === sectionName);
    if (!sec || !sec.items || !sec.items.length) return null;

    const idx =
      sec.items.find(it => it.isIndex) ||
      sec.items.find(it => (it.path || "").toLowerCase().endsWith("/index")) ||
      sec.items.find(it => (it.title || "").toLowerCase().includes("index")) ||
      sec.items.find(it => (it.tags || []).includes("index")) ||
      sec.items[0];

    return idx?.path || null;
  }

  function sectionStorageKey(sectionName) {
    return "navCollapsed::" + sectionName;
  }

  function isSectionCollapsed(sectionName, defaultCollapsed) {
    const raw = localStorage.getItem(sectionStorageKey(sectionName));
    if (raw === "1") return true;
    if (raw === "0") return false;
    return !!defaultCollapsed;
  }

  function setSectionCollapsed(sectionName, collapsed) {
    localStorage.setItem(sectionStorageKey(sectionName), collapsed ? "1" : "0");
  }

  function sortItemsAlpha(items) {
    return [...items].sort((a, b) =>
      (a.title || "").localeCompare((b.title || ""), undefined, { sensitivity: "base" })
    );
  }

  function iconForNavItem(it) {
    if (it.icon) return it.icon;

    const path = (it.path || "").toLowerCase();
    const slug = path.split("/").pop();

    if (path.startsWith("pieces/")) {
      return `assets/pieces/w/${slug}.svg`;
    }
    if (path.startsWith("civilizations/") && slug !== "index") {
      return `assets/emblems/new/${slug}.png`;
    }
    if (path.startsWith("research/") && slug !== "index") {
      return `assets/research/icons/${slug}.svg`;
    }
    return null;
  }

  function makeNavIcon(title, iconSrc) {
    const iconWrap = document.createElement("span");
    iconWrap.className = "nav__icon";

    const fallback = document.createElement("span");
    fallback.className = "nav__iconFallback";
    fallback.textContent = (title || "?").trim().slice(0, 1).toUpperCase();

    if (!iconSrc) {
      iconWrap.appendChild(fallback);
      return iconWrap;
    }

    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.src = iconSrc;

    img.onerror = () => {
      img.remove();
      iconWrap.appendChild(fallback);
    };

    iconWrap.appendChild(img);
    return iconWrap;
  }

  // Build sidebar nav (single panel, collapsible sections, alphabetical items, icons, no pills)
  function buildNav(activePath) {
    elNav.innerHTML = "";

    for (const sec of NAV) {
      const wrap = document.createElement("div");
      wrap.className = "nav__section";

      const header = document.createElement("div");
      header.className = "nav__header";

      const landing = getSectionLandingPath(sec.section);
      const hasActive = sec.items.some(it => it.path === activePath);

      const collapsed = isSectionCollapsed(sec.section, !hasActive);
      if (hasActive && collapsed) setSectionCollapsed(sec.section, false);

      // Section title (clickable)
      if (landing) {
        const a = document.createElement("a");
        a.className = "nav__title";
        a.href = "#/" + landing;
        a.textContent = sec.section;
        a.style.display = "block";
        a.style.textDecoration = "none";
        header.appendChild(a);
      } else {
        const t = document.createElement("div");
        t.className = "nav__title";
        t.textContent = sec.section;
        header.appendChild(t);
      }

      // Toggle button
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav__toggle";
      btn.setAttribute("aria-label", `Toggle ${sec.section}`);
      btn.setAttribute("aria-expanded", String(!collapsed));
      btn.textContent = collapsed ? "▸" : "▾";
      header.appendChild(btn);

      wrap.appendChild(header);

      // Items container
      const itemsWrap = document.createElement("div");
      itemsWrap.className = "nav__items";
      itemsWrap.style.display = collapsed ? "none" : "";

      const items = (sec.section === "Getting Started")
        ? sec.items
        : sortItemsAlpha(sec.items);

      const useIcons = (sec.section !== "Getting Started");

      for (const it of items) {
        if (it.hidden) continue;

        const a = document.createElement("a");
        a.className = "nav__link" + (it.path === activePath ? " active" : "");
        a.href = "#/" + it.path;

        if (useIcons) {
          const iconSrc = iconForNavItem(it);
          a.appendChild(makeNavIcon(it.title, iconSrc));
        }

        const spanTitle = document.createElement("span");
        spanTitle.textContent = it.title;
        a.appendChild(spanTitle);

        itemsWrap.appendChild(a);
      }


      wrap.appendChild(itemsWrap);

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isHidden = itemsWrap.style.display === "none";
        itemsWrap.style.display = isHidden ? "" : "none";
        btn.textContent = isHidden ? "▾" : "▸";
        btn.setAttribute("aria-expanded", String(isHidden));
        setSectionCollapsed(sec.section, !isHidden);
      });

      elNav.appendChild(wrap);
    }
  }

  function setCrumbs(page) {
    const sectionLanding = getSectionLandingPath(page.section);
    const isSectionLanding = !!sectionLanding && page.path === sectionLanding;

    const crumbs = [{ title: "Wiki", href: "#/welcome" }];

    if (isSectionLanding) {
      crumbs.push({ title: page.section, href: null });
    } else {
      crumbs.push({ title: page.section, href: sectionLanding ? "#/" + sectionLanding : null });
      crumbs.push({ title: page.title, href: "#/" + page.path });
    }

    elCrumbs.innerHTML = "";
    crumbs.forEach((c, idx) => {
      if (idx > 0) {
        const sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "›";
        elCrumbs.appendChild(sep);
      }
      if (c.href) {
        const a = document.createElement("a");
        a.href = c.href;
        a.textContent = c.title;
        elCrumbs.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.textContent = c.title;
        elCrumbs.appendChild(span);
      }
    });
  }

  // ===== ```board blocks -> grid diagrams =====
  function enhanceBoardBlocks() {
    const blocks = elContent.querySelectorAll('pre > code[data-lang="board"]');
    if (!blocks.length) return;

    const colorMap = {
      c: "var(--boardCyan)",
      g: "var(--boardGreen)",
      r: "var(--boardRed)",
      o: "var(--boardOrange)",
      y: "var(--boardYellow)",
      p: "var(--boardPink)",
      l: "var(--boardLight)",
      d: "var(--boardDark)",
    };

    function pieceAsset(side, piece) {
      return `assets/pieces/${side}/${piece}.svg`;
    }

    // Token formats:
    //  - "." or "-" => empty
    //  - "w:pawn" / "b:queen"
    //  - "y(w:pawn)" => yellow square containing white pawn
    //  - "c(.)" => cyan square empty
    function parseCell(tok) {
      let colorKey = null;
      let inner = tok;

      const m = tok.match(/^([a-z])\((.*)\)$/i);
      if (m) {
        colorKey = m[1].toLowerCase();
        inner = (m[2] || "").trim();
      }

      if (inner === "." || inner === "-" || inner === "") {
        return { colorKey, side: null, piece: null, text: null };
      }

      const pm = inner.match(/^([wb]):([a-z0-9-]+)$/i);
      if (pm) {
        return { colorKey, side: pm[1].toLowerCase(), piece: pm[2].toLowerCase(), text: null };
      }

      return { colorKey, side: null, piece: null, text: inner };
    }

    for (const code of blocks) {
      const raw = code.textContent.replace(/\r\n/g, "\n");
      const lines = raw.split("\n")
        .map(s => s.trim())
        .filter(s => s.length && !s.startsWith("#"));

      if (!lines.length) continue;

      const rows = lines.map(line => line.split(/\s+/).filter(Boolean));
      const cols = Math.max(...rows.map(r => r.length));

      const board = document.createElement("div");
      board.className = "aoc-board";
      board.style.gridTemplateColumns = `repeat(${cols}, var(--boardCell))`;

      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols; c++) {
          const tok = rows[r][c] ?? ".";
          const cellData = parseCell(tok);

          const cell = document.createElement("div");
          cell.className = "aoc-cell";

          const checker = ((r + c) % 2 === 0) ? "var(--boardLight)" : "var(--boardDark)";
          cell.style.background = cellData.colorKey ? (colorMap[cellData.colorKey] || checker) : checker;

          if (cellData.side && cellData.piece) {
            const pieceSlug = cellData.piece;

            const displayName = pieceSlug
              .split("-")
              .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
              .join(" ");

            const link = document.createElement("a");
            link.href = `#/pieces/${pieceSlug}`;
            link.title = displayName;
            link.setAttribute("aria-label", displayName);

            const img = document.createElement("img");
            img.alt = displayName;
            img.src = pieceAsset(cellData.side, pieceSlug);
            img.title = displayName;

            link.appendChild(img);
            cell.appendChild(link);
          } else if (cellData.text) {
            const span = document.createElement("span");
            span.textContent = cellData.text;
            span.style.fontFamily = "var(--mono)";
            span.style.fontSize = "12px";
            span.style.color = "var(--muted)";
            cell.appendChild(span);
          }

          board.appendChild(cell);
        }
      }

      const pre = code.closest("pre");
      if (pre) pre.replaceWith(board);
    }
  }

  function getRoutePath() {
    const h = (location.hash || "#/welcome").replace(/^#\/?/, "");
    const pathOnly = h.split("#")[0];
    return pathOnly.length ? pathOnly : "welcome";
  }


  async function loadPage(path) {
    const page =
      PAGES.find(p => p.path === path) ||
      PAGES.find(p => p.path === "welcome") ||
      { title: "Welcome", path: "welcome", section: "Getting Started" };

    buildNav(page.path);
    setCrumbs(page);

    const url = `content/${page.path}.md`;
    let md = "";
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      md = await res.text();
    } catch (e) {
      md = `# Not found\n\nCould not load:\n\n\`${url}\`\n\n- Ensure the file exists.\n- Ensure the path in \`js/nav.js\` matches the file.\n`;
    }

    const html = renderMarkdown(md);
    elContent.innerHTML = html;

    enhanceBoardBlocks();
    applyHeadingPaddingToBlocks();
    enhanceEmoteGrid();

    const title = (elContent.querySelector("h1")?.textContent || page.title).trim();
    document.title = `${title} • Age of Chesspires Wiki`;

    buildToc(page.path);
;
  }

  // Search (titles + tags)
  function showSearchResults(items) {
    if (!items.length) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }
    searchResults.hidden = false;
    searchResults.innerHTML = items.slice(0, 10).map(it => {
      const meta = it.section;
      return `<a class="search__item" href="#/${it.path}">
        <div class="t">${escapeHtml(it.title)}</div>
        <div class="m">${escapeHtml(meta)}</div>
      </a>`;
    }).join("");
  }

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return showSearchResults([]);

    const hits = PAGES
      .filter(p => {
        if (p.hidden) return false;
        const hay = (p.title + " " + (p.tags || []).join(" ") + " " + p.section).toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.title || "").localeCompare((b.title || ""), undefined, { sensitivity: "base" }));

    showSearchResults(hits);
  });

  document.addEventListener("click", (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) showSearchResults([]);
  });

  // Initial load + route changes
  window.addEventListener("hashchange", () => loadPage(getRoutePath()));
  loadPage(getRoutePath());

  function titleCaseFromFilename(file) {
  const base = String(file).split("/").pop().replace(/\.[^.]+$/, "");
  return base
    .replace(/[_-]+/g, " ")
    .trim()
    .split(" ")
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function ensureEmoteModal() {
  let modal = document.getElementById("emoteModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "emoteModal";
  modal.className = "emote-modal";
  modal.innerHTML = `
    <div class="emote-modal__card" role="dialog" aria-modal="true">
      <button class="emote-modal__close" type="button" aria-label="Close">Close</button>

      <button class="emote-modal__nav emote-modal__prev" type="button" aria-label="Previous emote">‹</button>
      <button class="emote-modal__nav emote-modal__next" type="button" aria-label="Next emote">›</button>

      <div class="emote-modal__title" id="emoteModalTitle"></div>
      <img class="emote-modal__img" id="emoteModalImg" alt="">
    </div>
  `;


  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".emote-modal__close");
  const card = modal.querySelector(".emote-modal__card");

  function close() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    const img = modal.querySelector("#emoteModalImg");
    // Reset src so GIF restarts next open
    img.src = "";
  }

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (!card.contains(e.target)) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });

  modal._close = close;
  return modal;
}

async function enhanceEmoteGrid() {
  const grid = elContent.querySelector("[data-emote-grid]");
  if (!grid) return;

  const searchBox = elContent.querySelector("[data-emote-search]");
  if (searchBox) searchBox.value = "";

  grid.innerHTML = `<p style="color: var(--muted);">Loading emotes…</p>`;

  let emotes = [];
  try {
    const res = await fetch("assets/emotes/manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      // backwards compatibility: ["a.gif", ...]
      emotes = data
        .filter(f => typeof f === "string" && f.toLowerCase().endsWith(".gif"))
        .map(f => ({ file: f, name: titleCaseFromFilename(f), tags: [] }));
    } else {
      const list = (data && Array.isArray(data.emotes)) ? data.emotes : [];
      emotes = list
        .filter(e => e && typeof e.file === "string" && e.file.toLowerCase().endsWith(".gif"))
        .map(e => ({
          file: e.file,
          name: (e.name && String(e.name).trim()) ? String(e.name).trim() : titleCaseFromFilename(e.file),
          tags: Array.isArray(e.tags) ? e.tags.map(t => String(t).trim()).filter(Boolean) : []
        }));
    }
  } catch (e) {
    grid.innerHTML = `<p style="color: var(--muted);">Could not load emotes. Ensure <code>assets/emotes/manifest.json</code> exists.</p>`;
    return;
  }

  // default sort by name
  emotes.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const modal = ensureEmoteModal();
  const modalTitle = modal.querySelector("#emoteModalTitle");
  const modalImg = modal.querySelector("#emoteModalImg");
  const btnPrev = modal.querySelector(".emote-modal__prev");
  const btnNext = modal.querySelector(".emote-modal__next");

  let visible = emotes.slice();   // filtered view
  let currentIndex = -1;          // index within visible

  function renderGrid(list) {
    grid.innerHTML = "";
    list.forEach((e, idx) => {
      const src = `assets/emotes/${e.file}`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emote-tile";
      btn.title = e.name;
      btn.setAttribute("aria-label", e.name);
      btn.dataset.idx = String(idx);

      const img = document.createElement("img");
      img.src = src;
      img.alt = e.name;
      img.loading = "lazy";
      img.decoding = "async";

      btn.appendChild(img);
      grid.appendChild(btn);
    });
  }

  function openAt(idx) {
    if (!visible.length) return;
    currentIndex = (idx + visible.length) % visible.length;

    const e = visible[currentIndex];
    const src = `assets/emotes/${e.file}`;

    modalTitle.textContent = e.name;
    modalImg.alt = e.name;

    modalImg.src = "";
    modalImg.src = src;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  btnPrev.addEventListener("click", () => openAt(currentIndex - 1));
  btnNext.addEventListener("click", () => openAt(currentIndex + 1));

  window.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "ArrowLeft") openAt(currentIndex - 1);
    if (e.key === "ArrowRight") openAt(currentIndex + 1);
  });

  renderGrid(visible);

  grid.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button.emote-tile");
    if (!btn) return;
    openAt(parseInt(btn.dataset.idx, 10));
  });

  if (searchBox) {
    searchBox.addEventListener("input", () => {
      const q = searchBox.value.trim().toLowerCase();

      visible = !q
        ? emotes.slice()
        : emotes.filter(e => {
            const hay = (e.name + " " + (e.tags || []).join(" ")).toLowerCase();
            return hay.includes(q);
          });

      // keep name sort
      visible.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

      currentIndex = -1;
      renderGrid(visible);
    });
  }
}



})();
