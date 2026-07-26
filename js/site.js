/* =========================================================
   SITE.JS
   Runs on every public page. Pulls live content from Supabase
   (site settings, teachings, events) and fills it into the
   page. If a page doesn't have a matching element, that part
   is simply skipped — safe to include on every page.
   ========================================================= */

function esc(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function waLink(number, message) {
  const clean = (number || "").replace(/[^0-9+]/g, "").replace(/^0/, "44").replace("+", "");
  const base = `https://wa.me/${clean}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/* ---------- SITE SETTINGS ---------- */
let __SITE_SETTINGS__ = null;

async function loadSiteSettings() {
  const { data, error } = await supabaseClient
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    console.warn("Could not load site settings, using defaults in the HTML.", error);
    return;
  }

  __SITE_SETTINGS__ = data;

  const map = {
    "[data-field='hero_title']": data.hero_title,
    "[data-field='hero_lead']": data.hero_lead,
    "[data-field='about_text_1']": data.about_text_1,
    "[data-field='about_text_2']": data.about_text_2,
    "[data-field='about_text_3']": data.about_text_3,
    "[data-field='sunday_time']": data.sunday_time,
    "[data-field='sunday_address']": data.sunday_address,
    "[data-field='prayer_time']": data.prayer_time,
    "[data-field='prayer_address']": data.prayer_address,
    "[data-field='online_time']": data.online_time,
    "[data-field='contact_phone']": data.contact_phone,
    "[data-field='contact_phone_display']": data.contact_phone_display,
    "[data-field='bank_account_name']": data.bank_account_name,
    "[data-field='bank_sort_code']": data.bank_sort_code,
    "[data-field='bank_account_number']": data.bank_account_number,
    "[data-field='contact_email']": data.contact_email,
  };

  Object.entries(map).forEach(([selector, value]) => {
    if (value === undefined || value === null || value === "") return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  });

  // WhatsApp links (need building, not just text)
  document.querySelectorAll("[data-wa='online-prayer']").forEach((el) => {
    el.href = waLink(
      data.contact_phone,
      "Hi, I am [your name]. I wish to partake in your online prayers, and would appreciate being added to the group."
    );
  });
  document.querySelectorAll("[data-wa='general']").forEach((el) => {
    el.href = waLink(data.contact_phone);
  });

  // Social links
  if (data.facebook_url) document.querySelectorAll("[data-social='facebook']").forEach(el => el.href = data.facebook_url);
  if (data.instagram_url) document.querySelectorAll("[data-social='instagram']").forEach(el => el.href = data.instagram_url);
  if (data.youtube_url) document.querySelectorAll("[data-social='youtube']").forEach(el => el.href = data.youtube_url);

  // Real photos in place of the default line-art placeholders, if uploaded
  applySpotPhoto("heroSection", data.hero_image_url, true);
  applySpotPhoto("aboutVisualHome", data.about_image_url);
  applySpotPhoto("aboutVisualMain", data.about_image_url);
  applySpotPhoto("sundaysVisual1", data.sundays_image_1_url);
  applySpotPhoto("sundaysVisual2", data.sundays_image_2_url);
}

function applySpotPhoto(elementId, imageUrl, isHero) {
  const el = document.getElementById(elementId);
  if (!el || !imageUrl) return;

  const wing = el.querySelector(".wing");
  if (wing) wing.style.display = "none";

  if (isHero) {
    // Layer the brand gradient over the photo so hero text stays readable
    el.style.backgroundImage = `linear-gradient(160deg, rgba(28,41,81,.82) 0%, rgba(28,41,81,.7) 38%, rgba(110,30,48,.75) 100%), url('${imageUrl}')`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  } else {
    el.style.backgroundImage = `url('${imageUrl}')`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  }
}

/* ---------- TEACHINGS ---------- */
async function loadTeachings() {
  const { data, error } = await supabaseClient
    .from("teachings")
    .select("*")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const grid = document.getElementById("teachGrid");

  if (error) {
    if (grid) grid.innerHTML = `<p style="color:rgba(255,255,255,.6)">Could not load teachings right now.</p>`;
    return;
  }

  window.__ALL_TEACHINGS__ = data || [];

  if (grid) {
    if (!data || data.length === 0) {
      grid.innerHTML = `<p style="color:rgba(255,255,255,.6)">No teachings uploaded yet — check back soon.</p>`;
    } else {
      renderTeachingGrid(data);
      buildYearFilters(data);
    }
  }

  // The radio/mini-player is set up on every page, even ones without a
  // visible teachings grid, so playback can continue as you browse the site.
  setupRadio(window.__ALL_TEACHINGS__);
}

function renderTeachingGrid(items) {
  const grid = document.getElementById("teachGrid");
  grid.innerHTML = items.map((t, i) => `
    <div class="teach-card">
      <div class="teach-cover" style="${t.cover_url ? `background-image:url('${esc(t.cover_url)}'); background-size:cover; background-position:center;` : ""}">
        ${!t.cover_url ? `<svg class="wing" viewBox="0 0 200 200" fill="none"><path d="M20 40C40 60 70 90 100 110C110 60 90 30 60 10" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>` : ""}
        <button class="teach-play" data-play-index="${i}" aria-label="Play"><svg viewBox="0 0 24 24" fill="#4A1420"><path d="M8 5v14l11-7z"/></svg></button>
      </div>
      <div class="teach-body">
        <p class="eyebrow">${esc(t.category)} &middot; ${esc(t.year)}</p>
        <h4>${esc(t.title)}</h4>
        <div class="teach-links">
          <a href="#" data-play-index="${i}">Play</a>
          <a href="${esc(t.audio_url)}" download>Download</a>
        </div>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-play-index]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const idx = parseInt(el.getAttribute("data-play-index"), 10);
      playTeaching(items[idx]);
    });
  });
}

