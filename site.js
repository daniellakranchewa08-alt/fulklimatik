/* =====================================================================
   НАСТРОЙКИ – попълнете фирмените данни тук. Те се показват автоматично
   навсякъде в сайта (футър, контакти, политика, условия).
   ===================================================================== */
const COMPANY = {
  name: "„Фул Клима Сървисиз“ ЕООД",
  eik: "000000000",                       // ← ЕИК от Търговския регистър
  address: "кв. Васил Левски, ул. „Велбъжд“ 54, 1517 София",
  email: "office@example.bg",             // ← имейл на фирмата
  phone: "088 670 5409",
  phoneHref: "+359886705409",
  manager: "[Име на управителя]"          // ← управител (за правните страници)
};

/* Къде да се изпращат запитванията от формата.
   Оставете празно – формата ще отвори имейл клиента на посетителя с готово писмо.
   Или поставете адрес от Formspree / Web3Forms / собствен сървър, напр.:
   "https://formspree.io/f/xxxxxxx"                                         */
const FORM_ENDPOINT = "";

/* Скриптове, които се зареждат САМО след „Приемам“ в банера за бисквитки
   (напр. Google Analytics, Meta Pixel). Сега няма такива. */
function loadOptionalScripts() {
  // Пример:
  // const s = document.createElement('script');
  // s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXX'; s.async = true;
  // document.head.appendChild(s);
}

/* ===================================================================== */

const CONSENT_KEY = "fk_cookie_consent";

function storageGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
function storageSet(key, val) { try { window.localStorage.setItem(key, val); } catch (e) { /* няма достъп */ } }

/* --- Фирмени данни в страницата --- */
function fillCompanyData() {
  document.querySelectorAll("[data-company]").forEach(el => {
    const key = el.getAttribute("data-company");
    if (COMPANY[key] !== undefined) el.textContent = COMPANY[key];
  });
  document.querySelectorAll("[data-company-mail]").forEach(el => { el.href = "mailto:" + COMPANY.email; });
  document.querySelectorAll("[data-company-tel]").forEach(el => { el.href = "tel:" + COMPANY.phoneHref; });
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
}

/* --- Мобилно меню --- */
function initMobileMenu() {
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;
  const icon = btn.querySelector(".material-symbols-outlined");
  const close = () => { menu.classList.add("hidden"); btn.setAttribute("aria-expanded", "false"); if (icon) icon.textContent = "menu"; };
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("hidden") === false;
    btn.setAttribute("aria-expanded", String(open));
    if (icon) icon.textContent = open ? "close" : "menu";
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
}

/* --- Филтър и каталог на услугите --- */
let currentFilter = "all";
let catalogOpen = false;
function applyServiceVisibility() {
  document.querySelectorAll("#services-grid .service-item").forEach(item => {
    const matches = currentFilter === "all" || item.dataset.category === currentFilter;
    const extraHidden = item.dataset.extra === "true" && !catalogOpen && currentFilter === "all";
    item.classList.toggle("hidden", !matches || extraHidden);
  });
}
function filterServices(category, btn) {
  currentFilter = category;
  document.querySelectorAll("#services-filter-buttons .service-tab-btn").forEach(b => {
    b.classList.remove("bg-primary-container", "text-on-primary");
    b.classList.add("bg-surface-container", "text-on-surface");
    b.setAttribute("aria-pressed", "false");
  });
  btn.classList.remove("bg-surface-container", "text-on-surface");
  btn.classList.add("bg-primary-container", "text-on-primary");
  btn.setAttribute("aria-pressed", "true");
  const toggleWrap = document.getElementById("catalog-toggle-wrap");
  if (toggleWrap) toggleWrap.classList.toggle("hidden", category !== "all");
  applyServiceVisibility();
}
function toggleCatalog() {
  catalogOpen = !catalogOpen;
  const t = document.getElementById("toggle-text");
  const i = document.getElementById("toggle-icon");
  const total = document.querySelectorAll("#services-grid .service-item").length;
  if (t) t.textContent = catalogOpen ? "Скрий допълнителните услуги" : `Вижте пълния каталог (${total} услуги)`;
  if (i) i.style.transform = catalogOpen ? "rotate(180deg)" : "";
  applyServiceVisibility();
}

/* Бутоните „Заяви“ в картите попълват услугата във формата */
function initServiceRequestLinks() {
  document.querySelectorAll("[data-request-service]").forEach(a => {
    a.addEventListener("click", () => {
      const sel = document.getElementById("f-service");
      if (sel) sel.value = a.getAttribute("data-request-service");
    });
  });
}

