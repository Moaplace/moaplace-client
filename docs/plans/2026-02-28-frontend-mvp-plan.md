# MoaPlace 프론트엔드 MVP 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** PRD v1.2 기반 MVP 프론트엔드 전체 구현 (P0+P1+P2, Three.js 제외). 목업 데이터 기반으로 UI 완성 후, 백엔드/지도 API 확보 시 연동.

**Architecture:** 페이지별 순차 구현. Phase 1에서 타입/목업API/스토어 인프라를 세우고, Phase 2~3에서 HomePage·RoomPage UI를 완성하고, Phase 4에서 중심점/TSP/거리 핵심 로직을 TDD로 구현하고, Phase 5~6에서 Google Maps 연동 및 실시간/PWA를 붙인다.

**Tech Stack:** React 19, TypeScript strict, Vite 7, Tailwind CSS v4, Zustand, shadcn/ui, Vitest (순수 로직 테스트), @vis.gl/react-google-maps (Phase 5)

---

## Phase 1: 공통 인프라

### Task 1: 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: Zustand + Vitest 설치**

```bash
npm install zustand
npm install -D vitest
```

**Step 2: vitest 설정을 vite.config.ts에 추가**

`vite.config.ts`에 vitest 설정 추가:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
```

**Step 3: package.json에 test 스크립트 추가**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 성공

**Step 5: 커밋**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore : zustand 및 vitest 설치"
```

---

### Task 2: 타입 정의

**Files:**
- Create: `src/types/index.ts`

**Step 1: 타입 파일 생성**

```typescript
/** 방 (Room) — UUID 기반 모임 단위 */
export interface Room {
  id: string;
  name: string;
  markers: Marker[];
  createdAt: string;
}

/** 마커 (Marker) — 참여자의 위치 */
export interface Marker {
  id: string;
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
  createdAt: string;
}

/** 마커 생성 요청 */
export interface MarkerRequest {
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
}

/** 중심점 */
export interface Centroid {
  lat: number;
  lng: number;
  address?: string;
}

/** TSP 경로 결과 */
export interface RouteResult {
  totalDistance: number;
  path: Marker[];
}

/** 방 결과 (중심점 + 경로 + 개별 거리) */
export interface RoomResult {
  centroid: Centroid;
  route: RouteResult;
  distances: MarkerDistance[];
}

/** 마커별 중심점까지 거리 */
export interface MarkerDistance {
  markerId: string;
  nickname: string;
  distance: number;
}
```

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 성공

**Step 3: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat : 도메인 타입 정의 (Room, Marker, RoomResult)"
```

---

### Task 3: 목업 API 클라이언트

**Files:**
- Create: `src/lib/api.ts`

**Step 1: localStorage 기반 목업 API 구현**

백엔드 완성 시 axios 기반으로 교체할 수 있는 동일 인터페이스. `crypto.randomUUID()`로 ID 생성.

```typescript
import type { Room, Marker, MarkerRequest, RoomResult } from '@/types';

const STORAGE_KEY = 'moaplace_rooms';

const getRooms = (): Record<string, Room> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

const api = {
  async createRoom(name: string): Promise<Room> {
    const rooms = getRooms();
    const room: Room = {
      id: crypto.randomUUID(),
      name: name.trim() || '이름 없는 모임',
      markers: [],
      createdAt: new Date().toISOString(),
    };
    rooms[room.id] = room;
    saveRooms(rooms);
    return room;
  },

  async getRoom(roomId: string): Promise<Room> {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) throw new Error('방을 찾을 수 없어요');
    return room;
  },

  async addMarker(roomId: string, req: MarkerRequest): Promise<Marker> {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) throw new Error('방을 찾을 수 없어요');

    const marker: Marker = {
      id: crypto.randomUUID(),
      nickname: req.nickname,
      lat: req.lat,
      lng: req.lng,
      address: req.address,
      createdAt: new Date().toISOString(),
    };
    room.markers.push(marker);
    saveRooms(rooms);
    return marker;
  },

  async deleteMarker(roomId: string, markerId: string): Promise<void> {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) throw new Error('방을 찾을 수 없어요');

    room.markers = room.markers.filter((m) => m.id !== markerId);
    saveRooms(rooms);
  },

  async getResult(roomId: string): Promise<RoomResult | null> {
    const room = await this.getRoom(roomId);
    if (room.markers.length < 2) return null;
    // 결과 계산은 Phase 4에서 구현 후 연결
    return null;
  },
};

export default api;
```

**Step 2: 빌드 확인**

```bash
npm run build
```

**Step 3: 커밋**

```bash
git add src/lib/api.ts
git commit -m "feat : localStorage 기반 목업 API 클라이언트 구현"
```

---

### Task 4: Zustand 스토어

**Files:**
- Create: `src/store/roomStore.ts`
- Create: `src/store/uiStore.ts`

**Step 1: roomStore 생성**

```typescript
import { create } from 'zustand';
import type { Room, RoomResult, MarkerRequest } from '@/types';
import api from '@/lib/api';

interface RoomState {
  room: Room | null;
  result: RoomResult | null;
  isLoading: boolean;
  error: string | null;

  createRoom: (name: string) => Promise<Room>;
  fetchRoom: (id: string) => Promise<void>;
  addMarker: (req: MarkerRequest) => Promise<void>;
  deleteMarker: (markerId: string) => Promise<void>;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  result: null,
  isLoading: false,
  error: null,

