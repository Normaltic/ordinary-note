#!/usr/bin/env node
import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerFolderCommands } from './commands/folders.js';
import { registerNoteCommands } from './commands/notes.js';
import { registerReadCommand } from './commands/read.js';
import { registerWriteCommand } from './commands/write.js';
import { registerEditCommand } from './commands/edit.js';
import { registerPullCommand } from './commands/pull.js';
import { registerPushCommand } from './commands/push.js';
import { registerUtilCommands } from './commands/utils.js';

const program = new Command();

program
  .name('ordin')
  .description('ordinary-note CLI')
  .version('0.0.0');

registerAuthCommands(program);
registerFolderCommands(program);
registerNoteCommands(program);
registerReadCommand(program);
registerWriteCommand(program);
registerEditCommand(program);
registerPullCommand(program);
registerPushCommand(program);
registerUtilCommands(program);

program.parse();
