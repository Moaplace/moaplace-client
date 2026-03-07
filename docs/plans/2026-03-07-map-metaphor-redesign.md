# 지도 메타포 디자인 시스템 리디자인 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모아장소 UI/UX를 지도/공간 메타포 기반의 독창적 디자인 시스템으로 전면 리디자인

**Architecture:** 컬러 시스템(colors.ts + globals.css) 재정의 → 공통 컴포넌트(Button, Card, Input, Badge, Toast, Modal, Drawer) 리디자인 → 신규 컴포넌트(MapPin, ProgressRoute, PulseMarker) 생성 → 페이지(HomePage, RoomPage) 적용 → 로딩/에러/빈 상태 UI → PWA 최적화 → 접근성 감사

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS v4 (OKLCH), CVA, shadcn/ui, Radix UI, Vaul, Lucide React, Pretendard

**Design Doc:** `docs/plans/2026-03-07-map-metaphor-redesign-design.md`

**Agent Skills:**
- 구현 시: `.agents/skills/vercel-react-best-practices/rules/` (rendering, rerender, client 규칙)
- 리뷰 시: `.agents/skills/web-design-guidelines/SKILL.md`
- 디자인 방향: `.agents/skills/frontend-design/SKILL.md`

---

## Task 1: 컬러 시스템 재정의

**Files:**
- Modify: `src/constants/colors.ts`
- Modify: `src/styles/globals.css`

### Step 1: colors.ts 컬러 팔레트 업데이트

`src/constants/colors.ts`에서 AppColors 객체를 다음과 같이 변경:

```typescript
export const AppColors = {
  // 흑백 (유지, background만 변경)
  white: "#FFFFFF",
  black: "#0A0E12",
  black800: "#1E293B",
  black600: "#475569",
  black400: "#94A3B8",
  black300: "#CBD5E1",
  black100: "#F1F5F9",

  // Primary — 바다/강 (변경)
  primary: "#2563EB",       // was #3B82F6
  primary700: "#1E40AF",    // was #1D4ED8
  primary600: "#2563EB",    // 유지
  primary100: "#DBEAFE",    // 유지

  // Sub — 핀 골드 (변경)
  sub: "#F59E0B",           // was #C2410C
  sub600: "#D97706",        // was #9A3412
  sub100: "#FEF3C7",        // was #FFEDD5

  // Surface (신규)
  surface: "#F1F5F9",
  background: "#F8FAFC",    // 신규 — 약간 쿨그레이 배경

  // 중심점 (신규)
  center: "#7C3AED",        // 보라
  center600: "#6D28D9",
  center100: "#EDE9FE",

  // 상태 (success 변경)
  success: "#059669",       // was #15803D → 에메랄드
  error: "#DC2626",
  warning: "#A16207",
  info: "#0369A1",
} as const;
```

### Step 2: globals.css CSS 변수 및 그라데이션 토큰 업데이트

`src/styles/globals.css`의 `:root` 블록에서 변경된 색상 CSS 변수 업데이트 + 그라데이션/새 애니메이션 추가:

**CSS 변수 변경:**
```css
--color-primary: oklch(from #2563EB l c h);
--color-primary-700: oklch(from #1E40AF l c h);
--color-sub: oklch(from #F59E0B l c h);
--color-sub-600: oklch(from #D97706 l c h);
--color-sub-100: oklch(from #FEF3C7 l c h);
--color-surface: oklch(from #F1F5F9 l c h);
--color-bg: oklch(from #F8FAFC l c h);
--color-center: oklch(from #7C3AED l c h);
--color-center-600: oklch(from #6D28D9 l c h);
--color-center-100: oklch(from #EDE9FE l c h);
--color-success: oklch(from #059669 l c h);
```

**신규 애니메이션 (@keyframes) 추가:**
```css
@keyframes pin-drop {
  0% { transform: translateY(-40px) scale(0.8); opacity: 0; }
  60% { transform: translateY(4px) scale(1.05); opacity: 1; }
  80% { transform: translateY(-2px) scale(0.98); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes route-draw {
  from { stroke-dashoffset: 100%; }
  to { stroke-dashoffset: 0%; }
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}
```

