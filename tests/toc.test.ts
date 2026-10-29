import { describe, it, expect } from 'vitest';
import { extractHeadings, githubAnchor, updateToc } from '../src/lib/toc.js';

describe('extractHeadings', () => {
  it('handles CRLF line endings', () => {
    const headings = extractHeadings('# T\r\n\r\n## Install\r\n\r\n### Sub\r\n');
    expect(headings.map(h => h.text)).toEqual(['Install', 'Sub']);
  });

  it('ignores headings inside fenced code blocks', () => {
    const content = '# T\n\n## Real\n\n```md\n## Fake\n```\n\n~~~\n## Also fake\n~~~\n\n## Usage\n';
    expect(extractHeadings(content).map(h => h.text)).toEqual(['Real', 'Usage']);
  });

  it('skips an existing Table of Contents heading', () => {
    expect(extractHeadings('## Table of Contents\n## Usage\n').map(h => h.text)).toEqual(['Usage']);
  });

  it('suffixes duplicate anchors like GitHub does', () => {
    const anchors = extractHeadings('## Usage\n## Usage\n## Usage\n').map(h => h.anchor);
    expect(anchors).toEqual(['usage', 'usage-1', 'usage-2']);
  });
});

describe('githubAnchor', () => {
  it('keeps one hyphen per space like GitHub', () => {
    expect(githubAnchor('Install & Setup')).toBe('install--setup');
  });

  it('keeps non-ASCII letters', () => {
    expect(githubAnchor('Kurulum Adımları')).toBe('kurulum-adımları');
  });

  it('drops punctuation but keeps underscores and hyphens', () => {
    expect(githubAnchor('Why? `snake_case` and kebab-case!')).toBe('why-snake_case-and-kebab-case');
  });
});

describe('updateToc', () => {
  it('inserts the TOC before the first H2 and is idempotent', () => {
    const content = '# T\n\nIntro\n\n## Install\n\n## Usage\n';
    const once = updateToc(content);
    expect(once.indexOf('<!-- toc -->')).toBeLessThan(once.indexOf('## Install'));
    expect(once).toContain('- [Install](#install)');
    expect(updateToc(once)).toBe(once);
  });
});
