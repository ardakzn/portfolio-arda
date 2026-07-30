import { access, copyFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const distRoot = resolve(projectRoot, 'dist');
const publicOutput = resolve(projectRoot, 'public', 'assets', 'portfolio-preview.png');
const distOutput = resolve(distRoot, 'assets', 'portfolio-preview.png');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const existingPath = async (candidates) => {
  for (const candidate of candidates.filter(Boolean)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next installed browser.
    }
  }
  return '';
};

const findBrowserExecutable = () => {
  const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
  const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env.LOCALAPPDATA || '';

  return existingPath([
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    resolve(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    resolve(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    localAppData && resolve(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    resolve(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    resolve(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    localAppData && resolve(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ]);
};

const startStaticServer = async () => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const filePath = resolve(distRoot, relativePath);
      const allowedRoot = `${distRoot}${sep}`;

      if (filePath !== distRoot && !filePath.startsWith(allowedRoot)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start the social preview server.');
  return { server, origin: `http://127.0.0.1:${address.port}` };
};

const closeServer = (server) =>
  new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });

const generateSocialPreview = async () => {
  const executablePath = await findBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      'Chrome or Edge is required to generate the social preview. Set CHROME_PATH to an installed Chromium browser.',
    );
  }

  const { server, origin } = await startStaticServer();
  let browser;

  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: { width: 1200, height: 630 },
    });

    await page.goto(`${origin}/social-preview.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => document.documentElement.dataset.previewReady === 'true',
      undefined,
      { timeout: 10_000 },
    );

    const previewError = await page.evaluate(() => document.documentElement.dataset.previewError || '');
    if (previewError) throw new Error(previewError);

    await page.screenshot({
      path: publicOutput,
      type: 'png',
      fullPage: false,
      animations: 'disabled',
    });
    await copyFile(publicOutput, distOutput);
    console.log('Generated public/assets/portfolio-preview.png (1200x630)');
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
};

await generateSocialPreview();
