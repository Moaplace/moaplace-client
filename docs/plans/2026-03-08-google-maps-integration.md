# Google Maps 실제 지도 연동 + 핵심 로직 + 실시간 동기화 통합 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** MockMapView를 실제 Google Maps로 교체하고, 중심점/TSP/거리 계산 로직, 장소 검색, 주변 시설 추천, GPS, PWA, 클립보드 기능을 mock 기반으로 통합 구현한다.

**Architecture:** `@vis.gl/react-google-maps`의 `APIProvider` + `Map`으로 지도 렌더링. 기능별 커스텀 훅 분리. 모든 API 데이터는 Port/Adapter/Factory 패턴을 확장하여 mock JSON으로 동작하며, 나중에 HTTP 어댑터로 교체만 하면 된다.

**Tech Stack:** `@vis.gl/react-google-maps`, Vite `define`으로 `GOOGLE_MAPS_API_KEY` 주입, Zustand, TypeScript strict

---

## Task 1: 패키지 설치 + 환경변수 설정

**Files:**
- Modify: `package.json` (npm install)
- Modify: `vite.config.ts:7-18`

**Step 1: @vis.gl/react-google-maps 설치**

Run: `npm install @vis.gl/react-google-maps`

**Step 2: vite.config.ts에 환경변수 주입 설정**

`GOOGLE_MAPS_API_KEY`는 `VITE_` 접두사 없이 사용하므로, Vite `define`으로 직접 주입한다.

```typescript
/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      'import.meta.env.GOOGLE_MAPS_API_KEY': JSON.stringify(env.GOOGLE_MAPS_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'node',
    },
  }
})
```

**Step 3: TypeScript 환경변수 타입 선언**

Create: `src/vite-env.d.ts` (기존 파일이 있으면 확장)

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Step 4: 커밋**

```bash
git add package.json package-lock.json vite.config.ts src/vite-env.d.ts
git commit -m "chore: @vis.gl/react-google-maps 설치 및 환경변수 설정"
```

---

## Task 2: 신규 타입 추가

**Files:**
- Modify: `src/types/index.ts:67` (파일 끝에 추가)

**Step 1: 신규 타입 정의 추가**

`src/types/index.ts` 파일 끝에 다음을 추가:

```typescript
/** 위경도 좌표 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Places Autocomplete 검색 결과 */
export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/** 주변 시설 (Nearby Search) */
export interface NearbyPlace {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'subway';
  lat: number;
  lng: number;
  distance: number;
}

/** Directions API 경로 결과 */
export interface DirectionsResult {
  distance: number;
  duration: string;
  polyline: LatLng[];
}
```

**Step 2: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat: 지도 연동 신규 타입 추가 (LatLng, PlaceResult, NearbyPlace, DirectionsResult)"
```

---

## Task 3: 계산 유틸 (geo.ts)

**Files:**
- Create: `src/lib/geo.ts`
- Create: `src/lib/__tests__/geo.test.ts`

**Step 1: 테스트 작성**

```typescript
// src/lib/__tests__/geo.test.ts
import { describe, it, expect } from 'vitest';
import { haversine, centroid, solveTSP } from '../geo';
import type { Marker } from '@/types';

describe('haversine', () => {
  it('서울시청 ↔ 강남역 직선거리 약 8.9km', () => {
    const d = haversine(
      { lat: 37.5665, lng: 126.9780 }, // 서울시청
      { lat: 37.4979, lng: 127.0276 }, // 강남역
    );
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(10);
  });

  it('같은 좌표는 0', () => {
    const d = haversine({ lat: 37.5665, lng: 126.9780 }, { lat: 37.5665, lng: 126.9780 });
    expect(d).toBe(0);
  });
});

describe('centroid', () => {
  it('두 점의 중심', () => {
    const c = centroid([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
    ]);
    expect(c.lat).toBeCloseTo(37.5, 1);
    expect(c.lng).toBeCloseTo(127.5, 1);
  });

  it('빈 배열은 0,0', () => {
    const c = centroid([]);
    expect(c.lat).toBe(0);
    expect(c.lng).toBe(0);
  });
});

describe('solveTSP', () => {
  const mkMarker = (id: string, lat: number, lng: number): Marker => ({
    id,
    nickname: id,
    lat,
    lng,
    password: 'test',
    createdAt: new Date().toISOString(),
  });

  it('2개 마커 → 경로 포함, 거리 > 0', () => {
    const markers = [
      mkMarker('a', 37.5665, 126.9780),
      mkMarker('b', 37.4979, 127.0276),
    ];
    const result = solveTSP(markers);
    expect(result.path).toHaveLength(2);
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  it('1개 마커 → 거리 0', () => {
    const markers = [mkMarker('a', 37.5665, 126.9780)];
    const result = solveTSP(markers);
    expect(result.path).toHaveLength(1);
    expect(result.totalDistance).toBe(0);
  });
});
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/lib/__tests__/geo.test.ts`
Expected: FAIL — 모듈 없음

**Step 3: geo.ts 구현**

```typescript
// src/lib/geo.ts
import type { LatLng, Marker, RouteResult } from '@/types';

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** 두 좌표 간 Haversine 직선거리 (km) */
export const haversine = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/** 좌표 배열의 무게중심 (산술 평균) */
export const centroid = (points: LatLng[]): LatLng => {
  if (points.length === 0) return { lat: 0, lng: 0 };
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
};

/** TSP 최단경로 — Nearest Neighbor 휴리스틱 */
export const solveTSP = (markers: Marker[]): RouteResult => {
  if (markers.length <= 1) {
    return { path: [...markers], totalDistance: 0 };
  }

  const visited = new Set<string>();
  const path: Marker[] = [];
  let current = markers[0];
  visited.add(current.id);
  path.push(current);
  let totalDistance = 0;

  while (visited.size < markers.length) {
    let nearest: Marker | null = null;
    let nearestDist = Infinity;

    for (const m of markers) {
      if (visited.has(m.id)) continue;
      const d = haversine(current, m);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = m;
      }
    }

    if (nearest) {
      visited.add(nearest.id);
      path.push(nearest);
      totalDistance += nearestDist;
      current = nearest;
    }
  }

  return { path, totalDistance };
};
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/lib/__tests__/geo.test.ts`
Expected: PASS (3 tests)

**Step 5: 커밋**

```bash
git add src/lib/geo.ts src/lib/__tests__/geo.test.ts
git commit -m "feat: 계산 유틸 추가 (haversine, centroid, solveTSP)"
```

---

## Task 4: 클립보드 유틸 (clipboard.ts)

**Files:**
- Create: `src/lib/clipboard.ts`

**Step 1: clipboard.ts 구현**

```typescript
// src/lib/clipboard.ts

/** 클립보드에 텍스트 복사 (navigator.clipboard → textarea 폴백) */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
};

