# 방 입장 인증 + 마커 수정 플로우 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 방 비밀번호(선택) + 참여자 닉네임/비번 인증 2단계 입장 플로우 구현. 재진입 시 마커 수정/삭제 가능.

**Architecture:** 클린 아키텍처(Port→Adapter→Factory) 유지. Room에 password 선택 필드, Marker에 password 필수 필드 추가. uiStore에 entryStep 상태 머신으로 2단계 인증 관리. NicknameModal을 EntryModal로 확장.

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS(AppColors 토큰), Zustand, shadcn/ui(Dialog, Input, Button)

**커밋 규칙:** 사용자가 리뷰 후 직접 커밋 지시. 자동 커밋 금지.

---

## Task 1: 타입 확장 — Room.password, Marker.password, MarkerRequest.password

**Files:**
- Modify: `src/types/index.ts`

**Step 1:** 타입 필드 추가

```ts
// Room에 추가
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  markers: Marker[];
  dates?: string[];
  password?: string;   // 방 비밀번호 (선택)
  createdAt: string;
}

// Marker에 추가
export interface Marker {
  id: string;
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
  password: string;    // 참여자 본인 확인용
  createdAt: string;
}

// MarkerRequest에 추가
export interface MarkerRequest {
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
  password: string;
}
```

**Step 2:** 빌드 확인 — `Marker.password` 필수 필드 추가로 기존 코드에서 에러 발생할 수 있음. 다음 Task에서 순차 수정.

---

## Task 2: API 계층 확장 — verifyRoomPassword, verifyParticipant 추가

**Files:**
- Modify: `src/lib/api.interface.ts`
- Modify: `src/lib/api.mock.ts`

**Step 1:** api.interface.ts에 메서드 추가

```ts
export interface ApiClient {
  createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  verifyRoomPassword(roomId: string, password: string): Promise<boolean>;
  verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  getResult(roomId: string): Promise<RoomResult | null>;
}
```

**Step 2:** api.mock.ts에 구현 추가

```ts
async createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room> {
  const room: Room = {
    id: crypto.randomUUID(),
    name: name.trim() || '이름 없는 모임',
    type,
    markers: [],
    dates,
    password,  // 추가
    createdAt: new Date().toISOString(),
  };
  // ...
},

async verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
  const rooms = getRooms();
  const room = assertRoom(rooms[roomId]);
  if (!room.password) return true;  // 비번 없으면 통과
  return room.password === password;
},

async verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null> {
  const rooms = getRooms();
  const room = assertRoom(rooms[roomId]);
  const marker = room.markers.find((m) => m.nickname === nickname);
  if (!marker) return null;  // 신규 참여자
  if (marker.password !== password) throw new Error('비밀번호가 틀려요');
  return marker;  // 기존 참여자 인증 성공
},
```

**Step 3:** addMarker에서 marker 생성 시 password 포함 확인 (MarkerRequest에 password 필드가 있으므로 자동 반영)

---

## Task 3: roomStore 확장 — createRoom 시그니처 + verify 액션

**Files:**
- Modify: `src/store/roomStore.ts`

**Step 1:** createRoom 시그니처에 password 추가, verify 액션 추가

```ts
interface RoomState {
  // ... 기존
  createRoom: (name: string, type: RoomType, dates?: string[], password?: string) => Promise<Room>;
  verifyRoomPassword: (password: string) => Promise<boolean>;
  verifyParticipant: (nickname: string, password: string) => Promise<Marker | null>;
}

// 구현
createRoom: async (name, type, dates, password) => {
  set({ isLoading: true, error: null });
  try {
    const room = await api.createRoom(name, type, dates, password);
    set({ room, isLoading: false });
    return room;
  } catch (e) {
    set({ error: extractErrorMessage(e, '방 생성에 실패했어요'), isLoading: false });
    throw e;
  }
},

verifyRoomPassword: async (password) => {
  const { room } = get();
  if (!room) throw new Error('방 정보가 없어요');
  return api.verifyRoomPassword(room.id, password);
},

verifyParticipant: async (nickname, password) => {
  const { room } = get();
  if (!room) throw new Error('방 정보가 없어요');
  return api.verifyParticipant(room.id, nickname, password);
},
```