function buildYearFilters(items) {
  const tabWrap = document.getElementById("filterTabs");
  if (!tabWrap) return;
  const years = [...new Set(items.map(t => t.year))].sort((a, b) => b - a);
  tabWrap.innerHTML = `<button class="active" data-year="all">All Years</button>` +
    years.map(y => `<button data-year="${y}">${y}</button>`).join("");

  tabWrap.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      tabWrap.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const year = btn.getAttribute("data-year");
      const filtered = year === "all" ? window.__ALL_TEACHINGS__ : window.__ALL_TEACHINGS__.filter(t => String(t.year) === year);
      renderTeachingGrid(filtered);
    });
  });
}

/* ---------- RADIO PLAYER ---------- */
let radioAudio = null;
let radioQueue = [];
let radioIndex = 0;
const RADIO_STATE_KEY = "spiritlife_radio_state";

function saveRadioState() {
  if (!radioAudio || !radioQueue[radioIndex]) return;
  try {
    sessionStorage.setItem(RADIO_STATE_KEY, JSON.stringify({
      teachingId: radioQueue[radioIndex].id,
      currentTime: radioAudio.currentTime,
      wasPlaying: !radioAudio.paused,
    }));
  } catch (e) { /* sessionStorage unavailable — playback still works, just won't resume across pages */ }
}

function setupRadio(items) {
  radioQueue = items || [];
  if (!radioAudio) radioAudio = new Audio();

  const bigToggle = document.getElementById("radioToggle");
  const miniToggle = document.getElementById("miniPlayerToggle");
  if (!bigToggle && !miniToggle) return;

  // Avoid double-binding if this ever runs twice on the same page.
  if (!radioAudio.__wired) {
    radioAudio.__wired = true;
    radioAudio.addEventListener("ended", () => {
      radioIndex = (radioIndex + 1) % radioQueue.length;
      playRadioTrack(radioIndex);
    });
    radioAudio.addEventListener("timeupdate", saveRadioState);
    radioAudio.addEventListener("pause", () => { saveRadioState(); setRadioPlayingUI(false); });
    radioAudio.addEventListener("play", () => { saveRadioState(); setRadioPlayingUI(true); });
    window.addEventListener("beforeunload", saveRadioState);
  }

  const handleToggleClick = () => {
    if (radioAudio.paused) {
      if (!radioAudio.src) playRadioTrack(0);
      else radioAudio.play().catch(() => {});
    } else {
      radioAudio.pause();
    }
  };
  if (bigToggle) bigToggle.addEventListener("click", handleToggleClick);
  if (miniToggle) miniToggle.addEventListener("click", handleToggleClick);

  tryResumeRadio();
}

