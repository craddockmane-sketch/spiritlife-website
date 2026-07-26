/* =========================================================
   ANALYTICS + COOKIE CONSENT
   =========================================================
   Paste your Google Analytics Measurement ID below once you've
   created a GA4 property (Step 10 in README.md). It looks like
   "G-XXXXXXXXXX".

   Until a visitor clicks "Accept" on the cookie banner, NO
   analytics script loads and NO cookie is set — this keeps the
   site legally compliant with UK/EU cookie law.
   ========================================================= */

const GA_MEASUREMENT_ID = "PASTE_YOUR_GA_MEASUREMENT_ID_HERE";

const CONSENT_KEY = "spiritlife_cookie_consent";

function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith("PASTE_YOUR")) return;
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}
function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
}

function initCookieConsent() {
  const banner = document.getElementById("cookieBanner");
  const acceptBtn = document.getElementById("cookieAccept");
  const declineBtn = document.getElementById("cookieDecline");
  const settingsLink = document.getElementById("cookieSettingsLink");
  if (!banner) return;

  const existing = getConsent();
  if (existing === "accepted") {
    loadGoogleAnalytics();
  } else if (existing === null) {
    banner.classList.add("show");
  }

  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      setConsent("accepted");
      banner.classList.remove("show");
      loadGoogleAnalytics();
    });
  }
  if (declineBtn) {
    declineBtn.addEventListener("click", () => {
      setConsent("declined");
      banner.classList.remove("show");
    });
  }
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      banner.classList.add("show");
    });
  }
}

document.addEventListener("DOMContentLoaded", initCookieConsent);
