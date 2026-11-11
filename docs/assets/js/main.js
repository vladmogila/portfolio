// Кейсы на весь экран (у каждого своя ссылка #id), пометки "ручкой" и видео, которые играют только на экране.
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // ---------- Кейсы ----------
  var current = null;

  function caseById(id) {
    var el = id && document.getElementById(id);
    return el && el.tagName === "DIALOG" ? el : null;
  }

  function play(video) {
    var p = video.play();
    // Кнопки показываем, только если браузер запретил автозапуск (а не когда видео просто уехало с экрана)
    if (p && p.catch) p.catch(function (error) { if (error && error.name === "NotAllowedError") video.controls = true; });
  }

  function openCase(dialog, push) {
    if (current && current !== dialog) current.close();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    current = dialog;
    document.body.classList.add("is-locked");
    if (push && location.hash !== "#" + dialog.id) history.pushState(null, "", "#" + dialog.id);
    if (!calm) dialog.querySelectorAll("video").forEach(play);
  }

  function closeCase(push) {
    if (!current) return;
    var dialog = current;
    current = null;
    dialog.close();
    document.body.classList.remove("is-locked");
    if (push) history.pushState(null, "", location.pathname + location.search);
    var tile = document.querySelector('.tile a[href="#' + dialog.id + '"]');
    if (tile) tile.focus({ preventScroll: true });
  }

  document.querySelectorAll("dialog.case").forEach(function (dialog) {
    dialog.addEventListener("cancel", function (event) { event.preventDefault(); closeCase(true); });
    dialog.addEventListener("close", function () {
      dialog.querySelectorAll("video").forEach(function (v) { v.pause(); });
    });
  });

  document.addEventListener("click", function (event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    var link = event.target.closest("a[href^='#']");
    if (!link) return;
    if (link.hasAttribute("data-close")) { event.preventDefault(); closeCase(true); return; }
    var dialog = caseById(link.getAttribute("href").slice(1));
    if (dialog) { event.preventDefault(); openCase(dialog, true); return; }
    if (current) closeCase(false); // ссылка на раздел страницы изнутри кейса
  });

  function syncWithHash() {
    var dialog = caseById(location.hash.slice(1));
    if (dialog) openCase(dialog, false);
    else closeCase(false);
  }
  window.addEventListener("popstate", syncWithHash);
  if (caseById(location.hash.slice(1))) syncWithHash();

  // ---------- Пометки дорисовываются, когда до них докрутили ----------
  var inks = document.querySelectorAll(".ink");
  if (!hasIO || calm) {
    inks.forEach(function (el) { el.classList.add("is-drawn"); });
  } else {
    var drawer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-drawn"); drawer.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    inks.forEach(function (el) { drawer.observe(el); });
  }

  // ---------- Видео ----------
  var videos = document.querySelectorAll("video");
  if (calm || !hasIO) {
    videos.forEach(function (v) { v.controls = true; v.preload = "metadata"; });
    return;
  }
  var player = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) play(entry.target);
      else entry.target.pause();
    });
  }, { threshold: 0.2 });
  videos.forEach(function (v) { player.observe(v); });
})();
