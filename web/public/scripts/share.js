// Halaman lowongan: salin tautan/email dan "bagikan lainnya" (Web Share API, cadangan: email).
// Tautan Facebook, X, WhatsApp, dan LinkedIn berfungsi tanpa script ini.
(function () {
  'use strict';

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.className = 'hp';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      if (ok) resolve(); else reject(new Error('copy failed'));
    });
  }

  function feedbackFor(el) {
    var box = el.closest('[data-share-root], [data-apply]');
    return box ? box.querySelector('[data-feedback]') : null;
  }

  function say(el, text, isError) {
    var out = feedbackFor(el);
    if (!out) return;
    out.textContent = text;
    out.classList.toggle('is-error', !!isError);
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var label = button.querySelector('[data-label]');
      copyText(button.getAttribute('data-copy')).then(function () {
        button.classList.add('is-copied');
        if (label) label.textContent = button.getAttribute('data-copied');
        else say(button, button.getAttribute('data-copied'), false);
      }, function () {
        say(button, button.getAttribute('data-failed'), true);
      });
    });
  });

  document.querySelectorAll('[data-share-more]').forEach(function (button) {
    button.addEventListener('click', function () {
      var root = button.closest('[data-share-root]');
      var url = root.getAttribute('data-share-url');
      var title = root.getAttribute('data-share-title');
      if (navigator.share) {
        navigator.share({ title: title, text: root.getAttribute('data-share-text') || title, url: url }).catch(function (error) {
          if (!error || error.name !== 'AbortError') say(button, button.getAttribute('data-failed'), true);
        });
        return;
      }
      window.location.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url);
    });
  });
})();
