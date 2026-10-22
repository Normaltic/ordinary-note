import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NoteInput = {
  title: string;
  contentPlain: string | null;
  isPinned?: boolean;
};

function createNotes(userId: string, folderId: string, notes: NoteInput[]) {
  return Promise.all(
    notes.map((n, i) =>
      prisma.note.create({
        data: {
          userId,
          folderId,
          title: n.title,
          contentPlain: n.contentPlain,
          sortOrder: i,
          isPinned: n.isPinned ?? false,
          yjsDocument: { create: {} },
        },
      }),
    ),
  );
}

async function main() {
  // 기존 유저 찾기 또는 테스트 유저 생성
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 사용자',
        googleId: 'seed-google-id',
      },
    });
    console.log('테스트 유저 생성:', user.email);
  } else {
    console.log('기존 유저 사용:', user.email);
  }

  // 해당 유저의 기존 데이터 정리
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.folder.deleteMany({ where: { userId: user.id } });

  const uid = user.id;

  // ── 폴더 구조 ──

  const root = await prisma.folder.create({
    data: { userId: uid, name: '내 노트', sortOrder: 0 },
  });

  const dev = await prisma.folder.create({
    data: { userId: uid, parentId: root.id, name: '개발', sortOrder: 0 },
  });
  const daily = await prisma.folder.create({
    data: { userId: uid, parentId: root.id, name: '일상', sortOrder: 1 },
  });
  const ideas = await prisma.folder.create({
    data: { userId: uid, parentId: root.id, name: '아이디어', sortOrder: 2 },
  });
  const reading = await prisma.folder.create({
    data: { userId: uid, parentId: root.id, name: '독서 메모', sortOrder: 3 },
  });

  const frontend = await prisma.folder.create({
    data: { userId: uid, parentId: dev.id, name: '프론트엔드', sortOrder: 0 },
  });
  const backend = await prisma.folder.create({
    data: { userId: uid, parentId: dev.id, name: '백엔드', sortOrder: 1 },
  });
  const devops = await prisma.folder.create({
    data: { userId: uid, parentId: dev.id, name: 'DevOps', sortOrder: 2 },
  });

  const react = await prisma.folder.create({
    data: { userId: uid, parentId: frontend.id, name: 'React', sortOrder: 0 },
  });
  const css = await prisma.folder.create({
    data: { userId: uid, parentId: frontend.id, name: 'CSS', sortOrder: 1 },
  });

  const travel = await prisma.folder.create({
    data: { userId: uid, parentId: daily.id, name: '여행', sortOrder: 0 },
  });
  const recipe = await prisma.folder.create({
    data: { userId: uid, parentId: daily.id, name: '레시피', sortOrder: 1 },
  });

  // ── 노트 생성 ──

  // 루트: 3개
  await createNotes(uid, root.id, [
    {
      title: '환영합니다',
      contentPlain:
        'Ordinary Note에 오신 것을 환영합니다\n폴더로 정리하세요\n리치 텍스트로 작성하세요\n자동 저장됩니다',
      isPinned: true,
    },
    {
      title: '빠른 시작 가이드',
      contentPlain:
        '시작하기\n1. 왼쪽 사이드바에서 폴더를 탐색하세요\n2. 폴더를 클릭하면 내부 노트가 표시됩니다\n3. 노트를 클릭하면 편집 화면으로 이동합니다',
    },
    {
      title: '단축키 모음',
      contentPlain:
        '편집기 단축키\nCmd+B 굵게\nCmd+I 기울임\nCmd+Shift+X 취소선\nCmd+E 인라인 코드',
    },
  ]);

  // 개발: 2개
  await createNotes(uid, dev.id, [
    {
      title: '2025 기술 스택 정리',
      contentPlain:
        '올해 사용 중인 스택\nReact 19 + Vite, TailwindCSS v4, Zustand\nExpress 5, Prisma + SQLite, TypeScript',
    },
    {
      title: '코드 리뷰 체크리스트',
      contentPlain:
        'PR 리뷰 시 확인할 것\n타입 안전성, 에러 처리, 테스트, console.log 제거, 네이밍',
    },
  ]);

  // React: 4개
  await createNotes(uid, react.id, [
    {
      title: 'useEffect 정리',
      contentPlain:
        'useEffect 핵심 규칙\nEffect는 외부 시스템과의 동기화를 위해 사용합니다.',
    },
    {
      title: 'Zustand vs Jotai 비교',
      contentPlain:
        '상태관리 라이브러리 비교\nZustand vs Jotai. 현재 프로젝트에서는 Zustand를 선택.',
    },
    {
      title: 'React 19 새로운 기능',
      contentPlain:
        'React 19 주요 변경사항\nuse() 훅, Actions, useOptimistic, 서버 컴포넌트 안정화',
    },
    {
      title: '커스텀 훅 패턴 모음',
      contentPlain:
        '자주 쓰는 커스텀 훅\nuseDebounce, useClickOutside, useLocalStorage',
    },
  ]);

  // CSS: 3개
  await createNotes(uid, css.id, [
    {
      title: 'Tailwind v4 변경점',
      contentPlain:
        'Tailwind CSS v4 주요 변경\n@theme 블록, CSS 변수 기반, 자체 엔진, CSS-first 설정',
    },
    {
      title: 'CSS Grid 치트시트',
      contentPlain:
        'Grid 핵심 속성\ndisplay: grid, grid-template-columns, gap\n사이드바 레이아웃, 카드 그리드 패턴',
    },
    {
      title: '다크 모드 구현 전략',
      contentPlain:
        '다크 모드 접근법\nCSS 변수 + prefers-color-scheme\n클래스 토글 (dark class)\nTailwind v4 방식',
    },
  ]);

  // 백엔드: 3개
  await createNotes(uid, backend.id, [
    {
      title: 'Prisma 쿼리 최적화 팁',
      contentPlain:
        'Prisma 성능 최적화\nselect 사용, include 대신 select, createMany 활용',
    },
    {
      title: 'Express 5 마이그레이션 노트',
      contentPlain:
        'Express 4 → 5 변경점\nasync 에러 자동 전달, app.del() 제거, path-to-regexp v8',
    },
    {
      title: 'REST API 설계 원칙',
      contentPlain:
        'API 설계 가이드\n리소스 중심 URL, HTTP 메서드, 상태 코드, 일관된 응답, 페이지네이션',
    },
  ]);

  // DevOps: 2개
  await createNotes(uid, devops.id, [
    {
      title: 'Docker 자주 쓰는 명령어',
      contentPlain:
        'Docker 명령어 치트시트\nbuild, run, compose up, logs, exec',
    },
    {
      title: 'GitHub Actions 기본 설정',
      contentPlain:
        'CI 워크플로우 템플릿\nGitHub Actions 기본 설정, 캐시로 속도 향상',
    },
  ]);

  // 아이디어: 4개
  await createNotes(uid, ideas.id, [
    {
      title: '사이드 프로젝트 아이디어',
      contentPlain:
        '해보고 싶은 프로젝트들\n노트 앱, 블로그, CLI 도구, 코드 에디터',
      isPinned: true,
    },
    {
      title: 'UI/UX 개선 메모',
      contentPlain: 'UI/UX 개선\n다크 모드, 키보드 단축키, D&D, 검색',
    },
    {
      title: '수익화 모델 고민',
      contentPlain: '노트앱 수익 모델\n프리미엄, 팀 플랜, 셀프 호스팅',
    },
    {
      title: '경쟁 서비스 분석',
      contentPlain:
        '노트앱 비교\nNotion, Obsidian, Bear, Logseq\n차별점: 심플함 + 웹 + 협업',
    },
  ]);

  // 여행: 3개
  await createNotes(uid, travel.id, [
    {
      title: '제주도 여행 계획',
      contentPlain:
        '제주 3박 4일\nDay 1: 협재, 애월\nDay 2: 한라산, 서귀포\nDay 3: 성산, 우도',
    },
    {
      title: '도쿄 맛집 리스트',
      contentPlain:
        '도쿄 맛집\n라멘: 이치란, 후쿠\n스시: 스시다이, 겐키\n카페: 블루보틀, 아라비카',
    },
    {
      title: '여행 준비 체크리스트',
      contentPlain: '해외여행 준비물\n여권, 항공권, 숙소, 보험, 환전, eSIM, 짐',
    },
  ]);

  // 레시피: 3개
  await createNotes(uid, recipe.id, [
    {
      title: '알리오 올리오',
      contentPlain:
        '알리오 올리오\n재료: 면, 마늘, 올리브유\n삶기 → 볶기 → 유화 → 완성',
    },
    {
      title: '김치찌개 (기본)',
      contentPlain:
        '김치찌개\n묵은지, 돼지고기, 두부\n볶기 → 끓이기 → 두부 → 완성',
    },
    {
      title: '바나나 팬케이크',
      contentPlain:
        '간단 팬케이크\n바나나 + 달걀 + 시나몬\n으깨기 → 섞기 → 굽기',
    },
  ]);

  // 독서 메모: 4개
  await createNotes(uid, reading.id, [
    {
      title: '클린 코드 — 로버트 마틴',
      contentPlain:
        '클린 코드 핵심 요약\n의미 있는 이름, 작은 함수, 최소한의 주석, 일관된 형식',
    },
    {
      title: '실용주의 프로그래머',
      contentPlain: '실용주의 프로그래머\nDRY, 깨진 창문, 예광탄, 고무 오리',
    },
    {
      title: '디자인 오브 에브리데이 씽스',
      contentPlain: '좋은 디자인의 원칙\n가시성, 피드백, 제약, 매핑',
    },
    {
      title: '',
      contentPlain: null,
    },
  ]);

  // 일상: 3개
  await createNotes(uid, daily.id, [
    {
      title: '이번 주 할 일',
      contentPlain: 'TODO\n장보기, 세탁소, 치과, Phase 4.5',
    },
    {
      title: '운동 루틴',
      contentPlain: '주 4회 루틴\n월/목 상체, 화/금 하체',
    },
    {
      title: '올해 목표',
      contentPlain: '2025 목표\n사이드 프로젝트, 블로그, 독서, 운동, 일본어',
    },
  ]);

  const folderCount = await prisma.folder.count();
  const noteCount = await prisma.note.count();
  console.log('시드 데이터 생성 완료!');
  console.log(`  폴더: ${folderCount}개 (3depth 트리)`);
  console.log(`  노트: ${noteCount}개`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
