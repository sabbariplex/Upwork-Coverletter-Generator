// Content script for Upwork Cover Letter Generator
// Prevent duplicate execution
if (window.upworkCoverLetterGeneratorLoaded) {
  console.log('Upwork Cover Letter Generator already loaded, skipping...');
} else {
  window.upworkCoverLetterGeneratorLoaded = true;

console.log('Upwork Cover Letter Generator loaded');

  // Add error handling wrapper
  try {
// Guard flags to prevent duplicate proposal generation
if (typeof window.__proposalGenerated === 'undefined') {
  window.__proposalGenerated = false;
}
if (typeof window.__proposalGenerationInProgress === 'undefined') {
  window.__proposalGenerationInProgress = false;
}
// Helper function to expand truncated descriptions
function expandTruncatedDescription() {
  const moreButton = document.querySelector('.air3-truncation-btn');
  if (moreButton && moreButton.getAttribute('aria-expanded') === 'false') {
    console.log('Expanding truncated description...');
    moreButton.click();
    return true;
  }
  return false;
}

// Function to extract job description from Upwork page
function extractJobDescription() {
  try {
    console.log('Attempting to extract job description...');
    
    // First try to expand any truncated descriptions
    expandTruncatedDescription();
    
  // Priority 1: .job-details-content .text-body-sm (most specific and accurate)
  const jobDetailsText = document.querySelector('.job-details-content .text-body-sm');
  if (jobDetailsText && jobDetailsText.textContent && jobDetailsText.textContent.trim().length > 10) {
    const text = jobDetailsText.textContent.trim();
    console.log('Found job description in .job-details-content .text-body-sm:', text.substring(0, 100) + '...');
    return text;
  }

  // Priority 1.5: Handle truncated descriptions in new Upwork layout
  const truncatedDesc = document.querySelector('.description .air3-truncation span span');
  if (truncatedDesc && truncatedDesc.textContent && truncatedDesc.textContent.trim().length > 10) {
    const text = truncatedDesc.textContent.trim();
    console.log('Found truncated job description:', text.substring(0, 100) + '...');
    
    // Try to expand the description by clicking "more" button
    const moreButton = document.querySelector('.air3-truncation-btn');
    if (moreButton && text.includes('…')) {
      console.log('Clicking "more" button to expand description...');
      moreButton.click();
      
      // Wait a bit for the content to expand, then try again
      setTimeout(() => {
        const expandedDesc = document.querySelector('.description .air3-truncation span span');
        if (expandedDesc && expandedDesc.textContent && expandedDesc.textContent.trim().length > text.length) {
          const expandedText = expandedDesc.textContent.trim();
          console.log('Found expanded job description:', expandedText.substring(0, 100) + '...');
          return expandedText;
        }
      }, 500);
    }
    
    return text;
  }

  // Priority 2: .job-details-content (fallback to parent container)
  const jobDetailsContent = document.querySelector('.job-details-content');
  if (jobDetailsContent && jobDetailsContent.textContent && jobDetailsContent.textContent.trim().length > 50) {
    const text = jobDetailsContent.textContent.trim();
    console.log('Found job description in .job-details-content:', text.substring(0, 100) + '...');
    return text;
  }

  // Priority 3: .fe-job-details
  const feDetails = document.querySelector('.fe-job-details');
  if (feDetails && feDetails.textContent && feDetails.textContent.trim().length > 50) {
    const text = feDetails.textContent.trim();
    console.log('Found job description in .fe-job-details:', text.substring(0, 100) + '...');
    return text;
  }

  // Try multiple selectors to find job description
  const selectors = [
      // Upwork specific selectors (most accurate first)
      '.job-details-content .text-body-sm',
      '.description .air3-truncation span span',
      '.description',
      '[data-test="job-description"]',
      '[data-test="job-description-text"]',
      'section[data-test="job-description"]',
      '.up-card-section[data-test="job-description"]',
      '[data-cy="job-description"]',
      '.job-description',
      '.job-description-text',
      '.job-details-content',
      '.fe-job-details',
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
      '[class*="job-content"]',
      // Additional selectors for newer Upwork layouts
      '.up-card-section p',
      '.up-card-section div',
      '[data-test="job-details"] p',
      '[data-test="job-details"] div',
      '.job-details p',
      '.job-details div'
    ];
    
    console.log('Trying selectors...');
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        console.log(`Found text with selector "${selector}":`, text.substring(0, 100) + '...');
        console.log(`Full text for selector "${selector}":`, text);
        
        // Check if this looks like a job description (has reasonable length and content)
        if (text.length > 100 && text.length < 5000 && 
            !text.includes('Apply Now') && !text.includes('Submit Proposal') &&
            !text.includes('Posted') && !text.includes('Hourly range') &&
            !text.includes('Skills and expertise') && !text.includes('View job posting')) {
          console.log(`Using text from selector "${selector}" as job description`);
          return text;
        }
      }
    }
    
    // Fallback: look for any element containing substantial text that might be job description
    console.log('Trying fallback methods...');
    
    // First, try to find text that looks like a job description by keywords
    const jobKeywords = ['looking for', 'need', 'require', 'project', 'work', 'experience', 'skills', 'css', 'liquid', 'shopify', 'wordpress', 'react', 'api', 'deadline'];
    const allElements = document.querySelectorAll('div, section, article, p, span');
    
    for (const element of allElements) {
      const text = element.textContent.trim();
      if (text.length > 50 && text.length < 1000) {
        // Check if this text contains job-related keywords
        const hasJobKeywords = jobKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
        if (hasJobKeywords && 
            !text.includes('Apply Now') && 
            !text.includes('Submit Proposal') && 
            !text.includes('Navigation') &&
            !text.includes('Menu') &&
            !text.includes('Sign In') &&
            !text.includes('Sign Up') &&
            !text.includes('Profile') &&
            !text.includes('Messages') &&
            !text.includes('Hourly range') &&
            !text.includes('Skills and expertise')) {
          console.log('Found job description by keywords:', text);
          return text;
        }
      }
    }
    
    // Look for the largest text block on the page that's likely job content
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

// Validate the extracted job description to ensure it's real job content
function isValidJobDescription(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 120) return false; // too short to be meaningful
  const bannedSnippets = [
    'Apply Now', 'Submit Proposal', 'Find freelancers and agencies', 'Find work', 'Messages',
    'Post a job', 'How it works', 'Become a freelancer', 'Navigation', 'Menu', 'Sign In', 'Sign Up',
    'Hourly range', 'Skills and expertise', 'View job posting', 'Featured Job',
    'Apply to jobs posted by clients'
  ];
  if (bannedSnippets.some(s => t.includes(s))) return false;
  return true;
}

// Function to detect additional questions in the application form
function detectAdditionalQuestions() {
  const questions = [];
  
  console.log('Starting question detection...');
  
  // Find all textarea elements that are likely question answer fields
  const textareas = document.querySelectorAll('textarea');
  console.log(`Found ${textareas.length} textarea elements`);
  
  // Log all textareas for debugging
  textareas.forEach((textarea, index) => {
    console.log(`Textarea ${index + 1}:`, {
      id: textarea.id,
      name: textarea.name,
      placeholder: textarea.placeholder,
      ariaLabelledBy: textarea.getAttribute('aria-labelledby'),
      className: textarea.className,
      parentClass: textarea.parentElement?.className,
      isInQuestionsArea: textarea.closest('.fe-proposal-job-questions') || textarea.closest('.questions-area'),
      isInCoverLetterArea: textarea.closest('.cover-letter-area')
    });
  });
  
  // Look for the "Additional details" section to better identify question fields
  const additionalDetailsSection = document.querySelector('.fe-proposal-additional-details') || 
                                  document.querySelector('[data-test*="additional"]') ||
                                  document.querySelector('.additional-details');
  
  // Look specifically for the questions area within additional details
  const questionsArea = document.querySelector('.fe-proposal-job-questions') ||
                       document.querySelector('.questions-area');
  
  console.log('Additional details section found:', !!additionalDetailsSection);
  console.log('Questions area found:', !!questionsArea);
  
  textareas.forEach((textarea, index) => {
    // Skip if it's the main cover letter field - more comprehensive check
    const isCoverLetterField = 
      textarea.name === 'proposal' || textarea.id === 'proposal' || 
      textarea.name === 'coverLetter' || textarea.id === 'coverLetter' ||
      textarea.name === 'letter' || textarea.id === 'letter' ||
      textarea.placeholder?.toLowerCase().includes('cover') ||
      textarea.placeholder?.toLowerCase().includes('letter') ||
      textarea.placeholder?.toLowerCase().includes('proposal') ||
      textarea.getAttribute('aria-label')?.toLowerCase().includes('cover') ||
      textarea.getAttribute('aria-label')?.toLowerCase().includes('letter') ||
      textarea.getAttribute('aria-label')?.toLowerCase().includes('proposal') ||
      textarea.getAttribute('aria-labelledby')?.includes('cover') ||
      textarea.getAttribute('aria-labelledby')?.includes('letter') ||
      textarea.getAttribute('aria-labelledby')?.includes('proposal') ||
      textarea.className?.includes('cover') ||
      textarea.className?.includes('letter') ||
      textarea.className?.includes('proposal') ||
      // Check if it's in the cover letter area
      textarea.closest('.cover-letter-area') ||
      // Check if the label text indicates it's a cover letter
      (() => {
        const labelElement = document.querySelector(`label[for="${textarea.id}"]`);
        if (labelElement) {
          const labelText = labelElement.textContent.toLowerCase();
          return labelText.includes('cover') || labelText.includes('letter') || labelText.includes('proposal');
        }
        return false;
      })() ||
      // Check if any parent element contains cover letter indicators
      (() => {
        let parent = textarea.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
          const parentText = parent.textContent.toLowerCase();
          if (parentText.includes('cover letter') || parentText.includes('proposal')) {
            return true;
          }
          parent = parent.parentElement;
          depth++;
        }
        return false;
      })();
    
    if (isCoverLetterField) {
      console.log(`Skipping cover letter field: ${textarea.name || textarea.id || textarea.placeholder || 'unknown'}`);
      return;
    }
    
    // Skip if element is hidden or disabled
    if (textarea.offsetParent === null || textarea.disabled) {
      console.log(`Skipping hidden/disabled textarea: ${textarea.name || textarea.id}`);
      return;
    }
    
    // Only process textareas that are specifically in the questions area
    if (questionsArea) {
      const isInQuestionsArea = questionsArea.contains(textarea);
      if (!isInQuestionsArea) {
        console.log(`Skipping textarea outside questions area: ${textarea.name || textarea.id || 'unknown'}`);
        return;
      }
    } else {
      // If no questions area found, skip all textareas
      console.log(`No questions area found, skipping all textareas`);
      return;
    }
    
    // Look for the question text above this textarea
    let questionText = '';
    
    // Method 1: Look for label element
    const labelElement = document.querySelector(`label[for="${textarea.id}"]`);
    if (labelElement) {
      questionText = labelElement.textContent.trim();
      console.log(`Found label for textarea ${index + 1}: "${questionText}"`);
      
      // Skip if this is clearly a cover letter field based on label
      if (questionText.toLowerCase().includes('cover') || 
          questionText.toLowerCase().includes('letter') || 
          questionText.toLowerCase().includes('proposal')) {
        console.log(`Skipping cover letter field based on label: "${questionText}"`);
        return;
      }
    }
    
    // Method 2: Look for text content in previous siblings
    if (!questionText) {
      let currentElement = textarea.previousElementSibling;
      while (currentElement && !questionText) {
        if (currentElement.tagName === 'LABEL') {
          questionText = currentElement.textContent.trim();
          console.log(`Found label sibling for textarea ${index + 1}: "${questionText}"`);
        } else if (currentElement.textContent && currentElement.textContent.trim().length > 10) {
          // Check if this element contains question-like text
          const text = currentElement.textContent.trim();
          if (text.includes('?') || 
              text.toLowerCase().includes('what') || 
              text.toLowerCase().includes('how') || 
              text.toLowerCase().includes('why') || 
              text.toLowerCase().includes('when') || 
              text.toLowerCase().includes('where') || 
              text.toLowerCase().includes('describe') || 
              text.toLowerCase().includes('explain') || 
              text.toLowerCase().includes('tell') || 
              text.toLowerCase().includes('share') || 
              text.toLowerCase().includes('provide') || 
              text.toLowerCase().includes('experience') || 
              text.toLowerCase().includes('approach') || 
              text.toLowerCase().includes('timeline') || 
              text.toLowerCase().includes('budget') || 
              text.toLowerCase().includes('portfolio') || 
              text.toLowerCase().includes('background') || 
              text.toLowerCase().includes('qualification') || 
              text.toLowerCase().includes('skill') || 
              text.toLowerCase().includes('expertise') || 
              text.toLowerCase().includes('methodology') || 
              text.toLowerCase().includes('process') || 
              text.toLowerCase().includes('workflow') || 
              text.toLowerCase().includes('deliverable') || 
              text.toLowerCase().includes('milestone') || 
              text.toLowerCase().includes('communication') || 
              text.toLowerCase().includes('availability') || 
              text.toLowerCase().includes('rate') || 
              text.toLowerCase().includes('cost') || 
              text.toLowerCase().includes('price') || 
              text.toLowerCase().includes('fee') || 
              text.toLowerCase().includes('payment') || 
              text.toLowerCase().includes('sample') || 
              text.toLowerCase().includes('example') || 
              text.toLowerCase().includes('reference') || 
              text.toLowerCase().includes('testimonial') || 
              text.toLowerCase().includes('review') || 
              text.toLowerCase().includes('feedback') || 
              text.toLowerCase().includes('client') || 
              text.toLowerCase().includes('project') || 
              text.toLowerCase().includes('challenge') || 
              text.toLowerCase().includes('problem') || 
              text.toLowerCase().includes('solution') || 
              text.toLowerCase().includes('result') || 
              text.toLowerCase().includes('outcome') || 
              text.toLowerCase().includes('success') || 
              text.toLowerCase().includes('achievement') || 
              text.toLowerCase().includes('accomplishment') || 
              text.toLowerCase().includes('goal') || 
              text.toLowerCase().includes('objective') || 
              text.toLowerCase().includes('requirement') || 
              text.toLowerCase().includes('specification') || 
              text.toLowerCase().includes('scope') || 
              text.toLowerCase().includes('expectation') || 
              text.toLowerCase().includes('preference') || 
              text.toLowerCase().includes('priority') || 
              text.toLowerCase().includes('concern')) {
            questionText = text;
            console.log(`Found question text sibling for textarea ${index + 1}: "${questionText}"`);
          }
        }
        currentElement = currentElement.previousElementSibling;
      }
    }
    
    // Method 3: Look for text content in parent elements
    if (!questionText) {
      let parentElement = textarea.parentElement;
      let depth = 0;
      while (parentElement && !questionText && depth < 5) {
        // Look for text content in this parent
        const parentText = parentElement.textContent.trim();
        if (parentText && parentText.length > 10 && parentText.length < 500) {
          // Check if this parent contains question-like text
          if (parentText.includes('?') || 
              parentText.toLowerCase().includes('what') || 
              parentText.toLowerCase().includes('how') || 
              parentText.toLowerCase().includes('why') || 
              parentText.toLowerCase().includes('when') || 
              parentText.toLowerCase().includes('where') || 
              parentText.toLowerCase().includes('describe') || 
              parentText.toLowerCase().includes('explain') || 
              parentText.toLowerCase().includes('tell') || 
              parentText.toLowerCase().includes('share') || 
              parentText.toLowerCase().includes('provide') || 
              parentText.toLowerCase().includes('experience') || 
              parentText.toLowerCase().includes('approach') || 
              parentText.toLowerCase().includes('timeline') || 
              parentText.toLowerCase().includes('budget') || 
              parentText.toLowerCase().includes('portfolio') || 
              parentText.toLowerCase().includes('background') || 
              parentText.toLowerCase().includes('qualification') || 
              parentText.toLowerCase().includes('skill') || 
              parentText.toLowerCase().includes('expertise') || 
              parentText.toLowerCase().includes('methodology') || 
              parentText.toLowerCase().includes('process') || 
              parentText.toLowerCase().includes('workflow') || 
              parentText.toLowerCase().includes('deliverable') || 
              parentText.toLowerCase().includes('milestone') || 
              parentText.toLowerCase().includes('communication') || 
              parentText.toLowerCase().includes('availability') || 
              parentText.toLowerCase().includes('rate') || 
              parentText.toLowerCase().includes('cost') || 
              parentText.toLowerCase().includes('price') || 
              parentText.toLowerCase().includes('fee') || 
              parentText.toLowerCase().includes('payment') || 
              parentText.toLowerCase().includes('sample') || 
              parentText.toLowerCase().includes('example') || 
              parentText.toLowerCase().includes('reference') || 
              parentText.toLowerCase().includes('testimonial') || 
              parentText.toLowerCase().includes('review') || 
              parentText.toLowerCase().includes('feedback') || 
              parentText.toLowerCase().includes('client') || 
              parentText.toLowerCase().includes('project') || 
              parentText.toLowerCase().includes('challenge') || 
              parentText.toLowerCase().includes('problem') || 
              parentText.toLowerCase().includes('solution') || 
              parentText.toLowerCase().includes('result') || 
              parentText.toLowerCase().includes('outcome') || 
              parentText.toLowerCase().includes('success') || 
              parentText.toLowerCase().includes('achievement') || 
              parentText.toLowerCase().includes('accomplishment') || 
              parentText.toLowerCase().includes('goal') || 
              parentText.toLowerCase().includes('objective') || 
              parentText.toLowerCase().includes('requirement') || 
              parentText.toLowerCase().includes('specification') || 
              parentText.toLowerCase().includes('scope') || 
              parentText.toLowerCase().includes('expectation') || 
              parentText.toLowerCase().includes('preference') || 
              parentText.toLowerCase().includes('priority') || 
              parentText.toLowerCase().includes('concern')) {
            questionText = parentText;
            console.log(`Found question text in parent for textarea ${index + 1}: "${questionText}"`);
          }
        }
        parentElement = parentElement.parentElement;
        depth++;
      }
    }
    
    // Method 4: Use placeholder as fallback
    if (!questionText) {
      questionText = textarea.placeholder || `Question ${index + 1}`;
      console.log(`Using placeholder for textarea ${index + 1}: "${questionText}"`);
    }
    
    // Only add if we found a meaningful question text and it's not a cover letter
    if (questionText && questionText.length > 10) { // Increased minimum length
      // Additional check: Make sure this is not a cover letter field
      const isCoverLetterByText = 
        questionText.toLowerCase().includes('cover') ||
        questionText.toLowerCase().includes('letter') ||
        questionText.toLowerCase().includes('proposal');
      
      // Check if it looks like a real question (contains question words or ends with ?)
      const looksLikeQuestion = 
        questionText.includes('?') ||
        questionText.toLowerCase().includes('what') ||
        questionText.toLowerCase().includes('how') ||
        questionText.toLowerCase().includes('why') ||
        questionText.toLowerCase().includes('when') ||
        questionText.toLowerCase().includes('where') ||
        questionText.toLowerCase().includes('describe') ||
        questionText.toLowerCase().includes('explain') ||
        questionText.toLowerCase().includes('tell') ||
        questionText.toLowerCase().includes('share') ||
        questionText.toLowerCase().includes('provide') ||
        questionText.toLowerCase().includes('briefly') ||
        questionText.toLowerCase().includes('in your own words');
      
      if (!isCoverLetterByText && looksLikeQuestion) {
        console.log(`Found question ${questions.length + 1}: "${questionText.substring(0, 100)}..." (textarea)`);
        questions.push({
          element: textarea,
          label: questionText,
          type: 'textarea',
          placeholder: textarea.placeholder || '',
          required: textarea.required || false
        });
      } else {
        console.log(`Skipping textarea - not a valid question: "${questionText.substring(0, 50)}..."`);
      }
    } else {
      console.log(`Skipping textarea - no valid question text found`);
    }
  });
  
  
  console.log('Total questions detected:', questions.length);
  return questions;
}

