# 방 입장 플로우 리디자인 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** EntryModal(Dialog) 삭제 → 방장은 HomePage에서 닉네임+비밀번호 입력 후 바로 진입, 게스트는 전체화면 EntryGate로 입장

**Architecture:** HomePage 스텝 위자드에 'profile' 스텝 추가 (닉네임+참여자비밀번호 한 화면). UIStore에 isCreator 플래그 추가. RoomPage에서 isCreator면 entryStep='done' 직행, 아니면 EntryGate(전체화면) 표시. EntryModal 삭제.

**Tech Stack:** React 18 · TypeScript · Tailwind CSS · Zustand · shadcn/ui

---

### Task 1: 타입 변경 (EntryStep, ActiveEntryStep)

**Files:**
- Modify: `src/types/index.ts:5-8`

**Step 1: EntryStep 타입 변경**

`src/types/index.ts` 5~8행을 다음으로 교체:

```typescript
/** 입장 단계 상태 머신 */
export type EntryStep = 'idle' | 'room_password' | 'profile' | 'done';

/** EntryGate에서 사용하는 입장 단계 (활성 단계만) */
export type ActiveEntryStep = 'room_password' | 'profile';
```

변경: `'nickname' | 'participant_password'` → `'profile'` (닉네임+비밀번호를 한 화면으로 합침)

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 발생 (아직 다른 파일에서 이전 타입 참조). 이건 이후 Task에서 수정.

---

### Task 2: UIStore에 isCreator + resetEntryState 추가

**Files:**
- Modify: `src/store/uiStore.ts`

**Step 1: UIStore 전체 교체**

```typescript
import { create } from 'zustand';

import type { EntryStep } from '@/types';

interface PendingLocation {
  x: number;
  y: number;
}

interface UIState {
  entryStep: EntryStep;
  nickname: string;
  participantPassword: string;
  isCreator: boolean;
  pendingLocation: PendingLocation | null;
  isLocationSheetOpen: boolean;

  setEntryStep: (step: EntryStep) => void;
  setNickname: (name: string) => void;
  setParticipantPassword: (pw: string) => void;
  setIsCreator: (value: boolean) => void;
  resetEntryState: () => void;
  setPendingLocation: (loc: PendingLocation | null) => void;
  openLocationSheet: () => void;
  closeLocationSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  entryStep: 'idle',
  nickname: '',
  participantPassword: '',
  isCreator: false,
  pendingLocation: null,
  isLocationSheetOpen: false,

  setEntryStep: (step) => set({ entryStep: step }),
  setNickname: (name) => set({ nickname: name }),
  setParticipantPassword: (pw) => set({ participantPassword: pw }),
  setIsCreator: (value) => set({ isCreator: value }),
  resetEntryState: () => set({
    entryStep: 'idle',
    nickname: '',
    participantPassword: '',
    isCreator: false,
  }),
  setPendingLocation: (loc) => set({ pendingLocation: loc }),
  openLocationSheet: () => set({ isLocationSheetOpen: true }),
  closeLocationSheet: () => set({ isLocationSheetOpen: false, pendingLocation: null }),
}));
```

핵심 변경:
- `isCreator: boolean` 추가
- `setIsCreator` 메서드 추가
- `resetEntryState` 메서드 추가 (방 변경 시 초기화용)

---

### Task 3: HomePage에 'profile' 스텝 추가

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: Step 타입, steps 배열, stepLabels 변경**

```typescript
type Step = 'feature' | 'name' | 'password' | 'profile' | 'dates';

const PLACE_STEPS: Step[] = ['feature', 'name', 'password', 'profile'];
const TIME_STEPS: Step[] = ['feature', 'name', 'password', 'profile', 'dates'];
```

stepLabels도 변경:
```typescript
const stepLabels = roomType === 'time'
  ? ['기능', '이름', '비밀번호', '내 정보', '날짜']
  : ['기능', '이름', '비밀번호', '내 정보'];
```

**Step 2: 닉네임/참여자비밀번호 로컬 state 추가**

기존 state 아래에:
```typescript
const [creatorNickname, setCreatorNickname] = useState('');
const [creatorPassword, setCreatorPassword] = useState('');
```