**애니메이션 유틸리티:**
```css
@utility animate-pin-drop { animation: pin-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@utility animate-pulse-ring { animation: pulse-ring 1.5s ease-out infinite; }
@utility animate-route-draw { animation: route-draw 1s ease-in-out forwards; }
@utility animate-ripple { animation: ripple 0.6s ease-out; }
```

**Tailwind 커스텀 컬러 매핑 추가 (@theme inline):**
```css
--color-surface: var(--color-surface);
--color-bg: var(--color-bg);
--color-center: var(--color-center);
--color-center-600: var(--color-center-600);
--color-center-100: var(--color-center-100);
```

### Step 3: 빌드 확인

Run: `npm run build`
Expected: 타입 에러 없이 빌드 성공

### Step 4: 커밋

```bash
git add src/constants/colors.ts src/styles/globals.css
git commit -m "style : 지도 메타포 컬러 시스템 재정의 (지형도 팔레트)"
```

---

## Task 2: Button 컴포넌트 리디자인

**Files:**
- Modify: `src/components/ui/button.tsx`

### Step 1: CVA variants 업데이트

`src/components/ui/button.tsx`에서 buttonVariants 수정:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-pretendard-md transition-all duration-200 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 relative overflow-hidden active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-700 text-white shadow-md hover:shadow-lg hover:brightness-110",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-black-300 bg-white shadow-xs hover:bg-surface hover:border-black-400",
        secondary:
          "bg-surface text-black-800 shadow-xs hover:bg-black-100",
        sub:
          "bg-sub text-white shadow-md hover:bg-sub-600 hover:shadow-lg",
        ghost:
          "hover:bg-surface hover:text-black-800",
        link:
          "text-primary underline-offset-4 hover:underline",
        "icon-circle":
          "rounded-full bg-white border border-black-300 shadow-md hover:shadow-lg hover:bg-surface text-black-600",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg",
        sm: "h-9 px-4 text-sm",
        default: "h-10 px-5",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

핵심 변경:
- `rounded-lg` → `rounded-xl` (기본 모서리)
- default variant: `bg-gradient-to-r from-primary to-primary-700` (그라데이션)
- `active:scale-[0.98]` 추가 (터치 피드백)
- `overflow-hidden relative` 추가 (ripple 효과 대비)
- `icon-circle` variant 신규 추가
- outline: `hover:bg-surface` (새 surface 색상 사용)
- `transition-colors` → `transition-all duration-200`

### Step 2: 빌드 확인

Run: `npm run build`
Expected: 타입 에러 없이 빌드 성공

### Step 3: 커밋

```bash
git add src/components/ui/button.tsx
git commit -m "style : Button 컴포넌트 지도 메타포 리디자인 (그라데이션, ripple, icon-circle)"
```

---

## Task 3: Card 컴포넌트 리디자인

**Files:**
- Modify: `src/components/ui/card.tsx`

### Step 1: Card 스타일 업데이트

`src/components/ui/card.tsx`에서 Card 루트 컴포넌트 className 변경:

```typescript
// Card 루트: rounded-xl → rounded-2xl, 호버 elevation, surface 배경
"bg-white rounded-2xl border border-black-300/50 py-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-6 text-card-foreground"
```

핵심 변경:
- `rounded-xl` → `rounded-2xl`
- `border` → `border border-black-300/50` (미세한 보더)
- hover: `hover:shadow-md hover:-translate-y-0.5` (elevation 효과)
- `transition-all duration-200` 추가
- `bg-card` → `bg-white` (명시적)

### Step 2: 빌드 확인

Run: `npm run build`
Expected: 빌드 성공

### Step 3: 커밋

```bash
git add src/components/ui/card.tsx
git commit -m "style : Card 컴포넌트 리디자인 (rounded-2xl, hover elevation)"
```

---

## Task 4: Input 컴포넌트 리디자인

**Files:**
- Modify: `src/components/ui/input.tsx`

### Step 1: Input 스타일 업데이트

포커스 시 보더 전환 애니메이션 + rounded-xl 적용:

```typescript
// 기본 className 변경:
"file:text-foreground placeholder:text-muted-foreground selection:bg-primary/20 flex w-full min-w-0 rounded-xl border border-black-300 bg-white px-3 py-1 text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
"focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] focus-visible:shadow-md",
"aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
```

핵심 변경:
- `rounded-md` → `rounded-xl`
- `border-input` → `border-black-300` (디자인 시스템 토큰)
- `bg-transparent` → `bg-white`
- focus: `border-ring ring-ring/50` → `border-primary ring-primary/20 shadow-md`
- `transition-colors` → `transition-all duration-300`
- `selection:bg-primary/20` 추가

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/ui/input.tsx
git commit -m "style : Input 컴포넌트 리디자인 (rounded-xl, 포커스 애니메이션)"
```

---

## Task 5: Badge 컴포넌트 리디자인

**Files:**
- Modify: `src/components/ui/badge.tsx`

### Step 1: Badge CVA variants 업데이트

지도 핀 상단 원형 스타일:

```typescript
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-pretendard-md whitespace-nowrap shadow-sm transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-primary-100 text-primary",
        destructive: "border-transparent bg-destructive text-white",
        outline: "border-black-300 text-black-800 bg-white",
        center: "border-transparent bg-center text-white",  // 신규: 중심점
        sub: "border-transparent bg-sub text-white",         // 신규: 내 마커
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

핵심 변경:
- ghost, link variant 제거 (Badge에 불필요)
- `center` variant 추가 (보라색 중심점용)
- `sub` variant 추가 (핀 골드 내 마커용)
- `shadow-sm` 추가 (약간의 떠있는 느낌)
- secondary: `bg-secondary` → `bg-primary-100 text-primary` (명시적)

### Step 2: 빌드 확인

Run: `npm run build`
Expected: ghost/link 사용처 없으면 통과, 있으면 해당 파일도 수정

### Step 3: 사용처 확인 및 수정

Run: `grep -rn "variant=\"ghost\"\|variant=\"link\"" src/components/ui/badge.tsx src/pages/ src/components/`
→ ghost/link Badge 사용처가 있으면 적절한 variant로 교체

### Step 4: 커밋

```bash
git add src/components/ui/badge.tsx
git commit -m "style : Badge 컴포넌트 리디자인 (center, sub variant 추가, 핀 스타일)"
```

---

## Task 6: Toast(Sonner) 리디자인

**Files:**
- Modify: `src/components/ui/sonner.tsx`

### Step 1: Toaster 스타일 및 위치 변경

```typescript
// position을 top-center로, 핀 드롭 애니메이션 적용
<Sonner
  className="toaster group"
  position="top-center"    // was "bottom-center"
  toastOptions={{
    classNames: {
      toast:
        "group toast group-[.toaster]:bg-white group-[.toaster]:text-black-800 group-[.toaster]:border-black-300/50 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:animate-pin-drop",
      // ... 나머지 유지
    },
  }}
  // ... icons 유지
/>
```

핵심 변경:
- `position`: bottom-center → top-center
- toast className에 `rounded-xl`, `shadow-lg`, `animate-pin-drop` 추가
- 색상을 디자인 시스템 토큰으로 명시 (`text-black-800`, `border-black-300/50`)

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/ui/sonner.tsx
git commit -m "style : Toast 리디자인 (상단 위치, 핀 드롭 애니메이션, rounded-xl)"
```

---

## Task 7: Modal(Dialog) & BottomSheet(Drawer) 리디자인

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/drawer.tsx`

### Step 1: Dialog 오버레이 + 콘텐츠 스타일 변경

`dialog.tsx`의 DialogOverlay와 DialogContent 수정:

```typescript
// DialogOverlay: blur 강화 + 지도 격자 패턴
"fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

// DialogContent: rounded-2xl, shadow-2xl
"bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-black-300/50 p-6 shadow-2xl duration-200 sm:max-w-lg"
```

### Step 2: Drawer 스타일 변경

`drawer.tsx`의 DrawerContent 수정:

```typescript
// bottom 방향 DrawerContent:
"bg-white mx-3 rounded-t-2xl border border-black-300/50 shadow-2xl"

// 핸들바 등고선 스타일:
"mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-gradient-to-r from-black-300 to-black-400"
```

