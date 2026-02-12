/**
 * Akompani Toast Notification System
 * Usage: AkompaniToast.show({ title, message, type, duration })
 *   or:  AkompaniToast.success('Title', 'Message')
 *   or:  AkompaniToast.success({ title: 'Title', message: 'Message' })
 */
const AkompaniToast = (() => {
  let container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
  }

  const ICONS = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  function esc(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function dismiss(el) {
    if (el._dismissed) return;
    el._dismissed = true;
    el.classList.add('toast-exit');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
  }

  /**
   * Show a toast notification
   * @param {Object} opts
   * @param {string} opts.title - Bold title text
   * @param {string} [opts.message] - Optional description text
   * @param {'success'|'error'|'warning'|'info'} [opts.type='info'] - Toast variant
   * @param {number} [opts.duration=4000] - Auto-dismiss in ms (0 = sticky)
   * @returns {HTMLElement} The toast element
   */
  function show({ title, message = '', type = 'info', duration = 4000 } = {}) {
    const wrap = ensureContainer();
    const safeType = /^(success|error|warning|info)$/.test(type) ? type : 'info';
    const el = document.createElement('div');
    el.className = `toast toast--${safeType}`;
    el.innerHTML = `
      <span class="toast-icon">${ICONS[safeType] || ICONS.info}</span>
      <div class="toast-body">
        <div class="toast-title">${esc(title)}</div>
        ${message ? `<div class="toast-message">${esc(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    el.querySelector('.toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss(el);
    });
    el.addEventListener('click', () => dismiss(el));

    wrap.appendChild(el);

    if (duration > 0) {
      setTimeout(() => dismiss(el), duration);
    }

    // Cap at 5 visible toasts — remove oldest immediately to avoid infinite loop
    while (wrap.children.length > 5) {
      wrap.children[0].remove();
    }

    return el;
  }

  // Shorthand methods accept either (title, message) or ({ title, message })
  function _shorthand(type, durOverride) {
    return function (titleOrOpts, message) {
      if (typeof titleOrOpts === 'object' && titleOrOpts !== null) {
        return show({ type, duration: durOverride, ...titleOrOpts });
      }
      return show({ title: titleOrOpts, message, type, duration: durOverride });
    };
  }

  return {
    show,
    success: _shorthand('success'),
    error: _shorthand('error', 6000),
    warning: _shorthand('warning'),
    info: _shorthand('info'),
  };
})();