const fallbackCopy = (text: string): boolean => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};
```

**Step 2: 커밋**

```bash
git add src/lib/clipboard.ts
git commit -m "feat: 클립보드 유틸 추가 (navigator.clipboard + textarea 폴백)"
```

---

## Task 5: Mock 데이터 파일 생성

**Files:**
- Create: `src/mock/places.json`
- Create: `src/mock/nearby.json`
- Create: `src/mock/directions.json`

**Step 1: places.json — 서울 주요 장소 12개**

```json
[
  { "placeId": "p1", "name": "강남역", "address": "서울특별시 강남구 강남대로 396", "lat": 37.4979, "lng": 127.0276 },
  { "placeId": "p2", "name": "홍대입구역", "address": "서울특별시 마포구 양화로 160", "lat": 37.5571, "lng": 126.9236 },
  { "placeId": "p3", "name": "서울역", "address": "서울특별시 용산구 한강대로 405", "lat": 37.5547, "lng": 126.9707 },
  { "placeId": "p4", "name": "잠실역", "address": "서울특별시 송파구 올림픽로 지하 265", "lat": 37.5133, "lng": 127.1001 },
  { "placeId": "p5", "name": "여의도역", "address": "서울특별시 영등포구 의사당대로 지하 166", "lat": 37.5216, "lng": 126.9243 },
  { "placeId": "p6", "name": "명동역", "address": "서울특별시 중구 퇴계로 지하 126", "lat": 37.5609, "lng": 126.9860 },
  { "placeId": "p7", "name": "신촌역", "address": "서울특별시 서대문구 신촌로 지하 90", "lat": 37.5553, "lng": 126.9366 },
  { "placeId": "p8", "name": "건대입구역", "address": "서울특별시 광진구 아차산로 246", "lat": 37.5403, "lng": 127.0693 },
  { "placeId": "p9", "name": "이태원역", "address": "서울특별시 용산구 이태원로 지하 180", "lat": 37.5345, "lng": 126.9946 },
  { "placeId": "p10", "name": "합정역", "address": "서울특별시 마포구 양화로 지하 64", "lat": 37.5495, "lng": 126.9137 },
  { "placeId": "p11", "name": "성수역", "address": "서울특별시 성동구 뚝섬로 지하 1", "lat": 37.5446, "lng": 127.0557 },
  { "placeId": "p12", "name": "을지로3가역", "address": "서울특별시 중구 을지로 지하 156", "lat": 37.5660, "lng": 126.9920 }
]
```

**Step 2: nearby.json — 카테고리별 POI 12개**

```json
[
  { "id": "n1", "name": "스타벅스 시청점", "category": "cafe", "lat": 37.5660, "lng": 126.9784, "distance": 120 },
  { "id": "n2", "name": "투썸플레이스 광화문점", "category": "cafe", "lat": 37.5710, "lng": 126.9769, "distance": 350 },
  { "id": "n3", "name": "블루보틀 삼청점", "category": "cafe", "lat": 37.5820, "lng": 126.9832, "distance": 800 },
  { "id": "n4", "name": "을지로 골목식당", "category": "restaurant", "lat": 37.5660, "lng": 126.9910, "distance": 200 },
  { "id": "n5", "name": "광화문 국밥집", "category": "restaurant", "lat": 37.5720, "lng": 126.9760, "distance": 400 },
  { "id": "n6", "name": "명동 칼국수", "category": "restaurant", "lat": 37.5610, "lng": 126.9855, "distance": 550 },
  { "id": "n7", "name": "종로3가 부대찌개", "category": "restaurant", "lat": 37.5710, "lng": 126.9920, "distance": 650 },
  { "id": "n8", "name": "시청역 1호선", "category": "subway", "lat": 37.5657, "lng": 126.9773, "distance": 80 },
  { "id": "n9", "name": "을지로입구역 2호선", "category": "subway", "lat": 37.5660, "lng": 126.9825, "distance": 250 },
  { "id": "n10", "name": "광화문역 5호선", "category": "subway", "lat": 37.5710, "lng": 126.9768, "distance": 380 },
  { "id": "n11", "name": "종각역 1호선", "category": "subway", "lat": 37.5700, "lng": 126.9831, "distance": 450 },
  { "id": "n12", "name": "안국역 3호선", "category": "subway", "lat": 37.5764, "lng": 126.9854, "distance": 620 }
]
```

**Step 3: directions.json — 샘플 경로 1개**

```json
{
  "distance": 12.5,
  "duration": "약 25분",
  "polyline": [
    { "lat": 37.5665, "lng": 126.9780 },
    { "lat": 37.5610, "lng": 126.9860 },
    { "lat": 37.5547, "lng": 126.9920 },
    { "lat": 37.5480, "lng": 127.0100 },
    { "lat": 37.5350, "lng": 127.0150 },
    { "lat": 37.5200, "lng": 127.0200 },
    { "lat": 37.5050, "lng": 127.0250 },
    { "lat": 37.4979, "lng": 127.0276 }
  ]
}
```

**Step 4: 커밋**

```bash
git add src/mock/
git commit -m "feat: mock 데이터 추가 (places, nearby, directions)"
```

---

## Task 6: API 인터페이스 확장 + Mock 구현 + HTTP 껍데기

**Files:**
- Modify: `src/lib/api.interface.ts:1-11`
- Modify: `src/lib/api.mock.ts:1-98`
- Create: `src/lib/api.http.ts`
- Modify: `src/lib/api.ts:1-9`

**Step 1: api.interface.ts 확장**

```typescript
// src/lib/api.interface.ts
import type {
  Room, Marker, MarkerRequest, RoomResult, RoomType,
  PlaceResult, NearbyPlace, DirectionsResult, LatLng,
} from '@/types';

