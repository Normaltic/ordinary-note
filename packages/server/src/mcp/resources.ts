import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NoteService } from '../services/note.service.js';
import type { NoteContentService } from '../services/note-content.service.js';
import { getUserId } from './utils.js';

export function registerResources(
  server: McpServer,
  noteService: NoteService,
  noteContentService: NoteContentService,
): void {
  server.resource(
    'note',
    new ResourceTemplate('note://{noteId}', { list: undefined }),
    async (uri, { noteId }, { authInfo }) => {
      const userId = getUserId(authInfo);
      const note = await noteService.getById(userId, noteId as string);
      const markdown = await noteContentService.getMarkdown(
        userId,
        noteId as string,
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# ${note.title}\n\n${markdown}`,
          },
        ],
      };
    },
  );

  server.resource(
    'folder',
    new ResourceTemplate('folder://{folderId}', { list: undefined }),
    async (uri, { folderId }, { authInfo }) => {
      const userId = getUserId(authInfo);
      const notes = await noteService.getByFolderId(
        userId,
        folderId as string,
      );
      const text = notes.map((n) => `- ${n.title} (${n.id})`).join('\n');
      return {
        contents: [{ uri: uri.href, mimeType: 'text/plain', text }],
      };
    },
  );
}
