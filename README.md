# Optizive API - Vercel Deployment Guide

Price comparison scraper API deployed on Vercel serverless infrastructure.

## 🚀 Quick Deploy

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```
   
3. **Deploy to production**:
   ```bash
   npx vercel --prod
   ```

## 📦 What Changed for Vercel

### Dependencies
- Replaced `puppeteer` with `puppeteer-core` (doesn't bundle Chrome)
- Added `@sparticuz/chromium` (optimized for serverless)

### New Files
- `api/index.js` - Serverless function entry point
- `utils/browser.js` - Smart browser configuration for local/production
- `vercel.json` - Vercel deployment configuration
- `.vercelignore` - Files to exclude from deployment

### Configuration
The browser utility automatically detects the environment:
- **Production (Vercel)**: Uses `@sparticuz/chromium` 
- **Local Development**: Uses your system Chrome/Chromium

## 🔧 Local Development

```bash
npm run dev
```

For local testing, ensure you have Chrome installed at:
- **Windows**: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
- **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux**: `/usr/bin/google-chrome`

## 📡 Available Endpoints

Once deployed, your API will have these endpoints:

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /scraper-daraz?query={search}`
- `GET /scraper-chaldal?query={search}`
- `GET /scraper-swapno?query={search}`
- `GET /scraper-unimart?query={search}`
- `GET /scraper-pickaboo?query={search}`
- `GET /scraper-transcom?query={search}`
- `GET /scraper-othoba?query={search}`
- `GET /scraper-pcpartpicker?query={search}&limit=20`
- `GET /scraper-bestelectronics?query={search}`
- `GET /scraper-cartup?query={search}`

## ⚡ Performance Notes

Vercel serverless functions have:
- 10-second execution timeout (Hobby plan)
- 50MB deployment size limit
- Cold start latency (~1-3 seconds)

For heavy scraping, consider:
- Implementing caching
- Using Vercel Pro plan (60s timeout)
- Setting up a background job system

## 🔐 Environment Variables

If needed, add environment variables in Vercel dashboard:
```
NODE_ENV=production
```

## 🐛 Troubleshooting

**Error: Chrome not found locally**
- Install Chrome or update the path in `utils/browser.js`

**Error: Timeout on Vercel**
- Optimize scraping logic
- Reduce wait times
- Consider upgrading Vercel plan

**Error: Module not found**
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and reinstall if issues persist