function tryResumeRadio() {
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(RADIO_STATE_KEY) || "null");
  } catch (e) { return; }
  if (!saved || !radioQueue.length) return;

  const idx = radioQueue.findIndex(t => t.id === saved.teachingId);
  if (idx === -1) return;

  radioIndex = idx;
  radioAudio.src = radioQueue[idx].audio_url;
  radioAudio.currentTime = saved.currentTime || 0;
  updateNowPlayingLabels(radioQueue[idx].title);

  if (saved.wasPlaying) {
    radioAudio.play().catch(() => {
      // Browser blocked auto-resume without a fresh tap on this page —
      // show a one-tap prompt instead of failing silently.
      setRadioPlayingUI(false);
      updateNowPlayingLabels(radioQueue[idx].title, "Tap play to resume");
    });
  }
}

function playRadioTrack(index) {
  const t = radioQueue[index];
  if (!t) return;
  radioIndex = index;
  radioAudio.src = t.audio_url;
  radioAudio.play().catch(() => {});
  updateNowPlayingLabels(t.title);
}

function playTeaching(t) {
  radioIndex = radioQueue.findIndex(x => x.id === t.id);
  if (radioIndex === -1) radioIndex = 0;
  playRadioTrack(radioIndex);
}

function updateNowPlayingLabels(title, subtitle) {
  const bigLabel = document.getElementById("nowPlaying");
  if (bigLabel) bigLabel.textContent = title;

  const miniLabel = document.getElementById("miniNowPlaying");
  if (miniLabel) miniLabel.textContent = title;

  const miniSub = document.getElementById("miniNowPlayingSub");
  if (miniSub) miniSub.textContent = subtitle || "Playing now";
}

function setRadioPlayingUI(playing) {
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const bar = document.getElementById("radioBar");
  if (playIcon) playIcon.style.display = playing ? "none" : "block";
  if (pauseIcon) pauseIcon.style.display = playing ? "block" : "none";
  if (bar) bar.classList.toggle("paused", !playing);

  const miniPlayIcon = document.getElementById("miniPlayIcon");
  const miniPauseIcon = document.getElementById("miniPauseIcon");
  const miniPlayer = document.getElementById("miniPlayer");
  if (miniPlayIcon) miniPlayIcon.style.display = playing ? "none" : "block";
  if (miniPauseIcon) miniPauseIcon.style.display = playing ? "block" : "none";
  if (miniPlayer) miniPlayer.classList.toggle("paused", !playing);
}

