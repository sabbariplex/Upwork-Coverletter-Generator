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
      } else if (targetTab === 'ai-prompts') {
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

  // Profile save
  const saveProfileBtn = document.getElementById('save-profile');
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
  
  // AI Prompts functionality
  const previewTemplateBtn = document.getElementById('preview-template');
  if (previewTemplateBtn) previewTemplateBtn.addEventListener('click', previewTemplate);
  
  const promptTemplateSelect = document.getElementById('prompt-template');
  if (promptTemplateSelect) promptTemplateSelect.addEventListener('change', (e) => {
    handleTemplateChange();
    loadMetaPromptForSelected();
    const value = e.target && e.target.value ? e.target.value : 'universal';
    // Persist template and ensure AI mode is active when changing templates
    chrome.storage.local.set({ promptTemplate: value, proposalMode: 'ai' }, () => {
      console.log('Saved promptTemplate:', value);
    });
  });

  // Meta Prompt editor
  const saveMetaBtn = document.getElementById('save-meta-prompt');
  if (saveMetaBtn) saveMetaBtn.addEventListener('click', saveMetaPromptOverride);
  const resetMetaBtn = document.getElementById('reset-meta-prompt');
  if (resetMetaBtn) resetMetaBtn.addEventListener('click', resetMetaPromptOverride);
  
  // Custom AI Prompt field
  const customAIPromptField = document.getElementById('custom-ai-prompt');
  if (customAIPromptField) {
    customAIPromptField.addEventListener('input', saveCustomAIPrompt);
  }
  
  // Question Settings functionality
  const autoAnswerQuestionsCheckbox = document.getElementById('auto-answer-questions');
  if (autoAnswerQuestionsCheckbox) {
    autoAnswerQuestionsCheckbox.addEventListener('change', saveQuestionSettings);
  }
  
  const saveQuestionSettingsBtn = document.getElementById('save-question-settings');
  if (saveQuestionSettingsBtn) {
    saveQuestionSettingsBtn.addEventListener('click', saveQuestionSettings);
  }
}

