// Runs once on "/", picks a language from the browser setting and replaces the history entry.
// Stateless on purpose: no cookie or storage, and the two links on the page still work without JS.
(function () {
  var lang = (navigator.language || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'id';
  location.replace('/' + lang + '/');
})();
