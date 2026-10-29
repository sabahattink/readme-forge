export const TOC_START = '<!-- toc -->';
export const TOC_END = '<!-- /toc -->';

export interface Heading {
  level: number;
  text: string;
  anchor: string;
}

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * GitHub-compatible heading anchor (same rules as github-slugger):
 * lowercase, drop everything except letters, marks, numbers, connector
 * punctuation, spaces and hyphens, then turn each space into a hyphen.
 */
export function githubAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  let openFence: string | null = null;

  for (const line of content.split(/\r?\n/)) {
    const fence = line.match(FENCE_RE)?.[1];
    if (fence) {
      if (openFence === null) {
        openFence = fence;
      } else if (fence[0] === openFence[0] && fence.length >= openFence.length) {
        openFence = null;
      }
      continue;
    }
    if (openFence !== null) continue;

    // Optional closing hashes must be preceded by whitespace (so "C#" survives)
    const match = line.match(/^(#{2,3})\s+(.+?)(?:\s+#+)?\s*$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();

    // Skip TOC itself
    if (text.toLowerCase() === 'table of contents') continue;

    const base = githubAnchor(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const anchor = count === 0 ? base : `${base}-${count}`;

    headings.push({ level, text, anchor });
  }

  return headings;
}

export function buildToc(headings: Heading[]): string {
  const lines = headings.map(h => {
    const indent = h.level === 3 ? '  ' : '';
    return `${indent}- [${h.text}](#${h.anchor})`;
  });

  return `${TOC_START}\n## Table of Contents\n\n${lines.join('\n')}\n${TOC_END}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TOC_BLOCK_RE = new RegExp(`${escapeRegex(TOC_START)}[\\s\\S]*?${escapeRegex(TOC_END)}`, 'm');

export function hasToc(content: string): boolean {
  return TOC_BLOCK_RE.test(content);
}

/**
 * Return `content` with an up-to-date TOC: an existing TOC block is replaced,
 * otherwise the TOC is inserted before the first H2 (or appended).
 */
export function updateToc(content: string): string {
  const toc = buildToc(extractHeadings(content));

  if (hasToc(content)) {
    return content.replace(TOC_BLOCK_RE, toc);
  }

  const firstH2 = content.match(/^## /m);
  if (firstH2 && firstH2.index !== undefined) {
    return content.slice(0, firstH2.index) + toc + '\n\n' + content.slice(firstH2.index);
  }
  return content + '\n\n' + toc;
}
