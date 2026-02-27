# MoaPlace 프로젝트 문서 생성 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** PRD 기반으로 AI와 개발자가 참조하는 통합 가이드 문서 6개를 `docs/plans/`에 생성한다.

**Architecture:** 01~05 문서를 먼저 생성하고, 00_QUICK_REFERENCE를 마지막에 생성하여 나머지 5개를 인덱싱한다. 각 문서는 PRD에서 파생하되, 코드 생성에 즉시 사용 가능한 구체적 규칙과 예시를 포함한다.

**Tech Stack:** Markdown, PRD v1.2, Toss UI/UX 원칙, MoaPlace 컬러 시스템 v2.1, shadcn/ui 패턴

**참조 문서:**
- `docs/PRD.md` — 프로젝트 기획서 (섹션 8~11 중심)
- `docs/TOSS_UI_UX_DESIGN.md` — Toss UI/UX 디자인 법칙 10가지 + 라이팅 8원칙
- `docs/Moaplace_ColorSystem.md` — MoaPlace 컬러 시스템 v2.1 (18색)

---

### Task 1: 01_ARCHITECTURE.md — 시스템 아키텍처

**Files:**
- Create: `docs/plans/01_ARCHITECTURE.md`

**Step 1: 문서 작성**

아래 내용으로 파일을 생성한다:

```markdown
# 01. 시스템 아키텍처

> MoaPlace 클라이언트의 전체 시스템 구조와 기술 선정 근거

---

## 1. 시스템 개요

여러 사람의 위치를 모아 최적의 중간지점을 찾아주는 PWA 서비스.
로그인 없이 URL 공유만으로 즉시 사용 가능한 경량 위치 기반 앱이다.

```
┌─────────────────────────────────────────────────┐
│                   Client (PWA)                   │
│  React + Vite + TypeScript + Tailwind + Three.js │
│                                                   │
│  Vercel 배포                                      │
└──────────────────────┬──────────────────────────┘
                       │ REST API (Axios)
                       │ Polling 3초 간격
                       ▼
┌─────────────────────────────────────────────────┐
│                Server (Spring Boot 3.x)          │
│  Java 17+ / RESTful API / Swagger                │
│                                                   │
│  AWS EC2 / Railway 배포                           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                Redis (Docker)                     │
│  TTL 24시간 임시 저장 / Hash 구조                 │
└─────────────────────────────────────────────────┘
```

## 2. 프론트엔드 기술스택

| 구분 | 기술 | 선정 이유 |
|------|------|-----------|
| 빌드 도구 | **Vite** | 빠른 HMR, PWA 플러그인 생태계 |
| 프레임워크 | **React 18** | 컴포넌트 기반 UI, Three.js 통합 용이 |
| 라우팅 | **React Router v6** | SPA 라우팅, 동적 경로 (`/room/:id`) |
| 언어 | **TypeScript** | strict 모드, 타입 안정성 |
| 스타일링 | **Tailwind CSS** | 빠른 UI 개발, 리스폰시브 |
| 상태 관리 | **Zustand** | 경량, 보일러플레이트 최소화 |
| 지도 | **@vis.gl/react-google-maps** | Google Maps 공식 React 라이브러리 |
| 3D | **Three.js + @react-three/fiber + @react-three/drei** | 3D 시각화, React 생태계 통합 |
| PWA | **vite-plugin-pwa** | Vite 네이티브 통합, Workbox 자동 설정 |
| HTTP | **Axios** | API 통신 및 Polling 구현 |
| UI 컴포넌트 | **shadcn/ui 패턴** | Radix 기반, 커스터마이징 용이 |

## 3. 데이터 플로우

```
[방 생성] → POST /api/rooms → UUID 발급
    │
    ▼
[URL 공유] → https://moaplace.com/room/{uuid}
    │
    ▼
[참여자 접속] → GET /api/rooms/{roomId} → 기존 마커 표시
    │
    ▼
[위치 등록] → POST /api/rooms/{roomId}/markers → 마커 저장
    │
    ▼
[실시간 동기화] → GET /api/rooms/{roomId} (3초 Polling)
    │
    ▼
