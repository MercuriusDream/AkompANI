/**
 * Akompani Auth UI — injects auth indicators into nav.
 * Include on every page: <script src="/auth-ui.js"></script>
 */
(function () {
  const navActions = document.querySelector(".nav-actions");
  if (!navActions) return;
  const indicatorId = "akompani-auth-nav-indicator";

  function hasSessionToken(key) {
    try {
      return !!sessionStorage.getItem(key);
    } catch {
      return false;
    }
  }

  function ensureIndicator() {
    let indicator = document.getElementById(indicatorId);
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = indicatorId;
      indicator.className = "nav-user";
    }
    return indicator;
  }

  function renderIndicator() {
    const hasGithub = hasSessionToken("akompani_oauth_github_token");
    const hasCf = hasSessionToken("akompani_oauth_cloudflare_token");
    const dots = [];

    if (hasGithub) {
      dots.push('<span class="connection-dot connected" title="GitHub connected" style="width:6px;height:6px"></span>');
    }
    if (hasCf) {
      dots.push('<span class="connection-dot connected" title="Cloudflare connected" style="width:6px;height:6px"></span>');
    }

    const existing = document.getElementById(indicatorId);
    if (!dots.length) {
      if (existing) existing.remove();
      return;
    }

    const indicator = existing || ensureIndicator();
    indicator.innerHTML = `<div style="display:flex;gap:3px;align-items:center">${dots.join("")}</div>`;

    const themeToggle = navActions.querySelector("#themeToggle");
    navActions.insertBefore(indicator, themeToggle || null);
  }

  window.addEventListener("storage", renderIndicator);
  window.addEventListener("akompani-auth-change", renderIndicator);
  window.addEventListener("focus", renderIndicator);
  renderIndicator();
})();
