import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { buildToc, extractHeadings, hasToc, updateToc } from '../lib/toc.js';

export const tocCommand = new Command('toc')
  .description('Generate or update table of contents in your README')
  .option('-f, --file <path>', 'README file to update', 'README.md')
  .option('--dry-run', 'Preview TOC without modifying README')
  .action((options) => {
    if (!existsSync(options.file)) {
      console.error(chalk.red(`\n  ${options.file} not found. Create a README first.\n`));
      process.exit(1);
    }

    const content = readFileSync(options.file, 'utf-8');
    const headings = extractHeadings(content);

    if (headings.length === 0) {
      console.log(chalk.yellow('\n  No headings (## or ###) found in README.\n'));
      process.exit(0);
    }

    console.log(chalk.bold(`\n  Found ${headings.length} headings:\n`));
    for (const h of headings) {
      const indent = h.level === 3 ? '    ' : '  ';
      console.log(chalk.gray(`${indent}${h.text}`));
    }

    if (options.dryRun) {
      console.log(chalk.bold('\n  Generated TOC:\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(buildToc(headings));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.cyan('\n  Dry run — file not modified.\n'));
      return;
    }

    const existed = hasToc(content);
    writeFileSync(options.file, updateToc(content), 'utf-8');
    console.log(chalk.green(`\n  ✓ Table of contents ${existed ? 'updated' : 'added'}.\n`));
  });
