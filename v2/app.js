/* SportyPunter v2 redesign - demo behavior (stub backend) */
(function () {
  "use strict";

  var MARKETING = ["home", "signup", "login", "welcome"];
  var APP = ["book", "progress", "result", "plans", "convert", "two-odds"];
  var FLOW = ["book", "progress", "result"]; // focused baseline flow: no app chrome

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
    shell.classList.toggle("flow-mode", FLOW.indexOf(hash) !== -1);
    shell.classList.toggle("show-nav", hash === "result");
    nav.classList.toggle("active", hash === "home");
    foot.classList.toggle("active", hash === "home");

    document.querySelectorAll(".bottom-nav a, .bottom-nav button").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-nav") === hash);
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();

  /* ---------- booking flow: one question per screen (baseline /start) ---------- */
  var STEP_TITLES = ["When are you playing?", "How do you want to play?", "Pick your target odds"];
  var state = { window: "today", risk: "safe", band: "2-5" };
  var step = 0;
  var fsteps = Array.prototype.slice.call(document.querySelectorAll(".fstep"));
  var backBtn = document.getElementById("flow-back");
  var fprog = document.getElementById("fprog");
  var fcount = document.getElementById("fcount");

  function renderStep() {
    fsteps.forEach(function (s) {
      s.classList.toggle("on", Number(s.getAttribute("data-fstep")) === step);
    });
    backBtn.style.visibility = step === 0 ? "hidden" : "visible";
    var segs = fprog.querySelectorAll("span");
    segs.forEach(function (seg, i) {
      seg.classList.toggle("fill", i <= step);
    });
    fprog.setAttribute("aria-valuenow", String(step + 1));
    fcount.textContent = (step + 1) + "/3";
  }

  document.querySelectorAll("[data-pick]").forEach(function (el) {
    el.addEventListener("click", function () {
      var kind = el.getAttribute("data-pick");
      state[kind] = el.getAttribute("data-value");
      document.querySelectorAll('[data-pick="' + kind + '"]').forEach(function (peer) {
        var on = peer === el;
        peer.classList.toggle("sel", on);
        peer.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
  });

  document.querySelectorAll(".flow-next").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (step < 2) { step++; renderStep(); window.scrollTo(0, 0); }
    });
  });
  backBtn.addEventListener("click", function () {
    if (step > 0) { step--; renderStep(); }
  });

  var detailToggle = document.getElementById("detail-toggle");
  if (detailToggle) {
    detailToggle.addEventListener("click", function () {
      var panel = document.getElementById("detail-panel");
      var open = panel.hidden;
      panel.hidden = !open;
      detailToggle.setAttribute("aria-expanded", open ? "true" : "false");
      detailToggle.classList.toggle("open", open);
    });
  }

  /* preselect baseline defaults */
  document.querySelectorAll("[data-pick]").forEach(function (el) {
    var kind = el.getAttribute("data-pick");
    var on = state[kind] === el.getAttribute("data-value");
    el.classList.toggle("sel", on);
    el.setAttribute("aria-checked", on ? "true" : "false");
  });
  renderStep();

  document.getElementById("btn-book").addEventListener("click", function () {
    location.hash = "#/progress";
    runBuild();
  });

  /* ---------- build phase (baseline staged lines, shortened for the demo) ---------- */
  var BUILD_LINES = ["Reading today's fixtures", "Checking team form", "Building your slip", "Booking your code"];
  var buildTimers = [];
  function runBuild() {
    var line = document.getElementById("build-line");
    var fill = document.getElementById("build-fill");
    buildTimers.forEach(clearTimeout);
    buildTimers = [];
    line.textContent = BUILD_LINES[0];
    fill.style.transition = "none";
    fill.style.transform = "scaleX(0)";
    void fill.offsetWidth;
    fill.style.transition = "";
    fill.style.transitionDuration = (BUILD_LINES.length * 1.1) + "s";
    fill.style.transform = "scaleX(1)";
    BUILD_LINES.forEach(function (_, i) {
      buildTimers.push(setTimeout(function () {
        line.textContent = BUILD_LINES[i];
        line.classList.remove("sp-rise");
        void line.offsetWidth;
        line.classList.add("sp-rise");
      }, i * 1100));
    });
    buildTimers.push(setTimeout(function () {
      location.hash = "#/result";
    }, BUILD_LINES.length * 1100 + 400));
  }

  /* ---------- result (baseline done phase) ---------- */
  var picksToggle = document.getElementById("picks-toggle");
  if (picksToggle) {
    picksToggle.addEventListener("click", function () {
      var list = document.getElementById("picks-list");
      var open = list.hidden;
      list.hidden = !open;
      picksToggle.setAttribute("aria-expanded", open ? "true" : "false");
      picksToggle.classList.toggle("open", open);
    });
  }
  var restart = document.getElementById("btn-restart");
  if (restart) {
    restart.addEventListener("click", function () {
      step = 0;
      renderStep();
      location.hash = "#/book";
    });
  }

  /* ---------- copy buttons ---------- */
  function bindCopy(id, getText, label) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var t = getText();
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      btn.innerHTML = '<svg class="g"><use href="#g-check"/></svg> Copied';
      setTimeout(function () {
        btn.innerHTML = '<svg class="g"><use href="#g-copy"/></svg> ' + label;
      }, 1600);
    });
  }
  bindCopy("btn-copy", function () { return document.getElementById("res-code").textContent; }, "Copy booking code");
  bindCopy("btn-copy-conv", function () { return document.getElementById("conv-res").textContent; }, "Copy");
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
  var converterNotice = document.createElement("p");
  converterNotice.className = "demo-banner";
  converterNotice.textContent = "Demo only. No real codes are converted.";
  document.querySelector("[data-view=convert]").insertBefore(converterNotice, document.querySelector("[data-view=convert]").children[1]);
  var convBtn = document.getElementById("btn-convert");
  if (convBtn) {
    convBtn.addEventListener("click", function () {
      var code = (document.getElementById("conv-code").value || "DEMO0001").trim().toUpperCase();
      var out = document.getElementById("conv-out");
      var res = "DEMO0003";
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

  /* ---------- referral code disclosure (signup) ---------- */
  var refToggle = document.getElementById("ref-toggle");
  if (refToggle) {
    refToggle.addEventListener("click", function () {
      var body = document.getElementById("ref-body");
      var open = body.hidden;
      body.hidden = !open;
      refToggle.setAttribute("aria-expanded", open ? "true" : "false");
      refToggle.classList.toggle("open", open);
    });
  }

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

  /* password show/hide */
  document.querySelectorAll(".pw-eye").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
    });
  });
})();
