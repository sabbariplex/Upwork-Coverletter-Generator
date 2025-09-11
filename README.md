# Upwork Cover Letter Generator Chrome Extension

A Chrome extension that automatically generates personalized cover letters for Upwork job applications based on job descriptions.

## Features

- **Automatic Job Description Reading**: Extracts job details from Upwork job postings
- **AI-Powered Cover Letter Generation**: Creates personalized cover letters using OpenAI's GPT models
- **Auto-fill Functionality**: Automatically fills cover letter fields in application forms
- **Customizable Settings**: Toggle auto-fill and notifications
- **Real-time Notifications**: Shows status updates and success messages
- **Advanced Customization**: 
  - Personal profile management (name, experience, skills, specialization)
  - **Custom Prompt Templates** - Write your own AI prompts with placeholders
  - **Flexible Proposal Generation** - No hardcoded instructions, pure job-based generation
  - Custom proposal templates with placeholders
  - Import/Export settings for backup and sharing
  - No API key configuration required - works out of the box!

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

## Usage

### Basic Usage
1. Navigate to any Upwork job posting
2. Click the "Apply Now" button
3. The extension will automatically:
   - Extract the job description
   - Generate a personalized cover letter
   - Fill the cover letter field in the application form
4. Review and submit your application

### Advanced Customization
1. Click the extension icon in your browser toolbar
2. Click "Advanced Settings & Templates" to open the full settings page
3. Configure your personal profile (name, experience, skills, specialization)
4. **Create Custom Prompts** - Write your own AI prompt templates with placeholders
5. Use placeholders like `{jobTitle}`, `{jobDescription}`, `{freelancerName}`, `{yearsExperience}`, etc.
6. Preview your prompts with sample data before saving
7. Import/Export your settings for backup or sharing with team members

**Note:** All customization options are available through the "Advanced Settings & Templates" button - no separate settings button needed!

## How It Works

The extension uses content scripts to:
- Monitor Upwork job pages for job descriptions
- Detect "Apply Now" button clicks
- Extract key information like job title, requirements, and skills
- Generate a personalized cover letter using AI-like logic
- Automatically fill cover letter fields in application forms

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Main content script for job page interaction
- `background.js` - Background service worker
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `README.md` - This file

## Customization

You can customize the cover letter generation by modifying the `generateCoverLetter` function in `content.js`. The extension currently uses a template-based approach, but you can integrate with AI APIs for more sophisticated generation.

## Privacy

This extension only works on Upwork.com and doesn't collect or store any personal data. All processing happens locally in your browser.

## Troubleshooting

- Make sure you're on an Upwork job posting page
- Check that the extension is enabled in Chrome
- Try refreshing the page if the "Apply Now" button isn't detected
- Check the browser console for any error messages

## Future Enhancements

- Integration with AI APIs for better cover letter generation
- Multiple cover letter templates
- Custom user preferences
- Analytics and performance tracking
- Support for other freelancing platforms

## License

This project is open source and available under the MIT License.
