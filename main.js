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
     Die eigentliche Bewegung bleibt in CSS. Ausserhalb des sichtbaren
     Bereichs sowie auf Wunsch des Besuchers wird sie angehalten.

     Pfeile und Wischen spulen dieselbe CSS-Zeitleiste per Web Animations API
     vor oder zurueck, es gibt also keine zweite Animation. Die Standzeit, in
     der ein Getraenk ruhig steht, wird dabei uebersprungen. Die Richtung folgt
     dem Finger: "Naechstes" (rechter Pfeil, nach links wischen) laesst das neue
     Getraenk von rechts kommen, also die Zeitleiste rueckwaerts laufen. */
  var heroStage = document.querySelector("[data-hero-stage]");
  var heroMotionToggle = document.querySelector("[data-hero-toggle]");

  if (hero && heroStage) {
    var heroScenes = heroStage.querySelectorAll(".hero-drink-scene");
    var heroPalettes = heroStage.querySelectorAll(".hero-palette");
    var heroArrows = hero.querySelectorAll("[data-hero-step]");
    var heroLive = hero.querySelector("[data-hero-live]");
    var sceneCount = heroScenes.length;
    var sceneIndex = 0;
    var showHero = null;

    function markHeroScene(index, announce) {
      sceneIndex = ((index % sceneCount) + sceneCount) % sceneCount;
      Array.prototype.forEach.call(heroScenes, function (el, i) { el.classList.toggle("is-current", i === sceneIndex); });
      Array.prototype.forEach.call(heroPalettes, function (el, i) { el.classList.toggle("is-current", i === sceneIndex); });
      if (announce && heroLive) {
        var name = heroScenes[sceneIndex].querySelector(".hero-drink-name");
        var number = (sceneCount - sceneIndex) % sceneCount + 1;
        heroLive.textContent = (name ? name.textContent : "") + ", " + number + " von " + sceneCount;
      }
    }

    if (reduced) {
      hero.classList.add("is-reduced-motion");
      showHero = function (step) { markHeroScene(sceneIndex - step, true); };
    } else {
      var CYCLE_ANIMATIONS = { "hero-palette-cycle": true, "hero-product-sweep": true, "hero-ingredient-burst": true };
      var cycle = parseFloat(window.getComputedStyle(hero).getPropertyValue("--hero-cycle")) || 50.4;
      var slot = cycle / sceneCount;
      var firstDelay = parseFloat(heroScenes[0].style.getPropertyValue("--hero-delay")) || 0;
      /* Ruhefenster einer Szene in Sekunden, aus den Keyframes abgeleitet:
         alle Zutaten stehen ab 3,11 % plus hoechstens 0,2 s Versatz,
         die ersten fliegen ab 9,11 % wieder weg. */
      var holdStart = cycle * 0.0311111 + 0.21;
      var holdEnd = cycle * 0.0911111;
      var holdSpan = holdEnd - holdStart;
      var stepSpan = slot - holdSpan;
      /* Auf dem Handy laufen Wechsel von Hand schneller und das Getraenk
         steht danach kuerzer, damit Wischen direkt wirkt. */
      var compactHero = window.matchMedia("(max-width: 820px)");
      var stepDuration = function () { return compactHero.matches ? 560 : 1250; };
      var lingerDuration = function () { return compactHero.matches ? 1400 : 2600; };

      var userPaused = false;
      var outOfView = false;
      var tween = null;
      var tweenFrame = 0;
      var lingerTimer = 0;

      var cycleAnimations = function () {
        return heroStage.getAnimations({ subtree: true }).filter(function (a) {
          return CYCLE_ANIMATIONS[a.animationName];
        });
      };

      /* Zeitleiste ohne Standzeiten: in jeder Szene faellt das Ruhefenster
         auf einen Punkt zusammen, damit Wechsel gleichmaessig schnell laufen. */
      var compactFromTime = function (t) {
        var q = t - firstDelay;
        var n = Math.floor(q / slot);
        var local = q - n * slot;
        return n * stepSpan + (local < holdStart ? local : local <= holdEnd ? holdStart : local - holdSpan);
      };
      var timeFromCompact = function (c) {
        var n = Math.floor(c / stepSpan);
        var local = c - n * stepSpan;
        /* Kleine Toleranz: ein Rundungsfehler am Ruhepunkt darf nicht ans Ende der Standzeit springen. */
        return firstDelay + n * slot + (local <= holdStart + 1e-4 ? local : local + holdSpan);
      };

      var syncHero = function () {
        var run = !userPaused && !outOfView && !tween && !lingerTimer;
        cycleAnimations().forEach(function (a) {
          if (run) { if (a.playState !== "running") a.play(); }
          else if (a.playState !== "paused") a.pause();
        });
      };

      var heroTweenFrame = function (now) {
        tweenFrame = 0;
        if (!tween) return;
        var k = Math.min(1, (now - tween.start) / tween.duration);
        tween.value = tween.from + (tween.to - tween.from) * k;
        var ms = timeFromCompact(tween.value) * 1000;
        tween.animations.forEach(function (a) { a.currentTime = ms; });

        if (k < 1) {
          tweenFrame = window.requestAnimationFrame(heroTweenFrame);
          return;
        }
        tween = null;
        /* Nach einem Wechsel von Hand bleibt das Getraenk etwas laenger stehen. */
        if (!userPaused) {
          lingerTimer = window.setTimeout(function () {
            lingerTimer = 0;
            syncHero();
          }, lingerDuration());
        }
        syncHero();
      };

      if (typeof heroStage.getAnimations === "function" && cycleAnimations().length) {
        showHero = function (step) {
          var animations = tween ? tween.animations : cycleAnimations();
          if (!animations.length) return;

          var from;
          if (tween) {
            from = tween.value;
          } else {
            var t = animations[0].currentTime / 1000;
            /* Vor der dritten Runde verschieben, damit Rueckwaertslaufen nie vor
               den Start faellt. Die Zeitleiste ist periodisch, das Bild bleibt gleich. */
            if (t < 2 * cycle) t += 2 * cycle;
            from = compactFromTime(t);
          }

          var base = ((tween ? tween.to : from) - holdStart) / stepSpan;
          var target = step > 0 ? Math.ceil(base - 1e-6) - 1 : Math.floor(base + 1e-6) + 1;
          var to = target * stepSpan + holdStart;

          window.clearTimeout(lingerTimer);
          lingerTimer = 0;
          animations.forEach(function (a) { a.pause(); });
          tween = {
            animations: animations,
            from: from,
            value: from,
            to: to,
            start: performance.now(),
            duration: Math.max(200, stepDuration() * Math.sqrt(Math.abs(to - from) / stepSpan))
          };
          if (!tweenFrame) tweenFrame = window.requestAnimationFrame(heroTweenFrame);
          markHeroScene(target, true);
        };
      }

      if (heroMotionToggle) {
        heroMotionToggle.hidden = false;
        heroMotionToggle.addEventListener("click", function () {
          userPaused = hero.classList.toggle("is-paused");
          heroMotionToggle.setAttribute("aria-pressed", String(userPaused));
          heroMotionToggle.setAttribute("aria-label", userPaused ? "Animation fortsetzen" : "Animation pausieren");
          if (showHero) syncHero();
        });
      }

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          outOfView = !entries[0].isIntersecting;
          hero.classList.toggle("is-out-of-view", outOfView);
          if (showHero) syncHero();
        }, { threshold: 0.02 }).observe(hero);
      }
    }

    if (showHero && sceneCount > 1) {
      Array.prototype.forEach.call(heroArrows, function (arrow) {
        arrow.hidden = false;
        arrow.addEventListener("click", function () {
          showHero(Number(arrow.getAttribute("data-hero-step")));
        });
      });

      /* Wischen mit Finger, Stift oder gezogener Maus. Senkrechte Bewegungen
         bleiben dem Scrollen ueberlassen und brechen die Geste ab.
         Per Touch loest der Wechsel schon waehrend der Bewegung aus,
         sobald die Richtung klar ist, nicht erst beim Loslassen. */
      var swipe = null;

      var swipeStep = function (event, final) {
        var dx = event.clientX - swipe.x;
        var dy = event.clientY - swipe.y;
        var touch = event.pointerType !== "mouse";
        var distance = touch ? 24 : 40;
        if (!final && !touch) return false;
        if (Math.abs(dx) < distance || Math.abs(dx) <= Math.abs(dy) * (touch ? 1.1 : 1.3)) return false;
        showHero(dx < 0 ? 1 : -1);
        return true;
      };

      hero.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest("a, button")) return;
        swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
      });

      hero.addEventListener("pointermove", function (event) {
        if (!swipe || event.pointerId !== swipe.id) return;
        if (swipeStep(event, false)) swipe = null;
      });

      hero.addEventListener("pointerup", function (event) {
        if (!swipe || event.pointerId !== swipe.id) return;
        swipeStep(event, true);
        swipe = null;
      });

      hero.addEventListener("pointercancel", function () { swipe = null; });
      hero.addEventListener("dragstart", function (event) { event.preventDefault(); });
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


  /* ---- Favoriten-Karussell auf der Speisekarte ----
     Das Scrollen selbst ist nativ mit Einrasten, damit es auf dem Handy
     direkt dem Finger folgt. Die Pfeile springen um ganze Karten. Ein Klick
     auf eine Karte fuehrt zur Position in der Karte und hebt einen aktiven
     Filter auf, falls die Position gerade ausgeblendet ist. */
  var favTrack = document.querySelector("[data-favs-track]");
  var favNav = document.querySelector("[data-favs-nav]");

  if (favTrack) {
    var favPrev = favNav && favNav.querySelector('[data-favs-step="-1"]');
    var favNext = favNav && favNav.querySelector('[data-favs-step="1"]');
    var favFrame = 0;

    function favStep() {
      var card = favTrack.querySelector(".fav-card");
      if (!card) return favTrack.clientWidth;
      var gap = parseFloat(window.getComputedStyle(favTrack).columnGap) || 0;
      var per = card.getBoundingClientRect().width + gap;
      return Math.max(1, Math.floor((favTrack.clientWidth * 0.8) / per)) * per;
    }

    function updateFavButtons() {
      favFrame = 0;
      if (!favPrev || !favNext) return;
      var max = favTrack.scrollWidth - favTrack.clientWidth;
      favPrev.disabled = favTrack.scrollLeft <= 2;
      favNext.disabled = favTrack.scrollLeft >= max - 2;
      favNav.hidden = max <= 2;
    }

    function queueFavButtons() {
      if (!favFrame) favFrame = window.requestAnimationFrame(updateFavButtons);
    }

    if (favNav) {
      Array.prototype.forEach.call(favNav.querySelectorAll("[data-favs-step]"), function (button) {
        button.addEventListener("click", function () {
          favTrack.scrollBy({
            left: Number(button.getAttribute("data-favs-step")) * favStep(),
            behavior: reduced ? "auto" : "smooth"
          });
        });
      });
      favTrack.addEventListener("scroll", queueFavButtons, { passive: true });
      window.addEventListener("resize", queueFavButtons);
      updateFavButtons();
    }

    favTrack.addEventListener("click", function (event) {
      var link = event.target.closest('a[href^="#karte-"]');
      if (!link || !chips.length) return;
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target || target.style.display !== "none") return;
      chips.forEach(function (c) {
        if (c.getAttribute("data-filter") === "alle") c.click();
      });
    });
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
