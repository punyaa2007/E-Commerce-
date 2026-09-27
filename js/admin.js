// ============================================================
//  admin.js  –  Admin dashboard logic
// ============================================================

function initAdminPage() {
  const adminRoot = document.getElementById('admin-root');
  if (!adminRoot) return;

  const user = requireAdmin();
  if (!user) return;

  let editingProductId = null;

  // ---- Tab switching ----
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  function showPanel(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
    if (name === 'dashboard') renderDashboard();
    if (name === 'products')  renderProductsTable();
    if (name === 'orders')    renderOrdersTable();
  }

  tabs.forEach(t => t.addEventListener('click', () => showPanel(t.dataset.tab)));

  // ---- Dashboard ----
  function renderDashboard() {
    const products = getProducts();
    const orders   = getOrders();
    const users    = store.getArr(KEYS.users);
    const revenue  = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);

    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-orders').textContent   = orders.length;
    document.getElementById('stat-users').textContent    = users.filter(u => u.role !== 'admin').length;
    document.getElementById('stat-revenue').textContent  = formatPrice(revenue);

    // Recent orders
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentEl = document.getElementById('recent-orders');
    if (recentEl) {
      recentEl.innerHTML = recentOrders.length === 0 ? '<p class="empty-msg">No orders yet.</p>' : recentOrders.map(o => `
        <div class="recent-order-row">
          <span class="ro-id">${o.id}</span>
          <span class="ro-user">${o.userName}</span>
          <span class="ro-total">${formatPrice(o.total)}</span>
          <span class="status-badge" style="background:${(STATUS_CONFIG[o.status]||{color:'#6b7280'}).color}20;color:${(STATUS_CONFIG[o.status]||{color:'#6b7280'}).color}">${o.status}</span>
        </div>
      `).join('');
    }
  }

  // ---- Products Table ----
  function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    const products = getProducts();
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" class="admin-product-img" onerror="this.src='https://via.placeholder.com/50x50?text=?'"></td>
        <td>${p.name}</td>
        <td><span class="badge">${p.category}</span></td>
        <td>${formatPrice(p.price)}</td>
        <td>
          <span class="${p.stock === 0 ? 'out-of-stock' : 'in-stock'}">${p.stock}</span>
        </td>
        <td class="admin-actions">
          <button class="btn btn-sm btn-outline" onclick="adminEditProduct('${p.id}')">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="adminDeleteProduct('${p.id}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // ---- Orders Table ----
  function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    const orders = [...getOrders()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    tbody.innerHTML = orders.length === 0 ? '<tr><td colspan="6" class="empty-msg">No orders yet.</td></tr>' : orders.map(o => `
      <tr>
        <td class="order-id-cell">${o.id}</td>
        <td>${o.userName}<br><small>${o.userEmail}</small></td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td>${formatPrice(o.total)}</td>
        <td>
          <select class="status-select" data-order-id="${o.id}" onchange="adminUpdateOrderStatus('${o.id}', this.value)">
            ${['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'].map(s =>
              `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="adminViewOrderDetails('${o.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  // ---- Product Form ----
  const productModal   = document.getElementById('product-modal');
  const productForm    = document.getElementById('product-form');
  const addProductBtn  = document.getElementById('add-product-btn');
  const closeModalBtn  = document.getElementById('close-modal');
  const modalTitle     = document.getElementById('modal-title');

  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      editingProductId = null;
      if (modalTitle) modalTitle.textContent = 'Add New Product';
      productForm.reset();
      productModal.style.display = 'flex';
    });
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => { productModal.style.display = 'none'; });
  }
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) productModal.style.display = 'none';
    });
  }

  window.adminEditProduct = function(id) {
    const p = getProductById(id);
    if (!p) return;
    editingProductId = id;
    if (modalTitle) modalTitle.textContent = 'Edit Product';
    productForm['pf-name'].value        = p.name;
    productForm['pf-category'].value    = p.category;
    productForm['pf-price'].value       = p.price;
    productForm['pf-stock'].value       = p.stock;
    productForm['pf-image'].value       = p.image;
    productForm['pf-description'].value = p.description;
    productModal.style.display = 'flex';
  };

  window.adminDeleteProduct = function(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderProductsTable();
    renderDashboard();
    showToast('Product deleted.', 'error');
  };

  window.adminUpdateOrderStatus = function(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      orders[idx].status    = newStatus;
      orders[idx].updatedAt = new Date().toISOString();
      saveOrders(orders);
      showToast(`Order ${orderId} status updated to ${newStatus}.`);
    }
  };

  window.adminViewOrderDetails = function(orderId) {
    const order = getOrders().find(o => o.id === orderId);
    if (!order) return;
    const details = `
Order ID: ${order.id}
Customer: ${order.userName} (${order.userEmail})
Date: ${new Date(order.createdAt).toLocaleString()}
Status: ${order.status}

Items:
${order.items.map(i => `  • ${i.productName} ×${i.quantity} = ${formatPrice(i.lineTotal)}`).join('\n')}

Shipping to: ${order.shippingAddress.fullName}
  ${order.shippingAddress.address}
  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
  ${order.shippingAddress.country}

Subtotal: ${formatPrice(order.subtotal)}
Shipping: ${order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
Total: ${formatPrice(order.total)}
    `.trim();
    alert(details);
  };

  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newProduct = {
        id:          editingProductId || generateId(),
        name:        productForm['pf-name'].value.trim(),
        category:    productForm['pf-category'].value.trim(),
        price:       parseFloat(productForm['pf-price'].value),
        stock:       parseInt(productForm['pf-stock'].value),
        image:       productForm['pf-image'].value.trim(),
        description: productForm['pf-description'].value.trim(),
      };

      const products = getProducts();
      if (editingProductId) {
        const idx = products.findIndex(p => p.id === editingProductId);
        if (idx > -1) products[idx] = newProduct;
      } else {
        products.push(newProduct);
      }
      saveProducts(products);
      productModal.style.display = 'none';
      renderProductsTable();
      renderDashboard();
      showToast(editingProductId ? 'Product updated.' : 'Product added.');
    });
  }

  // STATUS_CONFIG from orders.js (redefine here to avoid cross-file dependency)
  if (typeof STATUS_CONFIG === 'undefined') {
    window.STATUS_CONFIG = {
      'Pending':    { color: '#f59e0b' },
      'Confirmed':  { color: '#3b82f6' },
      'Processing': { color: '#8b5cf6' },
      'Shipped':    { color: '#06b6d4' },
      'Delivered':  { color: '#10b981' },
      'Cancelled':  { color: '#ef4444' },
    };
  }

  // Initial render
  showPanel('dashboard');
}

document.addEventListener('DOMContentLoaded', initAdminPage);
