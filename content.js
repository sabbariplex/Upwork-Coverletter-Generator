// Content script for Upwork Cover Letter Generator
// Prevent duplicate execution
if (window.upworkCoverLetterGeneratorLoaded) {
  console.log('Upwork Cover Letter Generator already loaded, skipping...');
} else {
  window.upworkCoverLetterGeneratorLoaded = true;

console.log('Upwork Cover Letter Generator loaded');

  // Add error handling wrapper
  try {
// Function to extract job description from Upwork page
function extractJobDescription() {
  try {
    console.log('Attempting to extract job description...');
    
  // Try multiple selectors to find job description
  const selectors = [
      // Upwork specific selectors
    '[data-test="job-description"]',
      '[data-cy="job-description"]',
    '.job-description',
      '.job-description-text',
      // More specific selectors for job content
      '[data-test="job-details"] .up-card-section',
      '.up-card-section[data-test="job-details"]',
      '.job-details .up-card-section',
      // Look for description in job details
      '.job-details .description',
      '.job-content .description',
      '.job-post-content',
      '.job-description-content',
      // Look for content that's likely the job description
      '[class*="job-description"]',
      '[class*="job-details"]',
      '[class*="job-content"]'
    ];
    
    console.log('Trying selectors...');
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        console.log(`Found text with selector "${selector}":`, text.substring(0, 100) + '...');
        
        // Check if this looks like a job description (has reasonable length and content)
        if (text.length > 100 && text.length < 5000 && 
            !text.includes('Apply Now') && !text.includes('Submit Proposal') &&
            !text.includes('Posted') && !text.includes('Hourly range') &&
            !text.includes('Skills and expertise') && !text.includes('View job posting')) {
          return text;
        }
      }
    }
    
    // Fallback: look for any element containing substantial text that might be job description
    console.log('Trying fallback methods...');
    
    // Look for the largest text block on the page that's likely job content
    const allElements = document.querySelectorAll('div, section, article, p');
    let bestCandidate = null;
    let maxLength = 0;
    
    for (const element of allElements) {
      const text = element.textContent.trim();
      if (text.length > maxLength && text.length > 100 && text.length < 5000) {
        // Skip navigation, buttons, and other non-content elements
        if (!text.includes('Apply Now') && 
            !text.includes('Submit Proposal') && 
            !text.includes('Navigation') &&
            !text.includes('Menu') &&
            !text.includes('Sign In') &&
            !text.includes('Sign Up') &&
            !text.includes('Profile') &&
            !text.includes('Messages') &&
            !text.includes('Notifications') &&
            !text.includes('Posted') &&
            !text.includes('Hourly range') &&
            !text.includes('Skills and expertise') &&
            !text.includes('View job posting') &&
            !text.includes('Featured Job') &&
            !text.includes('Close the tooltip') &&
            !text.includes('Less than') &&
            !text.includes('Project length') &&
            !text.includes('Duration')) {
          bestCandidate = text;
          maxLength = text.length;
        }
      }
    }
    
    if (bestCandidate) {
      console.log('Found best candidate text:', bestCandidate.substring(0, 100) + '...');
      return bestCandidate;
    }
    
    // Last resort: get all text content and try to extract meaningful parts
    const bodyText = document.body.textContent;
    console.log('Body text length:', bodyText.length);
    console.log('Body text sample:', bodyText.substring(0, 200) + '...');
    
    return null;
  } catch (error) {
    console.error('Error extracting job description:', error);
  return null;
  }
}

