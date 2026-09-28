let currentUser = null;

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

const offers = [
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
  $("year").textContent = new Date().getFullYear();

  renderPlatforms();
  renderOffers(offers);
  renderPlatformSelect();

  if ($("loginForm")) {
    $("loginForm").addEventListener("submit", login);
  }

  updateNavigation();
  showPage("home");
});

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

  if (
    page === "admin" &&
    currentUser &&
    currentUser.role === "admin"
  ) {
    loadAdmin();
  }
}

function showLogin() {
  showPage("login");
}

function renderPlatforms() {
  const container = $("platforms");

  if (!container) return;

  container.innerHTML = platforms.map((platform) => `
    <button
      class="platform-card"
      onclick="filterPlatform('${platform.slug}')"
    >
      <div class="platform-icon">
        ${escapeHtml(platform.icon)}
      </div>

      <h3>${escapeHtml(platform.name)}</h3>

      <p>
        ${escapeHtml(platform.description)}
      </p>
    </button>
  `).join("");
}

function filterPlatform(slug) {
  const filteredOffers = offers.filter(
    (offer) =>
      offer.platform_slug === slug
  );

  showPage("offers");

  renderOffers(filteredOffers);
}

function renderOffers(list) {
  const container = $("offers");

  if (!container) return;

  if (!list || !list.length) {
    container.innerHTML = `
      <div class="empty-state">
        لا توجد عروض متاحة حالياً.
      </div>
    `;

    return;
  }

  container.innerHTML = list.map((offer) => `
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
  `).join("");
}

function buyOffer(offerId) {
  const offer = offers.find(
    (item) =>
      Number(item.id) === Number(offerId)
  );

  if (!offer) {
    alert("العرض غير موجود");
    return;
  }

  const confirmed = confirm(
    `هل تريد شراء العرض؟\n\n${offer.title}\nالسعر: ${formatMoney(offer.price_cents)} USD`
  );

  if (!confirmed) return;

  alert(
    "هذا إصدار تجريبي حالياً.\nسيتم ربط الدفع والطلبات الحقيقية بعد إضافة Backend."
  );
}

function login(event) {
  event.preventDefault();

  const username =
    $("username").value.trim();

  const password =
    $("password").value;

  const message =
    $("loginMessage");

  /*
    تسجيل دخول تجريبي للواجهة فقط.
    الحساب:
    username: karbo
    password: kumahide009@
  */

  if (
    username === "karbo" &&
    password === "kumahide009@"
  ) {
    currentUser = {
      username: "karbo",
      role: "admin"
    };

    message.textContent =
      "تم تسجيل الدخول بنجاح";

    message.style.color =
      "var(--success)";

    updateNavigation();

    setTimeout(() => {
      showPage("admin");
    }, 500);

  } else {
    message.textContent =
      "اسم المستخدم أو كلمة المرور غير صحيحة";

    message.style.color =
      "var(--danger)";
  }
}

function logout() {
  currentUser = null;

  updateNavigation();

  showPage("home");
}

function updateNavigation() {
  const loginNav =
    $("loginNav");

  const logoutNav =
    $("logoutNav");

  if (!loginNav || !logoutNav) {
    return;
  }

  if (currentUser) {
    loginNav.classList.add("hidden");
    logoutNav.classList.remove("hidden");

    if (
      currentUser.role === "admin"
    ) {
      addAdminButton();
    }

  } else {
    loginNav.classList.remove("hidden");
    logoutNav.classList.add("hidden");

    const adminNav =
      $("adminNav");

    if (adminNav) {
      adminNav.remove();
    }
  }
}

function addAdminButton() {
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

  $("logoutNav").before(button);
}

function loadOrders() {
  const container =
    $("orders");

  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      لا توجد طلبات حالياً.
      <br>
      نظام الطلبات الحقيقي سيتم ربطه بالـ Backend.
    </div>
  `;
}

function renderPlatformSelect() {
  const select =
    $("offerPlatform");

  if (!select) return;

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
}

function loadAdminStats() {
  const container =
    $("adminStats");

  if (!container) return;

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

function loadAdminOffers() {
  const container =
    $("adminOffers");

  if (!container) return;

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
              (p) =>
                p.slug ===
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
                )} USD
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

function loadAdminOrders() {
  const container =
    $("adminOrders");

  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      لا توجد طلبات حالياً.
    </div>
  `;
}

function formatMoney(cents) {
  return (
    Number(cents || 0) / 100
  ).toFixed(2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
      }