  createRoom: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.createRoom(name);
      set({ room, isLoading: false });
      return room;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '방 생성에 실패했어요';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  fetchRoom: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.getRoom(id);
      const result = await api.getResult(id);
      set({ room, result, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '방 정보를 불러올 수 없어요';
      set({ error: msg, isLoading: false });
    }
  },

  addMarker: async (req) => {
    const { room } = get();
    if (!room) return;
    try {
      await api.addMarker(room.id, req);
      await get().fetchRoom(room.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '위치 등록에 실패했어요';
      set({ error: msg });
    }
  },

  deleteMarker: async (markerId) => {
    const { room } = get();
    if (!room) return;
    try {
      await api.deleteMarker(room.id, markerId);
      await get().fetchRoom(room.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '마커 삭제에 실패했어요';
      set({ error: msg });
    }
  },

  clearRoom: () => set({ room: null, result: null, error: null }),
}));
```

**Step 2: uiStore 생성**

```typescript
import { create } from 'zustand';

interface UIState {
  isNicknameModalOpen: boolean;
  isResultPanelExpanded: boolean;
  nickname: string;

  openNicknameModal: () => void;
  closeNicknameModal: () => void;
  setNickname: (name: string) => void;
  toggleResultPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNicknameModalOpen: false,
  isResultPanelExpanded: false,
  nickname: '',

  openNicknameModal: () => set({ isNicknameModalOpen: true }),
  closeNicknameModal: () => set({ isNicknameModalOpen: false }),
  setNickname: (name) => set({ nickname: name }),
  toggleResultPanel: () =>
    set((s) => ({ isResultPanelExpanded: !s.isResultPanelExpanded })),
}));
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/store/roomStore.ts src/store/uiStore.ts
git commit -m "feat : Zustand 스토어 구현 (roomStore, uiStore)"
```

---

## Phase 2: HomePage

### Task 5: CreateRoom 컴포넌트

**Files:**
- Create: `src/components/Home/CreateRoom.tsx`

**Step 1: 방 생성 폼 컴포넌트 구현**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoomStore } from '@/store/roomStore';
import { toast } from 'sonner';

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');
  const createRoom = useRoomStore((s) => s.createRoom);
  const isLoading = useRoomStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const room = await createRoom(roomName);
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('모임 생성에 실패했어요');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="모임 이름을 입력해주세요 (예: 주말 점심 모임)"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <Button
        className="w-full"
        size="lg"
        onClick={handleCreate}
        disabled={isLoading}
      >
        새로운 모임 만들기
      </Button>
    </div>
  );
};

export default CreateRoom;
```

**Step 2: 빌드 확인**

```bash
npm run build
```

**Step 3: 커밋**

```bash
git add src/components/Home/CreateRoom.tsx
git commit -m "feat : CreateRoom 방 생성 폼 컴포넌트 구현"
```

---

### Task 6: HomePage

**Files:**
- Create: `src/pages/HomePage.tsx`
- Modify: `src/App.tsx`

**Step 1: HomePage 컴포넌트 구현**

```tsx
import CreateRoom from '@/components/Home/CreateRoom';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';
import { toast } from 'sonner';

const HomePage = () => {
  return (
    <div className="pb-safe">
      <div className="flex flex-col items-center justify-center min-h-[60dvh] space-y-8">
        {/* 히어로 섹션 */}
        <div className="text-center space-y-2">
          <h1 className="font-pretendard-xbd text-3xl text-black">
            모아장소
          </h1>
          <p className="font-pretendard-md text-lg text-foreground">
            우리 만날 장소, 같이 찾자
          </p>
          <p className="text-sm text-muted-foreground">
            로그인 없이 바로 시작하세요
          </p>
        </div>

        {/* 방 생성 폼 */}
        <div className="w-full max-w-sm">
          <CreateRoom />
        </div>
      </div>

      {/* PWA 설치 배너 */}
      <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto">
        <PWAInstallBanner
          onInstall={() => toast.info('설치 시작!')}
          onDismiss={() => toast.info('다음에 할게요')}
        />
      </div>
    </div>
  );
};

export default HomePage;
```

**Step 2: App.tsx 라우팅 업데이트**

`src/App.tsx`를 수정하여 HomePage와 RoomPage(임시 placeholder) 라우트를 추가:

```tsx
import { Routes, Route } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import HomePage from '@/pages/HomePage';
import WidgetShowcase from '@/pages/WidgetShowcase';

function App() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-xl mx-auto px-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<div>RoomPage (구현 예정)</div>} />
          <Route path="/widget-showcase" element={<WidgetShowcase />} />
        </Routes>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 개발 서버에서 시각 확인**

```bash
npm run dev
```

- `http://localhost:5173/` 접속 → HomePage 표시 확인
- 모임 이름 입력 → "새로운 모임 만들기" 클릭 → `/room/:uuid` 이동 확인

**Step 5: 커밋**

```bash
git add src/pages/HomePage.tsx src/App.tsx
git commit -m "feat : HomePage 및 방 생성 플로우 구현"
```

---

## Phase 3: RoomPage UI 레이아웃

### Task 7: RoomPage 레이아웃 셸

**Files:**
- Create: `src/pages/RoomPage.tsx`
- Modify: `src/App.tsx` (RoomPage import 교체)

**Step 1: RoomPage 기본 구조 구현**

```tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomStore } from '@/store/roomStore';
import { useUIStore } from '@/store/uiStore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoomStore((s) => s.room);
  const isLoading = useRoomStore((s) => s.isLoading);
  const fetchRoom = useRoomStore((s) => s.fetchRoom);
  const nickname = useUIStore((s) => s.nickname);
  const openNicknameModal = useUIStore((s) => s.openNicknameModal);

  useEffect(() => {
    if (roomId) fetchRoom(roomId);
  }, [roomId, fetchRoom]);

  // 닉네임 미설정 시 모달 표시
  useEffect(() => {
    if (!nickname && !isLoading) {
      openNicknameModal();
    }
  }, [nickname, isLoading, openNicknameModal]);

  if (isLoading) {
    return (
      <div className="py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[60dvh] w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-safe flex flex-col h-[100dvh] -mx-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="font-pretendard-sb text-lg text-foreground truncate">
          {room?.name ?? '모임'}
        </h1>
        <Badge variant="secondary">
          {room?.markers.length ?? 0}명 참여
        </Badge>
      </header>

      {/* 지도 영역 (Task 8에서 MapView로 교체) */}
      <div className="flex-1 bg-black-100 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">지도 영역 (구현 예정)</p>
      </div>

      {/* 하단 패널 (Task 10에서 ResultPanel로 교체) */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-muted-foreground text-sm">결과 패널 (구현 예정)</p>
      </div>
    </div>
  );
};

export default RoomPage;
```

**Step 2: App.tsx에서 RoomPage import 교체**

```tsx
import RoomPage from '@/pages/RoomPage';
// ...
<Route path="/room/:roomId" element={<RoomPage />} />
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/pages/RoomPage.tsx src/App.tsx
git commit -m "feat : RoomPage 레이아웃 셸 구현"
```

---

### Task 8: MapView (목업)

**Files:**
- Create: `src/components/Map/MapView.tsx`
- Create: `src/components/Map/MapMarker.tsx`
- Modify: `src/pages/RoomPage.tsx`

**Step 1: MapMarker 컴포넌트**

마커 하나를 표시하는 컴포넌트. Phase 5에서 Google Maps AdvancedMarker로 교체.

```tsx
import { cn } from '@/lib/utils';

interface MapMarkerProps {
  nickname: string;
  isOwn?: boolean;
  isCenterPoint?: boolean;
  className?: string;
}

const MapMarker = ({ nickname, isOwn = false, isCenterPoint = false, className }: MapMarkerProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-pretendard-md shadow-sm',
        isCenterPoint && 'bg-destructive text-white',
        !isCenterPoint && isOwn && 'bg-sub text-white',
        !isCenterPoint && !isOwn && 'bg-primary text-white',
        className,
      )}
    >
      {isCenterPoint ? '⭐' : '📍'}
      <span>{isCenterPoint ? '중심점' : nickname}</span>
    </div>
  );
};

export default MapMarker;
```

**Step 2: MapView 목업 컴포넌트**

실제 지도 대신 마커 목록을 시각적으로 보여주는 목업. Phase 5에서 Google Maps로 교체.

```tsx
import type { Marker, Centroid } from '@/types';
import MapMarker from '@/components/Map/MapMarker';

interface MapViewProps {
  markers: Marker[];
  centroid?: Centroid | null;
  currentNickname?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapView = ({ markers, centroid, currentNickname, onMapClick }: MapViewProps) => {
  const handleClick = () => {
    // 목업: 서울 내 랜덤 좌표 생성
    const lat = 37.5 + (Math.random() - 0.5) * 0.1;
    const lng = 127.0 + (Math.random() - 0.5) * 0.1;
    onMapClick?.(lat, lng);
  };

  return (
    <div
      className="relative w-full h-full bg-black-100 overflow-auto cursor-pointer"
      onClick={handleClick}
    >
      {/* 목업 지도 안내 */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            지도를 탭하여 내 위치를 찍어주세요
          </p>
        </div>
      )}

      {/* 마커 목록 */}
      <div className="absolute top-4 left-4 space-y-2">
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            nickname={marker.nickname}
            isOwn={marker.nickname === currentNickname}
          />
        ))}
        {centroid && <MapMarker nickname="중심점" isCenterPoint />}
      </div>

      {/* 좌표 정보 (디버그) */}
      {markers.length > 0 && (
        <div className="absolute bottom-4 right-4 text-xs text-black-400 space-y-1">
          {markers.map((m) => (
            <div key={m.id}>
              {m.nickname}: ({m.lat.toFixed(4)}, {m.lng.toFixed(4)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapView;
```

**Step 3: RoomPage에 MapView 연결**

RoomPage의 지도 영역 placeholder를 MapView로 교체:

```tsx
import MapView from '@/components/Map/MapView';
```

지도 영역 부분을:
```tsx
<MapView
  markers={room?.markers ?? []}
  centroid={result?.centroid}
  currentNickname={nickname}
  onMapClick={handleMapClick}
/>
```

`handleMapClick`는 위치 확정 바텀시트를 여는 핸들러 (Task 11에서 구현).

**Step 4: 빌드 확인**

```bash
npm run build
```

**Step 5: 커밋**

```bash
git add src/components/Map/MapView.tsx src/components/Map/MapMarker.tsx src/pages/RoomPage.tsx
git commit -m "feat : MapView 목업 및 MapMarker 컴포넌트 구현"
```

---

### Task 9: 닉네임 입력 모달

**Files:**
- Create: `src/components/Map/NicknameModal.tsx`
- Modify: `src/pages/RoomPage.tsx`

**Step 1: NicknameModal 구현**

기존 shadcn Dialog 활용. PRD 와이어프레임 7.3 기반.

```tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

const NicknameModal = () => {
  const [inputValue, setInputValue] = useState('');
  const isOpen = useUIStore((s) => s.isNicknameModalOpen);
  const closeModal = useUIStore((s) => s.closeNicknameModal);
  const setNickname = useUIStore((s) => s.setNickname);

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>이름을 입력해주세요</DialogTitle>
          <DialogDescription>
            모임에서 사용할 이름을 입력해주세요
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="이름 입력 (예: 홍길동)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        <Button
          className="w-full mt-2"
          onClick={handleConfirm}
          disabled={!inputValue.trim()}
        >
          확인
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NicknameModal;
```

**Step 2: RoomPage에 NicknameModal 추가**

```tsx
import NicknameModal from '@/components/Map/NicknameModal';
// return 내부 마지막에 추가:
<NicknameModal />
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/components/Map/NicknameModal.tsx src/pages/RoomPage.tsx
git commit -m "feat : 닉네임 입력 모달 구현"
```

---

### Task 10: 결과 패널 + 참여자 목록

**Files:**
- Create: `src/components/Panel/ParticipantList.tsx`
- Create: `src/components/Panel/ResultPanel.tsx`
- Modify: `src/pages/RoomPage.tsx`

**Step 1: ParticipantList 구현**

```tsx
import type { Marker, MarkerDistance } from '@/types';

interface ParticipantListProps {
  markers: Marker[];
  distances: MarkerDistance[];
  currentNickname?: string;
}

const ParticipantList = ({ markers, distances, currentNickname }: ParticipantListProps) => {
  if (markers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        아직 아무도 위치를 찍지 않았어요. 첫 번째로 찍어볼까요?
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {markers.map((marker) => {
        const dist = distances.find((d) => d.markerId === marker.id);
        const isOwn = marker.nickname === currentNickname;

        return (
          <div key={marker.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isOwn ? 'bg-sub' : 'bg-primary'}`}
              />
              <span className={isOwn ? 'font-pretendard-md' : ''}>
                {marker.nickname}
                {marker.address && (
                  <span className="text-muted-foreground ml-1">
                    ({marker.address})
                  </span>
                )}
              </span>
            </div>
            {dist && (
              <span className="text-muted-foreground">
                {dist.distance.toFixed(1)}km
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantList;
```

**Step 2: ResultPanel 구현**

```tsx
import type { RoomResult, Marker } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ParticipantList from '@/components/Panel/ParticipantList';
import { toast } from 'sonner';

interface ResultPanelProps {
  result: RoomResult | null;
  markers: Marker[];
  currentNickname?: string;
  roomId: string;
}

const ResultPanel = ({ result, markers, currentNickname, roomId }: ResultPanelProps) => {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      toast.success('링크가 복사되었어요! 친구들에게 공유해보세요');
    } catch {
      toast.error('링크 복사에 실패했어요');
    }
  };

  return (
    <div className="px-4 py-4 space-y-3">
      {/* 중심점 + 거리 요약 */}
      {result && (
        <>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-destructive">⭐</span>
              <span className="font-pretendard-md">모두의 중심점</span>
              {result.centroid.address && (
                <span className="text-sm text-muted-foreground">
                  {result.centroid.address}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>📏</span>
              <span>최단거리: {result.route.totalDistance.toFixed(1)}km</span>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* 참여자 목록 */}
      <ParticipantList
        markers={markers}
        distances={result?.distances ?? []}
        currentNickname={currentNickname}
      />

      <Separator />

      {/* 링크 복사 */}
      <Button variant="sub" className="w-full" size="lg" onClick={handleCopyLink}>
        링크 복사하기
      </Button>
    </div>
  );
};

export default ResultPanel;
```

**Step 3: RoomPage에 ResultPanel 연결**

RoomPage의 하단 패널 placeholder를 ResultPanel로 교체:

```tsx
import ResultPanel from '@/components/Panel/ResultPanel';
// ...
<ResultPanel
  result={result}
  markers={room?.markers ?? []}
  currentNickname={nickname}
  roomId={roomId!}
/>
```

**Step 4: 빌드 확인**

```bash
npm run build
```

**Step 5: 커밋**

```bash
git add src/components/Panel/ParticipantList.tsx src/components/Panel/ResultPanel.tsx src/pages/RoomPage.tsx
git commit -m "feat : 결과 패널 및 참여자 목록 컴포넌트 구현"
```

---

### Task 11: 위치 확정 바텀시트

**Files:**
- Create: `src/components/Map/LocationConfirmSheet.tsx`
- Modify: `src/pages/RoomPage.tsx`

**Step 1: LocationConfirmSheet 구현**

PRD 와이어프레임 7.4 기반. 지도 탭 후 "여기로 확정!" 바텀시트.

```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface LocationConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  address?: string;
  onConfirm: () => void;
}

const LocationConfirmSheet = ({
  open,
  onOpenChange,
  lat,
  lng,
  address,
  onConfirm,
}: LocationConfirmSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>이 위치로 등록할까요?</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4">
          <div className="text-sm text-foreground">
            {address ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button variant="sub" className="flex-1" onClick={onConfirm}>
              여기로 확정!
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LocationConfirmSheet;
```

**Step 2: RoomPage에 위치 선택 플로우 연결**

RoomPage에 상태 추가 및 MapView → LocationConfirmSheet → addMarker 연결:

```tsx
import { useState } from 'react';
import LocationConfirmSheet from '@/components/Map/LocationConfirmSheet';
import { toast } from 'sonner';

// 컴포넌트 내부:
const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

const handleMapClick = (lat: number, lng: number) => {
  if (!nickname) {
    openNicknameModal();
    return;
  }
  setSelectedLocation({ lat, lng });
};

const handleConfirmLocation = async () => {
  if (!selectedLocation || !nickname) return;
  await addMarker({
    nickname,
    lat: selectedLocation.lat,
    lng: selectedLocation.lng,
  });
  setSelectedLocation(null);
  toast.success('위치가 등록되었어요!');
};

// JSX:
<LocationConfirmSheet
  open={!!selectedLocation}
  onOpenChange={(open) => !open && setSelectedLocation(null)}
  lat={selectedLocation?.lat ?? 0}
  lng={selectedLocation?.lng ?? 0}
  onConfirm={handleConfirmLocation}
/>
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 개발 서버에서 전체 플로우 확인**

```bash
npm run dev
```

1. `/` 접속 → 모임 이름 입력 → 방 생성
2. `/room/:id` → 닉네임 입력 모달
3. 지도 클릭 → 위치 확정 바텀시트 → "여기로 확정!"
4. 마커 등록 확인, 참여자 목록 표시
5. "링크 복사하기" 동작 확인

**Step 5: 커밋**

```bash
git add src/components/Map/LocationConfirmSheet.tsx src/pages/RoomPage.tsx
git commit -m "feat : 위치 확정 바텀시트 및 마커 등록 플로우 구현"
```

---

## Phase 4: 핵심 로직 (TDD)

### Task 12: Haversine 거리 계산

**Files:**
- Create: `src/lib/haversine.ts`
- Create: `src/lib/__tests__/haversine.test.ts`

**Step 1: 테스트 작성**

```typescript
import { describe, it, expect } from 'vitest';
import { haversine } from '../haversine';

describe('haversine', () => {
  it('같은 위치는 거리 0', () => {
    expect(haversine(37.5665, 126.9780, 37.5665, 126.9780)).toBe(0);
  });

  it('서울시청-강남역 거리 약 8.9km', () => {
    // 서울시청: 37.5665, 126.9780
    // 강남역: 37.4979, 127.0276
    const dist = haversine(37.5665, 126.9780, 37.4979, 127.0276);
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(10);
  });

  it('서울-부산 거리 약 325km', () => {
    // 서울: 37.5665, 126.9780
    // 부산: 35.1796, 129.0756
    const dist = haversine(37.5665, 126.9780, 35.1796, 129.0756);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(350);
  });

  it('결과는 항상 양수', () => {
    const dist = haversine(0, 0, 1, 1);
    expect(dist).toBeGreaterThan(0);
  });
});
```

**Step 2: 테스트 실패 확인**

```bash
npx vitest run src/lib/__tests__/haversine.test.ts
```

Expected: FAIL (모듈 없음)

**Step 3: 구현**

```typescript
const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** 두 좌표 사이의 지표면 거리 (km) — Haversine 공식 */
export const haversine = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};
```

**Step 4: 테스트 통과 확인**

```bash
npx vitest run src/lib/__tests__/haversine.test.ts
```

Expected: 4 tests PASS

**Step 5: 커밋**

```bash
git add src/lib/haversine.ts src/lib/__tests__/haversine.test.ts
git commit -m "feat : Haversine 거리 계산 유틸 구현 (TDD)"
```

---

### Task 13: 중심점 계산

**Files:**
- Create: `src/lib/centroid.ts`
- Create: `src/lib/__tests__/centroid.test.ts`

**Step 1: 테스트 작성**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCentroid } from '../centroid';

describe('calculateCentroid', () => {
  it('마커 1개면 그 좌표가 중심점', () => {
    const result = calculateCentroid([{ lat: 37.5, lng: 127.0 }]);
    expect(result.lat).toBe(37.5);
    expect(result.lng).toBe(127.0);
  });

  it('마커 2개면 중간점', () => {
    const result = calculateCentroid([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
    ]);
    expect(result.lat).toBe(37.5);
    expect(result.lng).toBe(127.5);
  });

  it('마커 3개 산술 평균', () => {
    const result = calculateCentroid([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
      { lat: 36.0, lng: 126.0 },
    ]);
    expect(result.lat).toBeCloseTo(37.0, 5);
    expect(result.lng).toBeCloseTo(127.0, 5);
  });

  it('빈 배열은 (0, 0)', () => {
    const result = calculateCentroid([]);
    expect(result.lat).toBe(0);
    expect(result.lng).toBe(0);
  });
});
```

**Step 2: 테스트 실패 확인**

```bash
npx vitest run src/lib/__tests__/centroid.test.ts
```

Expected: FAIL

**Step 3: 구현**

```typescript
interface LatLng {
  lat: number;
  lng: number;
}

/** 좌표 배열의 기하학적 중심점 (산술 평균) */
export const calculateCentroid = (points: LatLng[]): LatLng => {
  if (points.length === 0) return { lat: 0, lng: 0 };

  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length,
  };
};
```

**Step 4: 테스트 통과 확인**

```bash
npx vitest run src/lib/__tests__/centroid.test.ts
```

Expected: 4 tests PASS

**Step 5: 커밋**

```bash
git add src/lib/centroid.ts src/lib/__tests__/centroid.test.ts
git commit -m "feat : 중심점 계산 유틸 구현 (TDD)"
```

---

### Task 14: TSP 최단거리 경로 계산

**Files:**
- Create: `src/lib/tsp.ts`
- Create: `src/lib/__tests__/tsp.test.ts`

**Step 1: 테스트 작성**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTSP } from '../tsp';
import type { Marker } from '@/types';

const makeMarker = (id: string, lat: number, lng: number): Marker => ({
  id,
  nickname: id,
  lat,
  lng,
  createdAt: '',
});

describe('calculateTSP', () => {
  it('마커 0~1개면 빈 경로, 거리 0', () => {
    const result = calculateTSP([]);
    expect(result.totalDistance).toBe(0);
    expect(result.path).toEqual([]);

    const one = calculateTSP([makeMarker('A', 37.5, 127.0)]);
    expect(one.totalDistance).toBe(0);
    expect(one.path).toHaveLength(1);
  });

  it('마커 2개면 왕복 거리', () => {
    const markers = [
      makeMarker('A', 37.5665, 126.9780), // 서울시청
      makeMarker('B', 37.4979, 127.0276), // 강남역
    ];
    const result = calculateTSP(markers);
    expect(result.path).toHaveLength(2);
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  it('마커 3개 경로는 모든 마커를 포함', () => {
    const markers = [
      makeMarker('A', 37.5665, 126.9780),
      makeMarker('B', 37.4979, 127.0276),
      makeMarker('C', 37.5140, 127.0600),
    ];
    const result = calculateTSP(markers);
    expect(result.path).toHaveLength(3);
    const ids = result.path.map((m) => m.id).sort();
    expect(ids).toEqual(['A', 'B', 'C']);
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  it('10개 이하면 정확한 최단거리 (brute-force)', () => {
    const markers = [
      makeMarker('A', 37.0, 127.0),
      makeMarker('B', 37.1, 127.0),
      makeMarker('C', 37.2, 127.0),
      makeMarker('D', 37.3, 127.0),
    ];
    // 직선상 배치 → 최단경로는 A-B-C-D 순서
    const result = calculateTSP(markers);
    expect(result.path[0].id).toBe('A');
    expect(result.path[3].id).toBe('D');
  });
});
```

**Step 2: 테스트 실패 확인**

```bash
npx vitest run src/lib/__tests__/tsp.test.ts
```

Expected: FAIL

**Step 3: 구현**

```typescript
import type { Marker } from '@/types';
import type { RouteResult } from '@/types';
import { haversine } from './haversine';

const TSP_BRUTE_FORCE_LIMIT = 10;

/** 순열 생성 (brute-force용) */
const permutations = <T>(arr: T[]): T[][] => {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
};

/** 경로 총 거리 계산 */
const totalDistance = (path: Marker[]): number => {
  let dist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    dist += haversine(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
  }
  return dist;
};

/** Brute-force TSP (≤10) */
const bruteForce = (markers: Marker[]): RouteResult => {
  const perms = permutations(markers);
  let bestPath = markers;
  let bestDist = Infinity;

  for (const perm of perms) {
    const dist = totalDistance(perm);
    if (dist < bestDist) {
      bestDist = dist;
      bestPath = perm;
    }
  }

  return { totalDistance: bestDist, path: bestPath };
};

/** Nearest Neighbor 휴리스틱 (>10) */
const nearestNeighbor = (markers: Marker[]): RouteResult => {
  let bestPath: Marker[] = [];
  let bestDist = Infinity;

  // 각 마커를 시작점으로 시도
  for (let start = 0; start < markers.length; start++) {
    const visited = new Set<string>();
    const path: Marker[] = [];
    let current = markers[start];
    path.push(current);
    visited.add(current.id);

    while (visited.size < markers.length) {
      let nearest: Marker | null = null;
      let nearestDist = Infinity;

      for (const m of markers) {
        if (visited.has(m.id)) continue;
        const d = haversine(current.lat, current.lng, m.lat, m.lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = m;
        }
      }

      if (nearest) {
        path.push(nearest);
        visited.add(nearest.id);
        current = nearest;
      }
    }

    const dist = totalDistance(path);
    if (dist < bestDist) {
      bestDist = dist;
      bestPath = path;
    }
  }

  return { totalDistance: bestDist, path: bestPath };
};

/** TSP 최단거리 경로 계산 */
export const calculateTSP = (markers: Marker[]): RouteResult => {
  if (markers.length <= 1) {
    return { totalDistance: 0, path: [...markers] };
  }

  if (markers.length <= TSP_BRUTE_FORCE_LIMIT) {
    return bruteForce(markers);
  }

  return nearestNeighbor(markers);
};
```

**Step 4: 테스트 통과 확인**

```bash
npx vitest run src/lib/__tests__/tsp.test.ts
```

Expected: 4 tests PASS

**Step 5: 전체 테스트 통과 확인**

```bash
npm run test
```

Expected: 모든 테스트 PASS

**Step 6: 커밋**

```bash
git add src/lib/tsp.ts src/lib/__tests__/tsp.test.ts
git commit -m "feat : TSP 최단거리 경로 계산 구현 (TDD)"
```

---

### Task 15: 목업 API에 결과 계산 연결

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: api.getResult에 centroid + tsp 연결**

`src/lib/api.ts`의 `getResult` 메서드를 수정:

```typescript
import { calculateCentroid } from './centroid';
import { calculateTSP } from './tsp';
import { haversine } from './haversine';

// getResult 메서드:
async getResult(roomId: string): Promise<RoomResult | null> {
  const room = await this.getRoom(roomId);
  if (room.markers.length < 2) return null;

  const centroid = calculateCentroid(room.markers);
  const route = calculateTSP(room.markers);
  const distances: MarkerDistance[] = room.markers.map((m) => ({
    markerId: m.id,
    nickname: m.nickname,
    distance: haversine(m.lat, m.lng, centroid.lat, centroid.lng),
  }));

  return { centroid, route, distances };
},
```

RoomResult와 MarkerDistance import 추가:

```typescript
import type { Room, Marker, MarkerRequest, RoomResult, MarkerDistance } from '@/types';
```

**Step 2: 빌드 확인**

```bash
npm run build
```

**Step 3: 개발 서버에서 전체 플로우 확인**

```bash
npm run dev
```

1. 방 생성 → 마커 2개 이상 등록
2. 결과 패널에 중심점, 최단거리, 참여자별 거리 표시 확인

**Step 4: 커밋**

```bash
git add src/lib/api.ts
git commit -m "feat : 목업 API에 중심점/TSP 결과 계산 연결"
```

---

## Phase 5: Google Maps 연동

> **전제조건:** Google Maps JavaScript API + Places API 키 확보 후 실행

### Task 16: Google Maps 패키지 설치 및 환경변수

**Files:**
- Modify: `package.json`
- Create: `.env.local`

**Step 1: 패키지 설치**

```bash
npm install @vis.gl/react-google-maps
```

**Step 2: 환경변수 설정**

`.env.local` 생성 (gitignore 확인):

```
VITE_GOOGLE_MAPS_API_KEY=여기에_API_키_입력
```

**Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore : @vis.gl/react-google-maps 패키지 설치"
```

---

### Task 17: MapView를 Google Maps로 교체

**Files:**
- Modify: `src/components/Map/MapView.tsx`
- Modify: `src/App.tsx` (APIProvider 래핑)

**Step 1: App.tsx에 APIProvider 추가**

```tsx
import { APIProvider } from '@vis.gl/react-google-maps';

// App 컴포넌트에서 main 태그 감싸기:
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

return (
  <div className="min-h-dvh bg-background">
    {apiKey ? (
      <APIProvider apiKey={apiKey}>
        <main className="max-w-xl mx-auto px-4">
          {/* Routes */}
        </main>
      </APIProvider>
    ) : (
      <main className="max-w-xl mx-auto px-4">
        {/* Routes — 목업 모드 */}
      </main>
    )}
    <Toaster position="bottom-center" />
  </div>
);
```

**Step 2: MapView를 Google Maps 기반으로 교체**

```tsx
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Marker, Centroid } from '@/types';
import { AppColors } from '@/constants/colors';

interface MapViewProps {
  markers: Marker[];
  centroid?: Centroid | null;
  currentNickname?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

const MapView = ({ markers, centroid, currentNickname, onMapClick }: MapViewProps) => {
  const handleClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onMapClick?.(e.latLng.lat(), e.latLng.lng());
    }
  };

  return (
    <Map
      defaultCenter={SEOUL_CENTER}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI
      mapId="moaplace-map"
      onClick={handleClick}
      className="w-full h-full"
    >
      {markers.map((marker) => {
        const isOwn = marker.nickname === currentNickname;
        return (
          <AdvancedMarker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.nickname}
          >
            <Pin
              background={isOwn ? AppColors.sub : AppColors.primary}
              borderColor={isOwn ? AppColors.sub600 : AppColors.primary600}
              glyphColor={AppColors.white}
            />
          </AdvancedMarker>
        );
      })}

      {centroid && (
        <AdvancedMarker
          position={{ lat: centroid.lat, lng: centroid.lng }}
          title="중심점"
        >
          <Pin
            background={AppColors.error}
            borderColor={AppColors.error}
            glyphColor={AppColors.white}
          />
        </AdvancedMarker>
      )}
    </Map>
  );
};

