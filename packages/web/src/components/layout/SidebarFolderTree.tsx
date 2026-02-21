import { useState, useCallback } from 'react';
import { Link, useMatch } from 'react-router-dom';
import type { FolderTreeNode } from '@ordinary-note/shared';
import { useNoteStore } from '../../stores/note.store';

interface SidebarFolderTreeProps {
  tree: FolderTreeNode[];
  onNavigate?: () => void;
}

export function SidebarFolderTree({ tree, onNavigate }: SidebarFolderTreeProps) {
  const folderMatch = useMatch('/folders/:folderId');
  const noteMatch = useMatch('/notes/:noteId');
  const note = useNoteStore((s) => s.note);

  const activeFolderId =
    folderMatch?.params.folderId ?? (noteMatch ? note?.folderId : null) ?? null;

  return (
    <nav className="flex-1 overflow-y-auto px-2">
      <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        폴더
      </div>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          activeFolderId={activeFolderId}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

interface TreeNodeProps {
  node: FolderTreeNode;
  level: number;
  activeFolderId: string | null;
  onNavigate?: () => void;
}

function TreeNode({ node, level, activeFolderId, onNavigate }: TreeNodeProps) {
  const [open, setOpen] = useState(() => isAncestorOf(node, activeFolderId));
  const isActive = node.id === activeFolderId;
  const hasChildren = node.children.length > 0;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen((prev) => !prev);
    },
    [],
  );

  const paddingLeft = 12 + level * 20;

  return (
    <>
      <Link
        to={`/folders/${node.id}`}
        onClick={onNavigate}
        className={`flex min-h-8 items-center gap-2 rounded-md py-1 pr-3 text-sm transition-colors select-none ${
          isActive
            ? 'bg-accent-subtle text-accent'
            : 'text-text-primary hover:bg-bg-hover'
        }`}
        style={{ paddingLeft }}
      >
        <button
          type="button"
          onClick={hasChildren ? handleToggle : undefined}
          className={`flex h-4 w-4 shrink-0 items-center justify-center text-text-muted transition-transform ${
            open ? 'rotate-90' : ''
          } ${!hasChildren ? 'invisible' : ''}`}
        >
          &#x25B8;
        </button>
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.noteCount > 0 && (
          <span className="shrink-0 text-xs text-text-muted">{node.noteCount}</span>
        )}
      </Link>
      {open &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            activeFolderId={activeFolderId}
            onNavigate={onNavigate}
          />
        ))}
    </>
  );
}

function isAncestorOf(node: FolderTreeNode, targetId: string | null): boolean {
  if (!targetId) return false;
  if (node.id === targetId) return true;
  return node.children.some((child) => isAncestorOf(child, targetId));
}