[결과 계산] → GET /api/rooms/{roomId}/result
    │           → 중심점(산술 평균) + 최단거리(TSP)
    ▼
[결과 표시] → 지도 위 중심점 마커 + 경로 폴리라인
```

## 4. API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/rooms` | 방 생성 (UUID 발급) |
| `GET` | `/api/rooms/{roomId}` | 방 정보 조회 (마커 목록 포함) |
| `POST` | `/api/rooms/{roomId}/markers` | 마커 등록 |
| `DELETE` | `/api/rooms/{roomId}/markers/{markerId}` | 마커 삭제 |
| `GET` | `/api/rooms/{roomId}/result` | 중심점 + 최단거리 결과 |

## 5. 핵심 알고리즘

### 5.1 중심점 계산 (Geometric Centroid)

모든 마커의 좌표 산술 평균:

```
centroid_lat = (lat1 + lat2 + ... + latN) / N
centroid_lng = (lng1 + lng2 + ... + lngN) / N
```

### 5.2 최단거리 경로 (TSP)

- **10명 이하:** Brute-force 순열 탐색 (10! = 3,628,800)
- **10명 초과:** Nearest Neighbor 휴리스틱

### 5.3 거리 계산 (Haversine)

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c    (R = 6,371km)
```

## 6. 상태 관리 전략

Zustand 2개 스토어로 관심사 분리:

| 스토어 | 파일 | 책임 |
|--------|------|------|
| **roomStore** | `src/store/roomStore.ts` | 방 정보, 마커 목록, 중심점, 경로 |
| **uiStore** | `src/store/uiStore.ts` | 모달, 토스트, 3D 토글, 로딩 상태 |

## 7. PWA 전략

- **Service Worker:** Workbox 기반, 정적 자산 프리캐시, API는 Network First
- **Manifest:** standalone 모드, 아이콘 192/512, 테마 컬러
- **설치 프롬프트:** `beforeinstallprompt` 이벤트 커스텀 배너
- **오프라인:** 안내 페이지 표시 (지도 기능은 온라인 필수)
```

**Step 2: 커밋**

```bash
git add docs/plans/01_ARCHITECTURE.md
git commit -m "docs: add architecture document"
```

---

### Task 2: 02_FOLDER_STRUCTURE.md — 폴더 구조

**Files:**
- Create: `docs/plans/02_FOLDER_STRUCTURE.md`

**Step 1: 문서 작성**

아래 내용으로 파일을 생성한다:

```markdown
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
```

**Step 2: 커밋**

```bash
git add docs/plans/02_FOLDER_STRUCTURE.md
git commit -m "docs: add folder structure document"
```

---

### Task 3: 03_CODE_CONVENTIONS.md — 코딩 컨벤션

**Files:**
- Create: `docs/plans/03_CODE_CONVENTIONS.md`

**Step 1: 문서 작성**

아래 내용으로 파일을 생성한다:

```markdown
# 03. 코딩 컨벤션

> MoaPlace 클라이언트의 TypeScript, React, 상태 관리, 스타일링, API, UX 라이팅 규칙

---

## 1. TypeScript 규칙

### 1.1 기본 설정

- **strict 모드** 필수 (`tsconfig.json`에서 활성화 완료)
- `any` 사용 금지 — `unknown`으로 대체 후 타입 좁히기(narrowing)
- 타입 정의는 `src/types/index.ts`에 중앙 관리

### 1.2 interface vs type

- **interface:** 객체 형태 정의에 사용 (컴포넌트 Props, API 응답, 도메인 모델)
- **type:** 유니온, 교차, 유틸리티 타입에만 사용

```ts
// DO: 객체는 interface
interface Room {
  id: string;
  name: string;
  markers: Marker[];
  createdAt: string;
}

interface Marker {
  id: string;
  nickname: string;
  lat: number;
  lng: number;
}

// DO: 유니온/유틸리티는 type
type ViewMode = '2d' | '3d';
type RoomWithResult = Room & { centroid: Centroid };

// DON'T: 객체를 type으로 정의하지 않는다
type Room = { id: string; ... }  // ✗
```

### 1.3 열거형

- `enum` 사용 금지 — `as const` 객체로 대체

```ts
// DO
const VIEW_MODE = {
  MAP_2D: '2d',
  THREE_3D: '3d',
} as const;