function loadAllSettings() {
  chrome.storage.local.get(['customPrompt', 'yourName', 'quickSettings', 'proposalMode', 'promptTemplate', 'autoAnswerQuestions'], function(result) {
    console.log('Loading settings:', result);
    
    // Your name
    const nameInput = document.getElementById('your-name');
    if (nameInput) nameInput.value = result.yourName || '';

    // Custom prompt
    const customPrompt = result.customPrompt || getDefaultPrompt();
    document.getElementById('custom-prompt').value = customPrompt;
    
    console.log('Custom prompt loaded:', customPrompt.substring(0, 100) + '...');

    // Load AI Prompts settings
    loadAIPromptsSettings();
    
    // Load Question Settings
    loadQuestionSettings();
    loadMetaPromptForSelected();
    
    // Activate tab by saved mode (custom uses proposal prompt; ai uses AI Prompts tab)
    const mode = result.proposalMode || 'ai';
    const toActivate = mode === 'custom' ? 'custom-instructions' : 'ai-prompts';
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


// AI Prompts Templates (same as in background.js)
const AI_PROMPTS_TEMPLATES = {
  universal: {
    metaPrompt: `Generate an Upwork proposal. Follow ALL rules:
- Start with: "I have 8+ years of experience—[mirror client need in plain English]."
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

// AI Prompts Functions

function previewTemplate() {
  const templateType = document.getElementById('prompt-template').value;
  const previewDiv = document.getElementById('template-preview');
  const contentDiv = document.getElementById('template-content');
  
  if (templateType === 'custom') {
    const customPrompt = document.getElementById('custom-ai-prompt').value.trim();
    if (customPrompt) {
      contentDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px;">${customPrompt}</pre>`;
    } else {
      contentDiv.innerHTML = '<p style="color: #666; font-style: italic;">No custom prompt entered yet.</p>';
    }
  } else if (AI_PROMPTS_TEMPLATES[templateType]) {
    const template = AI_PROMPTS_TEMPLATES[templateType];
    contentDiv.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h5>Meta Prompt:</h5>
        <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px;">${template.metaPrompt}</pre>
      </div>
      <div>
        <h5>Template:</h5>
        <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px;">${template.template}</pre>
      </div>
    `;
  }
  
  previewDiv.style.display = 'block';
}

function handleTemplateChange() {
  const templateType = document.getElementById('prompt-template').value;
  const customSection = document.getElementById('custom-prompt-section');
  
  if (templateType === 'custom') {
    customSection.style.display = 'none'; // Hide Custom AI Prompt textarea for Custom template since Meta Prompt is available
  } else {
    customSection.style.display = 'none'; // Hide for other templates
  }
}

// Load AI Prompts settings
function loadAIPromptsSettings() {
  chrome.storage.local.get(['promptTemplate', 'customAIPrompt'], function(result) {
    if (result.promptTemplate) {
      document.getElementById('prompt-template').value = result.promptTemplate;
    }
    
    // Load custom AI prompt if it exists
    if (result.customAIPrompt) {
      document.getElementById('custom-ai-prompt').value = result.customAIPrompt;
    }
    
    // Handle initial template change
    handleTemplateChange();
  });
}


// Meta Prompt override storage keys are namespaced by template type
function metaPromptStorageKey(templateType) {
  return `metaPromptOverride_${templateType}`;
}

function loadMetaPromptForSelected() {
  const templateType = document.getElementById('prompt-template') ? document.getElementById('prompt-template').value : 'universal';
  const editor = document.getElementById('meta-prompt-editor');
  if (!editor) return;

  const key = metaPromptStorageKey(templateType);
  const defaults = AI_PROMPTS_TEMPLATES[templateType] ? AI_PROMPTS_TEMPLATES[templateType].metaPrompt : '';
  chrome.storage.local.get([key], function(result) {
    editor.value = result[key] || defaults || '';
  });
}

function saveMetaPromptOverride() {
  const templateType = document.getElementById('prompt-template').value;
  const editor = document.getElementById('meta-prompt-editor');
  const value = (editor.value || '').trim();
  const key = metaPromptStorageKey(templateType);
  chrome.storage.local.set({ [key]: value }, function() {
    if (chrome.runtime.lastError) {
      showStatusMessage('Error saving Meta Prompt: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatusMessage('Meta Prompt saved for ' + templateType, 'success');
    }
  });
}

function resetMetaPromptOverride() {
  const templateType = document.getElementById('prompt-template').value;
  const key = metaPromptStorageKey(templateType);
  chrome.storage.local.remove(key, function() {
    loadMetaPromptForSelected();
    showStatusMessage('Meta Prompt reset to default for ' + templateType, 'success');
  });
}

function saveCustomAIPrompt() {
  const customAIPrompt = document.getElementById('custom-ai-prompt').value.trim();
  chrome.storage.local.set({ customAIPrompt }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving custom AI prompt:', chrome.runtime.lastError);
    } else {
      console.log('Custom AI prompt saved successfully');
    }
  });
}

// Question Settings Functions
function loadQuestionSettings() {
  chrome.storage.local.get(['autoAnswerQuestions'], function(result) {
    const autoAnswerQuestionsCheckbox = document.getElementById('auto-answer-questions');
    if (autoAnswerQuestionsCheckbox) {
      // Default to false (disabled) if not set
      autoAnswerQuestionsCheckbox.checked = result.autoAnswerQuestions === true;
    }
  });
}

function saveQuestionSettings() {
  const autoAnswerQuestionsCheckbox = document.getElementById('auto-answer-questions');
  const autoAnswerQuestions = autoAnswerQuestionsCheckbox ? autoAnswerQuestionsCheckbox.checked : false;
  
  chrome.storage.local.set({ autoAnswerQuestions }, function() {
    if (chrome.runtime.lastError) {
      showStatusMessage('Error saving question settings: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatusMessage('Question settings saved successfully!', 'success');
    }
  });
}