**Step 3: uiStore import 추가 + handleCreate 수정**

```typescript
import { useUIStore } from '@/store/uiStore';
```

handleCreate 함수에서 createRoom 호출 전에 uiStore에 닉네임+비밀번호 저장:
```typescript
const setNickname = useUIStore((s) => s.setNickname);
const setParticipantPassword = useUIStore((s) => s.setParticipantPassword);
const setIsCreator = useUIStore((s) => s.setIsCreator);
const setEntryStep = useUIStore((s) => s.setEntryStep);
```

handleCreate를 다음으로 교체:
```typescript
const handleCreate = async () => {
  try {
    // uiStore에 방장 정보 저장
    setNickname(creatorNickname.trim());
    setParticipantPassword(creatorPassword);
    setIsCreator(true);
    setEntryStep('done');

    const dates =
      roomType === 'time'
        ? selectedDates.map((d) => d.toISOString().split('T')[0])
        : undefined;
    const room = await createRoom(
      roomName.trim(),
      roomType,
      dates,
      roomPassword || undefined,
    );
    toast.success(
      roomType === 'place'
        ? '모임이 만들어졌어요!'
        : '시간 모으기가 시작됐어요!',
    );
    navigate(`/room/${room.id}`);
  } catch {
    toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
  }
};
```

**Step 4: 유효성 검사 추가**

```typescript
const isCreatorNicknameValid = creatorNickname.trim().length >= 1;
const isCreatorPasswordValid = creatorPassword.length >= 4 && creatorPassword.length <= 12;
```