type ViewMode = typeof VIEW_MODE[keyof typeof VIEW_MODE];

// DON'T
enum ViewMode { MAP_2D = '2d', THREE_3D = '3d' }  // ✗
```

## 2. React 컴포넌트 규칙

### 2.1 컴포넌트 선언

- 함수형 컴포넌트 + **화살표 함수** 사용
- Props interface는 컴포넌트 파일 상단에 정의
- `default export` 사용

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({ variant = 'primary', size = 'md', children, onClick, disabled }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
```

### 2.2 이벤트 핸들러 네이밍

- Props로 전달: `onXxx` (예: `onClick`, `onSubmit`)
- 내부 핸들러: `handleXxx` (예: `handleClick`, `handleSubmit`)

```tsx
// 부모에서 전달
<MapView onMarkerPlace={handleMarkerPlace} />

// 자식 내부
const MapView = ({ onMarkerPlace }: MapViewProps) => {
  const handleMapClick = (e: MapMouseEvent) => {
    const position = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
    onMarkerPlace(position);
  };
  ...
};
```

### 2.3 조건부 렌더링

- 단순 조건: `&&` 또는 삼항 연산자
- 복잡한 분기: 조기 return

```tsx
// DO: 단순 조건
{markers.length >= 2 && <CenterPoint position={centroid} />}
{isLoading ? <Skeleton /> : <ResultPanel data={result} />}

// DO: 복잡한 분기
if (!room) return <LoadingSpinner />;
if (room.markers.length === 0) return <EmptyState />;
return <MapView room={room} />;
```

## 3. 상태 관리 (Zustand)

### 3.1 스토어 구조

- interface 정의 → `create()` → selector export 패턴
- 비동기 로직은 스토어 액션 내부에서 처리

```ts
import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Room, Marker } from '@/types';

interface RoomState {
  room: Room | null;
  isLoading: boolean;
  error: string | null;

  fetchRoom: (roomId: string) => Promise<void>;
  addMarker: (roomId: string, marker: Omit<Marker, 'id'>) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  isLoading: false,
  error: null,

  fetchRoom: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.getRoom(roomId);
      set({ room, isLoading: false });
    } catch (e) {
      set({ error: '방 정보를 불러올 수 없어요', isLoading: false });
    }
  },

  addMarker: async (roomId, marker) => {
    try {
      const newMarker = await api.addMarker(roomId, marker);
      set((state) => ({
        room: state.room
          ? { ...state.room, markers: [...state.room.markers, newMarker] }
          : null,
      }));
    } catch (e) {
      set({ error: '위치 등록에 실패했어요' });
    }
  },
}));
```

### 3.2 selector 사용

컴포넌트에서 필요한 상태만 구독하여 불필요한 리렌더링 방지:

```tsx
// DO: 필요한 상태만 selector로 구독
const markers = useRoomStore((state) => state.room?.markers ?? []);
const isLoading = useRoomStore((state) => state.isLoading);

// DON'T: 전체 스토어 구독
const { room, isLoading, error } = useRoomStore();  // ✗ 리렌더링 과다
```

## 4. 스타일링 (Tailwind CSS)

### 4.1 기본 규칙

- MoaPlace 컬러 시스템 커스텀 컬러 사용 (`docs/Moaplace_ColorSystem.md` 참조)
- 인라인 `style` 지양 — Tailwind 클래스로 처리
- 하드코딩 색상 금지 — `bg-primary`, `text-black-800` 등 커스텀 토큰 사용

### 4.2 cn() 유틸리티

조건부 클래스 조합에 `clsx` + `tailwind-merge` 사용:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

```tsx
// 사용 예시
<button className={cn(
  'px-4 py-2 rounded-lg font-medium transition-colors',
  variant === 'primary' && 'bg-primary hover:bg-primary-600 active:bg-primary-700 text-white',
  variant === 'secondary' && 'border border-black-300 text-black-800 hover:bg-black-100',
  disabled && 'opacity-50 cursor-not-allowed',
)}>
```

