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

  // Scroll reveal — same pattern as landing page
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    reveals.forEach((el) => revealObserver.observe(el));
  }

  const readerEl = document.getElementById("docContent");
  const docTitleEl = document.getElementById("docTitle");
  const docMetaEl = document.getElementById("docMeta");
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

  function formatDocLabel(path) {
    return String(path || "README.md")
      .split("/")
      .pop()
      .replace(/\.md$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b[a-z]/g, (char) => char.toUpperCase());
  }

  const fallbackDocLabel = formatDocLabel(docPath);

  if (docTitleEl) docTitleEl.textContent = fallbackDocLabel;
  if (docMetaEl) docMetaEl.textContent = docPath;

  function setError(message) {
    readerEl.textContent = "";
    const p = document.createElement("p");
    p.className = "doc-error";
    p.textContent = String(message || "Unknown docs error.");
    readerEl.appendChild(p);
    if (docTitleEl) docTitleEl.textContent = "Document unavailable";
    if (docMetaEl) docMetaEl.textContent = String(message || "Unknown docs error.");
  }

  function setPlainMarkdown(markdown) {
    readerEl.textContent = "";
    const pre = document.createElement("pre");
    pre.textContent = String(markdown || "");
    readerEl.appendChild(pre);
  }

  function sanitizeRenderedHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    const decodeContainer = document.createElement("textarea");

    const decodeEntities = (value) => {
      decodeContainer.innerHTML = String(value || "");
      return decodeContainer.value;
    };

    const hasDangerousProtocol = (value) => {
      const normalized = decodeEntities(value).replace(/[\u0000-\u001F\u007F\s]+/g, "").toLowerCase();
      return normalized.startsWith("javascript:") || normalized.startsWith("data:");
    };

    template.content
      .querySelectorAll("script, iframe, object, embed, form, meta, link, base, style")
      .forEach((node) => node.remove());

    for (const el of template.content.querySelectorAll("*")) {
      for (const attr of Array.from(el.attributes)) {
        const attrName = String(attr.name || "");
        const lowered = attrName.toLowerCase();

        if (lowered.startsWith("on") || lowered === "srcdoc") {
          el.removeAttribute(attrName);
          continue;
        }

        if (lowered === "style") {
          const normalizedStyle = String(attr.value || "").replace(/\s+/g, "").toLowerCase();
          if (
            normalizedStyle.includes("expression(") ||
            normalizedStyle.includes("url(") ||
            normalizedStyle.includes("javascript:")
          ) {
            el.removeAttribute(attrName);
          }
          continue;
        }

        if (["href", "src", "action", "xlink:href", "formaction"].includes(lowered) && hasDangerousProtocol(attr.value)) {
          if (lowered === "href") {
            el.setAttribute("href", "#");
          } else {
            el.removeAttribute(attrName);
          }
        }
      }

      if (el.getAttribute("target") === "_blank") {
        el.setAttribute("rel", "noopener noreferrer");
      }
    }

    return template.innerHTML;
  }

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
        setPlainMarkdown(rewritten);
        if (docTitleEl) docTitleEl.textContent = fallbackDocLabel;
        if (docMetaEl) docMetaEl.textContent = docPath;
        document.title = `Akompani Docs · ${fallbackDocLabel}`;
        return;
      }
      const parsed = window.marked.parse(rewritten);
      readerEl.innerHTML = sanitizeRenderedHtml(parsed);
      const renderedH1 = readerEl.querySelector("h1");
      const resolvedDocTitle = String((renderedH1 && renderedH1.textContent) || fallbackDocLabel).trim();
      if (docTitleEl) docTitleEl.textContent = resolvedDocTitle;
      if (docMetaEl) docMetaEl.textContent = docPath;
      document.title = `Akompani Docs · ${resolvedDocTitle}`;
    })
    .catch((error) => {
      setError(String((error && error.message) || error));
    });
})();
