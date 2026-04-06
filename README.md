# ⛵ Yacht Tracker

Track yacht listings across broker websites and get AI-powered summaries of what's changed.

## Features

- 📸 **Browser Extension** - Capture listings from any yacht broker page with one click
- 🤖 **AI Summaries** - OpenAI generates human-readable summaries of changes
- 📊 **Dashboard** - View all tracked pages and their change history
- ⏰ **Scheduled Scans** - GitHub Actions runs every 6 hours (configurable)
- 🔄 **Change Detection** - Detects new listings, removed listings, and price changes

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Browser         │     │  Vercel API      │     │  PostgreSQL     │
│ Extension       │────>│  (Next.js)       │────>│  Database       │
│ (Chrome/Edge)   │     │                  │     │                 │
└─────────────────┘     │  - /api/capture  │     └─────────────────┘
                        │  - /api/summaries│              ▲
┌─────────────────┐     │  - /api/cron/*   │              │
│ Dashboard UI    │<────│                  │              │
│ (Next.js)       │     │                  │     ┌─────────────────┐
└─────────────────┘     └──────────────────┘     │  OpenAI API     │
                                                 │  (GPT-4o-mini)  │
┌─────────────────┐                              └─────────────────┘
│ GitHub Actions  │
│ (Scheduled)     │──> (Future: server-side scanning)
└─────────────────┘
```

## Quick Start

### 1. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add environment variables (see below)
4. Deploy!

### 2. Environment Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key | [platform.openai.com](https://platform.openai.com/api-keys) |
| `POSTGRES_URL` | PostgreSQL connection string | [Neon](https://neon.tech) or Vercel Postgres |
| `CRON_SECRET` | Secret for cron authentication | Generate any random string |

### 3. Set Up Database

On first deployment, the database tables are created automatically when you first access `/api/capture`. The schema includes:
- `tracked_pages` - URLs you're monitoring
- `snapshots` - Captured listing data
- `summaries` - AI-generated change summaries

### 4. Install Browser Extension

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Click the extension icon
6. Enter your deployed API URL
7. Browse to a yacht broker page and click **Capture Listings**

### 5. Add Pages to Track

1. Open your deployed dashboard
2. Enter the URL of a yacht listing page
3. Give it a name (optional)
4. Click **Add Page**

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── capture/route.ts      # Receives captured listings
│   │   │   ├── summaries/route.ts    # Get all summaries
│   │   │   └── cron/scan/route.ts    # Cron job endpoint
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Dashboard
│   └── lib/
│       ├── db.ts                     # Database operations
│       └── openai.ts                 # AI summarization
├── extension/
│   ├── manifest.json                 # Extension config
│   ├── popup.html                    # Extension popup UI
│   ├── popup.js                      # Extension logic
│   └── icons/                        # Extension icons
├── .github/workflows/
│   └── scheduled-scan.yml            # GitHub Actions cron
├── vercel.json                       # Vercel config with cron
└── .env.example                      # Environment variables template
```

## How It Works

1. **Capture** - Browser extension extracts listings from the page using smart selectors
2. **Send** - Listings are sent to the Vercel API
3. **Compare** - Backend compares with the previous snapshot
4. **Summarize** - OpenAI generates a human-readable summary
5. **Display** - Dashboard shows changes with color-coded indicators

## Change Types

- 🆕 **New Listings** - Ads that weren't there before
- 🗑️ **Removed** - Ads that disappeared
- 🔄 **Mixed** - Both new and removed
- ✅ **No Changes** - Everything is the same

## Customization

### Adjusting Listing Extraction

The extension uses smart selectors to find listings. To customize for specific sites, edit `extension/popup.js`:

```javascript
const selectors = [
  '.listing-card',    // Add site-specific selectors
  '.boat-listing',
  '[class*="boat-card"]',
];
```

### Changing Scan Frequency

Edit `.github/workflows/scheduled-scan.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
```

### AI Model

The default model is `gpt-4o-mini` for cost efficiency. Change in `src/lib/openai.ts`.

## Costs

- **Vercel**: Free tier (Hobby) is sufficient
- **PostgreSQL**: Neon free tier or Vercel Postgres
- **OpenAI**: ~$0.01-0.05 per summary with gpt-4o-mini

## Future Enhancements

- [ ] Full page screenshots for visual comparison
- [ ] Email/Slack notifications on changes
- [ ] Server-side scraping with Playwright
- [ ] Price tracking charts
- [ ] Site-specific extraction rules
- [ ] Filter by boat type, size, price range