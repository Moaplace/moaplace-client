# 00. 퀵 레퍼런스

> MoaPlace 클라이언트 개발 가이드 요약. 상세 내용은 각 문서 링크 참조.

---

## 기술스택

> 상세: [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)

| 구분 | 기술 |
|------|------|
| 빌드 | Vite |
| 프레임워크 | React 18 + TypeScript (strict) |
| 라우팅 | React Router v6 |
| 스타일링 | Tailwind CSS + MoaPlace 컬러 시스템 (18색) |
| 상태 관리 | Zustand (roomStore, uiStore) |
| 지도 | @vis.gl/react-google-maps |
| 3D | Three.js + @react-three/fiber + drei |
| HTTP | Axios (3초 Polling) |
| PWA | vite-plugin-pwa + Workbox |
| UI 패턴 | shadcn/ui 스타일 |

## 폴더 구조

> 상세: [02_FOLDER_STRUCTURE.md](./02_FOLDER_STRUCTURE.md)

```
src/
├── pages/          # 라우트 페이지 (HomePage, RoomPage)
├── components/     # UI 컴포넌트 (Map/, Three/, Panel/, Common/, Home/)
├── hooks/          # 커스텀 훅 (useMap, useRoom, useGeolocation, usePWA, useThreeView)
├── lib/            # 순수 유틸 (api, centroid, tsp, haversine, clipboard, utils)
├── store/          # Zustand 스토어 (roomStore, uiStore)
├── constants/      # 상수 (colors)
├── types/          # TypeScript 타입
└── styles/         # Tailwind 전역
```

### 파일 네이밍

| 종류 | 규칙 | 예시 |
|------|------|------|
| 페이지 | PascalCase + Page | `HomePage.tsx` |
| 컴포넌트 | PascalCase | `Button.tsx` |
| 훅 | use + PascalCase | `useMap.ts` |
| 유틸 | camelCase | `centroid.ts` |
| 스토어 | camelCase + Store | `roomStore.ts` |

## 코딩 규칙 체크리스트

> 상세: [03_CODE_CONVENTIONS.md](./03_CODE_CONVENTIONS.md)

### DO

- TypeScript strict 모드, `unknown` + 타입 좁히기
- `interface`로 객체 타입 정의
- `as const` 객체로 열거형
- 화살표 함수형 컴포넌트 + `default export`
- Zustand selector로 필요한 상태만 구독
- Tailwind 커스텀 컬러 토큰 사용
- `cn()` 유틸로 조건부 클래스
- 한국어 비격식체(해요체) 마이크로카피

### DON'T

- `any` 타입
- `enum`
- `class` 컴포넌트
- 인라인 `style={{}}`
- 하드코딩 색상 `#3B82F6`
- `index.ts` 배럴 export
- 전체 스토어 구독 `useStore()`
- 강요형 UX 문구 ("반드시 ~해야 합니다")

## 코드 생성 빠른 참조

> 상세: [04_CODE_GENERATION_GUIDE.md](./04_CODE_GENERATION_GUIDE.md)

### 컴포넌트 패턴

```tsx
// Props interface → 스타일 변형 → 컴포넌트 → export
interface ButtonProps { variant?: 'primary' | 'secondary'; ... }
const buttonStyles = { variant: { primary: '...', secondary: '...' } };
const Button = ({ variant = 'primary', ...props }: ButtonProps) => { ... };
export default Button;
```

### 스토어 패턴

```ts
// State interface → 초기값 → create
interface RoomState { room: Room | null; fetchRoom: (id: string) => Promise<void>; }
export const useRoomStore = create<RoomState>((set) => ({ ... }));
```

### 훅 패턴

```ts
// Return interface → useState/useEffect/useCallback → return
interface UseXxxReturn { data: T | null; isLoading: boolean; }
const useXxx = (): UseXxxReturn => { ... return { data, isLoading }; };
export default useXxx;
```

## 위젯 카탈로그

> 상세: [05_WIDGETS_GUIDE.md](./05_WIDGETS_GUIDE.md)

| 위젯 | 위치 | 용도 | 핵심 UX 법칙 |
|------|------|------|-------------|
| **Button** | Common/ | CTA, 보조 액션 | 피츠의 법칙 (44px+) |
| **Input** | Common/ | 텍스트/검색 입력 | 포스텔의 법칙 (유연한 입력) |
| **Toast** | Common/ | 완료/에러 피드백 | 피크엔드 법칙 (감정 공감) |
| **Modal** | Common/ | 닉네임 입력, 확인 | 1Thing/1Page |
| **BottomSheet** | Common/ | 위치 확정, 결과 패널 | 힉의 법칙 (그룹핑) |
| **PWAInstallBanner** | Common/ | PWA 설치 유도 | Suggest Over Force |

### 컬러 토큰 빠른 참조

```
배경: bg-white, bg-black-100, bg-primary-100, bg-sub-100
텍스트: text-black, text-black-800, text-black-600, text-black-400
CTA: bg-primary hover:bg-primary-600 active:bg-primary-700
보더: border-black-300
마커: bg-sub(내), bg-primary(타인), bg-error(중심점)
상태: text-success, text-error, text-warning, text-info
```

## 문서 목록

| # | 문서 | 설명 |
|---|------|------|
| 01 | [ARCHITECTURE](./01_ARCHITECTURE.md) | 시스템 구조, 기술스택, 데이터 플로우, API |
| 02 | [FOLDER_STRUCTURE](./02_FOLDER_STRUCTURE.md) | 디렉토리 역할, 파일 네이밍, import 순서 |
| 03 | [CODE_CONVENTIONS](./03_CODE_CONVENTIONS.md) | TS/React/Zustand/Tailwind/API/UX 라이팅 규칙 |
| 04 | [CODE_GENERATION_GUIDE](./04_CODE_GENERATION_GUIDE.md) | 컴포넌트/페이지/훅/스토어/유틸 생성 템플릿 |
| 05 | [WIDGETS_GUIDE](./05_WIDGETS_GUIDE.md) | UI 컴포넌트 카탈로그 (Toss UX + 컬러 + shadcn/ui) |
