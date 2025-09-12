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

// AI Proposal Prompts Templates
const AI_PROMPTS_TEMPLATES = {
  universal: {
    metaPrompt: `Generate an Upwork proposal. Follow ALL rules:
- Start with: "I have 8+ years of experience—[mirror client need in plain English]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools (swap per job: GSC, GA4, Screaming Frog, Git, Docker, Figma, etc.).
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,
    template: `I have 8+ years of experience—you need [plain-English restatement].  
Step 1: [audit/plan/prototype] → deliver [artifact] in [X days].  
Step 2: [implement/test/iterate] → ship with docs and handoff.  
KPIs: [metric 1], [metric 2], [metric 3] by [date].  
Tools: [role-specific tools].  
Tiny plan: [one sentence on sequence/milestones]. Next step: I'm available [times, TZ].  
Question: [one precise clarifying question]?`
  },
  software: {
    metaPrompt: `Generate an Upwork proposal for software development. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need [feature/app/integration] that [does X]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: Git, GitHub Actions, Docker, AWS/GCP, Postman, Jira.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.`,
    template: `I have 8+ years of experience—you need [feature/app/integration] that [does X].  
Step 1: Define scope, API/DB schema, and tests.  
Step 2: Build, CI/CD, staging review, handoff.  
KPIs: lead time <[X] days, error rate <[Y]%, perf +[Z]%.  
Tools: Git, GitHub Actions, Docker, AWS/GCP, Postman.  
Tiny plan: weekly demo, PR reviews. I can start [date/TZ].  
Question: Any non-functional constraints I must meet first?`
  },
  marketing: {
    metaPrompt: `Generate an Upwork proposal for marketing/SEO. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need growth in [traffic/conversions] from [channels/pages]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: GSC, GA4, Screaming Frog, Ahrefs/Semrush, Looker Studio.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.`,
    template: `I have 8+ years of experience—you need growth in [traffic/conversions] from [channels/pages].  
Step 1: Technical and content audit with quick wins.  
Step 2: Implement fixes, on-page updates, and tracking.  
KPIs: +[X]% clicks, +[Y]% CVR, LCP <[Z]s in [N] weeks.  
Tools: GSC, GA4, Screaming Frog, Ahrefs/Semrush, Looker Studio.  
Tiny plan: prioritize by impact/effort; weekly report. I'm available [times].  
Question: Which pages drive the highest-margin conversions today?`
  },
  design: {
    metaPrompt: `Generate an Upwork proposal for design/UX. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need a [UI/UX/brand] that solves [use case]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: Figma, FigJam, Adobe CC, WCAG, Zeplin.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.`,
    template: `I have 8+ years of experience—you need a [UI/UX/brand] that solves [use case].  
Step 1: Wireframes and component inventory.  
Step 2: High-fidelity design and dev-ready specs.  
KPIs: task success +[X]%, time-on-task −[Y]%, NPS +[Z].  
Tools: Figma, FigJam, Adobe CC, WCAG, Zeplin.  
Tiny plan: tokens, variants, handoff notes. I can start [date].  
Question: What top 3 user tasks should we optimize first?`
  },
  data: {
    metaPrompt: `Generate an Upwork proposal for data/analytics. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need [dashboard/model/pipeline] for [business question]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: SQL, Python, dbt, BigQuery/Snowflake, GA4, Looker Studio.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.`,
    template: `I have 8+ years of experience—you need [dashboard/model/pipeline] for [business question].  
Step 1: Data audit, schema mapping, and validation rules.  
Step 2: Build models, QA, and stakeholder-ready dashboards.  
KPIs: data freshness <[X] hrs, accuracy >[Y]%, time-to-insight −[Z]%.  
Tools: SQL, Python, dbt, BigQuery/Snowflake, GA4, Looker Studio.  
Tiny plan: versioned models, tests, docs. I'm free [times].  
Question: Which decisions will this dashboard support weekly?`
  },
  custom: {
    metaPrompt: `Generate an Upwork proposal. Follow ALL rules:
1. Always start with "I have experience in" and then write whatever the client needs from job post title or job details
2. Make proposal 5-15 lines max
- Use industry-specific terminology and relevant tools
- Include specific skills and approach
- End with a clarifying question
- Avoid generic phrases like "I'm excited," "aligns perfectly," "best regards"
- Keep sentences short and concrete`,
    template: `I have experience in [specific skills from job title/details].  
[Brief approach or process - 2-3 lines]
[Specific outcomes or deliverables - 1-2 lines]
[Relevant tools and technologies - 1 line]
[One clarifying question about the project]`
  }
};

// Default prompt template (fallback)
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
  
  if (request.action === 'generateQuestionAnswers') {
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
        
        // Generate question answers
        generateQuestionAnswers(request.questions, request.jobTitle, request.jobDescription)
          .then(answers => {
            // Track usage after successful generation
            trackUsage();
            console.log('Question answers generated successfully');
            sendResponse({ success: true, answers, usage: userUsage });
          })
          .catch(error => {
            console.error('Error generating question answers:', error);
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        console.error('Error checking usage limits:', error);
        sendResponse({ success: false, error: 'Failed to check usage limits' });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'resetUsage') {
    const reset = { proposalsUsed: 0, subscriptionStatus: 'free', subscriptionExpiry: null, userId: null };
    userUsage = { ...userUsage, ...reset };
    saveUserUsage()
      .then(() => sendResponse({ success: true, usage: userUsage }))
      .catch((err) => sendResponse({ success: false, error: err && err.message ? err.message : String(err) }));
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

// Function to generate cover letter using OpenAI if API key is set, otherwise your backend API
async function generateCoverLetter(jobTitle, jobDescription) {
  try {
    // Load user usage data first
    await loadUserUsage();
    
    // Get user settings from storage
    const settings = await chrome.storage.local.get(['customPrompt', 'yourName', 'quickSettings', 'openaiApiKey', 'openaiModel', 'openaiTemperature', 'proposalMode', 'aiPromptsEnabled', 'promptTemplate', 'customAIPrompt']);
    
    // Decide which prompt to use depending on mode
    const isAIMode = (settings.proposalMode || 'ai') === 'ai';
    let prompt;
    
    // Check if AI prompts are enabled
    if (settings.aiPromptsEnabled !== false && isAIMode) {
      const templateType = settings.promptTemplate || 'universal';
      
      if (templateType === 'custom' && settings.customAIPrompt && settings.customAIPrompt.trim()) {
        // Use custom AI prompt
        prompt = settings.customAIPrompt.trim().replace(/\[Your Name\]/g, settings.yourName || 'Your Name');
      } else if (AI_PROMPTS_TEMPLATES[templateType]) {
        // Use AI prompts template
        const template = AI_PROMPTS_TEMPLATES[templateType];
        // Load per-template meta override from storage
        const overrideKey = `metaPromptOverride_${templateType}`;
        const stored = await chrome.storage.local.get([overrideKey]);
        const metaPrompt = (stored && stored[overrideKey]) ? stored[overrideKey] : template.metaPrompt;
        const templateText = template.template;
        
        // Create the full prompt with job context
        prompt = `${metaPrompt}

Job Title: ${jobTitle}
Job Description: ${jobDescription}

Generate a proposal using this template:
${templateText}

Replace placeholders with specific details from the job. Keep it under 8 lines.`;
      } else {
        // Fallback to default
        prompt = generateCustomPrompt(jobTitle, jobDescription, settings);
      }
    } else {
      // Use custom prompt mode
      prompt = generateCustomPrompt(jobTitle, jobDescription, settings);
    }

    // Validate inputs
    if (!jobTitle || !jobDescription) {
      throw new Error('Missing required information: jobTitle or jobDescription');
    }
    
    // Clean inputs to avoid issues
    const cleanJobTitle = jobTitle.toString().trim();
    const cleanJobDescription = jobDescription.toString().trim();
    
    // Truncate job description to avoid token limit (allow more context now)
    const truncatedJobDescription = cleanJobDescription.length > 4000 
      ? cleanJobDescription.substring(0, 4000) + '...' 
      : cleanJobDescription;
    
    // If AI mode and API key exists, try OpenAI first
    if (isAIMode && settings.openaiApiKey && settings.openaiApiKey.trim()) {
      try {
        const proposalViaOpenAI = await generateWithOpenAI({
          apiKey: settings.openaiApiKey.trim(),
          model: (settings.openaiModel && settings.openaiModel.trim()) || DEFAULT_CONFIG.DEFAULT_MODEL,
          temperature: typeof settings.openaiTemperature === 'number' ? settings.openaiTemperature : DEFAULT_CONFIG.TEMPERATURE,
          jobTitle: cleanJobTitle,
          jobDescription: truncatedJobDescription,
          customPrompt: prompt,
          yourName: settings.yourName || 'Your Name'
        });
        return proposalViaOpenAI;
      } catch (openAiErr) {
        console.warn('OpenAI generation failed, will try backend/local fallback:', openAiErr);
        // fall through to backend/local
      }
    }

    if (!isAIMode) {
      // Directly use local generation with custom prompt
      return generateLocalProposalWithCustomPrompt(cleanJobTitle, truncatedJobDescription, settings, prompt);
    }

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
    // Ensure we have safe title/description even if earlier variables were not set
    const safeTitle = (jobTitle && jobTitle.toString ? jobTitle.toString().trim() : 'Job Application');
    const safeDescFull = (jobDescription && jobDescription.toString ? jobDescription.toString().trim() : '');
    const safeDesc = safeDescFull.length > 2000 ? (safeDescFull.substring(0, 2000) + '...') : safeDescFull;

    // Try to use custom prompt as final fallback
    if (settings.customPrompt) {
      console.log('Using custom prompt as final fallback');
      return generateLocalProposalWithCustomPrompt(safeTitle, safeDesc, settings, settings.customPrompt);
    }
    
    // Ultimate fallback to basic cover letter if no custom prompt
    const signatureName = settings.yourName || 'Your Name';
    return `I have 4 years of experience in SEO and I'm really excited about this ${safeTitle} project. I've worked on similar stuff before and I think I can help you out here.

I usually focus on getting things done right the first time and keeping you updated along the way. I'm pretty flexible with timelines and can start whenever you need me.

`;
  }
}

async function generateWithOpenAI({ apiKey, model, temperature, jobTitle, jobDescription, customPrompt, yourName }) {
  // Optional guidance based on keywords
  const lower = jobDescription.toLowerCase();
  const extraGuidance = [];
  if (/(wordpress|elementor)/.test(lower)) {
    extraGuidance.push('If relevant, include 1 short line with 2–3 portfolio links (placeholders allowed).');
  }
  const optionalGuidance = extraGuidance.length ? `\n- ${extraGuidance.join('\n- ')}` : '';

  const systemMessage = 'You are an expert Upwork freelancer. Write proposals that are specific to the job description, professional, outcome-focused, and easy to skim. Prefer a short narrative intro, bullets mapping experience to requirements, a brief plan, and 1–2 clarifying questions. Avoid fluff and generic claims.';
  const userMessage = `Write a tailored Upwork proposal for this job.\n\nJOB TITLE:\n${jobTitle}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nSTYLE/TONE (optional):\n${customPrompt || '(no custom style provided)'}\n\nREQUIREMENTS:\n- Start with a concise 1–2 sentence narrative that mirrors the client goal/phrases.\n- Include 3–5 bullets mapping my experience to SPECIFIC requirements/keywords from the description. Quote short phrases if helpful.\n- Add a short plan (3–4 steps) for how I will deliver.\n- Ask 1–2 clarifying questions that matter to delivery.\n- Length: 220–340 words.\n- Sign off as ${yourName}.${optionalGuidance}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: temperature,
      max_tokens: DEFAULT_CONFIG.MAX_TOKENS
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }
  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : '';
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }
  return content.trim();
}

