let currentUser = null;

const ADMIN_USERNAME = "karbo";
const ADMIN_PASSWORD = "kumahide009@";

const platforms = [
  {
    id: 1,
    slug: "tiktok",
    name: "TikTok",
    icon: "♪",
    description: "عروض TikTok"
  },
  {
    id: 2,
    slug: "instagram",
    name: "Instagram",
    icon: "◎",
    description: "عروض Instagram"
  },
  {
    id: 3,
    slug: "youtube",
    name: "YouTube",
    icon: "▶",
    description: "عروض YouTube"
  },
  {
    id: 4,
    slug: "facebook",
    name: "Facebook",
    icon: "f",
    description: "عروض Facebook"
  },
  {
    id: 5,
    slug: "telegram",
    name: "Telegram",
    icon: "➤",
    description: "عروض Telegram"
  },
  {
    id: 6,
    slug: "x",
    name: "X",
    icon: "𝕏",
    description: "عروض X"
  },
  {
    id: 7,
    slug: "snapchat",
    name: "Snapchat",
    icon: "👻",
    description: "عروض Snapchat"
  },
  {
    id: 8,
    slug: "twitch",
    name: "Twitch",
    icon: "◈",
    description: "عروض Twitch"
  }
];

let offers = [
  {
    id: 1,
    platform_slug: "tiktok",
    title: "TikTok Starter",
    description: "عرض تجريبي لـ TikTok",
    price_cents: 2500,
    icon: "♪"
  },
  {
    id: 2,
    platform_slug: "tiktok",
    title: "TikTok Premium",
    description: "عرض TikTok مميز",
    price_cents: 5000,
    icon: "♪"
  },
  {
    id: 3,
    platform_slug: "instagram",
    title: "Instagram Starter",
    description: "عرض تجريبي لـ Instagram",
    price_cents: 3000,
    icon: "◎"
  },
  {
    id: 4,
    platform_slug: "instagram",
    title: "Instagram Premium",
    description: "عرض Instagram مميز",
    price_cents: 6000,
    icon: "◎"
  },
  {
    id: 5,
    platform_slug: "youtube",
    title: "YouTube Channel",
    description: "عرض تجريبي لـ YouTube",
    price_cents: 5000,
    icon: "▶"
  },
  {
    id: 6,
    platform_slug: "facebook",
    title: "Facebook Account",
    description: "عرض تجريبي لـ Facebook",
    price_cents: 3500,
    icon: "f"
  },
  {
    id: 7,
    platform_slug: "telegram",
    title: "Telegram Account",
    description: "عرض تجريبي لـ Telegram",
    price_cents: 2000,
    icon: "➤"
  },
  {
    id: 8,
    platform_slug: "x",
    title: "X Account",
    description: "عرض تجريبي لـ X",
    price_cents: 4000,
    icon: "𝕏"
  },
  {
    id: 9,
    platform_slug: "snapchat",
    title: "Snapchat Account",
    description: "عرض تجريبي لـ Snapchat",
    price_cents: 3000,
    icon: "👻"
  },
  {
    id: 10,
    platform_slug: "twitch",
    title: "Twitch Account",
    description: "عرض تجريبي لـ Twitch",
    price_cents: 4500,
    icon: "◈"
  }
];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  const year = $("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const loginForm = $("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", login);
  }

  renderPlatforms();
  renderOffers(offers);
  renderPlatformSelect();
  updateNavigation();

  showPage("home");
});

/* =========================
   PAGE NAVIGATION
========================= */