// Function to extract freelancer name from profile or settings
async function extractFreelancerName() {
  try {
    console.log('Attempting to extract freelancer name...');
    
    // First try to get from user settings
    try {
      const result = await chrome.storage.local.get(['freelancerName']);
      if (result.freelancerName && result.freelancerName.trim()) {
        console.log('Found freelancer name from settings:', result.freelancerName);
        return result.freelancerName.trim();
      }
    } catch (error) {
      console.log('Could not get freelancer name from settings:', error);
    }
    
    const freelancerNameSelectors = [
      // Specific Upwork selectors based on the HTML you provided
      '.nav-user-label',
      '.nav-user-info .nav-user-label',
      '.nav-user-info-wrapper .nav-user-label',
      // Organization dropdown selectors
      '.nav-organization-dropdown .flex-1 div:first-child',
      '.nav-dropdown-list .flex-1 div:first-child',
      // General Upwork selectors
      '[data-test="user-menu"] [data-test="user-name"]',
      '[data-test="user-menu"] .user-name',
      '.user-menu .user-name',
      '.up-menu .user-name',
      // Profile section selectors
      '[data-test="freelancer-name"]',
      '.freelancer-name',
      '.user-info .name',
      '.profile .name',
      // Look for name in profile areas
      '.profile-section .name',
      '.user-profile .name',
      '.freelancer-profile .name',
      // Look for name in header/profile areas
      'header [class*="name"]',
      '.header [class*="name"]',
      '.top-bar [class*="name"]',
      // Look for name in user menu or dropdown
      '.dropdown [class*="name"]',
      '.menu [class*="name"]',
      '[role="menu"] [class*="name"]',
      // Look for name in navigation
      'nav [class*="name"]',
      '.navigation [class*="name"]',
      // Look for name in account/profile sections
      '.account [class*="name"]',
      '.profile-info [class*="name"]',
      // Additional Upwork selectors
      '[class*="freelancer-name"]',
      '[class*="user-name"]',
      '[class*="profile-name"]',
      // Look for name in user avatar or profile button
      '[data-test="user-avatar"] + *',
      '.user-avatar + *',
      '[class*="avatar"] + *',
      // Look for name in user menu items
      '[data-test="user-menu"] *[class*="name"]',
      '.user-menu *[class*="name"]',
      // Look for name in profile dropdown
      '[aria-label*="profile"] *[class*="name"]',
      '[aria-label*="user"] *[class*="name"]'
    ];
    
    for (const selector of freelancerNameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const name = element.textContent.trim();
        console.log(`Found freelancer name with selector "${selector}":`, name);
        // Clean up the name (remove extra whitespace, titles, etc.)
        const cleanName = name.replace(/\s+/g, ' ').trim();
        return cleanName;
      }
    }
    
    // Fallback: look for any text that might be a freelancer name
    console.log('Trying fallback methods for freelancer name...');
    
    // Look for text patterns that might be names in profile areas
    const profileElements = document.querySelectorAll('[class*="profile"], [class*="user"], [class*="account"], [class*="menu"]');
    for (const element of profileElements) {
      const text = element.textContent.trim();
      // Look for text that might be a name (2-3 words, starts with capital)
      if (text && text.length > 2 && text.length < 50 && 
          /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text) &&
          !text.includes('Apply') && 
          !text.includes('Job') && 
          !text.includes('Proposal') &&
          !text.includes('Upwork') &&
          !text.includes('Client') &&
          !text.includes('Freelancer') &&
          !text.includes('Profile') &&
          !text.includes('Account')) {
        console.log(`Found potential freelancer name:`, text);
        return text;
      }
    }
    
    console.log('No freelancer name found, using default');
    console.log('Available text elements that might contain name:');
    
    // Debug: show some text elements that might contain the name
    const debugElements = document.querySelectorAll('[class*="user"], [class*="profile"], [class*="menu"], [class*="avatar"]');
    for (let i = 0; i < Math.min(5, debugElements.length); i++) {
      const text = debugElements[i].textContent.trim();
      if (text && text.length > 0 && text.length < 100) {
        console.log(`Debug element ${i}:`, text);
      }
    }
    
    return 'Your Name';
  } catch (error) {
    console.error('Error extracting freelancer name:', error);
    return 'Your Name';
  }
}

// Function to extract job title
function extractJobTitle() {
  try {
    console.log('Attempting to extract job title...');
    
  const titleSelectors = [
    // Upwork specific selectors
    'h1[data-test="job-title"]',
    '[data-cy="job-title"]',
    '[data-test="job-details"] h1',
    '.up-card-section h1',
    // More specific selectors to avoid buttons
    'h1:not([class*="button"]):not([class*="btn"])',
    'h2:not([class*="button"]):not([class*="btn"])',
    // Look for title in job details section
    '.job-details h1',
    '.job-details h2',
    '.job-content h1',
    '.job-content h2'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
        const title = element.textContent.trim();
        console.log(`Found title with selector "${selector}":`, title);
        
        // Skip if it's a button text or common UI elements
        if (title.includes('Submit') || title.includes('Apply') || title.includes('Proposal') || 
            title.includes('Button') || title.length < 10) {
          console.log('Skipping button text:', title);
          continue;
        }
        
        return title;
    }
  }
  
  // Fallback: look for the largest h1 or h2 that's not a button
  const headings = document.querySelectorAll('h1, h2');
  let bestTitle = null;
  let maxLength = 0;
  
  for (const heading of headings) {
    const text = heading.textContent.trim();
    if (text.length > maxLength && text.length > 10 && 
        !text.includes('Submit') && !text.includes('Apply') && 
        !text.includes('Proposal') && !text.includes('Button')) {
      bestTitle = text;
      maxLength = text.length;
    }
  }
  
  if (bestTitle) {
    console.log('Found best title:', bestTitle);
    return bestTitle;
  }
  
    console.log('No specific title found, using default');
    return 'Job Application';
  } catch (error) {
    console.error('Error extracting job title:', error);
  return 'Job Application';
  }
}

