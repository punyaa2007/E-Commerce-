// ============================================================
//  app.js  –  Shared utilities, seed data, navbar
// ============================================================

// ---------- Storage Keys ----------
const KEYS = {
  users:       'ec_users',
  currentUser: 'ec_current_user',
  products:    'ec_products',
  cart:        'ec_cart',
  orders:      'ec_orders',
};

// ---------- Generic localStorage helpers ----------
const store = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || null,
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  getArr: (key) => JSON.parse(localStorage.getItem(key)) || [],
};

// ---------- Current user helpers ----------
function getCurrentUser() { return store.get(KEYS.currentUser); }
function setCurrentUser(u) { store.set(KEYS.currentUser, u); }
function clearCurrentUser() { localStorage.removeItem(KEYS.currentUser); }

// ---------- Auth guards ----------
function requireAuth() {
  const u = getCurrentUser();
  if (!u) { window.location.href = 'login.html'; return null; }
  return u;
}
function requireAdmin() {
  const u = getCurrentUser();
  if (!u || u.role !== 'admin') { window.location.href = 'index.html'; return null; }
  return u;
}

// ---------- Cart helpers ----------
function getCart(userId) {
  const allCarts = store.get(KEYS.cart) || {};
  return allCarts[userId] || [];
}
function saveCart(userId, items) {
  const allCarts = store.get(KEYS.cart) || {};
  allCarts[userId] = items;
  store.set(KEYS.cart, allCarts);
  updateCartBadge();
}
function addToCart(userId, productId, qty = 1) {
  const items = getCart(userId);
  const idx = items.findIndex(i => i.productId === productId);
  if (idx > -1) { items[idx].quantity += qty; }
  else { items.push({ productId, quantity: qty }); }
  saveCart(userId, items);
}
function getCartCount(userId) {
  return getCart(userId).reduce((s, i) => s + i.quantity, 0);
}

// ---------- Orders ----------
function getOrders() { return store.getArr(KEYS.orders); }
function saveOrders(orders) { store.set(KEYS.orders, orders); }

// ---------- Products ----------
function getProducts() { return store.getArr(KEYS.products); }
function saveProducts(products) { store.set(KEYS.products, products); }
function getProductById(id) { return getProducts().find(p => p.id === id) || null; }

// ---------- Seed default data ----------
function seedData() {
  // Admin user
  if (!store.get(KEYS.users)) {
    const admin = {
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    store.set(KEYS.users, [admin]);
  }

  // Sample products
  if (!store.get(KEYS.products)) {
    const products = [
      {
        id: 'p1', name: 'Wireless Noise-Cancelling Headphones', category: 'Electronics',
        price: 79.99, stock: 25,
        description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and foldable design for travel.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      },
      {
        id: 'p2', name: 'Mechanical Gaming Keyboard', category: 'Electronics',
        price: 54.99, stock: 40,
        description: 'Tenkeyless mechanical keyboard with RGB backlight, tactile blue switches, and durable aluminum frame.',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      },
      {
        id: 'p3', name: 'Smart Watch Series X', category: 'Electronics',
        price: 129.99, stock: 15,
        description: 'Feature-packed smartwatch with health monitoring, GPS, AMOLED display, and 7-day battery life.',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      },
      {
        id: 'p4', name: 'Portable Bluetooth Speaker', category: 'Electronics',
        price: 39.99, stock: 60,
        description: '360-degree surround sound, waterproof IPX7 rating, 12-hour playtime, and built-in mic.',
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
      },
      {
        id: 'p5', name: 'Men\'s Classic Fit T-Shirt', category: 'Clothing',
        price: 19.99, stock: 100,
        description: '100% organic cotton, pre-shrunk, available in 12 colors. Comfortable everyday wear.',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
      },
      {
        id: 'p6', name: 'Women\'s Running Sneakers', category: 'Clothing',
        price: 64.99, stock: 45,
        description: 'Lightweight mesh upper, cushioned midsole, anti-slip rubber outsole. Perfect for daily runs.',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      },
      {
        id: 'p7', name: 'Slim Fit Denim Jeans', category: 'Clothing',
        price: 44.99, stock: 70,
        description: 'Stretch denim blend, mid-rise waist, slim leg silhouette. Machine washable.',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80',
      },
      {
        id: 'p8', name: 'JavaScript: The Good Parts', category: 'Books',
        price: 14.99, stock: 30,
        description: 'A classic programming book by Douglas Crockford covering the best features of JavaScript.',
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
      },
      {
        id: 'p9', name: 'Atomic Habits', category: 'Books',
        price: 12.99, stock: 55,
        description: 'James Clear\'s bestselling guide to building good habits and breaking bad ones.',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      },
      {
        id: 'p10', name: 'Aromatherapy Diffuser', category: 'Home',
        price: 29.99, stock: 35,
        description: 'Ultrasonic essential oil diffuser with 7 LED colors, auto shut-off, and whisper-quiet operation.',
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&q=80',
      },
      {
        id: 'p11', name: 'Bamboo Cutting Board Set', category: 'Home',
        price: 24.99, stock: 50,
        description: 'Set of 3 eco-friendly bamboo cutting boards with juice grooves and non-slip feet.',
        image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80',
      },
      {
        id: 'p12', name: 'Stainless Steel Water Bottle', category: 'Home',
        price: 22.99, stock: 80,
        description: 'Double-wall vacuum insulated, keeps drinks cold 24h / hot 12h. BPA-free, leak-proof lid.',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
      },
    ];
    store.set(KEYS.products, products);
  }
}

// ---------- Navbar ----------
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const u = getCurrentUser();
  const count = u ? getCartCount(u.id) : 0;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function renderNavbar() {
  const u = getCurrentUser();
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const cartCount = u ? getCartCount(u.id) : 0;

  nav.innerHTML = `
    <div class="nav-container">
      <a href="index.html" class="nav-brand">
        <span class="brand-icon">🛍️</span> ShopEase
      </a>
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-menu" id="nav-menu">
        <a href="index.html" class="nav-link">Home</a>
        <a href="products.html" class="nav-link">Products</a>
        ${u ? `
          <a href="cart.html" class="nav-link cart-link">
            🛒 Cart
            <span class="cart-badge" id="cart-badge" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
          </a>
          <a href="orders.html" class="nav-link">My Orders</a>
          ${u.role === 'admin' ? '<a href="admin.html" class="nav-link admin-link">Admin</a>' : ''}
          <div class="nav-user">
            <span class="user-greeting">Hi, ${u.name.split(' ')[0]}</span>
            <button class="btn btn-outline btn-sm" id="logout-btn">Logout</button>
          </div>
        ` : `
          <a href="cart.html" class="nav-link cart-link">
            🛒 Cart
            <span class="cart-badge" id="cart-badge" style="display:none">0</span>
          </a>
          <a href="login.html" class="nav-link">Login</a>
          <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `}
      </div>
    </div>
  `;

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      window.location.href = 'index.html';
    });
  }

  // Mobile toggle
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.classList.toggle('active');
    });
  }
}

// ---------- Toast notifications ----------
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---------- Utility ----------
function formatPrice(p) { return '$' + Number(p).toFixed(2); }
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getCategories() {
  const products = getProducts();
  return [...new Set(products.map(p => p.category))].sort();
}

// ---------- Init on every page ----------
document.addEventListener('DOMContentLoaded', () => {
  seedData();
  renderNavbar();
  updateCartBadge();
});