// Function to generate answers for additional questions
async function generateQuestionAnswers(questions, jobTitle, jobDescription) {
  try {
    // Load user settings
    const settings = await chrome.storage.local.get(['yourName', 'openaiApiKey', 'openaiModel', 'openaiTemperature']);
    
    // Create a prompt for all questions
    const questionsText = questions.map((q, index) => `${index + 1}. ${q.label} (${q.type === 'textarea' ? 'Long answer' : 'Short answer'})`).join('\n');
    
    const systemMessage = `You are an expert Upwork freelancer with extensive technical knowledge. Answer application questions professionally, specifically, and technically based on the job requirements. Provide detailed, accurate technical answers that demonstrate expertise.`;
    
    const userMessage = `Based on this Upwork job, provide professional and technical answers to these application questions:

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

QUESTIONS TO ANSWER:
${questionsText}

INSTRUCTIONS:
- Answer each question with specific technical details and expertise
- Show deep knowledge of the technologies mentioned
- Provide practical examples and solutions
- Be professional but demonstrate technical competence
- For technical questions: Give detailed, accurate answers
- For experience questions: Show relevant expertise
- For approach questions: Explain your methodology
- Use the freelancer name: ${settings.yourName || 'Your Name'}

IMPORTANT: Answer each question completely and technically. Do not give generic responses like "I have experience in this area." Instead, provide specific, detailed technical answers that showcase your expertise.

Provide answers in the same order as the questions, one per line, separated by "---ANSWER---".`;

    // Try OpenAI first if API key is available
    if (settings.openaiApiKey && settings.openaiApiKey.trim()) {
      console.log('Using ChatGPT for question answers...');
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.openaiApiKey.trim()}`
          },
          body: JSON.stringify({
            model: (settings.openaiModel && settings.openaiModel.trim()) || DEFAULT_CONFIG.DEFAULT_MODEL,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userMessage }
            ],
            temperature: typeof settings.openaiTemperature === 'number' ? settings.openaiTemperature : DEFAULT_CONFIG.TEMPERATURE,
            max_tokens: 2000 // Increased token limit for better answers
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content && content.trim().length > 0) {
            console.log('ChatGPT question answers generated successfully');
            console.log('ChatGPT response:', content);
            return parseQuestionAnswers(content, questions.length);
          } else {
            console.warn('ChatGPT returned empty content');
          }
        } else {
          console.warn('ChatGPT API error:', response.status, response.statusText);
          const errorData = await response.text();
          console.warn('ChatGPT error details:', errorData);
        }
      } catch (error) {
        console.warn('ChatGPT generation failed:', error);
      }
    } else {
      console.warn('No ChatGPT API key found, using fallback');
      console.log('To use ChatGPT for question answers, please set your OpenAI API key in the extension settings.');
    }
    
    // Fallback to backend API
    try {
      const response = await fetch(`${DEFAULT_CONFIG.API_BASE_URL}/generate-question-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userUsage.userId || 'anonymous'}`
        },
        body: JSON.stringify({
          questions: questions,
          jobTitle: jobTitle,
          jobDescription: jobDescription,
          userId: userUsage.userId,
          subscriptionStatus: userUsage.subscriptionStatus
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.answers) {
          return data.answers;
        }
      }
    } catch (error) {
      console.warn('Backend API failed, using local generation:', error);
    }
    
    // Local fallback - generate basic answers
    return generateLocalQuestionAnswers(questions, jobTitle, jobDescription, settings);
    
  } catch (error) {
    console.error('Error generating question answers:', error);
    const settings = await chrome.storage.local.get(['yourName']);
    return generateLocalQuestionAnswers(questions, jobTitle, jobDescription, settings);
  }
}

// Parse answers from OpenAI response
function parseQuestionAnswers(content, expectedCount) {
  console.log('Parsing ChatGPT response:', content);
  
  // Try different separators that ChatGPT might use
  let answers = [];
  
  if (content.includes('---ANSWER---')) {
    answers = content.split('---ANSWER---').map(answer => answer.trim()).filter(answer => answer.length > 0);
  } else if (content.includes('ANSWER:')) {
    answers = content.split('ANSWER:').map(answer => answer.trim()).filter(answer => answer.length > 0);
  } else if (content.includes('\n\n')) {
    // Try splitting by double newlines
    answers = content.split('\n\n').map(answer => answer.trim()).filter(answer => answer.length > 0);
  } else {
    // Fallback: split by numbered items
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    answers = lines.filter(line => /^\d+\./.test(line.trim())).map(line => line.replace(/^\d+\.\s*/, '').trim());
  }
  
  console.log('Parsed answers:', answers);
  
  // Ensure we have the right number of answers
  while (answers.length < expectedCount) {
    answers.push('I have relevant experience in this area and can help with this project.');
  }
  
  return answers.slice(0, expectedCount);
}

// Generate basic answers locally as fallback
function generateLocalQuestionAnswers(questions, jobTitle, jobDescription, settings) {
  const answers = [];
  const freelancerName = settings.yourName || 'Your Name';
  
  questions.forEach(question => {
    const label = question.label.toLowerCase();
    
    // WordPress/Web Development specific answers
    if (label.includes('wordpress') || label.includes('custom post type') || label.includes('cpt') || label.includes('real estate')) {
      answers.push(`For WordPress real estate listings, I would create a Custom Post Type called 'Property' with custom fields like 'price', 'bedrooms', 'bathrooms', 'square_feet', 'address', and 'property_images'. I'd use taxonomies like 'property_type' (house, condo, apartment) and 'location' (city, neighborhood). This structure allows for easy filtering, searching, and management of listings.`);
    } else if (label.includes('container queries') || label.includes('css') || label.includes('responsive') || label.includes('components')) {
      answers.push(`Container Queries solve the problem of component-based responsive design by allowing elements to respond to their container's size rather than just the viewport. This is a game-changer because it enables truly reusable components that adapt to their context, making design systems more flexible and maintainable.`);
    } else if (label.includes('experience') || label.includes('background')) {
      answers.push(`I have extensive experience in ${extractFieldFromDescription(jobDescription)} and have successfully completed similar projects. I'm confident I can deliver excellent results for this ${jobTitle} project.`);
    } else if (label.includes('approach') || label.includes('method')) {
      answers.push(`My approach involves understanding your specific requirements, creating a detailed plan, and implementing the solution with regular updates and communication throughout the project.`);
    } else if (label.includes('timeline') || label.includes('schedule') || label.includes('when')) {
      answers.push(`I can start immediately and typically complete similar projects within 1-2 weeks, depending on the specific requirements. I'll provide a detailed timeline once I understand the full scope.`);
    } else if (label.includes('portfolio') || label.includes('examples') || label.includes('work')) {
      answers.push(`I have a strong portfolio of similar projects and can provide examples upon request. My previous work demonstrates my expertise in this area.`);
    } else if (label.includes('why') || label.includes('choose') || label.includes('hire')) {
      answers.push(`I'm the right fit for this project because of my relevant experience, attention to detail, and commitment to delivering high-quality work on time. I'm dedicated to your success.`);
    } else if (label.includes('budget') || label.includes('cost') || label.includes('price')) {
      answers.push(`I'm happy to discuss the budget based on the specific requirements. I offer competitive rates and excellent value for the quality of work provided.`);
    } else if (label.includes('communication') || label.includes('contact') || label.includes('update')) {
      answers.push(`I maintain clear and regular communication throughout the project, providing updates on progress and being available to answer questions promptly.`);
    } else {
      // Generic answer for any other question
      answers.push(`I have relevant experience and skills for this ${jobTitle} project. I'm confident I can help you achieve your goals and deliver excellent results.`);
    }
  });
  
  return answers;
}
