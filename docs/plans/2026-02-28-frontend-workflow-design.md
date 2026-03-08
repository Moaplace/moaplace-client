# MoaPlace 프론트엔드 MVP 구현 디자인

> **Goal:** PRD v1.2 기반 MVP 전체(P0+P1+P2) 프론트엔드 구현. Three.js 3D 뷰 제외.

**접근법:** 페이지별 순차 구현 (UI 완성도 우선)
**제약조건:** 백엔드 미구현 → 목업 데이터 기반, Google Maps API 키 미확보 → 목업 지도 후 연동

---

## 로드맵

```
Phase 1: 공통 인프라 (타입 + 목업 API + 스토어)
Phase 2: HomePage (방 생성 + PWA 배너)
Phase 3: RoomPage UI 레이아웃 (목업 지도 + 패널 + 모달)
Phase 4: RoomPage 핵심 로직 (중심점 + TSP + Haversine)
Phase 5: 지도 연동 (Google Maps API 키 확보 후)
Phase 6: 실시간 + PWA + 마무리 (Polling + GPS + PWA)
```

---

## Phase 1: 공통 인프라

### 타입 정의 (`src/types/index.ts`)

```typescript
interface Room {
  id: string; // UUID
  name: string; // 모임 이름
  markers: Marker[];
  createdAt: string;
}

interface Marker {
  id: string;
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
  createdAt: string;
}

interface Centroid {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteResult {
  totalDistance: number; // km
  path: Marker[]; // 최단경로 순서
}

interface RoomResult {
  centroid: Centroid;
  route: RouteResult;
  distances: { markerId: string; distance: number }[];
}
```

### 목업 API (`src/lib/api.ts`)

localStorage 기반 목업. 백엔드 완성 시 axios로 교체할 수 있는 동일 인터페이스.

```typescript
const api = {
  createRoom(name: string): Promise<Room>
  getRoom(roomId: string): Promise<Room>
  addMarker(roomId: string, marker: MarkerRequest): Promise<Marker>
  deleteMarker(roomId: string, markerId: string): Promise<void>
  getResult(roomId: string): Promise<RoomResult>
}
```

### Zustand 스토어

**roomStore (`src/store/roomStore.ts`)**

```typescript
interface RoomState {
  room: Room | null;
  result: RoomResult | null;
  isLoading: boolean;
  fetchRoom: (id: string) => Promise<void>;
  addMarker: (marker: MarkerRequest) => Promise<void>;
  deleteMarker: (markerId: string) => Promise<void>;
}
```

**uiStore (`src/store/uiStore.ts`)**

```typescript
interface UIState {
  isNicknameModalOpen: boolean;
  isResultPanelExpanded: boolean;
  nickname: string;
  setNickname: (name: string) => void;
  toggleResultPanel: () => void;
}
```

---

## Phase 2: HomePage

PRD 와이어프레임 7.1 기반.

### 파일 구조

```
src/pages/HomePage.tsx
src/components/Home/CreateRoom.tsx
```

### 레이아웃

```
┌─────────────────────────────┐
│  🗺️ 모아장소                │
├─────────────────────────────┤
│  우리 만날 장소, 같이 찾자    │
│  로그인 없이 바로 시작하세요   │
│  ┌───────────────────────┐  │
│  │ 모임 이름 입력 (선택)   │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │  🚀 새로운 모임 만들기  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │  PWA 설치 배너          │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 동작 플로우

1. 모임 이름 입력 (선택, 빈 값 → "이름 없는 모임")
2. "새로운 모임 만들기" → `api.createRoom(name)` → UUID 발급
3. `/room/:roomId`로 navigate

---

## Phase 3+4: RoomPage

PRD 와이어프레임 7.2~7.4 기반.

### 파일 구조

```
src/pages/RoomPage.tsx
src/components/Map/
  ├── MapView.tsx          # 지도 (초기: 목업 → 후: Google Maps)
  ├── Marker.tsx
  ├── CenterPoint.tsx
  └── RouteLine.tsx
src/components/Panel/
  ├── ResultPanel.tsx      # 하단 결과 패널
  └── ParticipantList.tsx
```

### 레이아웃

```
┌─────────────────────────────┐
│  [모임이름]        👥 3명 참여 │
├─────────────────────────────┤
│  🔍 장소 검색                │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │      지도 영역 (80%)   │   │
│  │  📍A   ⭐중심   📍C   │   │
│  │        📍B           │   │
│  └──────────────────────┘   │
│  [📍위치찍기]     [🧭내위치]  │
├─────────────────────────────┤
│  ⭐ 중심점: 서울시 중구       │
│  📏 최단거리: 12.4km         │
│  👤 A (강남) 3.2km           │
│  👤 B (신촌) 4.1km           │
│  [🔗 링크 복사하기]           │
└─────────────────────────────┘
```

### 모달/시트

- **닉네임 입력 모달** (Dialog): 첫 진입 시 자동 표시
- **위치 확정 바텀시트** (Drawer): 지도 탭 후 "여기로 확정!" + 주소

### 핵심 로직

```
src/lib/
  ├── centroid.ts    # 좌표 산술 평균
  ├── tsp.ts         # ≤10: brute-force, >10: nearest neighbor
  ├── haversine.ts   # 두 좌표 간 지표면 거리 (km)
  └── clipboard.ts   # URL 클립보드 복사
```

---

## Phase 5: 지도 연동

Maps API 키 확보 후 MapView.tsx 내부만 교체.

```
패키지: @vis.gl/react-google-maps
환경변수: GOOGLE_MAPS_API_KEY

마커 색상:
  - 내 마커: bg-sub (오렌지)
  - 타인 마커: bg-primary (파란)
  - 중심점: bg-destructive (빨강) + ⭐
경로: Polyline으로 TSP 경로 표시
검색: Places API 자동완성
```

---

## Phase 6: 실시간 + PWA + 마무리

### 커스텀 훅

```
src/hooks/
  ├── useRoom.ts          # Polling 3초 → fetchRoom → 결과 재계산
  ├── useGeolocation.ts   # navigator.geolocation
  ├── usePWA.ts           # beforeinstallprompt
  └── useMap.ts           # 지도 조작 (줌, 패닝, 마커 CRUD)
```

### 데이터 플로우

```
사용자 → 지도 탭 → Marker 추가 → roomStore.addMarker()
                                      ↓
                              api.addMarker() (목업: localStorage)
                                      ↓
                              roomStore.fetchRoom() (Polling 3초)
                                      ↓
                              centroid.ts + tsp.ts → 결과 계산
                                      ↓
                              ResultPanel 업데이트
```

---

## 라우팅

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/room/:roomId" element={<RoomPage />} />
  <Route path="/widget-showcase" element={<WidgetShowcase />} />
</Routes>
```

---

**Last Updated:** 2026-02-28