**Step 5: handleKeyDown에 profile 스텝 처리 추가**

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key !== 'Enter') return;
  if (e.nativeEvent.isComposing) return;

  if (step === 'name' && isNameValid) {
    handleNext();
  } else if (step === 'password' && isPasswordValid) {
    handleNext();
  } else if (step === 'profile' && isCreatorNicknameValid && isCreatorPasswordValid) {
    if (isLastStep) handleCreate();
    else handleNext();
  }
};
```

**주의:** password 스텝에서 `isLastStep` 체크 제거 — password 뒤에 항상 profile이 있으므로.

password 스텝의 버튼/건너뛰기도 수정:
- `isLastStep ? handleCreate() : handleSkip()` → 항상 `handleSkip()` (password 뒤에 profile이 있으므로)
- 버튼 텍스트: 항상 "다음"
- 건너뛰기 텍스트: 항상 "건너뛰기"

**Step 6: 'profile' 스텝 UI 추가**

password 스텝 JSX 뒤에 추가:

```tsx
{/* Step: 내 정보 (닉네임 + 참여자 비밀번호) */}
{step === 'profile' && (
  <>
    <div className="flex flex-col items-center gap-2 text-center">
      <h2 className="text-xl font-pretendard-bd text-black">
        내 정보를 입력해주세요
      </h2>
      <p className="text-sm text-black-600">
        지도에 표시될 이름과 수정용 비밀번호예요
      </p>
    </div>
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-pretendard-md text-black-800">이름</label>
        <Input
          type="text"
          value={creatorNickname}
          onChange={(e) => setCreatorNickname(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 홍길동"
          inputSize="lg"
          className="w-full"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-pretendard-md text-black-800">수정용 비밀번호</label>
        <Input
          type="password"
          value={creatorPassword}
          onChange={(e) => setCreatorPassword(e.target.value.slice(0, 12))}
          onKeyDown={handleKeyDown}
          placeholder="4~12자 (나중에 위치 수정 시 필요)"
          inputSize="lg"
          className="w-full"
          maxLength={12}
        />
        {creatorPassword.length > 0 && !isCreatorPasswordValid && (
          <span className="text-xs text-error">4자 이상 입력해주세요</span>
        )}
      </div>
    </div>
    <Button
      onClick={isLastStep ? handleCreate : handleNext}
      size="lg"
      disabled={!isCreatorNicknameValid || !isCreatorPasswordValid || isLoading}
      className="w-full"
    >
      {isLoading
        ? '만드는 중...'
        : isLastStep
          ? roomType === 'place' ? '장소 모으기 시작' : '다음'
          : '다음'}
    </Button>
  </>
)}
```

---

### Task 4: EntryGate 전체화면 컴포넌트 생성

**Files:**
- Create: `src/components/Panel/EntryGate.tsx`

**Step 1: EntryGate 컴포넌트 작성**

```tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ActiveEntryStep } from '@/types';

interface EntryGateProps {
  step: ActiveEntryStep;
  roomName: string;
  hasRoomPassword: boolean;
  onRoomPasswordVerify: (password: string) => Promise<boolean>;
  onProfileSubmit: (nickname: string, password: string) => Promise<void>;
}

const EntryGate = ({
  step,
  roomName,
  hasRoomPassword,
  onRoomPasswordVerify,
  onProfileSubmit,
}: EntryGateProps) => {
  const [roomPassword, setRoomPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    setIsSubmitting(false);
  }, [step]);

  const isNicknameValid = nickname.trim().length >= 1;
  const isPasswordValid = password.length >= 4 && password.length <= 12;

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNicknameValid || !isPasswordValid) return;
    setIsSubmitting(true);
    try {
      await onProfileSubmit(nickname.trim(), password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '참여에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;

    if (step === 'room_password' && roomPassword.length >= 4) {
      handleRoomPasswordSubmit(e as unknown as React.FormEvent);
    } else if (step === 'profile' && isNicknameValid && isPasswordValid) {
      handleProfileSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-sm">
        {/* 방 이름 표시 */}
        <div className="text-center mb-8">
          <p className="text-sm text-black-400 mb-1">모임에 참여하기</p>
          <h1 className="text-2xl font-pretendard-bd text-black">{roomName}</h1>
        </div>

        <div
          key={step}
          className={cn(
            'animate-in fade-in duration-300',
            direction === 'forward' ? 'slide-in-from-right-8' : 'slide-in-from-left-8',
          )}
        >
          {/* Step: 방 비밀번호 */}
          {step === 'room_password' && hasRoomPassword && (
            <form onSubmit={handleRoomPasswordSubmit} className="flex flex-col gap-6">
              <div className="text-center">
                <h2 className="text-xl font-pretendard-bd text-black mb-2">
                  모임 비밀번호
                </h2>
                <p className="text-sm text-black-600">
                  방장이 설정한 비밀번호를 입력해주세요
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="password"
                  placeholder="4~12자"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value.slice(0, 12))}
                  onKeyDown={handleKeyDown}
                  inputSize="lg"
                  maxLength={12}
                  autoFocus
                />
                {roomPassword.length > 0 && roomPassword.length < 4 && (
                  <span className="text-xs text-error">4자 이상 입력해주세요</span>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={roomPassword.length < 4 || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '확인 중...' : '확인'}
              </Button>
            </form>
          )}

          {/* Step: 닉네임 + 참여자 비밀번호 (한 화면) */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
              <div className="text-center">
                <h2 className="text-xl font-pretendard-bd text-black mb-2">
                  내 정보를 입력해주세요
                </h2>
                <p className="text-sm text-black-600">
                  지도에 표시될 이름과 수정용 비밀번호예요
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-pretendard-md text-black-800">이름</label>
                  <Input
                    type="text"
                    placeholder="예: 홍길동"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={handleKeyDown}
                    inputSize="lg"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-pretendard-md text-black-800">수정용 비밀번호</label>
                  <Input
                    type="password"
                    placeholder="4~12자 (나중에 위치 수정 시 필요)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, 12))}
                    onKeyDown={handleKeyDown}
                    inputSize="lg"
                    maxLength={12}
                  />
                  {password.length > 0 && !isPasswordValid && (
                    <span className="text-xs text-error">4자 이상 입력해주세요</span>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!isNicknameValid || !isPasswordValid || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '참여 중...' : '참여하기'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryGate;
```

---

### Task 5: RoomPage에서 EntryModal → EntryGate 교체 + 방장 바이패스

**Files:**
- Modify: `src/pages/RoomPage.tsx`

**Step 1: import 변경**

```typescript
// 삭제:
import EntryModal from '@/components/Panel/EntryModal';
import type { ActiveEntryStep } from '@/types';

// 추가:
import EntryGate from '@/components/Panel/EntryGate';
```

**Step 2: UIStore에서 isCreator 구독 추가**

```typescript
const isCreator = useUIStore((s) => s.isCreator);
```

**Step 3: 방 로드 완료 시 입장 단계 로직 변경**

기존 useEffect (line 46-54)를 다음으로 교체:
```typescript
// 방 로드 완료 시 입장 단계 시작
useEffect(() => {
  if (room && entryStep === 'idle') {
    // 방장은 바로 진입 (HomePage에서 이미 닉네임+비밀번호 입력 완료)
    if (isCreator) {
      setEntryStep('done');
      return;
    }
    // 게스트: 방 비밀번호 있으면 비밀번호부터, 없으면 프로필 입력
    if (room.password) {
      setEntryStep('room_password');
    } else {
      setEntryStep('profile');
    }
  }
}, [room, entryStep, isCreator, setEntryStep]);
```

**Step 4: Entry handlers 교체**

기존 `handleNicknameSubmit`, `handleParticipantPasswordSubmit` 삭제.

`handleRoomPasswordVerify` 수정 — 성공 시 `'profile'`로:
```typescript
const handleRoomPasswordVerify = useCallback(async (password: string) => {
  try {
    const ok = await verifyRoomPassword(password);
    if (ok) {
      setEntryStep('profile');
    }
    return ok;
  } catch {
    toast.error('비밀번호 확인에 실패했어요');
    return false;
  }
}, [verifyRoomPassword, setEntryStep]);
```

새로운 `handleProfileSubmit` 추가:
```typescript
const handleProfileSubmit = useCallback(async (name: string, pw: string) => {
  try {
    const existing = await verifyParticipant(name, pw);
    setNickname(name);
    setParticipantPassword(pw);
    setEntryStep('done');
    if (existing) {
      toast.success(`${name}님, 다시 오셨네요!`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '참여에 실패했어요';
    toast.error(message);
    throw err;
  }
}, [verifyParticipant, setNickname, setParticipantPassword, setEntryStep]);
```

**Step 5: 사용하지 않는 store selector 제거**

RoomPage 상단에서 제거:
- `verifyParticipant` — `handleProfileSubmit`에서 직접 사용하므로 유지

**Step 6: 렌더링 변경 — EntryModal → EntryGate**

EntryModal 관련 변수 삭제:
```typescript
// 삭제:
const entryModalOpen = ...
const entryModalStep: ActiveEntryStep = ...
```

`entryStep !== 'done'`일 때 조건부 렌더링:

```tsx
// 입장 전: EntryGate 전체화면 표시
if (entryStep !== 'done') {
  return (
    <EntryGate
      step={entryStep === 'room_password' ? 'room_password' : 'profile'}
      roomName={room.name}
      hasRoomPassword={!!room.password}
      onRoomPasswordVerify={handleRoomPasswordVerify}
      onProfileSubmit={handleProfileSubmit}
    />
  );
}
```

이 early return을 `if (!room)` 체크 뒤, 기존 지도 렌더링 전에 배치.

기존 JSX에서 EntryModal 삭제:
```tsx
// 삭제:
<EntryModal
  open={entryModalOpen}
  step={entryModalStep}
  ...
/>
```

---

### Task 6: EntryModal 삭제 + 빌드 확인

**Files:**
- Delete: `src/components/Panel/EntryModal.tsx`

**Step 1: EntryModal.tsx 파일 삭제**

```bash
rm src/components/Panel/EntryModal.tsx
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공 (에러 없음)

**Step 3: 린트 확인**

Run: `npm run lint`
Expected: 성공 (에러 없음)

---

### Task 순서 요약

| Task | 설명 | 의존성 |
|------|------|--------|
| 1 | 타입 변경 (EntryStep) | 없음 |
| 2 | UIStore (isCreator, resetEntryState) | Task 1 |
| 3 | HomePage (profile 스텝 추가) | Task 2 |
| 4 | EntryGate (전체화면 신규) | Task 1 |
| 5 | RoomPage (EntryGate 교체 + 방장 바이패스) | Task 2, 3, 4 |
| 6 | EntryModal 삭제 + 빌드 확인 | Task 5 |
