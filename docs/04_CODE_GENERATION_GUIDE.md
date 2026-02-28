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

## 5. API 레이어 생성 템플릿 (클린 아키텍처)

새로운 외부 의존을 추가할 때 Port → Adapter → Factory 3파일을 생성한다:

### 5.1 Port (인터페이스)

`src/lib/{name}.interface.ts`:

```ts
export interface XxxClient {
  getData(id: string): Promise<Data>;
  setData(id: string, payload: Payload): Promise<void>;
}
```

### 5.2 Adapter (구현체)

`src/lib/{name}.mock.ts` 또는 `src/lib/{name}.impl.ts`:

```ts
import type { XxxClient } from './{name}.interface';

const mockXxx: XxxClient = {
  async getData(id) {
    // 목업 구현
  },
  async setData(id, payload) {
    // 목업 구현
  },
};

export default mockXxx;
```

### 5.3 Factory (구현체 선택)

`src/lib/{name}.ts`:

```ts
import type { XxxClient } from './{name}.interface';
import mockXxx from './{name}.mock';

const xxx: XxxClient = mockXxx;

export default xxx;
```

### 5.4 사용 (스토어/훅에서)

```ts
// DO: Factory import
import xxx from '@/lib/{name}';

// DON'T: 구현체 직접 import
import mockXxx from '@/lib/{name}.mock';  // ✗
```

---

## 6. 유틸리티 함수 생성 템플릿

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

## 7. 금지 패턴

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
| 구현체 직접 import `api.mock` | Factory import `api` (클린 아키텍처) |
