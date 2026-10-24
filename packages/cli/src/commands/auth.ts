import type { Command } from 'commander';
import { loginFlow, loadTokens, clearTokens } from '../lib/auth.js';
import { getServerUrl } from '../lib/config.js';
import { output } from '../lib/output.js';

export function registerAuthCommands(program: Command): void {
  program
    .command('login')
    .description('Authenticate with ordinary-note server')
    .action(async () => {
      try {
        await loginFlow();
      } catch (err) {
        console.error(
          'Login failed:',
          err instanceof Error ? err.message : err,
        );
        process.exit(1);
      }
    });

  program
    .command('logout')
    .description('Clear stored credentials')
    .action(() => {
      clearTokens();
      console.log('Logged out.');
    });

  program
    .command('whoami')
    .description('Show current authentication status')
    .option('--json', 'Output as JSON')
    .action((opts: { json?: boolean }) => {
      const tokens = loadTokens();
      if (!tokens) {
        output(opts.json, { authenticated: false }, 'Not logged in. Run: ordin login');
        return;
      }
      const serverUrl = tokens.server_url ?? getServerUrl();
      output(
        opts.json,
        { authenticated: true, serverUrl, clientId: tokens.client_id },
        `Server: ${serverUrl}\nClient ID: ${tokens.client_id}\nStatus: authenticated`,
      );
    });
}
