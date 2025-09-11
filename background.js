// Background script for Upwork Cover Letter Generator
console.log('Background script loaded');

// Configuration for freemium model
const DEFAULT_CONFIG = {
  // Your backend API endpoint - update this with your deployed backend URL
  API_BASE_URL: 'http://localhost:3000/api', // Change to your production URL
  // Free tier limits
  FREE_PROPOSAL_LIMIT: 50,
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7
};

// Usage tracking
let userUsage = {
  proposalsUsed: 0,
  subscriptionStatus: 'free', // 'free', 'premium', 'expired'
  subscriptionExpiry: null,
  userId: null
};

// Initialize user usage on startup
chrome.runtime.onStartup.addListener(async () => {
  await loadUserUsage();
  console.log('User usage loaded on startup:', userUsage);
});

// Also load on extension startup
chrome.runtime.onInstalled.addListener(async (details) => {
  await loadUserUsage();
  console.log('User usage loaded on install:', userUsage);
  
  if (details.reason === 'install') {
    console.log('Upwork Cover Letter Generator installed');
    
    // Set default settings
    chrome.storage.local.set({
      enabled: true,
      coverLetterTemplate: 'default',
      autoFill: true
    });
  }
});

// Function to generate custom prompt based on user settings
function generateCustomPrompt(jobTitle, jobDescription, settings) {
  // Guided mode removed

  // Custom template mode
  const customText = settings.customPrompt ? settings.customPrompt.trim() : '';
  // Revert: In custom mode, use only the user's template (or default) without wrappers
  let customPrompt = customText || getDefaultPrompt();
  customPrompt = customPrompt.replace(/\[Your Name\]/g, settings.yourName || 'Your Name');
  return customPrompt;
}

// Default prompt template
function getDefaultPrompt() {
  return `I have extensive experience in web development and I'm excited about this project.

Based on the job description, I can see you need someone with expertise in the required technologies. I have extensive experience with these technologies and I'm confident I can deliver excellent results.

I'd love to learn more about your specific requirements and timeline. What's the most important aspect of this project for you?

Best regards,
[Your Name]`;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);
  
  if (request.action === 'generateCoverLetter') {
    // Check usage limits before generating
    checkUsageLimits()
      .then(canGenerate => {
        if (!canGenerate) {
          console.log('Usage limit reached for user');
          sendResponse({ 
            success: false, 
            error: 'Usage limit reached', 
            limitReached: true,
            usage: userUsage 
          });
          return;
        }
        
        // Generate cover letter
    generateCoverLetter(request.jobTitle, request.jobDescription)
      .then(coverLetter => {
            // Track usage after successful generation
            trackUsage();
            console.log('Proposal generated successfully');
            sendResponse({ success: true, coverLetter, usage: userUsage });
          })
          .catch(error => {
            console.error('Error generating cover letter:', error);
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        console.error('Error checking usage limits:', error);
        sendResponse({ success: false, error: 'Failed to check usage limits' });
      });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getUsage') {
    console.log('Sending usage info:', userUsage);
    sendResponse({ success: true, usage: userUsage });
    return true;
  }
  
  if (request.action === 'checkSubscription') {
    checkSubscriptionStatus()
      .then(status => {
        sendResponse({ success: true, subscription: status });
      })
      .catch(error => {
        console.error('Error checking subscription:', error);
        sendResponse({ success: false, error: 'Failed to check subscription' });
      });
    return true;
  }
  
  // Handle unknown actions
  console.warn('Unknown action received:', request.action);
  sendResponse({ success: false, error: 'Unknown action' });
  return true;
});

// Usage tracking and subscription management functions
async function checkUsageLimits() {
  await loadUserUsage();
  
  // Check if user has premium subscription
  if (userUsage.subscriptionStatus === 'premium' && userUsage.subscriptionExpiry > Date.now()) {
    return true; // Premium users have unlimited access
  }
  
  // Check free tier limits
  if (userUsage.proposalsUsed >= DEFAULT_CONFIG.FREE_PROPOSAL_LIMIT) {
    return false; // Free limit reached
  }
  
  return true; // Can generate
}

async function trackUsage() {
  userUsage.proposalsUsed++;
  await saveUserUsage();
  
  // Send usage data to your backend
  try {
    await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/track-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userUsage.userId,
        proposalsUsed: userUsage.proposalsUsed,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.log('Failed to sync usage with backend:', error);
  }
}

async function loadUserUsage() {
  try {
    const result = await chrome.storage.local.get(['userUsage']);
    if (result.userUsage) {
      userUsage = { ...userUsage, ...result.userUsage };
      console.log('User usage loaded from storage:', userUsage);
    } else {
      console.log('No user usage found in storage, using defaults');
    }
  } catch (error) {
    console.error('Error loading user usage:', error);
    // Keep default values
  }
}

async function saveUserUsage() {
  try {
    await chrome.storage.local.set({ userUsage });
    console.log('User usage saved:', userUsage);
  } catch (error) {
    console.error('Error saving user usage:', error);
  }
}