/* --- Форма за запитване --- */
function showFormStatus(type, html) {
  const box = document.getElementById("form-status");
  if (!box) return;
  const styles = {
    ok: "bg-secondary-fixed/50 text-on-secondary-fixed border border-secondary-fixed-dim",
    err: "bg-error-container text-on-error-container border border-error/30"
  };
  box.className = "rounded-lg px-space-md py-space-sm font-body-sm text-body-sm " + styles[type];
  box.innerHTML = html;
  box.classList.remove("hidden");
}

function initForm() {
  const form = document.getElementById("quick-booking-form");
  if (!form) return;
  const consent = document.getElementById("f-consent");
  const consentErr = document.getElementById("consent-error");

  consent.addEventListener("change", () => {
    if (consent.checked) { consent.classList.remove("fk-error"); consentErr.classList.add("hidden"); }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!consent.checked) {
      consent.classList.add("fk-error");
      consentErr.classList.remove("hidden");
      consent.focus();
      return;
    }
    if (!form.reportValidity()) return;
    if (form.website && form.website.value) return; // защита от спам ботове

    const data = Object.fromEntries(new FormData(form).entries());
    data.consent = "Да – съгласие с Политиката за поверителност (" + new Date().toLocaleString("bg-BG") + ")";
    const btn = form.querySelector("button[type=submit]");

    if (FORM_ENDPOINT) {
      btn.disabled = true; btn.classList.add("opacity-70");
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        showFormStatus("ok", "<strong>Благодарим Ви!</strong> Запитването е изпратено. Наш консултант ще се свърже с Вас до 15 минути.");
      } catch (err) {
        showFormStatus("err", `Възникна грешка при изпращането. Моля, обадете ни се на <a class="underline font-semibold" href="tel:${COMPANY.phoneHref}">${COMPANY.phone}</a>.`);
      } finally {
        btn.disabled = false; btn.classList.remove("opacity-70");
      }
    } else {
      const body = [
        "Име: " + data.name,
        "Телефон: " + data.phone,
        "Услуга: " + data.service,
        "Квартал: " + (data.district || "-"),
        "Описание: " + (data.message || "-"),
        "",
        data.consent
      ].join("\n");
      window.location.href = "mailto:" + COMPANY.email +
        "?subject=" + encodeURIComponent("Запитване от сайта – " + data.service) +
        "&body=" + encodeURIComponent(body);
      showFormStatus("ok", "Отворихме имейл програмата Ви с готово запитване – натиснете „Изпрати“. За спешни случаи: <a class='underline font-semibold' href='tel:" + COMPANY.phoneHref + "'>" + COMPANY.phone + "</a>.");
    }
  });
}

/* --- Банер за бисквитки --- */
function hideCookieBanner() {
  const b = document.getElementById("cookie-banner");
  if (!b) return;
  b.classList.remove("is-visible");
  setTimeout(() => b.classList.add("hidden"), 250);
}
function showCookieBanner() {
  const b = document.getElementById("cookie-banner");
  if (!b) return;
  b.classList.remove("hidden");
  requestAnimationFrame(() => b.classList.add("is-visible"));
}
function setConsent(value) {
  storageSet(CONSENT_KEY, JSON.stringify({ value, date: new Date().toISOString() }));
  hideCookieBanner();
  if (value === "accepted") loadOptionalScripts();
}
function initCookieBanner() {
  document.getElementById("cookie-accept")?.addEventListener("click", () => setConsent("accepted"));
  document.getElementById("cookie-reject")?.addEventListener("click", () => setConsent("rejected"));
  document.querySelectorAll("[data-cookie-settings]").forEach(el =>
    el.addEventListener("click", (e) => { e.preventDefault(); showCookieBanner(); }));

  let saved = null;
  try { saved = JSON.parse(storageGet(CONSENT_KEY)); } catch (e) { saved = null; }
  if (!saved) showCookieBanner();
  else if (saved.value === "accepted") loadOptionalScripts();
}

document.addEventListener("DOMContentLoaded", () => {
  fillCompanyData();
  initMobileMenu();
  initServiceRequestLinks();
  initForm();
  initCookieBanner();
  if (document.getElementById("services-grid")) applyServiceVisibility();
  const toggleText = document.getElementById("toggle-text");
  if (toggleText) toggleText.textContent = `Вижте пълния каталог (${document.querySelectorAll("#services-grid .service-item").length} услуги)`;
});
