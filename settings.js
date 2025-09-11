// Settings page JavaScript for Upwork Cover Letter Generator
document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      document.getElementById(targetTab).classList.add('active');

      // Persist proposal mode based on active tab
      if (targetTab === 'custom-instructions') {
        chrome.storage.local.set({ proposalMode: 'custom' });
      } else if (targetTab === 'ai-proposal') {
        chrome.storage.local.set({ proposalMode: 'ai' });
      }
    });
  });
  
  // Load settings from storage
  loadAllSettings();
  
  // Event listeners
  setupEventListeners();
  
});

function setupEventListeners() {
  // Custom prompt
  document.getElementById('save-custom-prompt').addEventListener('click', saveCustomPrompt);
  document.getElementById('reset-custom-prompt').addEventListener('click', resetCustomPrompt);

  // No proposal mode toggles (guided removed)

  // AI Proposal tab action
  const genAiBtn = document.getElementById('generate-ai-proposal');
  if (genAiBtn) genAiBtn.addEventListener('click', generateAIProposalFromSettings);
  // Profile save
  const saveProfileBtn = document.getElementById('save-profile');
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
}

function loadAllSettings() {
  chrome.storage.local.get(['customPrompt', 'yourName', 'quickSettings', 'proposalMode'], function(result) {
    console.log('Loading settings:', result);
    
    // Your name
    const nameInput = document.getElementById('your-name');
    if (nameInput) nameInput.value = result.yourName || '';
    
    // Guided fields removed

    // Custom prompt
    const customPrompt = result.customPrompt || getDefaultPrompt();
    document.getElementById('custom-prompt').value = customPrompt;
    
    console.log('Custom prompt loaded:', customPrompt.substring(0, 100) + '...');

    // Activate tab by saved mode (custom uses proposal prompt; ai uses AI Proposal tab)
    const mode = result.proposalMode || 'ai';
    const toActivate = mode === 'custom' ? 'custom-instructions' : 'ai-proposal';
    const tabBtn = Array.from(document.querySelectorAll('.tab')).find(t => t.getAttribute('data-tab') === toActivate);
    if (tabBtn) tabBtn.click();
  });
}


function getDefaultPrompt() {
  return `I have extensive experience in web development and I'm excited about this project.

Based on the job description, I can see you need someone with expertise in the required technologies. I have extensive experience with these technologies and I'm confident I can deliver excellent results.

I'd love to learn more about your specific requirements and timeline. What's the most important aspect of this project for you?

Best regards,
[Your Name]`;
}



function saveCustomPrompt() {
  const customPrompt = document.getElementById('custom-prompt').value.trim();
  const nameInput = document.getElementById('your-name');
  const yourName = nameInput ? nameInput.value.trim() : '';
  // No proposal mode

  // Allow empty custom prompt in custom mode (will generate from job only)
  
  // Save both the custom prompt and name
  chrome.storage.local.set({
    customPrompt: customPrompt,
    yourName: yourName
  }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
      showStatusMessage('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
    } else {
      console.log('Settings saved successfully:', { customPrompt, yourName });
      showStatusMessage('Settings saved successfully!', 'success');
    }
  });
}

function saveProfile() {
  const nameInput = document.getElementById('your-name');
  const yourName = nameInput ? nameInput.value.trim() : '';
  chrome.storage.local.set({ yourName }, function() {
    if (chrome.runtime.lastError) {
      showStatusMessage('Error saving profile: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatusMessage('Profile saved!', 'success');
    }
  });
}

function resetCustomPrompt() {
  if (confirm('Are you sure you want to reset to the default prompt?')) {
    const defaultPrompt = getDefaultPrompt();
    document.getElementById('custom-prompt').value = defaultPrompt;
    chrome.storage.local.set({ customPrompt: defaultPrompt }, function() {
      showStatusMessage('Prompt reset to default!', 'success');
    });
  }
}

// Guided functions removed


function showStatusMessage(message, type) {
  const statusDiv = document.getElementById('status-message');
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type} fade-in`;
  statusDiv.classList.remove('hidden');
  
  // Add a subtle animation
  setTimeout(() => {
    statusDiv.style.transform = 'translateY(0)';
  }, 100);
  
  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 5000);
}

function generateAIProposalFromSettings() {
  const resultDiv = document.getElementById('ai-proposal-result');
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.textContent = 'Generating proposal from current Upwork tab...';
  }

  // Persist mode as AI when user is on this tab
  chrome.storage.local.set({ proposalMode: 'ai' });

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs && tabs[0];
    if (!tab || !tab.url || !tab.url.includes('upwork.com')) {
      showStatusMessage('Open an Upwork job page to generate.', 'error');
      if (resultDiv) resultDiv.textContent = 'Please open an Upwork job posting page and try again.';
      return;
    }

    // Ask the content script to extract job info
    chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' }, function(resp) {
      if (!resp || !resp.success) {
        showStatusMessage('Could not read job data from the page.', 'error');
        if (resultDiv) resultDiv.textContent = 'Could not read job data from the page.';
        return;
      }

      chrome.runtime.sendMessage({ action: 'generateCoverLetter', jobTitle: resp.jobTitle, jobDescription: resp.jobDescription }, function(bgResp) {
        if (bgResp && bgResp.success) {
          if (resultDiv) resultDiv.textContent = bgResp.coverLetter;
          showStatusMessage('AI proposal generated!', 'success');
          // Also attempt to fill the cover letter on page
          chrome.tabs.sendMessage(tab.id, { action: 'fillCoverLetter', coverLetter: bgResp.coverLetter });
        } else {
          const err = (bgResp && bgResp.error) || 'Unknown error';
          if (resultDiv) resultDiv.textContent = 'Failed: ' + err;
          showStatusMessage('Generation failed: ' + err, 'error');
        }
      });
    });
  });
}


