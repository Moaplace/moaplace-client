# MoaPlace 공용 위젯 시스템 구축 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** shadcn/ui CLI로 10개 공용 컴포넌트를 설치하고, MoaPlace 컬러 시스템(18색)과 통합하여 반응형 PWA에 최적화된 위젯 시스템을 구축한다.

**Architecture:** shadcn/ui (Radix UI 기반) + Tailwind CSS v4 `@theme inline` + MoaPlace 컬러 토큰. shadcn의 OKLCH CSS 변수 시스템 위에 MoaPlace 18색을 시맨틱 변수로 매핑. 반응형은 Tailwind 유틸리티로, PWA는 터치 영역(44px+)과 safe-area로 대응.

**Tech Stack:** React 19, Tailwind CSS 4.2, shadcn/ui (latest), Radix UI, Sonner, Vite 7

---

## Task 1: Path Alias 설정 (`@/` → `./src/`)

shadcn/ui는 `@/components`, `@/lib/utils` 등의 import path를 사용한다. 현재 프로젝트에 path alias가 없으므로 먼저 설정한다.

**Files:**
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`
- Modify: `vite.config.ts`

**Step 1: tsconfig.json에 paths 추가**

`tsconfig.json`을 열고 `compilerOptions`에 추가:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**Step 2: tsconfig.app.json에도 paths 추가**

`tsconfig.app.json`의 `compilerOptions`에 추가:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

**Step 3: vite.config.ts에 resolve alias 추가**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Step 4: 기존 import 경로를 @/ alias로 변경**

`src/main.tsx`의 import를 확인하고 필요하면 업데이트:
```tsx
import '@/styles/globals.css'
import App from '@/App'
```

**Step 5: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, 에러 없음

**Step 6: Commit**

```bash
git add tsconfig.json tsconfig.app.json vite.config.ts src/main.tsx
git commit -m "chore: add @/ path alias for shadcn/ui compatibility"
```

---

## Task 2: shadcn/ui 초기화

`npx shadcn@latest init`을 실행하여 shadcn/ui 기본 세팅을 완료한다. Tailwind v4 모드로 자동 감지될 것이다.

**Files:**
- Create: `components.json`
- Modify: `src/styles/globals.css` (shadcn이 CSS 변수 추가)
- Modify: `package.json` (의존성 추가)

**Step 1: shadcn init 실행**

```bash
npx shadcn@latest init
```

CLI 옵션:
- Style: **New York**
- Base color: **Neutral** (우리가 덮어쓸 것이므로 무관)
- CSS variables: **Yes**
- CSS file: `src/styles/globals.css`
- Tailwind config: (빈칸 — Tailwind v4는 config 파일 불필요)
- Components alias: `@/components/ui`
- Utils alias: `@/lib/utils`

> **주의:** shadcn init이 `globals.css`를 수정할 수 있다. 기존 `@font-face`와 `@theme` 내용이 보존되는지 반드시 확인한다. 덮어쓰여졌다면 git으로 복원 후 수동 통합한다.

**Step 2: globals.css 상태 확인**

shadcn init 후 `globals.css`를 열어 다음이 공존하는지 확인:
- 기존 MoaPlace `@font-face` 5개 (Pretendard Regular/Medium/SemiBold/Bold/ExtraBold)
- 기존 MoaPlace `@theme` 컬러 변수 (18색)
- shadcn이 추가한 `:root` CSS 변수, `@theme inline` 블록, `@layer base`

**Step 3: components.json 확인**

생성된 `components.json`이 아래와 유사한지 확인:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "tailwind": {
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components/ui",
    "utils": "@/lib/utils"
  }
}
```

**Step 4: lib/utils.ts 확인**

shadcn이 `src/lib/utils.ts`를 덮어쓰거나 새로 만들 수 있다. 기존 `cn()` 함수가 유지되는지 확인:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

