# RoomPage UI 레이아웃 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** RoomPage 핵심 화면 구현 — 목업 지도 + 닉네임 모달 + 위치 확정 시트 + 결과 패널 + 전체 플로우 연결

**Architecture:** App.tsx `max-w-2xl px-5` 래퍼 안에서 구현. roomStore/uiStore(Zustand) 기반 상태 관리. 클린 아키텍처 준수(Factory import만 사용). Google Maps 미확보 상태이므로 그리드 기반 목업 지도로 UI 완성 후 교체 가능한 구조.

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS(AppColors 토큰), Zustand, shadcn/ui(Dialog, Drawer, Badge), lucide-react

**커밋 규칙:** 사용자가 리뷰 후 직접 커밋 지시. 자동 커밋 금지.

---

## Task 1: uiStore 확장 — pendingLocation, isLocationSheetOpen 상태 추가

**Files:**
- Modify: `src/store/uiStore.ts`

**Step 1:** uiStore에 위치 확정 관련 상태 추가

```ts
// src/store/uiStore.ts
import { create } from 'zustand';

interface PendingLocation {
  x: number;
  y: number;
}

interface UIState {
  isNicknameModalOpen: boolean;
  isResultPanelExpanded: boolean;
  nickname: string;
  pendingLocation: PendingLocation | null;
  isLocationSheetOpen: boolean;

  openNicknameModal: () => void;
  closeNicknameModal: () => void;
  setNickname: (name: string) => void;
  toggleResultPanel: () => void;
  setPendingLocation: (loc: PendingLocation | null) => void;
  openLocationSheet: () => void;
  closeLocationSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNicknameModalOpen: false,
  isResultPanelExpanded: false,
  nickname: '',
  pendingLocation: null,
  isLocationSheetOpen: false,

  openNicknameModal: () => set({ isNicknameModalOpen: true }),
  closeNicknameModal: () => set({ isNicknameModalOpen: false }),
  setNickname: (name) => set({ nickname: name }),
  toggleResultPanel: () =>
    set((s) => ({ isResultPanelExpanded: !s.isResultPanelExpanded })),
  setPendingLocation: (loc) => set({ pendingLocation: loc }),
  openLocationSheet: () => set({ isLocationSheetOpen: true }),
  closeLocationSheet: () => set({ isLocationSheetOpen: false, pendingLocation: null }),
}));
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 2: MapMarker 컴포넌트 구현

**Files:**
- Create: `src/components/Map/MapMarker.tsx`

**Step 1:** 마커 아이콘 컴포넌트 구현. 내/타인/중심점 색상 분기.

```tsx
// src/components/Map/MapMarker.tsx
import { MapPin, Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type MarkerType = 'mine' | 'others' | 'center';

interface MapMarkerProps {
  type: MarkerType;
  nickname?: string;
  x: number;
  y: number;
}

const markerStyles = {
  mine: 'bg-sub text-white',
  others: 'bg-primary text-white',
  center: 'bg-error text-white',
} as const;

const MapMarker = ({ type, nickname, x, y }: MapMarkerProps) => {
  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {nickname && (
        <span className="text-xs font-pretendard-md text-black-800 bg-white px-1.5 py-0.5 rounded shadow-sm mb-1 whitespace-nowrap">
          {nickname}
        </span>
      )}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shadow-md',
          markerStyles[type],
        )}
      >
        {type === 'center' ? (
          <Star className="w-4 h-4" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
      </div>
    </div>
  );
};

export default MapMarker;
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 3: MockMapView 목업 지도 구현

**Files:**
- Create: `src/components/Map/MockMapView.tsx`

**Step 1:** 그리드 배경 + 클릭 좌표 생성 + 마커 배치 목업 지도

