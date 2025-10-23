// AI Proposal Templates for Upwork Cover Letter Generator
// This file contains all the AI prompt templates and can be easily modified by users

export const AI_PROMPTS_TEMPLATES = {
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
Question: [one precise clarifying question]?

Best regards,
[Your Name]`
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
Question: Any non-functional constraints I must meet first?

Best regards,
[Your Name]`
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
Question: Which pages drive the highest-margin conversions today?

Best regards,
[Your Name]`
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
Question: What top 3 user tasks should we optimize first?

Best regards,
[Your Name]`
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
Question: Which decisions will this dashboard support weekly?

Best regards,
[Your Name]`
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
[One clarifying question about the project]

Best regards,
[Your Name]`
  }
};

// Template metadata for UI display
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

// Helper functions
export const getTemplateOptions = () => {
  return Object.keys(AI_PROMPTS_TEMPLATES).map(key => ({
    value: key,
    label: TEMPLATE_METADATA[key]?.name || key,
    description: TEMPLATE_METADATA[key]?.description || '',
    icon: TEMPLATE_METADATA[key]?.icon || '📝'
  }));
};

export const getTemplate = (templateType) => {
  return AI_PROMPTS_TEMPLATES[templateType] || AI_PROMPTS_TEMPLATES.universal;
};

export const getTemplateMetadata = (templateType) => {
  return TEMPLATE_METADATA[templateType] || TEMPLATE_METADATA.universal;
};

// Storage key helper for meta prompt overrides
export const getMetaPromptStorageKey = (templateType) => {
  return `metaPromptOverride_${templateType}`;
};

export default AI_PROMPTS_TEMPLATES;
