// Кейсы в полноэкранном листе (с прямыми ссылками #id), фильтр, появление при прокрутке, видео.
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Фильтр ----------
  var filters = document.querySelectorAll(".filter[data-filter]");
  var tiles = document.querySelectorAll(".tile[data-cat]");
  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.dataset.filter;
      filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
      tiles.forEach(function (tile) { tile.hidden = value !== "all" && tile.dataset.cat !== value; });
    });
  });

  // ---------- Кейсы ----------
  var current = null;

  function caseById(id) {
    var el = id && document.getElementById(id);
    return el && el.tagName === "DIALOG" ? el : null;
  }

  function openCase(dialog, push) {
    if (current && current !== dialog) current.close();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    current = dialog;
    document.body.classList.add("is-locked");
    if (push && location.hash !== "#" + dialog.id) history.pushState(null, "", "#" + dialog.id);
    playVisible(dialog);
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

  // ---------- Появление при прокрутке ----------
  if (!("IntersectionObserver" in window) || reduceMotion) {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); revealer.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) {
      // То, что уже выше экрана (переход по якорю, восстановление прокрутки), показываем сразу
      if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in");
      else revealer.observe(el);
    });
  }

  // ---------- Видео: играют, только когда видны ----------
  var videos = document.querySelectorAll("video");
  function play(video) {
    var p = video.play();
    if (p && p.catch) p.catch(function () { video.controls = true; });
  }
  function playVisible(root) {
    if (reduceMotion) return;
    root.querySelectorAll("video").forEach(play);
  }
  if (reduceMotion || !("IntersectionObserver" in window)) {
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
