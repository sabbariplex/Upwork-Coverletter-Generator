// Subscription management page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Load current usage and subscription info
  loadSubscriptionInfo();
  
  // Setup event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Upgrade button
  document.getElementById('upgrade-btn').addEventListener('click', function() {
    handleUpgrade();
  });
}

function loadSubscriptionInfo() {
  // Get usage information from background script
  chrome.runtime.sendMessage({action: 'getUsage'}, function(response) {
    if (response && response.success) {
      const usage = response.usage;
      updateUI(usage);
    }
  });
}

function updateUI(usage) {
  // Update current plan info
  const currentPlanDiv = document.getElementById('current-plan-info');
  const currentPlanName = document.getElementById('current-plan-name');
  const currentUsage = document.getElementById('current-usage');
  const currentLimit = document.getElementById('current-limit');
  
  let planName = 'Free';
  let limit = 50;
  
  if (usage.subscriptionStatus === 'premium') {
    planName = 'Premium';
    limit = '∞';
    currentPlanDiv.classList.remove('hidden');
  } else if (usage.subscriptionStatus === 'expired') {
    planName = 'Expired';
    currentPlanDiv.classList.remove('hidden');
  }
  
  currentPlanName.textContent = planName;
  currentUsage.textContent = usage.proposalsUsed || 0;
  currentLimit.textContent = limit;
  
  // Update usage statistics
  document.getElementById('total-proposals').textContent = usage.proposalsUsed || 0;
  document.getElementById('remaining-proposals').textContent = 
    usage.subscriptionStatus === 'premium' ? '∞' : Math.max(0, 50 - (usage.proposalsUsed || 0));
  document.getElementById('plan-status').textContent = planName;
  
  // Update progress bar
  const progressBar = document.getElementById('usage-progress');
  if (usage.subscriptionStatus === 'premium') {
    progressBar.style.width = '0%';
    progressBar.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
  } else {
    const percentage = Math.min(100, ((usage.proposalsUsed || 0) / 50) * 100);
    progressBar.style.width = percentage + '%';
    
    if (percentage >= 90) {
      progressBar.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
    } else if (percentage >= 70) {
      progressBar.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
    } else {
      progressBar.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  }
  
  // Update upgrade button based on current status
  const upgradeBtn = document.getElementById('upgrade-btn');
  if (usage.subscriptionStatus === 'premium') {
    upgradeBtn.textContent = 'Current Plan';
    upgradeBtn.classList.remove('btn-primary');
    upgradeBtn.classList.add('btn-secondary');
    upgradeBtn.disabled = true;
  } else if (usage.subscriptionStatus === 'expired') {
    upgradeBtn.textContent = 'Renew Subscription';
  } else {
    upgradeBtn.textContent = 'Upgrade Now';
  }
}

function handleUpgrade() {
  // In a real implementation, this would redirect to your payment processor
  // For now, we'll simulate the upgrade process
  
  const upgradeBtn = document.getElementById('upgrade-btn');
  const originalText = upgradeBtn.textContent;
  
  upgradeBtn.textContent = 'Processing...';
  upgradeBtn.disabled = true;
  
  // Simulate API call to upgrade
  setTimeout(() => {
    // In a real implementation, you would:
    // 1. Redirect to Stripe/PayPal payment page
    // 2. Handle the payment callback
    // 3. Update the user's subscription status
    // 4. Sync with your backend
    
    // For demo purposes, we'll show a message
    alert('This would redirect to your payment processor (Stripe, PayPal, etc.)\n\nIn a real implementation, you would:\n1. Set up payment processing\n2. Create user accounts\n3. Handle subscription webhooks\n4. Update user status in your database');
    
    upgradeBtn.textContent = originalText;
    upgradeBtn.disabled = false;
  }, 2000);
}

// Function to simulate subscription upgrade (for testing)
function simulateUpgrade() {
  const usage = {
    proposalsUsed: 0,
    subscriptionStatus: 'premium',
    subscriptionExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId: 'demo-user-' + Date.now()
  };
  
  // Save to storage
  chrome.storage.local.set({ userUsage: usage }, function() {
    updateUI(usage);
    alert('Demo: Subscription upgraded to Premium!');
  });
}

// Function to reset to free tier (for testing)
function resetToFree() {
  const usage = {
    proposalsUsed: 0,
    subscriptionStatus: 'free',
    subscriptionExpiry: null,
    userId: null
  };
  
  chrome.storage.local.set({ userUsage: usage }, function() {
    updateUI(usage);
    alert('Demo: Reset to Free tier');
  });
}

// Add demo buttons for testing (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  const demoDiv = document.createElement('div');
  demoDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
  `;
  demoDiv.innerHTML = `
    <div>Demo Controls:</div>
    <button onclick="simulateUpgrade()" style="margin: 2px; padding: 5px;">Upgrade</button>
    <button onclick="resetToFree()" style="margin: 2px; padding: 5px;">Reset</button>
  `;
  document.body.appendChild(demoDiv);
}
