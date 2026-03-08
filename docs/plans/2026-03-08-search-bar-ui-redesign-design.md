# PlaceSearchBar UI 리디자인 설계문서

## 목표

RoomHeader와 PlaceSearchBar가 시각적으로 중복되는 문제를 해결한다.
검색바를 헤더 카드 안에 통합하여 하나의 플로팅 카드로 만든다.

## 배경

현재 지도 위에 2개의 흰색 카드가 수직으로 쌓여 있다:
1. RoomHeader 카드 (`bg-white/90 rounded-2xl shadow-md`)
2. PlaceSearchBar (`bg-white/95 rounded-xl shadow-md`)

두 요소가 동일한 색상/그림자/라운딩을 사용해 시각적 계층이 없고, 세로 공간을 과도하게 차지한다.
Google Maps, Naver Map, Kakao Map 모두 **상단에 하나의 통합 요소**를 사용하는 패턴이 업계 표준이다.

## 선택한 접근법: 헤더에 검색바 통합

### 변경 전 구조
```
[Header Card]     ← bg-white/90, rounded-2xl, shadow-md, mx-3 mt-3
  RoomHeader
[Search Card]     ← bg-white/95, rounded-xl, shadow-md, mt-2
  PlaceSearchBar
```

### 변경 후 구조
```
[Unified Card]    ← bg-white/90, rounded-2xl, shadow-md, mx-3 mt-3
  RoomHeader
  PlaceSearchBar  ← bg-black-100, rounded-lg, border-0, shadow-none (인셋 스타일)
```

## 변경 파일

### 1. RoomPage.tsx (레이아웃 통합)

**Before:**
```tsx
<div className="absolute top-0 left-0 right-0 z-10">
  <div className="py-3 px-5 bg-white/90 backdrop-blur-sm rounded-2xl mx-3 mt-3 shadow-md">
    <RoomHeader ... />
  </div>
  <div className="flex justify-center mt-2 px-3">
    <PlaceSearchBar onPlaceSelect={handlePlaceSelect} />
  </div>
</div>
```

**After:**
```tsx
<div className="absolute top-0 left-0 right-0 z-10">
  <div className="flex flex-col gap-2 py-3 px-5 bg-white/90 backdrop-blur-sm rounded-2xl mx-3 mt-3 shadow-md">
    <RoomHeader ... />
    <PlaceSearchBar onPlaceSelect={handlePlaceSelect} />
  </div>
</div>
```

- 별도 래퍼 div 제거
- 헤더 카드에 `flex flex-col gap-2` 추가
- PlaceSearchBar를 카드 안으로 이동

### 2. PlaceSearchBar.tsx (인셋 스타일 적용)

Input className 변경:
```
Before: pl-9 pr-9 bg-white/95 backdrop-blur-sm shadow-md rounded-xl border-black-300/50
After:  pl-9 pr-9 bg-black-100 shadow-none rounded-lg border-0
```

- `bg-white/95` -> `bg-black-100`: 카드 내 인셋 느낌 (회색 배경)
- `shadow-md` -> `shadow-none`: 카드 내부이므로 그림자 제거
- `rounded-xl` -> `rounded-lg`: 약간 작은 라운딩으로 계층 표현
- `border-black-300/50` -> `border-0`: 테두리 제거

검색 결과 드롭다운(`ul`)은 기존 `bg-white rounded-xl shadow-lg` 유지 (오버레이는 elevated 스타일 적절).

### 3. PlaceSearchBar.tsx (max-w 제거)

루트 div의 `max-w-sm` 제거 -> 카드 내부에서 full-width로 확장.

## 시각적 계층

| 요소 | 배경 | 라운딩 | 그림자 |
|------|------|--------|--------|
| 통합 카드 | bg-white/90 | rounded-2xl | shadow-md |
| 검색 인풋 | bg-black-100 | rounded-lg | none |
| 검색 결과 | bg-white | rounded-xl | shadow-lg |

## 비변경 사항

- RoomHeader 컴포넌트 내부: 변경 없음
- PlaceSearchBar 로직 (검색, 디바운스, 선택): 변경 없음
- 검색 결과 드롭다운 스타일: 변경 없음