**Step 5: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize shadcn/ui with Tailwind v4"
```

---

## Task 3: MoaPlace 컬러 시스템 ↔ shadcn CSS 변수 통합

shadcn의 시맨틱 CSS 변수(background, foreground, primary 등)를 MoaPlace 18색으로 매핑한다. shadcn은 OKLCH 포맷을 사용하므로 MoaPlace HEX 값을 OKLCH로 변환한다.

**Files:**
- Modify: `src/styles/globals.css`

**Step 1: MoaPlace HEX → OKLCH 변환**

아래 매핑으로 `:root` CSS 변수를 설정한다. OKLCH 값은 CSS `oklch()` 함수로 표현.

```
MoaPlace HEX → OKLCH 변환표:
#FFFFFF (white)      → oklch(1 0 0)
#0A0E12 (black)      → oklch(0.153 0.013 256)
#1E293B (black800)   → oklch(0.279 0.029 256)
#475569 (black600)   → oklch(0.446 0.03 256)
#94A3B8 (black400)   → oklch(0.704 0.025 256)
#CBD5E1 (black300)   → oklch(0.869 0.013 256)
#F1F5F9 (black100)   → oklch(0.968 0.005 256)
#3B82F6 (primary)    → oklch(0.623 0.172 259)
#1D4ED8 (primary700) → oklch(0.457 0.188 261)
#2563EB (primary600) → oklch(0.521 0.193 261)
#DBEAFE (primary100) → oklch(0.932 0.032 255)
#C2410C (sub)        → oklch(0.501 0.148 37)
#9A3412 (sub600)     → oklch(0.407 0.123 38)
#FFEDD5 (sub100)     → oklch(0.955 0.034 80)
#15803D (success)    → oklch(0.517 0.12 152)
#DC2626 (error)      → oklch(0.538 0.19 25)
#A16207 (warning)    → oklch(0.522 0.117 75)
#0369A1 (info)       → oklch(0.478 0.108 232)
```

> 정확한 OKLCH 값은 구현 시 CSS 변환 도구로 확인. 위는 근사값.

**Step 2: globals.css에 `:root` 변수 설정**

shadcn이 생성한 `:root` 블록에서 MoaPlace 색상으로 값을 교체한다:

```css
:root {
  --radius: 0.5rem;

  /* MoaPlace 시맨틱 매핑 */
  --background: oklch(1 0 0);              /* white #FFFFFF */
  --foreground: oklch(0.279 0.029 256);    /* black800 #1E293B — 기본 텍스트 */

  --card: oklch(1 0 0);                    /* white */
  --card-foreground: oklch(0.279 0.029 256); /* black800 */

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.279 0.029 256);

  --primary: oklch(0.623 0.172 259);       /* primary #3B82F6 */
  --primary-foreground: oklch(1 0 0);      /* white (primary 위 텍스트) */

  --secondary: oklch(0.968 0.005 256);     /* black100 #F1F5F9 */
  --secondary-foreground: oklch(0.279 0.029 256); /* black800 */

  --muted: oklch(0.968 0.005 256);         /* black100 */
  --muted-foreground: oklch(0.446 0.03 256); /* black600 */

  --accent: oklch(0.968 0.005 256);        /* black100 */
  --accent-foreground: oklch(0.279 0.029 256);

  --destructive: oklch(0.538 0.19 25);     /* error #DC2626 */
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.869 0.013 256);        /* black300 #CBD5E1 */
  --input: oklch(0.869 0.013 256);         /* black300 */
  --ring: oklch(0.623 0.172 259);          /* primary */

  --chart-1: oklch(0.623 0.172 259);       /* primary */
  --chart-2: oklch(0.501 0.148 37);        /* sub */
  --chart-3: oklch(0.517 0.12 152);        /* success */
  --chart-4: oklch(0.522 0.117 75);        /* warning */
  --chart-5: oklch(0.478 0.108 232);       /* info */
}
```

**Step 3: `@theme inline` 블록에 shadcn 시맨틱 토큰 등록**

shadcn이 생성한 `@theme inline` 블록을 유지하면서, 기존 MoaPlace `@theme` 블록과 통합:

```css
@theme inline {
  /* shadcn 시맨틱 토큰 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

**Step 4: 기존 MoaPlace `@theme` 블록 유지**

기존 `@theme` 블록(MoaPlace 18색 + Pretendard 폰트)은 그대로 유지한다. shadcn의 `@theme inline`과 MoaPlace의 `@theme`은 병렬로 존재 가능.

> 주의: 같은 변수명 충돌 확인. `--color-primary`가 양쪽에 있으면 하나로 통합. MoaPlace의 `--color-primary: #3B82F6`과 shadcn의 `--color-primary: var(--primary)`는 같은 값이므로 shadcn 쪽 `@theme inline`으로 통합.

**Step 5: MoaPlace 전용 컬러 토큰 — `@theme inline`에 추가**

shadcn 시맨틱 매핑에 포함되지 않는 MoaPlace 전용 색상:

```css
@theme inline {
  /* ... shadcn 시맨틱 토큰 ... */

  /* MoaPlace 전용 토큰 */
  --color-sub: var(--sub);
  --color-sub-600: var(--sub-600);
  --color-sub-100: var(--sub-100);
  --color-primary-700: var(--primary-700);
  --color-primary-600: var(--primary-600);
  --color-primary-100: var(--primary-100);
  --color-black: var(--black);
  --color-black-800: var(--foreground);
  --color-black-600: var(--muted-foreground);
  --color-black-400: var(--black-400);
  --color-black-300: var(--border);
  --color-black-100: var(--secondary);
  --color-success: var(--success);
  --color-error: var(--destructive);
  --color-warning: var(--warning);
  --color-info: var(--info);
}
```

`:root`에 MoaPlace 전용 변수도 추가:
```css
:root {
  /* ... shadcn 시맨틱 ... */

  /* MoaPlace 전용 */
  --black: oklch(0.153 0.013 256);
  --black-400: oklch(0.704 0.025 256);
  --sub: oklch(0.501 0.148 37);
  --sub-600: oklch(0.407 0.123 38);
  --sub-100: oklch(0.955 0.034 80);
  --primary-700: oklch(0.457 0.188 261);
  --primary-600: oklch(0.521 0.193 261);
  --primary-100: oklch(0.932 0.032 255);
  --success: oklch(0.517 0.12 152);
  --warning: oklch(0.522 0.117 75);
  --info: oklch(0.478 0.108 232);
}
```

**Step 6: `@layer base` 에 body 기본 스타일 확인**

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

이로써 body의 기본 텍스트 색상이 `text-foreground` = `black800` (#1E293B)이 된다.

**Step 7: `src/constants/colors.ts` 업데이트**

AppColors의 HEX 값은 그대로 유지 (JS에서 inline style 등에 필요). 하지만 주석에 Tailwind 클래스 매핑 추가:

```ts
/** 프라이머리 — CTA 버튼, 브랜드 강조
 * Tailwind: bg-primary, text-primary
 */
