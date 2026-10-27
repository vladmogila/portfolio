// Фильтр кейсов, лайтбокс галерей и автозапуск видео в зоне видимости.
(function () {
  "use strict";

  // ---------- Фильтр ----------
  var chips = document.querySelectorAll(".chip[data-filter]");
  var cases = document.querySelectorAll(".case[data-cat]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var filter = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      cases.forEach(function (item) {
        item.hidden = filter !== "all" && item.dataset.cat !== filter;
      });
    });
  });

  // ---------- Лайтбокс ----------
  var dialog = document.querySelector(".lightbox");
  if (dialog && typeof dialog.showModal === "function") {
    var img = dialog.querySelector(".lightbox__img");
    var caption = dialog.querySelector(".lightbox__caption");
    var prev = dialog.querySelector(".lightbox__prev");
    var next = dialog.querySelector(".lightbox__next");
    var items = [];
    var index = 0;

    function show(i) {
      index = (i + items.length) % items.length;
      var link = items[index];
      var thumb = link.querySelector("img");
      img.src = link.href;
      img.alt = thumb.alt;
      img.width = Number(link.dataset.w);
      img.height = Number(link.dataset.h);
      caption.textContent = thumb.alt + (items.length > 1 ? " · " + (index + 1) + "/" + items.length : "");
      prev.hidden = next.hidden = items.length < 2;
    }

    document.addEventListener("click", function (event) {
      var link = event.target.closest("a.shot");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      items = Array.prototype.slice.call(link.closest(".case__gallery").querySelectorAll("a.shot"));
      show(items.indexOf(link));
      dialog.showModal();
    });

    prev.addEventListener("click", function () { show(index - 1); });
    next.addEventListener("click", function () { show(index + 1); });
    dialog.querySelector(".lightbox__close").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.classList.contains("lightbox__figure")) dialog.close();
    });
    dialog.addEventListener("close", function () { img.removeAttribute("src"); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") show(index - 1);
      if (event.key === "ArrowRight") show(index + 1);
    });

    // Свайп на телефоне
    var startX = null;
    dialog.addEventListener("touchstart", function (event) { startX = event.touches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", function (event) {
      if (startX === null || items.length < 2) return;
      var dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  // ---------- Видео ----------
  var videos = document.querySelectorAll(".shot video");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    videos.forEach(function (video) { video.controls = true; });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      if (entry.isIntersecting) {
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () { video.controls = true; });
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });
  videos.forEach(function (video) { observer.observe(video); });
})();