### 4.3 반응형 디자인

모바일 퍼스트 접근:

```tsx
// 모바일 → 태블릿 → 데스크톱 순서
<div className="px-4 md:px-8 lg:px-16">
  <h1 className="text-xl md:text-2xl lg:text-3xl">
```

## 5. API 통신 (Axios)

### 5.1 API 클라이언트 구조

```ts
// src/lib/api.ts
import axios from 'axios';
import type { Room, Marker, RoomResult } from '@/types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  createRoom: (name?: string) =>
    client.post<Room>('/rooms', { name }).then((res) => res.data),

  getRoom: (roomId: string) =>
    client.get<Room>(`/rooms/${roomId}`).then((res) => res.data),

  addMarker: (roomId: string, marker: Omit<Marker, 'id'>) =>
    client.post<Marker>(`/rooms/${roomId}/markers`, marker).then((res) => res.data),

  deleteMarker: (roomId: string, markerId: string) =>
    client.delete(`/rooms/${roomId}/markers/${markerId}`),

  getResult: (roomId: string) =>
    client.get<RoomResult>(`/rooms/${roomId}/result`).then((res) => res.data),
};
```

### 5.2 에러 핸들링

```ts
try {
  const room = await api.getRoom(roomId);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      // 방을 찾을 수 없는 경우
    }
  }
}
```

## 6. UX 라이팅 규칙

> `docs/TOSS_UI_UX_DESIGN.md`의 Toss 8원칙 기반

### 6.1 톤 앤 매너

- **한국어 비격식체** 사용 (해요체)
- 전문 용어 최소화 — 일반 사용자가 이해 가능한 표현
- 한 문장에 하나의 메시지만 담기

### 6.2 주요 마이크로카피

| UI 요소 | 텍스트 | 적용 원칙 |
|---------|--------|-----------|
| CTA 버튼 | "새로운 모임 만들기" | Predictable Hint |
| 위치 확정 | "여기로 확정!" | Focus on Key Message |
| 빈 상태 | "아직 아무도 위치를 찍지 않았어요. 첫 번째로 찍어볼까요?" | Find Hidden Emotion |
| 등록 완료 | "위치가 등록되었어요!" | Peak-End Rule |
| 링크 복사 | "링크가 복사되었어요! 친구들에게 공유해보세요" | Find Hidden Emotion |
| 에러 | "위치를 가져올 수 없었어요. 다시 시도해볼까요?" | Suggest Over Force |
| 플레이스홀더 | "모임 이름을 입력해주세요 (예: 주말 점심 모임)" | Easy to Speak |

### 6.3 금지 표현

- 강요형: "반드시 ~해야 합니다" → "~해보세요"
- 공포형: "이 기능을 놓치면 ~" → 삭제
- 전문 용어: "API 호출 실패" → "정보를 가져올 수 없었어요"
- 불필요한 단어: "혹시", "앞으로", "현재" → 제거
```

**Step 2: 커밋**

```bash
git add docs/plans/03_CODE_CONVENTIONS.md
git commit -m "docs: add code conventions document"
```

---

### Task 4: 04_CODE_GENERATION_GUIDE.md — AI 코드 생성 가이드

**Files:**
- Create: `docs/plans/04_CODE_GENERATION_GUIDE.md`

**Step 1: 문서 작성**

아래 내용으로 파일을 생성한다:

```markdown
# 04. 코드 생성 가이드

> AI 및 개발자가 코드 생성 시 따라야 할 템플릿과 패턴.
> 모든 코드는 `03_CODE_CONVENTIONS.md`를 준수한다.

---

## 1. 컴포넌트 생성 템플릿

### 1.1 공통 UI 컴포넌트 (shadcn/ui 패턴)

`src/components/Common/` 하위에 생성:

```tsx
import { cn } from '@/lib/utils';

// --- 1. Props interface ---
interface ComponentNameProps {
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

// --- 2. 변형 스타일 (선택) ---
const componentVariants = {
  variant: {
    default: 'bg-primary text-white',
    secondary: 'border border-black-300 text-black-800',
  },
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
};

// --- 3. 컴포넌트 ---
const ComponentName = ({
  variant = 'default',
  size = 'md',
  className,
  children,
}: ComponentNameProps) => {
  return (
    <div
      className={cn(
        'base-styles-here',
        componentVariants.variant[variant],
        componentVariants.size[size],
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ComponentName;
```

