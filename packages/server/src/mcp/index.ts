import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';
import type { NoteContentService } from '../services/note-content.service.js';
import type { BulkNoteService } from '../services/bulk-note.service.js';
import { registerFolderTools } from './tools/folder.tools.js';
import { registerNoteTools } from './tools/note.tools.js';
import { registerResources } from './resources.js';

export function createMcpServer(deps: {
  folderService: FolderService;
  noteService: NoteService;
  noteContentService: NoteContentService;
  bulkNoteService: BulkNoteService;
}): McpServer {
  const server = new McpServer({
    name: 'ordinary-note',
    version: '1.0.0',
  });

  registerFolderTools(server, deps.folderService);
  registerNoteTools(
    server,
    deps.noteService,
    deps.noteContentService,
    deps.folderService,
    deps.bulkNoteService,
  );
  registerResources(server, deps.noteService, deps.noteContentService);

  return server;
}