```tsx
// src/components/Map/MockMapView.tsx
import { MapPin } from 'lucide-react';

import MapMarker from '@/components/Map/MapMarker';
import { cn } from '@/lib/utils';
import type { Marker } from '@/types';

interface MockMapViewProps {
  markers: Marker[];
  myNickname: string;
  centroid?: { lat: number; lng: number };
  onMapClick: (x: number, y: number) => void;
  className?: string;
}

const MockMapView = ({
  markers,
  myNickname,
  centroid,
  onMapClick,
  className,
}: MockMapViewProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(x, y);
  };

  return (
    <div
      className={cn(
        'relative bg-black-100 rounded-xl overflow-hidden cursor-crosshair select-none',
        'bg-[radial-gradient(circle,_var(--color-black-300)_1px,_transparent_1px)] bg-[size:24px_24px]',
        className,
      )}
      onClick={handleClick}
    >
      {/* 빈 상태 안내 */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black-400">
          <MapPin className="w-8 h-8" />
          <p className="text-sm">지도를 탭하여 위치를 찍어주세요</p>
        </div>
      )}

      {/* 마커 렌더링 */}
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          type={marker.nickname === myNickname ? 'mine' : 'others'}
          nickname={marker.nickname}
          x={marker.lng}
          y={marker.lat}
        />
      ))}

      {/* 중심점 */}
      {centroid && (
        <MapMarker type="center" x={centroid.lng} y={centroid.lat} />
      )}
    </div>
  );
};

export default MockMapView;
```

**주의:** 목업에서는 `lat`→ Y축(top %), `lng`→ X축(left %)로 매핑. Mock API에서 0~100 범위 좌표를 저장.

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 4: RoomHeader 컴포넌트 구현

**Files:**
- Create: `src/components/Panel/RoomHeader.tsx`

**Step 1:** 모임 이름 + 참여자 수 헤더

```tsx
// src/components/Panel/RoomHeader.tsx
import { Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface RoomHeaderProps {
  roomName: string;
  participantCount: number;
}

const RoomHeader = ({ roomName, participantCount }: RoomHeaderProps) => {
  return (
    <div className="flex items-center justify-between h-14">
      <h1 className="text-lg font-pretendard-sb text-black truncate">
        {roomName}
      </h1>
      <Badge variant="secondary" className="bg-primary-100 text-primary border-0 gap-1">
        <Users className="w-3 h-3" />
        {participantCount}명
      </Badge>
    </div>
  );
};

export default RoomHeader;
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 5: MapActionBar 컴포넌트 구현

**Files:**
- Create: `src/components/Map/MapActionBar.tsx`

**Step 1:** 위치 찍기 + 공유 버튼 액션 바

```tsx
// src/components/Map/MapActionBar.tsx
import { Link2, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MapActionBarProps {
  onLocate: () => void;
  onShare: () => void;
  hasMyMarker: boolean;
}

const MapActionBar = ({ onLocate, onShare, hasMyMarker }: MapActionBarProps) => {
  return (
    <div className="flex gap-3 py-3">
      <Button
        onClick={onLocate}
        className="flex-1 gap-2"
        size="lg"
        disabled={hasMyMarker}
      >
        <MapPin className="w-4 h-4" />
        {hasMyMarker ? '위치 등록 완료' : '위치 찍기'}
      </Button>
      <Button
        onClick={onShare}
        variant="outline"
        className="gap-2"
        size="lg"
      >
        <Link2 className="w-4 h-4" />
        공유
      </Button>
    </div>
  );
};

export default MapActionBar;
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 6: NicknameModal 구현

**Files:**
- Create: `src/components/Panel/NicknameModal.tsx`

**Step 1:** shadcn Dialog 기반 닉네임 필수 입력 모달

```tsx
// src/components/Panel/NicknameModal.tsx
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface NicknameModalProps {
  open: boolean;
  onConfirm: (nickname: string) => void;
}

const NicknameModal = ({ open, onConfirm }: NicknameModalProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>이름을 입력해주세요</DialogTitle>
          <DialogDescription>
            지도에 표시될 이름이에요
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="이름 입력 (예: 홍길동)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 px-4 text-base"
            autoFocus
          />
          <Button type="submit" size="lg" disabled={!value.trim()} className="w-full">
            확인
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NicknameModal;
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 7: LocationConfirmSheet 구현

**Files:**
- Create: `src/components/Panel/LocationConfirmSheet.tsx`

**Step 1:** shadcn Drawer 기반 위치 확정 바텀시트

```tsx
// src/components/Panel/LocationConfirmSheet.tsx
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

interface LocationConfirmSheetProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  x: number;
  y: number;
}

