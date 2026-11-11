/* SportyPunter v2 redesign - demo behavior (stub backend) */
(function () {
  "use strict";

  var MARKETING = ["home", "signup", "login", "welcome"];
  var APP = ["book", "progress", "result", "plans", "convert", "two-odds"];

  var nav = document.getElementById("site-nav");
  var shell = document.querySelector("[data-app]");
  var foot = document.querySelector(".site-foot");
  var views = Array.prototype.slice.call(document.querySelectorAll(".view"));

  function route() {
    var hash = (location.hash || "#/").replace(/^#\/?/, "").split("?")[0] || "home";
    if (hash === "") hash = "home";
    var isApp = APP.indexOf(hash) !== -1;
    var isMkt = MARKETING.indexOf(hash) !== -1;
    if (!isApp && !isMkt) hash = "home", isMkt = true;

    views.forEach(function (v) {
      v.classList.toggle("active", v.getAttribute("data-view") === hash);
    });
    shell.classList.toggle("active", isApp);
    nav.classList.toggle("active", hash === "home");
    foot.classList.toggle("active", hash === "home");

    document.querySelectorAll(".bottom-nav a, .bottom-nav button").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-nav") === hash);
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();

  /* ---------- booking steps ---------- */
  var state = { window: null, risk: null, band: null };
  var COST = { today: 150, longshot: 300 };
  var steps = document.getElementById("steps");
  if (steps) {
    var qsteps = Array.prototype.slice.call(steps.querySelectorAll(".qstep"));

    function openStep(n) {
      qsteps.forEach(function (s) {
        var sn = Number(s.getAttribute("data-step"));
        s.classList.toggle("open", sn === n);
        var answered =
          (sn === 1 && state.window) ||
          (sn === 2 && state.risk) ||
          (sn === 3 && state.band);
        s.classList.toggle("done", !!answered);
        var sum = s.querySelector(".qstep-sum");
        if (sn === 1) sum.textContent = state.window === "today" ? "Today" : state.window === "longshot" ? "Longshot" : "";
        if (sn === 2) sum.textContent = state.risk === "safe" ? "Play Safe" : state.risk === "risk" ? "Analysed Risk" : "";
        if (sn === 3) sum.textContent = state.band ? state.band + " odds" : "";
      });
      var bookBtn = document.getElementById("btn-book");
      var ready = state.window && state.risk && state.band;
      bookBtn.disabled = !ready;
      document.getElementById("book-cost").textContent = COST[state.window] || 150;
    }

    qsteps.forEach(function (s) {
      s.querySelector(".qstep-head").addEventListener("click", function () {
        var sn = Number(s.getAttribute("data-step"));
        s.classList.contains("open") ? s.classList.remove("open") : openStep(sn);
      });
    });

    document.querySelectorAll("[data-pick]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (el.classList.contains("is-locked")) return;
        var kind = el.getAttribute("data-pick");
        var value = el.getAttribute("data-value");
        state[kind] = value;
        document.querySelectorAll('[data-pick="' + kind + '"]').forEach(function (peer) {
          peer.classList.toggle("sel", peer === el);
        });
        var stepEl = el.closest(".qstep");
        var nextBtn = stepEl.querySelector(".btn-next");
        if (nextBtn) nextBtn.disabled = false;
        openStep(Number(stepEl.getAttribute("data-step")));
        stepEl.classList.add("open");
      });
    });

    document.querySelectorAll(".btn-next").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openStep(Number(btn.getAttribute("data-next")));
      });
    });

    openStep(1);

    document.getElementById("btn-book").addEventListener("click", function () {
      location.hash = "#/progress";
      runProgress();
    });
  }

  /* ---------- staged progress (demo of the real ~1 min pipeline, shortened) ---------- */
  var MSGS = [
    "Reading today's fixtures…",
    "Pulling team form and scoring runs…",
    "Checking head to head records…",
    "Analyst reviewing every leg…",
    "Locking odds with SportyBet…",
    "Booking your code…"
  ];
  var progTimer = null;
  function runProgress() {
    var list = document.getElementById("prog-list");
    var msg = document.getElementById("prog-msg");
    var fill = document.getElementById("prog-fill");
    list.innerHTML = "";
    fill.style.width = "6%";
    var i = 0;
    msg.textContent = MSGS[0];
    clearInterval(progTimer);
    progTimer = setInterval(function () {
      var li = document.createElement("li");
      li.innerHTML = '<svg><use href="#g-check"/></svg>' + MSGS[i].replace("…", "");
      list.appendChild(li);
      i++;
      if (i < MSGS.length) {
        msg.textContent = MSGS[i];
        fill.style.width = Math.round(((i + 1) / MSGS.length) * 100) + "%";
      } else {
        clearInterval(progTimer);
        fill.style.width = "100%";
        renderResult();
        location.hash = "#/result";
      }
    }, 1400);
  }

  /* ---------- result (sample analyzed slip) ---------- */
  var LEGS = [
    { lg: "SA", c: "#178A4C", match: "Inter vs Torino", market: "Home or draw · 1.12", prob: 95, note: "Inter are unbeaten in their last 12 home league games." },
    { lg: "LP", c: "#FF0080", match: "Sporting CP vs Estoril", market: "Over 1.5 goals · 1.16", prob: 93, note: "Sporting's last 8 home games all went over 1.5 goals." },
    { lg: "LA", c: "#DA291C", match: "Real Madrid vs Getafe", market: "Over 1.5 goals · 1.18", prob: 91, note: "Madrid have scored in every home game this season." },
    { lg: "SC", c: "#006738", match: "Celtic vs Hearts", market: "Home win · 1.30", prob: 88, note: "Celtic have won 9 of their last 10 at home." },
    { lg: "PL", c: "#3D195B", match: "Arsenal vs Chelsea", market: "Home win · 1.72", prob: 84, note: "Arsenal have won their last 5 home league games." },
    { lg: "BL", c: "#D20515", match: "Bayern vs Stuttgart", market: "Both teams to score · 1.65", prob: 78, note: "Both sides scored in 6 of Stuttgart's last 7 away games." }
  ];

  function renderResult() {
    var ol = document.getElementById("legs");
    if (!ol) return;
    ol.innerHTML = "";
    LEGS.forEach(function (leg) {
      var li = document.createElement("li");
      li.className = "leg";
      li.innerHTML =
        '<span class="lg-badge" style="--c:' + leg.c + '">' + leg.lg + "</span>" +
        '<div class="leg-mid"><b>' + leg.match + "</b>" +
        '<span class="market">' + leg.market + "</span>" +
        '<span class="comment">' + leg.note + "</span></div>" +
        '<span class="prob">' + leg.prob + "%</span>";
      ol.appendChild(li);
    });
    document.getElementById("res-legs").textContent = LEGS.length + " legs";
  }

  /* ---------- copy buttons ---------- */
  function bindCopy(id, getText) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var t = getText();
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      btn.innerHTML = '<svg class="g"><use href="#g-check"/></svg> Copied';
      setTimeout(function () {
        btn.innerHTML = '<svg class="g"><use href="#g-copy"/></svg> Copy';
      }, 1600);
    });
  }
  bindCopy("btn-copy", function () { return document.getElementById("res-code").textContent; });
  bindCopy("btn-copy-conv", function () { return document.getElementById("conv-res").textContent; });
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(btn.getAttribute("data-copy"));
      btn.innerHTML = '<svg class="g"><use href="#g-check"/></svg> Copied';
      setTimeout(function () {
        btn.innerHTML = '<svg class="g"><use href="#g-copy"/></svg> Copy';
      }, 1600);
    });
  });

  /* ---------- converter (demo) ---------- */
  var convBtn = document.getElementById("btn-convert");
  if (convBtn) {
    convBtn.addEventListener("click", function () {
      var code = (document.getElementById("conv-code").value || "B3K9XQ2M").trim().toUpperCase();
      var out = document.getElementById("conv-out");
      var res = code.split("").reverse().join("");
      document.getElementById("conv-res").textContent = res;
      out.hidden = false;
    });
  }

  /* ---------- account drawer ---------- */
  var drawer = document.getElementById("drawer");
  var veil = document.getElementById("drawer-veil");
  function setDrawer(open) {
    drawer.hidden = !open;
    veil.hidden = !open;
  }
  ["btn-account", "btn-account-2"].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener("click", function () { setDrawer(true); });
  });
  document.getElementById("drawer-close").addEventListener("click", function () { setDrawer(false); });
  veil.addEventListener("click", function () { setDrawer(false); });
  drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setDrawer(false); });
  });

  /* ---------- demo auth flows ---------- */
  function go(hash) { return function (e) { e.preventDefault(); location.hash = hash; }; }
  var sf = document.getElementById("signup-form");
  if (sf) sf.addEventListener("submit", go("#/welcome"));
  var lf = document.getElementById("login-form");
  if (lf) lf.addEventListener("submit", go("#/book"));
  var g1 = document.getElementById("btn-google");
  if (g1) g1.addEventListener("click", go("#/welcome"));
  var g2 = document.getElementById("btn-google-2");
  if (g2) g2.addEventListener("click", go("#/book"));

  renderResult();

  /* password show/hide */
  document.querySelectorAll(".pw-eye").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  /* sportybet open (demo stub) */
  var sb = document.getElementById("btn-sportybet");
  if (sb) sb.addEventListener("click", function (e) { e.preventDefault(); });
})();
