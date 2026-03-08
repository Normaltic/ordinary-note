import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CollaborationServer } from '../collaboration/index.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';
import { registerFolderTools } from './tools/folder.tools.js';
import { registerNoteTools } from './tools/note.tools.js';
import { registerResources } from './resources.js';

export function createMcpServer(deps: {
  folderService: FolderService;
  noteService: NoteService;
  getCollaboration: () => CollaborationServer;
}): McpServer {
  const server = new McpServer({
    name: 'ordinary-note',
    version: '1.0.0',
  });

  registerFolderTools(server, deps.folderService);
  registerNoteTools(server, deps.noteService, deps.getCollaboration);
  registerResources(server, deps.noteService, deps.folderService);

  return server;
}