### 1.2 도메인 컴포넌트

`src/components/{Domain}/` 하위에 생성:

```tsx
import { useRoomStore } from '@/store/roomStore';
import type { Marker } from '@/types';

interface MarkerItemProps {
  marker: Marker;
  isOwn: boolean;
}

const MarkerItem = ({ marker, isOwn }: MarkerItemProps) => {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg',
      isOwn ? 'bg-sub-100' : 'bg-black-100',
    )}>
      <span className={cn(
        'w-3 h-3 rounded-full',
        isOwn ? 'bg-sub' : 'bg-primary',
      )} />
      <span className="text-black-800 font-medium">{marker.nickname}</span>
    </div>
  );
};

export default MarkerItem;
```

## 2. 페이지 생성 템플릿

`src/pages/` 하위에 생성:

```tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomStore } from '@/store/roomStore';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const fetchRoom = useRoomStore((state) => state.fetchRoom);
  const room = useRoomStore((state) => state.room);
  const isLoading = useRoomStore((state) => state.isLoading);

  useEffect(() => {
    if (roomId) fetchRoom(roomId);
  }, [roomId, fetchRoom]);

  if (isLoading) return <LoadingSpinner />;
  if (!room) return <NotFound />;

  return (
    <div className="h-screen flex flex-col">
      {/* 페이지 내용 */}
    </div>
  );
};

export default RoomPage;
```

## 3. 커스텀 훅 생성 템플릿

`src/hooks/` 하위에 생성:

```ts
import { useState, useEffect, useCallback } from 'react';

interface UseGeolocationReturn {
  position: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        setError('위치를 가져올 수 없었어요');
        setIsLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { position, error, isLoading, refresh };
};

export default useGeolocation;
```

## 4. Zustand 스토어 생성 템플릿

`src/store/` 하위에 생성:

```ts
import { create } from 'zustand';

// --- 1. State interface ---
interface ExampleState {
  // 상태
  data: string | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  fetchData: () => Promise<void>;
  reset: () => void;
}

// --- 2. 초기값 ---
const initialState = {
  data: null,
  isLoading: false,
  error: null,
};

// --- 3. 스토어 생성 ---
export const useExampleStore = create<ExampleState>((set) => ({
  ...initialState,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getData();
      set({ data, isLoading: false });
    } catch {
      set({ error: '데이터를 불러올 수 없어요', isLoading: false });
    }
  },

  reset: () => set(initialState),
}));
```

## 5. 유틸리티 함수 생성 템플릿

`src/lib/` 하위에 생성:

```ts
// 순수 함수, React 의존성 없음
// JSDoc 주석으로 입력/출력 설명

/**
 * 두 좌표 사이의 거리를 Haversine 공식으로 계산한다.
 * @param lat1 - 출발지 위도
 * @param lng1 - 출발지 경도
 * @param lat2 - 도착지 위도
 * @param lng2 - 도착지 경도
 * @returns 거리 (km)
 */
export const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => (deg * Math.PI) / 180;
```

## 6. 금지 패턴

| 금지 | 대안 |
|------|------|
| `any` 타입 | `unknown` + 타입 좁히기 |
| `enum` | `as const` 객체 |
| `class` 컴포넌트 | 함수형 컴포넌트 |
| 인라인 `style={}` | Tailwind 클래스 |
| 하드코딩 색상 `#3B82F6` | `bg-primary`, `text-primary` |
| `index.ts` 배럴 export | 직접 파일 import |
| `useEffect` 내 데이터 fetch | Zustand 액션으로 분리 |
| 전체 스토어 구독 `useStore()` | selector 구독 `useStore((s) => s.field)` |
| `console.log` (배포 코드) | 제거 또는 에러만 `console.error` |
| `!important` (CSS) | Tailwind 클래스 우선순위로 해결 |
```

**Step 2: 커밋**

```bash
git add docs/plans/04_CODE_GENERATION_GUIDE.md
git commit -m "docs: add code generation guide document"
```

---

### Task 5: 05_WIDGETS_GUIDE.md — 위젯/컴포넌트 가이드

**Files:**
- Create: `docs/plans/05_WIDGETS_GUIDE.md`

**Step 1: 문서 작성**

아래 내용으로 파일을 생성한다. Toss UI/UX 원칙 + MoaPlace 컬러 시스템 + shadcn/ui 패턴을 적용:

```markdown
# 05. 위젯 가이드

