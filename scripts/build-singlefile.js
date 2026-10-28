import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.resolve(__dirname, '..', 'build');
const OUT_FILE = path.resolve(__dirname, '..', 'set-app.html');

if (!fs.existsSync(BUILD_DIR)) {
  console.error('找不到 build 目录，请先执行 pnpm build');
  process.exit(1);
}

const indexPath = path.join(BUILD_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('找不到 build/index.html');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

const assetDirs = [
  path.join(BUILD_DIR, '_app'),
  path.join(BUILD_DIR, 'assets')
];

function inlineAssets(htmlContent) {
  return htmlContent.replace(
    /(src|href)="([^"]*\.\w+)"/g,
    (match, attr, url) => {
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('//') ||
        url.startsWith('data:') ||
        url.startsWith('#')
      ) {
        return match;
      }

      let filePath = url;
      if (filePath.startsWith('/')) {
        filePath = filePath.slice(1);
      }

      const fullPath = path.join(BUILD_DIR, filePath);

      if (!fs.existsSync(fullPath)) {
        return match;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const buffer = fs.readFileSync(fullPath);

      if (ext === '.js') {
        return `src="data:application/javascript;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.css') {
        return `href="data:text/css;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.png') {
        return `href="data:image/png;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.jpg' || ext === '.jpeg') {
        return `href="data:image/jpeg;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.svg') {
        return `href="data:image/svg+xml;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.woff2') {
        return `href="data:font/woff2;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.woff') {
        return `href="data:font/woff;base64,${buffer.toString('base64')}"`;
      }

      if (ext === '.ttf') {
        return `href="data:font/ttf;base64,${buffer.toString('base64')}"`;
      }

      return match;
    }
  );
}

html = inlineAssets(html);

fs.writeFileSync(OUT_FILE, html, 'utf-8');
console.log('已生成单文件 HTML：', OUT_FILE);