export default MapView;
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/components/Map/MapView.tsx src/App.tsx
git commit -m "feat : Google Maps 연동 및 MapView 교체"
```

---

### Task 18: 장소 검색 연동

**Files:**
- Modify: `src/components/common/SearchBar.tsx`

**Step 1: SearchBar에 Places Autocomplete 연동**

Google Places API의 `usePlacesAutocomplete`를 활용하거나, `@vis.gl/react-google-maps`의 `useMapsLibrary`로 Places 라이브러리를 로드하여 Autocomplete 기능 구현.

기존 SearchBar의 인터페이스를 유지하되, 검색 시 Places API 자동완성을 추가. 선택한 장소의 좌표를 콜백으로 전달하는 `onPlaceSelect?: (lat: number, lng: number, address: string) => void` prop 추가.

**Step 2: 빌드 확인**

```bash
npm run build
```

**Step 3: 커밋**

```bash
git add src/components/common/SearchBar.tsx
git commit -m "feat : SearchBar에 Places Autocomplete 연동"
```

---

## Phase 6: 실시간 + PWA + 마무리

### Task 19: useRoom 훅 (Polling)

**Files:**
- Create: `src/hooks/useRoom.ts`
- Modify: `src/pages/RoomPage.tsx`

**Step 1: useRoom 커스텀 훅 구현**

3초 간격 Polling으로 방 데이터를 갱신하는 훅.

```typescript
import { useEffect, useRef } from 'react';
import { useRoomStore } from '@/store/roomStore';

