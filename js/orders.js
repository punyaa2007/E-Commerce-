// ============================================================
//  orders.js  –  My Orders page
// ============================================================

const STATUS_CONFIG = {
  'Pending':    { color: '#f59e0b', icon: '⏳' },
  'Confirmed':  { color: '#3b82f6', icon: '✅' },
  'Processing': { color: '#8b5cf6', icon: '⚙️' },
  'Shipped':    { color: '#06b6d4', icon: '🚚' },
  'Delivered':  { color: '#10b981', icon: '📦' },
  'Cancelled':  { color: '#ef4444', icon: '❌' },
};

function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { color: '#6b7280', icon: '❓' };
  return `<span class="status-badge" style="background:${cfg.color}20;color:${cfg.color};border:1px solid ${cfg.color}40">${cfg.icon} ${status}</span>`;
}

function initOrdersPage() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  const user = requireAuth();
  if (!user) return;

  // Order confirmation banner
  const params = new URLSearchParams(window.location.search);
  const confirmId = params.get('confirm');
  const confirmBanner = document.getElementById('confirm-banner');
  if (confirmId && confirmBanner) {
    confirmBanner.innerHTML = `
      <div class="confirm-banner">
        🎉 <strong>Order Placed Successfully!</strong>
        Your order <strong>${confirmId}</strong> has been received and is now <em>Pending</em>.
        <button onclick="this.parentElement.parentElement.style.display='none'" class="close-btn">✕</button>
      </div>
    `;
    confirmBanner.style.display = 'block';
  }

  function render() {
    const allOrders = getOrders().filter(o => o.userId === user.id);

    if (allOrders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="font-size:3rem">📦</div>
          <h2>No orders yet</h2>
          <p>Start shopping and your orders will appear here.</p>
          <a href="products.html" class="btn btn-primary">Shop Now</a>
        </div>
      `;
      return;
    }

    // Sort newest first
    const sorted = [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = sorted.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <span class="order-id">${order.id}</span>
            <span class="order-date">${new Date(order.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</span>
          </div>
          <div class="order-header-right">
            ${statusBadge(order.status)}
            <span class="order-total">${formatPrice(order.total)}</span>
          </div>
        </div>
        <div class="order-items-list">
          ${order.items.map(item => `
            <div class="order-item-row">
              <span class="oi-name">${item.productName}</span>
              <span class="oi-qty">×${item.quantity}</span>
              <span class="oi-price">${formatPrice(item.lineTotal)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-card-footer">
          <div class="order-address">
            📍 ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
          </div>
          <div class="order-status-track">
            ${renderStatusTracker(order.status)}
          </div>
        </div>
      </div>
    `).join('');
  }

  render();
}

function renderStatusTracker(currentStatus) {
  const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const isCancelled = currentStatus === 'Cancelled';
  if (isCancelled) {
    return `<div class="status-track-cancelled">Order has been <strong>Cancelled</strong></div>`;
  }
  const currentIdx = steps.indexOf(currentStatus);
  return `
    <div class="status-tracker">
      ${steps.map((step, i) => `
        <div class="tracker-step ${i <= currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}">
          <div class="tracker-dot"></div>
          <span class="tracker-label">${step}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="tracker-line ${i < currentIdx ? 'done' : ''}"></div>` : ''}
      `).join('')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initOrdersPage);
