(function () {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("akompani-theme", next); } catch {}
    });
  }

  const readerEl = document.getElementById("docContent");
  if (!readerEl) return;

  const params = new URLSearchParams(window.location.search);
  const requested = String(params.get("doc") || "README.md").trim();

  const allowed = new Set([
    "README.md",
    "project-deep-dive.md",
    "frontier-oss-playbook.md",
    "design-guidelines.md",
    "release-process.md",
    "demo-videos.md",
    "tutorials/first-agent-5-minute.md",
  ]);

  const docPath = allowed.has(requested) ? requested : "README.md";
  const baseDir = docPath.includes("/") ? docPath.slice(0, docPath.lastIndexOf("/") + 1) : "";
  const docsContentRoot = new URL("../docs-content/", window.location.href);

  function resolveDocUrl(href) {
    const raw = String(href || "").trim();
    if (!raw) return raw;
    if (/^(https?:|mailto:|#)/i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;

    const resolved = new URL(raw, new URL(baseDir, docsContentRoot));

    if (/\.md$/i.test(resolved.pathname)) {
      const docsPrefix = docsContentRoot.pathname.endsWith("/")
        ? docsContentRoot.pathname
        : `${docsContentRoot.pathname}/`;
      const relativeDocPath = resolved.pathname.startsWith(docsPrefix)
        ? resolved.pathname.slice(docsPrefix.length)
        : resolved.pathname.replace(/^\/+/, "");
      const query = new URLSearchParams({ doc: relativeDocPath });
      return `./view.html?${query.toString()}${resolved.hash || ""}`;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }

  function rewriteMarkdownLinks(markdown) {
    return String(markdown || "").replace(/(!?\[[^\]]*\])\(([^)]+)\)/g, (full, label, href) => {
      const cleanHref = String(href || "").trim();
      const rewritten = resolveDocUrl(cleanHref);
      return `${label}(${rewritten})`;
    });
  }

  const docUrl = new URL(docPath, docsContentRoot);

  fetch(`${docUrl.pathname}${docUrl.search}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Unable to load ${docPath}`);
      return res.text();
    })
    .then((markdown) => {
      const rewritten = rewriteMarkdownLinks(markdown);
      if (!window.marked || typeof window.marked.parse !== "function") {
        readerEl.innerHTML = `<pre>${rewritten.replace(/[<>&]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]))}</pre>`;
        return;
      }
      readerEl.innerHTML = window.marked.parse(rewritten);
      document.title = `Akompani Docs · ${docPath.split("/").pop().replace(/\.md$/i, "")}`;
    })
    .catch((error) => {
      readerEl.innerHTML = `<p class="doc-error">${String(error && error.message || error)}</p>`;
    });
})();
