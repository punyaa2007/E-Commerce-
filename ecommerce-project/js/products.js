// ============================================================
//  products.js  –  Product listing, search, filter, detail
// ============================================================

// ---- Product Card HTML ----
function createProductCard(product, user) {
  const inStock = product.stock > 0;
  return `
    <div class="product-card" data-id="${product.id}">
      <a href="product.html?id=${product.id}" class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        ${!inStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
      </a>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-name">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="btn btn-primary btn-sm add-to-cart-btn"
                  data-id="${product.id}"
                  ${!inStock ? 'disabled' : ''}>
            ${inStock ? '🛒 Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---- Products Listing Page ----
function initProductsPage() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const user = getCurrentUser();
  let allProducts = getProducts();
  let filtered = [...allProducts];

  const searchInput    = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect     = document.getElementById('sort-select');
  const resultsCount   = document.getElementById('results-count');
  const categoryList   = document.getElementById('category-list');

  // Build category filter buttons & populate dropdown
  const cats = getCategories();
  if (categoryList) {
    categoryList.innerHTML = `
      <button class="cat-btn active" data-cat="All">All</button>
      ${cats.map(c => `<button class="cat-btn" data-cat="${c}">${c}</button>`).join('')}
    `;
    categoryList.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      categoryList.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (categoryFilter) categoryFilter.value = btn.dataset.cat;
      applyFilters();
    });
  }
  if (categoryFilter) {
    categoryFilter.innerHTML = `<option value="All">All Categories</option>` +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // Read URL params (from home category click)
  const params = new URLSearchParams(window.location.search);
  const urlCat = params.get('category');
  const urlQ   = params.get('q');
  if (urlCat && categoryFilter) { categoryFilter.value = urlCat; highlightCatBtn(urlCat); }
  if (urlQ && searchInput) { searchInput.value = urlQ; }

  function highlightCatBtn(cat) {
    if (!categoryList) return;
    categoryList.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
  }

  function applyFilters() {
    const q   = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cat = categoryFilter ? categoryFilter.value : 'All';
    const srt = sortSelect ? sortSelect.value : 'default';

    filtered = allProducts.filter(p => {
      const matchQ   = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchCat = cat === 'All' || p.category === cat;
      return matchQ && matchCat;
    });

    if (srt === 'price-asc')  filtered.sort((a, b) => a.price - b.price);
    if (srt === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (srt === 'name-asc')   filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderGrid();
  }

  function renderGrid() {
    if (resultsCount) resultsCount.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`;
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>😕 No products match your search.</p><button class="btn btn-outline" onclick="clearFilters()">Clear Filters</button></div>`;
      return;
    }
    grid.innerHTML = filtered.map(p => createProductCard(p, user)).join('');

    // Attach add-to-cart listeners
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!user) { window.location.href = 'login.html'; return; }
        const pid = btn.dataset.id;
        addToCart(user.id, pid);
        showToast('Added to cart! 🛒');
      });
    });
  }

  window.clearFilters = function() {
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'All';
    if (sortSelect) sortSelect.value = 'default';
    highlightCatBtn('All');
    applyFilters();
  };

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', (e) => { highlightCatBtn(e.target.value); applyFilters(); });
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);

  applyFilters();
}

// ---- Product Detail Page ----
function initProductDetailPage() {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { container.innerHTML = '<p class="error-msg">Product not found.</p>'; return; }

  const product = getProductById(id);
  if (!product) { container.innerHTML = '<p class="error-msg">Product not found.</p>'; return; }

  document.title = `${product.name} – ShopEase`;
  const user = getCurrentUser();
  const inStock = product.stock > 0;

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-img">
        <img src="${product.image}" alt="${product.name}"
             onerror="this.src='https://via.placeholder.com/500x400?text=No+Image'">
      </div>
      <div class="product-detail-info">
        <span class="product-category badge">${product.category}</span>
        <h1 class="product-detail-name">${product.name}</h1>
        <p class="product-detail-price">${formatPrice(product.price)}</p>
        <p class="product-detail-desc">${product.description}</p>
        <p class="stock-info ${inStock ? 'in-stock' : 'out-of-stock'}">
          ${inStock ? `✅ In Stock (${product.stock} available)` : '❌ Out of Stock'}
        </p>
        ${inStock ? `
        <div class="qty-selector">
          <label>Quantity:</label>
          <div class="qty-controls">
            <button class="qty-btn" id="qty-minus">−</button>
            <input type="number" id="qty-input" value="1" min="1" max="${product.stock}" class="qty-input">
            <button class="qty-btn" id="qty-plus">+</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="detail-add-cart">🛒 Add to Cart</button>
        ` : ''}
        <a href="products.html" class="btn btn-outline btn-lg" style="margin-top:8px;">← Back to Products</a>
      </div>
    </div>
  `;

  if (!inStock) return;

  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    if (parseInt(qtyInput.value) < product.stock) qtyInput.value = parseInt(qtyInput.value) + 1;
  });

  document.getElementById('detail-add-cart').addEventListener('click', () => {
    if (!user) { window.location.href = 'login.html'; return; }
    const qty = parseInt(qtyInput.value) || 1;
    addToCart(user.id, product.id, qty);
    showToast(`${qty} item(s) added to cart! 🛒`);
  });
}

// ---- Home Page Featured Products ----
function initHomeFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const user = getCurrentUser();
  const products = getProducts().slice(0, 8);
  grid.innerHTML = products.map(p => createProductCard(p, user)).join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!user) { window.location.href = 'login.html'; return; }
      addToCart(user.id, btn.dataset.id);
      showToast('Added to cart! 🛒');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProductsPage();
  initProductDetailPage();
  initHomeFeatured();
});
