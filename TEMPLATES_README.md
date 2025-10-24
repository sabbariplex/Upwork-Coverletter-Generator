# 🚀 Dynamic AI Templates Configuration

This guide explains how the new dynamic AI proposal template system works in the Upwork Cover Letter Generator extension.

## 🎯 How It Works

The extension now generates templates **dynamically** using GPT based on meta prompts, rather than using predefined static templates. This provides much more flexibility and customization.

### Key Features:
- **Dynamic Generation**: Templates are generated on-demand using GPT
- **Meta Prompt Driven**: Templates are created based on your meta prompt rules
- **Caching**: Generated templates are cached to avoid unnecessary API calls
- **Server API Key**: Uses your server-provided OpenAI API key
- **Real-time Preview**: Generate and preview templates instantly

## 📁 Template Files

The template system has been restructured:

- **`src/background.js`** - Contains the dynamic template generation logic
- **`src/templates/aiTemplates.js`** - Contains template metadata and default meta prompts
- **`src/settings/Settings.js`** - React component for template management

## 🎯 Available Template Types

The extension includes 6 template types with default meta prompts:

1. **🌐 Universal** - Works for any job type
2. **💻 Software/Apps Development** - For programming jobs
3. **📈 Marketing/SEO** - For marketing and SEO jobs
4. **🎨 Design/UX** - For design and user experience jobs
5. **📊 Data/Analytics** - For data science and analytics jobs
6. **⚙️ Custom Prompt** - Your own custom template

## ✏️ How to Use Dynamic Templates

### Step 1: Select Template Type
1. Open the extension popup
2. Click "Advanced Settings & Templates"
3. Go to the "🚀 AI Prompts" tab
4. Select a template type from the dropdown

### Step 2: Customize Meta Prompt (Optional)
1. Edit the "Meta Prompt" field to customize the rules
2. Click "💾 Save Meta Prompt" to save your changes
3. Click "🔄 Reset Meta Prompt" to restore defaults

### Step 3: Generate Template
1. Click "Generate Template" to create a template based on your meta prompt
2. The system will use GPT to generate a specific template structure
3. Generated templates are cached for performance

### Step 4: Preview Template
1. Click "Preview Template" to see the generated template
2. The preview shows both the meta prompt and generated template

## 🔧 Template Generation Process

When you click "Generate Template":

1. **Authentication Check**: Verifies you're logged in
2. **API Key Retrieval**: Gets your OpenAI API key from the server
3. **GPT Call**: Sends meta prompt to GPT to generate template
4. **Caching**: Stores generated template for future use
5. **Display**: Shows the generated template in the preview

## 📝 Meta Prompt Guidelines

### Effective Meta Prompts Should:
- Define the proposal structure and format
- Specify what phrases to avoid
- Include industry-specific requirements
- Set line limits and style guidelines
- Mention relevant tools and technologies

### Example Meta Prompt:
```
Generate an Upwork proposal. Follow ALL rules:
- Start with: "I have 8+ years of experience—[mirror client need in plain English]."
- Use 2 steps only; add 2–3 KPIs; end with exactly one clarifying question.
- Mention relevant tools (swap per job: GSC, GA4, Screaming Frog, Git, Docker, Figma, etc.).
- Short sentences. Max 8 lines. No bullets. No exclamation points.
- Ban phrases: "I am thrilled/excited," "aligns perfectly," "extensive experience," "I can confidently," "looking forward," "best regards."
- Include a tiny plan and a next step with availability.
- Prefer verbs and outcomes over adjectives. Use industry terminology.
```

## 🚀 Benefits of Dynamic Templates

### Compared to Static Templates:
- **More Flexible**: Templates adapt to your specific meta prompt rules
- **Always Fresh**: No need to manually update template structures
- **Consistent**: Templates always follow your exact guidelines
- **Efficient**: Caching prevents unnecessary API calls
- **Customizable**: Easy to modify meta prompts for different use cases

## 🔄 Template Caching

Generated templates are automatically cached to improve performance:
- **Cache Key**: Based on meta prompt content
- **Cache Duration**: Until extension restart
- **Cache Benefits**: Faster template generation, reduced API costs

## 💡 Best Practices

### Meta Prompt Design:
1. **Be Specific**: Include exact formatting requirements
2. **Set Boundaries**: Define what to avoid (generic phrases, etc.)
3. **Industry Focus**: Mention relevant tools and terminology
4. **Length Limits**: Specify maximum lines or characters
5. **Structure**: Define the proposal flow and components

### Template Usage:
1. **Test First**: Generate and preview templates before using
2. **Customize Meta Prompts**: Adjust rules for different job types
3. **Save Overrides**: Use the save feature for custom meta prompts
4. **Reset When Needed**: Use reset to restore default meta prompts

## 🛠️ Technical Details

### API Integration:
- Uses OpenAI GPT models (configurable)
- Server-provided API keys for security
- Automatic authentication and token verification
- Error handling and fallback mechanisms

### Performance:
- Template caching reduces API calls
- Async processing for smooth UI
- Background script handles API communication
- Real-time status updates and error messages

## 📚 Migration from Static Templates

The old static template system has been completely replaced:
- ✅ All predefined templates removed
- ✅ Dynamic generation implemented
- ✅ Meta prompt system enhanced
- ✅ Caching system added
- ✅ UI updated for new workflow

Your existing meta prompt overrides will continue to work with the new system.

## 🚀 Getting Started

1. **Login**: Make sure you're authenticated
2. **Select Template**: Choose a template type
3. **Customize**: Edit the meta prompt if needed
4. **Generate**: Click "Generate Template"
5. **Preview**: Review the generated template
6. **Use**: The template will be used for proposal generation

The system is now fully dynamic and will generate templates based on your meta prompts using GPT!