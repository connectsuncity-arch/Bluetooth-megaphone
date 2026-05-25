/**
 * AeroMix Authentication System
 * Handles user sign-up, login, JWT tokens, and subscription tier management
 */

const AUTH_CONFIG = {
  API_URL: 'https://aeromix-api.herokuapp.com/api',
  TOKEN_KEY: 'aeromix_auth_token',
  USER_KEY: 'aeromix_user_data',
  TIERS: {
    FREE: 'free',
    PREMIUM: 'premium',
    PRO: 'pro',
    LIFETIME: 'lifetime'
  }
};

// Current user state
let currentUser = null;
let authToken = null;

/**
 * Initialize auth system on page load
 */
async function initAuth() {
  try {
    // Check for existing token
    authToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    
    if (authToken && storedUser) {
      currentUser = JSON.parse(storedUser);
      // Verify token is still valid
      const isValid = await verifyToken(authToken);
      if (isValid) {
        logToConsole(`Welcome back, ${currentUser.username}! Tier: ${currentUser.tier}`, 'success');
        updateUIForUser();
        return true;
      } else {
        // Token expired, clear storage
        logout();
      }
    }
    
    // Show login modal if not authenticated
    showAuthModal();
    return false;
  } catch (err) {
    logToConsole(`Auth initialization error: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Sign up new user
 */
async function signup(email, username, password) {
  try {
    logToConsole('Creating new account...', 'info');
    
    const response = await fetch(`${AUTH_CONFIG.API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        username,
        password,
        createdAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();
    
    // Store token and user data
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, authToken);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
    
    logToConsole(`Account created! Welcome, ${username}!`, 'success');
    updateUIForUser();
    closeAuthModal();
    
    return true;
  } catch (err) {
    logToConsole(`Signup error: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Login existing user
 */
async function login(email, password) {
  try {
    logToConsole('Authenticating...', 'info');
    
    const response = await fetch(`${AUTH_CONFIG.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, authToken);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
    
    logToConsole(`Welcome back, ${currentUser.username}!`, 'success');
    updateUIForUser();
    closeAuthModal();
    
    return true;
  } catch (err) {
    logToConsole(`Login error: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Logout current user
 */
function logout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  logToConsole('Logged out successfully', 'system');
  window.location.reload();
}

/**
 * Verify JWT token validity
 */
async function verifyToken(token) {
  try {
    const response = await fetch(`${AUTH_CONFIG.API_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Get current user tier
 */
function getUserTier() {
  return currentUser?.tier || AUTH_CONFIG.TIERS.FREE;
}

/**
 * Check if user has premium features
 */
function isPremium() {
  const tier = getUserTier();
  return [AUTH_CONFIG.TIERS.PREMIUM, AUTH_CONFIG.TIERS.PRO, AUTH_CONFIG.TIERS.LIFETIME].includes(tier);
}

/**
 * Check if user is pro tier
 */
function isPro() {
  return getUserTier() === AUTH_CONFIG.TIERS.PRO || getUserTier() === AUTH_CONFIG.TIERS.LIFETIME;
}

/**
 * Check if user has lifetime license
 */
function hasLifetimeLicense() {
  return getUserTier() === AUTH_CONFIG.TIERS.LIFETIME;
}

/**
 * Update UI based on user tier
 */
function updateUIForUser() {
  const tier = getUserTier();
  
  // Show user info
  const userBadge = document.querySelector('.user-badge');
  if (userBadge) {
    userBadge.innerHTML = `
      <span class="tier-badge ${tier}">${tier.toUpperCase()}</span>
      <span class="username">${currentUser.username}</span>
    `;
  }
  
  // Hide auth modal
  closeAuthModal();
  
  // Lock/unlock premium features
  lockFeaturesByTier();
  
  // Show ads only for free users
  if (tier === AUTH_CONFIG.TIERS.FREE) {
    showAds();
  } else {
    hideAds();
  }
}

/**
 * Lock/unlock features based on tier
 */
function lockFeaturesByTier() {
  const tier = getUserTier();
  
  // Premium sampler pads (more than 4)
  const samplerBtns = document.querySelectorAll('.sampler-btn');
  if (samplerBtns.length > 4) {
    samplerBtns.forEach((btn, idx) => {
      if (idx >= 4) {
        if (isPremium()) {
          btn.disabled = false;
          btn.classList.remove('locked');
        } else {
          btn.disabled = true;
          btn.classList.add('locked');
          btn.title = 'Premium Feature - Upgrade to unlock';
        }
      }
    });
  }
  
  // 4-deck mixing (Pro only)
  const deckCElements = document.querySelectorAll('.deck-c, .deck-d');
  deckCElements.forEach(el => {
    if (isPro()) {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
  
  // Audio recording (Pro only)
  const recordBtn = document.querySelector('.record-btn');
  if (recordBtn) {
    if (isPro()) {
      recordBtn.disabled = false;
      recordBtn.classList.remove('locked');
    } else {
      recordBtn.disabled = true;
      recordBtn.classList.add('locked');
      recordBtn.title = 'Pro Feature - Upgrade to unlock';
    }
  }
  
  // Cloud sync (Premium+)
  const syncBtn = document.querySelector('.cloud-sync-btn');
  if (syncBtn) {
    if (isPremium()) {
      syncBtn.disabled = false;
      syncBtn.classList.remove('locked');
    } else {
      syncBtn.disabled = true;
      syncBtn.classList.add('locked');
      syncBtn.title = 'Premium Feature - Upgrade to unlock';
    }
  }
}

/**
 * Show upgrade modal for locked features
 */
function showUpgradeModal(featureName) {
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal glass-panel';
  modal.innerHTML = `
    <div class="upgrade-content">
      <h2>🔒 Premium Feature</h2>
      <p><strong>${featureName}</strong> is only available in premium tiers.</p>
      <div class="upgrade-options">
        <div class="option">
          <h3>Premium</h3>
          <p class="price">$4.99<span>/month</span></p>
          <ul>
            <li>✓ Advanced effects</li>
            <li>✓ Unlimited samplers</li>
            <li>✓ Cloud sync</li>
            <li>✗ 4-deck mixing</li>
          </ul>
          <button onclick="purchaseSubscription('premium')">Subscribe</button>
        </div>
        <div class="option featured">
          <div class="badge">MOST POPULAR</div>
          <h3>Pro</h3>
          <p class="price">$7.99<span>/month</span></p>
          <ul>
            <li>✓ Everything in Premium</li>
            <li>✓ 4-deck mixing</li>
            <li>✓ Audio recording</li>
            <li>✓ Priority support</li>
          </ul>
          <button onclick="purchaseSubscription('pro')">Subscribe</button>
        </div>
        <div class="option">
          <h3>Lifetime</h3>
          <p class="price">$99.99<span>one-time</span></p>
          <ul>
            <li>✓ Everything forever</li>
            <li>✓ No recurring charges</li>
            <li>✓ Lifetime updates</li>
            <li>✓ VIP support</li>
          </ul>
          <button onclick="purchaseSubscription('lifetime')">Buy Now</button>
        </div>
      </div>
      <button class="close-modal" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Show auth modal
 */
function showAuthModal() {
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'auth-modal glass-panel';
  modal.innerHTML = `
    <div class="auth-content">
      <h1>AeroMix</h1>
      <p>Dual-Deck DJ Mixer & MC Microphone</p>
      
      <div class="auth-tabs">
        <button class="tab-btn active" data-tab="login">Login</button>
        <button class="tab-btn" data-tab="signup">Sign Up</button>
      </div>
      
      <div id="login-tab" class="auth-tab active">
        <input type="email" id="login-email" placeholder="Email" />
        <input type="password" id="login-password" placeholder="Password" />
        <button onclick="login(document.getElementById('login-email').value, document.getElementById('login-password').value)">Login</button>
        <p>Or continue as <button onclick="guestMode()" style="background:none;border:none;color:#00f2fe;cursor:pointer;text-decoration:underline;">Guest</button></p>
      </div>
      
      <div id="signup-tab" class="auth-tab">
        <input type="email" id="signup-email" placeholder="Email" />
        <input type="text" id="signup-username" placeholder="Username" />
        <input type="password" id="signup-password" placeholder="Password" />
        <input type="password" id="signup-confirm" placeholder="Confirm Password" />
        <button onclick="handleSignup()">Create Account</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Tab switching
  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      document.getElementById(e.target.dataset.tab + '-tab').classList.add('active');
    });
  });
}

/**
 * Handle signup form submission
 */
async function handleSignup() {
  const email = document.getElementById('signup-email').value;
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  
  if (!email || !username || !password) {
    alert('Please fill all fields');
    return;
  }
  
  if (password !== confirm) {
    alert('Passwords do not match');
    return;
  }
  
  await signup(email, username, password);
}

/**
 * Guest mode - limited access
 */
function guestMode() {
  currentUser = {
    id: 'guest_' + Date.now(),
    username: 'Guest',
    tier: AUTH_CONFIG.TIERS.FREE,
    isGuest: true
  };
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
  updateUIForUser();
  logToConsole('Entered guest mode. Upgrade to unlock premium features!', 'info');
}

/**
 * Close auth modal
 */
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.remove();
}