const LocationConfirmSheet = ({
  open,
  onConfirm,
  onCancel,
  x,
  y,
}: LocationConfirmSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onCancel()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sub" />
            이 위치로 등록할까요?
          </DrawerTitle>
          <DrawerDescription>
            좌표: ({x.toFixed(1)}, {y.toFixed(1)})
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

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 8: ParticipantList 컴포넌트 구현

**Files:**
- Create: `src/components/Panel/ParticipantList.tsx`

**Step 1:** 참여자별 거리 목록

```tsx
// src/components/Panel/ParticipantList.tsx
import { MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Marker } from '@/types';

interface ParticipantListProps {
  markers: Marker[];
  myNickname: string;
}

const ParticipantList = ({ markers, myNickname }: ParticipantListProps) => {
  return (
    <div className="flex flex-col gap-2">
      {markers.map((marker) => {
        const isMine = marker.nickname === myNickname;
        return (
          <div
            key={marker.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black-100"
          >
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full',
                isMine ? 'bg-sub text-white' : 'bg-primary text-white',
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-pretendard-md text-black-800 flex-1">
              {marker.nickname}
              {isMine && (
                <span className="text-xs text-black-400 ml-1">(나)</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantList;
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 9: ResultPanel 구현

**Files:**
- Create: `src/components/Panel/ResultPanel.tsx`

**Step 1:** shadcn Drawer 기반 결과 패널 (중심점 + 참여자 목록)

```tsx
// src/components/Panel/ResultPanel.tsx
import { ChevronUp, Star } from 'lucide-react';

import ParticipantList from '@/components/Panel/ParticipantList';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import type { Marker } from '@/types';

interface ResultPanelProps {
  markers: Marker[];
  myNickname: string;
  centroid?: { lat: number; lng: number };
}

const ResultPanel = ({ markers, myNickname, centroid }: ResultPanelProps) => {
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
        <div className="px-4 pb-6 flex flex-col gap-4">
          {/* 중심점 정보 */}
          {centroid && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-red-50 border border-error/20">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-error text-white">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-pretendard-sb text-black">
                  모두의 중심점
                </p>
                <p className="text-xs text-black-600">
                  ({centroid.lng.toFixed(1)}, {centroid.lat.toFixed(1)})
                </p>
              </div>
            </div>
          )}

          {/* 참여자 목록 */}
          <div>
            <h3 className="text-sm font-pretendard-sb text-black-800 mb-2">
              참여자
            </h3>
            <ParticipantList markers={markers} myNickname={myNickname} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ResultPanel;
```

**Step 2:** 빌드 확인

```bash
npm run build
```

---

## Task 10: RoomPage 페이지 셸 구현 — 전체 플로우 연결

**Files:**
- Create: `src/pages/RoomPage.tsx`
- Modify: `src/App.tsx` (라우트 연결)

**Step 1:** RoomPage 구현 — 모든 컴포넌트 조합 + 플로우 오케스트레이션

```tsx
// src/pages/RoomPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import MapActionBar from '@/components/Map/MapActionBar';
import MockMapView from '@/components/Map/MockMapView';
import LocationConfirmSheet from '@/components/Panel/LocationConfirmSheet';
import NicknameModal from '@/components/Panel/NicknameModal';
import ResultPanel from '@/components/Panel/ResultPanel';
import RoomHeader from '@/components/Panel/RoomHeader';
import { useRoomStore } from '@/store/roomStore';
import { useUIStore } from '@/store/uiStore';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoomStore((s) => s.room);
  const isLoading = useRoomStore((s) => s.isLoading);
  const fetchRoom = useRoomStore((s) => s.fetchRoom);
  const addMarker = useRoomStore((s) => s.addMarker);

  const nickname = useUIStore((s) => s.nickname);
  const isNicknameModalOpen = useUIStore((s) => s.isNicknameModalOpen);
  const openNicknameModal = useUIStore((s) => s.openNicknameModal);
  const closeNicknameModal = useUIStore((s) => s.closeNicknameModal);
  const setNickname = useUIStore((s) => s.setNickname);
  const pendingLocation = useUIStore((s) => s.pendingLocation);
  const isLocationSheetOpen = useUIStore((s) => s.isLocationSheetOpen);
  const setPendingLocation = useUIStore((s) => s.setPendingLocation);
  const openLocationSheet = useUIStore((s) => s.openLocationSheet);
  const closeLocationSheet = useUIStore((s) => s.closeLocationSheet);

  // 방 데이터 로드
  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId, fetchRoom]);

  // 닉네임 미설정 시 모달 표시
  useEffect(() => {
    if (room && !nickname) {
      openNicknameModal();
    }
  }, [room, nickname, openNicknameModal]);

  const handleNicknameConfirm = (name: string) => {
    setNickname(name);
    closeNicknameModal();
  };

  const handleMapClick = (x: number, y: number) => {
    if (!nickname) return;
    const hasMyMarker = room?.markers.some((m) => m.nickname === nickname);
    if (hasMyMarker) return;

    setPendingLocation({ x, y });
    openLocationSheet();
  };

  const handleLocationConfirm = async () => {
    if (!pendingLocation) return;
    await addMarker({
      nickname,
      lat: pendingLocation.y,
      lng: pendingLocation.x,
    });
    closeLocationSheet();
    toast.success('위치가 등록되었어요!');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.info('링크가 복사되었어요! 친구들에게 공유해보세요');
    } catch {
      toast.error('링크 복사에 실패했어요');
    }
  };

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

  const hasMyMarker = room.markers.some((m) => m.nickname === nickname);

  return (
    <div className="flex flex-col h-[calc(100dvh-32px)]">
      <RoomHeader
        roomName={room.name}
        participantCount={room.markers.length}
      />

      <MockMapView
        markers={room.markers}
        myNickname={nickname}
        onMapClick={handleMapClick}
        className="flex-1 min-h-0"
      />

      <MapActionBar
        onLocate={() => {
          if (!nickname) {
            openNicknameModal();
            return;
          }
          toast.info('지도를 탭하여 위치를 찍어주세요');
        }}
        onShare={handleShare}
        hasMyMarker={hasMyMarker}
      />

      <ResultPanel
        markers={room.markers}
        myNickname={nickname}
      />

      {/* 모달 / 시트 */}
      <NicknameModal
        open={isNicknameModalOpen}
        onConfirm={handleNicknameConfirm}
      />

      {pendingLocation && (
        <LocationConfirmSheet
          open={isLocationSheetOpen}
          onConfirm={handleLocationConfirm}
          onCancel={closeLocationSheet}
          x={pendingLocation.x}
          y={pendingLocation.y}
        />
      )}
    </div>
  );
};

