# Upwork Cover Letter Generator (Chrome Extension)

Generate tailored Upwork proposals from real job pages. Auto-detects job data, creates an AI proposal, fills the cover letter, and can optionally answer additional application questions.

## Features

- **One-click apply assist**: Intercepts the Apply button, extracts job title/description, generates a proposal, and fills the cover letter.
- **AI engine options**:
  - OpenAI API (optional; uses your key and model)
  - Your backend API (`/api/generate-proposal`) if configured
  - Local fallback generation (uses your custom prompt/settings)
- **Proposal modes**:
  - **AI Prompts**: Use optimized templates with editable Meta Prompts per role (universal, software, marketing, design, data, custom).
  - **Custom Proposal**: A full freeform prompt you control end-to-end. Includes `[Your Name]` placeholder replacement.
- **Auto-answer additional questions**: Detects and fills job form questions using AI (optional).
- **Freemium model (local state)**:
  - Free: 50 proposals
  - Premium: unlimited (UI + local storage only; payment flow placeholder)
- **Popup controls**: Quick toggles for auto-fill, notifications, auto-answer; inline OpenAI model/config save.
- **Settings UI**:
  - Profile (`yourName`)
  - Custom Proposal editor
  - AI Prompts: template selector, per-template Meta Prompt override, preview, optional custom AI prompt
  - Question settings: enable/disable auto-answer
- **Subscription UI**: Plan status, usage, progress bar, Upgrade button (demo placeholder).

## Installation

1. Download/clone this repo.
2. Open Chrome → `chrome://extensions/`.
3. Enable Developer mode.
4. Click “Load unpacked” and select this folder.
5. Pin the extension.

## Quick Start

1. Open an Upwork job page.
2. Click “Apply”.
3. The extension:
   - waits for the page to be ready,
   - extracts job title/description,
   - generates a proposal (OpenAI → Backend → Local fallback),
   - fills the cover letter,
   - optionally answers additional questions (if enabled).
4. Review, tweak, and submit.

## Configuration

- Open the popup for quick toggles and (optionally) save OpenAI settings.
- Open the full settings via:
  - Popup → “Advanced Settings & Templates”, or
  - `chrome-extension://<id>/settings.html`.

### OpenAI (optional)
- Stored in `chrome.storage.local`:
  - `openaiApiKey`, `openaiModel` (default `gpt-3.5-turbo`), `openaiTemperature` (default `0.7`).
- Used first when Proposal Mode is AI and a key is present.

### Backend API (optional)
- Update `API_BASE_URL` in `background.js` (`DEFAULT_CONFIG`) to your deployed URL (default `http://localhost:3000/api`).
- Expected endpoints:
  - `POST /generate-proposal`: `{ jobTitle, jobDescription, customPrompt, userId, subscriptionStatus }`
  - `POST /track-usage`: `{ userId, proposalsUsed, timestamp }`
  - `POST /generate-question-answers`: `{ questions, jobTitle, jobDescription, userId, subscriptionStatus }`
- Backend calls include `Authorization: Bearer <userId || 'anonymous'>` from local usage state.

### Freemium logic (local)
- `FREE_PROPOSAL_LIMIT = 50` (free); premium = unlimited.
- Usage state is persisted in `chrome.storage.local.userUsage`.
- Subscription “upgrade” UI is a demo only; no live payment integration.

## How It Works

- `content.js`
  - Page readiness waits; extracts job title/description using resilient selectors and fallbacks.
  - Intercepts Apply button click, triggers generation, fills cover letter via multiple attempts.
  - Optionally detects/answers additional textarea questions with retries.
  - Emits small in-page notifications for status/errors.

- `background.js`
  - Tracks usage/subscription (local storage).
  - Builds the final prompt:
    - AI Prompts mode: template + per-template Meta Prompt override, job context appended,
    - Custom Proposal mode: your freeform template.
  - Generation order:
    1) OpenAI (if key present and AI mode)
    2) Backend API
    3) Local fallback (uses prompt and simple extraction helpers)
  - Also supports generating answers for additional questions.

- `popup.js`
  - Toggles: auto-fill, notifications, auto-answer.
  - OpenAI config save.
  - “Generate” tries to trigger generation in the current Upwork tab.
  - Shows usage/proposal counts and status.

- `settings.html` + `settings.js`
  - Tabs: Profile, Custom Proposal, AI Prompts, Question Settings.
  - Custom Proposal: save/reset your full prompt (with `[Your Name]` placeholder).
  - AI Prompts: universal/software/marketing/design/data/custom templates, Meta Prompt editor per template, preview.
  - Auto-answer questions setting.

- `subscription.html` + `subscription.js`
  - Displays plan/usage; Upgrade button shows demo flow.
  - Local demo helpers for upgrade/reset are available when hosted on `localhost`.

## Permissions

From `manifest.json` (MV3):
- `activeTab`: interact with the current tab.
- `storage`: persist settings/usage.
- `scripting`: inject/execute content logic if needed.
- `host_permissions`: `https://www.upwork.com/*` (content script runs on Upwork).

## File Structure

- `manifest.json` — Extension config (MV3).
- `background.js` — Service worker: usage, prompts, OpenAI/backend/local generation.
- `content.js` — Job extraction, Apply-button interception, filling cover letter and questions.
- `popup.html` / `popup.js` — Quick controls and usage.
- `settings.html` / `settings.js` — Full settings UI.
- `subscription.html` / `subscription.js` — Subscription UI (demo).
- `icon.svg` — Extension icon.
- `README.md` — This file.

## Settings Reference

- Proposal Mode: `proposalMode` = `ai` | `custom`
- AI Prompts:
  - `promptTemplate` = `universal` | `software` | `marketing` | `design` | `data` | `custom`
  - Per-template meta override: `metaPromptOverride_<template>`
  - `customAIPrompt` (optional for `custom`)
- Custom Proposal:
  - `customPrompt` (freeform; `[Your Name]` replaced)
  - `yourName`
- Questions:
  - `autoAnswerQuestions` = boolean
- Popup toggles:
  - `autoFill`, `notifications`, `autoAnswerQuestions`
- OpenAI:
  - `openaiApiKey`, `openaiModel`, `openaiTemperature`

## Troubleshooting

- Ensure you’re on a full Upwork job page (not a list) before clicking Apply.
- If cover letter didn’t fill, wait a few seconds; the script retries as dynamic elements load.
- If nothing generates:
  - Check the console for errors (content and service worker).
  - Verify OpenAI key (if using AI mode) and/or backend URL.
  - Ensure host permission matches the page (`https://www.upwork.com/*`).
- Free limit reached: Upgrade flow is a placeholder; either reset local usage for testing or implement a real payment system.

## Privacy

- Runs only on `upwork.com`.
- Settings and usage are stored locally via `chrome.storage.local`.
- If OpenAI is configured, requests go directly to OpenAI with your key.
- If the backend URL is configured, generation/usage calls are sent to your server.
- No analytics or tracking beyond optional usage sync to your backend.

## Development Notes

- Manifest V3, service worker-based background.
- No build step required (see `package.json`).
- Update `DEFAULT_CONFIG.API_BASE_URL` in `background.js` for production.
- Consider wiring real auth/user IDs and payment provider (Stripe/PayPal) before release.

## License

MIT