primary: "#3B82F6",
```

**Step 8: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, 색상 변수 충돌 없음

**Step 9: Commit**

```bash
git add src/styles/globals.css src/constants/colors.ts
git commit -m "feat: integrate MoaPlace color system with shadcn CSS variables"
```

---

## Task 4: shadcn 컴포넌트 10개 설치

shadcn CLI로 10개 컴포넌트를 일괄 설치한다.

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/sonner.tsx` (+ `sonner` 패키지)
- Modify: `package.json` (Radix UI + sonner 의존성 추가)

**Step 1: 컴포넌트 일괄 설치**

```bash
npx shadcn@latest add button input dialog sheet badge card tooltip skeleton separator sonner
```

> 프롬프트가 나오면 모두 Yes. 기존 파일 덮어쓰기 여부가 나오면 주의.

**Step 2: 설치 결과 확인**

```bash
ls src/components/ui/
```

Expected: 위 10개 파일 + 필요한 서브 컴포넌트들

**Step 3: Sonner 글로벌 설정**

`src/App.tsx`에 Sonner `<Toaster />` 추가:

```tsx
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      {/* ... routes ... */}
      <Toaster position="bottom-center" />
    </>
  );
}
```

> `position="bottom-center"` — 모바일 PWA에서 하단 중앙이 최적 (피츠의 법칙).

**Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add 10 shadcn/ui components (button, input, dialog, sheet, badge, card, tooltip, skeleton, separator, sonner)"
```

---

## Task 5: Button 커스텀 — MoaPlace Variants

shadcn Button에 MoaPlace 전용 variant를 추가한다. PRD의 CTA 패턴에 맞춤.

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: variant 확장**

shadcn Button의 `buttonVariants`에 MoaPlace 색상 적용. shadcn 기본 variant(`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`)는 유지하되, 색상이 MoaPlace 토큰을 사용하도록 이미 Task 3에서 CSS 변수를 매핑했으므로 자동 적용됨.

추가로 MoaPlace 전용 variant 필요 시:

```tsx
// buttonVariants의 variants.variant에 추가
sub: "bg-sub text-white hover:bg-sub-600 active:opacity-90",
```

**Step 2: size에 터치 영역 확보 확인**

모든 size의 `min-height`가 44px 이상인지 확인 (피츠의 법칙):
- `sm`: `h-9` (36px) → 모바일 인라인에서만 사용, 터치 타겟은 패딩으로 보완
- `default`: `h-10` (40px) → 근접하지만 py로 보완
- `lg`: `h-12` (48px) → 충분

> `sm`은 인라인 전용이므로 괜찮다. 주요 CTA는 반드시 `default` 이상 사용.

**Step 3: fullWidth prop 추가 (선택)**

PRD의 CTA 버튼("새로운 모임 만들기", "여기로 확정!")은 풀너비. shadcn Button은 기본적으로 `w-full` 클래스를 외부에서 전달하는 패턴이므로 별도 prop은 불필요할 수 있다.

```tsx
// 사용 시
<Button className="w-full" size="lg">새로운 모임 만들기</Button>
```

**Step 4: 빌드 확인**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: customize Button with MoaPlace color variants"
```

