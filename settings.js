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
}

function loadAllSettings() {
  chrome.storage.local.get(['customPrompt', 'yourName', 'quickSettings'], function(result) {
    console.log('Loading settings:', result);
    
    // Your name
    document.getElementById('your-name').value = result.yourName || '';
    
    // Guided fields removed

    // Custom prompt
    const customPrompt = result.customPrompt || getDefaultPrompt();
    document.getElementById('custom-prompt').value = customPrompt;
    
    console.log('Custom prompt loaded:', customPrompt.substring(0, 100) + '...');
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
  const yourName = document.getElementById('your-name').value.trim();
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


