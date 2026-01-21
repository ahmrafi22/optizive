const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

/**
 * Gets browser configuration for both local and serverless environments
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function getBrowser() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  if (isProduction) {
    // Optimize for serverless - reduce binary size
    chromium.setGraphicsMode = false;
    
    // Vercel/serverless configuration with additional args
    return await puppeteerCore.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  } else {
    // Local development configuration
    // Try to use local Chrome/Chromium installation
    const executablePath = 
      process.platform === 'win32' 
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome';

    return await puppeteerCore.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: executablePath,
    });
  }
}

module.exports = { getBrowser };
