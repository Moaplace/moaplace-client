# HomePage 및 방 생성 플로우 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** PRD 와이어프레임 7.1 기반 HomePage와 CreateRoom 컴포넌트를 구현하여 서비스 핵심 진입점(방 생성 → `/room/:roomId` 이동)을 완성한다.

**Architecture:** HomePage는 히어로 섹션 + CreateRoom 폼 + PWAInstallBanner로 구성. CreateRoom은 roomStore.createRoom()을 호출하고 react-router-dom의 useNavigate로 방 페이지로 이동. App.tsx 라우팅에 `/room/:roomId` placeholder를 추가.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS v4 (MoaPlace 커스텀 토큰), shadcn/ui Button·Input, Zustand (roomStore), React Router v6, sonner (toast)

---

## Task 1: CreateRoom 컴포넌트 구현

**Files:**
- Create: `src/components/Home/CreateRoom.tsx`

**Step 1: Home 디렉토리 생성 확인**

```bash
ls src/components/Home/ 2>/dev/null || mkdir -p src/components/Home
```

**Step 2: CreateRoom 컴포넌트 작성**

`src/components/Home/CreateRoom.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoomStore } from '@/store/roomStore';

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');
  const createRoom = useRoomStore((s) => s.createRoom);
  const isLoading = useRoomStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const room = await createRoom(roomName.trim());
      toast.success('모임이 만들어졌어요!');
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <Input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="모임 이름을 입력해주세요 (예: 주말 점심 모임)"
        className="h-12 px-4 text-base"
      />
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? '만드는 중...' : '새로운 모임 만들기'}
      </Button>
    </form>
  );
};

export default CreateRoom;
```

**설계 근거:**
- `roomName`은 선택 사항(PRD 4.1: 입력 필드 placeholder 가이드). 빈 문자열이면 api.mock에서 '이름 없는 모임' 기본값 적용
- `useRoomStore` selector로 `createRoom`과 `isLoading`만 개별 구독 (전체 스토어 구독 금지 규칙)
- `handleSubmit`은 form의 onSubmit으로 연결하여 Enter 키 지원
- Toast: 성공 시 `toast.success`, 실패 시 `toast.error` (sonner 사용, Toaster는 App.tsx에 이미 배치됨)
- 로딩 중 버튼 disabled + 텍스트 변경으로 사용자 피드백 제공 (도허티 임계)

**Step 3: 빌드 확인**

```bash
npm run build
```

Expected: 성공 (타입 에러 없음)

**Step 4: 커밋**

```bash
git add src/components/Home/CreateRoom.tsx
git commit -m "feat : CreateRoom 컴포넌트 구현 #3"
```

---

## Task 2: HomePage 구현

**Files:**
- Create: `src/pages/HomePage.tsx`

**Step 1: HomePage 작성**

`src/pages/HomePage.tsx`:

```tsx
import CreateRoom from '@/components/Home/CreateRoom';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-32px)] gap-8 py-12">
      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-pretendard-xbd text-black">
          모아장소
        </h1>
        <p className="text-lg font-pretendard-sb text-foreground">
          우리 만날 장소, 같이 찾자
        </p>
        <p className="text-sm text-muted-foreground">
          로그인 없이 바로 시작하세요
        </p>
      </section>

      {/* 방 생성 폼 */}
      <section className="w-full max-w-sm">
        <CreateRoom />
      </section>

      {/* PWA 설치 배너 */}
      <section className="w-full">
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
- PRD 와이어프레임 7.1 기반 레이아웃: 히어로 → 폼 → PWA 배너 수직 구조
- `min-h-[calc(100dvh-32px)]`: App.tsx의 `px-4` 패딩 고려. dvh(dynamic viewport height)로 모바일 주소창 대응
- 타이포그래피: `font-pretendard-xbd`(ExtraBold) 서비스명, `font-pretendard-sb`(SemiBold) 슬로건, 기본 보조 텍스트
- 마이크로카피: PRD 4.1 그대로 사용 — "모아장소", "우리 만날 장소, 같이 찾자", "로그인 없이 바로 시작하세요"
- PWAInstallBanner: Phase 6(실시간/GPS/PWA)에서 usePWA 훅 연결 예정. 현재는 noop 핸들러로 UI만 표시
- `max-w-sm`: 폼 너비를 모바일 최적 384px로 제한

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 성공

**Step 3: 커밋**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat : HomePage 구현 (히어로 + CreateRoom + PWA 배너) #3"
```

---

## Task 3: App.tsx 라우팅 업데이트

**Files:**
- Modify: `src/App.tsx`

**Step 1: App.tsx 수정**

현재 `src/App.tsx`:
```tsx
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-xl mx-auto px-4">
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/widget-showcase" element={<WidgetShowcase />} />
        </Routes>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
```

변경할 내용:
1. `HomePage` import 추가
2. `/` 라우트의 `<div>Home</div>` → `<HomePage />` 교체
3. `/room/:roomId` 라우트 추가 (placeholder)

수정 후 `src/App.tsx`:
```tsx
import { Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-xl mx-auto px-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<div>Room Page (준비 중)</div>} />
          <Route path="/widget-showcase" element={<WidgetShowcase />} />
        </Routes>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
```

**설계 근거:**
- `/room/:roomId`: CreateRoom에서 navigate로 이동할 대상. Issue #3(RoomPage)에서 실제 컴포넌트로 교체 예정
- import 순서: React → 외부 라이브러리(없음) → 내부 모듈(Toaster, HomePage, WidgetShowcase) 그룹 사이 빈 줄
- WidgetShowcase 라우트는 유지 (개발용 디자인 시스템 레퍼런스)

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 성공

**Step 3: 커밋**

```bash
git add src/App.tsx
git commit -m "feat : 라우팅 업데이트 (HomePage, /room/:roomId placeholder) #3"
```

---

## Task 4: 수동 검증 및 최종 확인

**Step 1: 개발 서버 실행 및 확인**

```bash
npm run dev
```

브라우저에서 확인할 항목:

| 항목 | 확인 내용 |
|------|----------|
| `http://localhost:5173/` | HomePage 렌더링 — 히어로 텍스트 3줄 + Input + CTA 버튼 + PWA 배너 |
| 모임 이름 입력 | Input에 텍스트 입력 가능, placeholder 표시됨 |
| CTA 버튼 클릭 (이름 없이) | toast.success 표시 → `/room/:roomId`로 이동 → "Room Page (준비 중)" 표시 |
| CTA 버튼 클릭 (이름 입력 후) | 동일하게 동작 |
| `/room/test-id` 직접 접근 | "Room Page (준비 중)" placeholder 표시 |
| 반응형 레이아웃 | 모바일(375px)~태블릿(768px) 범위에서 깨지지 않음 |

**Step 2: 빌드 최종 확인**

```bash
npm run build && npm run lint
```

Expected: 둘 다 성공

**Step 3: 최종 커밋 (필요 시)**

빌드/린트에서 발견된 문제가 있으면 수정 후 커밋:

```bash
git add -A
git commit -m "fix : 빌드 및 린트 오류 수정 #3"
```
