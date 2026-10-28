// Form kontak: validasi ringan di browser, lalu POST JSON ke /api/contact (Worker memverifikasi Turnstile).
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var button = form.querySelector('button[type=submit]');
  var buttonLabel = button.querySelector('[data-label]') || button;
  var statuses = {};
  form.querySelectorAll('[data-status]').forEach(function (el) {
    statuses[el.getAttribute('data-status')] = el;
  });

  function show(name) {
    Object.keys(statuses).forEach(function (k) {
      statuses[k].hidden = k !== name;
    });
  }

  function field(name) {
    return form.elements.namedItem(name);
  }

  function invalidFields() {
    var bad = [];
    var email = field('email').value.trim();
    if (!field('name').value.trim()) bad.push('name');
    if (!field('company').value.trim()) bad.push('company');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push('email');
    if (!/^[0-9+()\-\s.]{6,30}$/.test(field('phone').value.trim())) bad.push('phone');
    return bad;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    ['name', 'company', 'email', 'phone'].forEach(function (n) {
      field(n).removeAttribute('aria-invalid');
    });
    show(null);

    var bad = invalidFields();
    if (bad.length) {
      bad.forEach(function (n) {
        field(n).setAttribute('aria-invalid', 'true');
      });
      show('error-required');
      field(bad[0]).focus();
      return;
    }

    var tokenInput = form.querySelector('[name="cf-turnstile-response"]');
    var token = tokenInput && tokenInput.value;
    if (!token) {
      show('error-verify');
      return;
    }

    var payload = {
      name: field('name').value.trim(),
      email: field('email').value.trim(),
      topic: field('topic').value,
      // The worker takes one message: company and property type go first, then the notes.
      message: [
        form.getAttribute('data-label-company') + ': ' + field('company').value.trim(),
        form.getAttribute('data-label-property') + ': ' + field('propertyType').value,
        '',
        field('message').value.trim(),
      ].join('\n').trim(),
      lang: document.documentElement.lang.indexOf('en') === 0 ? 'en' : 'id',
      turnstileToken: token,
      website: field('website').value,
    };
    payload.phone = field('phone').value.trim();

    button.disabled = true;
    buttonLabel.textContent = form.getAttribute('data-sending');

    fetch(form.getAttribute('data-endpoint') || '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          show('success');
        } else if (res.status === 429) {
          show('error-rate');
        } else if (res.status >= 500) {
          show('error-unavailable');
        } else {
          show('error-failed');
        }
      })
      .catch(function () {
        show('error-unavailable');
      })
      .then(function () {
        button.disabled = false;
        buttonLabel.textContent = form.getAttribute('data-submit');
        if (window.turnstile && typeof window.turnstile.reset === 'function') window.turnstile.reset();
      });
  });
})();
