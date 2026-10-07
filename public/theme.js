// Sets the theme before the page paints, so it never flashes the wrong colour.
// Paper is the default; "ink" is the dark notebook.
(function () {
  var t = 'paper';
  try { t = localStorage.getItem('vigil:theme') || 'paper'; } catch (e) {}
  var d = document.documentElement;
  d.setAttribute('data-theme', t);
  d.style.backgroundColor = t === 'ink' ? '#0c0d10' : '#f3efe4';
  d.style.backgroundImage = '';
  d.style.colorScheme = t === 'ink' ? 'dark' : 'light';
})();
