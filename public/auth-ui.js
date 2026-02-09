/**
 * CANARIA Auth UI — injects auth indicators into nav.
 * Include on every page: <script src="/auth-ui.js"></script>
 */
(function () {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  function hasSessionToken(key) {
    try {
      return !!sessionStorage.getItem(key);
    } catch {
      return false;
    }
  }

  const hasGithub = hasSessionToken('voyager_oauth_github_token');
  const hasCf = hasSessionToken('voyager_oauth_cloudflare_token');

  const indicator = document.createElement('div');
  indicator.className = 'nav-user';

  const dots = [];
  if (hasGithub || hasCf) {
    if (hasGithub) dots.push('<span class="connection-dot connected" title="GitHub connected" style="width:6px;height:6px"></span>');
    if (hasCf) dots.push('<span class="connection-dot connected" title="Cloudflare connected" style="width:6px;height:6px"></span>');
  }

  const dotsHtml = dots.length > 0
    ? `<div style="display:flex;gap:3px;align-items:center">${dots.join('')}</div>`
    : '';

  const themeToggle = navActions.querySelector('#themeToggle');
  if (dotsHtml) {
    indicator.innerHTML = dotsHtml;
    navActions.insertBefore(indicator, themeToggle);
  }
})();
