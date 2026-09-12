/* CHAI Dessert und Kaffee - Interaktion
   Kein Scroll-Listener: Sticky-Zustand und Einblendungen laufen über IntersectionObserver. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobiles Menü ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("hauptmenue");

  if (toggle && links) {
    var mobileNav = window.matchMedia("(max-width: 900px)");

    function closeMenu(returnFocus) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menü";
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Schließen" : "Menü";
    });

    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && links.classList.contains("is-open")) {
        closeMenu(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) closeMenu(true);
    });

    function resetMenu(e) {
      if (!e.matches) closeMenu(false);
    }

    if (mobileNav.addEventListener) mobileNav.addEventListener("change", resetMenu);
    else mobileNav.addListener(resetMenu);
  }

  /* ---- Kopfzeile ueber dem Vollbild ----
     Nur die Startseite hat einen Vollbild-Hero. Solange wir ganz oben
     stehen, wird die Leiste transparent. Faellt der Observer aus, bleibt
     der helle, immer lesbare Grundzustand stehen. */
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");

  if (header && hero && "IntersectionObserver" in window) {
    if (window.scrollY < 8) header.classList.add("is-over-hero");

    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;";
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-over-hero", entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---- Horizontaler Getraenkewechsel im Startbild ----
     Die eigentliche Bewegung bleibt in CSS und benoetigt keinen zweiten
     requestAnimationFrame-Loop. Ausserhalb des sichtbaren Bereichs sowie
     auf Wunsch des Besuchers wird sie angehalten. */
  var heroStage = document.querySelector("[data-hero-stage]");
  var heroMotionToggle = document.querySelector("[data-hero-toggle]");

  if (hero && heroStage) {
    if (reduced) {
      hero.classList.add("is-reduced-motion");
    } else {
      if (heroMotionToggle) {
        heroMotionToggle.hidden = false;
        heroMotionToggle.addEventListener("click", function () {
          var paused = hero.classList.toggle("is-paused");
          heroMotionToggle.setAttribute("aria-pressed", String(paused));
          heroMotionToggle.setAttribute("aria-label", paused ? "Animation fortsetzen" : "Animation pausieren");
        });
      }

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          hero.classList.toggle("is-out-of-view", !entries[0].isIntersecting);
        }, { threshold: 0.02 }).observe(hero);
      }
    }
  }

  /* ---- Karte filtern ---- */
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
  var grid = document.getElementById("karten-liste");

  function markFirstHead() {
    var heads = grid.querySelectorAll(".cat-head");
    var found = false;
    Array.prototype.forEach.call(heads, function (h) {
      var visible = h.style.display !== "none";
      h.classList.toggle("is-first", visible && !found);
      if (visible) found = true;
    });
  }

  function apply(filter) {
    Array.prototype.forEach.call(grid.children, function (el) {
      var cat = el.getAttribute("data-cat");
      el.style.display = (filter === "alle" || cat === filter) ? "" : "none";
    });
    markFirstHead();
  }

  if (chips.length && grid) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        apply(chip.getAttribute("data-filter"));
      });
    });
    markFirstHead();
  }


  /* ---- Betriebsstatus aus den Oeffnungszeiten ----
     Gerechnet wird immer in der Zeitzone des Cafes, nicht in der des Besuchers.
     Montag bis Samstag 09:00 bis 19:00, Sonntag geschlossen. */
  var statusFelder = document.querySelectorAll("[data-status]");

  if (statusFelder.length) {
    var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

    function jetztInOldenburg() {
      var f = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var teil = {};
      f.forEach(function (p) { teil[p.type] = p.value; });
      var wochentage = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { tag: wochentage[teil.weekday], minute: (+teil.hour) * 60 + (+teil.minute) };
    }

    function statusText() {
      var t = jetztInOldenburg();
      var AUF = 9 * 60, ZU = 19 * 60;

      if (t.tag !== 0 && t.minute >= AUF && t.minute < ZU) {
        return { offen: true, text: "Jetzt geöffnet, bis 19:00 Uhr", kurz: "Geöffnet bis 19:00" };
      }
      if (t.tag !== 0 && t.minute < AUF) {
        return { offen: false, text: "Öffnet heute um 09:00 Uhr", kurz: "Öffnet um 09:00" };
      }
      var naechster = t.tag === 6 || t.tag === 0 ? 1 : t.tag + 1;
      var wort = (t.tag === 6 || t.tag === 0) ? "Montag" : "morgen";
      if (naechster === t.tag + 1 && t.tag !== 0) wort = "morgen";
      return { offen: false, text: "Geschlossen, öffnet " + wort + " um 09:00 Uhr", kurz: "Geschlossen" };
    }

    function statusZeigen() {
      var s = statusText();
      Array.prototype.forEach.call(statusFelder, function (el) {
        var lang = el.querySelector("[data-status-text]");
        if (lang) lang.textContent = s.text;
        var kurz = el.querySelector("[data-status-short]");
        if (kurz) kurz.textContent = s.kurz;
        el.classList.toggle("is-open", s.offen);
        el.hidden = false;
      });
    }

    statusZeigen();
    window.setInterval(statusZeigen, 60000);
  }

  /* ---- Endlose Linie mit Google-Rezensionen ----
     Eine Originalgruppe bleibt im HTML als scrollbarerer Fallback. Nur wenn
     Bewegung erlaubt ist, werden unsichtbare Kopien fuer den nahtlosen Lauf
     erzeugt. Maus, Touch, Tastatur und eine dauerhafte Pause bleiben moeglich. */
  var reviewRail = document.querySelector("[data-review-marquee]");
  var reviewTrack = document.querySelector("[data-review-track]");
  var reviewGroup = document.querySelector("[data-review-group]");
  var reviewToggle = document.querySelector("[data-review-toggle]");

  if (reviewRail && reviewTrack && reviewGroup && !reduced) {
    var driftPerMs = 0.032;
    var resumeDelay = 1200;
    var inertiaDecayPerFrame = 0.93;
    var minInertia = 0.004;

    var groupSpan = 0;
    var position = 0;
    var velocity = 0;
    var manualPaused = false;
    var hoverPaused = false;
    var focusPaused = false;
    var idlePaused = false;
    var idleTimer = 0;
    var dragPointer = null;
    var dragOrigin = 0;
    var dragStart = 0;
    var lastMoveX = 0;
    var lastMoveAt = 0;
    var lastFrameAt = performance.now();
    var railVisible = true;

    function renderReviews() {
      reviewTrack.style.transform = "translate3d(" + (-position) + "px,0,0)";
    }

    function wrapReviews() {
      if (groupSpan <= 0) return;
      position %= groupSpan;
      if (position < 0) position += groupSpan;
    }

    function cloneReviewGroup() {
      var clone = reviewGroup.cloneNode(true);
      clone.classList.add("is-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      reviewTrack.appendChild(clone);
    }

    function measureReviews() {
      var gap = parseFloat(window.getComputedStyle(reviewTrack).columnGap) || 0;
      groupSpan = reviewGroup.offsetWidth + gap;

      while (groupSpan > 0 && reviewTrack.scrollWidth < reviewRail.clientWidth + groupSpan) {
        cloneReviewGroup();
      }

      wrapReviews();
      renderReviews();
    }

    function pauseForInteraction() {
      idlePaused = true;
      window.clearTimeout(idleTimer);
    }

    function resumeAfterIdle(delay) {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function () {
        idlePaused = false;
      }, typeof delay === "number" ? delay : resumeDelay);
    }

    function reviewsPaused() {
      return manualPaused || hoverPaused || focusPaused || idlePaused;
    }

    function reviewFrame(now) {
      window.requestAnimationFrame(reviewFrame);

      var elapsed = Math.min(now - lastFrameAt, 50);
      lastFrameAt = now;

      if (!railVisible || document.hidden || dragPointer !== null || groupSpan <= 0) return;

      if (Math.abs(velocity) > minInertia) {
        position += velocity * elapsed;
        velocity *= Math.pow(inertiaDecayPerFrame, elapsed / 16.667);
      } else {
        velocity = 0;
        if (reviewsPaused()) return;
        position += driftPerMs * elapsed;
      }

      wrapReviews();
      renderReviews();
    }

    reviewRail.classList.add("is-active");
    cloneReviewGroup();
    measureReviews();

    if ("ResizeObserver" in window) {
      new ResizeObserver(measureReviews).observe(reviewGroup);
    } else {
      window.addEventListener("resize", measureReviews);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        railVisible = entries[0].isIntersecting;
        lastFrameAt = performance.now();
      }).observe(reviewRail);
    }

    document.addEventListener("visibilitychange", function () {
      lastFrameAt = performance.now();
    });

    window.requestAnimationFrame(reviewFrame);

    reviewRail.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse") hoverPaused = true;
    });

    reviewRail.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse" && dragPointer === null) hoverPaused = false;
    });

    reviewRail.addEventListener("focusin", function () {
      focusPaused = true;
    });

    reviewRail.addEventListener("focusout", function (event) {
      if (!reviewRail.contains(event.relatedTarget)) focusPaused = false;
    });

    reviewRail.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      position += event.key === "ArrowRight" ? 180 : -180;
      wrapReviews();
      renderReviews();
    });

    reviewRail.addEventListener("wheel", function (event) {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      pauseForInteraction();
      position += event.deltaX;
      wrapReviews();
      renderReviews();
      resumeAfterIdle();
    }, { passive: false });

    reviewRail.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      dragPointer = event.pointerId;
      dragOrigin = event.clientX;
      dragStart = position;
      lastMoveX = event.clientX;
      lastMoveAt = event.timeStamp;
      velocity = 0;
      reviewRail.dataset.dragging = "true";
      if (reviewRail.setPointerCapture) reviewRail.setPointerCapture(event.pointerId);
    });

    reviewRail.addEventListener("pointermove", function (event) {
      if (event.pointerId !== dragPointer) return;

      position = dragStart - (event.clientX - dragOrigin);
      wrapReviews();
      renderReviews();

      var span = event.timeStamp - lastMoveAt;
      if (span > 0) velocity = -(event.clientX - lastMoveX) / span;
      lastMoveX = event.clientX;
      lastMoveAt = event.timeStamp;
    });

    function endReviewDrag(event) {
      if (event.pointerId !== dragPointer) return;
      if (event.timeStamp - lastMoveAt > 90) velocity = 0;
      dragPointer = null;
      delete reviewRail.dataset.dragging;
    }

    reviewRail.addEventListener("pointerup", endReviewDrag);
    reviewRail.addEventListener("pointercancel", endReviewDrag);
    reviewRail.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight");

    if (reviewToggle) {
      reviewToggle.hidden = false;
      reviewToggle.addEventListener("click", function () {
        manualPaused = !manualPaused;
        reviewToggle.setAttribute("aria-pressed", String(manualPaused));
        reviewToggle.textContent = manualPaused ? "Bewegung fortsetzen" : "Bewegung pausieren";
      });
    }
  }

  /* ---- Abschnitte beim Scrollen einblenden ----
     Der versteckte Zustand wird erst hier aktiviert. Sollte der Observer
     nicht auslösen, macht ein Timeout nach 2,5 Sekunden alles sichtbar. */
  var targets = document.querySelectorAll(".reveal");

  function showAll() {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add("is-in"); });
  }

  if (reduced || !("IntersectionObserver" in window) || !targets.length) {
    showAll();
    return;
  }

  document.documentElement.classList.add("js-reveal");

  var ioResponded = false;
  var io = new IntersectionObserver(function (entries, obs) {
    ioResponded = true;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });

  Array.prototype.forEach.call(targets, function (el, i) {
    el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
    io.observe(el);
  });

  /* Sicherheitsnetz nur fuer den Fall, dass ein vorhandener Observer gar nicht antwortet.
     Sichtbare Bereiche unterhalb des ersten Bildschirms bleiben sonst bis zum Scrollen verborgen. */
  window.setTimeout(function () {
    if (!ioResponded) showAll();
  }, 2500);
})();
