/* =========================================================
   ADMIN.JS — powers /admin.html
   ========================================================= */

const loginWrap = document.getElementById("loginWrap");
const adminShell = document.getElementById("adminShell");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

/* ---------- AUTH ---------- */
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginWrap.style.display = "flex";
  adminShell.classList.remove("active");
}

function showDashboard() {
  loginWrap.style.display = "none";
  adminShell.classList.add("active");
  loadTeachingsAdmin();
  loadEventsAdmin();
  loadSettingsForm();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = "Incorrect email or password. Please try again.";
    return;
  }
  showDashboard();
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

/* ---------- TAB SWITCHING ---------- */
document.querySelectorAll(".admin-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.panel).classList.add("active");
  });
});

/* ---------- MODAL HELPERS ---------- */
function openModal(id) { document.getElementById(id).classList.add("active"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }
document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
});

/* =========================================================
   IMAGE COMPRESSION
   Resizes and compresses cover art in the browser before it's
   uploaded, so a multi-MB phone photo becomes a small, web-ready
   file (typically 30–150KB) — keeping Supabase's 1GB free storage
   lasting for hundreds of teachings instead of a couple dozen.
   ========================================================= */
function compressImage(file, maxDimension = 900, targetKB = 150) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until the file is under the target size,
      // or we hit a sensible floor so the image doesn't look bad.
      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          const sizeKB = blob.size / 1024;
          if (sizeKB <= targetKB || quality <= 0.4) {
            resolve(blob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, "image/jpeg", quality);
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error("Could not read image file"));
  });
}

/* =========================================================
   TEACHINGS
   ========================================================= */
async function loadTeachingsAdmin() {
  const tbody = document.getElementById("teachingsTableBody");
  const { data, error } = await supabaseClient
    .from("teachings")
    .select("*")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Could not load teachings.</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">No teachings yet. Click "Add Teaching" to upload your first one.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((t) => `
    <tr>
      <td>${t.cover_url ? `<img class="thumb" src="${t.cover_url}">` : `<div class="thumb" style="background:var(--maroon)"></div>`}</td>
      <td><strong>${t.title}</strong></td>
      <td>${t.category}</td>
      <td>${t.year}</td>
      <td>
        <div class="row-actions">
          <button onclick="editTeaching('${t.id}')">Edit</button>
          <button class="danger" onclick="deleteTeaching('${t.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

document.getElementById("addTeachingBtn").addEventListener("click", () => {
  document.getElementById("teachingForm").reset();
  document.getElementById("teachingId").value = "";
  document.getElementById("teachingModalTitle").textContent = "Add Teaching";
  openModal("teachingModal");
});

window.editTeaching = async function (id) {
  const { data } = await supabaseClient.from("teachings").select("*").eq("id", id).single();
  if (!data) return;
  document.getElementById("teachingId").value = data.id;
  document.getElementById("teachingTitle").value = data.title;
  document.getElementById("teachingCategory").value = data.category;
  document.getElementById("teachingYear").value = data.year;
  document.getElementById("teachingAudioUrl").value = data.audio_url;
  document.getElementById("teachingCoverUrl").value = data.cover_url || "";
  document.getElementById("teachingModalTitle").textContent = "Edit Teaching";
  openModal("teachingModal");
};

window.deleteTeaching = async function (id) {
  if (!confirm("Delete this teaching? This cannot be undone.")) return;
  await supabaseClient.from("teachings").delete().eq("id", id);
  loadTeachingsAdmin();
};

document.getElementById("teachingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("teachingId").value;
  const coverFile = document.getElementById("teachingCoverFile").files[0];
  let coverUrl = document.getElementById("teachingCoverUrl").value;

  if (coverFile) {
    let compressedBlob;
    try {
      compressedBlob = await compressImage(coverFile);
    } catch (err) {
      alert("Could not process that image. Please try a different file.");
      return;
    }
    const fileName = `${Date.now()}-cover.jpg`;
    const { error: uploadError } = await supabaseClient.storage
      .from("covers")
      .upload(fileName, compressedBlob, { contentType: "image/jpeg" });
    if (uploadError) {
      alert("Cover image upload failed: " + uploadError.message);
      return;
    }
    const { data: urlData } = supabaseClient.storage.from("covers").getPublicUrl(fileName);
    coverUrl = urlData.publicUrl;
  }

  const payload = {
    title: document.getElementById("teachingTitle").value,
    category: document.getElementById("teachingCategory").value,
    year: parseInt(document.getElementById("teachingYear").value, 10),
    audio_url: document.getElementById("teachingAudioUrl").value,
    cover_url: coverUrl || null,
  };

  const { error } = id
    ? await supabaseClient.from("teachings").update(payload).eq("id", id)
    : await supabaseClient.from("teachings").insert(payload);

  if (error) {
    alert("Could not save: " + error.message);
    return;
  }
  closeModal("teachingModal");
  loadTeachingsAdmin();
});