const POLL_INTERVAL = 3000;

const useRoom = (roomId: string | undefined) => {
  const fetchRoom = useRoomStore((s) => s.fetchRoom);
  const room = useRoomStore((s) => s.room);
  const result = useRoomStore((s) => s.result);
  const isLoading = useRoomStore((s) => s.isLoading);
  const error = useRoomStore((s) => s.error);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;

    fetchRoom(roomId);

    intervalRef.current = setInterval(() => {
      fetchRoom(roomId);
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roomId, fetchRoom]);

  return { room, result, isLoading, error };
};

export default useRoom;
```

**Step 2: RoomPage에서 useRoom 훅 사용**

기존 `useEffect + fetchRoom` 직접 호출을 `useRoom` 훅으로 교체.

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/hooks/useRoom.ts src/pages/RoomPage.tsx
git commit -m "feat : useRoom 훅 구현 (3초 Polling)"
```

---

### Task 20: useGeolocation 훅

**Files:**
- Create: `src/hooks/useGeolocation.ts`
- Modify: `src/pages/RoomPage.tsx`

**Step 1: useGeolocation 훅 구현**

```typescript
import { useState, useCallback } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  isLoading: boolean;
  error: string | null;
}

const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    isLoading: false,
    error: null,
  });

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: '위치 서비스를 지원하지 않는 브라우저예요' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? '위치 권한을 허용해주세요'
            : '위치를 가져올 수 없었어요';
        setState((s) => ({ ...s, isLoading: false, error: msg }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { ...state, getCurrentPosition };
};

export default useGeolocation;
```