async function checkSubscriptionStatus() {
  await loadUserUsage();
  
  // Check if subscription is expired
  if (userUsage.subscriptionStatus === 'premium' && userUsage.subscriptionExpiry < Date.now()) {
    userUsage.subscriptionStatus = 'expired';
    await saveUserUsage();
  }
  
  return userUsage;
}

// Fallback function to generate proposals locally using custom prompt when backend is unavailable
function generateLocalProposalWithCustomPrompt(jobTitle, jobDescription, settings, customPrompt) {
  console.log('Generating local proposal with custom prompt as fallback');
  console.log('Custom prompt:', customPrompt);
  console.log('Job title:', jobTitle);
  console.log('Job description length:', jobDescription.length);
  
  // Use the custom prompt as the base for the proposal
  let proposal = customPrompt;
  
  // Replace [Your Name] with actual name
  proposal = proposal.replace(/\[Your Name\]/g, settings.yourName || 'Your Name');
  
  
  // Clean up any remaining placeholders
  proposal = proposal.replace(/\{[^}]+\}/g, '');
  
  // Ensure proper formatting
  proposal = proposal.trim();
  
  console.log('Final generated proposal:', proposal);
  
  return proposal;
}

// Fallback function to generate proposals locally when backend is unavailable
function generateLocalProposal(jobTitle, jobDescription, settings) {
  console.log('Generating local proposal as fallback');
  
  // Extract key skills from job description
  const skills = extractSkillsFromDescription(jobDescription);
  const experience = extractExperienceFromDescription(jobDescription);
  const field = extractFieldFromDescription(jobDescription);
  
  // Generate a personalized proposal based on job content
  let proposal = `I have ${experience}+ years of experience in ${field} and I'm really excited about this ${jobTitle} project. `;
  
  if (skills.length > 0) {
    proposal += `I've worked extensively with ${skills.slice(0, 4).join(', ')} and I have a strong understanding of the technologies you need. `;
  } else {
    proposal += `I have relevant experience in this field and I'm confident I can deliver excellent results. `;
  }
  
  // Add project-specific details
  if (jobDescription.toLowerCase().includes('ecommerce') || jobDescription.toLowerCase().includes('online store')) {
    proposal += `I have experience building e-commerce solutions and understand the importance of user experience and conversion optimization. `;
  } else if (jobDescription.toLowerCase().includes('mobile') || jobDescription.toLowerCase().includes('app')) {
    proposal += `I specialize in mobile development and understand the unique challenges of creating responsive, user-friendly applications. `;
  } else if (jobDescription.toLowerCase().includes('api') || jobDescription.toLowerCase().includes('backend')) {
    proposal += `I have extensive experience with backend development and API integration, ensuring scalable and efficient solutions. `;
  }
  
  proposal += `\n\nI always focus on delivering high-quality work on time and keeping you updated throughout the project. I'm available to start immediately and can work within your timeline.\n\n`;
  
  // Add intelligent questions based on job type
  if (jobDescription.toLowerCase().includes('design') || jobDescription.toLowerCase().includes('ui') || jobDescription.toLowerCase().includes('ux')) {
    proposal += `I'd love to learn more about your design preferences and target audience. Do you have any specific style guidelines or brand requirements I should follow?\n\n`;
  } else if (jobDescription.toLowerCase().includes('seo') || jobDescription.toLowerCase().includes('marketing')) {
    proposal += `I'd like to understand your current marketing goals and target keywords. What's your main objective with this project?\n\n`;
  } else {
    proposal += `I'd love to discuss the technical requirements and your vision for this project. What's the most important aspect you'd like me to focus on?\n\n`;
  }
  
  
  proposal += `I'm available for a quick call to discuss the details further, or we can continue the conversation through Upwork messages. Looking forward to working with you!\n\n`;
  
  proposal += `Best regards,\n${settings.yourName || 'Your Name'}`;
  
  return proposal;
}


// Helper function to extract experience requirements
function extractExperienceFromDescription(description) {
  const experienceMatch = description.match(/(\d+)\+?\s*years?\s*of\s*experience/i);
  if (experienceMatch) {
    return experienceMatch[1];
  }
  
  // Look for other experience indicators
  if (description.toLowerCase().includes('senior') || description.toLowerCase().includes('lead')) {
    return '8';
  } else if (description.toLowerCase().includes('junior') || description.toLowerCase().includes('entry')) {
    return '2';
  } else if (description.toLowerCase().includes('mid-level') || description.toLowerCase().includes('intermediate')) {
    return '4';
  }
  
  return '5'; // Default experience
}

