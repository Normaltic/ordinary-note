import { MainHeaderContainer } from '../features/layout/MainHeaderContainer';
import { FinderPageContent } from '../features/finder/FinderPageContent';

export function IndexPage() {
  return (
    <>
      <MainHeaderContainer />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FinderPageContent />
      </div>
    </>
  );
}
