import { existsSync } from 'fs';
import { join } from 'path';
import { readJsonSafe, detectLicense, execSafe } from '../utils/helpers.js';

interface PackageJson {
  name?: string;
  version?: string;
  engines?: { node?: string };
}

export interface Badge {
  label: string;
  markdown: string;
}

export function detectBadges(dir: string = '.'): Badge[] {
  const badges: Badge[] = [];
  const pkg = readJsonSafe<PackageJson>(join(dir, 'package.json'));
  const repoSlug = getRepoSlug(dir);

  // npm version
  if (pkg?.name) {
    badges.push({
      label: 'npm version',
      markdown: `[![npm version](https://img.shields.io/npm/v/${pkg.name})](https://www.npmjs.com/package/${pkg.name})`,
    });
  }

  // License
  const license = detectLicense(dir);
  if (license && license !== 'Custom') {
    const color = license === 'MIT' ? 'green' : license.startsWith('Apache') ? 'blue' : 'orange';
    badges.push({
      label: 'License',
      markdown: `[![License: ${license}](https://img.shields.io/badge/license-${encodeURIComponent(license)}-${color})](LICENSE)`,
    });
  }

  // TypeScript
  if (existsSync(join(dir, 'tsconfig.json'))) {
    badges.push({
      label: 'TypeScript',
      markdown: `[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org/)`,
    });
  }

  // Node.js version
  if (pkg?.engines?.node) {
    const nodeVersion = pkg.engines.node.replace(/[>=<^~]/g, '');
    badges.push({
      label: 'Node.js',
      markdown: `[![Node.js](https://img.shields.io/badge/node-%3E%3D${nodeVersion}-339933)](https://nodejs.org/)`,
    });
  }

  // CI status (GitHub Actions)
  if (existsSync(join(dir, '.github/workflows'))) {
    if (repoSlug) {
      badges.push({
        label: 'CI',
        markdown: `[![CI](https://github.com/${repoSlug}/actions/workflows/ci.yml/badge.svg)](https://github.com/${repoSlug}/actions/workflows/ci.yml)`,
      });
    }
  }

  // Docker
  if (existsSync(join(dir, 'Dockerfile'))) {
    badges.push({
      label: 'Docker',
      markdown: `[![Docker](https://img.shields.io/badge/Docker-ready-2496ED)](https://www.docker.com/)`,
    });
  }

  // PRs Welcome (only when the GitHub repo is known; never emit a placeholder link)
  if (repoSlug) {
    badges.push({
      label: 'PRs Welcome',
      markdown: `[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/${repoSlug}/pulls)`,
    });
  }

  return badges;
}

/**
 * Extract "owner/repo" from a GitHub remote URL
 * (git@github.com:o/r.git, https://github.com/o/r(.git), ssh://git@github.com/o/r.git).
 */
export function parseGitHubSlug(remoteUrl: string): string | null {
  const match = remoteUrl.trim().match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/);
  return match?.[1] ?? null;
}

// The package is ESM-only, so `require` is not available at runtime; use the
// statically imported helper instead.
function getRepoSlug(dir: string): string | null {
  const url = execSafe('git remote get-url origin', dir);
  return url ? parseGitHubSlug(url) : null;
}

export function formatBadges(badges: Badge[]): string {
  return badges.map(b => b.markdown).join('\n');
}
