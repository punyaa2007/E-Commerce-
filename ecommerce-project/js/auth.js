// ============================================================
//  auth.js  –  Login & Register logic
// ============================================================

function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // If already logged in, redirect
  const u = getCurrentUser();
  if (u) {
    window.location.href = u.role === 'admin' ? 'admin.html' : 'index.html';
    return;
  }

  // Demo credentials hint
  const hint = document.getElementById('demo-hint');
  if (hint) {
    hint.innerHTML = `
      <strong>Demo accounts:</strong><br>
      Admin: admin@example.com / admin123<br>
      (Or register a new user account)
    `;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    const users = store.getArr(KEYS.users);
    const user  = users.find(u => u.email === email && u.password === password);

    if (!user) {
      showFieldError('login-error', 'Invalid email or password.');
      return;
    }

    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`);
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
    }, 500);
  });
}

function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const u = getCurrentUser();
  if (u) { window.location.href = 'index.html'; return; }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name     = form['reg-name'].value.trim();
    const email    = form['reg-email'].value.trim().toLowerCase();
    const password = form['reg-password'].value;
    const confirm  = form['reg-confirm'].value;

    clearFieldError('reg-error');

    if (name.length < 2) { showFieldError('reg-error', 'Name must be at least 2 characters.'); return; }
    if (!isValidEmail(email)) { showFieldError('reg-error', 'Please enter a valid email address.'); return; }
    if (password.length < 6) { showFieldError('reg-error', 'Password must be at least 6 characters.'); return; }
    if (password !== confirm) { showFieldError('reg-error', 'Passwords do not match.'); return; }

    const users = store.getArr(KEYS.users);
    if (users.find(u => u.email === email)) {
      showFieldError('reg-error', 'An account with this email already exists.');
      return;
    }

    const newUser = {
      id: generateId(),
      name,
      email,
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    store.set(KEYS.users, users);
    setCurrentUser(newUser);

    showToast('Account created! Welcome aboard 🎉');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
  });
}

// ---------- Helpers ----------
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearFieldError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

document.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initRegisterPage();
});
