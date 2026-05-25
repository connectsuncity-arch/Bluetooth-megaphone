/**
 * AeroMix Ad System
 * Google AdSense/AdMob integration with reward ads
 */

const ADS_CONFIG = {
  GOOGLE_ADSENSE_ID: 'ca-pub-xxxxxxxxxxxxxxxx', // Replace with actual ID
  ENABLED_FOR_FREE: true,
  BANNER_SLOTS: {
    top: 'div-gpt-ad-top-banner',
    bottom: 'div-gpt-ad-bottom-banner',
    sidebar: 'div-gpt-ad-sidebar'
  },
  REWARD_AMOUNT: 50 // Premium currency
};

let totalAdsWatched = 0;
let totalAdRevenue = 0;
let rewardAdsRemaining = 3; // 3 free reward ads per day

/**
 * Initialize Google Ad Manager
 */
function initializeAds() {
  // Only load for free users
  if (getUserTier() !== AUTH_CONFIG.TIERS.FREE) {
    return;
  }
  
  // Load Google Ad Manager script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
  script.onload = () => {
    setupAdSlots();
  };
  document.head.appendChild(script);
}

/**
 * Setup ad slots
 */
function setupAdSlots() {
  if (!window.googletag) return;
  
  window.googletag = window.googletag || {};
  window.googletag.cmd = window.googletag.cmd || [];
  
  window.googletag.cmd.push(() => {
    // Define slots
    window.googletag.defineSlot('/22018313320/aeromix_top', [728, 90], 'div-gpt-ad-top-banner')
      .addService(window.googletag.pubads());
    
    window.googletag.defineSlot('/22018313320/aeromix_bottom', [728, 90], 'div-gpt-ad-bottom-banner')
      .addService(window.googletag.pubads());
    
    window.googletag.defineSlot('/22018313320/aeromix_sidebar', [300, 250], 'div-gpt-ad-sidebar')
      .addService(window.googletag.pubads());
    
    window.googletag.pubads().enableSingleRequest();
    window.googletag.enableServices();
  });
}

/**
 * Display ads
 */
function showAds() {
  if (getUserTier() !== AUTH_CONFIG.TIERS.FREE || !window.googletag) return;
  
  // Create ad containers if they don't exist
  let topBanner = document.getElementById('ad-banner-top');
  if (!topBanner) {
    topBanner = document.createElement('div');
    topBanner.id = 'ad-banner-top';
    topBanner.className = 'ad-banner-top';
    topBanner.innerHTML = '<div id="div-gpt-ad-top-banner"></div>';
    document.body.insertBefore(topBanner, document.querySelector('main'));
  }
  
  let bottomBanner = document.getElementById('ad-banner-bottom');
  if (!bottomBanner) {
    bottomBanner = document.createElement('div');
    bottomBanner.id = 'ad-banner-bottom';
    bottomBanner.className = 'ad-banner-bottom';
    bottomBanner.innerHTML = '<div id="div-gpt-ad-bottom-banner"></div>';
    document.body.appendChild(bottomBanner);
  }
  
  // Display ads
  if (window.googletag) {
    window.googletag.cmd.push(() => {
      window.googletag.display('div-gpt-ad-top-banner');
      window.googletag.display('div-gpt-ad-bottom-banner');
    });
  }
}

/**
 * Hide ads (premium users)
 */
function hideAds() {
  const adBanners = document.querySelectorAll('.ad-banner-top, .ad-banner-bottom');
  adBanners.forEach(banner => banner.remove());
}

/**
 * Show reward ad
 */
async function showRewardAd(rewardType = 'premium-trial') {
  if (rewardAdsRemaining <= 0) {
    showUpgradeModal('Reward Ads - Daily Limit Reached');
    return;
  }
  
  // In production, use Google Ad Manager or AdMob SDK
  // For now, simulate reward ad completion
  const modal = document.createElement('div');
  modal.className = 'reward-ad-modal glass-panel';
  modal.innerHTML = `
    <div class="reward-ad-content">
      <h2>🎁 Watch & Earn Rewards</h2>
      <p>Watch a 30-second ad to earn premium features!</p>
      <div class="reward-preview">
        <div class="fake-ad-container">
          <div class="ad-placeholder">
            <div class="spinner"></div>
            <p>Ad Loading...</p>
          </div>
        </div>
      </div>
      <div class="reward-info">
        <p><strong>Reward:</strong> ${rewardType === 'premium-trial' ? '7-day Premium Trial' : '500 Credits'}</p>
        <p><strong>Time:</strong> 30 seconds</p>
      </div>
      <button id="close-reward-ad" class="disabled" disabled>Closing in 30s...</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Simulate 30-second ad
  let secondsRemaining = 30;
  const btn = document.getElementById('close-reward-ad');
  
  const countdown = setInterval(() => {
    secondsRemaining--;
    btn.textContent = `Closing in ${secondsRemaining}s...`;
    
    if (secondsRemaining <= 0) {
      clearInterval(countdown);
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.textContent = 'Claim Reward';
      
      btn.onclick = () => {
        claimRewardAdReward(rewardType);
        modal.remove();
      };
    }
  }, 1000);
  
  // Track ad view
  totalAdsWatched++;
  trackAdEvent('reward_ad_shown', { type: rewardType });
}

/**
 * Claim reward from ad
 */
async function claimRewardAdReward(rewardType) {
  try {
    const response = await fetch(`${PAYMENT_CONFIG.API_URL}/ads/claim-reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        rewardType,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) throw new Error('Reward claim failed');
    
    const data = await response.json();
    
    rewardAdsRemaining--;
    
    if (rewardType === 'premium-trial') {
      // Grant 7-day premium trial
      currentUser.premiumTrialEndDate = data.trialEndDate;
      currentUser.tier = AUTH_CONFIG.TIERS.PREMIUM;
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
      updateUIForUser();
      lockFeaturesByTier();
      logToConsole('✓ 7-day Premium Trial activated!', 'success');
    }
    
    trackAdEvent('reward_claimed', { type: rewardType });
  } catch (err) {
    logToConsole(`Reward claim error: ${err.message}`, 'error');
  }
}

/**
 * Track ad events (for analytics)
 */
function trackAdEvent(eventName, eventData = {}) {
  try {
    fetch(`${PAYMENT_CONFIG.API_URL}/analytics/track-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        event: eventName,
        data: eventData,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {}); // Fail silently
  } catch (err) {
    console.error('Event tracking error:', err);
  }
}

/**
 * Show sponsored content
 */
function showSponsoredContent(brand, productName) {
  const modal = document.createElement('div');
  modal.className = 'sponsored-modal glass-panel';
  modal.innerHTML = `
    <div class="sponsored-content">
      <div class="sponsored-badge">SPONSORED</div>
      <h2>${brand}</h2>
      <h3>${productName}</h3>
      <p>Our partners make AeroMix possible. Check them out!</p>
      <a href="#" target="_blank" class="sponsored-btn">Learn More</a>
      <button class="close-modal" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  trackAdEvent('sponsored_content_shown', { brand, productName });
}