// This function is no longer used - we now use AI-generated proposals
// Keeping it as fallback for error cases
function generateCoverLetter(jobTitle, jobDescription) {
  return `I have over 8 years of experience and I'm really excited about this ${jobTitle} project. I've worked on similar stuff before and I think I can help you out here.

I usually focus on getting things done right the first time and keeping you updated along the way. I'm pretty flexible with timelines and can start whenever you need me.

What's the most important part of this project for you? And do you prefer to chat through Upwork messages or would you rather hop on a quick call to discuss details?

Looking forward to working with you!

Thanks,
Your Name`;
}

// Function to extract skills from job description
function extractSkills(description) {
  const commonSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'PHP', 'WordPress', 'HTML', 'CSS',
    'MySQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'API', 'REST', 'GraphQL',
    'Machine Learning', 'Data Analysis', 'Web Design', 'UI/UX', 'Mobile Development'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    description.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.slice(0, 3); // Return top 3 skills
}

// Function to extract experience requirements
function extractExperience(description) {
  const experienceMatch = description.match(/(\d+)\+?\s*years?\s*of\s*experience/i);
  if (experienceMatch) {
    return experienceMatch[1];
  }
  return '5'; // Default experience
}

// Function to get key approach based on job description
function getKeyApproach(description) {
  if (description.toLowerCase().includes('frontend') || description.toLowerCase().includes('ui')) {
    return 'user-centered design and responsive development';
  } else if (description.toLowerCase().includes('backend') || description.toLowerCase().includes('api')) {
    return 'scalable architecture and efficient database design';
  } else if (description.toLowerCase().includes('full-stack') || description.toLowerCase().includes('full stack')) {
    return 'end-to-end development and seamless integration';
  } else if (description.toLowerCase().includes('mobile')) {
    return 'cross-platform compatibility and native performance';
  } else {
    return 'problem-solving and efficient implementation';
  }
}

// Function to modify apply button
function modifyApplyButton() {
  // Find apply button
  const applyButton = document.querySelector('[data-test="apply-button"]') ||
                     document.querySelector('.apply-button') ||
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('a[href*="apply"]');
  
  if (applyButton) {
    // Store original click handler
    const originalClick = applyButton.onclick;
    
    // Add our custom click handler
    applyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Extract job information
      const jobTitle = extractJobTitle();
      const jobDescription = extractJobDescription();
      const freelancerName = await extractFreelancerName();
      
      if (jobDescription) {
        // Show loading notification
        showNotification('Generating AI-powered proposal...', 'info');
        
        try {
          // Send message to background script to generate cover letter with ChatGPT
          const response = await chrome.runtime.sendMessage({
            action: 'generateCoverLetter',
            jobTitle: jobTitle,
            jobDescription: jobDescription
          });
          
          if (response.success) {
            const coverLetter = response.coverLetter;
        
        // Store cover letter in storage
        await chrome.storage.local.set({
          coverLetter: coverLetter,
          jobTitle: jobTitle,
          jobDescription: jobDescription
        });
        
            // Show success notification
            showNotification('AI proposal generated! Check the application form.', 'success');
        
        // Try to find and fill cover letter field
        setTimeout(() => {
          fillCoverLetterField(coverLetter);
        }, 1000);
      } else {
            throw new Error(response.error || 'Failed to generate proposal');
          }
        } catch (error) {
          console.error('Error generating proposal:', error);
          showNotification('Error generating proposal: ' + error.message, 'error');
        }
      } else {
        showNotification('Could not extract job description. Please try again.', 'error');
      }
      
      // Call original click handler after a delay
      setTimeout(() => {
        if (originalClick) {
          originalClick.call(applyButton, e);
        } else {
          applyButton.click();
        }
      }, 500);
    });
    
    console.log('Apply button modified successfully');
  } else {
    console.log('Apply button not found, retrying...');
    // Retry after a delay
    setTimeout(modifyApplyButton, 2000);
  }
}

