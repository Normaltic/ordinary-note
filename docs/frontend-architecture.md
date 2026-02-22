# 프론트엔드 아키텍처

## 디렉토리 구조

```
src/
├── main.tsx, App.tsx          # 진입점, 라우팅
├── stores/                    # 글로벌 상태 (Zustand)
├── lib/                       # API 클라이언트, axios, auth 헬퍼
├── components/                # 범용 UI (Breadcrumb, Dialog, Toast 등)
├── hooks/                     # 범용 훅 (useAutoSave, useClickOutside)
├── utils/                     # 순수 유틸리티
├── styles/                    # 테마, 에디터 스타일
├── pages/                     # 라우트 진입점 (레이아웃만, feature View를 렌더링)
│   ├── _layout.tsx            # / layout → ShellLayout
│   ├── login.tsx              # /login → LoginView
│   ├── index.tsx              # / → FinderView
│   ├── folders/
│   │   └── [folderId].tsx     # /folders/:folderId → FinderView
│   └── notes/
│       └── [noteId].tsx       # /notes/:noteId → EditorView
└── features/                  # 유스케이스별 View + 훅 + 컴포넌트
    ├── auth/
    │   ├── LoginView.tsx      # 로그인 카드 UI + useAuth
    │   ├── hooks/useAuth.ts
    │   └── components/        # PrivateRoute, PublicRoute, GlobalErrorHandler
    ├── finder/
    │   ├── FinderView.tsx     # 폴더/노트 목록 + 액션 + 다이얼로그
    │   ├── hooks/             # useFinderContents, useFinderActions
    │   └── components/        # FolderList, NoteList
    ├── editor/
    │   ├── EditorView.tsx     # 노트 편집 UI + useNoteEditor
    │   ├── hooks/useNoteEditor.ts
    │   └── components/        # TiptapEditor, EditorToolbar
    └── layout/
        ├── ShellLayout.tsx    # 사이드바 + 헤더 + Outlet + Toast
        ├── hooks/             # useAppShell, useFolderPath, useAncestorColumns
        └── components/        # ColumnNav, IconRail, NavColumn, MainHeader
```

## 레이어별 역할과 의존성 규칙

| 레이어 | 역할 | 의존 가능 대상 |
|--------|------|----------------|
| `pages/` | 라우트 진입점. **레이아웃 래퍼만** 담당하고 feature View를 렌더링. | features/ |
| `features/` | 유스케이스별 View, 훅, UI. 도메인 로직 캡슐화. | lib/, stores/, hooks/, components/, 다른 feature |
| `components/` | 범용(재사용) UI 컴포넌트. 비즈니스 로직 없음. | hooks/, utils/ |
| `hooks/` | 범용 훅. 특정 feature에 종속되지 않음. | stores/, lib/, utils/ |
| `stores/` | Zustand 글로벌 상태. | lib/ |
| `lib/` | 외부 통신(axios, API 함수), 인증 헬퍼. | — |
| `utils/` | 순수 유틸리티 함수. | — |

### 핵심 규칙

1. **pages/ 는 레이아웃만**: 훅 호출·컴포넌트 조합은 feature View에서.
2. **components/ → features/ 의존 금지**: 범용 컴포넌트는 feature를 모른다.
3. **feature 간 교차 의존 허용**: 단, 순환 참조 금지. (예: layout → auth OK)

## 파일 배치 판단 기준

| 질문 | Yes → | No → |
|------|-------|------|
| 특정 유스케이스에 종속? | `features/{name}/` | 아래 계속 |
| 여러 feature에서 재사용하는 UI? | `components/` | — |
| 여러 feature에서 재사용하는 훅? | `hooks/` | — |
| API 호출 함수? | `lib/api/` | — |
| 순수 변환/포맷 함수? | `utils/` | — |
| 라우트 진입점? | `pages/` | — |
