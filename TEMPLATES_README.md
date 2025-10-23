# 🚀 AI Templates Configuration

This guide explains how to customize the AI proposal templates in the Upwork Cover Letter Generator extension.

## 📁 Template Files

The templates are stored in a clean, separate file for easy modification:

- **`src/templates/aiTemplates.js`** - Main templates file
- **`src/settings/Settings.js`** - React component that uses the templates

## 🎯 Available Templates

The extension includes 6 pre-built templates:

1. **🌐 Universal** - Works for any job type
2. **💻 Software/Apps Development** - For programming jobs
3. **📈 Marketing/SEO** - For marketing and SEO jobs
4. **🎨 Design/UX** - For design and user experience jobs
5. **📊 Data/Analytics** - For data science and analytics jobs
6. **⚙️ Custom Prompt** - Your own custom template

## ✏️ How to Modify Templates

### Option 1: Through the Extension UI (Recommended)

1. Open the extension popup
2. Click "Advanced Settings & Templates"
3. Go to the "🚀 AI Prompts" tab
4. Select a template from the dropdown
5. Edit the "Meta Prompt" field
6. Click "💾 Save Meta Prompt"

### Option 2: Direct File Editing

1. Open `src/templates/aiTemplates.js`
2. Find the template you want to modify
3. Edit the `metaPrompt` and `template` properties
4. Run `npm run build` to rebuild the extension

## 🔧 Template Structure

Each template has two parts:

```javascript
templateName: {
  metaPrompt: `Rules for the AI to follow when generating proposals...`,
  template: `The actual template structure with placeholders...`
}
```

### Meta Prompt
- Controls the rules the AI follows
- Defines what phrases to avoid
- Sets the structure and style requirements

### Template Body
- The actual proposal template
- Uses placeholders like `[X]`, `[Y]`, `[Z]` for dynamic content
- Should be concise and professional

## 📝 Adding New Templates

To add a new template:

1. Open `src/templates/aiTemplates.js`
2. Add your template to `AI_PROMPTS_TEMPLATES`:

```javascript
yourTemplate: {
  metaPrompt: `Your meta prompt rules...`,
  template: `Your template structure...`
}
```

3. Add metadata to `TEMPLATE_METADATA`:

```javascript
yourTemplate: {
  name: 'Your Template Name',
  description: 'Description of when to use this template',
  icon: '🎯'
}
```

4. Run `npm run build` to rebuild

## 💡 Best Practices

### Meta Prompts
- Keep rules clear and specific
- Ban generic phrases like "I'm excited" or "best regards"
- Include specific tool mentions
- Set line limits (usually 8 lines max)

### Template Bodies
- Start with experience statement
- Include 2 clear steps
- Add 2-3 KPIs (Key Performance Indicators)
- End with one clarifying question
- Use industry-specific terminology

### Example Template Structure
```
I have 8+ years of experience—you need [specific need].
Step 1: [first action] → deliver [result] in [timeframe].
Step 2: [second action] → [final outcome].
KPIs: [metric 1], [metric 2], [metric 3] by [date].
Tools: [relevant tools].
Tiny plan: [one sentence summary]. Next step: I'm available [times].
Question: [one precise clarifying question]?
```

## 🔄 Template Overrides

The extension supports per-template overrides:

- Each template can have its own meta prompt override
- Overrides are stored separately from defaults
- Use the UI to save/load overrides
- Overrides persist across extension updates

## 🚀 Testing Templates

1. Select a template in the settings
2. Click "👁️ Preview Template" to see how it looks
3. Test with real Upwork job postings
4. Adjust the meta prompt if needed

## 📚 Template Examples

### Software Development Template
- Focuses on technical skills and tools
- Mentions Git, Docker, CI/CD
- Emphasizes code quality and testing

### Marketing Template
- Highlights growth metrics and conversions
- Mentions SEO tools like GSC, GA4
- Focuses on measurable results

### Design Template
- Emphasizes user experience and accessibility
- Mentions design tools like Figma
- Focuses on user testing and feedback

## 🛠️ Troubleshooting

### Template Not Loading
- Check the template name in `AI_PROMPTS_TEMPLATES`
- Ensure the template has both `metaPrompt` and `template` properties
- Rebuild the extension with `npm run build`

### Override Not Saving
- Check browser storage permissions
- Ensure you're using the correct template name
- Try refreshing the extension

### Preview Not Working
- Make sure the template is properly formatted
- Check for syntax errors in the template
- Verify the template exists in the templates file

## 📞 Support

If you need help customizing templates:

1. Check the console for error messages
2. Verify your template syntax
3. Test with the preview function
4. Rebuild the extension after changes

Remember: Always run `npm run build` after modifying template files!