---

## Task 6: 반응형 + PWA 기반 유틸리티 설정

PWA에서 필요한 safe-area 대응과 반응형 breakpoint 유틸리티를 설정한다.

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `index.html`

**Step 1: viewport-fit=cover 메타 태그 확인**

`index.html`의 `<meta name="viewport">`에 `viewport-fit=cover` 추가:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

이는 PWA standalone 모드에서 노치/홈 인디케이터 영역까지 콘텐츠가 확장될 때 safe-area를 사용하기 위한 전제 조건.

**Step 2: safe-area 유틸리티 CSS 추가**

`globals.css`에 PWA safe-area padding 유틸리티 추가:

```css
@layer base {
  /* PWA safe-area */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
}
```

**Step 3: 애니메이션 키프레임 추가**

Toast, Modal, BottomSheet에 사용할 애니메이션 (도허티 임계 0.4초 이내):

```css
@theme inline {
  /* ... 기존 토큰 ... */

  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-scale-up: scale-up 0.2s ease-out;
  --animate-fade-in: fade-in 0.2s ease-out;
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Step 4: 빌드 확인**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/styles/globals.css index.html
git commit -m "feat: add PWA safe-area utilities and animation keyframes"
```

---

## Task 7: Sheet(BottomSheet) 커스텀 — 모바일 PWA 최적화

shadcn Sheet을 MoaPlace BottomSheet 용도로 커스텀. 결과 패널과 위치 확정 바텀시트에 사용.

**Files:**
- Modify: `src/components/ui/sheet.tsx`

**Step 1: Sheet의 기본 side를 "bottom"으로**

shadcn Sheet의 `SheetContent`에서 `side` prop 기본값이 "right"인데, MoaPlace에서는 대부분 바텀시트로 사용하므로 `side="bottom"`을 기본값으로 변경하거나, 사용 시 명시:

```tsx
// 사용 패턴
<Sheet>
  <SheetTrigger asChild>...</SheetTrigger>
  <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] pb-safe">
    <SheetHeader>
      {/* 드래그 핸들 */}
      <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-2" />
      <SheetTitle>결과</SheetTitle>
    </SheetHeader>
    {/* 콘텐츠 */}
  </SheetContent>
</Sheet>
```

**Step 2: bottom side에 rounded-t-2xl, max-h, pb-safe 적용**

Sheet의 `sheetVariants`에서 `bottom` variant를 확인/수정:
- `rounded-t-2xl` — 상단 모서리 둥글게
- `max-h-[70vh]` — 최대 높이 70%
- `overflow-y-auto` — 스크롤 가능
- `pb-safe` — PWA safe area

**Step 3: 빌드 확인**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/ui/sheet.tsx
git commit -m "feat: customize Sheet for mobile bottom-sheet pattern with PWA safe-area"
```

---

## Task 8: Dialog 커스텀 — 닉네임 입력 모달

shadcn Dialog를 모바일 중앙 모달로 최적화. PRD 와이어프레임 7.3 닉네임 입력용.

**Files:**
- Modify: `src/components/ui/dialog.tsx` (필요 시)

**Step 1: Dialog 모바일 최적화 확인**

shadcn Dialog는 기본적으로 중앙 정렬. 모바일에서의 너비가 적절한지 확인:

```tsx
// DialogContent의 기본 클래스에 이미 포함되어 있어야 할 것:
// max-w-sm w-[calc(100%-32px)] 또는 유사한 반응형 너비
```

모바일에서 좌우 16px 마진이 확보되는지 확인. shadcn 기본이 `max-w-lg`이면 `max-w-sm`으로 변경 고려 (MoaPlace는 모바일 우선).

**Step 2: 애니메이션 확인**

shadcn Dialog는 Radix UI 기반이라 자체 애니메이션이 있다. `scale-up` 애니메이션이 적용되는지 확인.

**Step 3: 빌드 확인**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "feat: optimize Dialog for mobile-first layout"
```

---

## Task 9: PWAInstallBanner 커스텀 컴포넌트

shadcn에 없는 PWA 설치 유도 배너. Card + Button 조합으로 구성.

**Files:**
- Create: `src/components/common/PWAInstallBanner.tsx`

**Step 1: 컴포넌트 작성**

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PWAInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
  className?: string;
}

