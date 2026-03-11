import { exec } from 'node:child_process';
import type { Command } from 'commander';
import { loadTokens } from '../lib/auth.js';
import { getServerUrl } from '../lib/config.js';

export function registerOpenCommand(program: Command): void {
  program
    .command('open <noteId>')
    .description('Open note in browser')
    .action((noteId: string) => {
      const tokens = loadTokens();
      const serverUrl = tokens?.server_url ?? getServerUrl();
      const baseUrl = serverUrl.replace(/\/api$/, '').replace(/:\d+$/, '');
      const clientUrl = process.env.ORDIN_CLIENT_URL ?? baseUrl;
      const url = `${clientUrl}/notes/${noteId}`;

      const openCmd =
        process.platform === 'darwin'
          ? 'open'
          : process.platform === 'win32'
            ? 'start'
            : 'xdg-open';

      exec(`${openCmd} "${url}"`, (err) => {
        if (err) {
          console.error(`Failed to open browser: ${err.message}`);
          console.log(`URL: ${url}`);
        }
      });
    });
}