> MoaPlace 공통 UI 컴포넌트 카탈로그.
> Toss UI/UX 원칙 + MoaPlace 컬러 시스템(18색) + shadcn/ui 패턴 기반.

---

## 1. 디자인 원칙 — Toss UX 법칙 적용

MoaPlace 위젯은 다음 UX 법칙을 따른다:

| 법칙 | 위젯 적용 |
|------|-----------|
| **피츠의 법칙** | 터치 영역 최소 44px, CTA 버튼은 하단 배치 |
| **힉의 법칙** | 한 화면에 하나의 주요 액션, 선택지 최소화 |
| **밀러의 법칙** | 참여자 목록 등 정보를 청크 단위로 그룹핑 |
| **피크엔드 법칙** | 에러/완료 화면에 친근한 문구 + 부드러운 애니메이션 |
| **도허티 임계** | 로딩 시 스켈레톤 UI 제공 (0.4초 이내 피드백) |
| **심미적 사용성** | 둥근 모서리(rounded-lg 이상), 캐주얼한 톤 |
| **포스텔의 법칙** | 입력은 유연하게, 요청 정보는 최소한으로 (1Thing/1Page) |
| **폰 레스토프 효과** | PWA 설치 배너, 중심점 마커에만 강조색 사용 |

## 2. 컬러 시스템 요약

> 상세: `docs/Moaplace_ColorSystem.md`

### 2.1 팔레트 (18색)

| 카테고리 | 토큰 | HEX | Tailwind 클래스 |
|----------|------|-----|-----------------|
| **Black~White** | `white` | #FFFFFF | `bg-white` |
| | `black` | #0A0E12 | `text-black` |
| | `black800` | #1E293B | `text-black-800` |
| | `black600` | #475569 | `text-black-600` |
| | `black400` | #94A3B8 | `text-black-400` |
| | `black300` | #CBD5E1 | `border-black-300` |
| | `black100` | #F1F5F9 | `bg-black-100` |
| **Primary** | `primary` | #3B82F6 | `bg-primary` |
| | `primary700` | #1D4ED8 | `active:bg-primary-700` |
| | `primary600` | #2563EB | `hover:bg-primary-600` |
| | `primary100` | #DBEAFE | `bg-primary-100` |
| **Sub** | `sub` | #C2410C | `bg-sub` |
| | `sub600` | #9A3412 | `hover:bg-sub-600` |
| | `sub100` | #FFEDD5 | `bg-sub-100` |
| **Status** | `success` | #15803D | `text-success` |
| | `error` | #DC2626 | `text-error` |
| | `warning` | #A16207 | `text-warning` |
| | `info` | #0369A1 | `text-info` |

### 2.2 마커 색상

| 마커 | 색상 | Tailwind |
|------|------|----------|
| 내 마커 | `sub` #C2410C | `bg-sub` |
| 다른 참여자 | `primary` #3B82F6 | `bg-primary` |
| 중심점 | `error` #DC2626 | `bg-error` |
| 경로 라인 | `primary` #3B82F6 | `stroke-primary` |

## 3. 타이포그래피

| 계층 | Tailwind 클래스 | 색상 | 용도 |
|------|-----------------|------|------|
| 헤딩 | `text-xl font-bold` | `text-black` | 페이지 타이틀, 섹션 제목 |
| 서브헤딩 | `text-lg font-semibold` | `text-black-800` | 카드 제목, 라벨 |
| 본문 | `text-base` | `text-black-800` | 기본 텍스트 |
| 보조 | `text-sm` | `text-black-600` | 부가 설명, 캡션 |
| 힌트 | `text-sm` | `text-black-400` | 플레이스홀더, 비활성 텍스트 |