export interface ApiClient {
  createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  verifyRoomPassword(roomId: string, password: string): Promise<boolean>;
  verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  getResult(roomId: string): Promise<RoomResult | null>;

  // 지도 연동
  searchPlaces(query: string): Promise<PlaceResult[]>;
  getNearbyPlaces(lat: number, lng: number, type?: string): Promise<NearbyPlace[]>;
  getDirections(origin: LatLng, destination: LatLng, waypoints?: LatLng[]): Promise<DirectionsResult>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
}
```

**Step 2: api.mock.ts 확장**

기존 코드 유지, `getResult` 구현 + 신규 메서드 4개 추가.

```typescript
// src/lib/api.mock.ts
import type { Room, Marker, MarkerRequest, RoomResult, RoomType, PlaceResult, NearbyPlace, DirectionsResult, LatLng } from '@/types';
import type { ApiClient } from './api.interface';
import { haversine, centroid, solveTSP } from './geo';
import placesData from '@/mock/places.json';
import nearbyData from '@/mock/nearby.json';
import directionsData from '@/mock/directions.json';

const STORAGE_KEY = 'moaplace_rooms';

const getRooms = (): Record<string, Room> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

const assertRoom = (room: Room | undefined): Room => {
  if (!room) throw new Error('방을 찾을 수 없어요');
  return room;
};

const mutateRooms = (fn: (rooms: Record<string, Room>) => void) => {
  const rooms = getRooms();
  fn(rooms);
  saveRooms(rooms);
  return rooms;
};

const mockApi: ApiClient = {
  async createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room> {
    const room: Room = {
      id: crypto.randomUUID(),
      name: name.trim() || '이름 없는 모임',
      type,
      markers: [],
      dates,
      password,
      createdAt: new Date().toISOString(),
    };
    mutateRooms((rooms) => {
      rooms[room.id] = room;
    });
    return room;
  },

  async getRoom(roomId: string): Promise<Room> {
    const rooms = getRooms();
    return assertRoom(rooms[roomId]);
  },

  async verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
    const rooms = getRooms();
    const room = assertRoom(rooms[roomId]);
    if (!room.password) return true;
    return room.password === password;
  },

  async verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null> {
    const rooms = getRooms();
    const room = assertRoom(rooms[roomId]);
    const marker = room.markers.find((m) => m.nickname === nickname);
    if (!marker) return null;
    if (marker.password !== password) throw new Error('비밀번호가 틀려요');
    return marker;
  },

  async addMarker(roomId: string, req: MarkerRequest): Promise<Marker> {
    const marker: Marker = {
      id: crypto.randomUUID(),
      nickname: req.nickname,
      lat: req.lat,
      lng: req.lng,
      address: req.address,
      password: req.password,
      createdAt: new Date().toISOString(),
    };
    mutateRooms((rooms) => {
      const room = assertRoom(rooms[roomId]);
      room.markers.push(marker);
    });
    return marker;
  },

  async deleteMarker(roomId: string, markerId: string): Promise<void> {
    mutateRooms((rooms) => {
      const room = assertRoom(rooms[roomId]);
      room.markers = room.markers.filter((m) => m.id !== markerId);
    });
  },

  async getResult(roomId: string): Promise<RoomResult | null> {
    const rooms = getRooms();
    const room = assertRoom(rooms[roomId]);
    if (room.markers.length < 2) return null;

    const center = centroid(room.markers);
    const route = solveTSP(room.markers);
    const distances = room.markers.map((m) => ({
      markerId: m.id,
      nickname: m.nickname,
      distance: haversine(m, center),
    }));

    return {
      centroid: { lat: center.lat, lng: center.lng },
      route,
      distances,
    };
  },

  async searchPlaces(query: string): Promise<PlaceResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return (placesData as PlaceResult[]).filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    );
  },

  async getNearbyPlaces(_lat: number, _lng: number, type?: string): Promise<NearbyPlace[]> {
    const data = nearbyData as NearbyPlace[];
    if (!type || type === 'all') return data;
    return data.filter((p) => p.category === type);
  },

  async getDirections(_origin: LatLng, _destination: LatLng, _waypoints?: LatLng[]): Promise<DirectionsResult> {
    return directionsData as DirectionsResult;
  },

  async reverseGeocode(_lat: number, _lng: number): Promise<string> {
    return '서울특별시 중구 세종대로 110';
  },
};

export default mockApi;
```

**Step 3: api.http.ts 껍데기 생성**

```typescript
// src/lib/api.http.ts
import type { ApiClient } from './api.interface';

const notImplemented = (method: string): never => {
  throw new Error(`HTTP API 미구현: ${method}`);
};

const httpApi: ApiClient = {
  createRoom: () => notImplemented('createRoom'),
  getRoom: () => notImplemented('getRoom'),
  verifyRoomPassword: () => notImplemented('verifyRoomPassword'),
  verifyParticipant: () => notImplemented('verifyParticipant'),
  addMarker: () => notImplemented('addMarker'),
  deleteMarker: () => notImplemented('deleteMarker'),
  getResult: () => notImplemented('getResult'),
  searchPlaces: () => notImplemented('searchPlaces'),
  getNearbyPlaces: () => notImplemented('getNearbyPlaces'),
  getDirections: () => notImplemented('getDirections'),
  reverseGeocode: () => notImplemented('reverseGeocode'),
};

