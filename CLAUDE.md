# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**모아장소 (MoaPlace)** — 여러 사람의 위치를 모아 최적의 중간지점을 찾아주는 PWA 서비스

**Tech Stack:** Vite · React 18 · TypeScript (strict) · Tailwind CSS · Zustand · Axios · React Router v6 · @vis.gl/react-google-maps · Three.js + R3F · vite-plugin-pwa · shadcn/ui 패턴

---

## Commands

```bash
npm run dev        # 개발 서버 (Vite HMR)
npm run build      # tsc -b && vite build
npm run lint       # ESLint v9 (flat config)
npm run preview    # 프로덕션 빌드 프리뷰
```

---

## Architecture

**3계층:** Client(React+Vite+PWA) → Server(Spring Boot 3.x) → Redis(TTL 24h)

**클린 아키텍처 (DIP):** 외부 의존(API, Storage)은 반드시 Port(인터페이스) → Adapter(구현체) → Factory(선택) 구조로 설계. 스토어/훅은 인터페이스에만 의존.

```
src/
├── pages/          # 라우트 페이지 (HomePage, RoomPage)
├── components/     # UI 컴포넌트 (Map/, Three/, Panel/, Common/, Home/)
├── hooks/          # 커스텀 훅 (useMap, useRoom, useGeolocation, usePWA, useThreeView)
├── lib/            # 유틸 + API 레이어 (Port/Adapter/Factory 패턴)
│   ├── api.interface.ts  # Port — ApiClient 인터페이스
│   ├── api.mock.ts       # Adapter — localStorage 목업
│   ├── api.ts            # Factory — 구현체 선택 및 export
│   └── *.ts              # 순수 유틸 (centroid, tsp, haversine, utils)
├── store/          # Zustand 스토어 (roomStore, uiStore)
├── constants/      # 상수 (colors — AppColors 18색)
├── types/          # TypeScript 타입
└── styles/         # Tailwind 전역
```

**데이터 플로우:** 방 생성(UUID) → URL 공유 → 마커 등록 → Polling(3초) → 중심점/TSP 계산 → 결과 표시

> 상세: [docs/01_ARCHITECTURE.md](docs/01_ARCHITECTURE.md)

---

## Design System (하드코딩 금지)

**핵심 규칙:** 매칭되는 컬러 토큰이 있으면 HEX 하드코딩 절대 금지.

- **AppColors** → `src/constants/colors.ts` (18색)
- **Tailwind 커스텀 컬러** → `tailwind.config.ts`에서 AppColors 매핑

```
배경: bg-white, bg-black-100, bg-primary-100, bg-sub-100
텍스트: text-black, text-black-800, text-black-600, text-black-400
CTA: bg-primary hover:bg-primary-600 active:bg-primary-700
보더: border-black-300
마커: bg-sub(내), bg-primary(타인), bg-error(중심점)
상태: text-success, text-error, text-warning, text-info
```

> 전체 컬러 시스템: [docs/Moaplace_ColorSystem.md](docs/Moaplace_ColorSystem.md)

---

## Common Widgets

**새 위젯 만들기 전에 반드시 [docs/05_WIDGETS_GUIDE.md](docs/05_WIDGETS_GUIDE.md) 확인!**

핵심: `Button`(4 variant), `Input`, `Toast`(4 variant), `Modal`, `BottomSheet`, `PWAInstallBanner`

Toss UI/UX 원칙 적용 — 터치 44px+, 1Thing/1Page, 스켈레톤 UI, 비격식체(해요체)

> UX 원칙: [docs/TOSS_UI_UX_DESIGN.md](docs/TOSS_UI_UX_DESIGN.md)

---

## Coding Rules

### DO

- TypeScript strict, `unknown` + 타입 좁히기, `interface`로 객체 타입
- `as const` 객체로 열거형, 화살표 함수형 컴포넌트 + `default export`
- Zustand selector로 필요한 상태만 구독
- Tailwind 커스텀 컬러 토큰 + `cn()` 유틸로 조건부 클래스
- 한국어 비격식체(해요체) 마이크로카피
- **클린 아키텍처: 외부 의존은 Port(interface) → Adapter(구현체) → Factory(export) 구조**

