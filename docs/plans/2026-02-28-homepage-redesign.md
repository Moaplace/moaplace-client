# HomePage 리디자인 — 모아장소 + 모아타임 듀얼 기능

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** HomePage를 모아장소(위치 중간지점)와 모아타임(시간 투표) 두 기능의 진입점으로 리디자인한다. 탭/카드 선택형 UI로 기능을 전환하고, 모아타임 선택 시 날짜 캘린더를 표시한다.

**Architecture:** HomePage에 FeatureSelector(카드 2장)를 추가하여 roomType 상태를 관리. CreateRoom은 roomType prop에 따라 모아타임일 때만 Calendar를 추가 표시. Room 타입에 `type: 'place' | 'time'`과 `dates?: string[]` 필드를 추가하고, API/Store 시그니처를 일괄 업데이트.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui (Button·Input·Calendar), Zustand (roomStore), React Router v6, react-day-picker, sonner, lucide-react (MapPin·Clock)

---

## Task 1: shadcn Calendar 컴포넌트 설치

**Files:**
- Create: `src/components/ui/calendar.tsx` (shadcn CLI가 자동 생성)

**Step 1: shadcn Calendar 설치**

```bash
npx shadcn@latest add calendar
```

Expected: `src/components/ui/calendar.tsx` 생성, `react-day-picker` 패키지 설치

**Step 2: 설치 확인**

```bash
npm run build
```

Expected: 성공

**Step 3: 커밋**

```bash
git add src/components/ui/calendar.tsx package.json package-lock.json
git commit -m "chore : shadcn Calendar 컴포넌트 설치 #3"
```

---

## Task 2: 타입 시스템 업데이트

**Files:**
- Modify: `src/types/index.ts`

**Step 1: RoomType 추가 및 Room 인터페이스 업데이트**

`src/types/index.ts` 상단에 `RoomType` 추가, `Room`에 `type`과 `dates?` 필드 추가:

```typescript
/** 방 유형 — 장소 모으기 또는 시간 모으기 */
export type RoomType = 'place' | 'time';

/** 방 (Room) — UUID 기반 모임 단위 */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  markers: Marker[];
  dates?: string[];
  createdAt: string;
}
```

변경 포인트:
- `RoomType` union 타입 신규 추가
- `Room.type: RoomType` 필드 추가 (필수)
- `Room.dates?: string[]` 필드 추가 (선택 — 모아타임일 때만 사용, ISO date "2026-03-01" 형식)

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 타입 에러 발생 (api.mock.ts의 createRoom에서 `type` 필드 누락) — Task 3에서 수정

**Step 3: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat : RoomType 추가 및 Room 인터페이스 확장 (type, dates) #3"
```

---

## Task 3: API 레이어 업데이트

**Files:**
- Modify: `src/lib/api.interface.ts`
- Modify: `src/lib/api.mock.ts`

**Step 1: ApiClient 인터페이스 시그니처 수정**

`src/lib/api.interface.ts`의 `createRoom` 시그니처 변경:

```typescript
import type { Room, Marker, MarkerRequest, RoomResult, RoomType } from '@/types';

export interface ApiClient {
  createRoom(name: string, type: RoomType, dates?: string[]): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  getResult(roomId: string): Promise<RoomResult | null>;
}
```

변경 포인트: `createRoom`에 `type: RoomType`, `dates?: string[]` 파라미터 추가

**Step 2: Mock Adapter 수정**

`src/lib/api.mock.ts`의 `createRoom` 구현 업데이트:

```typescript
import type { Room, Marker, MarkerRequest, RoomResult, RoomType } from '@/types';
```

`createRoom` 메서드:

```typescript
async createRoom(name: string, type: RoomType, dates?: string[]): Promise<Room> {
  const room: Room = {
    id: crypto.randomUUID(),
    name: name.trim() || '이름 없는 모임',
    type,
    markers: [],
    dates,
    createdAt: new Date().toISOString(),
  };
  mutateRooms((rooms) => {
    rooms[room.id] = room;
  });
  return room;
},
```

변경 포인트: `type`, `dates` 파라미터 받아서 Room 객체에 포함

**Step 3: 빌드 확인**

```bash
npm run build
```

Expected: 타입 에러 발생 (roomStore의 createRoom 호출부) — Task 4에서 수정

**Step 4: 커밋**

```bash
git add src/lib/api.interface.ts src/lib/api.mock.ts
git commit -m "feat : API createRoom 시그니처 확장 (type, dates) #3"
```

---

## Task 4: roomStore 업데이트

**Files:**
- Modify: `src/store/roomStore.ts`

**Step 1: createRoom 액션 시그니처 및 호출 수정**

`src/store/roomStore.ts`의 `RoomState` 인터페이스와 `createRoom` 액션 업데이트:

```typescript
import type { Room, RoomResult, MarkerRequest, RoomType } from '@/types';
```

인터페이스:

```typescript
createRoom: (name: string, type: RoomType, dates?: string[]) => Promise<Room>;
```

구현:

```typescript
createRoom: async (name, type, dates) => {
  set({ isLoading: true, error: null });
  try {
    const room = await api.createRoom(name, type, dates);
    set({ room, isLoading: false });
    return room;
  } catch (e) {
    set({ error: extractErrorMessage(e, '방 생성에 실패했어요'), isLoading: false });
    throw e;
  }
},
```

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 타입 에러 발생 (CreateRoom.tsx의 createRoom 호출부에 인수 부족) — Task 6에서 수정

**Step 3: 커밋**

```bash
git add src/store/roomStore.ts
git commit -m "feat : roomStore createRoom 시그니처 확장 #3"
```

---

## Task 5: FeatureSelector 컴포넌트 구현

**Files:**
- Create: `src/components/Home/FeatureSelector.tsx`

**Step 1: FeatureSelector 작성**

`src/components/Home/FeatureSelector.tsx`:

```tsx
import { MapPin, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RoomType } from '@/types';

