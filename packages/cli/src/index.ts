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
import { registerOpenCommand } from './commands/open.js';
import { registerInfoCommand } from './commands/info.js';
import { registerDiffCommand } from './commands/diff.js';
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
registerOpenCommand(program);
registerInfoCommand(program);
registerDiffCommand(program);
registerUtilCommands(program);

program.parse();