// Function to wait for page to be completely ready with all elements loaded
function waitForPageToBeReady() {
  return new Promise((resolve) => {
    console.log('Waiting for page to be completely ready...');
    
    // First wait for basic page load
    const waitForBasicLoad = () => {
      if (document.readyState === 'complete') {
        console.log('Basic page load complete, waiting for dynamic content...');
        waitForDynamicContent();
      } else {
        window.addEventListener('load', () => {
          console.log('Basic page load complete, waiting for dynamic content...');
          waitForDynamicContent();
        });
      }
    };
    
    const waitForDynamicContent = () => {
      // Wait for common form elements to be present
      const formSelectors = [
        'form',
        'textarea',
        'input[type="text"]',
        'input[type="email"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input[type="number"]',
        'input[type="date"]',
        'input[type="time"]',
        'input[type="datetime-local"]',
        'input[type="month"]',
        'input[type="week"]',
        'input[type="search"]',
        'input[type="password"]',
        'input[type="hidden"]',
        'select',
        'button[type="submit"]',
        'button[type="button"]',
        '[data-test*="form"]',
        '[data-test*="input"]',
        '[data-test*="textarea"]',
        '[data-test*="button"]',
        '[data-cy*="form"]',
        '[data-cy*="input"]',
        '[data-cy*="textarea"]',
        '[data-cy*="button"]'
      ];
      
      let foundElements = 0;
      formSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements += elements.length;
        }
      });
      
      console.log(`Found ${foundElements} form elements`);
      
      // If we found form elements, wait a bit more for dynamic content
      if (foundElements > 0) {
        setTimeout(() => {
          console.log('Form elements detected, waiting additional time for dynamic content...');
          setTimeout(() => {
            console.log('Page should be ready now');
            resolve();
          }, 5000); // Wait 5 more seconds for dynamic content
        }, 3000); // Wait 3 seconds after finding elements
      } else {
        // If no form elements found, wait a bit and try again
        setTimeout(() => {
          console.log('No form elements found, retrying...');
          waitForDynamicContent();
        }, 2000); // Increased retry delay
      }
    };
    
    // Start the process
    waitForBasicLoad();
  });
}