// Helper function to extract field/domain from job description
function extractFieldFromDescription(description) {
  const lowerDesc = description.toLowerCase();
  
  // Web Development
  if (lowerDesc.includes('react') || lowerDesc.includes('vue') || lowerDesc.includes('angular')) {
    return 'frontend development';
  } else if (lowerDesc.includes('node') || lowerDesc.includes('express') || lowerDesc.includes('api')) {
    return 'backend development';
  } else if (lowerDesc.includes('full stack') || lowerDesc.includes('full-stack')) {
    return 'full-stack development';
  }
  
  // Mobile Development
  if (lowerDesc.includes('mobile') || lowerDesc.includes('ios') || lowerDesc.includes('android')) {
    return 'mobile development';
  }
  
  // Design
  if (lowerDesc.includes('ui') || lowerDesc.includes('ux') || lowerDesc.includes('design')) {
    return 'UI/UX design';
  }
  
  // Marketing & SEO
  if (lowerDesc.includes('seo') || lowerDesc.includes('marketing') || lowerDesc.includes('digital marketing')) {
    return 'digital marketing and SEO';
  }
  
  // Data & Analytics
  if (lowerDesc.includes('data') || lowerDesc.includes('analytics') || lowerDesc.includes('machine learning')) {
    return 'data analysis and machine learning';
  }
  
  // E-commerce
  if (lowerDesc.includes('ecommerce') || lowerDesc.includes('e-commerce') || lowerDesc.includes('shopify')) {
    return 'e-commerce development';
  }
  
  // Content & Writing
  if (lowerDesc.includes('content') || lowerDesc.includes('writing') || lowerDesc.includes('copywriting')) {
    return 'content creation and copywriting';
  }
  
  // Default based on common keywords
  if (lowerDesc.includes('web') || lowerDesc.includes('website') || lowerDesc.includes('development')) {
    return 'web development';
  }
  
  return 'web development'; // Default field
}

// Function to generate cover letter using your backend API
async function generateCoverLetter(jobTitle, jobDescription) {
  try {
    // Load user usage data first
    await loadUserUsage();
    
    // Get user settings from storage
    const settings = await chrome.storage.local.get(['customPrompt', 'yourName', 'quickSettings']);
    
    // Generate the prompt using user settings
    const prompt = generateCustomPrompt(jobTitle, jobDescription, settings);

    // Validate inputs
    if (!jobTitle || !jobDescription) {
      throw new Error('Missing required information: jobTitle or jobDescription');
    }
    
    // Clean inputs to avoid issues
    const cleanJobTitle = jobTitle.toString().trim();
    const cleanJobDescription = jobDescription.toString().trim();
    
    // Truncate job description to avoid token limit (keep first 2000 characters)
    const truncatedJobDescription = cleanJobDescription.length > 2000 
      ? cleanJobDescription.substring(0, 2000) + '...' 
      : cleanJobDescription;
    
    console.log('Sending request to backend API...');
    
    // Try to call your backend API first
    try {
      const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/generate-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
          'Authorization': `Bearer ${userUsage.userId || 'anonymous'}`
      },
      body: JSON.stringify({
          jobTitle: cleanJobTitle,
          jobDescription: truncatedJobDescription,
          customPrompt: prompt,
          userId: userUsage.userId,
          subscriptionStatus: userUsage.subscriptionStatus
      })
    });
    
      console.log('Backend response status:', response.status);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
      if (data.success && data.proposal) {
        let proposal = data.proposal.trim();
      
      // Replace [Your Name] placeholder with actual name from settings
      const signatureName = settings.yourName || 'Your Name';
      proposal = proposal.replace(/\[Your Name\]/g, signatureName);
      
        console.log('Generated proposal via backend:', proposal);
        return proposal;
      } else {
        throw new Error(data.message || 'Invalid response from backend API');
      }
    } catch (apiError) {
      console.warn('Backend API failed, falling back to local generation:', apiError.message);
      
      // Fallback to local generation using the custom prompt
      return generateLocalProposalWithCustomPrompt(cleanJobTitle, truncatedJobDescription, settings, prompt);
    }

  } catch (error) {
    console.error('Error generating cover letter with ChatGPT:', error);
    
    // Get settings for fallback
    const settings = await chrome.storage.local.get(['customPrompt', 'yourName', 'quickSettings']);
    
    // Try to use custom prompt as final fallback
    if (settings.customPrompt) {
      console.log('Using custom prompt as final fallback');
      return generateLocalProposalWithCustomPrompt(cleanJobTitle, truncatedJobDescription, settings, settings.customPrompt);
    }
    
    // Ultimate fallback to basic cover letter if no custom prompt
    const signatureName = settings.yourName || 'Your Name';
    return `I have 4 years of experience in SEO and I'm really excited about this ${cleanJobTitle} project. I've worked on similar stuff before and I think I can help you out here.

I usually focus on getting things done right the first time and keeping you updated along the way. I'm pretty flexible with timelines and can start whenever you need me.

What's the most important part of this project for you? And do you prefer to chat through Upwork messages or would you rather hop on a quick call to discuss details?

Looking forward to working with you!

Best regards,
${signatureName}`;
  }
}

// Handle extension installation (moved to top of file)

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('upwork.com')) {
    // Inject content script if not already injected
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(error => {
      console.log('Content script already injected or error:', error);
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('upwork.com')) {
    // Open popup or show options
    chrome.action.openPopup();
  } else {
    // Show message to navigate to Upwork
    chrome.tabs.create({ url: 'https://www.upwork.com' });
  }
});
