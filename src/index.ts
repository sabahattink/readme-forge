#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { checkCommand } from './commands/check.js';
import { badgeCommand } from './commands/badge.js';
import { tocCommand } from './commands/toc.js';
import { VERSION } from './version.js';

const program = new Command();

program
  .name('readme-forge')
  .description('AI-powered README generator. Analyze your codebase and generate professional docs.')
  .version(VERSION);

program.addCommand(generateCommand);
program.addCommand(checkCommand);
program.addCommand(badgeCommand);
program.addCommand(tocCommand);

// Default command: readme-forge = readme-forge generate
program.action(async () => {
  await generateCommand.parseAsync(process.argv.slice(2), { from: 'user' });
});

// Async action handlers require parseAsync so rejections are not left unhandled.
await program.parseAsync();