// Function to generate answers for additional questions using ChatGPT
async function generateQuestionAnswers(questions, jobTitle, jobDescription) {
  if (questions.length === 0) return [];
  
  try {
    // Send message to background script to generate answers
    const response = await chrome.runtime.sendMessage({
      action: 'generateQuestionAnswers',
      questions: questions.map(q => ({
        label: q.label,
        type: q.type,
        placeholder: q.placeholder,
        required: q.required
      })),
      jobTitle: jobTitle,
      jobDescription: jobDescription
    });
    
    if (response && response.success) {
      return response.answers || [];
    } else {
      console.error('Failed to generate question answers:', response?.error || 'Unknown error');
      return [];
    }
  } catch (error) {
    console.error('Error generating question answers:', error);
    return [];
  }
}

// Function to fill additional question fields with retry
function fillQuestionFields(questions, answers) {
  let filledCount = 0;
  
  questions.forEach((question, index) => {
    if (answers[index]) {
      const element = question.element;
      
      // Check if element is still in the DOM and visible
      if (element && element.offsetParent !== null && !element.disabled) {
        // Additional check: Make sure this is not the cover letter field
        const isCoverLetterField = 
          element.name === 'proposal' || element.id === 'proposal' || 
          element.name === 'coverLetter' || element.id === 'coverLetter' ||
          element.name === 'letter' || element.id === 'letter' ||
          element.placeholder?.toLowerCase().includes('cover') ||
          element.placeholder?.toLowerCase().includes('letter') ||
          element.placeholder?.toLowerCase().includes('proposal') ||
          element.getAttribute('aria-label')?.toLowerCase().includes('cover') ||
          element.getAttribute('aria-label')?.toLowerCase().includes('letter') ||
          element.getAttribute('aria-label')?.toLowerCase().includes('proposal') ||
          element.getAttribute('aria-labelledby')?.includes('cover') ||
          element.getAttribute('aria-labelledby')?.includes('letter') ||
          element.getAttribute('aria-labelledby')?.includes('proposal') ||
          element.className?.includes('cover') ||
          element.className?.includes('letter') ||
          element.className?.includes('proposal');
        
        if (isCoverLetterField) {
          console.log(`Skipping cover letter field when filling questions: ${element.name || element.id || element.placeholder || 'unknown'}`);
          return;
        }
        
        // Check if field already has long content (likely cover letter)
        if (element.value && element.value.trim().length > 50) {
          console.log(`Skipping field with existing content (likely cover letter): "${element.value.substring(0, 50)}..."`);
          return;
        }
        
        try {
          const answerText = answers[index];
          const labelText = (question.label || '').trim();

          // If the field currently contains the label text, clear it first
          if (element.value && element.value.trim() === labelText) {
            element.value = '';
          }

          // Set the answer WITHOUT focusing first to avoid onfocus injections
          element.value = answerText;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));

          // Re-assert the value shortly after in case the site overwrites it
          setTimeout(() => {
            if (element.value.trim() !== answerText.trim()) {
              element.value = answerText;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, 250);

          setTimeout(() => {
            if (element.value.trim() !== answerText.trim()) {
              element.value = answerText;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, 700);

          // Do not call focus() to prevent site from inserting the question text on focus
          // element.focus();
          // element.dispatchEvent(new Event('blur', { bubbles: true }));

          filledCount++;
          console.log(`Filled question ${index + 1}: "${question.label}"`);
        } catch (error) {
          console.error(`Error filling question ${index + 1}:`, error);
        }
      } else {
        console.warn(`Question element ${index + 1} is not available or visible`);
      }
    }
  });
  
  console.log(`Successfully filled ${filledCount} out of ${questions.length} question fields`);
  return filledCount;
}

// Function to fill question fields with retry mechanism
function fillQuestionFieldsWithRetry(questions, answers, maxAttempts = 5) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const tryFill = () => {
      attempts++;
      console.log(`Attempt ${attempts} to fill question fields...`);
      
      const filledCount = fillQuestionFields(questions, answers);
      
      if (filledCount === questions.length) {
        console.log('All question fields filled successfully');
        resolve(true);
      } else if (attempts < maxAttempts) {
        console.log(`Only filled ${filledCount}/${questions.length} fields, retrying in 3 seconds...`);
        setTimeout(tryFill, 3000); // Increased delay between attempts
      } else {
        console.log(`Max attempts reached, filled ${filledCount}/${questions.length} fields`);
        resolve(filledCount > 0);
      }
    };
    
    // Wait a bit before starting
    setTimeout(tryFill, 1000);
  });
}