export default httpApi;
```

**Step 4: api.ts Factory 업데이트 (변경 없음, 확인만)**

기존 `api.ts`는 이미 mockApi를 export하고 있으므로 변경 불필요. 나중에 HTTP 전환 시 import만 바꾸면 됨.

**Step 5: 커밋**

```bash
git add src/lib/api.interface.ts src/lib/api.mock.ts src/lib/api.http.ts
git commit -m "feat: API 인터페이스 확장 및 mock/http 어댑터 구현"
```

---

## Task 7: 커스텀 훅 구현 (6개)

**Files:**
- Create: `src/hooks/useGeocoding.ts`
- Create: `src/hooks/useGeolocation.ts`
- Create: `src/hooks/usePlaceSearch.ts`
- Create: `src/hooks/useDirections.ts`
- Create: `src/hooks/usePWA.ts`
- Create: `src/hooks/useRoom.ts`

**Step 1: useGeocoding.ts**

```typescript
// src/hooks/useGeocoding.ts
import { useCallback, useState } from 'react';
import api from '@/lib/api';

interface UseGeocodingReturn {
  address: string | null;
  isLoading: boolean;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
}

const useGeocoding = (): UseGeocodingReturn => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await api.reverseGeocode(lat, lng);
      setAddress(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { address, isLoading, reverseGeocode };
};

export default useGeocoding;
```

**Step 2: useGeolocation.ts**

```typescript
// src/hooks/useGeolocation.ts
import { useCallback, useState } from 'react';
import type { LatLng } from '@/types';

interface UseGeolocationReturn {
  position: LatLng | null;
  error: string | null;
  isLoading: boolean;
  getCurrentPosition: () => void;
}

const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않아요');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '위치 권한을 허용해주세요',
          2: '위치를 가져올 수 없어요',
          3: '위치 요청이 시간 초과되었어요',
        };
        setError(messages[err.code] ?? '위치를 가져올 수 없어요');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { position, error, isLoading, getCurrentPosition };
};

export default useGeolocation;
```

**Step 3: usePlaceSearch.ts**

```typescript
// src/hooks/usePlaceSearch.ts
import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type { PlaceResult } from '@/types';

interface UsePlaceSearchReturn {
  results: PlaceResult[];
  isLoading: boolean;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

const usePlaceSearch = (): UsePlaceSearchReturn => {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.searchPlaces(query);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, isLoading, search, clear };
};

export default usePlaceSearch;
```

**Step 4: useDirections.ts**

```typescript
// src/hooks/useDirections.ts
import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type { LatLng, DirectionsResult } from '@/types';

interface UseDirectionsReturn {
  route: DirectionsResult | null;
  isLoading: boolean;
  getRoute: (origin: LatLng, destination: LatLng, waypoints?: LatLng[]) => Promise<DirectionsResult>;
}

const useDirections = (): UseDirectionsReturn => {
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRoute = useCallback(async (origin: LatLng, destination: LatLng, waypoints?: LatLng[]) => {
    setIsLoading(true);
    try {
      const result = await api.getDirections(origin, destination, waypoints);
      setRoute(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { route, isLoading, getRoute };
};

export default useDirections;
```

**Step 5: usePWA.ts**

```typescript
// src/hooks/usePWA.ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  canInstall: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

const usePWA = (): UsePWAReturn => {
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    deferredPrompt.current = null;
  }, []);

  const dismiss = useCallback(() => {
    setCanInstall(false);
    deferredPrompt.current = null;
  }, []);

  return { canInstall, install, dismiss };
};

export default usePWA;
```

**Step 6: useRoom.ts**

```typescript
// src/hooks/useRoom.ts
import { useEffect } from 'react';
import { useRoomStore } from '@/store/roomStore';

const useRoom = (roomId: string | undefined) => {
  const fetchRoom = useRoomStore((s) => s.fetchRoom);

  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId, fetchRoom]);
};

export default useRoom;
```

**Step 7: 커밋**

```bash
git add src/hooks/
git commit -m "feat: 커스텀 훅 추가 (useGeocoding, useGeolocation, usePlaceSearch, useDirections, usePWA, useRoom)"
```

---

## Task 8: App.tsx에 APIProvider 래핑

**Files:**
- Modify: `src/App.tsx:1-23`

**Step 1: APIProvider 추가**

```typescript
// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";

import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import RoomPage from "@/pages/RoomPage";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <APIProvider apiKey={import.meta.env.GOOGLE_MAPS_API_KEY ?? ''}>
      <div className="min-h-dvh bg-background">
        <main className="max-w-2xl mx-auto px-5">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/widget-showcase" element={<WidgetShowcase />} />
          </Routes>
        </main>
        <Toaster position="bottom-center" />
      </div>
    </APIProvider>
  );
}

export default App;
```

**Step 2: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx에 Google Maps APIProvider 래핑"
```

---

## Task 9: MapView + GoogleMarker + RoutePolyline 컴포넌트

**Files:**
- Create: `src/components/Map/MapView.tsx`
- Create: `src/components/Map/GoogleMarker.tsx`
- Create: `src/components/Map/RoutePolyline.tsx`
- Delete: `src/components/Map/MockMapView.tsx`
- Delete: `src/components/Map/MapMarker.tsx` (MockMapView 전용이었음)

**Step 1: MapView.tsx**

```tsx
// src/components/Map/MapView.tsx
import { useCallback } from 'react';
import { Map, MapMouseEvent } from '@vis.gl/react-google-maps';

import GoogleMarker from '@/components/Map/GoogleMarker';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { cn } from '@/lib/utils';
import type { Marker, RoomResult } from '@/types';

interface MapViewProps {
  markers: Marker[];
  myNickname: string;
  result: RoomResult | null;
  onMapClick: (lat: number, lng: number) => void;
  className?: string;
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

const MapView = ({ markers, myNickname, result, onMapClick, className }: MapViewProps) => {
  const handleClick = useCallback((e: MapMouseEvent) => {
    const pos = e.detail.latLng;
    if (pos) {
      onMapClick(pos.lat, pos.lng);
    }
  }, [onMapClick]);

  return (
    <div className={cn('relative', className)}>
      <Map
        defaultCenter={SEOUL_CENTER}
        defaultZoom={12}
        mapId="moaplace"
        onClick={handleClick}
        gestureHandling="greedy"
        disableDefaultUI
        className="w-full h-full"
      >
        {markers.map((marker) => (
          <GoogleMarker
            key={marker.id}
            type={marker.nickname === myNickname ? 'mine' : 'others'}
            position={{ lat: marker.lat, lng: marker.lng }}
            nickname={marker.nickname}
          />
        ))}

        {result?.centroid && (
          <GoogleMarker
            type="center"
            position={{ lat: result.centroid.lat, lng: result.centroid.lng }}
          />
        )}

        {result?.route && result.route.path.length > 1 && (
          <RoutePolyline path={result.route.path.map((m) => ({ lat: m.lat, lng: m.lng }))} />
        )}
      </Map>
    </div>
  );
};

export default MapView;
```