**Step 2: RoomPage에 "내 위치" 버튼 추가**

지도 영역 아래에 플로팅 버튼으로 추가. 클릭 시 `getCurrentPosition` → 좌표를 `onMapClick`에 전달.

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/hooks/useGeolocation.ts src/pages/RoomPage.tsx
git commit -m "feat : useGeolocation 훅 및 내 위치 버튼 구현"
```

---

### Task 21: usePWA 훅

**Files:**
- Create: `src/hooks/usePWA.ts`
- Modify: `src/pages/HomePage.tsx`

**Step 1: usePWA 훅 구현**

```typescript
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, []);

  return { isInstallable, isInstalled, install, dismiss };
};

export default usePWA;
```

**Step 2: HomePage에서 PWAInstallBanner를 usePWA 훅으로 연결**

기존 하드코딩된 toast 콜백 대신, `usePWA` 훅의 `install`/`dismiss`/`isInstallable` 사용:

```tsx
import usePWA from '@/hooks/usePWA';

const { isInstallable, install, dismiss } = usePWA();

// 조건부 렌더링:
{isInstallable && (
  <PWAInstallBanner onInstall={install} onDismiss={dismiss} />
)}
```

**Step 3: 빌드 확인**

```bash
npm run build
```

**Step 4: 커밋**

```bash
git add src/hooks/usePWA.ts src/pages/HomePage.tsx
git commit -m "feat : usePWA 훅 및 조건부 PWA 배너 연결"
```

---

### Task 22: clipboard 유틸 + 최종 통합

**Files:**
- Create: `src/lib/clipboard.ts`
- Modify: `src/components/Panel/ResultPanel.tsx`

**Step 1: clipboard 유틸 구현**

```typescript
/** URL을 클립보드에 복사 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 폴백: textarea 방식
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};
```

**Step 2: ResultPanel에서 clipboard 유틸 사용**

기존 `navigator.clipboard.writeText` 직접 호출을 `copyToClipboard`로 교체.

**Step 3: 전체 빌드 + 테스트 확인**

```bash
npm run test && npm run build
```

**Step 4: 개발 서버에서 전체 E2E 플로우 확인**

```bash
npm run dev
```

1. `/` → 방 생성 → `/room/:id` 이동
2. 닉네임 입력 → 지도 클릭 → "여기로 확정!" → 마커 등록
3. 마커 2개 이상 등록 시 중심점 + 최단거리 + 참여자 거리 표시
4. "링크 복사하기" 동작 확인
5. 복사한 URL로 새 탭 접속 → 기존 마커 표시 확인

**Step 5: 커밋**

```bash
git add src/lib/clipboard.ts src/components/Panel/ResultPanel.tsx
git commit -m "feat : clipboard 유틸 및 최종 통합 완료"
```

---

## 상태: 각 Task Status

| Task | Phase | 설명 | Status |
|------|-------|------|--------|
| 1 | 1 | 패키지 설치 (Zustand + Vitest) | PENDING |
| 2 | 1 | 타입 정의 | PENDING |
| 3 | 1 | 목업 API 클라이언트 | PENDING |
| 4 | 1 | Zustand 스토어 | PENDING |
| 5 | 2 | CreateRoom 컴포넌트 | PENDING |
| 6 | 2 | HomePage + 라우팅 | PENDING |
| 7 | 3 | RoomPage 레이아웃 셸 | PENDING |
| 8 | 3 | MapView (목업) + MapMarker | PENDING |
| 9 | 3 | 닉네임 입력 모달 | PENDING |
| 10 | 3 | 결과 패널 + 참여자 목록 | PENDING |
| 11 | 3 | 위치 확정 바텀시트 | PENDING |
| 12 | 4 | Haversine 거리 계산 (TDD) | PENDING |
| 13 | 4 | 중심점 계산 (TDD) | PENDING |
| 14 | 4 | TSP 최단거리 경로 (TDD) | PENDING |
| 15 | 4 | 목업 API에 결과 계산 연결 | PENDING |
| 16 | 5 | Google Maps 패키지 설치 | PENDING |
| 17 | 5 | MapView → Google Maps 교체 | PENDING |
| 18 | 5 | 장소 검색 연동 | PENDING |
| 19 | 6 | useRoom 훅 (Polling) | PENDING |
| 20 | 6 | useGeolocation 훅 | PENDING |
| 21 | 6 | usePWA 훅 | PENDING |
| 22 | 6 | clipboard 유틸 + 최종 통합 | PENDING |
