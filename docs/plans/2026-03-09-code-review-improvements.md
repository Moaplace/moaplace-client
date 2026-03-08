# Code Review 개선 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 코드 리뷰에서 발견된 Major 이슈 중심으로 메모리 누수, 불필요한 리렌더링, Dead Code, 디자인 시스템 위반을 해결한다.

**Architecture:** 기존 구조 유지, 최소 변경 원칙. 새 파일 생성 없이 기존 파일 수정 위주.

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS, @vis.gl/react-google-maps

---

## Task 1: Memory Leak 수정 — PlaceSearchBar 타이머 cleanup

**Files:**
- Modify: `src/components/Map/PlaceSearchBar.tsx`

**Step 1: cleanup useEffect 추가**

컴포넌트 최상단에 언마운트 시 타이머 정리 effect 추가:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';

// ... 기존 코드 ...

const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

useEffect(() => {
  return () => clearTimeout(debounceRef.current);
}, []);
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 2: Memory Leak 수정 — NearbyPlaceList 비동기 cleanup

**Files:**
- Modify: `src/components/Map/NearbyPlaceList.tsx`

**Step 1: cancelled 플래그 패턴 적용**

기존 useEffect 내 비동기 호출에 cleanup 추가:

```tsx
useEffect(() => {
  let cancelled = false;
  const fetchPlaces = async () => {
    const data = await api.getNearbyPlaces(lat, lng, category === 'all' ? undefined : category);
    if (!cancelled) setPlaces(data);
  };
  fetchPlaces();
  return () => { cancelled = true; };
}, [lat, lng, category]);
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 3: Memory Leak 수정 — useGeocoding 비동기 cleanup

**Files:**
- Modify: `src/hooks/useGeocoding.ts`

**Step 1: isMounted ref 패턴 적용**

```tsx
const useGeocoding = (): UseGeocodingReturn => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const result = await api.reverseGeocode(lat, lng);
      if (mountedRef.current) setAddress(result);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  // ...
};
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 4: Re-render 수정 — MapView useMemo

**Files:**
- Modify: `src/components/Map/MapView.tsx`

**Step 1: path 배열 메모이제이션**

```tsx
import { useCallback, useMemo } from 'react';

// 컴포넌트 내부:
const routePath = useMemo(
  () => result?.route?.path.map((m) => ({ lat: m.lat, lng: m.lng })) ?? [],
  [result?.route?.path],
);

// JSX에서:
{routePath.length > 1 && (
  <RoutePolyline path={routePath} />
)}
```

기존 `result?.route && result.route.path.length > 1` 조건문과 인라인 `.map()` 제거.

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 5: Re-render 수정 — RoomPage 인라인 핸들러 제거

**Files:**
- Modify: `src/pages/RoomPage.tsx`

**Step 1: onBadgeClick 핸들러 추출**

```tsx
const handleResultOpen = useCallback(() => setIsResultOpen(true), []);
```

JSX에서 `onBadgeClick={() => setIsResultOpen(true)}` → `onBadgeClick={handleResultOpen}`

**Step 2: onClose 핸들러 추출**

```tsx
const handleProfileSheetClose = useCallback(() => setIsProfileSheetOpen(false), []);
```

JSX에서 `onClose={() => setIsProfileSheetOpen(false)}` → `onClose={handleProfileSheetClose}`

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 6: Re-render 수정 — RoomHeader, GoogleMarker memo 래핑

**Files:**
- Modify: `src/components/Panel/RoomHeader.tsx`
- Modify: `src/components/Map/GoogleMarker.tsx`

**Step 1: RoomHeader memo 적용**

```tsx
import { memo } from 'react';

const RoomHeader = memo(({ roomName, participantCount, onBadgeClick }: RoomHeaderProps) => {
  // 기존 코드 그대로
});

RoomHeader.displayName = 'RoomHeader';
export default RoomHeader;
```

**Step 2: GoogleMarker memo 적용**

```tsx
import { memo } from 'react';

const GoogleMarker = memo(({ type, position, nickname }: GoogleMarkerProps) => {
  // 기존 코드 그대로
});

GoogleMarker.displayName = 'GoogleMarker';
export default GoogleMarker;
```

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 7: Dead Code 삭제

**Files:**
- Delete: `src/hooks/useRoom.ts`
- Delete: `src/hooks/useDirections.ts`
- Modify: `src/store/uiStore.ts` (미사용 상태/액션 제거)
- Modify: `src/types/index.ts` (미사용 타입 제거)

**Step 1: 미사용 훅 파일 삭제**

```bash
rm src/hooks/useRoom.ts src/hooks/useDirections.ts
```

**Step 2: uiStore에서 미사용 코드 제거**

- `isCreator` 상태 제거
- `setIsCreator` 액션 제거
- `resetEntryState` 액션 제거

**Step 3: types/index.ts에서 미사용 타입 제거**

- `ActiveEntryStep` 타입 제거
- `AppColorKey` (colors.ts) 제거

**Step 4: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음. 삭제한 파일을 참조하는 곳이 없어야 함.

---

## Task 8: Design System — Toast HEX 하드코딩을 토큰으로 교체

**Files:**
- Modify: `src/constants/colors.ts` (status 100단계 추가)
- Modify: `src/styles/globals.css` (CSS 변수 추가)
- Modify: `src/components/ui/sonner.tsx` (토큰 사용)

**Step 1: colors.ts에 status-100 색상 추가**

```tsx
SUCCESS_100: '#ecfdf5',
ERROR_100: '#fef2f2',
WARNING_100: '#fffbeb',
INFO_100: '#eff6ff',
```

**Step 2: globals.css에 CSS 변수 추가**

```css
--color-success-100: #ecfdf5;
--color-error-100: #fef2f2;
--color-warning-100: #fffbeb;
--color-info-100: #eff6ff;
```

**Step 3: sonner.tsx에서 토큰 사용**

```tsx
success: "!border-success/30 !bg-success-100",
error: "!border-error/30 !bg-error-100",
warning: "!border-warning/30 !bg-warning-100",
info: "!border-info/30 !bg-info-100",
```

**Step 4: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## Task 9: hasMyMarker 중복 계산 제거

**Files:**
- Modify: `src/pages/RoomPage.tsx`

**Step 1: useMemo로 한번만 계산**

렌더 함수 상단 (useCallback들 위)에:

```tsx
const hasMyMarker = useMemo(
  () => room?.markers.some((m) => m.nickname === nickname) ?? false,
  [room?.markers, nickname],
);
```

기존 렌더 본문의 `const hasMyMarker = room.markers.some(...)` 제거.
`handleMapClick`, `handleLocate` 내부의 중복 계산도 이 변수 참조로 교체.

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없음

---

## 우선순위 요약

| 순서 | Task | 영역 | 난이도 |
|------|------|------|--------|
| 1 | Task 1-3 | Memory Leak | 낮음 |
| 2 | Task 4-6 | Re-render | 낮음 |
| 3 | Task 7 | Dead Code | 낮음 |
| 4 | Task 8 | Design System | 낮음 |
| 5 | Task 9 | DRY | 낮음 |

모든 Task가 독립적이라 순서 무관하게 실행 가능합니다.
DRY Major 이슈 (useAsyncAction, useFormSubmit 등)는 구조적 리팩토링이 필요하여 별도 계획으로 분리합니다.