**Step 2: GoogleMarker.tsx**

```tsx
// src/components/Map/GoogleMarker.tsx
import { AdvancedMarker } from '@vis.gl/react-google-maps';

import MapPin from '@/components/Map/MapPin';
import PulseMarker from '@/components/Map/PulseMarker';
import type { LatLng } from '@/types';

interface GoogleMarkerProps {
  type: 'mine' | 'others' | 'center';
  position: LatLng;
  nickname?: string;
}

const GoogleMarker = ({ type, position, nickname }: GoogleMarkerProps) => {
  return (
    <AdvancedMarker position={position}>
      {type === 'center' ? (
        <PulseMarker color="center" size="lg" label="중간지점" />
      ) : (
        <MapPin type={type} nickname={nickname} />
      )}
    </AdvancedMarker>
  );
};

export default GoogleMarker;
```

**Step 3: RoutePolyline.tsx**

```tsx
// src/components/Map/RoutePolyline.tsx
import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

import { AppColors } from '@/constants/colors';
import type { LatLng } from '@/types';

interface RoutePolylineProps {
  path: LatLng[];
}

const RoutePolyline = ({ path }: RoutePolylineProps) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;

    polylineRef.current = new mapsLib.Polyline({
      map,
      path: path.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: AppColors.primary,
      strokeOpacity: 0.8,
      strokeWeight: 3,
      geodesic: true,
    });

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [map, mapsLib, path]);

  return null;
};

export default RoutePolyline;
```

**Step 4: MockMapView.tsx, MapMarker.tsx 삭제**

```bash
rm src/components/Map/MockMapView.tsx src/components/Map/MapMarker.tsx
```

**Step 5: 커밋**

```bash
git add src/components/Map/
git commit -m "feat: Google Maps 지도 컴포넌트 구현 (MapView, GoogleMarker, RoutePolyline)"
```

---

## Task 10: PlaceSearchBar + NearbyPlaceList 컴포넌트

**Files:**
- Create: `src/components/Map/PlaceSearchBar.tsx`
- Create: `src/components/Map/NearbyPlaceList.tsx`

**Step 1: PlaceSearchBar.tsx**

```tsx
// src/components/Map/PlaceSearchBar.tsx
import { useCallback, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import usePlaceSearch from '@/hooks/usePlaceSearch';
import type { PlaceResult } from '@/types';

interface PlaceSearchBarProps {
  onPlaceSelect: (place: PlaceResult) => void;
  className?: string;
}

const PlaceSearchBar = ({ onPlaceSelect, className }: PlaceSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, search, clear } = usePlaceSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      clear();
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(value);
      setIsOpen(true);
    }, 300);
  }, [search, clear]);

  const handleSelect = useCallback((place: PlaceResult) => {
    onPlaceSelect(place);
    setQuery(place.name);
    setIsOpen(false);
    clear();
  }, [onPlaceSelect, clear]);

  const handleClear = useCallback(() => {
    setQuery('');
    clear();
    setIsOpen(false);
  }, [clear]);

  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black-400" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="장소를 검색해보세요"
          className="pl-9 pr-9 bg-white/95 backdrop-blur-sm shadow-md rounded-xl border-black-300/50"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black-400 hover:text-black-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-black-300/50 overflow-hidden z-20 max-h-60 overflow-y-auto">
          {results.map((place) => (
            <li key={place.placeId}>
              <button
                onClick={() => handleSelect(place)}
                className="flex flex-col gap-0.5 w-full px-4 py-3 text-left hover:bg-black-100 transition-colors"
              >
                <span className="text-sm font-pretendard-md text-black-800">{place.name}</span>
                <span className="text-xs text-black-400">{place.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaceSearchBar;
```

**Step 2: NearbyPlaceList.tsx**

```tsx
// src/components/Map/NearbyPlaceList.tsx
import { useCallback, useEffect, useState } from 'react';
import { Coffee, MapPin, Train, UtensilsCrossed } from 'lucide-react';

import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { NearbyPlace } from '@/types';

interface NearbyPlaceListProps {
  lat: number;
  lng: number;
  className?: string;
}

const CATEGORIES = [
  { key: 'all', label: '전체', icon: MapPin },
  { key: 'restaurant', label: '식당', icon: UtensilsCrossed },
  { key: 'cafe', label: '카페', icon: Coffee },
  { key: 'subway', label: '지하철', icon: Train },
] as const;

const NearbyPlaceList = ({ lat, lng, className }: NearbyPlaceListProps) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [category, setCategory] = useState<string>('all');

  const fetchPlaces = useCallback(async (type: string) => {
    const data = await api.getNearbyPlaces(lat, lng, type);
    setPlaces(data);
  }, [lat, lng]);

  useEffect(() => {
    fetchPlaces(category);
  }, [category, fetchPlaces]);

  const handleCategoryChange = useCallback((key: string) => {
    setCategory(key);
  }, []);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="text-sm font-pretendard-sb text-black-800">주변 시설 추천</h3>

      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-pretendard-md transition-colors',
              category === key
                ? 'bg-primary text-white'
                : 'bg-black-100 text-black-600 hover:bg-black-300/50',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 장소 목록 */}
      <ul className="flex flex-col gap-2">
        {places.map((place) => {
          const catInfo = CATEGORIES.find((c) => c.key === place.category);
          const Icon = catInfo?.icon ?? MapPin;
          return (
            <li
              key={place.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black-100/50 hover:bg-black-100 transition-colors"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-pretendard-md text-black-800 truncate">{place.name}</p>
              </div>
              <span className="text-xs text-black-400 shrink-0">{place.distance}m</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NearbyPlaceList;
```