interface FeatureSelectorProps {
  selected: RoomType;
  onSelect: (type: RoomType) => void;
}

const features = [
  {
    type: 'place' as const,
    icon: MapPin,
    title: '모아장소',
    description: '만날 장소를 같이 찾자',
  },
  {
    type: 'time' as const,
    icon: Clock,
    title: '모아타임',
    description: '만날 시간을 같이 정하자',
  },
] as const;

const FeatureSelector = ({ selected, onSelect }: FeatureSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {features.map(({ type, icon: Icon, title, description }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
            selected === type
              ? 'border-primary bg-primary-100'
              : 'border-black-300 bg-white hover:border-black-400'
          )}
        >
          <Icon
            className={cn(
              'w-6 h-6',
              selected === type ? 'text-primary' : 'text-black-600'
            )}
          />
          <span className="text-sm font-pretendard-sb text-black">{title}</span>
          <span className="text-xs text-black-600">{description}</span>
        </button>
      ))}
    </div>
  );
};

export default FeatureSelector;
```

**설계 근거:**
- `as const` 배열로 feature 데이터를 선언하여 반복 렌더링 (DRY)
- `cn()` 유틸로 선택 상태에 따른 조건부 스타일링
- Tailwind 커스텀 토큰만 사용 (primary, primary-100, black-300, black-600 등)
- lucide-react의 MapPin, Clock 아이콘 사용
- `type="button"`으로 form submit 방지

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 성공 (아직 import하는 곳 없음)

**Step 3: 커밋**

```bash
git add src/components/Home/FeatureSelector.tsx
git commit -m "feat : FeatureSelector 카드 선택 컴포넌트 구현 #3"
```

---

## Task 6: CreateRoom 컴포넌트 리디자인

**Files:**
- Modify: `src/components/Home/CreateRoom.tsx`

**Step 1: CreateRoom에 roomType prop 추가 및 조건부 Calendar 표시**

`src/components/Home/CreateRoom.tsx` 전체 교체:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useRoomStore } from '@/store/roomStore';
import type { RoomType } from '@/types';

interface CreateRoomProps {
  roomType: RoomType;
}

const CreateRoom = ({ roomType }: CreateRoomProps) => {
  const [roomName, setRoomName] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const createRoom = useRoomStore((s) => s.createRoom);
  const isLoading = useRoomStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dates =
        roomType === 'time'
          ? selectedDates.map((d) => d.toISOString().split('T')[0])
          : undefined;
      const room = await createRoom(roomName.trim(), roomType, dates);
      toast.success(
        roomType === 'place'
          ? '모임이 만들어졌어요!'
          : '시간 모으기가 시작됐어요!'
      );
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-pretendard-sb text-black-800">
          모임 이름
        </label>
        <Input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="예: 주말 점심 모임"
          className="h-12 px-4 text-base"
        />
      </div>

      {roomType === 'time' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-pretendard-sb text-black-800">
            모임 날짜
          </label>
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => setSelectedDates(dates ?? [])}
            className="rounded-xl border border-black-300 p-3"
          />
        </div>
      )}

      <Button type="submit" size="lg" disabled={isLoading} className="w-full">
        {isLoading
          ? '만드는 중...'
          : roomType === 'place'
            ? '장소 모으기 시작'
            : '시간 모으기 시작'}
      </Button>
    </form>
  );
};

export default CreateRoom;
```

