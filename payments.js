/**
 * AeroMix Payment System
 * Stripe & PayPal integration for subscriptions and one-time purchases
 */

const PAYMENT_CONFIG = {
  STRIPE_KEY: 'pk_test_YOUR_STRIPE_KEY', // Replace with actual key
  PAYPAL_ID: 'YOUR_PAYPAL_CLIENT_ID', // Replace with actual ID
  API_URL: 'https://aeromix-api.herokuapp.com/api'
};

const PRODUCTS = {
  // Subscriptions (monthly)
  premium_monthly: {
    id: 'price_premium_monthly',
    name: 'Premium Monthly',
    price: 4.99,
    interval: 'month',
    tier: 'premium'
  },
  pro_monthly: {
    id: 'price_pro_monthly',
    name: 'Pro Monthly',
    price: 7.99,
    interval: 'month',
    tier: 'pro'
  },
  
  // Subscriptions (yearly) - 20% discount
  premium_yearly: {
    id: 'price_premium_yearly',
    name: 'Premium Yearly',
    price: 47.88, // $4.99 * 12 * 0.8
    interval: 'year',
    tier: 'premium',
    savings: '20%'
  },
  pro_yearly: {
    id: 'price_pro_yearly',
    name: 'Pro Yearly',
    price: 76.72, // $7.99 * 12 * 0.8
    interval: 'year',
    tier: 'pro',
    savings: '20%'
  },
  
  // One-time purchases
  lifetime: {
    id: 'sku_lifetime',
    name: 'Lifetime License',
    price: 99.99,
    type: 'one_time',
    tier: 'lifetime'
  },
  
  // Sound packs
  sound_pack_drums: {
    id: 'sku_sounds_drums',
    name: 'Professional Drum Kit',
    price: 2.99,
    type: 'one_time'
  },
  sound_pack_effects: {
    id: 'sku_sounds_effects',
    name: 'Vocal Effects Bundle',
    price: 3.99,
    type: 'one_time'
  },
  sound_pack_all: {
    id: 'sku_sounds_all',
    name: 'All Sound Packs Bundle',
    price: 6.99,
    type: 'one_time',
    value: '$8.98'
  },
  
  // Feature unlocks
  recording_addon: {
    id: 'sku_recording',
    name: 'Audio Recording Feature',
    price: 9.99,
    type: 'one_time'
  }
};

/**
 * Initialize Stripe
 */
function initializeStripe() {
  if (window.Stripe) {
    window.stripe = Stripe(PAYMENT_CONFIG.STRIPE_KEY);
  } else {
    logToConsole('Stripe not loaded', 'error');
  }
}

/**
 * Initialize PayPal
 */
function initializePayPal() {
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${PAYMENT_CONFIG.PAYPAL_ID}&currency=USD`;
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Purchase subscription via Stripe
 */
async function purchaseSubscription(tier, interval = 'month') {
  if (!currentUser || !authToken) {
    showAuthModal();
    return;
  }
  
  try {
    logToConsole('Initiating checkout...', 'info');
    
    const productKey = tier === 'premium' 
      ? (interval === 'year' ? 'premium_yearly' : 'premium_monthly')
      : (interval === 'year' ? 'pro_yearly' : 'pro_monthly');
    
    const product = PRODUCTS[productKey];
    
    // Create checkout session
    const response = await fetch(`${PAYMENT_CONFIG.API_URL}/payments/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        priceId: product.id,
        tier: product.tier,
        interval: product.interval
      })
    });
    
    if (!response.ok) throw new Error('Checkout creation failed');
    
    const { sessionId } = await response.json();
    
    // Redirect to Stripe checkout
    const { error } = await window.stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      logToConsole(`Checkout error: ${error.message}`, 'error');
    }
  } catch (err) {
    logToConsole(`Purchase error: ${err.message}`, 'error');
  }
}

/**
 * Purchase one-time item (lifetime, sounds, etc.)
 */
