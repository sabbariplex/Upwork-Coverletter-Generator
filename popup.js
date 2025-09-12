// Popup script for Upwork Cover Letter Generator
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const autoFillToggle = document.getElementById('auto-fill-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const generateBtn = document.getElementById('generate-btn');
  const currentJobDiv = document.getElementById('current-job');
  const jobTitleSpan = document.getElementById('job-title');
  
  
  // Load settings from storage
  loadSettings();
  
  // Load current job info
  loadCurrentJob();
  
  // Load usage information
  loadUsageInfo();
  
  
  // Toggle event listeners
  autoFillToggle.addEventListener('click', function() {
    this.classList.toggle('active');
    saveSettings();
  });
  
  notificationsToggle.addEventListener('click', function() {
    this.classList.toggle('active');
    saveSettings();
  });
  
  // Button event listeners
  generateBtn.addEventListener('click', function() {
    generateCoverLetter();
  });
  
  // Advanced settings button
  const advancedSettingsBtn = document.getElementById('advanced-settings-btn');
  advancedSettingsBtn.addEventListener('click', function() {
    openAdvancedSettings();
  });
  
  // Subscription management button
  const manageSubscriptionBtn = document.getElementById('manage-subscription-btn');
  manageSubscriptionBtn.addEventListener('click', function() {
    openSubscriptionPage();
  });
  
  
  // Function to load settings from storage
  function loadSettings() {
    chrome.storage.local.get(['autoFill', 'notifications', 'openaiApiKey', 'openaiModel', 'openaiTemperature'], function(result) {
      if (result.autoFill !== false) {
        autoFillToggle.classList.add('active');
      }
      if (result.notifications !== false) {
        notificationsToggle.classList.add('active');
      }

      // OpenAI fields
      const keyEl = document.getElementById('openai-api-key-popup');
      const modelEl = document.getElementById('openai-model-popup');
      const tempEl = document.getElementById('openai-temp-popup');
      if (keyEl) keyEl.value = result.openaiApiKey || '';
      if (modelEl) modelEl.value = result.openaiModel || 'gpt-3.5-turbo';
      if (tempEl) tempEl.value = (typeof result.openaiTemperature === 'number' ? result.openaiTemperature : 0.7);
    });
  }
  
  // Function to save settings to storage
  function saveSettings() {
    const settings = {
      autoFill: autoFillToggle.classList.contains('active'),
      notifications: notificationsToggle.classList.contains('active')
    };
    
    chrome.storage.local.set(settings, function() {
      console.log('Settings saved');
    });
  }

  // Save OpenAI config from popup
  const saveOpenAiPopupBtn = document.getElementById('save-openai-popup');
  if (saveOpenAiPopupBtn) {
    saveOpenAiPopupBtn.addEventListener('click', function() {
      const apiKey = (document.getElementById('openai-api-key-popup').value || '').trim();
      const model = (document.getElementById('openai-model-popup').value || 'gpt-3.5-turbo').trim();
      const tempRaw = document.getElementById('openai-temp-popup').value;
      const temperature = tempRaw === '' ? 0.7 : Math.max(0, Math.min(1, parseFloat(tempRaw)));
      chrome.storage.local.set({ openaiApiKey: apiKey, openaiModel: model, openaiTemperature: temperature }, function() {
        showNotification('OpenAI settings saved');
      });
    });
  }
  
  // Function to load current job info
  function loadCurrentJob() {
    chrome.storage.local.get(['jobTitle', 'jobDescription'], function(result) {
      if (result.jobTitle && result.jobDescription) {
        currentJobDiv.classList.remove('hidden');
        jobTitleSpan.textContent = result.jobTitle;
      }
    });
  }
  
  // Function to generate cover letter
  function generateCoverLetter() {
    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;
    
    // Get current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('upwork.com')) {
        // Send message to content script to generate cover letter
        chrome.tabs.sendMessage(tabs[0].id, {action: 'generateCoverLetter'}, function(response) {
          if (response && response.success) {
            showNotification('Cover letter generated successfully!');
            loadCurrentJob(); // Refresh job info
            loadUsageInfo(); // Refresh usage info
          } else if (response && response.limitReached) {
            showNotification('Free limit reached! Upgrade to Premium for unlimited proposals.');
            generateBtn.textContent = 'Upgrade to Generate';
            generateBtn.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
          } else {
            showNotification('Failed to generate cover letter. Please try again.');
          }
          
          if (!response || !response.limitReached) {
            generateBtn.textContent = 'Generate Cover Letter';
            generateBtn.disabled = false;
          }
        });
      } else {
        showNotification('Please navigate to an Upwork job posting first.');
        generateBtn.textContent = 'Generate Cover Letter';
        generateBtn.disabled = false;
      }
    });
  }
  
  // Function to load usage information
  function loadUsageInfo() {
    chrome.runtime.sendMessage({action: 'getUsage'}, function(response) {
      if (response && response.success) {
        const usage = response.usage;
        document.getElementById('proposals-used').textContent = usage.proposalsUsed || 0;
        document.getElementById('proposal-limit').textContent = usage.subscriptionStatus === 'premium' ? '∞' : '50';
        
        let statusText = 'Free';
        if (usage.subscriptionStatus === 'premium') {
          statusText = 'Premium';
        } else if (usage.subscriptionStatus === 'expired') {
          statusText = 'Expired';
        }
        document.getElementById('subscription-status').textContent = statusText;
        
        // Update generate button if limit reached
        if (usage.subscriptionStatus === 'free' && usage.proposalsUsed >= 50) {
          generateBtn.textContent = 'Upgrade to Generate';
          generateBtn.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
        }
      }
    });
  }
  
  // Function to open advanced settings
  function openAdvancedSettings() {
    // Open the settings page in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }
  
  // Function to open subscription page
  function openSubscriptionPage() {
    // Open the subscription management page
    chrome.tabs.create({ url: chrome.runtime.getURL('subscription.html') });
  }
  
  
  // Function to show notification
  function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      font-size: 12px;
      text-align: center;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  

  // Listen for storage changes to update UI
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
      if (changes.jobTitle || changes.jobDescription) {
        loadCurrentJob();
      }
    }
  });
});
