import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mostly Adequate Guide Korean Chapters Verification', () => {
  const rootDir = path.resolve(__dirname, '..');

  const expectedChapters = [
    { ch: '01', file: 'ch01-kr.md', next: 'ch02-kr.md' },
    { ch: '02', file: 'ch02-kr.md', next: 'ch03-kr.md' },
    { ch: '03', file: 'ch03-kr.md', next: 'ch04-kr.md' },
    { ch: '04', file: 'ch04-kr.md', next: 'ch05-kr.md' },
    { ch: '05', file: 'ch05-kr.md', next: 'ch06-kr.md' },
    { ch: '06', file: 'ch06-kr.md', next: 'ch07-kr.md' },
    { ch: '07', file: 'ch07-kr.md', next: 'ch08-kr.md' },
    { ch: '08', file: 'ch08-kr.md', next: 'ch09-kr.md' },
    { ch: '09', file: 'ch09-kr.md', next: 'ch10-kr.md' },
    { ch: '10', file: 'ch10-kr.md', next: 'ch11-kr.md' },
    { ch: '11', file: 'ch11-kr.md', next: 'ch12-kr.md' },
    { ch: '12', file: 'ch12-kr.md', next: 'ch13-kr.md' },
    { ch: '13', file: 'ch13-kr.md', next: 'appendix_a.md' },
  ];

  it('all chapter -kr.md files should exist and not be empty', () => {
    for (const { file } of expectedChapters) {
      const filePath = path.join(rootDir, file);
      expect(fs.existsSync(filePath), `File ${file} should exist`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length, `File ${file} should not be empty`).toBeGreaterThan(100);
    }
  });

  it('each chapter should have a valid link to the next chapter at the end', () => {
    for (const { file, next } of expectedChapters) {
      const filePath = path.join(rootDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content, `${file} should contain link to ${next}`).toContain(`](${next}`);
    }
  });

  it('ch04-kr.md specifically links to ch05-kr.md', () => {
    const ch04Content = fs.readFileSync(path.join(rootDir, 'ch04-kr.md'), 'utf-8');
    expect(ch04Content).toContain('(ch05-kr.md)');
  });

  it('SUMMARY.md should link to all chXX-kr.md files without broken links', () => {
    const summaryPath = path.join(rootDir, 'SUMMARY.md');
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summaryContent = fs.readFileSync(summaryPath, 'utf-8');

    for (const { file } of expectedChapters) {
      expect(summaryContent, `SUMMARY.md should link to ${file}`).toContain(`(${file}`);
    }

    // Check all linked files in SUMMARY.md exist
    const linkRegex = /\[.*?\]\(([^#\)]+)(?:#[^\)]*)?\)/g;
    let match;
    while ((match = linkRegex.exec(summaryContent)) !== null) {
      const linkedFile = match[1];
      if (!linkedFile.startsWith('http')) {
        const fullPath = path.join(rootDir, linkedFile);
        expect(fs.existsSync(fullPath), `Target file ${linkedFile} referenced in SUMMARY.md must exist`).toBe(true);
      }
    }
  });
});