### DON'T

- `any`, `enum`, `class` 컴포넌트
- 인라인 `style={{}}`, 하드코딩 색상
- `index.ts` 배럴 export, 전체 스토어 구독
- 강요형 UX 문구 ("반드시 ~해야 합니다")
- **스토어/훅에서 구현체 직접 import (반드시 Factory를 통해 접근)**

> 상세: [docs/03_CODE_CONVENTIONS.md](docs/03_CODE_CONVENTIONS.md)

---

## Naming Rules

```
페이지: PascalCase + Page.tsx     (HomePage.tsx)
컴포넌트: PascalCase.tsx           (Button.tsx, MapView.tsx)
훅: use + PascalCase.ts           (useMap.ts, useRoom.ts)
유틸: camelCase.ts                (centroid.ts, haversine.ts)
스토어: camelCase + Store.ts      (roomStore.ts, uiStore.ts)
```

**import 순서:** React → 외부 라이브러리 → 내부 모듈 → 타입 → 스타일 (그룹 사이 빈 줄)

> 상세: [docs/02_FOLDER_STRUCTURE.md](docs/02_FOLDER_STRUCTURE.md)

---

## Code Generation Patterns

```tsx
// 컴포넌트: Props interface → 스타일 변형 → 컴포넌트 → export
interface ButtonProps { variant?: 'primary' | 'secondary'; ... }
const Button = ({ variant = 'primary' }: ButtonProps) => { ... };
export default Button;

// 스토어: State interface → 초기값 → create
interface RoomState { room: Room | null; fetchRoom: (id: string) => Promise<void>; }
export const useRoomStore = create<RoomState>((set) => ({ ... }));

// 훅: Return interface → useState/useEffect/useCallback → return
const useXxx = (): UseXxxReturn => { ... return { data, isLoading }; };
export default useXxx;
```

> 상세: [docs/04_CODE_GENERATION_GUIDE.md](docs/04_CODE_GENERATION_GUIDE.md)

---

## Git Conventions

```
<type>: <한글 설명>
# type: feat, fix, refactor, style, chore, docs, test
```

**Co-Authored-By 태그 절대 금지.**

---

## Key References

| 문서 | 설명 |
|------|------|
| [docs/00_QUICK_REFERENCE.md](docs/00_QUICK_REFERENCE.md) | 퀵 레퍼런스 (전체 요약) |
| [docs/01_ARCHITECTURE.md](docs/01_ARCHITECTURE.md) | 시스템 구조, 기술스택, 데이터 플로우, API |
| [docs/02_FOLDER_STRUCTURE.md](docs/02_FOLDER_STRUCTURE.md) | 디렉토리 역할, 파일 네이밍, import 순서 |
| [docs/03_CODE_CONVENTIONS.md](docs/03_CODE_CONVENTIONS.md) | TS/React/Zustand/Tailwind/API/UX 라이팅 규칙 |
| [docs/04_CODE_GENERATION_GUIDE.md](docs/04_CODE_GENERATION_GUIDE.md) | 컴포넌트/페이지/훅/스토어/유틸 생성 템플릿 |
| [docs/05_WIDGETS_GUIDE.md](docs/05_WIDGETS_GUIDE.md) | UI 컴포넌트 카탈로그 (Toss UX + 컬러 + shadcn/ui) |
| [docs/PRD.md](docs/PRD.md) | 프로젝트 기획서 (PRD v1.2) |
| [docs/TOSS_UI_UX_DESIGN.md](docs/TOSS_UI_UX_DESIGN.md) | UX 원칙 & 라이팅 가이드 |
| [docs/Moaplace_ColorSystem.md](docs/Moaplace_ColorSystem.md) | 컬러 시스템 v2.1 (18색) |

---

**Last Updated:** 2026-02-28