**Step 3: 커밋**

```bash
git add src/components/Map/PlaceSearchBar.tsx src/components/Map/NearbyPlaceList.tsx
git commit -m "feat: PlaceSearchBar + NearbyPlaceList 컴포넌트 추가"
```

---

## Task 11: uiStore 변경 (PendingLocation 타입)

**Files:**
- Modify: `src/store/uiStore.ts:5-8`

**Step 1: PendingLocation을 lat/lng 기반으로 변경**

`PendingLocation` 인터페이스를 `x, y` → `lat, lng`로 변경:

```typescript
interface PendingLocation {
  lat: number;
  lng: number;
}
```

**Step 2: 커밋**

```bash
git add src/store/uiStore.ts
git commit -m "refactor: PendingLocation 타입을 lat/lng 기반으로 변경"
```

---

## Task 12: LocationConfirmSheet 업데이트 (역지오코딩 주소 표시)

**Files:**
- Modify: `src/components/Panel/LocationConfirmSheet.tsx:1-53`

**Step 1: LocationConfirmSheet를 lat/lng + 주소 표시로 변경**

```tsx
// src/components/Panel/LocationConfirmSheet.tsx
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import useGeocoding from '@/hooks/useGeocoding';

interface LocationConfirmSheetProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  lat: number;
  lng: number;
}

const LocationConfirmSheet = ({
  open,
  onConfirm,
  onCancel,
  lat,
  lng,
}: LocationConfirmSheetProps) => {
  const { address, isLoading, reverseGeocode } = useGeocoding();

  useEffect(() => {
    if (open) {
      reverseGeocode(lat, lng);
    }
  }, [open, lat, lng, reverseGeocode]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onCancel()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sub" />
            이 위치로 등록할까요?
          </DrawerTitle>
          <DrawerDescription>
            {isLoading ? '주소를 찾고 있어요...' : address ?? `(${lat.toFixed(4)}, ${lng.toFixed(4)})`}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={onConfirm} size="lg" className="w-full">
            여기로 확정!
          </Button>
          <Button onClick={onCancel} variant="outline" size="lg" className="w-full">
            취소
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default LocationConfirmSheet;
```

**Step 2: 커밋**

```bash
git add src/components/Panel/LocationConfirmSheet.tsx
git commit -m "feat: LocationConfirmSheet에 역지오코딩 주소 표시"
```

---

## Task 13: ResultPanel 확장 (거리, 경로, 주변 시설)

**Files:**
- Modify: `src/components/Panel/ResultPanel.tsx:1-67`

**Step 1: ResultPanel에 RoomResult + NearbyPlaceList 통합**

```tsx
// src/components/Panel/ResultPanel.tsx
import { memo } from 'react';
import { ChevronUp, Route } from 'lucide-react';

import NearbyPlaceList from '@/components/Map/NearbyPlaceList';
import PulseMarker from '@/components/Map/PulseMarker';
import ParticipantList from '@/components/Panel/ParticipantList';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import type { Marker, RoomResult } from '@/types';

interface ResultPanelProps {
  markers: Marker[];
  myNickname: string;
  result: RoomResult | null;
}

const ResultPanel = memo(({ markers, myNickname, result }: ResultPanelProps) => {
  if (markers.length === 0) return null;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex items-center justify-center gap-2 w-full py-3 text-sm font-pretendard-md text-black-600 hover:text-black-800 transition-colors">
          <ChevronUp className="w-4 h-4" />
          참여자 {markers.length}명 · 결과 보기
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>모임 결과</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {/* 중심점 정보 */}
          {result?.centroid && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-center-100 border border-center/20">
              <PulseMarker color="center" size="sm" />
              <div>
                <p className="text-sm font-pretendard-sb text-center-600">
                  모두의 중간지점
                </p>
                <p className="text-xs text-black-600">
                  {result.centroid.address ?? `(${result.centroid.lat.toFixed(4)}, ${result.centroid.lng.toFixed(4)})`}
                </p>
              </div>
            </div>
          )}

          {/* TSP 경로 요약 */}
          {result?.route && result.route.totalDistance > 0 && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary-100 border border-primary/20">
              <Route className="size-5 text-primary" />
              <div>
                <p className="text-sm font-pretendard-sb text-primary">최단 경로</p>
                <p className="text-xs text-black-600">
                  총 {result.route.totalDistance.toFixed(1)}km
                </p>
              </div>
            </div>
          )}

          {/* 참여자별 거리 */}
          {result?.distances && result.distances.length > 0 && (
            <div>
              <h3 className="text-sm font-pretendard-sb text-black-800 mb-2">중심점까지 거리</h3>
              <ul className="flex flex-col gap-1.5">
                {result.distances.map((d) => (
                  <li key={d.markerId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black-100/50">
                    <span className="text-sm text-black-800">{d.nickname}</span>
                    <span className="text-xs text-black-400">{d.distance.toFixed(1)}km</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* 참여자 목록 */}
          <div>
            <h3 className="text-sm font-pretendard-sb text-black-800 mb-2">참여자</h3>
            <ParticipantList markers={markers} myNickname={myNickname} />
          </div>

          {/* 주변 시설 추천 */}
          {result?.centroid && (
            <>
              <Separator />
              <NearbyPlaceList lat={result.centroid.lat} lng={result.centroid.lng} />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
});

ResultPanel.displayName = 'ResultPanel';

export default ResultPanel;
```

**Step 2: 커밋**

```bash
git add src/components/Panel/ResultPanel.tsx
git commit -m "feat: ResultPanel 확장 (거리, 경로, 주변 시설 추가)"
```

---

## Task 14: RoomPage 통합 (모든 기능 연결)

**Files:**
- Modify: `src/pages/RoomPage.tsx:1-248`

