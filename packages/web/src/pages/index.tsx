import { Link } from 'react-router-dom';
import { SidebarToggle } from '../features/layout/SidebarToggle';
import { useFolderChildren } from '../hooks/queries/useFolder';
import { FolderCard } from '../features/finder/components/FolderCard';
import { PinnedNotes } from '../features/pinned/PinnedNotes';
import { RecentNotes } from '../features/recent/RecentNotes';

export function IndexPage() {
  const { folders, isLoading } = useFolderChildren(null);

  return (
    <>
      <div className="flex items-center px-4 py-3 lg:hidden">
        <SidebarToggle />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          {/* 폴더 섹션 */}
          {!isLoading && folders.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">폴더</h2>
              <div className="flex flex-col gap-2">
                {folders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            </section>
          )}

          {/* 핀 노트 섹션 */}
          <section className="mb-10">
            <Link to="/pinned" className="mb-4 block text-lg font-semibold text-text-primary hover:text-text-secondary">
              핀 노트
            </Link>
            <PinnedNotes limit={5} />
          </section>

          {/* 최근 노트 섹션 */}
          <section className="mb-10">
            <Link to="/recent" className="mb-4 block text-lg font-semibold text-text-primary hover:text-text-secondary">
              최근 노트
            </Link>
            <RecentNotes limit={5} />
          </section>
        </div>
      </div>
    </>
  );
}
