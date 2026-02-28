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
// DO: 단순 조건 — 서버 응답 기반으로 판단 (비즈니스 규칙 하드코딩 금지)
{result && <CenterPoint position={result.centroid} />}
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

## 5. API 통신 (클린 아키텍처)

### 5.1 Port/Adapter/Factory 패턴

외부 의존(API, Storage 등)은 반드시 **Port → Adapter → Factory** 3단계 구조로 설계한다.
스토어/훅은 구현체를 직접 import하지 않고, Factory가 export하는 인스턴스만 사용한다.

```
src/lib/
├── api.interface.ts   # Port — 계약 (interface)
├── api.mock.ts        # Adapter — localStorage 목업 구현체
├── api.http.ts        # Adapter — axios 실서버 구현체 (나중에)
└── api.ts             # Factory — 현재 구현체 선택 및 export
```

### 5.2 Port (인터페이스)

```ts
// src/lib/api.interface.ts
import type { Room, Marker, MarkerRequest, RoomResult } from '@/types';

export interface ApiClient {
  createRoom(name: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  getResult(roomId: string): Promise<RoomResult | null>;
}
```

### 5.3 Adapter (구현체)

```ts
// src/lib/api.mock.ts
import type { ApiClient } from './api.interface';

const mockApi: ApiClient = {
  async createRoom(name) { /* localStorage 기반 구현 */ },
  // ...
};

export default mockApi;
```

### 5.4 Factory (구현체 선택)

```ts
// src/lib/api.ts
import type { ApiClient } from './api.interface';
import mockApi from './api.mock';

// 백엔드 연동 시 여기만 변경:
// import httpApi from './api.http';
// const api: ApiClient = httpApi;
const api: ApiClient = mockApi;

export default api;
```

### 5.5 사용 규칙

```ts
// DO: Factory를 통해 접근
import api from '@/lib/api';

// DON'T: 구현체 직접 import
import mockApi from '@/lib/api.mock';  // ✗
```

### 5.6 새 외부 의존 추가 시

새로운 외부 서비스(지도, 알림 등)를 연동할 때도 동일 패턴 적용:

1. `xxx.interface.ts` — Port 인터페이스 정의
2. `xxx.impl.ts` — Adapter 구현체
3. `xxx.ts` — Factory (구현체 선택 및 export)

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
