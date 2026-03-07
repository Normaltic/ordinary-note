# 프론트엔드 아키텍처

## 디렉토리 구조

```
src/
├── main.tsx, App.tsx          # 진입점, 라우팅
├── pages/                     # 라우트 진입점
├── features/                  # 도메인별 비즈니스 로직 + UI
│   ├── auth/
│   ├── finder/
│   ├── editor/
│   └── layout/
├── components/                # 도메인 무관 UI 프리미티브
│   └── icons/                 # SVG 아이콘 (vite-plugin-svgr)
├── hooks/                     # 공용 훅
│   └── queries/               # React Query 훅 + 쿼리 키 팩토리
├── stores/                    # Zustand 글로벌 상태
├── lib/                       # API 클라이언트, axios, auth 헬퍼
├── utils/                     # 순수 유틸리티 함수
└── styles/                    # TailwindCSS v4 테마 토큰
```

## 레이어별 역할

### pages/

라우트 진입점. 네비게이션 UI(HamburgerButton, Breadcrumb 등)와 feature 컴포넌트를 조합한다. 비즈니스 로직을 직접 포함하지 않는다.

### features/

도메인별로 분리된 비즈니스 로직과 UI를 캡슐화한다.

**내부 구조 규칙:**

| 위치          | 역할                                                | 예시                                            |
| ------------- | --------------------------------------------------- | ----------------------------------------------- |
| 루트          | 외부(pages, 다른 feature)에서 import하는 퍼블릭 API | `FinderView`, `ColumnLayout`, `HamburgerButton` |
| `components/` | feature 내부에서만 사용하는 구현 컴포넌트           | `FolderList`, `NoteList`, `Sidebar`             |
| `hooks/`      | feature 전용 훅                                     | `useFinderActions`, `useStandalone`             |

### components/

도메인 지식이 없는 순수 UI 프리미티브. 특정 스토어나 feature 훅에 의존하는 컴포넌트는 여기 두지 않고 해당 feature로 이동한다.

### hooks/queries/

여러 feature에서 공용으로 사용하는 React Query 훅. 쿼리 키 팩토리(`keys.ts`), 폴더/노트 쿼리·뮤테이션 훅을 포함한다.

### stores/

Zustand 글로벌 상태. feature가 아닌 공유 인프라로 취급한다.

## 의존성 규칙

```
pages → features → hooks/, stores/, components/, lib/
                   components/ → (도메인 의존 없음)
```

1. **components/ → features/ 의존 금지**: UI 프리미티브는 feature를 모른다.
2. **feature 간 교차 의존 허용**: 단, 순환 참조 금지.
3. **pages는 조합만**: 비즈니스 로직은 feature에서 처리.

## 파일 배치 판단 기준

| 질문                            | 배치               |
| ------------------------------- | ------------------ |
| 특정 도메인의 훅/스토어에 의존? | `features/{name}/` |
| 도메인 무관한 재사용 UI?        | `components/`      |
| 여러 feature에서 공용 훅?       | `hooks/`           |
| API 호출 함수?                  | `lib/api/`         |
| 순수 변환/포맷 함수?            | `utils/`           |
| 라우트 진입점?                  | `pages/`           |

## 주요 패턴

- 서버 상태: React Query, 클라이언트 상태: Zustand
- 노트 링크 hover 시 `prefetchQuery`로 페이지 전환 깜빡임 방지
- 노트 전환 시 `keepPreviousData`로 레이아웃 안정성 유지
