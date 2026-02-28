# 클린 아키텍처 리팩터링 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Phase 1에서 구현한 목업 API + Zustand 스토어를 클린 아키텍처(DIP) 기반으로 리팩터링. 백엔드 교체 시 스토어 코드 변경 없이 구현체만 교체할 수 있는 구조.

**Architecture:** Port(인터페이스) 레이어를 도입하여 의존성 역전. `api.interface.ts`에 계약을 정의하고, `api.mock.ts`가 이를 구현하며, `api.ts`가 팩토리 역할로 현재 구현체를 export. 스토어는 팩토리 export만 import하므로 구현체 교체 시 `api.ts` 한 줄만 변경.

**Tech Stack:** TypeScript strict, Zustand, Vitest

---

## 현재 → 목표 비교

```
[현재] roomStore → import api (구현체 직접 의존)

[목표] roomStore → import api (팩토리) → ApiClient (인터페이스)
                                            ↑ implements
                                     MockApiClient (localStorage)
                                     HttpApiClient (axios, 나중에)
```

---

### Task 1: ApiClient 인터페이스 정의

**Files:**
- Create: `src/lib/api.interface.ts`

**Step 1: Port 인터페이스 작성**

현재 `api.ts`의 메서드 시그니처를 그대로 인터페이스로 추출:

```typescript
import type { Room, Marker, MarkerRequest, RoomResult } from '@/types';

export interface ApiClient {
  createRoom(name: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  getResult(roomId: string): Promise<RoomResult | null>;
}
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공 (아직 아무 곳에서도 import하지 않으므로)

**Step 3: 커밋**

```bash
git add src/lib/api.interface.ts
git commit -m "refactor : ApiClient 포트 인터페이스 정의 #1"
```

---

### Task 2: 목업 구현체 분리

**Files:**
- Create: `src/lib/api.mock.ts` (기존 `api.ts` 내용 이동)
- Modify: `src/lib/api.ts` (팩토리로 전환)

**Step 1: api.mock.ts 생성**

기존 `api.ts` 내용을 `api.mock.ts`로 이동. `ApiClient` 인터페이스를 명시적으로 implements:

```typescript
import type { Room, Marker, MarkerRequest, RoomResult } from '@/types';
import type { ApiClient } from './api.interface';

const STORAGE_KEY = 'moaplace_rooms';

const getRooms = (): Record<string, Room> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

const mockApi: ApiClient = {
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

export default mockApi;
```

**Step 2: api.ts를 팩토리로 전환**

```typescript
import type { ApiClient } from './api.interface';
import mockApi from './api.mock';

// 백엔드 연동 시 여기만 변경:
// import httpApi from './api.http';
// const api: ApiClient = httpApi;
const api: ApiClient = mockApi;

export default api;
```

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공 (roomStore의 `import api from '@/lib/api'`는 경로 변경 없이 그대로 동작)

**Step 4: 커밋**

```bash
git add src/lib/api.mock.ts src/lib/api.ts
git commit -m "refactor : 목업 API 구현체 분리 및 팩토리 패턴 적용 #1"
```

---

### Task 3: 아키텍처 문서 업데이트

**Files:**
- Modify: `docs/01_ARCHITECTURE.md` (API 클라이언트 구조 섹션 추가)

**Step 1: 아키텍처 문서에 API 레이어 구조 추가**

`## 6. 상태 관리 전략` 앞에 새 섹션 삽입:

```markdown
## 5.5 API 클라이언트 구조 (클린 아키텍처)

의존성 역전 원칙(DIP) 적용. 스토어는 인터페이스에만 의존하고, 구현체는 팩토리에서 주입.

```
src/lib/
├── api.interface.ts   # Port — ApiClient 인터페이스 (계약)
├── api.mock.ts        # Adapter — localStorage 목업 구현체
├── api.ts             # Factory — 현재 구현체 선택 및 export
└── api.http.ts        # Adapter — axios 실서버 구현체 (Phase 5+)
```

교체 시 `api.ts`에서 import 한 줄만 변경:

```typescript
// Before (목업)
import mockApi from './api.mock';
const api: ApiClient = mockApi;

// After (실서버)
import httpApi from './api.http';
const api: ApiClient = httpApi;
```
```

**Step 2: 커밋**

```bash
git add docs/01_ARCHITECTURE.md
git commit -m "docs : API 클린 아키텍처 구조 문서화 #1"
```

---

## 요약

| Task | 설명 | 파일 |
|------|------|------|
| 1 | ApiClient 포트 인터페이스 정의 | `src/lib/api.interface.ts` |
| 2 | 목업 구현체 분리 + 팩토리 전환 | `src/lib/api.mock.ts`, `src/lib/api.ts` |
| 3 | 아키텍처 문서 업데이트 | `docs/01_ARCHITECTURE.md` |

**변경되지 않는 파일:** `src/store/roomStore.ts` — import 경로 `@/lib/api`가 그대로이므로 스토어 코드 변경 없음. 이것이 클린 아키텍처의 핵심 이점.
