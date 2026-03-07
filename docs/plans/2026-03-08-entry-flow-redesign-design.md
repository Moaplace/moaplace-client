# 방 입장 플로우 리디자인 Design Document

## Goal

방장은 HomePage에서 닉네임+비밀번호까지 한번에 입력 후 RoomPage 바로 진입. 게스트는 모달 대신 전체화면 입장 폼 사용. EntryModal(Dialog) 삭제.

## Architecture

### 방장 (Creator) 플로우

```
HomePage 스텝 위자드
1. 기능선택 → 2. 방이름 → 3. 방비밀번호(선택) → 4. 닉네임+참여자비밀번호 → createRoom + navigate
```

- Step 4 신규: 닉네임 Input + 참여자비밀번호 Input 한 화면
- createRoom 호출 전 uiStore에 nickname, participantPassword 저장
- uiStore에 isCreator=true 설정
- RoomPage 진입 시 isCreator=true면 entryStep='done' 직행

### 게스트 (Guest) 플로우

```
RoomPage 진입 (URL 공유)
1. 방비밀번호 (전체화면, 있을 때만) → 2. 닉네임+참여자비밀번호 (전체화면) → 지도
```

- 모달 아님 — RoomPage 자체가 entryStep !== 'done'이면 전체화면 폼
- EntryGate 컴포넌트 (신규, 전체화면)

### 컴포넌트 변경

- 삭제: `EntryModal.tsx` (Dialog 기반)
- 신규: `EntryGate.tsx` (전체화면 입장 폼)
- 수정: `HomePage.tsx` (Step 4 닉네임+비밀번호 추가, steps 배열 변경)
- 수정: `RoomPage.tsx` (EntryModal → EntryGate 교체, 방장 바이패스)
- 수정: `uiStore.ts` (isCreator 추가, resetEntryState 추가)
- 수정: `types/index.ts` (EntryStep, ActiveEntryStep 타입 변경)

### 타입 변경

```typescript
// Before
type EntryStep = 'idle' | 'room_password' | 'nickname' | 'participant_password' | 'done';
type ActiveEntryStep = 'room_password' | 'nickname' | 'participant_password';

// After
type EntryStep = 'idle' | 'room_password' | 'profile' | 'done';
type ActiveEntryStep = 'room_password' | 'profile';
```

### UIStore 변경

```typescript
interface UIState {
  // 기존
  entryStep: EntryStep;
  nickname: string;
  participantPassword: string;
  pendingLocation: PendingLocation | null;
  isLocationSheetOpen: boolean;

  // 신규
  isCreator: boolean;

  // 신규 메서드
  resetEntryState: () => void;
}
```

### HomePage Steps 변경

```typescript
// Before
const PLACE_STEPS: Step[] = ['feature', 'name', 'password'];
const TIME_STEPS: Step[] = ['feature', 'name', 'password', 'dates'];

// After
const PLACE_STEPS: Step[] = ['feature', 'name', 'password', 'profile'];
const TIME_STEPS: Step[] = ['feature', 'name', 'password', 'profile', 'dates'];
```

### EntryGate 컴포넌트 설계

```tsx
// 전체화면 입장 폼, RoomPage 내부에서 조건부 렌더링
interface EntryGateProps {
  step: ActiveEntryStep;
  hasRoomPassword: boolean;
  onRoomPasswordVerify: (password: string) => Promise<boolean>;
  onProfileSubmit: (nickname: string, password: string) => Promise<void>;
}

// step='room_password': 방비밀번호 단독 입력
// step='profile': 닉네임 + 참여자비밀번호 한 화면
```

### UX 원칙 (Toss)

- 1Thing/1Page: 방비밀번호는 단독, 닉네임+참여자비밀번호는 성격 같아서 합침
- 터치 44px+, autoFocus, Enter 키 지원
- 해요체 마이크로카피
- 방장 fast-path로 불필요한 입력 제거