export default RoomPage;
```

**Step 2:** App.tsx 라우트 연결

```tsx
// src/App.tsx — Route 수정
import RoomPage from "@/pages/RoomPage";

// 기존 placeholder를 교체:
<Route path="/room/:roomId" element={<RoomPage />} />
```

**Step 3:** 빌드 확인

```bash
npm run build
```

---

## Task 11: 빌드 + 린트 최종 확인

**Step 1:** 빌드 및 린트 통과 확인

```bash
npm run build && npm run lint
```

**Step 2:** 개발 서버에서 시각 검증

| 항목 | 확인 내용 |
|------|----------|
| RoomPage 진입 | `/room/:roomId`로 접속 시 페이지 렌더링 |
| 닉네임 모달 | 첫 진입 시 자동 표시, 외부 클릭 닫히지 않음 |
| 목업 지도 | 그리드 패턴 배경, 빈 상태 안내 텍스트 |
| 지도 클릭 | 클릭 시 LocationConfirmSheet 표시 |
| 위치 확정 | "여기로 확정!" → 마커 등록 → 토스트 |
| 마커 색상 | 내 마커(sub/주황), 타인(primary/파랑) |
| 결과 패널 | 하단 "참여자 N명 · 결과 보기" Drawer |
| 공유 버튼 | 클립보드 복사 + 토스트 |

**Step 3:** 사용자에게 리뷰 요청 → 승인 시 커밋
