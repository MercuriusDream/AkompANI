/**
 * Voyager Settings — localStorage-based settings management
 */
(function () {
  // localStorage key map
  const KEYS = {
    githubPat: 'voyager_github_pat',
    cfApiToken: 'voyager_cf_api_token',
    cfAccountId: 'voyager_cf_account_id',
    openaiKey: 'voyager_openai_key',
    serverApiKey: 'voyager_server_api_key',
  };
  const SESSION_SECRET_KEYS = new Set([
    'githubPat',
    'cfApiToken',
    'openaiKey',
    'serverApiKey',
  ]);

  function readValue(id) {
    var key = KEYS[id];
    if (!key) return '';
    try {
      if (SESSION_SECRET_KEYS.has(id)) {
        return sessionStorage.getItem(key) || '';
      }
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  function writeValue(id, val) {
    var key = KEYS[id];
    if (!key) return;
    var clean = String(val || '').trim();
    try {
      if (!clean) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
        return;
      }
      if (SESSION_SECRET_KEYS.has(id)) {
        sessionStorage.setItem(key, clean);
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, clean);
    } catch {
      // Ignore storage failures.
    }
  }

  // DOM refs
  const els = {
    githubPat: document.getElementById('githubPat'),
    cfApiToken: document.getElementById('cfApiToken'),
    cfAccountId: document.getElementById('cfAccountId'),
    openaiKey: document.getElementById('openaiKey'),
    serverApiKey: document.getElementById('serverApiKey'),
    githubStatus: document.getElementById('githubStatus'),
    cfStatus: document.getElementById('cfStatus'),
    testGithub: document.getElementById('testGithub'),
    testCf: document.getElementById('testCf'),
    themePicker: document.getElementById('themePicker'),
    clearSettings: document.getElementById('clearSettings'),
  };

  function getServerApiKey() {
    return String(readValue('serverApiKey') || '').trim();
  }

  function withServerAuthHeaders(url, headers) {
    var merged = new Headers(headers || {});
    if (!String(url || '').startsWith('/api/')) return merged;

    var apiKey = getServerApiKey();
    if (!apiKey) return merged;

    merged.set('Authorization', 'Bearer ' + apiKey);
    merged.set('x-api-key', apiKey);
    return merged;
  }

  // ─── Load saved values ───────────────────────────
  function load() {
    Object.entries(KEYS).forEach(function (entry) {
      var id = entry[0], key = entry[1];
      var el = els[id];
      if (el) el.value = readValue(id);
    });
    updateStatuses();
    updateThemePicker();
  }

  // ─── Auto-save on input (debounced) ──────────────
  var timers = {};
  function autoSave(id) {
    var el = els[id];
    if (!el) return;
    el.addEventListener('input', function () {
      clearTimeout(timers[id]);
      timers[id] = setTimeout(function () {
        var val = el.value.trim();
        writeValue(id, val);
        updateStatuses();
      }, 400);
    });
  }

  Object.keys(KEYS).forEach(autoSave);

  // ─── Connection status indicators ────────────────
  function updateStatuses() {
    var hasGh = !!readValue('githubPat');
    var hasCf = !!(readValue('cfApiToken') && readValue('cfAccountId'));

    setStatus(els.githubStatus, hasGh);
    setStatus(els.cfStatus, hasCf);
  }

  function setStatus(statusEl, connected) {
    if (!statusEl) return;
    var dot = statusEl.querySelector('.connection-dot');
    var label = statusEl.querySelector('.status-label');
    if (connected) {
      statusEl.classList.add('connected');
      if (dot) dot.classList.add('connected');
      if (label) label.textContent = 'Connected';
    } else {
      statusEl.classList.remove('connected');
      if (dot) dot.classList.remove('connected');
      if (label) label.textContent = 'Not connected';
    }
  }

  // ─── Reveal / hide password fields ───────────────
  document.querySelectorAll('.reveal-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var input = document.getElementById(targetId);
      if (!input) return;
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      var eyeOpen = btn.querySelector('.eye-open');
      var eyeClosed = btn.querySelector('.eye-closed');
      if (eyeOpen) eyeOpen.style.display = isPassword ? 'none' : '';
      if (eyeClosed) eyeClosed.style.display = isPassword ? '' : 'none';
    });
  });

  // ─── Test GitHub connection ──────────────────────
  if (els.testGithub) {
    els.testGithub.addEventListener('click', function () {
      var pat = (els.githubPat && els.githubPat.value.trim()) || '';
      if (!pat) {
        VoyagerToast.warning({ title: 'Missing token', message: 'Enter a GitHub Personal Access Token first.' });
        return;
      }
      els.testGithub.disabled = true;
      els.testGithub.textContent = 'Testing...';

      fetch('https://api.github.com/user', {
        headers: {
          Authorization: 'Bearer ' + pat,
          Accept: 'application/vnd.github+json',
        },
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data.login) {
            VoyagerToast.success({ title: 'GitHub connected', message: 'Authenticated as ' + res.data.login });
            writeValue('githubPat', pat);
            updateStatuses();
          } else {
            VoyagerToast.error({ title: 'GitHub failed', message: res.data.message || 'Invalid token' });
          }
        })
        .catch(function () {
          VoyagerToast.error({ title: 'Network error', message: 'Could not reach GitHub API.' });
        })
        .finally(function () {
          els.testGithub.disabled = false;
          els.testGithub.textContent = 'Test Connection';
        });
    });
  }

  // ─── Test Cloudflare connection ──────────────────
  if (els.testCf) {
    els.testCf.addEventListener('click', function () {
      var token = (els.cfApiToken && els.cfApiToken.value.trim()) || '';
      var accountId = (els.cfAccountId && els.cfAccountId.value.trim()) || '';
      if (!token) {
        VoyagerToast.warning({ title: 'Missing token', message: 'Enter a Cloudflare API Token first.' });
        return;
      }
      els.testCf.disabled = true;
      els.testCf.textContent = 'Testing...';

      fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data && res.data.success) {
            writeValue('cfApiToken', token);
            if (accountId) {
              writeValue('cfAccountId', accountId);
              VoyagerToast.success({ title: 'Cloudflare connected', message: 'API token is valid.' });
            } else {
              VoyagerToast.warning({ title: 'Token valid', message: 'Add your Account ID to enable deployments.' });
            }
            updateStatuses();
          } else {
            var firstError = res.data && Array.isArray(res.data.errors) && res.data.errors[0] ? res.data.errors[0].message : '';
            VoyagerToast.error({ title: 'Cloudflare failed', message: firstError || 'Invalid token' });
          }
        })
        .catch(function () {
          VoyagerToast.error({ title: 'Network error', message: 'Could not reach Cloudflare API.' });
        })
        .finally(function () {
          els.testCf.disabled = false;
          els.testCf.textContent = 'Test Connection';
        });
    });
  }

  // ─── Theme picker ────────────────────────────────
  function updateThemePicker() {
    if (!els.themePicker) return;
    var stored = localStorage.getItem('voyager-theme');
    var current = stored || 'system';
    els.themePicker.querySelectorAll('.theme-option').forEach(function (opt) {
      opt.classList.toggle('active', opt.getAttribute('data-theme') === current);
    });
  }

  if (els.themePicker) {
    els.themePicker.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-option');
      if (!btn) return;
      var theme = btn.getAttribute('data-theme');
      var root = document.documentElement;
      root.classList.add('theme-transition');

      if (theme === 'system') {
        localStorage.removeItem('voyager-theme');
        var sys = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
        root.setAttribute('data-theme', sys);
      } else {
        localStorage.setItem('voyager-theme', theme);
        root.setAttribute('data-theme', theme);
      }

      updateThemePicker();
      setTimeout(function () { root.classList.remove('theme-transition'); }, 400);
    });
  }

  // ─── Clear all settings ──────────────────────────
  if (els.clearSettings) {
    els.clearSettings.addEventListener('click', function () {
      if (!confirm('Clear all Voyager settings? This removes stored API keys and preferences.')) return;
      Object.values(KEYS).forEach(function (k) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      localStorage.removeItem('voyager-theme');
      localStorage.removeItem('voyager_editor_mode');
      localStorage.removeItem('voyager_right_collapsed');

      // Reset form
      Object.keys(KEYS).forEach(function (id) {
        if (els[id]) els[id].value = '';
      });
      updateStatuses();

      // Reset theme to system default
      var sys = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', sys);
      updateThemePicker();

      VoyagerToast.info({ title: 'Cleared', message: 'All settings have been removed.' });
    });
  }

  // ─── Init ────────────────────────────────────────
  load();
})();