const PWAInstallBanner = ({ onInstall, onDismiss, className }: PWAInstallBannerProps) => {
  return (
    <div className={cn(
      'flex items-center justify-between gap-3',
      'px-4 py-3 mx-4 rounded-lg',
      'bg-primary-100 border border-primary/20',
      className,
    )}>
      <span className="text-sm text-foreground">
        홈 화면에 추가하면 더 빠르게 쓸 수 있어요
      </span>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          괜찮아요
        </Button>
        <Button size="sm" onClick={onInstall}>
          추가하기
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
```

> `usePWA` 훅은 나중에 PWA 기능 구현 시 만들 것. 지금은 props로 콜백 받는 순수 UI 컴포넌트만.

**Step 2: 빌드 확인**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/common/PWAInstallBanner.tsx
git commit -m "feat: add PWAInstallBanner component"
```

---

## Task 10: SearchBar 커스텀 컴포넌트

장소 검색 바. shadcn Input 기반 + 검색 아이콘 + 클리어 버튼.

**Files:**
- Create: `src/components/common/SearchBar.tsx`

**Step 1: 컴포넌트 작성**

```tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = '장소 검색 (예: 강남역)',
  className,
}: SearchBarProps) => {
  return (
    <div className={cn('relative', className)}>
      {/* 검색 아이콘 */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />

      {/* 클리어 버튼 */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
```

> Google Places 자동완성은 나중에 지도 기능 구현 시 통합. 지금은 순수 UI만.

**Step 2: 빌드 확인**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/common/SearchBar.tsx
git commit -m "feat: add SearchBar component with search icon and clear button"
```

---

## Task 11: 최종 검증 및 정리

전체 위젯 시스템이 올바르게 구성되었는지 검증한다.

**Step 1: 빌드 확인**

```bash
npm run build
```

**Step 2: 린트 확인**

```bash
npm run lint
```

**Step 3: 파일 구조 확인**

```bash
ls -la src/components/ui/
ls -la src/components/common/
```

Expected:
```
src/components/
├── ui/              ← shadcn 컴포넌트
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── tooltip.tsx
│   ├── skeleton.tsx
│   ├── separator.tsx
│   └── sonner.tsx
└── common/          ← 커스텀 컴포넌트
    ├── PWAInstallBanner.tsx
    └── SearchBar.tsx
```

**Step 4: globals.css 최종 구조 확인**

파일이 아래 순서로 구성되었는지 확인:
1. `@import "tailwindcss"`
2. shadcn imports (`tw-animate-css` 등)
3. `@font-face` (Pretendard 5개)
4. `@custom-variant dark`
5. `@theme inline` (shadcn 시맨틱 + MoaPlace 전용 토큰)
6. `:root` (CSS 변수 — OKLCH)
7. `@keyframes` (애니메이션)
8. `@layer base` (body 기본 스타일 + safe-area)

**Step 5: CLAUDE.md 업데이트**

위젯 시스템 관련 내용을 CLAUDE.md에 추가:

```markdown
## Widgets
- shadcn/ui (New York style) — `src/components/ui/`
- 커스텀 컴포넌트 — `src/components/common/`
- 컴포넌트 추가: `npx shadcn@latest add <component>`
- 색상: shadcn CSS 변수 → MoaPlace 18색 매핑 (globals.css)
```

**Step 6: Commit**

```bash
git add -A
git commit -m "docs: update CLAUDE.md with widget system reference"
```

---

## 참고: 색상 매핑 요약표

| MoaPlace 토큰 | HEX | shadcn 시맨틱 | Tailwind 클래스 |
|---|---|---|---|
| white | #FFFFFF | background | bg-background |
| black | #0A0E12 | — (전용) | text-black |
| black800 | #1E293B | foreground | text-foreground |
| black600 | #475569 | muted-foreground | text-muted-foreground |
| black400 | #94A3B8 | — (전용) | text-black-400 |
| black300 | #CBD5E1 | border | border-border |
| black100 | #F1F5F9 | secondary / muted | bg-secondary |
| primary | #3B82F6 | primary | bg-primary |
| primary700 | #1D4ED8 | — (전용) | bg-primary-700 |
| primary600 | #2563EB | — (전용) | bg-primary-600 |
| primary100 | #DBEAFE | — (전용) | bg-primary-100 |
| sub | #C2410C | — (전용) | bg-sub |
| sub600 | #9A3412 | — (전용) | bg-sub-600 |
| sub100 | #FFEDD5 | — (전용) | bg-sub-100 |
| success | #15803D | — (전용) | text-success |
| error | #DC2626 | destructive | bg-destructive |
| warning | #A16207 | — (전용) | text-warning |
| info | #0369A1 | — (전용) | text-info |
