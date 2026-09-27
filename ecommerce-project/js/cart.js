// ============================================================
//  cart.js  –  Cart page & checkout page logic
// ============================================================

// ---- Cart Page ----
function initCartPage() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  const user = requireAuth();
  if (!user) return;

  function render() {
    const items    = getCart(user.id);
    const products = getProducts();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <div class="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <a href="products.html" class="btn btn-primary">Browse Products</a>
        </div>
      `;
      const summary = document.getElementById('cart-summary');
      if (summary) summary.style.display = 'none';
      return;
    }

    let subtotal = 0;
    const rows = items.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) return '';
      const lineTotal = p.price * item.quantity;
      subtotal += lineTotal;
      return `
        <div class="cart-item" data-id="${p.id}">
          <img src="${p.image}" alt="${p.name}"
               onerror="this.src='https://via.placeholder.com/80x80?text=?'">
          <div class="cart-item-info">
            <a href="product.html?id=${p.id}" class="cart-item-name">${p.name}</a>
            <span class="cart-item-category">${p.category}</span>
            <span class="cart-item-price">${formatPrice(p.price)} each</span>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn cart-qty-minus" data-id="${p.id}">−</button>
            <span class="cart-qty-display">${item.quantity}</span>
            <button class="qty-btn cart-qty-plus" data-id="${p.id}" ${item.quantity >= p.stock ? 'disabled' : ''}>+</button>
          </div>
          <div class="cart-item-total">${formatPrice(lineTotal)}</div>
          <button class="cart-remove-btn" data-id="${p.id}" title="Remove item">🗑️</button>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="cart-items">${rows}</div>`;

    // Summary
    const summary = document.getElementById('cart-summary');
    if (summary) {
      summary.style.display = 'block';
      const shipping = subtotal > 50 ? 0 : 5.99;
      const total    = subtotal + shipping;
      summary.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span class="free-ship">FREE</span>' : formatPrice(shipping)}</span></div>
        ${shipping > 0 ? `<p class="ship-note">Add ${formatPrice(50 - subtotal)} more for free shipping!</p>` : ''}
        <div class="summary-row summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block">Proceed to Checkout</a>
        <a href="products.html" class="btn btn-outline btn-block" style="margin-top:8px;">Continue Shopping</a>
      `;
    }

    // Event listeners
    container.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => changeQty(btn.dataset.id, -1));
    });
    container.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => changeQty(btn.dataset.id, 1));
    });
    container.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.id));
    });
  }

  function changeQty(productId, delta) {
    const items = getCart(user.id);
    const idx   = items.findIndex(i => i.productId === productId);
    if (idx === -1) return;
    const products = getProducts();
    const p = products.find(x => x.id === productId);
    items[idx].quantity += delta;
    if (items[idx].quantity <= 0) { items.splice(idx, 1); }
    else if (p && items[idx].quantity > p.stock) { items[idx].quantity = p.stock; }
    saveCart(user.id, items);
    render();
  }

  function removeItem(productId) {
    const items = getCart(user.id).filter(i => i.productId !== productId);
    saveCart(user.id, items);
    showToast('Item removed from cart.');
    render();
  }

  render();
}

// ---- Checkout Page ----
function initCheckoutPage() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  const user = requireAuth();
  if (!user) return;

  const items    = getCart(user.id);
  const products = getProducts();

  if (items.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // Order summary
  const summaryEl = document.getElementById('checkout-summary');
  if (summaryEl) {
    let subtotal = 0;
    const rows = items.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) return '';
      const lineTotal = p.price * item.quantity;
      subtotal += lineTotal;
      return `
        <div class="checkout-item">
          <img src="${p.image}" alt="${p.name}"
               onerror="this.src='https://via.placeholder.com/50x50?text=?'">
          <span class="checkout-item-name">${p.name} ×${item.quantity}</span>
          <span class="checkout-item-price">${formatPrice(lineTotal)}</span>
        </div>
      `;
    }).join('');

    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;

    summaryEl.innerHTML = `
      <h3>Order Summary</h3>
      ${rows}
      <hr>
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
      <div class="summary-row summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>
    `;
  }

  // Prefill name/email
  if (form['ch-name'])  form['ch-name'].value  = user.name;
  if (form['ch-email']) form['ch-email'].value = user.email;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const products = getProducts();
    let subtotal = 0;
    const orderItems = items.map(item => {
      const p = products.find(x => x.id === item.productId);
      const lineTotal = (p ? p.price : 0) * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        productName: p ? p.name : 'Unknown',
        quantity: item.quantity,
        price: p ? p.price : 0,
        lineTotal,
      };
    });

    const shipping = subtotal > 50 ? 0 : 5.99;

    const order = {
      id: 'ORD-' + generateId().toUpperCase(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: orderItems,
      shippingAddress: {
        fullName: form['ch-name'].value.trim(),
        email:    form['ch-email'].value.trim(),
        address:  form['ch-address'].value.trim(),
        city:     form['ch-city'].value.trim(),
        state:    form['ch-state'].value.trim(),
        zip:      form['ch-zip'].value.trim(),
        country:  form['ch-country'].value.trim(),
      },
      payment: form['ch-payment'].value,
      subtotal,
      shipping,
      total: subtotal + shipping,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Deduct stock
    const allProducts = getProducts();
    orderItems.forEach(oi => {
      const idx = allProducts.findIndex(p => p.id === oi.productId);
      if (idx > -1) { allProducts[idx].stock = Math.max(0, allProducts[idx].stock - oi.quantity); }
    });
    saveProducts(allProducts);

    // Save order
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Clear cart
    saveCart(user.id, []);

    // Store last order ID for confirmation
    sessionStorage.setItem('last_order_id', order.id);

    window.location.href = `orders.html?confirm=${order.id}`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCartPage();
  initCheckoutPage();
});
