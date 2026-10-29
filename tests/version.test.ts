import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { VERSION } from '../src/version.js';

describe('VERSION', () => {
  it('matches package.json', () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf-8')) as { version: string };
    expect(VERSION).toBe(pkg.version);
  });
});
