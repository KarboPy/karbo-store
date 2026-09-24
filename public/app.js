let currentUser = null;
let platforms = [];
let offers = [];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  $("year").textContent = new Date().getFullYear();

  $("loginForm").addEventListener("submit", login);
  $("offerForm").addEventListener("submit", createOffer);

  await loadSession();
  await loadPlatforms();
  await loadOffers();

  showPage("home");
});


async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = {};

  try {
    data = await response.json();
  } catch (_) {}

  if (!response.ok) {
    throw new Error(
      data.error || "حدث خطأ"
    );
  }

  return data;
}


/* SESSION */

async function loadSession() {
  try {
    const data = await api("/api/session");

    currentUser = data.user || null;

    updateNavigation();
  } catch (error) {
    console.error(error);
  }
}


function updateNavigation() {
  const loginNav = $("loginNav");
  const logoutNav = $("logoutNav");

  if (currentUser) {
    loginNav.classList.add("hidden");
    logoutNav.classList.remove("hidden");

    if (currentUser.role === "admin") {
      addAdminButton();
    }
  } else {
    loginNav.classList.remove("hidden");
    logoutNav.classList.add("hidden");

    const oldAdmin = $("adminNav");

    if (oldAdmin) {
      oldAdmin.remove();
    }
  }
}


function addAdminButton() {
  if ($("adminNav")) return;

  const button = document.createElement("button");

  button.id = "adminNav";
  button.className = "nav-btn";
  button.textContent = "الإدارة";

  button.onclick = () => {
    showPage("admin");
    loadAdmin();
  };

  $("logoutNav").before(button);
}


/* NAVIGATION */

function showPage(page) {
  const pages = [
    "home",
    "offers",
    "orders",
    "login",
    "admin"
  ];

  pages.forEach(name => {
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
    loadOffers();
  }

  if (page === "orders") {
    loadOrders();
  }

  if (
    page === "admin" &&
    currentUser?.role === "admin"
  ) {
    loadAdmin();
  }
}


function showLogin() {
  showPage("login");
}


/* PLATFORMS */

async function loadPlatforms() {
  try {
    platforms = await api("/api/platforms");

    renderPlatforms();
    renderPlatformSelect();
  } catch (error) {
    console.error(error);
  }
}


function renderPlatforms() {
  const container = $("platforms");

  if (!container) return;

  if (!platforms.length) {
    container.innerHTML = `
      <div class="empty-state">
        لا توجد منصات متاحة حالياً.
      </div>
    `;

    return;
  }

  container.innerHTML = platforms.map(platform => `
    <button
      class="platform-card"
      onclick="filterPlatform('${escapeAttr(platform.slug)}')"
    >

      <div class="platform-icon">
        ${escapeHtml(platform.icon)}
      </div>

      <h3>
        ${escapeHtml(platform.name)}
      </h3>

      <p>
        ${escapeHtml(platform.description || "")}
      </p>

    </button>
  `).join("");
}


function filterPlatform(slug) {
  showPage("offers");

  const filtered = offers.filter(
    offer =>
      offer.platform_slug === slug
  );

  renderOffers(filtered);
}


/* OFFERS */

async function loadOffers() {
  try {
    offers = await api("/api/offers");

    renderOffers(offers);
  } catch (error) {
    console.error(error);
  }
}


function renderOffers(list) {
  const container = $("offers");

  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        لا توجد عروض متاحة حالياً.
      </div>
    `;

    return;
  }

  container.innerHTML = list.map(offer => `
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
          onclick="buyOffer(${Number(offer.id)})"
        >
          شراء
        </button>

      </div>

    </article>
  `).join("");
}


function buyOffer(offerId) {
  if (!currentUser) {
    showLogin();
    return;
  }

  const offer = offers.find(
    x => Number(x.id) === Number(offerId)
  );

  if (!offer) {
    alert("العرض غير موجود");
    return;
  }

  const confirmed = confirm(
    `هل تريد إنشاء طلب للعرض:\n${offer.title}\n\nالسعر: ${formatMoney(offer.price_cents)} USD`
  );

  if (!confirmed) return;

  createOrder(offer.id);
}


async function createOrder(offerId) {
  try {
    const data = await api("/api/orders", {
      method: "POST",

      body: JSON.stringify({
        items: [
          {
            offerId,
            quantity: 1
          }
        ]
      })
    });

    alert(
      `تم إنشاء الطلب بنجاح.\nرقم الطلب: #${data.orderId}`
    );

    showPage("orders");

  } catch (error) {
    alert(error.message);
  }
}


/* LOGIN */

async function login(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;

  const message = $("loginMessage");

  message.textContent = "جاري تسجيل الدخول...";
  message.style.color = "";

  try {
    const data = await api(
      "/api/auth/login",
      {
        method: "POST",

        body: JSON.stringify({
          username,
          password
        })
      }
    );

    currentUser = data.user;

    updateNavigation();

    message.textContent =
      "تم تسجيل الدخول بنجاح";

    message.style.color =
      "var(--success)";

    setTimeout(() => {
      if (currentUser.role === "admin") {
        showPage("admin");
      } else {
        showPage("home");
      }
    }, 500);

  } catch (error) {
    message.textContent =
      error.message;

    message.style.color =
      "var(--danger)";
  }
}


async function logout() {
  try {
    await api(
      "/api/auth/logout",
      {
        method: "POST"
      }
    );

    currentUser = null;

    updateNavigation();

    showPage("home");

  } catch (error) {
    alert(error.message);
  }
}


/* ORDERS */