---

## Task 4: uiStore 확장 — entryStep 상태 머신

**Files:**
- Modify: `src/store/uiStore.ts`

**Step 1:** 기존 `isNicknameModalOpen` 제거, `entryStep` 상태 머신 추가

```ts
type EntryStep = 'idle' | 'room_password' | 'participant' | 'done';

interface UIState {
  // ... 기존 (isNicknameModalOpen 제거)
  entryStep: EntryStep;
  participantPassword: string;

  setEntryStep: (step: EntryStep) => void;
  setParticipantPassword: (pw: string) => void;
  resetEntry: () => void;
  // ... 기존 (openNicknameModal/closeNicknameModal 제거)
}
```

**주의:** `isNicknameModalOpen`, `openNicknameModal`, `closeNicknameModal` 제거. 대신 `entryStep`으로 모달 표시 제어.

---

## Task 5: CreateRoom 수정 — 방 비밀번호 필드 추가

**Files:**
- Modify: `src/components/Home/CreateRoom.tsx`

**Step 1:** 방 비밀번호 Input 추가 (선택 필드)

```tsx
const [roomPassword, setRoomPassword] = useState('');

// handleSubmit 수정
const room = await createRoom(roomName.trim(), roomType, dates, roomPassword || undefined);

// JSX: 모임 이름 아래에 추가
<div className="flex flex-col gap-2">
  <div className="flex flex-col items-center gap-1">
    <label className="text-base font-pretendard-sb text-black">
      비밀번호
    </label>
    <p className="text-sm text-black-600">
      설정하면 비밀번호를 아는 사람만 참여할 수 있어요
    </p>
  </div>
  <Input
    type="password"
    value={roomPassword}
    onChange={(e) => setRoomPassword(e.target.value)}
    placeholder="비밀번호 (선택)"
    className="h-12 px-4 text-base"
  />
</div>
```

---

## Task 6: EntryModal 구현 — NicknameModal 대체

**Files:**
- Create: `src/components/Panel/EntryModal.tsx`
- Delete: `src/components/Panel/NicknameModal.tsx` (EntryModal로 대체)

**Step 1:** 2단계 입장 모달 구현

```tsx
// src/components/Panel/EntryModal.tsx
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type EntryStep = 'room_password' | 'participant';

interface EntryModalProps {
  open: boolean;
  step: EntryStep;
  hasRoomPassword: boolean;
  onRoomPasswordVerify: (password: string) => Promise<boolean>;
  onParticipantSubmit: (nickname: string, password: string) => Promise<void>;
}

const EntryModal = ({
  open,
  step,
  hasRoomPassword,
  onRoomPasswordVerify,
  onParticipantSubmit,
}: EntryModalProps) => {
  const [roomPassword, setRoomPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoomPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ok = await onRoomPasswordVerify(roomPassword);
      if (!ok) {
        toast.error('비밀번호가 틀려요');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !password.trim()) return;
    setIsSubmitting(true);
    try {
      await onParticipantSubmit(nickname.trim(), password.trim());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '참여에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 'room_password' && hasRoomPassword && (
          <>
            <DialogHeader>
              <DialogTitle>모임 비밀번호</DialogTitle>
              <DialogDescription>
                방장이 설정한 비밀번호를 입력해주세요
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRoomPasswordSubmit} className="flex flex-col gap-4">
              <Input
                type="password"
                placeholder="비밀번호 입력"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="h-12 px-4 text-base"
                autoFocus
              />
              <Button type="submit" size="lg" disabled={!roomPassword || isSubmitting} className="w-full">
                {isSubmitting ? '확인 중...' : '확인'}
              </Button>
            </form>
          </>
        )}

        {step === 'participant' && (
          <>
            <DialogHeader>
              <DialogTitle>참여 정보 입력</DialogTitle>
              <DialogDescription>
                지도에 표시될 이름과 수정용 비밀번호를 입력해주세요
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleParticipantSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="이름 (예: 홍길동)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-12 px-4 text-base"
                autoFocus
              />
              <Input
                type="password"
                placeholder="비밀번호 (예: 1234)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 text-base"
              />
              <Button
                type="submit"
                size="lg"
                disabled={!nickname.trim() || !password.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '참여 중...' : '참여하기'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EntryModal;
```

