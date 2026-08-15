const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const puppeteer = require('puppeteer');

async function generatePDF() {
  console.log('Generating PDF from markdown files...');

  const rootDir = __dirname;
  const summaryPath = path.join(rootDir, 'SUMMARY.md');
  const summaryContent = fs.readFileSync(summaryPath, 'utf-8');

  // Extract chapters in order from SUMMARY.md
  const chapterRegex = /\[.*?\]\((ch\d+-kr\.md|appendix_[a-c]\.md)\)/g;
  const chapters = [];
  let match;
  while ((match = chapterRegex.exec(summaryContent)) !== null) {
    if (!chapters.includes(match[1])) {
      chapters.push(match[1]);
    }
  }

  console.log(`Found ${chapters.length} chapters to include in PDF:`, chapters);

  // Setup marked with syntax highlighting
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  let combinedHtml = '';

  // Cover / Title Page
  const coverPath = path.join(rootDir, 'images/cover.png');
  let coverBase64 = '';
  if (fs.existsSync(coverPath)) {
    coverBase64 = `data:image/png;base64,${fs.readFileSync(coverPath).toString('base64')}`;
  }

  combinedHtml += `
    <div class="cover-page">
      ${coverBase64 ? `<img class="cover-img" src="${coverBase64}" alt="Cover" />` : ''}
      <h1 class="book-title">가장 쉬운 함수형 프로그래밍 가이드</h1>
      <h2 class="book-subtitle">Mostly Adequate Guide to Functional Programming (한국어판)</h2>
      <p class="book-author">Mostly Adequate Core Team & Korean Translators</p>
    </div>
    <div class="page-break"></div>
  `;

  // Process README.md
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    let readmeText = fs.readFileSync(readmePath, 'utf-8');
    // Remove cover image markdown from top of README to avoid duplication
    readmeText = readmeText.replace(/\[!\[cover\]\(.*?\)\]\(.*?\)/g, '');
    readmeText = preprocessMarkdown(readmeText, rootDir);
    combinedHtml += `<section class="chapter-content">${marked.parse(readmeText)}</section><div class="page-break"></div>`;
  }

  // Process each chapter
  for (const chFile of chapters) {
    const chPath = path.join(rootDir, chFile);
    if (!fs.existsSync(chPath)) {
      console.warn(`File not found: ${chFile}`);
      continue;
    }

    let chContent = fs.readFileSync(chPath, 'utf-8');
    chContent = preprocessMarkdown(chContent, rootDir);
    const parsedHtml = marked.parse(chContent);

    combinedHtml += `
      <section class="chapter-content">
        ${parsedHtml}
      </section>
      <div class="page-break"></div>
    `;
  }

  // Generate full HTML document with styling
  const fullHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Mostly Adequate Guide to Functional Programming</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/styles/github.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Fira+Code:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt;
      line-height: 1.7;
      color: #24292e;
      margin: 0;
      padding: 0;
    }

    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 90vh;
      text-align: center;
    }

    .cover-img {
      max-width: 80%;
      max-height: 50vh;
      margin-bottom: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .book-title {
      font-size: 26pt;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #1a1f2c;
    }

    .book-subtitle {
      font-size: 15pt;
      font-weight: 400;
      color: #586069;
      margin-bottom: 2rem;
    }

    .book-author {
      font-size: 11pt;
      color: #6a737d;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    .chapter-content {
      padding: 10px 0;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #eaecef;
      padding-bottom: 0.3em;
      margin-top: 1.5em;
      margin-bottom: 1em;
      color: #1a1f2c;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 15pt;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.2em;
      margin-top: 1.5em;
      margin-bottom: 0.8em;
      color: #24292e;
      page-break-inside: avoid;
    }

    h3 {
      font-size: 12pt;
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      color: #24292e;
      page-break-inside: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 1em;
      word-break: keep-all;
    }

    code {
      font-family: 'Fira Code', Consolas, Monaco, monospace;
      font-size: 9pt;
      background-color: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      color: #d73a49;
    }

    pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      padding: 12px 16px;
      overflow-x: auto;
      margin-bottom: 1.2em;
      border: 1px solid #e1e4e8;
      page-break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      color: inherit;
      font-size: 9pt;
      line-height: 1.5;
    }

    blockquote {
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #586069;
      border-left: 4px solid #0366d6;
      background-color: #f1f8ff;
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    ul, ol {
      padding-left: 2em;
      margin-bottom: 1em;
    }

    li {
      margin-bottom: 0.4em;
    }

    img {
      max-width: 100%;
      height: auto;
      margin: 1em auto;
      display: block;
      page-break-inside: avoid;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: #f6f8fa;
      font-weight: 600;
    }

    .exercise-box {
      border: 1px solid #d1d5da;
      border-left: 4px solid #28a745;
      background-color: #f6f8fa;
      padding: 12px 16px;
      margin: 1.5em 0;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
    }

    .exercise-title {
      font-weight: 600;
      color: #28a745;
      margin-bottom: 0.5em;
    }
  </style>
</head>
<body>
  ${combinedHtml}
</body>
</html>
  `;

  const outputHtmlPath = path.join(rootDir, 'book_preview.html');
  fs.writeFileSync(outputHtmlPath, fullHtml);

  console.log('Launching browser to render PDF...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const outputPdfPath = path.join(rootDir, 'mostly-adequate-guide-kr.pdf');
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 8pt; color: #888; width: 100%; text-align: right; padding-right: 15mm; font-family: sans-serif;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
  });

  await browser.close();
  console.log(`PDF successfully generated at: ${outputPdfPath}`);
}

function preprocessMarkdown(content, rootDir) {
  // Replace images with base64 embedded data so they render offline in PDF
  content = content.replace(/!\[(.*?)\]\((images\/.*?)\)/g, (match, alt, imgRelPath) => {
    const imgFullPath = path.join(rootDir, imgRelPath);
    if (fs.existsSync(imgFullPath)) {
      const ext = path.extname(imgFullPath).toLowerCase().replace('.', '');
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      const base64 = fs.readFileSync(imgFullPath).toString('base64');
      return `![${alt}](data:${mimeType};base64,${base64})`;
    }
    return match;
  });

  content = content.replace(/<img\s+([^>]*?)src=["'](images\/[^"']+)["']([^>]*?)\/?>/gi, (match, before, imgRelPath, after) => {
    const imgFullPath = path.join(rootDir, imgRelPath);
    if (fs.existsSync(imgFullPath)) {
      const ext = path.extname(imgFullPath).toLowerCase().replace('.', '');
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      const base64 = fs.readFileSync(imgFullPath).toString('base64');
      return `<img ${before} src="data:${mimeType};base64,${base64}" ${after} />`;
    }
    return match;
  });

  // Handle [include](./exercises/ch06/main.js)
  content = content.replace(/\[include\]\((.*?)\)/g, (match, includePath) => {
    const fullIncludePath = path.join(rootDir, includePath);
    if (fs.existsSync(fullIncludePath)) {
      const code = fs.readFileSync(fullIncludePath, 'utf-8');
      return `\n\`\`\`js\n${code}\n\`\`\`\n`;
    }
    return match;
  });

  // Transform GitBook exercise plugin tags into nice HTML/Markdown callouts
  content = content.replace(/{%\s*exercise\s*%}([\s\S]*?){%\s*endexercise\s*%}/g, (match, body) => {
    // Extract description and initial code
    let desc = body;
    let initialCode = '';
    
    // Remove plugin tags like {% initial ... %}, {% solution ... %}, etc.
    desc = desc.replace(/{%\s*solution[\s\S]*?%}/g, '');
    desc = desc.replace(/{%\s*validation[\s\S]*?%}/g, '');
    desc = desc.replace(/{%\s*context[\s\S]*?%}/g, '');
    desc = desc.replace(/{%\s*initial\s+src=["'](.*?)["']\s*%}/g, '');

    return `
<div class="exercise-box">
  <div class="exercise-title">✏️ 연습문제</div>
  ${desc.trim()}
</div>
    `;
  });

  return content;
}

if (require.main === module) {
  generatePDF().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
  });
}

module.exports = { generatePDF };
