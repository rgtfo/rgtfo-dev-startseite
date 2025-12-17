document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
     Dev date override
     Set DEV_DATE to a string "DD.MM.YYYY" to force a date for testing.
     Set to null to use the real Europe/Rome date.
  ========================= */
  const DEV_DATE = null;

  /* ---------------------
     Dark mode toggle + backgrounds
  --------------------- */
  const html = document.documentElement;
  const toggle = document.getElementById("dark-mode-toggle");

  let isDarkMode;
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "enabled") isDarkMode = true;
  else if (savedMode === "disabled") isDarkMode = false;
  else
    isDarkMode =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

  html.classList.toggle("dark", isDarkMode);

  let lightBg = localStorage.getItem("lightBg") || "/images/bg-light.png";
  let darkBg = localStorage.getItem("darkBg") || "/images/bg.png";

  // Only save defaults if not set
  if (!localStorage.getItem("lightBg"))
    localStorage.setItem("lightBg", lightBg);
  if (!localStorage.getItem("darkBg")) localStorage.setItem("darkBg", darkBg);

  // Preload images before applying to prevent flashing
  function preloadImage(src, cb) {
    const img = new Image();
    img.onload = cb;
    img.src = src;
  }

  function applyTheme() {
    const bg = isDarkMode ? darkBg : lightBg;
    document.body.style.backgroundImage = `url("${bg}")`;
  }

  preloadImage(isDarkMode ? darkBg : lightBg, applyTheme);

  if (toggle) {
    toggle.addEventListener("click", () => {
      isDarkMode = !isDarkMode;
      html.classList.toggle("dark", isDarkMode);
      localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
      applyTheme();
      showOverlayOnSpecialDays();
    });
  }

  // --- Google Analytics ---
  const script = document.createElement("script");
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-24W2ENS4EZ";
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-24W2ENS4EZ");

  /* ---------------------
     Edit button: upload/reset background
  --------------------- */
  const editButton = document.querySelector(".edit-button");
  if (editButton) {
    editButton.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = ev.target.result;
            if (isDarkMode) {
              darkBg = data;
              localStorage.setItem("darkBg", data);
            } else {
              lightBg = data;
              localStorage.setItem("lightBg", data);
            }
            applyTheme();
          } catch {
            alert(
              "Die Datei ist zu groß! Das Speicherlimit wurde überschritten."
            );
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

    // Right-click reset
    editButton.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (isDarkMode) {
        darkBg = "/images/bg.png";
        localStorage.setItem("darkBg", darkBg);
      } else {
        lightBg = "/images/bg-light.png";
        localStorage.setItem("lightBg", lightBg);
      }
      applyTheme();
      alert("Hintergrundbild wurde zurückgesetzt!");
    });
  }

  /* ==========================
     Special days overlay logic
  ========================== */
  function parseDevDate(str) {
    if (!str) return null;
    const [dd, mm, yyyy] = str.split(".").map(Number);
    if ([dd, mm, yyyy].some(isNaN)) return null;
    return { day: dd, month: mm - 1, year: yyyy };
  }

  function getCurrentDate() {
    if (DEV_DATE) {
      const parsed = parseDevDate(DEV_DATE);
      if (parsed) return parsed;
      console.warn("DEV_DATE invalid, falling back to real Rome date.");
    }
    const now = new Date();
    const rome = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
    );
    return {
      day: rome.getDate(),
      month: rome.getMonth(),
      year: rome.getFullYear(),
    };
  }

  function getEasterDate(year) {
    const f = Math.floor;
    const a = year % 19;
    const b = f(year / 100);
    const c = year % 100;
    const d = f(b / 4);
    const e = b % 4;
    const g = f((8 * b + 13) / 25);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = f(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = f((a + 11 * h + 22 * l) / 451);
    const month = f((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month, day };
  }

  const overlayElements = {};
  document.querySelectorAll('[id$="-overlay"]').forEach((el) => {
    overlayElements[el.id] = el;
  });

  function hideAllOverlays() {
    Object.values(overlayElements).forEach((el) => {
      el.style.display = "none";
      el.style.animation = "";
    });
  }

  function showOverlayOnSpecialDays() {
    hideAllOverlays();
    const today = getCurrentDate();
    if (!today) return;

    const easter = getEasterDate(today.year);

    const events = [
      { id: "violence-overlay", month: 10, day: 25 },
      { id: "halloween-overlay", month: 9, day: 31 },
      { id: "easter-overlay", month: easter.month, day: easter.day },
    ];

    // Christmas 17-31 Dec
    if (today.month === 11 && today.day >= 17 && today.day <= 31) {
      const overlay = overlayElements["christmas-overlay"];
      if (overlay) {
        overlay.style.display = "block";
        overlay.style.animation = "fadeInOverlay 0.8s ease forwards";
        startSnow();
      }
    }

    events.forEach(({ id, month, day }) => {
      if (today.month === month && today.day === day) {
        const overlay = overlayElements[id];
        if (overlay) {
          overlay.style.display = "block";
          overlay.style.animation = "fadeInOverlay 0.8s ease forwards";
        }
      }
    });
  }

  /* ==========================
     Snow effect
  ========================== */
  function startSnow() {
    const canvas = document.getElementById("snow-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const flakes = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 2,
      d: Math.random() + 1,
    }));

    let angle = 0;

    function drawFlakes() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "white";
      ctx.beginPath();
      flakes.forEach((f) => {
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      });
      ctx.fill();
      moveFlakes();
    }

    function moveFlakes() {
      angle += 0.01;
      flakes.forEach((f) => {
        f.y += Math.pow(f.d, 2) + 1;
        f.x += Math.sin(angle) * 0.5;
        if (f.y > height) {
          f.y = 0;
          f.x = Math.random() * width;
        }
      });
    }

    function animate() {
      drawFlakes();
      requestAnimationFrame(animate);
    }
    animate();

    let resizeRAF;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });
    });
  }

  /* ==========================
     Secret ChatGPT Search Mode
  ========================== */
  const searchForm = document.getElementById("search-form");
  const searchBox = document.getElementById("search-box");

  function applySearchEngine() {
    if (!searchForm || !searchBox) return;
    const chatMode = localStorage.getItem("chatgptSearch") === "enabled";
    if (chatMode) {
      searchForm.action = "https://chat.openai.com/";
      searchForm.method = "GET";
      searchForm.target = "_blank";
      searchBox.placeholder = "Suche mit ChatGPT";
      searchForm.onsubmit = (e) => {
        e.preventDefault();
        const query = String(searchBox.value || "").trim();
        if (!query) return;
        window.open(
          `https://chat.openai.com/?q=${encodeURIComponent(query)}`,
          "_blank"
        );
      };
    } else {
      searchForm.action = "https://www.google.com/search";
      searchForm.method = "GET";
      searchForm.target = "_blank";
      searchBox.placeholder = "Websuche mit Google";
      searchForm.onsubmit = null;
    }
  }

  applySearchEngine();

  window.enableChatGPTSearch = () => {
    localStorage.setItem("chatgptSearch", "enabled");
    applySearchEngine();
    console.log(
      "%cChatGPT Suche aktiviert!",
      "color: green; font-weight: bold;"
    );
  };

  window.disableChatGPTSearch = () => {
    localStorage.setItem("chatgptSearch", "disabled");
    applySearchEngine();
    console.log(
      "%cChatGPT Suche deaktiviert!",
      "color: orange; font-weight: bold;"
    );
  };

  // Manual overlay refresh
  window.refreshOverlays = showOverlayOnSpecialDays;

  // Initial overlay run
  showOverlayOnSpecialDays();
});