**Step 1: RoomPage 전면 교체**

MockMapView → MapView, 좌표 체계 lat/lng 전환, useGeolocation + usePWA + clipboard 연결, result 전달.

```tsx
// src/pages/RoomPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import EntryGate from '@/components/Panel/EntryGate';
import MapActionBar from '@/components/Map/MapActionBar';
import MapView from '@/components/Map/MapView';
import PlaceSearchBar from '@/components/Map/PlaceSearchBar';
import LocationConfirmSheet from '@/components/Panel/LocationConfirmSheet';
import ParticipantList from '@/components/Panel/ParticipantList';
import ProfileSheet from '@/components/Panel/ProfileSheet';
import ResultPanel from '@/components/Panel/ResultPanel';
import RoomHeader from '@/components/Panel/RoomHeader';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';
import useGeolocation from '@/hooks/useGeolocation';
import usePWA from '@/hooks/usePWA';
import { copyToClipboard } from '@/lib/clipboard';
import { useRoomStore } from '@/store/roomStore';
import { useUIStore } from '@/store/uiStore';
import type { PlaceResult } from '@/types';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoomStore((s) => s.room);
  const result = useRoomStore((s) => s.result);
  const isLoading = useRoomStore((s) => s.isLoading);
  const fetchRoom = useRoomStore((s) => s.fetchRoom);
  const addMarker = useRoomStore((s) => s.addMarker);
  const deleteMarker = useRoomStore((s) => s.deleteMarker);
  const verifyRoomPassword = useRoomStore((s) => s.verifyRoomPassword);
  const verifyParticipant = useRoomStore((s) => s.verifyParticipant);

  const nickname = useUIStore((s) => s.nickname);
  const participantPassword = useUIStore((s) => s.participantPassword);
  const entryStep = useUIStore((s) => s.entryStep);
  const setEntryStep = useUIStore((s) => s.setEntryStep);
  const setNickname = useUIStore((s) => s.setNickname);
  const setParticipantPassword = useUIStore((s) => s.setParticipantPassword);
  const pendingLocation = useUIStore((s) => s.pendingLocation);
  const isLocationSheetOpen = useUIStore((s) => s.isLocationSheetOpen);
  const setPendingLocation = useUIStore((s) => s.setPendingLocation);
  const openLocationSheet = useUIStore((s) => s.openLocationSheet);
  const closeLocationSheet = useUIStore((s) => s.closeLocationSheet);

  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const { position: gpsPosition, getCurrentPosition } = useGeolocation();
  const { canInstall, install, dismiss } = usePWA();

  // 방 데이터 로드
  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId, fetchRoom]);

  // 방 로드 완료 시 입장 단계 시작
  useEffect(() => {
    if (room && entryStep === 'idle') {
      if (room.password) {
        setEntryStep('room_password');
      } else {
        setEntryStep('done');
      }
    }
  }, [room, entryStep, setEntryStep]);

  // GPS 위치 → 지도 마커 등록 플로우
  useEffect(() => {
    if (gpsPosition && !pendingLocation) {
      setPendingLocation({ lat: gpsPosition.lat, lng: gpsPosition.lng });
      openLocationSheet();
    }
  }, [gpsPosition, pendingLocation, setPendingLocation, openLocationSheet]);

  // --- Entry handlers ---
  const handleRoomPasswordVerify = useCallback(async (password: string) => {
    try {
      const ok = await verifyRoomPassword(password);
      if (ok) {
        setEntryStep('done');
      }
      return ok;
    } catch {
      toast.error('비밀번호 확인에 실패했어요');
      return false;
    }
  }, [verifyRoomPassword, setEntryStep]);

  const needsProfile = !nickname || !participantPassword;

  const handleProfileSubmit = useCallback(async (name: string, pw: string) => {
    try {
      const existing = await verifyParticipant(name, pw);
      setNickname(name);
      setParticipantPassword(pw);
      setIsProfileSheetOpen(false);
      if (existing) {
        toast.success(`${name}님, 다시 오셨네요!`);
      } else {
        toast.success('이제 지도를 탭해서 위치를 찍어주세요!');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '참여에 실패했어요';
      toast.error(message);
      throw err;
    }
  }, [verifyParticipant, setNickname, setParticipantPassword]);

  // --- Map handlers ---
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (needsProfile) {
      setIsProfileSheetOpen(true);
      return;
    }
    const hasMyMarker = room?.markers.some((m) => m.nickname === nickname);
    if (hasMyMarker) return;

    setPendingLocation({ lat, lng });
    openLocationSheet();
  }, [needsProfile, room?.markers, nickname, setPendingLocation, openLocationSheet]);

  const handleLocationConfirm = useCallback(async () => {
    if (!pendingLocation) return;
    await addMarker({
      nickname,
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
      password: participantPassword,
    });
    closeLocationSheet();
    toast.success('위치가 등록되었어요!');
  }, [pendingLocation, nickname, participantPassword, addMarker, closeLocationSheet]);

  const handleRelocate = useCallback(async () => {
    const myMarker = room?.markers.find((m) => m.nickname === nickname);
    if (myMarker) {
      await deleteMarker(myMarker.id);
      toast.info('기존 위치를 삭제했어요. 새 위치를 찍어주세요');
    }
  }, [room?.markers, nickname, deleteMarker]);

  const handleShare = useCallback(async () => {
    const ok = await copyToClipboard(window.location.href);
    if (ok) {
      toast.info('링크가 복사되었어요! 친구들에게 공유해보세요');
    } else {
      toast.error('링크 복사에 실패했어요');
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (needsProfile) {
      setIsProfileSheetOpen(true);
      return;
    }
    getCurrentPosition();
    toast.info('현재 위치를 가져오고 있어요...');
  }, [needsProfile, getCurrentPosition]);

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    handleMapClick(place.lat, place.lng);
  }, [handleMapClick]);

  // --- Render ---
  if (isLoading && !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-black-400">불러오는 중...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-error">방을 찾을 수 없어요</p>
      </div>
    );
  }

  // 방 비밀번호 게이트
  if (entryStep === 'room_password') {
    return (
      <EntryGate
        roomName={room.name}
        onRoomPasswordVerify={handleRoomPasswordVerify}
      />
    );
  }

  const hasMyMarker = room.markers.some((m) => m.nickname === nickname);
  const hasAnyMarker = room.markers.length > 0;

  return (
    <div className="flex h-dvh bg-background">
      {/* 지도 영역 */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* 헤더 + 검색바: 지도 위 오버레이 */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm rounded-b-2xl mx-3 mt-3 shadow-sm">
            <RoomHeader
              roomName={room.name}
              participantCount={room.markers.length}
            />
          </div>
          <div className="flex justify-center mt-2 px-3">
            <PlaceSearchBar onPlaceSelect={handlePlaceSelect} />
          </div>
        </div>

        <MapView
          markers={room.markers}
          myNickname={nickname}
          result={result}
          onMapClick={handleMapClick}
          className="flex-1 min-h-0"
        />

        {/* 플로팅 액션 바 */}
        <MapActionBar
          onLocate={handleLocate}
          onShare={handleShare}
          onRelocate={handleRelocate}
          hasMyMarker={hasMyMarker}
          showShare={hasAnyMarker}
        />

        {/* PWA 설치 배너 */}
        {canInstall && (
          <div className="absolute bottom-20 left-3 right-3 z-10">
            <PWAInstallBanner onInstall={install} onDismiss={dismiss} />
          </div>
        )}
      </div>

      {/* 데스크톱 사이드 패널 (1024px+) */}
      {hasAnyMarker && (
        <div className="hidden lg:flex lg:w-[360px] lg:flex-col lg:border-l lg:border-black-300/50 lg:bg-white lg:overflow-y-auto">
          <div className="p-4 border-b border-black-300/50">
            <RoomHeader
              roomName={room.name}
              participantCount={room.markers.length}
            />
          </div>
          <div className="flex-1 p-4">
            <ParticipantList markers={room.markers} myNickname={nickname} />
          </div>
        </div>
      )}

      {/* 모바일/태블릿 ResultPanel (Drawer) */}
      {hasAnyMarker && (
        <div className="lg:hidden">
          <ResultPanel
            markers={room.markers}
            myNickname={nickname}
            result={result}
          />
        </div>
      )}

      {/* 프로필 입력 Drawer */}
      <ProfileSheet
        open={isProfileSheetOpen}
        onSubmit={handleProfileSubmit}
        onClose={() => setIsProfileSheetOpen(false)}
      />

      {/* 위치 확인 Drawer */}
      {pendingLocation && (
        <LocationConfirmSheet
          open={isLocationSheetOpen}
          onConfirm={handleLocationConfirm}
          onCancel={closeLocationSheet}
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
        />
      )}
    </div>
  );
};

export default RoomPage;
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 빌드 성공

**Step 3: 커밋**

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat: RoomPage 통합 (Google Maps, GPS, PWA, 클립보드, 검색)"
```