/* =========================================================
   EVENTS
   ========================================================= */
async function loadEventsAdmin() {
  const tbody = document.getElementById("eventsTableBody");
  const { data, error } = await supabaseClient.from("events").select("*").order("event_date", { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4">Could not load events.</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4">No events yet. Click "Add Event" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((ev) => `
    <tr>
      <td>${ev.image_url ? `<img class="thumb" src="${ev.image_url}">` : `<div class="thumb" style="background:var(--navy)"></div>`}</td>
      <td><strong>${ev.title}</strong></td>
      <td>${new Date(ev.event_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
      <td>${ev.tag || ""}</td>
      <td>
        <div class="row-actions">
          <button onclick="editEvent('${ev.id}')">Edit</button>
          <button class="danger" onclick="deleteEvent('${ev.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

document.getElementById("addEventBtn").addEventListener("click", () => {
  document.getElementById("eventForm").reset();
  document.getElementById("eventId").value = "";
  document.getElementById("eventImageUrl").value = "";
  document.getElementById("eventModalTitle").textContent = "Add Event";
  openModal("eventModal");
});

window.editEvent = async function (id) {
  const { data } = await supabaseClient.from("events").select("*").eq("id", id).single();
  if (!data) return;
  document.getElementById("eventId").value = data.id;
  document.getElementById("eventTitle").value = data.title;
  document.getElementById("eventDescription").value = data.description || "";
  document.getElementById("eventDate").value = data.event_date;
  document.getElementById("eventTag").value = data.tag || "";
  document.getElementById("eventImageUrl").value = data.image_url || "";
  document.getElementById("eventModalTitle").textContent = "Edit Event";
  openModal("eventModal");
};

window.deleteEvent = async function (id) {
  if (!confirm("Delete this event?")) return;
  await supabaseClient.from("events").delete().eq("id", id);
  loadEventsAdmin();
};

document.getElementById("eventForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("eventId").value;
  const imageFile = document.getElementById("eventImageFile").files[0];
  let imageUrl = document.getElementById("eventImageUrl").value;

  if (imageFile) {
    let compressedBlob;
    try {
      compressedBlob = await compressImage(imageFile);
    } catch (err) {
      alert("Could not process that image. Please try a different file.");
      return;
    }
    const fileName = `${Date.now()}-event.jpg`;
    const { error: uploadError } = await supabaseClient.storage
      .from("covers")
      .upload(fileName, compressedBlob, { contentType: "image/jpeg" });
    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      return;
    }
    const { data: urlData } = supabaseClient.storage.from("covers").getPublicUrl(fileName);
    imageUrl = urlData.publicUrl;
  }

  const payload = {
    title: document.getElementById("eventTitle").value,
    description: document.getElementById("eventDescription").value,
    event_date: document.getElementById("eventDate").value,
    tag: document.getElementById("eventTag").value,
    image_url: imageUrl || null,
  };

  const { error } = id
    ? await supabaseClient.from("events").update(payload).eq("id", id)
    : await supabaseClient.from("events").insert(payload);

  if (error) {
    alert("Could not save: " + error.message);
    return;
  }
  closeModal("eventModal");
  loadEventsAdmin();
});

/* =========================================================
   SITE SETTINGS
   ========================================================= */
async function loadSettingsForm() {
  const { data, error } = await supabaseClient.from("site_settings").select("*").eq("id", 1).single();
  if (error || !data) return;

  const fields = [
    "hero_title", "hero_lead", "about_text_1", "about_text_2", "about_text_3",
    "sunday_time", "sunday_address", "prayer_time", "prayer_address", "online_time",
    "contact_phone", "contact_phone_display", "contact_email",
    "bank_account_name", "bank_sort_code", "bank_account_number",
    "facebook_url", "instagram_url", "youtube_url",
  ];
  fields.forEach((f) => {
    const el = document.getElementById("set_" + f);
    if (el) el.value = data[f] || "";
  });
}

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fields = [
    "hero_title", "hero_lead", "about_text_1", "about_text_2", "about_text_3",
    "sunday_time", "sunday_address", "prayer_time", "prayer_address", "online_time",
    "contact_phone", "contact_phone_display", "contact_email",
    "bank_account_name", "bank_sort_code", "bank_account_number",
    "facebook_url", "instagram_url", "youtube_url",
  ];
  const payload = {};
  fields.forEach((f) => {
    const el = document.getElementById("set_" + f);
    if (el) payload[f] = el.value;
  });

  const { error } = await supabaseClient.from("site_settings").update(payload).eq("id", 1);
  const note = document.getElementById("settingsSaveNote");
  if (error) {
    note.textContent = "Could not save: " + error.message;
    note.style.color = "#B23A48";
  } else {
    note.textContent = "Saved! Changes are now live on the website.";
    note.style.color = "var(--maroon)";
  }
  note.classList.add("show");
  setTimeout(() => note.classList.remove("show"), 4000);
});

/* ---------- INIT ---------- */
checkSession();
