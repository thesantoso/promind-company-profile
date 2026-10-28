// Mobile menu: the button shows or hides the drawer inside the header, which pushes the page content down.
(function () {
  'use strict';
  var btn = document.querySelector('.mobile-menu-btn');
  var drawer = btn && document.getElementById(btn.getAttribute('aria-controls'));
  if (!drawer) return;
  var label = btn.querySelector('.sr-only');
  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.classList.toggle('is-closed', !open);
    label.textContent = open ? btn.dataset.labelClose : btn.dataset.labelOpen;
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
  });
})();
