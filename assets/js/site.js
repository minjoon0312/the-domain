/* The Domain Archive: theme, search, lightbox, progress, TOC. No network calls; works from file://. */
(function () {
  var root = document.documentElement;
  var BASE = root.getAttribute("data-base") || "";

  // ---------- theme ----------
  function getTheme() { try { return localStorage.getItem("tda-theme") || "light"; } catch (e) { return "light"; } }
  function setTheme(t) { root.setAttribute("data-theme", t); try { localStorage.setItem("tda-theme", t); } catch (e) {} }
  setTheme(getTheme());
  var tbtn = document.getElementById("themeBtn");
  if (tbtn) tbtn.addEventListener("click", function () {
    root.classList.add("theme-anim");
    tbtn.classList.add("spin");
    setTheme(getTheme() === "dark" ? "light" : "dark");
    setTimeout(function () { root.classList.remove("theme-anim"); tbtn.classList.remove("spin"); }, 450);
  });
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // SMIL animations inside the summary diagrams and the home map do not obey the CSS reduced-motion rule; pause them explicitly.
  if (reduced) Array.prototype.forEach.call(document.querySelectorAll("svg"), function (svg) { if (svg.pauseAnimations) try { svg.pauseAnimations(); } catch (e) {} });

  // ---------- browse menu + mobile sheet ----------
  var menuWrap = document.getElementById("menuWrap"), menuBtn = menuWrap && menuWrap.querySelector(".menu-btn");
  var hoverTimer = null, openedBy = null;
  function setMenu(open, by) {
    if (!menuWrap) return;
    menuWrap.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    openedBy = open ? (by || openedBy) : null;
  }
  if (menuWrap) {
    menuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = menuWrap.classList.contains("open");
      if (isOpen && openedBy === "click") setMenu(false); else setMenu(true, "click");
    });
    if (window.matchMedia("(hover: hover)").matches) {
      menuWrap.addEventListener("mouseenter", function () { clearTimeout(hoverTimer); if (!menuWrap.classList.contains("open")) setMenu(true, "hover"); });
      menuWrap.addEventListener("mouseleave", function () { hoverTimer = setTimeout(function () { if (openedBy === "hover") setMenu(false); }, 320); });
    }
    document.addEventListener("click", function (e) { if (!menuWrap.contains(e.target)) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }
  var burger = document.getElementById("burger"), sheet = document.getElementById("sheet");
  if (burger && sheet) {
    burger.addEventListener("click", function () {
      var open = !sheet.classList.contains("open");
      sheet.classList.toggle("open", open); burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("sheet-open", open);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet.classList.contains("open")) burger.click(); });
  }

  // ---------- top bar shadow ----------
  var topbar = document.querySelector(".topbar");
  if (topbar) {
    var onTop = function () { topbar.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onTop, { passive: true }); onTop();
  }

  // ---------- count-up for landing stats ----------
  if (!reduced) document.querySelectorAll(".stats .stat b").forEach(function (b) {
    var raw = b.textContent.trim(), m = raw.match(/^([\d,]+)$/);
    if (!m) return;
    var target = parseInt(m[1].replace(/,/g, ""), 10), start = null, dur = 900;
    var fmt = function (n) { return n.toLocaleString("en-US"); };
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
      b.textContent = fmt(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step); else b.textContent = raw;
    };
    b.textContent = "0";
    requestAnimationFrame(step);
  });

  // ---------- collapsible sidebar (mobile) ----------
  document.querySelectorAll(".side-toggle").forEach(function (b) {
    b.addEventListener("click", function () {
      var side = b.closest(".side"); var open = side.classList.toggle("open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // ---------- reading progress ----------
  var bar = document.getElementById("progress");
  if (bar) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
    };
    window.addEventListener("scroll", tick, { passive: true }); tick();
  }

  // ---------- TOC active state ----------
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  if (tocLinks.length) {
    var heads = tocLinks.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))); }).filter(Boolean);
    var onScroll = function () {
      var y = window.scrollY + 90, cur = heads[0];
      for (var i = 0; i < heads.length; i++) if (heads[i].offsetTop <= y) cur = heads[i];
      tocLinks.forEach(function (a) { a.classList.toggle("active", cur && a.getAttribute("href") === "#" + cur.id); });
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  // ---------- lightbox ----------
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbimg = lb.querySelector("img");
    document.querySelectorAll(".article-body img").forEach(function (img) {
      img.addEventListener("click", function () { lbimg.src = img.currentSrc || img.src; lb.classList.add("open"); });
    });
    lb.addEventListener("click", function () {
      lb.classList.add("closing");
      setTimeout(function () { lb.classList.remove("open", "closing"); lbimg.src = ""; }, 170);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lb.classList.contains("open")) lb.click(); });
  }

  // ---------- timeline filters ----------
  var filters = document.getElementById("filters");
  if (filters) {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".trow"));
    var active = "all";
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      active = b.getAttribute("data-f");
      filters.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
      var shown = 0;
      rows.forEach(function (r) {
        var ok = active === "all" || (" " + r.getAttribute("data-c") + " ").indexOf(" " + active + " ") >= 0 || r.getAttribute("data-a") === active;
        r.style.display = ok ? "" : "none";
      });
      document.querySelectorAll(".year").forEach(function (y) {
        var any = Array.prototype.some.call(y.querySelectorAll(".trow"), function (r) { return r.style.display !== "none"; });
        y.style.display = any ? "" : "none";
      });
      var cnt = document.getElementById("tcount");
      if (cnt) cnt.textContent = rows.filter(function (r) { return r.style.display !== "none"; }).length + " articles";
    });
  }

  // ---------- search ----------
  var overlay = document.getElementById("search");
  if (!overlay) return;
  var input = overlay.querySelector("input");
  var results = overlay.querySelector(".results");
  var SPARK = '<svg class="spark" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path class="s1" d="M12 2.6l1.9 7.5 7.5 1.9-7.5 1.9L12 21.4l-1.9-7.5L2.6 12l7.5-1.9z"/><path class="s2" d="M19 1.5l.8 2.7 2.7.8-2.7.8L19 8.5l-.8-2.7-2.7-.8 2.7-.8z"/><path class="s3" d="M5 15.5l.8 2.7 2.7.8-2.7.8L5 22.5l-.8-2.7-2.7-.8 2.7-.8z"/></svg>';
  var deep = overlay.querySelector("#deep");
  var sel = -1, items = [], fulltextLoaded = false, fulltextLoading = false;

  var closing = false;
  function open() { overlay.classList.remove("closing"); overlay.classList.add("open"); input.focus(); input.select(); if (!items.length) render(); }
  function close() {
    if (closing) return; closing = true;
    overlay.classList.add("closing");
    setTimeout(function () { overlay.classList.remove("open", "closing"); closing = false; }, 170);
  }
  document.querySelectorAll("[data-open-search]").forEach(function (b) { b.addEventListener("click", open); });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); overlay.classList.contains("open") ? close() : open(); }
    else if (e.key === "/" && !overlay.classList.contains("open") && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    else if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hl(text, terms) {
    var h = esc(text);
    terms.forEach(function (t) { if (t.length < 2) return; h = h.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
    return h;
  }
  function snippet(text, terms) {
    var low = text.toLowerCase(), pos = -1;
    for (var i = 0; i < terms.length; i++) { pos = low.indexOf(terms[i]); if (pos >= 0) break; }
    if (pos < 0) return text.slice(0, 180);
    var s = Math.max(0, pos - 80), e = Math.min(text.length, pos + 140);
    return (s > 0 ? "…" : "") + text.slice(s, e) + (e < text.length ? "…" : "");
  }
  function score(a, terms, q) {
    var t = a.t.toLowerCase(), d = (a.e || "").toLowerCase(), h = (a.h || []).join(" ").toLowerCase(), k = (a.k || []).join(" ").toLowerCase();
    var s = 0;
    if (t.indexOf(q) >= 0) s += 60;
    terms.forEach(function (w) {
      if (t.indexOf(w) >= 0) s += 25;
      if (h.indexOf(w) >= 0) s += 8;
      if (k.indexOf(w) >= 0) s += 6;
      if (d.indexOf(w) >= 0) s += 4;
      if (fulltextLoaded && window.__FULLTEXT__ && (window.__FULLTEXT__[a.s] || "").indexOf(w) >= 0) s += 3;
    });
    var all = terms.every(function (w) {
      return t.indexOf(w) >= 0 || h.indexOf(w) >= 0 || k.indexOf(w) >= 0 || d.indexOf(w) >= 0 ||
        (fulltextLoaded && window.__FULLTEXT__ && (window.__FULLTEXT__[a.s] || "").indexOf(w) >= 0);
    });
    return all ? s : 0;
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    var terms = q.split(/\s+/).filter(Boolean);
    var data = (window.__ARCHIVE__ && window.__ARCHIVE__.articles) || [];
    var cols = (window.__ARCHIVE__ && window.__ARCHIVE__.collections) || [];
    var out = [];
    if (!terms.length) {
      out = cols.map(function (c) { return { s: c.s, t: c.t, e: c.e, c: ["Collection · " + c.n + " articles"], col: true, ai: c.ai, sc: 1 }; }).slice(0, 12);
    } else {
      data.forEach(function (a) { var sc = score(a, terms, q); if (sc > 0) out.push({ a: a, sc: sc }); });
      cols.forEach(function (c) { if (c.t.toLowerCase().indexOf(q) >= 0) out.push({ s: c.s, t: c.t, e: c.e, c: ["Collection"], col: true, ai: c.ai, sc: 100 }); });
      out.sort(function (x, y) { return y.sc - x.sc; });
      out = out.slice(0, 40);
    }
    items = out;
    sel = out.length ? 0 : -1;
    if (!out.length) { results.innerHTML = '<div class="empty">No matches' + (fulltextLoaded ? "" : ". Try enabling full-text search.") + "</div>"; return; }
    results.innerHTML = out.map(function (r, i) {
      if (r.col) return '<a class="res' + (i === sel ? " sel" : "") + '" href="' + BASE + "collections/" + r.s + '.html"><div class="t">' + (r.ai ? SPARK : "") + hl(r.t, terms) + '</div><div class="s">' + esc(r.e || "") + '</div><div class="c">' + r.c[0] + "</div></a>";
      var a = r.a, body = "";
      if (fulltextLoaded && window.__FULLTEXT__ && terms.length) {
        var ft = window.__FULLTEXT_RAW__ && window.__FULLTEXT_RAW__[a.s];
        body = ft ? snippet(ft, terms) : (a.e || "");
      } else body = a.e || "";
      return '<a class="res' + (i === sel ? " sel" : "") + '" href="' + BASE + "articles/" + a.s + '.html"><div class="t">' + (a.ai ? SPARK : "") + hl(a.t, terms) + '</div><div class="s">' + hl(body, terms) + '</div><div class="c">' + esc((a.c || []).slice(0, 2).join(" · ") || a.a) + (a.d ? " · " + a.d.slice(0, 4) : "") + " · " + a.m + " min</div></a>";
    }).join("");
  }
  input.addEventListener("input", render);
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === "Enter") { var el = results.querySelectorAll(".res")[sel]; if (el) window.location.href = el.getAttribute("href"); }
  });
  function paint() {
    var els = results.querySelectorAll(".res");
    els.forEach(function (el, i) { el.classList.toggle("sel", i === sel); });
    if (els[sel]) els[sel].scrollIntoView({ block: "nearest" });
  }
  if (deep) deep.addEventListener("change", function () {
    if (deep.checked && !fulltextLoaded && !fulltextLoading) {
      fulltextLoading = true;
      var s = document.createElement("script");
      s.src = BASE + "assets/js/fulltext.js";
      s.onload = function () {
        fulltextLoaded = true; fulltextLoading = false;
        window.__FULLTEXT_RAW__ = window.__FULLTEXT__;
        var lowered = {};
        Object.keys(window.__FULLTEXT__).forEach(function (k) { lowered[k] = window.__FULLTEXT__[k].toLowerCase(); });
        window.__FULLTEXT__ = lowered;
        render();
      };
      s.onerror = function () { fulltextLoading = false; deep.checked = false; };
      document.head.appendChild(s);
      results.innerHTML = '<div class="empty">Loading full text…</div>';
    } else render();
  });
})();