## 4. Button

CTA 및 일반 액션 버튼. 피츠의 법칙에 따라 최소 터치 영역 44px 확보.

### 4.1 Variants

| Variant | 용도 | 스타일 |
|---------|------|--------|
| `primary` | CTA (새 모임 만들기, 여기로 확정!) | bg-primary, text-white |
| `secondary` | 보조 액션 (취소, 닫기) | border border-black-300, text-black-800 |
| `destructive` | 위험 액션 (삭제) | bg-error, text-white |
| `ghost` | 미니멀 액션 (링크형 버튼) | text-primary, hover:bg-primary-100 |

### 4.2 Sizes

| Size | 클래스 | 용도 |
|------|--------|------|
| `sm` | `px-3 py-1.5 text-sm h-8` | 인라인 액션 |
| `md` | `px-4 py-2 text-base h-10` | 기본 |
| `lg` | `px-6 py-3 text-lg h-12` | CTA (풀너비) |

### 4.3 코드

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
  variant: {
    primary: 'bg-primary hover:bg-primary-600 active:bg-primary-700 text-white',
    secondary: 'border border-black-300 bg-white hover:bg-black-100 text-black-800',
    destructive: 'bg-error hover:bg-red-700 text-white',
    ghost: 'text-primary hover:bg-primary-100',
  },
  size: {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
  },
};

const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled,
  fullWidth,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        buttonStyles.base,
        buttonStyles.variant[variant],
        buttonStyles.size[size],
        fullWidth && 'w-full',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
```

## 5. Input

텍스트/검색 입력 필드. 포스텔의 법칙 — 입력은 유연하게 수용.

### 5.1 코드

```tsx
interface InputProps {
  type?: 'text' | 'search';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className,
}: InputProps) => {
  return (
    <div className="flex flex-col gap-1">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-4 py-3 rounded-lg border text-black-800 text-base',
          'placeholder:text-black-400',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'transition-colors',
          error ? 'border-error' : 'border-black-300',
          className,
        )}
      />
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
};

export default Input;
```

### 5.2 플레이스홀더 규칙 (Toss Easy to Speak)

- 소리 내어 읽었을 때 자연스러운 문장
- 예시를 괄호로 제공: `"모임 이름을 입력해주세요 (예: 주말 점심 모임)"`
- 검색: `"장소 검색 (예: 강남역)"`
- 닉네임: `"이름 입력 (예: 홍길동)"`

## 6. Toast

피드백 메시지. 피크엔드 법칙 — 완료/실패 순간의 감정에 공감.

### 6.1 Variants

| Variant | 아이콘 | 배경 | 텍스트 | 예시 |
|---------|--------|------|--------|------|
| `success` | ✅ | bg-success/10 | text-success | "위치가 등록되었어요!" |
| `error` | ❌ | bg-error/10 | text-error | "위치를 가져올 수 없었어요" |
| `info` | ℹ️ | bg-info/10 | text-info | "링크가 복사되었어요!" |
| `warning` | ⚠️ | bg-warning/10 | text-warning | "모임이 곧 만료돼요" |

### 6.2 코드

```tsx
interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const toastStyles = {
  success: 'bg-green-50 text-success border-success/20',
  error: 'bg-red-50 text-error border-error/20',
  info: 'bg-blue-50 text-info border-info/20',
  warning: 'bg-yellow-50 text-warning border-warning/20',
};

const toastIcons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const Toast = ({ variant, message, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-2 px-4 py-3 rounded-lg border',
      'shadow-lg animate-slide-up',
      toastStyles[variant],
    )}>
      <span>{toastIcons[variant]}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;
```

## 7. Modal

닉네임 입력, 확인 다이얼로그. 포스텔의 법칙 1Thing/1Page — 한 모달에 하나의 목적.

### 7.1 코드

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 모달 콘텐츠 */}
      <div
        className={cn(
          'relative z-10 w-[calc(100%-32px)] max-w-sm',
          'bg-white rounded-2xl p-6',
          'animate-scale-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-black mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
```

### 7.2 사용 예시 — 닉네임 입력 모달