async function purchaseOneTime(productKey, method = 'stripe') {
  if (!currentUser || !authToken) {
    showAuthModal();
    return;
  }
  
  try {
    const product = PRODUCTS[productKey];
    
    if (method === 'stripe') {
      const response = await fetch(`${PAYMENT_CONFIG.API_URL}/payments/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          amount: Math.round(product.price * 100), // Convert to cents
          type: productKey
        })
      });
      
      const { clientSecret } = await response.json();
      
      // Show payment modal
      showPaymentModal(clientSecret, product);
    } else if (method === 'paypal') {
      showPayPalCheckout(product, productKey);
    }
  } catch (err) {
    logToConsole(`Payment initiation error: ${err.message}`, 'error');
  }
}

/**
 * Show payment modal with Stripe Elements
 */
function showPaymentModal(clientSecret, product) {
  const modal = document.createElement('div');
  modal.className = 'payment-modal glass-panel';
  modal.innerHTML = `
    <div class="payment-content">
      <button class="close-modal" onclick="this.parentElement.parentElement.remove()">✕</button>
      
      <h2>Complete Purchase</h2>
      <div class="product-summary">
        <p><strong>${product.name}</strong></p>
        <p class="price">$${product.price.toFixed(2)}</p>
      </div>
      
      <form id="payment-form">
        <div id="card-element"></div>
        <div id="card-errors" class="error"></div>
        
        <button type="submit" id="submit-btn">Pay $${product.price.toFixed(2)}</button>
      </form>
      
      <div class="payment-methods">
        <p>Or pay with:</p>
        <button onclick="showPayPalCheckout('${JSON.stringify(product).replace(/'/g, '\\'')}', '${product.id}')">PayPal</button>
        <button>Apple Pay</button>
        <button>Google Pay</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize Stripe Elements
  if (window.stripe) {
    const elements = window.stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');
    
    // Handle form submission
    document.getElementById('payment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const { token, error } = await window.stripe.createToken(cardElement);
      
      if (error) {
        document.getElementById('card-errors').textContent = error.message;
      } else {
        processPayment(token.id, clientSecret);
        modal.remove();
      }
    });
  }
}

/**
 * Process payment with backend
 */
async function processPayment(tokenId, clientSecret) {
  try {
    logToConsole('Processing payment...', 'info');
    
    const response = await fetch(`${PAYMENT_CONFIG.API_URL}/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        tokenId,
        clientSecret
      })
    });
    
    if (!response.ok) throw new Error('Payment processing failed');
    
    const data = await response.json();
    
    // Update user tier
    currentUser.tier = data.tier;
    currentUser.subscriptionId = data.subscriptionId;
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
    
    logToConsole('✓ Payment successful! Your account has been upgraded.', 'success');
    updateUIForUser();
    lockFeaturesByTier();
  } catch (err) {
    logToConsole(`Payment processing error: ${err.message}`, 'error');
  }
}

/**
 * Show PayPal checkout
 */
function showPayPalCheckout(product, productKey) {
  const modal = document.createElement('div');
  modal.className = 'paypal-modal glass-panel';
  modal.innerHTML = `
    <div class="paypal-content">
      <h2>PayPal Checkout</h2>
      <div id="paypal-button-container"></div>
      <button class="close-modal" onclick="this.parentElement.parentElement.remove()">Cancel</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // PayPal button setup
  if (window.paypal) {
    window.paypal.Buttons({
      createOrder: async (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: product.price.toString()
            },
            description: product.name
          }]
        });
      },
      onApprove: async (data, actions) => {
        const order = await actions.order.capture();
        // Send to backend for verification
        confirmPayPalPayment(order, productKey);
        modal.remove();
      },
      onError: (err) => {
        logToConsole(`PayPal error: ${err}`, 'error');
      }
    }).render('#paypal-button-container');
  }
}

/**
 * Confirm PayPal payment with backend
 */
async function confirmPayPalPayment(order, productKey) {
  try {
    const response = await fetch(`${PAYMENT_CONFIG.API_URL}/payments/paypal-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        orderId: order.id,
        productKey
      })
    });
    
    if (!response.ok) throw new Error('Payment confirmation failed');
    
    const data = await response.json();
    
    // Update user
    currentUser.tier = data.tier;
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
    
    logToConsole('✓ PayPal payment successful!', 'success');
    updateUIForUser();
    lockFeaturesByTier();
  } catch (err) {
    logToConsole(`Payment confirmation error: ${err.message}`, 'error');
  }
}

/**
 * Show subscription management portal
 */
async function showSubscriptionPortal() {
  try {
    const response = await fetch(`${PAYMENT_CONFIG.API_URL}/payments/billing-portal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const { url } = await response.json();
    window.location.href = url;
  } catch (err) {
    logToConsole(`Portal error: ${err.message}`, 'error');
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription() {
  if (!confirm('Are you sure? You\'ll lose premium access.')) return;
  
  try {
    const response = await fetch(`${PAYMENT_CONFIG.API_URL}/payments/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) throw new Error('Cancellation failed');
    
    currentUser.tier = AUTH_CONFIG.TIERS.FREE;
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
    
    logToConsole('Subscription cancelled', 'info');
    updateUIForUser();
    lockFeaturesByTier();
  } catch (err) {
    logToConsole(`Cancellation error: ${err.message}`, 'error');
  }
}