function showPage(page) {
  const pages = [
    "home",
    "offers",
    "orders",
    "login",
    "admin"
  ];

  pages.forEach((name) => {
    const element = $(`${name}Page`);

    if (element) {
      element.classList.toggle(
        "hidden",
        name !== page
      );
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (page === "offers") {
    renderOffers(offers);
  }

  if (page === "orders") {
    loadOrders();
  }

  if (page === "admin") {
    loadAdmin();
  }
}

function showLogin() {
  showPage("login");
}

/* =========================
   PLATFORMS
========================= */

function renderPlatforms() {
  const container = $("platforms");

  if (!container) {
    return;
  }

  container.innerHTML = platforms.map((platform) => {
    return `
      <button
        class="platform-card"
        onclick="filterPlatform('${platform.slug}')"
      >

        <div class="platform-icon">
          ${escapeHtml(platform.icon)}
        </div>

        <h3>
          ${escapeHtml(platform.name)}
        </h3>

        <p>
          ${escapeHtml(platform.description)}
        </p>

      </button>
    `;
  }).join("");
}

function filterPlatform(slug) {
  const filtered = offers.filter(
    (offer) =>
      offer.platform_slug === slug
  );

  showPage("offers");

  renderOffers(filtered);
}

/* =========================
   OFFERS
========================= */

function renderOffers(list) {
  const container = $("offers");

  if (!container) {
    return;
  }

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        لا توجد عروض متاحة حالياً.
      </div>
    `;

    return;
  }

  container.innerHTML = list.map((offer) => {
    return `
      <article class="offer-card">

        <div class="offer-icon">
          ${escapeHtml(offer.icon || "📦")}
        </div>

        <h3>
          ${escapeHtml(offer.title)}
        </h3>

        <p>
          ${escapeHtml(offer.description || "")}
        </p>

        <div class="offer-footer">

          <div class="price">
            ${formatMoney(offer.price_cents)}
            <small>USD</small>
          </div>

          <button
            class="primary-btn"
            onclick="buyOffer(${offer.id})"
          >
            شراء
          </button>

        </div>

      </article>
    `;
  }).join("");
}

/* =========================
   BUY
========================= */

function buyOffer(offerId) {
  const offer = offers.find(
    (item) =>
      Number(item.id) === Number(offerId)
  );

  if (!offer) {
    alert("العرض غير موجود");
    return;
  }

  if (!currentUser) {
    showLogin();
    return;
  }

  const confirmed = confirm(
    "هل تريد إنشاء طلب لهذا العرض؟\n\n" +
    offer.title +
    "\nالسعر: " +
    formatMoney(offer.price_cents) +
    " USD"
  );

  if (!confirmed) {
    return;
  }

  alert(
    "تم تسجيل طلبك تجريبياً.\n" +
    "رقم الطلب: #" +
    Math.floor(Math.random() * 9000 + 1000)
  );
}

/* =========================
   LOGIN
========================= */

function login(event) {
  event.preventDefault();

  const usernameInput = $("username");
  const passwordInput = $("password");
  const message = $("loginMessage");

  if (!usernameInput || !passwordInput || !message) {
    return;
  }

  const username =
    usernameInput.value.trim();

  const password =
    passwordInput.value;

  message.textContent =
    "جاري تسجيل الدخول...";

  message.style.color = "";

  if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    currentUser = {
      username: ADMIN_USERNAME,
      role: "admin"
    };

    message.textContent =
      "تم تسجيل الدخول بنجاح";

    message.style.color =
      "var(--success)";

    updateNavigation();

    setTimeout(() => {
      showPage("admin");
    }, 400);

    return;
  }

  message.textContent =
    "اسم المستخدم أو كلمة المرور غير صحيحة";

  message.style.color =
    "var(--danger)";
}

/* =========================
   LOGOUT
========================= */

function logout() {
  currentUser = null;

  updateNavigation();

  showPage("home");
}

/* =========================
   NAVIGATION
========================= */

function updateNavigation() {
  const loginNav = $("loginNav");
  const logoutNav = $("logoutNav");

  if (!loginNav || !logoutNav) {
    return;
  }

  if (currentUser) {
    loginNav.classList.add("hidden");
    logoutNav.classList.remove("hidden");

    addAdminButton();

  } else {
    loginNav.classList.remove("hidden");
    logoutNav.classList.add("hidden");

    const oldAdmin =
      $("adminNav");

    if (oldAdmin) {
      oldAdmin.remove();
    }
  }
}

function addAdminButton() {
  if (!currentUser) {
    return;
  }

  if ($("adminNav")) {
    return;
  }

  const button =
    document.createElement("button");

  button.id = "adminNav";
  button.className = "nav-btn";
  button.textContent = "الإدارة";

  button.onclick = () => {
    showPage("admin");
  };

  const logoutNav =
    $("logoutNav");

  if (logoutNav) {
    logoutNav.before(button);
  }
}

/* =========================
   ORDERS
========================= */

function loadOrders() {
  const container = $("orders");

  if (!container) {
    return;
  }

  if (!currentUser) {
    container.innerHTML = `
      <div class="empty-state">
        سجل الدخول أولاً لمشاهدة طلباتك.
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="empty-state">
      لا توجد طلبات حالياً.
      <br>
      نظام الطلبات الحقيقي سيتم ربطه بالـ Backend.
    </div>
  `;
}

/* =========================
   ADMIN
========================= */

function loadAdmin() {
  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {
    return;
  }

  loadAdminStats();
  loadAdminOffers();
  loadAdminOrders();
  renderPlatformSelect();
}

function loadAdminStats() {
  const container =
    $("adminStats");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="stat-card">
      <span>العروض</span>
      <strong>${offers.length}</strong>
    </div>

    <div class="stat-card">
      <span>المستخدمون</span>
      <strong>1</strong>
    </div>

    <div class="stat-card">
      <span>الطلبات</span>
      <strong>0</strong>
    </div>

    <div class="stat-card">
      <span>المبيعات</span>
      <strong>0.00</strong>
    </div>
  `;
}

function renderPlatformSelect() {
  const select =
    $("offerPlatform");

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">
      اختر المنصة
    </option>

    ${platforms.map((platform) => `
      <option value="${platform.id}">
        ${escapeHtml(platform.name)}
      </option>
    `).join("")}
  `;
}

/* =========================
   ADMIN ADD OFFER
========================= */

const offerForm = $("offerForm");

if (offerForm) {
  offerForm.addEventListener(
    "submit",
    addOffer
  );
}

function addOffer(event) {
  event.preventDefault();

  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {
    alert("صلاحيات الأدمن مطلوبة");
    return;
  }

  const platformId =
    Number($("offerPlatform").value);

  const title =
    $("offerTitle").value.trim();

  const description =
    $("offerDescription").value.trim();

  const price =
    Number($("offerPrice").value);

  const icon =
    $("offerIcon").value.trim() || "📦";

  if (!platformId) {
    alert("اختر المنصة");
    return;
  }

  if (!title) {
    alert("اكتب عنوان العرض");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert("السعر غير صحيح");
    return;
  }

  const platform =
    platforms.find(
      (item) =>
        Number(item.id) === platformId
    );

  if (!platform) {
    alert("المنصة غير موجودة");
    return;
  }

  const newOffer = {
    id:
      offers.length
        ? Math.max(
            ...offers.map(
              (item) => Number(item.id)
            )
          ) + 1
        : 1,

    platform_slug:
      platform.slug,

    title,
    description,

    price_cents:
      Math.round(price * 100),

    icon
  };

  offers.unshift(newOffer);

  renderOffers(offers);
  loadAdminStats();
  loadAdminOffers();

  event.target.reset();

  $("offerIcon").value = "📦";

  alert("تمت إضافة العرض بنجاح");
}

/* =========================
   ADMIN OFFERS
========================= */

function loadAdminOffers() {
  const container =
    $("adminOffers");

  if (!container) {
    return;
  }

  if (!offers.length) {
    container.innerHTML = `
      <div class="empty-state">
        لا توجد عروض.
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <table class="admin-table">

      <thead>
        <tr>
          <th>#</th>
          <th>العرض</th>
          <th>المنصة</th>
          <th>السعر</th>
          <th>الحالة</th>
        </tr>
      </thead>

      <tbody>

        ${offers.map((offer) => {

          const platform =
            platforms.find(
              (item) =>
                item.slug ===
                offer.platform_slug
            );

          return `
            <tr>

              <td>
                ${offer.id}
              </td>

              <td>
                ${escapeHtml(
                  offer.title
                )}
              </td>

              <td>
                ${escapeHtml(
                  platform
                    ? platform.name
                    : "-"
                )}
              </td>

              <td>
                ${formatMoney(
                  offer.price_cents
                )}
                USD
              </td>

              <td>
                فعال
              </td>

            </tr>
          `;
        }).join("")}

      </tbody>

    </table>
  `;
}

/* =========================
   ADMIN ORDERS
========================= */

function loadAdminOrders() {
  const container =
    $("adminOrders");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="empty-state">
      لا توجد طلبات حالياً.
    </div>
  `;
}

/* =========================
   HELPERS
========================= */

function formatMoney(cents) {
  return (
    Number(cents || 0) / 100
  ).toFixed(2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}
