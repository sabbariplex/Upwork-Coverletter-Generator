// Dynamic AI Proposal Templates for Upwork Cover Letter Generator
// This file now supports dynamic template generation based on meta prompts

// Template metadata for UI display (keeping the same structure for compatibility)
export const TEMPLATE_METADATA = {
  universal: {
    name: 'Universal',
    description: 'Works for any job type',
    icon: '🌐'
  },
  software: {
    name: 'Software/Apps Development',
    description: 'For programming and development jobs',
    icon: '💻'
  },
  marketing: {
    name: 'Marketing/SEO',
    description: 'For marketing and SEO jobs',
    icon: '📈'
  },
  design: {
    name: 'Design/UX',
    description: 'For design and user experience jobs',
    icon: '🎨'
  },
  data: {
    name: 'Data/Analytics',
    description: 'For data science and analytics jobs',
    icon: '📊'
  },
  custom: {
    name: 'Custom Prompt',
    description: 'Your own custom template',
    icon: '⚙️'
  }
};

// Default meta prompts for each template type
export const DEFAULT_META_PROMPTS = {
  universal: `Generate an Upwork proposal. Follow ALL rules:
- Start with: "I have 8+ years of experience—[mirror client need in plain English]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools (swap per job: GSC, GA4, Screaming Frog, Git, Docker, Figma, etc.).
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,

  software: `Generate an Upwork proposal for software development. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need [feature/app/integration] that [does X]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: Git, GitHub Actions, Docker, AWS/GCP, Postman, Jira.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,

  marketing: `Generate an Upwork proposal for marketing/SEO. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need growth in [traffic/conversions] from [channels/pages]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: GSC, GA4, Screaming Frog, Ahrefs/Semrush, Looker Studio.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,

  design: `Generate an Upwork proposal for design/UX. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need a [UI/UX/brand] that solves [use case]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: Figma, FigJam, Adobe CC, WCAG, Zeplin.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,

  data: `Generate an Upwork proposal for data/analytics. Follow ALL rules:
- Start with: "I have 8+ years of experience—you need [dashboard/model/pipeline] for [business question]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools: SQL, Python, dbt, BigQuery/Snowflake, GA4, Looker Studio.
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.`,

  custom: `Generate an Upwork proposal. Follow ALL rules:
1. Always start with "I have experience in" and then write whatever the client needs from job post title or job details
2. Make proposal 5-15 lines max
- Use industry-specific terminology and relevant tools
- Include specific skills and approach
- End with a clarifying question
- Avoid generic phrases like "I'm excited," "aligns perfectly," "best regards"
- Keep sentences short and concrete`
};

// Helper functions
export const getTemplateOptions = () => {
  return Object.keys(TEMPLATE_METADATA).map(key => ({
    value: key,
    label: TEMPLATE_METADATA[key]?.name || key,
    description: TEMPLATE_METADATA[key]?.description || '',
    icon: TEMPLATE_METADATA[key]?.icon || '📝'
  }));
};

export const getTemplateMetadata = (templateType) => {
  return TEMPLATE_METADATA[templateType] || TEMPLATE_METADATA.universal;
};

// Get default meta prompt for a template type
export const getDefaultMetaPrompt = (templateType) => {
  return DEFAULT_META_PROMPTS[templateType] || DEFAULT_META_PROMPTS.universal;
};

// Storage key helper for meta prompt overrides
export const getMetaPromptStorageKey = (templateType) => {
  return `metaPromptOverride_${templateType}`;
};

// Legacy compatibility - these functions now work with dynamic templates
export const getTemplate = (templateType) => {
  // Return a mock template object for compatibility
  return {
    metaPrompt: getDefaultMetaPrompt(templateType),
    template: '[Dynamic template will be generated]'
  };
};

// Export for backward compatibility
export const AI_PROMPTS_TEMPLATES = {};