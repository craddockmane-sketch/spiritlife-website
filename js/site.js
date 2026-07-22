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
}

/* ---------- TEACHINGS ---------- */
async function loadTeachings() {
  const grid = document.getElementById("teachGrid");
  if (!grid) return;

  const { data, error } = await supabaseClient
    .from("teachings")
    .select("*")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p style="color:rgba(255,255,255,.6)">Could not load teachings right now.</p>`;
    return;
  }
  if (!data || data.length === 0) {
    grid.innerHTML = `<p style="color:rgba(255,255,255,.6)">No teachings uploaded yet — check back soon.</p>`;
    return;
  }

  window.__ALL_TEACHINGS__ = data;
  renderTeachingGrid(data);
  buildYearFilters(data);
  setupRadio(data);
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

function setupRadio(items) {
  radioQueue = items;
  const toggle = document.getElementById("radioToggle");
  if (!toggle) return;
  if (!radioAudio) radioAudio = new Audio();

  radioAudio.addEventListener("ended", () => {
    radioIndex = (radioIndex + 1) % radioQueue.length;
    playRadioTrack(radioIndex);
  });

  toggle.addEventListener("click", () => {
    if (radioAudio.paused) {
      if (!radioAudio.src) playRadioTrack(0);
      else radioAudio.play();
      setRadioPlayingUI(true);
    } else {
      radioAudio.pause();
      setRadioPlayingUI(false);
    }
  });
}

function playRadioTrack(index) {
  const t = radioQueue[index];
  if (!t) return;
  radioAudio.src = t.audio_url;
  radioAudio.play();
  const label = document.getElementById("nowPlaying");
  if (label) label.textContent = t.title;
  setRadioPlayingUI(true);
}

function playTeaching(t) {
  radioIndex = radioQueue.findIndex(x => x.id === t.id);
  if (radioIndex === -1) radioIndex = 0;
  playRadioTrack(radioIndex);
}

function setRadioPlayingUI(playing) {
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const bar = document.getElementById("radioBar");
  if (!playIcon) return;
  playIcon.style.display = playing ? "none" : "block";
  pauseIcon.style.display = playing ? "block" : "none";
  if (bar) bar.classList.toggle("paused", !playing);
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

  list.innerHTML = data.map(ev => {
    const d = new Date(ev.event_date + "T00:00:00");
    return `
    <div class="event-row">
      <div class="event-date"><div class="day">${d.getDate()}</div><div class="mo">${months[d.getMonth()]}</div></div>
      <div class="event-info">
        <h4>${esc(ev.title)}</h4>
        <p>${esc(ev.description || "")}</p>
      </div>
      <div class="event-tag">${esc(ev.tag || "")}</div>
    </div>`;
  }).join("");
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
document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  loadSiteSettings();
  loadTeachings();
  loadEvents();
  setupContactForm();
});