async function loadOrders() {
  const container = $("orders");

  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="empty-state">
        سجل الدخول أولاً لمشاهدة طلباتك.
      </div>
    `;

    return;
  }

  try {
    const orders =
      await api("/api/orders");

    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد طلبات حتى الآن.
        </div>
      `;

      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">

        <div>
          <strong>
            الطلب #${Number(order.id)}
          </strong>

          <div style="color:var(--muted);font-size:12px">
            ${escapeHtml(order.created_at)}
          </div>
        </div>

        <div>
          <span class="order-status">
            ${statusText(order.status)}
          </span>
        </div>

        <strong>
          ${formatMoney(order.total_cents)} USD
        </strong>

      </div>
    `).join("");

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}


/* ADMIN */

async function loadAdmin() {
  if (!currentUser || currentUser.role !== "admin") {
    return;
  }

  await Promise.all([
    loadAdminStats(),
    loadAdminOffers(),
    loadAdminOrders(),
    loadPlatforms()
  ]);
}


async function loadAdminStats() {
  try {
    const stats =
      await api("/api/admin/stats");

    $("adminStats").innerHTML = `
      <div class="stat-card">
        <span>العروض</span>
        <strong>${stats.offers}</strong>
      </div>

      <div class="stat-card">
        <span>المستخدمون</span>
        <strong>${stats.users}</strong>
      </div>

      <div class="stat-card">
        <span>الطلبات</span>
        <strong>${stats.orders}</strong>
      </div>

      <div class="stat-card">
        <span>المبيعات</span>
        <strong>
          ${formatMoney(stats.sales_cents)}
        </strong>
      </div>
    `;

  } catch (error) {
    console.error(error);
  }
}


function renderPlatformSelect() {
  const select =
    $("offerPlatform");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      اختر المنصة
    </option>

    ${platforms.map(platform => `
      <option value="${Number(platform.id)}">
        ${escapeHtml(platform.name)}
      </option>
    `).join("")}
  `;
}


async function createOffer(event) {
  event.preventDefault();

  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {
    alert("صلاحيات الأدمن مطلوبة");
    return;
  }

  const platformId =
    $("offerPlatform").value;

  const title =
    $("offerTitle").value.trim();

  const description =
    $("offerDescription").value.trim();

  const price =
    $("offerPrice").value;

  const icon =
    $("offerIcon").value.trim() || "📦";

  try {
    await api(
      "/api/admin/offers",
      {
        method: "POST",

        body: JSON.stringify({
          platformId,
          title,
          description,
          price,
          icon
        })
      }
    );

    alert("تمت إضافة العرض");

    $("offerForm").reset();

    $("offerIcon").value = "📦";

    await loadOffers();
    await loadAdmin();

  } catch (error) {
    alert(error.message);
  }
}


async function loadAdminOffers() {
  const container =
    $("adminOffers");

  if (!container) return;

  try {
    const list =
      await api("/api/admin/offers");

    if (!list.length) {
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
            <th>إجراء</th>
          </tr>
        </thead>

        <tbody>

          ${list.map(offer => `
            <tr>

              <td>
                ${Number(offer.id)}
              </td>

              <td>
                ${escapeHtml(offer.title)}
              </td>

              <td>
                ${escapeHtml(offer.platform_name)}
              </td>

              <td>
                ${formatMoney(offer.price_cents)}
              </td>

              <td>
                ${offer.active ? "فعال" : "متوقف"}
              </td>

              <td>

                <button
                  class="secondary-btn"
                  onclick="toggleOffer(
                    ${Number(offer.id)},
                    ${offer.active ? "false" : "true"}
                  )"
                >
                  ${offer.active ? "تعطيل" : "تفعيل"}
                </button>

              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>
    `;

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}


async function toggleOffer(id, active) {
  try {
    await api(
      `/api/admin/offers/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          active
        })
      }
    );

    await loadOffers();
    await loadAdminOffers();
    await loadAdminStats();

  } catch (error) {
    alert(error.message);
  }
}


async function loadAdminOrders() {
  const container =
    $("adminOrders");

  if (!container) return;

  try {
    const list =
      await api("/api/admin/orders");

    if (!list.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد طلبات.
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <table class="admin-table">

        <thead>
          <tr>
            <th>#</th>
            <th>المستخدم</th>
            <th>المبلغ</th>
            <th>الحالة</th>
            <th>التاريخ</th>
            <th>تحديث</th>
          </tr>
        </thead>

        <tbody>

          ${list.map(order => `
            <tr>

              <td>
                #${Number(order.id)}
              </td>

              <td>
                ${escapeHtml(order.username || "-")}
              </td>

              <td>
                ${formatMoney(order.total_cents)}
              </td>

              <td>
                ${statusText(order.status)}
              </td>

              <td>
                ${escapeHtml(order.created_at)}
              </td>

              <td>

                <select
                  onchange="changeOrderStatus(
                    ${Number(order.id)},
                    this.value
                  )"
                >

                  ${[
                    "pending",
                    "paid",
                    "processing",
                    "completed",
                    "cancelled"
                  ].map(status => `
                    <option
                      value="${status}"
                      ${status === order.status ? "selected" : ""}
                    >
                      ${statusText(status)}
                    </option>
                  `).join("")}

                </select>

              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>
    `;

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}


async function changeOrderStatus(id, status) {
  try {
    await api(
      `/api/admin/orders/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status
        })
      }
    );

    await loadAdminOrders();
    await loadAdminStats();

  } catch (error) {
    alert(error.message);
  }
}


/* HELPERS */

function formatMoney(cents) {
  return (
    Number(cents || 0) / 100
  ).toFixed(2);
}


function statusText(status) {
  const statuses = {
    pending: "قيد الانتظار",
    paid: "مدفوع",
    processing: "قيد المعالجة",
    completed: "مكتمل",
    cancelled: "ملغي"
  };

  return (
    statuses[status] ||
    status
  );
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
    }