---

## Task 15: App.tsx 레이아웃 조정

**Files:**
- Modify: `src/App.tsx`

**Step 1: RoomPage는 전체 화면이므로 max-w-2xl 제한 제거**

RoomPage는 지도가 전체 화면을 사용하므로 `max-w-2xl mx-auto px-5`를 RoomPage에서는 제외해야 한다.
App.tsx에서 RoomPage 라우트를 main 밖으로 분리:

```typescript
// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";

import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import RoomPage from "@/pages/RoomPage";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <APIProvider apiKey={import.meta.env.GOOGLE_MAPS_API_KEY ?? ''}>
      <div className="min-h-dvh bg-background">
        <Routes>
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="*" element={
            <main className="max-w-2xl mx-auto px-5">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/widget-showcase" element={<WidgetShowcase />} />
              </Routes>
            </main>
          } />
        </Routes>
        <Toaster position="bottom-center" />
      </div>
    </APIProvider>
  );
}

export default App;
```

**Step 2: 커밋**

```bash
git add src/App.tsx
git commit -m "refactor: RoomPage 전체 화면 레이아웃을 위한 라우트 분리"
```

---

## Task 16: 최종 검증 + 정리

**Step 1: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

**Step 2: 테스트 확인**

Run: `npm run test`
Expected: geo.test.ts 통과

**Step 3: lint 확인**

Run: `npm run lint`
Expected: 에러 없음 (경고만 허용)

**Step 4: 불필요 파일 정리 확인**

- `MockMapView.tsx` 삭제됨
- `MapMarker.tsx` 삭제됨
- `SearchBar.tsx`(기존 common/) — PlaceSearchBar로 대체, 사용처 없으면 삭제

**Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: 최종 정리 및 빌드 검증"
```

---

## 작업 순서 요약

| Task | 내용 | 의존성 |
|------|------|--------|
| 1 | 패키지 설치 + 환경변수 | 없음 |
| 2 | 신규 타입 추가 | 없음 |
| 3 | geo.ts 계산 유틸 (TDD) | Task 2 (LatLng 타입) |
| 4 | clipboard.ts | 없음 |
| 5 | Mock 데이터 JSON | Task 2 (타입) |
| 6 | API 확장 (interface + mock + http) | Task 2, 3, 5 |
| 7 | 커스텀 훅 6개 | Task 2, 6 |
| 8 | App.tsx APIProvider | Task 1 |
| 9 | MapView + GoogleMarker + RoutePolyline | Task 1, 2, 8 |
| 10 | PlaceSearchBar + NearbyPlaceList | Task 2, 6, 7 |
| 11 | uiStore PendingLocation 변경 | Task 2 |
| 12 | LocationConfirmSheet 업데이트 | Task 7 (useGeocoding), 11 |
| 13 | ResultPanel 확장 | Task 2, 10 |
| 14 | RoomPage 통합 | Task 7, 9, 10, 11, 12, 13 |
| 15 | App.tsx 레이아웃 조정 | Task 8, 14 |
| 16 | 최종 검증 | 전체 |

**병렬 가능:** Task 1~5는 모두 독립적이므로 병렬 실행 가능.