```tsx
<Modal isOpen={isNicknameModalOpen} onClose={closeModal} title="이름을 입력해주세요">
  <Input
    placeholder="이름 입력 (예: 홍길동)"
    value={nickname}
    onChange={setNickname}
  />
  <Button
    fullWidth
    className="mt-4"
    onClick={handleConfirm}
    disabled={!nickname.trim()}
  >
    확인
  </Button>
</Modal>
```

## 8. BottomSheet

위치 확정, 결과 패널. 힉의 법칙 — 정보를 섹션별로 그룹핑.

### 8.1 코드

```tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet = ({ isOpen, onClose, children }: BottomSheetProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-white rounded-t-2xl p-6 pb-safe',
          'max-h-[70vh] overflow-y-auto',
          'animate-slide-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="w-10 h-1 bg-black-300 rounded-full mx-auto mb-4" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
```

## 9. PWAInstallBanner

PWA 설치 유도. 폰 레스토프 효과로 시각적 강조 + Suggest Over Force — 강요하지 않는 권유.

### 9.1 코드

```tsx
import usePWA from '@/hooks/usePWA';

const PWAInstallBanner = () => {
  const { canInstall, install, dismiss } = usePWA();

  if (!canInstall) return null;

  return (
    <div className={cn(
      'flex items-center justify-between gap-3',
      'px-4 py-3 mx-4 rounded-lg',
      'bg-primary-100 border border-primary/20',
    )}>
      <span className="text-sm text-black-800">
        홈 화면에 추가하면 더 빠르게 쓸 수 있어요
      </span>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          괜찮아요
        </Button>
        <Button size="sm" onClick={install}>
          추가하기
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
```

## 10. 애니메이션

도허티 임계(0.4초 이내 피드백) 적용을 위한 Tailwind 커스텀 애니메이션:

```css
/* src/styles/globals.css */
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-scale-up {
  animation: scale-up 0.2s ease-out;
}
```

## 11. 위젯 사용 체크리스트

코드 생성/리뷰 시 확인:

- [ ] 터치 영역이 44px 이상인가? (피츠의 법칙)
- [ ] 한 화면에 주요 액션이 하나인가? (힉의 법칙)
- [ ] 정보가 청크 단위로 그룹핑되었는가? (밀러의 법칙)
- [ ] 완료/에러 시 친근한 피드백이 있는가? (피크엔드 법칙)
- [ ] 로딩 시 스켈레톤/애니메이션이 있는가? (도허티 임계)
- [ ] 하드코딩 색상 없이 컬러 토큰을 사용하는가?
- [ ] 마이크로카피가 비격식체(해요체)인가?
- [ ] 강요형 표현 없이 권유형인가? (Suggest Over Force)
```

**Step 2: 커밋**

```bash
git add docs/plans/05_WIDGETS_GUIDE.md
git commit -m "docs: add widgets guide document"
```

---

### Task 6: 00_QUICK_REFERENCE.md — 퀵 레퍼런스 (마지막)

**Files:**
- Create: `docs/plans/00_QUICK_REFERENCE.md`

**Step 1: 문서 작성**

위 5개 문서를 요약하고 링크하는 인덱스 문서:

```markdown
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
```

**Step 2: 커밋**

```bash
git add docs/plans/00_QUICK_REFERENCE.md
git commit -m "docs: add quick reference document"
```

---

### Task 7: 최종 검증

**Step 1: 전체 파일 확인**

```bash
ls -la docs/plans/0*.md
```

Expected output:
```
docs/plans/00_QUICK_REFERENCE.md
docs/plans/01_ARCHITECTURE.md
docs/plans/02_FOLDER_STRUCTURE.md
docs/plans/03_CODE_CONVENTIONS.md
docs/plans/04_CODE_GENERATION_GUIDE.md
docs/plans/05_WIDGETS_GUIDE.md
```

**Step 2: Quick Reference 링크 검증**

00_QUICK_REFERENCE.md 내의 5개 상대 링크가 모두 유효한지 확인.

**Step 3: 최종 커밋 (태그)**

```bash
git add -A docs/plans/
git commit -m "docs: complete project guide documents (01-05 + quick reference)"
```
