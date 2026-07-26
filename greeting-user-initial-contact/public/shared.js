(function () {
  const page = document.body.dataset.page || '';
  const partner = document.body.dataset.partner === 'true';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  function current(path) { return page === path ? ' aria-current="page"' : ''; }

  function renderShell() {
    if (document.body.dataset.shell === 'none') return;
    const userName = localStorage.getItem('userName');
    const accountLink = userName
      ? `<a href="search.html"${current('search')}>My trips</a><button type="button" data-signout>Sign out</button>`
      : `<a href="user-login.html"${current('login')}>Sign in</a>`;
    const partnerText = partner ? 'Passenger booking' : 'Transport Partner';
    const partnerHref = partner ? 'index.html' : 'company-login.html';
    const header = document.createElement('header');
    header.className = 'global-header';
    header.innerHTML = `<div class="header-inner"><a class="brand" href="index.html">GE<span>RAYO</span></a><button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button><nav class="site-nav" aria-label="Main navigation"><a href="index.html"${current('home')}>Home</a><a href="search.html"${current('search')}>Book a trip</a>${accountLink}<a href="${partnerHref}"${current('partner')}>${partnerText}</a></nav></div>`;
    document.body.prepend(header);
    const footer = document.createElement('footer');
    footer.className = 'compact-footer';
    footer.innerHTML = `<div class="footer-inner"><span>© ${new Date().getFullYear()} Gerayo MVP</span><div class="footer-links"><a href="search.html">Book a trip</a><a href="company-login.html">Transport Partner</a></div></div>`;
    document.body.append(footer);
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.site-nav');
    toggle.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Close' : 'Menu'; });
    header.querySelector('[data-signout]')?.addEventListener('click', () => { localStorage.removeItem('userToken'); localStorage.removeItem('userName'); window.location.href = 'index.html'; });
  }

  function feedbackElement(target) {
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target) return null;
    let element = target.querySelector('.feedback');
    if (!element) { element = document.createElement('div'); element.className = 'feedback'; element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); element.hidden = true; target.prepend(element); }
    return element;
  }

  function showFeedback(target, type, message) {
    const element = feedbackElement(target);
    if (!element) return;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'i';
    element.className = `feedback feedback-${type}`;
    element.innerHTML = `<span class="feedback-icon" aria-hidden="true">${icon}</span><span>${escapeHtml(message)}</span>`;
    element.hidden = false;
  }

  function clearFeedback(target) { const element = feedbackElement(target); if (element) element.hidden = true; }
  function apiMessage(data, fallback) { return data?.error?.message || data?.error || data?.message || fallback; }
  function setLoading(button, loading, label) { if (!button) return; if (loading) { button.dataset.label = button.textContent; button.disabled = true; button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${escapeHtml(label || 'Please wait...')}`; } else { button.disabled = false; button.textContent = button.dataset.label || label || 'Continue'; } }

  function setFieldError(input, message) {
    const field = input.closest('.field'); if (!field) return;
    const error = field.querySelector('.field-error');
    input.classList.toggle('is-invalid', Boolean(message)); input.classList.toggle('is-valid', !message && input.value.trim() !== ''); input.setAttribute('aria-invalid', String(Boolean(message))); if (error) error.textContent = message || '';
  }
  const validators = {
    name: value => /^[\p{L}][\p{L}\p{M}' -]{1,79}$/u.test(value.trim()) ? '' : 'Enter your full name using letters, spaces, apostrophes, or hyphens.',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.',
    phone: value => { const phone = value.replace(/[\s-]/g, ''); return /^(07\d{8}|\+?2507\d{8})$/.test(phone) ? '' : 'Use a Rwandan mobile number, for example 078 123 4567.'; },
    password: value => value.length >= 8 ? '' : 'Use at least 8 characters.',
    required: value => value.trim() ? '' : 'This field is required.'
  };
  function bindValidation(form, rules, submitButton) {
    const validateInput = input => { const rule = rules[input.name]; const message = rule ? (typeof rule === 'function' ? rule(input.value) : validators[rule](input.value)) : ''; setFieldError(input, message); return !message; };
    const validateAll = () => Object.keys(rules).every(name => { const input = form.elements[name]; return input ? validateInput(input) : true; });
    Object.keys(rules).forEach(name => { const input = form.elements[name]; if (!input) return; input.addEventListener('blur', () => validateInput(input)); input.addEventListener('input', () => validateInput(input)); });
    form.addEventListener('submit', event => { if (!validateAll()) event.preventDefault(); });
    return validateAll;
  }
  function formatRwandaPhone(input) { input.addEventListener('blur', () => { const value = input.value.replace(/[\s-]/g, ''); if (/^07\d{8}$/.test(value)) input.value = `${value.slice(0,3)} ${value.slice(3,6)} ${value.slice(6)}`; }); }

  window.Gerayo = { escapeHtml, showFeedback, clearFeedback, apiMessage, setLoading, setFieldError, validators, bindValidation, formatRwandaPhone };
  document.addEventListener('DOMContentLoaded', renderShell);
})();