/* ---------- EVENTS ---------- */
async function loadEvents() {
  const list = document.getElementById("eventsList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error || !data || data.length === 0) {
    list.innerHTML = `<p class="events-note">No upcoming events posted yet — check back soon.</p>`;
    return;
  }

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const phone = __SITE_SETTINGS__ ? __SITE_SETTINGS__.contact_phone : "";
  const phoneDisplay = __SITE_SETTINGS__ ? __SITE_SETTINGS__.contact_phone_display : "";

  list.innerHTML = data.map(ev => {
    const d = new Date(ev.event_date + "T00:00:00");
    const dateLabel = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const waMessage = `Hi, I am [your name]. I'd like to find out more about "${ev.title}" and confirm I'll be attending.`;
    return `
    <div class="event-row ${ev.image_url ? "has-image" : ""}">
      ${ev.image_url ? `<img class="event-flyer" src="${esc(ev.image_url)}" alt="${esc(ev.title)} flyer">` : ""}
      <div class="event-date"><div class="day">${d.getDate()}</div><div class="mo">${months[d.getMonth()]}</div></div>
      <div class="event-info">
        <h4>${esc(ev.title)}</h4>
        <p>${esc(ev.description || "")}</p>
        <div class="event-actions">
          <a href="${waLink(phone, waMessage)}" target="_blank" rel="noopener" class="event-action-btn wa">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.35A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.2 14.2c-.22.62-1.28 1.18-1.77 1.25-.45.07-1.02.1-1.65-.1-.38-.12-.87-.28-1.5-.55-2.64-1.14-4.36-3.8-4.5-3.98-.13-.18-1.08-1.43-1.08-2.73s.68-1.93.93-2.2c.24-.26.53-.32.7-.32h.5c.16 0 .38-.03.58.44.22.53.75 1.83.82 1.96.07.13.11.29.02.47-.09.18-.13.29-.27.44-.13.16-.28.35-.4.47-.13.13-.27.27-.12.53.16.26.71 1.17 1.52 1.9 1.04.94 1.92 1.23 2.18 1.37.26.13.4.11.55-.07.16-.18.68-.79.86-1.06.18-.26.36-.22.6-.13.24.09 1.55.73 1.82.87.26.13.44.2.5.31.07.13.07.71-.15 1.33z"/></svg>
            WhatsApp
          </a>
          <a href="tel:${esc(phone)}" class="event-action-btn call">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg>
            Call ${esc(phoneDisplay)}
          </a>
        </div>
      </div>
      <div class="event-tag">${esc(ev.tag || "")}</div>
    </div>`;
  }).join("");
}

/* ---------- GALLERY ---------- */
async function loadGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const { data, error } = await supabaseClient
    .from("gallery_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    grid.innerHTML = `<p class="gallery-empty">No photos uploaded yet — check back soon.</p>`;
    return;
  }

  grid.innerHTML = data.map(img => `
    <div class="gallery-item" data-full="${esc(img.image_url)}">
      <img src="${esc(img.image_url)}" alt="${esc(img.caption || "SpiritLife International")}" loading="lazy">
    </div>
  `).join("");

  setupLightbox();
}

function setupLightbox() {
  const overlay = document.getElementById("lightboxOverlay");
  const closeBtn = document.getElementById("lightboxClose");
  const imgEl = document.getElementById("lightboxImage");
  if (!overlay) return;

  document.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", () => {
      imgEl.src = item.getAttribute("data-full");
      overlay.classList.add("active");
    });
  });

  const closeLightbox = () => overlay.classList.remove("active");
  closeBtn.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

/* ---------- CONTACT FORM ---------- */
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    // Formspree handles the actual submission via the form's action attribute.
    // This just gives the visitor a friendly confirmation instead of a page reload.
    e.preventDefault();
    const status = document.getElementById("formStatus");
    const data = new FormData(form);
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        form.reset();
        status.textContent = "Thank you — your message has been sent. We'll get back to you soon.";
        status.style.color = "var(--maroon)";
      } else {
        status.textContent = "Something went wrong. Please try again, or contact us by phone/WhatsApp.";
      }
    } catch (err) {
      status.textContent = "Something went wrong. Please try again, or contact us by phone/WhatsApp.";
    }
  });
}

/* ---------- MOBILE MENU ---------- */
function setupMobileMenu() {
  const btn = document.querySelector(".menu-btn");
  const nav = document.querySelector("nav.links");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("mobile-open");
    btn.classList.toggle("open", isOpen);
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close the menu after tapping a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("mobile-open");
      btn.classList.remove("open");
    });
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  await loadSiteSettings();
  loadTeachings();
  loadEvents();
  loadGallery();
  setupContactForm();
});
