import { FinderView } from './FinderView';

interface NoteSidebarProps {
  folderId: string;
}

export function NoteSidebar({ folderId }: NoteSidebarProps) {
  return (
    <div className="hidden w-80 shrink-0 overflow-y-auto border-r border-border-default px-6 py-6 lg:block">
      <FinderView folderId={folderId} />
    </div>
  );
}
