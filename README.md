# Upwork Cover Letter Generator - React Version

A Chrome extension that automatically generates personalized cover letters for Upwork job applications using AI. This version has been completely converted to React for better maintainability and modern development practices.

## Features

- 🤖 **AI-Powered Generation**: Uses OpenAI's GPT models to generate high-quality cover letters
- 🎯 **Multiple Templates**: Pre-built templates for different job types (Software, Marketing, Design, Data, etc.)
- ⚙️ **Custom Prompts**: Create your own proposal templates
- 🔄 **Auto-Fill**: Automatically fills cover letter forms on Upwork
- 📊 **Usage Tracking**: Track your proposal usage and subscription status
- 💎 **Freemium Model**: Free tier with 50 proposals, Premium for unlimited
- 🎨 **Modern UI**: Beautiful, responsive React-based interface

## Project Structure

```
src/
├── popup/                 # Extension popup (React)
│   ├── index.html
│   ├── index.js
│   ├── Popup.js
│   └── styles.css
├── settings/              # Settings page (React)
│   ├── index.html
│   ├── index.js
│   ├── Settings.js
│   └── styles.css
├── subscription/          # Subscription page (React)
│   ├── index.html
│   ├── index.js
│   ├── Subscription.js
│   └── styles.css
├── background.js          # Service worker
└── content.js            # Content script
public/
├── manifest.json         # Extension manifest
├── upwork.png           # Extension icons
└── icon.svg
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd upwork_extention
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Development Commands

```bash
# Build for production
npm run build

# Build for development
npm run build:dev

# Watch mode for development
npm run dev

# Clean build directory
npm run clean
```

## Configuration

### OpenAI API Setup

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open the extension popup
3. Enter your API key in the settings
4. Choose your preferred model (gpt-3.5-turbo or gpt-4)
5. Adjust creativity level (temperature) as needed

### Custom Templates

You can create custom proposal templates in the Settings page:

1. Go to "Custom Proposal" tab
2. Write your template with placeholders like `[Your Name]`
3. Save your settings

### AI Prompts

The extension includes optimized AI prompts for different job types:

- **Universal**: Works for any job type
- **Software**: For development positions
- **Marketing**: For SEO/marketing roles
- **Design**: For UI/UX positions
- **Data**: For analytics/data science roles
- **Custom**: Your own custom prompts

## How It Works

1. **Job Detection**: The content script detects when you're on an Upwork job posting
2. **Data Extraction**: Extracts job title and description from the page
3. **AI Generation**: Uses OpenAI API to generate a personalized cover letter
4. **Auto-Fill**: Automatically fills the cover letter form when you click "Apply Now"

## Usage

1. Navigate to any Upwork job posting
2. Click the extension icon to open the popup
3. Configure your settings (API key, preferences)
4. Click "Generate Cover Letter" or let auto-fill handle it
5. The extension will automatically fill the cover letter form

## API Integration

The extension integrates with OpenAI's API for cover letter generation. Make sure to:

1. Have a valid OpenAI API key
2. Have sufficient credits in your OpenAI account
3. Use appropriate models based on your needs

## Subscription Model

- **Free Tier**: 50 AI-generated proposals per month
- **Premium Tier**: Unlimited proposals + advanced features
- **Usage Tracking**: Monitor your usage in the subscription page

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the GitHub issues
2. Create a new issue with detailed information
3. Include browser version and extension version

## Changelog

### v1.0.0 (React Version)
- Complete conversion to React
- Modern component-based architecture
- Improved UI/UX with React
- Better state management
- Enhanced error handling
- Responsive design
- Webpack build system

## Migration from Vanilla JS

This version is a complete rewrite of the original vanilla JavaScript extension. Key improvements:

- **React Components**: All UI is now React-based
- **Modern Build System**: Webpack with Babel for transpilation
- **Better State Management**: React hooks for state management
- **Improved Developer Experience**: Hot reloading, better debugging
- **Maintainable Code**: Component-based architecture
- **Type Safety**: Better error handling and validation
The core functionality remains the same, but the codebase is now much more maintainable and extensible.