**설계 근거:**
- `roomType` prop으로 모드 전환 — HomePage에서 상태 관리
- `Calendar mode="multiple"`: 여러 날짜 선택 가능 (모임타임 패턴)
- `onSelect` 콜백에서 `dates ?? []`로 null 안전성 확보
- 날짜 → ISO 문자열 변환: `d.toISOString().split('T')[0]` → "2026-03-01" 형식
- 섹션별 `<label>` 추가로 모임타임 UI 구조 반영
- CTA 텍스트가 roomType에 따라 변경 ("장소 모으기 시작" vs "시간 모으기 시작")

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 타입 에러 발생 (HomePage에서 CreateRoom에 roomType prop 미전달) — Task 7에서 수정

**Step 3: 커밋**

```bash
git add src/components/Home/CreateRoom.tsx
git commit -m "feat : CreateRoom 리디자인 (roomType 분기, Calendar 조건 표시) #3"
```

---

## Task 7: HomePage 리디자인

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: HomePage 전체 교체**

`src/pages/HomePage.tsx`:

```tsx
import { useState } from 'react';

import CreateRoom from '@/components/Home/CreateRoom';
import FeatureSelector from '@/components/Home/FeatureSelector';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';
import type { RoomType } from '@/types';

const HomePage = () => {
  const [roomType, setRoomType] = useState<RoomType>('place');

  return (
    <div className="flex flex-col items-center gap-8 py-12 min-h-[calc(100dvh-32px)]">
      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-pretendard-xbd text-black">모아</h1>
        <p className="text-lg font-pretendard-sb text-foreground">
          우리 모임, 같이 정하자
        </p>
        <p className="text-sm text-muted-foreground">
          로그인 없이 바로 시작하세요
        </p>
      </section>

      {/* 기능 선택 카드 */}
      <section className="w-full max-w-sm">
        <FeatureSelector selected={roomType} onSelect={setRoomType} />
      </section>

      {/* 방 생성 폼 */}
      <section className="w-full max-w-sm">
        <CreateRoom roomType={roomType} />
      </section>

      {/* PWA 설치 배너 */}
      <section className="w-full max-w-sm">
        <PWAInstallBanner
          onInstall={() => {
            // Phase 6에서 usePWA 훅 연결 예정
          }}
          onDismiss={() => {
            // Phase 6에서 dismiss 로직 연결 예정
          }}
        />
      </section>
    </div>
  );
};

export default HomePage;
```

**설계 근거:**
- 히어로: "모아장소" → "모아" 로 변경 (두 기능을 아우르는 브랜드명)
- 슬로건: "우리 만날 장소, 같이 찾자" → "우리 모임, 같이 정하자" (장소+시간 모두 포괄)
- `justify-center` 제거: 모아타임 선택 시 Calendar로 인해 콘텐츠가 길어지므로 상단 정렬
- `roomType` 상태를 HomePage에서 관리하여 FeatureSelector ↔ CreateRoom 간 데이터 흐름
- 기본값 `'place'`: 모아장소가 primary 기능

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 성공

**Step 3: 커밋**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat : HomePage 리디자인 (듀얼 기능 선택 + 섹션 레이아웃) #3"
```

---

## Task 8: 빌드/린트 최종 확인

**Step 1: 빌드 및 린트**

```bash
npm run build && npm run lint
```

Expected: 둘 다 성공

**Step 2: 개발 서버 확인 항목**

```bash
npm run dev
```

| 항목 | 확인 내용 |
|------|----------|
| `http://localhost:5173/` | 히어로("모아") + 카드 2장(모아장소/모아타임) + 이름 입력 + CTA |
| 모아장소 카드 선택 | primary 보더, 캘린더 미표시, CTA "장소 모으기 시작" |
| 모아타임 카드 선택 | primary 보더, 캘린더 표시, CTA "시간 모으기 시작" |
| 모아타임 날짜 선택 | 여러 날짜 다중 선택 가능 |
| 모임 생성 (장소) | toast.success → `/room/:roomId` 이동 |
| 모임 생성 (시간) | toast.success → `/room/:roomId` 이동, Room에 dates 저장됨 |
| 반응형 | 375px~768px 범위에서 카드 2열 유지, 깨지지 않음 |

**Step 3: 최종 커밋 (필요 시)**

빌드/린트 문제가 있으면 수정 후:

```bash
git add -A
git commit -m "fix : 빌드 및 린트 오류 수정 #3"
```
