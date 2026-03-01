# RoomPage UI 레이아웃 설계

> Issue: #5 — RoomPage UI 레이아웃 구현 (목업 지도 + 패널 + 모달)

---

## 1. 전체 구조

App.tsx의 `max-w-2xl px-5` 래퍼 안에서 구현. 세로 3영역 구조.

```
┌─────────────────────────────┐
│  헤더: [모임이름]    👥 3명   │  고정 상단바
├─────────────────────────────┤
│                             │
│    목업 지도 (그리드)         │  flex-1 (나머지 공간 채움)
│    마커 아이콘 배치           │
│    클릭 시 좌표 생성          │
│                             │
├─────────────────────────────┤
│  [📍 위치 찍기]  [🔗 공유]   │  하단 액션 버튼
└─────────────────────────────┘
        ↕ Drawer (결과 패널)
```

---

## 2. 컴포넌트 트리

```
RoomPage.tsx
├── RoomHeader          — 모임 이름 + 참여자 수
├── MockMapView         — 그리드 목업 지도
│   └── MapMarker[]     — 마커 아이콘 (내/타인/중심점 색상 분기)
├── MapActionBar        — 위치 찍기 + 공유 버튼
├── NicknameModal       — Dialog 기반, 진입 시 자동 표시
├── LocationConfirmSheet — Drawer 기반, 위치 확정/취소
└── ResultPanel         — Drawer 기반, 중심점 + 참여자 목록
    └── ParticipantList — 참여자별 거리 목록
```

---

## 3. 파일 구조

```
src/
├── pages/
│   └── RoomPage.tsx
├── components/
│   ├── Map/
│   │   ├── MockMapView.tsx
│   │   ├── MapMarker.tsx
│   │   └── MapActionBar.tsx
│   └── Panel/
│       ├── RoomHeader.tsx
│       ├── NicknameModal.tsx
│       ├── LocationConfirmSheet.tsx
│       ├── ResultPanel.tsx
│       └── ParticipantList.tsx
```

---

## 4. 데이터 플로우

```
진입 → fetchRoom(roomId) → 닉네임 모달(uiStore)
→ 지도 클릭 → LocationConfirmSheet 표시
→ "여기로 확정!" → addMarker(roomStore) → 마커 표시 + 결과 갱신
→ ResultPanel에서 중심점/참여자 확인
→ 공유 버튼 → clipboard 복사
```

### 스토어 의존

- **roomStore** (기존): `fetchRoom`, `addMarker`, `deleteMarker`
- **uiStore** (기존): `isNicknameModalOpen`, `nickname`, `isResultPanelExpanded`
- **uiStore 추가**: `pendingLocation`, `isLocationSheetOpen`

---

## 5. 컴포넌트 상세

### 5.1 RoomHeader

- Props: room name, marker count
- 레이아웃: `flex justify-between items-center h-14`
- 좌측: 모임 이름 (`text-lg font-pretendard-sb text-black`)
- 우측: 참여자 수 Badge (`bg-primary-100 text-primary`)

### 5.2 MockMapView

- `bg-black-100 rounded-xl` 배경 + CSS grid 패턴(점선)
- `relative` 컨테이너, `flex-1` 높이
- 클릭 이벤트: `e.nativeEvent.offsetX/Y` → 0~100% 좌표 변환
- 마커들은 absolute 배치, `left/top` 퍼센트 기반
- 나중에 `@vis.gl/react-google-maps` MapView로 교체

### 5.3 MapMarker

- Props: `type: 'mine' | 'others' | 'center'`, `nickname`, `x`, `y`
- 색상 분기: mine=`bg-sub`, others=`bg-primary`, center=`bg-error`
- 아이콘: 원형 마커 + 닉네임 라벨
- absolute 배치, translate(-50%, -100%) 으로 핀 포인트

### 5.4 MapActionBar

- 2개 버튼: "위치 찍기" (primary), "링크 복사하기" (secondary)
- `flex gap-3 p-4`

### 5.5 NicknameModal

- shadcn `Dialog` 사용
- 진입 시 자동 표시 (닉네임 미설정 시)
- 외부 클릭 닫기 방지: `onPointerDownOutside.preventDefault()`
- Input + 확인 버튼

### 5.6 LocationConfirmSheet

- shadcn `Drawer` 사용
- 클릭 좌표 임시 표시 + "여기로 확정!" / "취소" 버튼
- 확정 시 `addMarker` 호출

### 5.7 ResultPanel + ParticipantList

- shadcn `Drawer` 사용, 스냅 포인트로 축소/확장
- 중심점 정보: 좌표 표시 (`bg-error` 아이콘)
- 참여자 목록: 닉네임 + 거리 리스트
- 마커 2개 이상일 때 활성화

---

## 6. 마커 색상 규칙

| 마커 종류 | Tailwind | AppColors |
|-----------|----------|-----------|
| 내 마커 | `bg-sub` | `sub` #C2410C |
| 타인 마커 | `bg-primary` | `primary` #3B82F6 |
| 중심점 | `bg-error` | `error` #DC2626 |

---

## 7. 주요 결정

- App.tsx `max-w-2xl px-5` 래퍼 안에서 구현 (풀스크린 아님)
- Google Maps API 키 미확보 → 그리드 기반 목업 지도
- 닉네임 모달: 필수 입력, 미입력 시 지도 조작 불가
- 하단 패널: Drawer로 드래그 확장 가능
- 클린 아키텍처: 스토어/훅은 Factory(`api.ts`)만 import
- 컬러: AppColors 상수 + Tailwind 커스텀 토큰만 사용