---

## Task 7: MapActionBar 수정 — 위치 변경 버튼

**Files:**
- Modify: `src/components/Map/MapActionBar.tsx`

**Step 1:** `hasMyMarker`일 때 "위치 변경" 버튼으로 변경

```tsx
interface MapActionBarProps {
  onLocate: () => void;
  onShare: () => void;
  onRelocate: () => void;   // 추가
  hasMyMarker: boolean;
}

// 버튼:
{hasMyMarker ? (
  <Button onClick={onRelocate} variant="outline" className="flex-1 gap-2" size="lg">
    <MapPin className="w-4 h-4" />
    위치 변경
  </Button>
) : (
  <Button onClick={onLocate} className="flex-1 gap-2" size="lg">
    <MapPin className="w-4 h-4" />
    위치 찍기
  </Button>
)}
```

---

## Task 8: RoomPage 수정 — 인증 플로우 + 마커 수정 연결

**Files:**
- Modify: `src/pages/RoomPage.tsx`

**Step 1:** NicknameModal → EntryModal 교체, 2단계 인증 플로우 연결

핵심 변경:
- `entryStep` 기반으로 EntryModal 표시
- `handleRoomPasswordVerify`: 방 비번 확인 → 성공 시 step 'participant'로 이동
- `handleParticipantSubmit`: 닉네임+비번 → 기존 참여자면 로드, 신규면 등록 대기
- `handleRelocate`: 기존 마커 삭제 → 새 위치 찍기 가능

```tsx
// 방 비번 없으면 room_password 건너뛰기
useEffect(() => {
  if (room && entryStep === 'idle') {
    if (room.password) {
      setEntryStep('room_password');
    } else {
      setEntryStep('participant');
    }
  }
}, [room, entryStep]);

// 참여자 인증 완료 시
const handleParticipantSubmit = async (name: string, pw: string) => {
  const existing = await verifyParticipant(name, pw);
  setNickname(name);
  setParticipantPassword(pw);
  setEntryStep('done');
  if (existing) {
    toast.success(`${name}님, 다시 오셨네요!`);
  }
};

// 위치 변경
const handleRelocate = async () => {
  const myMarker = room?.markers.find((m) => m.nickname === nickname);
  if (myMarker) {
    await deleteMarker(myMarker.id);
    toast.info('기존 위치를 삭제했어요. 새 위치를 찍어주세요');
  }
};
```

---

## Task 9: 빌드 + 린트 최종 확인

**Step 1:** 빌드 및 린트

```bash
npm run build && npm run lint
```

**Step 2:** 시각 검증 항목

| 항목 | 확인 내용 |
|------|----------|
| CreateRoom | 방 비밀번호 필드 표시 (선택) |
| 링크 입장 (비번 있는 방) | Step 1: 방 비번 → Step 2: 닉네임+비번 |
| 링크 입장 (비번 없는 방) | Step 1 건너뛰고 바로 닉네임+비번 |
| 신규 참여자 | 닉네임+비번 입력 → 마커 찍기 가능 |
| 기존 참여자 재진입 | 같은 닉네임+비번 → 기존 마커 로드 |
| 닉네임 중복+비번 틀림 | "비밀번호가 틀려요" 에러 |
| 위치 변경 | 기존 마커 삭제 → 새 위치 찍기 |
| 공유 버튼 | 클립보드 복사 동작 유지 |

**Step 3:** 사용자에게 리뷰 요청 → 승인 시 커밋