// Function to fill cover letter field
function fillCoverLetterField(coverLetter) {
  const coverLetterSelectors = [
                    'textarea[aria-labelledby="cover_letter_label"]',
                    'textarea.inner-textarea',
                    'textarea.air3-textarea',
    'textarea[name="coverLetter"]',
    'textarea[placeholder*="cover"]',
    'textarea[placeholder*="letter"]',
    'textarea[data-test="cover-letter"]',
    'textarea[data-cy="cover-letter"]',
    'textarea[aria-label*="cover"]',
    'textarea[aria-label*="letter"]'
  ];
  
  for (const selector of coverLetterSelectors) {
    const field = document.querySelector(selector);
    if (field) {
      field.value = coverLetter;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Cover letter filled successfully');
      return;
    }
  }
  
  // If no specific field found, try to find any textarea
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    if (textarea.offsetHeight > 100) { // Likely a cover letter field
      textarea.value = coverLetter;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Cover letter filled in general textarea');
      return;
    }
  }
}

// Function to show notification
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  
  // Set background color based on type
  let backgroundColor = '#4CAF50'; // success - green
  if (type === 'error') backgroundColor = '#f44336'; // error - red
  if (type === 'info') backgroundColor = '#2196F3'; // info - blue
  if (type === 'warning') backgroundColor = '#ff9800'; // warning - orange
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${backgroundColor};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove notification after 5 seconds for info/error, 3 seconds for success
  const timeout = (type === 'info' || type === 'error') ? 5000 : 3000;
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, timeout);
}

// Cleanup function
function cleanup() {
  if (window.upworkCoverLetterObserver) {
    window.upworkCoverLetterObserver.disconnect();
    delete window.upworkCoverLetterObserver;
  }
  delete window.upworkCoverLetterGeneratorLoaded;
}

