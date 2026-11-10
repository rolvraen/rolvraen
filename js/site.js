// Strong Resolve: theme toggle and screenshot lightbox. No dependencies.
(function () {
  var root = document.documentElement;
  var nb = root.lang === 'nb';

  // Theme toggle. The initial theme is set by an inline script in <head> to avoid a flash.
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    return root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  }
  function syncThemeColor() {
    var color = currentTheme() === 'dark' ? '#1f272d' : '#eef1f2';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.content = color; });
  }
  document.querySelectorAll('.sr-theme').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('sr-theme', next); } catch (e) {}
      syncThemeColor();
    });
  });
  if (root.dataset.theme) syncThemeColor();

  // Lightbox. Thumbnails are plain links to the full image, so this is progressive enhancement.
  if (typeof HTMLDialogElement !== 'function') return;
  var t = nb
    ? { close: 'Lukk', prev: 'Forrige bilde', next: 'Neste bilde', of: 'av' }
    : { close: 'Close', prev: 'Previous image', next: 'Next image', of: 'of' };

  var dlg = document.createElement('dialog');
  dlg.className = 'sr-lightbox';
  dlg.innerHTML =
    '<div class="sr-lightbox__bar"><span class="sr-lightbox__count"></span>' +
    '<button type="button" class="sr-lightbox__close" aria-label="' + t.close + '">✕</button></div>' +
    '<div class="sr-lightbox__stage"><img alt=""></div>' +
    '<div class="sr-lightbox__nav"><button type="button" class="sr-lightbox__prev" aria-label="' + t.prev + '">←</button>' +
    '<p class="sr-lightbox__caption"></p>' +
    '<button type="button" class="sr-lightbox__next" aria-label="' + t.next + '">→</button></div>';
  document.body.appendChild(dlg);

  var img = dlg.querySelector('img');
  var count = dlg.querySelector('.sr-lightbox__count');
  var caption = dlg.querySelector('.sr-lightbox__caption');
  var prev = dlg.querySelector('.sr-lightbox__prev');
  var next = dlg.querySelector('.sr-lightbox__next');
  var set = [], index = 0, opener = null;

  function show(i) {
    index = i;
    var link = set[i], thumb = link.querySelector('img');
    img.src = link.href;
    img.width = +link.dataset.w || 0;
    img.height = +link.dataset.h || 0;
    img.alt = thumb ? thumb.alt : '';
    caption.textContent = img.alt;
    count.textContent = (i + 1) + ' ' + t.of + ' ' + set.length;
    prev.disabled = i === 0;
    next.disabled = i === set.length - 1;
  }

  document.querySelectorAll('.sr-shot').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      set = Array.prototype.slice.call(link.closest('.sr-shots').querySelectorAll('.sr-shot'));
      opener = link;
      show(set.indexOf(link));
      dlg.showModal();
    });
  });

  prev.addEventListener('click', function () { if (index > 0) show(index - 1); });
  next.addEventListener('click', function () { if (index < set.length - 1) show(index + 1); });
  dlg.querySelector('.sr-lightbox__close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.classList.contains('sr-lightbox__stage')) dlg.close();
  });
  // Listen on the document, not the dialog: when an arrow button becomes disabled at either end,
  // focus leaves the dialog and dialog-level key events would stop arriving.
  document.addEventListener('keydown', function (e) {
    if (!dlg.open) return;
    if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight' && index < set.length - 1) { e.preventDefault(); show(index + 1); }
  });
  dlg.addEventListener('close', function () {
    img.removeAttribute('src');
    if (opener) opener.focus();
  });

  // Swipe between images on touch screens.
  var startX = null;
  dlg.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (dx > 50 && index > 0) show(index - 1);
    if (dx < -50 && index < set.length - 1) show(index + 1);
  });
})();