핵심 변경:
- overlay: `backdrop-blur-sm` 추가
- content: `rounded-2xl`, `shadow-2xl`, `border-black-300/50`
- drawer 핸들: 그라데이션 (등고선 느낌)

### Step 3: 빌드 확인

Run: `npm run build`

### Step 4: 커밋

```bash
git add src/components/ui/dialog.tsx src/components/ui/drawer.tsx
git commit -m "style : Dialog/Drawer 리디자인 (blur overlay, rounded-2xl, 등고선 핸들)"
```

---

## Task 8: Skeleton 컴포넌트 리디자인

**Files:**
- Modify: `src/components/ui/skeleton.tsx`

### Step 1: 등고선 패턴 스켈레톤

```typescript
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-gradient-to-r from-black-100 via-surface to-black-100 bg-[length:200%_100%] animate-pulse rounded-xl",
        className
      )}
      {...props}
    />
  )
}
```

핵심 변경:
- `bg-accent` → `bg-gradient-to-r from-black-100 via-surface to-black-100` (은은한 그라데이션)
- `rounded-lg` → `rounded-xl`

### Step 2: 커밋

```bash
git add src/components/ui/skeleton.tsx
git commit -m "style : Skeleton 리디자인 (그라데이션 등고선 패턴)"
```

---

## Task 9: MapPin 신규 컴포넌트

**Files:**
- Create: `src/components/Map/MapPin.tsx`

### Step 1: MapPin 컴포넌트 생성

```typescript
import { MapPin as MapPinIcon, Star, Navigation } from "lucide-react"

import { cn } from "@/lib/utils"

interface MapPinProps {
  type: "mine" | "others" | "center"
  nickname?: string
  className?: string
  animate?: boolean
}

const pinStyles = {
  mine: "bg-sub text-white shadow-sub/30",
  others: "bg-primary text-white shadow-primary/30",
  center: "bg-center text-white shadow-center/30",
} as const

const pinIcons = {
  mine: Navigation,
  others: MapPinIcon,
  center: Star,
} as const

const MapPin = ({ type, nickname, className, animate = true }: MapPinProps) => {
  const Icon = pinIcons[type]

  return (
    <div className={cn("flex flex-col items-center gap-1", animate && "animate-pin-drop", className)}>
      {nickname && (
        <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-pretendard-md text-black-800 shadow-sm backdrop-blur-sm">
          {nickname}
        </span>
      )}
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
        pinStyles[type]
      )}>
        <Icon className="size-5" />
      </div>
      <div className={cn(
        "size-2 rounded-full -mt-1",
        type === "mine" && "bg-sub",
        type === "others" && "bg-primary",
        type === "center" && "bg-center",
      )} />
    </div>
  )
}

export default MapPin
```

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/Map/MapPin.tsx
git commit -m "feat : MapPin 신규 컴포넌트 (mine/others/center 타입, 핀 드롭 애니메이션)"
```

---

## Task 10: PulseMarker 신규 컴포넌트

**Files:**
- Create: `src/components/Map/PulseMarker.tsx`

### Step 1: PulseMarker 컴포넌트 생성

```typescript
import { cn } from "@/lib/utils"

