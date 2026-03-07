# HomePage 뒤로가기 버튼 분리 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 뒤로가기 버튼을 ProgressRoute 인디케이터와 분리하여 UX 개선

**Architecture:** 현재 뒤로 버튼이 `absolute left-0`으로 ProgressRoute와 같은 컨테이너에 겹쳐져 있어 터치 타겟 충돌 및 시각적 혼잡 발생. 뒤로 버튼을 별도 행으로 분리하고, ProgressRoute 위에 배치.

**Tech Stack:** React · TypeScript · Tailwind CSS

---

### Task 1: 뒤로가기 버튼을 ProgressRoute 상단 별도 행으로 분리

**Files:**
- Modify: `src/pages/HomePage.tsx:118-135`

**현재 구조 (문제):**
```
┌─────────────────────────────┐
│ [← 뒤로]  ①──②──③          │  ← 같은 행, absolute로 겹침
└─────────────────────────────┘
```

**변경 후 구조:**
```
┌─────────────────────────────┐
│ [← 뒤로]                    │  ← 별도 행 (좌측 정렬)
├─────────────────────────────┤
│       ①──②──③               │  ← ProgressRoute (중앙)
└─────────────────────────────┘
```

**Step 1: 상단 네비게이션 레이아웃 변경**

현재 코드 (`HomePage.tsx` ~118-135):
```tsx
{/* 상단 네비게이션: 뒤로가기 + ProgressRoute */}
<div className="relative flex items-center w-full max-w-sm mb-8">
  {currentIndex > 0 && (
    <button
      type="button"
      onClick={handleBack}
      className="absolute left-0 z-10 flex items-center gap-1 text-sm text-black-400 hover:text-black-600 transition-colors py-1"
    >
      <ChevronLeft className="w-4 h-4" />
      뒤로
    </button>
  )}
  <ProgressRoute
    steps={stepLabels}
    currentStep={currentIndex}
    className="flex-1"
  />
</div>
```

변경할 코드:
```tsx
{/* 상단 네비게이션 */}
<div className="flex flex-col w-full max-w-sm mb-8 gap-4">
  {/* 뒤로가기 버튼 (별도 행) */}
  <div className="h-8 flex items-center">
    {currentIndex > 0 && (
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-black-400 hover:text-black-600 transition-colors py-1"
      >
        <ChevronLeft className="w-4 h-4" />
        뒤로
      </button>
    )}
  </div>

  {/* ProgressRoute (별도 행) */}
  <ProgressRoute
    steps={stepLabels}
    currentStep={currentIndex}
  />
</div>
```

핵심 변경:
- `relative` 컨테이너 → `flex flex-col gap-4`로 변경 (수직 배치)
- 뒤로 버튼에서 `absolute left-0 z-10` 제거 (겹침 해소)
- 뒤로 버튼 wrapper에 `h-8` 고정 높이 (버튼 없을 때도 레이아웃 안정)
- ProgressRoute에서 `className="flex-1"` 제거 (불필요)

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공 (에러 없음)

**Step 3: 시각적 확인**

Dev 서버에서 확인할 사항:
- 첫 번째 스텝(feature): 뒤로 버튼 없음, ProgressRoute만 표시
- 두 번째 스텝 이후: 뒤로 버튼이 ProgressRoute 위 별도 행에 표시
- 뒤로 버튼과 ProgressRoute 사이 적절한 간격 (gap-4 = 16px)
- 터치 타겟 충돌 없음