// Function to modify apply button
function modifyApplyButton() {
  // Find apply button
  const applyButton = document.querySelector('[data-test="apply-button"]') ||
                     document.querySelector('.apply-button') ||
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('a[href*="apply"]');
  
  if (applyButton) {
    // Avoid attaching duplicate listeners
    if (applyButton.dataset && applyButton.dataset.uclgModified === 'true') {
      console.log('Apply button already modified');
      return;
    }
    if (applyButton.setAttribute) {
      applyButton.setAttribute('data-uclg-modified', 'true');
      if (applyButton.dataset) applyButton.dataset.uclgModified = 'true';
    }
    // Store original click handler
    const originalClick = applyButton.onclick;
    
    // Add our custom click handler
    applyButton.addEventListener('click', async (e) => {
      // Skip handling if this is a synthetic click triggered by our script
      if (window.__uclgSyntheticClick) {
        window.__uclgSyntheticClick = false;
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      
      // Ensure page is ready before extracting
      await waitForPageToBeReady();

      // Extract job information
      let jobTitle = extractJobTitle();
      let jobDescription = extractJobDescription();
      const freelancerName = await extractFreelancerName();

      // Validate; if invalid, retry once after short delay
      if (!isValidJobDescription(jobDescription)) {
        console.log('Invalid job description on click; retrying shortly...');
        await new Promise(r => setTimeout(r, 1500));
        jobTitle = extractJobTitle();
        jobDescription = extractJobDescription();
      }
      
      if (isValidJobDescription(jobDescription)) {
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
        
        // Try to find and fill cover letter field (high priority)
        setTimeout(() => {
          fillCoverLetterField(coverLetter, 2);
        }, 1000);
      } else {
            throw new Error(response.error || 'Failed to generate proposal');
          }
        } catch (error) {
          console.error('Error generating proposal:', error);
          showNotification('Error generating proposal: ' + error.message, 'error');
        }
      } else {
        showNotification('Could not extract a valid job description yet. Please open the full job page and try again.', 'error');
      }
      
      // Call original click handler after a delay
      setTimeout(() => {
        if (originalClick) {
          originalClick.call(applyButton, e);
        } else {
          // Trigger a synthetic click but skip our handler to avoid recursion
          window.__uclgSyntheticClick = true;
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

// Function to fill cover letter field with priority control
function fillCoverLetterField(coverLetter, priority = 1) {
  // Track the best content we've set so far to avoid overwriting with lower-quality text
  if (typeof window.__coverLetterFillPriority === 'undefined') {
    window.__coverLetterFillPriority = 0;
  }
  if (priority < window.__coverLetterFillPriority) {
    console.log(`Skipping cover letter fill due to lower priority (${priority} < ${window.__coverLetterFillPriority})`);
    return false;
  }

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
  
  const applyValue = (field) => {
    // Avoid unnecessary writes if the text already matches
    if ((field.value || '').trim() === coverLetter.trim()) {
      window.__coverLetterFillPriority = priority;
      return true;
    }
    field.value = coverLetter;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    window.__coverLetterFillPriority = priority;
    return true;
  };

  for (const selector of coverLetterSelectors) {
    const field = document.querySelector(selector);
    if (field) {
      const ok = applyValue(field);
      if (ok) {
        console.log(`Cover letter filled successfully (priority ${priority})`);
        return true;
      }
    }
  }
  
  // If no specific field found, try to find any textarea that looks like the cover letter
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    if (textarea.offsetHeight > 100) { // Likely a cover letter field
      const ok = applyValue(textarea);
      if (ok) {
        console.log(`Cover letter filled in general textarea (priority ${priority})`);
        return true;
      }
    }
  }
  console.log('Cover letter field not found');
  return false;
}

// Lightweight message handler for settings page interactions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request && request.action === 'extractJobData') {
      const jobTitle = extractJobTitle();
      const jobDescription = extractJobDescription();
      if (jobDescription) {
        sendResponse({ success: true, jobTitle, jobDescription });
      } else {
        sendResponse({ success: false, error: 'No job description found' });
      }
      return true;
    }
    if (request && request.action === 'fillCoverLetter' && request.coverLetter) {
      fillCoverLetterField(request.coverLetter);
      sendResponse({ success: true });
      return true;
    }
    if (request && request.action === 'detectQuestions') {
      const questions = detectAdditionalQuestions();
      sendResponse({ success: true, questions: questions });
      return true;
    }
  } catch (e) {
    console.error('Content script handler error:', e);
    sendResponse({ success: false, error: e.message });
  }
  return false;
});

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
  if (window.__proposalGenerated) {
    console.log('Proposal already generated, skipping');
    return;
  }
  if (window.__proposalGenerationInProgress) {
    console.log('Proposal generation already in progress, skipping');
    return;
  }
  // Ensure dynamic content is present before starting generation
  await waitForPageToBeReady();
  if (window.__proposalGenerated || window.__proposalGenerationInProgress) {
    console.log('Proposal already generated or in progress after wait, skipping');
    return;
  }
  window.__proposalGenerationInProgress = true;
  
  // Extract job information and freelancer name
  const jobTitle = extractJobTitle();
  const jobDescription = extractJobDescription();
  const freelancerName = await extractFreelancerName();
  
  console.log('Extracted job title:', jobTitle);
  console.log('Extracted job description length:', jobDescription ? jobDescription.length : 'null');
  console.log('Extracted job description preview:', jobDescription ? jobDescription.substring(0, 200) + '...' : 'null');
  console.log('Full job description:', jobDescription);
  console.log('Extracted freelancer name:', freelancerName);
  console.log('Freelancer name type:', typeof freelancerName);
  console.log('Freelancer name length:', freelancerName ? freelancerName.length : 'null');
  
  // Validate the extracted job description to avoid generating from UI/navigation text
  const isValidJobDescription = (text) => {
    if (!text || typeof text !== 'string') return false;
    const t = text.trim();
    if (t.length < 50) return false; // reduced from 120 to 50 for truncated descriptions
    const bannedSnippets = [
      'Apply Now', 'Submit Proposal', 'Find freelancers and agencies', 'Find work', 'Messages',
      'Post a job', 'How it works', 'Become a freelancer', 'Navigation', 'Menu', 'Sign In', 'Sign Up',
      'Hourly range', 'Skills and expertise', 'View job posting', 'Featured Job'
    ];
    if (bannedSnippets.some(s => t.includes(s))) return false;
    return true;
  };

  if (isValidJobDescription(jobDescription)) {
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
        
        // Wait for page to be ready before filling cover letter
        waitForPageToBeReady().then(() => {
          console.log('Page is ready, filling cover letter...');
          
          // Fill cover letter with multiple attempts and longer delays
          fillCoverLetterField(coverLetter);
          
          // Try again after 2 seconds
          setTimeout(() => {
            console.log('Second attempt to fill cover letter...');
            fillCoverLetterField(coverLetter);
          }, 2000);
          
          // Try again after 4 seconds
          setTimeout(() => {
            console.log('Third attempt to fill cover letter...');
            fillCoverLetterField(coverLetter);
          }, 4000);
          // Mark as generated after scheduling fills
          window.__proposalGenerated = true;
          window.__proposalGenerationInProgress = false;
        });
        
        // Check if auto-answer questions is enabled
        chrome.storage.local.get(['autoAnswerQuestions'], function(result) {
          const autoAnswerQuestions = result.autoAnswerQuestions === true;
          console.log('Auto-answer questions setting:', autoAnswerQuestions);
          
          if (autoAnswerQuestions) {
            // Wait for page to be completely loaded and form elements to be ready
            // Add extra delay to ensure cover letter is filled first
            setTimeout(() => {
              console.log('Waiting additional 5 seconds before question detection...');
              setTimeout(() => {
                waitForPageToBeReady().then(() => {
                  console.log('Page is ready, detecting additional questions...');
                  const additionalQuestions = detectAdditionalQuestions();
                  console.log('Detected questions:', additionalQuestions);
                  
                  if (additionalQuestions.length > 0) {
                    console.log('Generating answers for', additionalQuestions.length, 'questions');
                    generateQuestionAnswers(additionalQuestions, jobTitle, jobDescription)
                      .then(answers => {
                        console.log('Generated answers:', answers);
                        return fillQuestionFieldsWithRetry(additionalQuestions, answers);
                      })
                      .then(success => {
                        if (success) {
                          showNotification(`AI proposal and ${additionalQuestions.length} question answers generated!`, 'success');
                        } else {
                          showNotification('AI proposal generated! (Some questions could not be filled)', 'success');
                        }
                      })
                      .catch(error => {
                        console.error('Error generating question answers:', error);
                        showNotification('AI proposal generated! (Questions could not be filled)', 'success');
                      });
                  } else {
                    console.log('No additional questions detected');
                    showNotification('AI proposal generated and filled!', 'success');
                  }
                });
              }, 5000); // Wait additional 5 seconds
            }, 3000); // Wait 3 seconds after cover letter is filled
          } else {
            console.log('Auto-answer questions is disabled');
            showNotification('AI proposal generated and filled!', 'success');
          }
        });
        
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

Looking forward to working with you!

Thanks,
${freelancerName}`;
      
      fillCoverLetterField(fallbackProposal, 1);
      showNotification('Basic proposal generated (AI unavailable)', 'warning');
      window.__proposalGenerated = true;
      window.__proposalGenerationInProgress = false;
    }
  } else {
    console.log('Job description not ready/invalid. Will retry once shortly.');
    // Allow a single retry after a short delay
    if (!window.__proposalRetryDone) {
      window.__proposalGenerationInProgress = false;
      window.__proposalRetryDone = true;
      setTimeout(() => {
        generateAutoProposal();
      }, 2000);
      return;
    }
    console.log('Retry already attempted. Generating a conservative generic proposal.');
    
    // Generate a generic proposal even without job description
    const genericProposal = `I have over 8 years of experience and I'm really excited about this ${jobTitle} project. I've worked on similar stuff before and I think I can help you out here.

I usually focus on getting things done right the first time and keeping you updated along the way. I'm pretty flexible with timelines and can start whenever you need me.

Looking forward to working with you!

Thanks,
${freelancerName}`;
    
    fillCoverLetterField(genericProposal, 0);
    showNotification('Generic proposal generated (no job description found)', 'warning');
    window.__proposalGenerated = true;
    window.__proposalGenerationInProgress = false;
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
          
          if (coverLetterField && !window.__proposalGenerated && !window.__proposalGenerationInProgress) {
            // Prefer filling from stored cover letter if available to avoid regenerating
            chrome.storage.local.get(['coverLetter'], (res) => {
              if (res && res.coverLetter) {
                fillCoverLetterField(res.coverLetter, 1);
                window.__proposalGenerated = true;
              } else {
                generateAutoProposal();
              }
            });
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