interface PulseMarkerProps {
  color?: "center" | "primary" | "sub"
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

const colorStyles = {
  center: "bg-center",
  primary: "bg-primary",
  sub: "bg-sub",
} as const

const ringStyles = {
  center: "bg-center/30",
  primary: "bg-primary/30",
  sub: "bg-sub/30",
} as const

const sizeStyles = {
  sm: "size-3",
  md: "size-5",
  lg: "size-8",
} as const

const ringSizeStyles = {
  sm: "size-3",
  md: "size-5",
  lg: "size-8",
} as const

const PulseMarker = ({ color = "center", size = "md", label, className }: PulseMarkerProps) => {
  return (
    <div className={cn("relative flex flex-col items-center gap-1", className)}>
      <div className="relative flex items-center justify-center">
        <span className={cn(
          "absolute rounded-full animate-pulse-ring",
          ringStyles[color],
          ringSizeStyles[size]
        )} />
        <span className={cn(
          "relative rounded-full shadow-lg z-10",
          colorStyles[color],
          sizeStyles[size]
        )} />
      </div>
      {label && (
        <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-pretendard-md text-black-800 shadow-sm backdrop-blur-sm whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}

export default PulseMarker
```

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/Map/PulseMarker.tsx
git commit -m "feat : PulseMarker 신규 컴포넌트 (중심점/로딩 펄스 애니메이션)"
```

---

## Task 11: ProgressRoute 신규 컴포넌트

**Files:**
- Create: `src/components/common/ProgressRoute.tsx`

### Step 1: ProgressRoute 컴포넌트 생성

SVG 기반 경로선 형태 진행률 표시 (스텝 위자드용):

```typescript
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProgressRouteProps {
  steps: string[]
  currentStep: number
  className?: string
}

const ProgressRoute = ({ steps, currentStep, className }: ProgressRouteProps) => {
  return (
    <div className={cn("flex items-center w-full px-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* 체크포인트 노드 */}
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                isCompleted && "bg-primary border-primary text-white",
                isCurrent && "border-primary bg-primary-100 text-primary",
                !isCompleted && !isCurrent && "border-black-300 bg-white text-black-400"
              )}>
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-xs font-pretendard-sb">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-pretendard-md whitespace-nowrap",
                isCompleted && "text-primary",
                isCurrent && "text-primary font-pretendard-sb",
                !isCompleted && !isCurrent && "text-black-400"
              )}>
                {step}
              </span>
            </div>

            {/* 경로선 */}
            {!isLast && (
              <div className="flex-1 mx-2 h-0.5 relative">
                <div className="absolute inset-0 bg-black-300 rounded-full" />
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500",
                    isCompleted ? "w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProgressRoute
```

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/common/ProgressRoute.tsx
git commit -m "feat : ProgressRoute 신규 컴포넌트 (경로선 형태 스텝 위자드)"
```

---

## Task 12: MapMarker 기존 컴포넌트를 MapPin 활용으로 리팩터

**Files:**
- Modify: `src/components/Map/MapMarker.tsx`

### Step 1: MapMarker를 MapPin 래퍼로 변경

```typescript
import { memo } from "react"

import MapPin from "@/components/Map/MapPin"
import PulseMarker from "@/components/Map/PulseMarker"
import { cn } from "@/lib/utils"

interface MapMarkerProps {
  type: "mine" | "others" | "center"
  nickname: string
  style?: React.CSSProperties
  className?: string
}

const MapMarker = memo(({ type, nickname, style, className }: MapMarkerProps) => {
  if (type === "center") {
    return (
      <div style={style} className={cn("absolute -translate-x-1/2 -translate-y-1/2", className)}>
        <PulseMarker color="center" size="lg" label="중간지점" />
      </div>
    )
  }

  return (
    <div style={style} className={cn("absolute -translate-x-1/2 -translate-y-full", className)}>
      <MapPin type={type} nickname={nickname} />
    </div>
  )
})

MapMarker.displayName = "MapMarker"

export default MapMarker
```

핵심 변경:
- `memo` 래핑 (vercel-react-best-practices: rerender-memo)
- center 타입: PulseMarker 사용
- mine/others: MapPin 사용
- 기존 인라인 스타일 → 새 컴포넌트 위임

### Step 2: MapMarker 사용처 확인

Run: `grep -rn "MapMarker" src/` → MockMapView.tsx, RoomPage.tsx 등에서 Props 호환 확인

### Step 3: 빌드 확인

Run: `npm run build`

### Step 4: 커밋

```bash
git add src/components/Map/MapMarker.tsx
git commit -m "refactor : MapMarker를 MapPin/PulseMarker 활용으로 리팩터 (memo 적용)"
```

---

## Task 13: MockMapView 리디자인

**Files:**
- Modify: `src/components/Map/MockMapView.tsx`

### Step 1: 격자 배경 → 지도 느낌 배경으로 변경

```typescript
// 배경 스타일 변경: 격자 → 지형도 느낌
"relative w-full h-full bg-gradient-to-br from-surface via-white to-primary-100/30 overflow-hidden cursor-crosshair"

// 격자 오버레이 (등고선 느낌):
<div className="absolute inset-0 bg-[radial-gradient(circle,_var(--color-black-300)_0.5px,_transparent_0.5px)] bg-[size:32px_32px] opacity-30" />
```

빈 상태 텍스트도 개선:
```typescript
<div className="flex flex-col items-center gap-3 text-black-400">
  <MapPinIcon className="size-12 text-black-300" />
  <p className="text-sm font-pretendard-md">지도를 탭해서 위치를 찍어주세요</p>
</div>
```

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/Map/MockMapView.tsx
git commit -m "style : MockMapView 지형도 느낌 배경으로 리디자인"
```

---

## Task 14: HomePage 리디자인

**Files:**
- Modify: `src/pages/HomePage.tsx`

### Step 1: 프로그레스 도트 → ProgressRoute 교체

`HomePage.tsx`에서 상단 프로그레스 인디케이터를 ProgressRoute 컴포넌트로 교체:

```typescript
import ProgressRoute from "@/components/common/ProgressRoute"

// 기존 도트 프로그레스 대신:
const stepLabels = type === 'time'
  ? ['기능', '이름', '비밀번호', '날짜']
  : ['기능', '이름', '비밀번호']

<ProgressRoute
  steps={stepLabels}
  currentStep={currentStepIndex}
  className="mb-6"
/>
```

### Step 2: 스텝 전환 애니메이션 개선

기존 `animate-in fade-in slide-in-from-right/left` 유지하되 duration 조정:

```typescript
// 각 스텝 wrapper에:
className={cn(
  "animate-in fade-in duration-300",
  direction === 'forward' ? "slide-in-from-right-8" : "slide-in-from-left-8"
)}
```

### Step 3: 배경색 및 전체 레이아웃 조정

```typescript
// 페이지 최상단 컨테이너:
"min-h-dvh bg-background flex flex-col"

// 콘텐츠 영역:
"flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full px-5"
```

### Step 4: 빌드 확인

Run: `npm run build`

### Step 5: 커밋

```bash
git add src/pages/HomePage.tsx
git commit -m "style : HomePage ProgressRoute 적용 및 전환 애니메이션 개선"
```

---

## Task 15: RoomPage 반응형 레이아웃

**Files:**
- Modify: `src/pages/RoomPage.tsx`

### Step 1: 반응형 레이아웃 구조 변경

```typescript
// 모바일: 현재와 유사 (풀스크린 1컬럼)
// 태블릿+: 지도(좌) + 패널(우) 사이드바
<div className="flex h-dvh bg-background">
  {/* 지도 영역 */}
  <div className="flex-1 relative">
    <MockMapView ... />
    <MapActionBar ... />
  </div>

  {/* 패널 영역 — 모바일에서는 BottomSheet, 태블릿+에서는 사이드바 */}
  <div className="hidden sm:flex sm:w-[360px] sm:flex-col sm:border-l sm:border-black-300/50 sm:bg-white">
    <RoomHeader ... />
    <ParticipantList ... />
  </div>

  {/* 모바일 전용 ResultPanel (Drawer) */}
  <div className="sm:hidden">
    <ResultPanel ... />
  </div>
</div>
```

### Step 2: RoomHeader 상단 바 스타일 조정

```typescript
// 모바일: 지도 위 오버레이
// 태블릿+: 사이드 패널 상단
<div className="absolute top-0 left-0 right-0 z-10 sm:relative sm:border-b sm:border-black-300/50">
  <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm sm:bg-white sm:backdrop-blur-none">
    ...
  </div>
</div>
```

### Step 3: 빌드 확인

Run: `npm run build`

### Step 4: 커밋

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat : RoomPage 반응형 레이아웃 (모바일 1컬럼 → 태블릿 사이드바)"
```

---

## Task 16: ParticipantList & ResultPanel 리디자인

**Files:**
- Modify: `src/components/Panel/ParticipantList.tsx`
- Modify: `src/components/Panel/ResultPanel.tsx`

### Step 1: ParticipantList 아이템 스타일 개선

```typescript
// 각 참여자 행:
<div className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface">
  <div className={cn(
    "flex size-8 items-center justify-center rounded-full text-white text-xs font-pretendard-sb",
    isMe ? "bg-sub" : "bg-primary"
  )}>
    {nickname[0]}
  </div>
  <span className="text-sm font-pretendard-md text-black-800">{nickname}</span>
  {isMe && <Badge variant="sub" className="ml-auto text-[10px]">나</Badge>}
</div>
```

### Step 2: ResultPanel 중심점 강조 변경

중심점 색상을 error → center(보라)로 변경:

```typescript
// 중심점 정보 영역:
"bg-center-100 rounded-xl p-4 flex items-center gap-3"

// 중심점 아이콘:
<PulseMarker color="center" size="sm" />
<span className="text-sm font-pretendard-sb text-center-600">중간지점</span>
```

### Step 3: 빌드 확인

Run: `npm run build`

### Step 4: 커밋

```bash
git add src/components/Panel/ParticipantList.tsx src/components/Panel/ResultPanel.tsx
git commit -m "style : ParticipantList/ResultPanel 리디자인 (핀 스타일 아이템, center 보라색)"
```

---

## Task 17: EntryModal 리디자인

**Files:**
- Modify: `src/components/Panel/EntryModal.tsx`

### Step 1: EntryModal 스타일 업데이트

```typescript
// 모달 내부 각 스텝의 아이콘 스타일:
<div className="flex flex-col items-center gap-4 py-4">
  <div className="flex size-16 items-center justify-center rounded-full bg-primary-100">
    <StepIcon className="size-8 text-primary" />
  </div>
  <h2 className="text-lg font-pretendard-sb text-black">{stepTitle}</h2>
  <p className="text-sm text-black-600">{stepDescription}</p>
</div>
```

### Step 2: 입력 피드백 개선

에러 시 shake 애니메이션:
```css
/* globals.css에 추가 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
@utility animate-shake { animation: shake 0.3s ease-in-out; }
```

### Step 3: 빌드 확인

Run: `npm run build`

### Step 4: 커밋

```bash
git add src/components/Panel/EntryModal.tsx src/styles/globals.css
git commit -m "style : EntryModal 리디자인 (아이콘 강조, shake 에러 애니메이션)"
```

---

## Task 18: MapActionBar 리디자인

**Files:**
- Modify: `src/components/Map/MapActionBar.tsx`

### Step 1: 플로팅 버튼 바 스타일

```typescript
// 하단 플로팅 바:
<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
  <Button variant="default" size="lg" className="rounded-full shadow-lg">
    <MapPinIcon className="size-5" />
    {hasMyMarker ? "위치 변경" : "위치 찍기"}
  </Button>
  {showShare && (
    <Button variant="icon-circle" size="icon-lg">
      <Link2 className="size-5" />
    </Button>
  )}
</div>
```

핵심 변경:
- 기존 직사각형 바 → 플로팅 원형 버튼 그룹
- `icon-circle` variant 활용
- `shadow-lg` + 하단 중앙 배치

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/Map/MapActionBar.tsx
git commit -m "style : MapActionBar 플로팅 버튼 스타일 리디자인"
```

---

## Task 19: PWAInstallBanner 리디자인

**Files:**
- Modify: `src/components/common/PWAInstallBanner.tsx`

### Step 1: 배너 스타일 개선

```typescript
<div className={cn(
  "flex items-center gap-3 rounded-2xl bg-white border border-black-300/50 p-4 shadow-lg animate-slide-up",
  className
)}>
  <div className="flex size-10 items-center justify-center rounded-full bg-primary-100">
    <Download className="size-5 text-primary" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-pretendard-sb text-black">홈 화면에 추가</p>
    <p className="text-xs text-black-600">더 빠르게 모아장소를 이용해요</p>
  </div>
  <div className="flex gap-2">
    <Button variant="ghost" size="sm" onClick={onDismiss}>괜찮아요</Button>
    <Button variant="default" size="sm" onClick={onInstall}>추가하기</Button>
  </div>
</div>
```

### Step 2: 빌드 확인

Run: `npm run build`

### Step 3: 커밋

```bash
git add src/components/common/PWAInstallBanner.tsx
git commit -m "style : PWAInstallBanner 리디자인 (rounded-2xl, 아이콘 원형)"
```

---

## Task 20: FeatureSelector 리디자인

**Files:**
- Modify: `src/components/Home/FeatureSelector.tsx`

### Step 1: 카드 스타일 개선

```typescript
// 선택된 상태:
"border-primary bg-primary-100/50 shadow-md"

// 미선택 상태:
"border-black-300/50 bg-white hover:border-black-400 hover:shadow-sm"

// 공통:
"flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer"
```

### Step 2: 빌드 확인 + 커밋

```bash
git add src/components/Home/FeatureSelector.tsx
git commit -m "style : FeatureSelector 카드 리디자인 (rounded-2xl, 선택 상태 강화)"
```

---

## Task 21: WidgetShowcase 업데이트

**Files:**
- Modify: `src/pages/WidgetShowcase.tsx`

### Step 1: 새 컴포넌트 + 변경된 스타일 반영

WidgetShowcase에 다음 섹션 추가:
- MapPin (3가지 타입)
- PulseMarker (3가지 색상 × 3가지 크기)
- ProgressRoute (4스텝 예제)
- Badge의 새 variant (center, sub)
- Button의 icon-circle variant
- 새 컬러 팔레트 (center 보라, sub 앰버, surface)
- 새 애니메이션 (pin-drop, pulse-ring)

### Step 2: 빌드 확인 + 커밋

```bash
git add src/pages/WidgetShowcase.tsx
git commit -m "docs : WidgetShowcase에 신규 컴포넌트/스타일 추가"
```

---

## Task 22: 로딩/에러/빈 상태 UI 통합

**Files:**
- Create: `src/components/common/EmptyState.tsx`
- Create: `src/components/common/ErrorState.tsx`

### Step 1: EmptyState 컴포넌트

```typescript
import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12 text-center", className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-surface">
        {icon || <MapPin className="size-8 text-black-400" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-pretendard-sb text-black-800">{title}</p>
        {description && <p className="text-xs text-black-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default EmptyState
```

### Step 2: ErrorState 컴포넌트

```typescript
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

const ErrorState = ({ message = "문제가 생겼어요", onRetry, className }: ErrorStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12 text-center", className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-error/10">
        <AlertTriangle className="size-8 text-error" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-pretendard-sb text-black-800">{message}</p>
        <p className="text-xs text-black-400">잠시 후 다시 시도해볼게요</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  )
}

export default ErrorState
```

### Step 3: 빌드 확인 + 커밋

```bash
git add src/components/common/EmptyState.tsx src/components/common/ErrorState.tsx
git commit -m "feat : EmptyState/ErrorState 공통 상태 컴포넌트 추가"
```

---

## Task 23: 최종 빌드 검증 및 린트

### Step 1: 전체 빌드

Run: `npm run build`
Expected: 타입 에러 없이 빌드 성공

### Step 2: ESLint

Run: `npm run lint`
Expected: 에러 없이 통과

### Step 3: 개발 서버 시각 확인

Run: `npm run dev`
- `/` (HomePage) — ProgressRoute, 새 컬러, 전환 애니메이션
- `/room/:id` (RoomPage) — 반응형 레이아웃, MapPin, PulseMarker
- `/showcase` (WidgetShowcase) — 모든 컴포넌트 렌더링 확인

### Step 4: 최종 커밋

```bash
git commit -m "chore : 지도 메타포 디자인 시스템 리디자인 완료"
```

---

## 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] HomePage: ProgressRoute 정상 렌더링
- [ ] RoomPage: 모바일 1컬럼 / 태블릿 사이드바 전환
- [ ] MapPin: mine/others/center 3타입 정상
- [ ] PulseMarker: 펄스 애니메이션 동작
- [ ] Button: 그라데이션 + icon-circle variant 정상
- [ ] Toast: 상단 핀 드롭 애니메이션
- [ ] Dialog/Drawer: blur 오버레이, rounded-2xl
- [ ] 컬러: Sub(앰버), Center(보라), Surface(쿨그레이)
- [ ] PWA: safe-area, dvh 정상 동작
- [ ] WidgetShowcase: 모든 신규 컴포넌트 표시
