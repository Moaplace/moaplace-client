# 02. 폴더 구조

> MoaPlace 클라이언트의 디렉토리 구조, 각 폴더 역할, 파일 네이밍 규칙

---

## 1. 디렉토리 트리

```
moaplace-client/
├── public/
│   ├── manifest.json               # PWA 매니페스트
│   ├── icons/                      # PWA 아이콘
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # 엔트리 포인트
│   ├── App.tsx                     # React Router 설정
│   ├── pages/                      # 페이지 컴포넌트
│   │   ├── HomePage.tsx
│   │   └── RoomPage.tsx
│   ├── components/                 # UI 컴포넌트
│   │   ├── Map/                    # 2D 지도 관련
│   │   │   ├── MapView.tsx
│   │   │   ├── Marker.tsx
│   │   │   ├── CenterPoint.tsx
│   │   │   └── RouteLine.tsx
│   │   ├── Three/                  # Three.js 3D
│   │   │   ├── Scene3D.tsx
│   │   │   ├── Marker3D.tsx
│   │   │   ├── Route3D.tsx
│   │   │   ├── CenterEffect.tsx
│   │   │   └── Controls.tsx
│   │   ├── Panel/                  # 하단 패널
│   │   │   ├── ResultPanel.tsx
│   │   │   └── ParticipantList.tsx
│   │   ├── Common/                 # 공통 UI (shadcn/ui 패턴)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── PWAInstallBanner.tsx
│   │   └── Home/
│   │       └── CreateRoom.tsx
│   ├── hooks/                      # 커스텀 훅
│   │   ├── useMap.ts
│   │   ├── useRoom.ts
│   │   ├── useGeolocation.ts
│   │   ├── usePWA.ts
│   │   └── useThreeView.ts
│   ├── lib/                        # 유틸리티 / 핵심 로직
│   │   ├── api.ts
│   │   ├── centroid.ts
│   │   ├── tsp.ts
│   │   ├── haversine.ts
│   │   ├── clipboard.ts
│   │   └── utils.ts                # cn() 등 공통 유틸
│   ├── store/                      # Zustand 스토어
│   │   ├── roomStore.ts
│   │   └── uiStore.ts
│   ├── constants/                  # 상수 정의
│   │   └── colors.ts               # AppColors (컬러 시스템)
│   ├── types/                      # TypeScript 타입
│   │   └── index.ts
│   └── styles/
│       └── globals.css             # Tailwind 전역 스타일
├── docs/                           # 프로젝트 문서
│   ├── PRD.md
│   ├── TOSS_UI_UX_DESIGN.md
│   ├── Moaplace_ColorSystem.md
│   └── plans/                      # 가이드 문서
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env                            # VITE_GOOGLE_MAPS_API_KEY 등
└── package.json
```

## 2. 디렉토리별 역할

| 디렉토리 | 역할 | 포함 파일 |
|-----------|------|-----------|
| `pages/` | 라우트와 1:1 매핑되는 페이지 컴포넌트 | `HomePage.tsx`, `RoomPage.tsx` |
| `components/` | 재사용 가능한 UI 컴포넌트, 도메인별 하위 폴더로 그룹핑 | `Map/`, `Three/`, `Panel/`, `Common/`, `Home/` |
| `components/Common/` | 도메인 무관 공통 UI (shadcn/ui 패턴) | `Button`, `Input`, `Toast`, `Modal` |
| `hooks/` | 커스텀 React 훅. 로직 재사용 단위 | `useMap`, `useRoom`, `useGeolocation` |
| `lib/` | 순수 함수 유틸리티. React에 의존하지 않는 로직 | `api`, `centroid`, `tsp`, `haversine` |
| `store/` | Zustand 전역 상태 스토어 | `roomStore`, `uiStore` |
| `constants/` | 앱 전역 상수 (컬러, 설정값 등) | `colors.ts` |
| `types/` | TypeScript 타입/인터페이스 정의 | `index.ts` |
| `styles/` | Tailwind 전역 스타일 | `globals.css` |

## 3. 파일 네이밍 규칙

| 종류 | 네이밍 | 확장자 | 예시 |
|------|--------|--------|------|
| 페이지 컴포넌트 | PascalCase + `Page` 접미사 | `.tsx` | `HomePage.tsx`, `RoomPage.tsx` |
| UI 컴포넌트 | PascalCase | `.tsx` | `Button.tsx`, `MapView.tsx` |
| 커스텀 훅 | `use` + PascalCase | `.ts` | `useMap.ts`, `useRoom.ts` |
| 유틸리티 | camelCase | `.ts` | `centroid.ts`, `haversine.ts` |
| 스토어 | camelCase + `Store` 접미사 | `.ts` | `roomStore.ts`, `uiStore.ts` |
| 상수 | camelCase | `.ts` | `colors.ts` |
| 타입 | camelCase | `.ts` | `index.ts` |

## 4. import 순서 규칙

파일 내 import는 아래 순서를 따른다. 그룹 사이에 빈 줄을 넣는다:

```tsx
// 1. React 및 React 관련
import { useState, useEffect } from 'react';

// 2. 외부 라이브러리
import { Map } from '@vis.gl/react-google-maps';
import { create } from 'zustand';

// 3. 내부 모듈 (절대 경로 또는 상대 경로)
import { useRoom } from '@/hooks/useRoom';
import { Button } from '@/components/Common/Button';
import { calculateCentroid } from '@/lib/centroid';
import { useRoomStore } from '@/store/roomStore';

// 4. 타입 (type-only import)
import type { Room, Marker } from '@/types';

// 5. 스타일
import './MapView.css';
```

## 5. 컴포넌트 폴더 구조 규칙

- **단일 파일 컴포넌트:** 컴포넌트 하나 = 파일 하나 (index.ts 배럴 export 없음)
- **도메인별 그룹핑:** `Map/`, `Three/`, `Panel/` 등 기능 도메인으로 분류
- **Common/:** 2개 이상의 도메인에서 사용되는 컴포넌트만 이동
- **페이지 전용 컴포넌트:** 해당 도메인 폴더에 배치 (예: `Home/CreateRoom.tsx`)
