require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = path.join(__dirname, "data", "karbo.sqlite");
fs.mkdirSync(path.join(__dirname, "data"), {
  recursive: true
});

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  offer_id INTEGER NOT NULL,
  title_snapshot TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(offer_id) REFERENCES offers(id) ON DELETE RESTRICT
);
`);

const defaultPlatforms = [
  ["tiktok", "TikTok", "♪", "عروض وحسابات TikTok مصرح بنقلها"],
  ["instagram", "Instagram", "◎", "عروض Instagram"],
  ["youtube", "YouTube", "▶", "عروض YouTube"],
  ["facebook", "Facebook", "f", "عروض Facebook"],
  ["telegram", "Telegram", "➤", "عروض Telegram"],
  ["x", "X", "𝕏", "عروض X"],
  ["snapchat", "Snapchat", "👻", "عروض Snapchat"],
  ["twitch", "Twitch", "◈", "عروض Twitch"]
];

const insertPlatform = db.prepare(
  "INSERT OR IGNORE INTO platforms (slug,name,icon,description) VALUES (?,?,?,?)"
);

const seedPlatforms = db.transaction(() =>
  defaultPlatforms.forEach(p => insertPlatform.run(...p))
);

seedPlatforms();

const adminUsername = process.env.ADMIN_USERNAME || "karbo";
const adminPassword =
  process.env.ADMIN_PASSWORD || "change-this-before-production";

const existingAdmin = db
  .prepare("SELECT id FROM users WHERE username=?")
  .get(adminUsername);

if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 12);

  db.prepare(
    "INSERT INTO users (username,password_hash,role) VALUES (?,?,?)"
  ).run(adminUsername, hash, "admin");

  console.log(`Admin created: ${adminUsername}`);

  if (adminPassword === "change-this-before-production") {
    console.warn("WARNING: Change ADMIN_PASSWORD in .env before production.");
  }
}

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(morgan("tiny"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: path.join(__dirname, "data")
    }),

    secret:
      process.env.SESSION_SECRET || "dev-only-change-this-secret",

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

function auth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "يجب تسجيل الدخول"
    });
  }

  next();
}

function admin(req, res, next) {
  if (
    !req.session.user ||
    req.session.user.role !== "admin"
  ) {
    return res.status(403).json({
      error: "صلاحيات الأدمن مطلوبة"
    });
  }

  next();
}

function moneyToCents(value) {
  const n = Number(value);

  if (!Number.isFinite(n) || n < 0) {
    throw new Error("السعر غير صالح");
  }

  return Math.round(n * 100);
}

app.get("/api/session", (req, res) => {
  res.json({
    user: req.session.user || null
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  const user = db
    .prepare(
      "SELECT id,username,password_hash,role FROM users WHERE username=?"
    )
    .get(username || "");

  if (
    !user ||
    !bcrypt.compareSync(password || "", user.password_hash)
  ) {
    return res.status(401).json({
      error: "اسم المستخدم أو كلمة المرور غير صحيحة"
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  res.json({
    user: req.session.user
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      ok: true
    });
  });
});

app.get("/api/platforms", (req, res) => {
  res.json(
    db
      .prepare(
        "SELECT * FROM platforms WHERE active=1 ORDER BY id"
      )
      .all()
  );
});

app.get("/api/offers", (req, res) => {
  const platform = req.query.platform;

  let rows;

  if (platform) {
    rows = db
      .prepare(`
        SELECT
          o.*,
          p.slug platform_slug,
          p.name platform_name,
          p.icon platform_icon
        FROM offers o
        JOIN platforms p ON p.id=o.platform_id
        WHERE o.active=1
        AND p.active=1
        AND p.slug=?
        ORDER BY o.id DESC
      `)
      .all(platform);
  } else {
    rows = db
      .prepare(`
        SELECT
          o.*,
          p.slug platform_slug,
          p.name platform_name,
          p.icon platform_icon
        FROM offers o
        JOIN platforms p ON p.id=o.platform_id
        WHERE o.active=1
        AND p.active=1
        ORDER BY o.id DESC
      `)
      .all();
  }

  res.json(rows);
});

app.post("/api/orders", auth, (req, res) => {
  const items = Array.isArray(req.body.items)
    ? req.body.items
    : [];

  if (!items.length) {
    return res.status(400).json({
      error: "السلة فارغة"
    });
  }

  const getOffer = db.prepare(
    "SELECT id,title,price_cents,active FROM offers WHERE id=?"
  );

  const clean = [];

  for (const item of items) {
    const offer = getOffer.get(Number(item.offerId));

    const qty = Math.max(
      1,
      Math.min(99, Number(item.quantity) || 1)
    );

    if (!offer || !offer.active) {
      return res.status(400).json({
        error: "أحد العروض غير متاح"
      });
    }

    clean.push({
      ...offer,
      quantity: qty
    });
  }

  const total = clean.reduce(
    (sum, x) =>
      sum + x.price_cents * x.quantity,
    0
  );

  const create = db.transaction(() => {
    const order = db
      .prepare(
        "INSERT INTO orders(user_id,status,total_cents) VALUES(?,?,?)"
      )
      .run(
        req.session.user.id,
        "pending",
        total
      );

    const add = db.prepare(
      `INSERT INTO order_items
      (order_id,offer_id,title_snapshot,price_cents,quantity)
      VALUES(?,?,?,?,?)`
    );

    clean.forEach(x =>
      add.run(
        order.lastInsertRowid,
        x.id,
        x.title,
        x.price_cents,
        x.quantity
      )
    );

    return order.lastInsertRowid;
  });

  res.status(201).json({
    orderId: create()
  });
});

app.get("/api/orders", auth, (req, res) => {
  const orders = db
    .prepare(`
      SELECT
        id,
        status,
        total_cents,
        created_at
      FROM orders
      WHERE user_id=?
      ORDER BY id DESC
    `)
    .all(req.session.user.id);

  res.json(orders);
});

app.get("/api/admin/stats", admin, (req, res) => {
  const offers =
    db.prepare(
      "SELECT COUNT(*) c FROM offers"
    ).get().c;

  const users =
    db.prepare(
      "SELECT COUNT(*) c FROM users WHERE role='user'"
    ).get().c;

  const orders =
    db.prepare(
      "SELECT COUNT(*) c FROM orders"
    ).get().c;

  const sales =
    db.prepare(
      "SELECT COALESCE(SUM(total_cents),0) c FROM orders WHERE status!='cancelled'"
    ).get().c;

  res.json({
    offers,
    users,
    orders,
    sales_cents: sales
  });
});

app.get("/api/admin/platforms", admin, (req, res) => {
  res.json(
    db
      .prepare(
        "SELECT * FROM platforms ORDER BY id"
      )
      .all()
  );
});

app.patch("/api/admin/platforms/:id", admin, (req, res) => {
  const {
    active,
    description,
    name,
    icon
  } = req.body || {};

  const p = db
    .prepare(
      "SELECT * FROM platforms WHERE id=?"
    )
    .get(req.params.id);

  if (!p) {
    return res.status(404).json({
      error: "القسم غير موجود"
    });
  }

  db.prepare(`
    UPDATE platforms
    SET
      active=COALESCE(?,active),
      description=COALESCE(?,description),
      name=COALESCE(?,name),
      icon=COALESCE(?,icon)
    WHERE id=?
  `).run(
    active === undefined
      ? null
      : active
        ? 1
        : 0,
    description ?? null,
    name ?? null,
    icon ?? null,
    p.id
  );

  res.json({
    ok: true
  });
});

app.get("/api/admin/offers", admin, (req, res) => {
  res.json(
    db
      .prepare(`
        SELECT
          o.*,
          p.name platform_name,
          p.slug platform_slug
        FROM offers o
        JOIN platforms p ON p.id=o.platform_id
        ORDER BY o.id DESC
      `)
      .all()
  );
});

app.post("/api/admin/offers", admin, (req, res) => {
  try {
    const {
      platformId,
      title,
      description,
      price,
      icon
    } = req.body || {};

    if (!platformId || !title) {
      return res.status(400).json({
        error: "المنصة والعنوان مطلوبان"
      });
    }

    const result = db
      .prepare(`
        INSERT INTO offers
        (platform_id,title,description,price_cents,icon)
        VALUES(?,?,?,?,?)
      `)
      .run(
        Number(platformId),
        String(title).trim(),
        String(description || "").trim(),
        moneyToCents(price),
        String(icon || "📦")
      );

    res.status(201).json({
      id: result.lastInsertRowid
    });
  } catch (e) {
    res.status(400).json({
      error: e.message
    });
  }
});

app.patch("/api/admin/offers/:id", admin, (req, res) => {
  try {
    const current = db
      .prepare(
        "SELECT * FROM offers WHERE id=?"
      )
      .get(req.params.id);

    if (!current) {
      return res.status(404).json({
        error: "العرض غير موجود"
      });
    }

    const b = req.body || {};

    db.prepare(`
      UPDATE offers
      SET
        platform_id=?,
        title=?,
        description=?,
        price_cents=?,
        icon=?,
        active=?
      WHERE id=?
    `).run(
      Number(
        b.platformId ??
        current.platform_id
      ),
      String(
        b.title ??
        current.title
      ).trim(),
      String(
        b.description ??
        current.description
      ).trim(),
      b.price === undefined
        ? current.price_cents
        : moneyToCents(b.price),
      String(
        b.icon ??
        current.icon
      ),
      b.active === undefined
        ? current.active
        : b.active
          ? 1
          : 0,
      current.id
    );

    res.json({
      ok: true
    });
  } catch (e) {
    res.status(400).json({
      error: e.message
    });
  }
});

app.delete("/api/admin/offers/:id", admin, (req, res) => {
  try {
    db.prepare(
      "DELETE FROM offers WHERE id=?"
    ).run(req.params.id);

    res.json({
      ok: true
    });
  } catch (e) {
    res.status(409).json({
      error:
        "لا يمكن حذف عرض مرتبط بطلب سابق؛ عطّله بدلاً من ذلك"
    });
  }
});

app.get("/api/admin/orders", admin, (req, res) => {
  res.json(
    db
      .prepare(`
        SELECT
          o.id,
          o.status,
          o.total_cents,
          o.created_at,
          u.username
        FROM orders o
        LEFT JOIN users u ON u.id=o.user_id
        ORDER BY o.id DESC
      `)
      .all()
  );
});

app.patch("/api/admin/orders/:id", admin, (req, res) => {
  const allowed = [
    "pending",
    "paid",
    "processing",
    "completed",
    "cancelled"
  ];

  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({
      error: "حالة غير صالحة"
    });
  }

  db.prepare(
    "UPDATE orders SET status=? WHERE id=?"
  ).run(
    req.body.status,
    req.params.id
  );

  res.json({
    ok: true
  });
});

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "حدث خطأ في الخادم"
  });
});

app.listen(PORT, () => {
  console.log(
    `Karbo Store running on http://localhost:${PORT}`
  );
});