// Function to automatically generate and fill proposal based on job description
async function generateAutoProposal() {
  console.log('Generating automatic proposal...');
  console.log('Current URL:', window.location.href);
  
  // Extract job information and freelancer name
  const jobTitle = extractJobTitle();
  const jobDescription = extractJobDescription();
  const freelancerName = await extractFreelancerName();
  
  console.log('Extracted job title:', jobTitle);
  console.log('Extracted job description length:', jobDescription ? jobDescription.length : 'null');
  console.log('Extracted job description preview:', jobDescription ? jobDescription.substring(0, 200) + '...' : 'null');
  console.log('Extracted freelancer name:', freelancerName);
  console.log('Freelancer name type:', typeof freelancerName);
  console.log('Freelancer name length:', freelancerName ? freelancerName.length : 'null');
  
  if (jobDescription) {
    // Show loading notification
    showNotification('Generating AI proposal...', 'info');
    
    try {
      // Send message to background script to generate cover letter with ChatGPT
      const response = await chrome.runtime.sendMessage({
        action: 'generateCoverLetter',
        jobTitle: jobTitle,
        jobDescription: jobDescription
      });
      
      // Check if we got a response
      if (!response) {
        throw new Error('No response from background script. Make sure the extension is properly loaded.');
      }
      
      // Check if the response indicates a usage limit was reached
      if (response.limitReached) {
        showNotification('Free limit reached! Upgrade to Premium for unlimited proposals.', 'warning');
        // Still generate a fallback proposal
        throw new Error('Usage limit reached');
      }
      
      if (response.success) {
        const coverLetter = response.coverLetter;
        
        // Try to fill the cover letter field immediately
        fillCoverLetterField(coverLetter);
        
        // Also try after a delay in case the field loads later
        setTimeout(() => {
          fillCoverLetterField(coverLetter);
        }, 2000);
        
        // Show success notification
        showNotification('AI proposal generated and filled!', 'success');
        console.log('Proposal generated successfully:', coverLetter);
      } else {
        throw new Error(response.error || 'Failed to generate proposal');
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      
      // Check if it's a usage limit error
      if (error.message && error.message.includes('limit')) {
        showNotification('Free limit reached! Upgrade to Premium for unlimited proposals.', 'warning');
      } else {
        showNotification('AI service unavailable. Using basic proposal.', 'warning');
      }
      
      // Fallback to basic proposal
      const fallbackProposal = `I have over 8 years of experience and I'm really excited about this ${jobTitle} project. I've worked on similar stuff before and I think I can help you out here.

I usually focus on getting things done right the first time and keeping you updated along the way. I'm pretty flexible with timelines and can start whenever you need me.

What's the most important part of this project for you? And do you prefer to chat through Upwork messages or would you rather hop on a quick call to discuss details?

Looking forward to working with you!

Thanks,
${freelancerName}`;
      
      fillCoverLetterField(fallbackProposal);
      showNotification('Basic proposal generated (AI unavailable)', 'warning');
    }
  } else {
    console.log('No job description found, generating generic proposal');
    
    // Generate a generic proposal even without job description
    const genericProposal = `I have over 8 years of experience and I'm really excited about this ${jobTitle} project. I've worked on similar stuff before and I think I can help you out here.

I usually focus on getting things done right the first time and keeping you updated along the way. I'm pretty flexible with timelines and can start whenever you need me.

What's the most important part of this project for you? And do you prefer to chat through Upwork messages or would you rather hop on a quick call to discuss details?

Looking forward to working with you!

Thanks,
${freelancerName}`;
    
    fillCoverLetterField(genericProposal);
    showNotification('Generic proposal generated (no job description found)', 'warning');
  }
}

// Test function to check if background script is responding
async function testBackgroundConnection() {
  try {
    console.log('Testing background script connection...');
    const response = await chrome.runtime.sendMessage({action: 'getUsage'});
    if (response && response.success) {
      console.log('✅ Background script is responding correctly');
      return true;
    } else {
      console.warn('⚠️ Background script responded but with error:', response);
      return false;
    }
  } catch (error) {
    console.error('❌ Background script is not responding:', error);
    return false;
  }
}

// Initialize when page loads
function initialize() {
  // Clean up any existing observers
  cleanup();
  
  // Set the loaded flag
  window.upworkCoverLetterGeneratorLoaded = true;
  
  // Test background connection
  testBackgroundConnection();
  
  // Check if this is an Upwork application page
  const currentUrl = window.location.href;
  
  console.log('Extension loaded on URL:', currentUrl);
  
  // If this is an Upwork application page, generate proposal automatically
  if (currentUrl.includes('/apply/') || currentUrl.includes('/proposals/')) {
    console.log('Upwork application page detected! Generating proposal...');
    generateAutoProposal();
  }
  
  // Initialize the functionality
  modifyApplyButton();

// Also try to modify apply button when page content changes
  // Use a unique variable name to prevent conflicts
  const upworkCoverLetterObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      // Check if apply button was added
      const applyButton = document.querySelector('[data-test="apply-button"]') ||
                         document.querySelector('.apply-button') ||
                         document.querySelector('button[type="submit"]') ||
                         document.querySelector('a[href*="apply"]');
      
      if (applyButton && !applyButton.hasAttribute('data-modified')) {
        applyButton.setAttribute('data-modified', 'true');
        modifyApplyButton();
      }
        
        // Also check for cover letter field on application pages
        if (currentUrl.includes('/apply/') || currentUrl.includes('/proposals/')) {
          const coverLetterField = document.querySelector('textarea[aria-labelledby="cover_letter_label"]') ||
                                  document.querySelector('textarea.inner-textarea') ||
                                  document.querySelector('textarea.air3-textarea');
          
          if (coverLetterField && !coverLetterField.hasAttribute('data-proposal-filled')) {
            coverLetterField.setAttribute('data-proposal-filled', 'true');
            generateAutoProposal();
          }
        }
    }
  });
});

  // Store observer reference for cleanup
  window.upworkCoverLetterObserver = upworkCoverLetterObserver;

  upworkCoverLetterObserver.observe(document.body, {
  childList: true,
  subtree: true
});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

} catch (error) {
  console.error('Error in Upwork Cover Letter Generator:', error);
  // Show user-friendly error message
  const errorNotification = document.createElement('div');
  errorNotification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    max-width: 300px;
  `;
  errorNotification.textContent = 'Extension error occurred. Please refresh the page.';
  document.body.appendChild(errorNotification);
  
  setTimeout(() => {
    if (errorNotification.parentNode) {
      errorNotification.parentNode.removeChild(errorNotification);
    }
  }, 5000);
  }
}
