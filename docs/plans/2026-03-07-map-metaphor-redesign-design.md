# 지도 메타포 디자인 시스템 리디자인

**작성일:** 2026-03-07
**목적:** 모아장소 UI/UX 전면 리디자인 — 지도/공간 중심 독창적 디자인 시스템 구축
**범위:** 컴포넌트 라이브러리 재정의 → 페이지 적용 → 반응형 확장

---

## 1. 배경

### 문제
- 기존 디자인이 모임타임/모아타임 등 유사 서비스와 차별점 부족
- 모바일만 최적화, 태블릿/데스크톱 미대응
- 로딩/에러 상태, 전환 애니메이션 등 UX 플로우 미흡
- 스켈레톤 UI, 온보딩 등 사용자 경험 보강 필요

### 목표
1. **독창성**: 지도/공간 메타포를 UI 전체에 녹여 모아장소만의 정체성 확보
2. **반응형**: 모바일 → 태블릿 → 데스크톱 3단계 대응
3. **UX 완성도**: 로딩, 에러, 전환, 피드백 등 모든 상태 커버

---

## 2. 컬러 시스템 재정의: "지형도 팔레트"

| 역할 | 현재 | 변경 | 근거 |
|------|------|------|------|
| Primary | #3B82F6 | #2563EB → #1E40AF 그라데이션 | 바다/강 — 목적지의 색 |
| Sub/Accent | #C2410C | #F59E0B (앰버/핀 골드) | 지도 핀의 전통적 색상 |
| Background | #FFFFFF | #F8FAFC (쿨그레이) | 지도 배경 톤 |
| Surface (신규) | — | #F1F5F9 | 등고선 사이 평지, 카드 배경 |
| Success | #16A34A | #059669 (에메랄드) | 녹지대 = 완료 |
| Error | #DC2626 | #DC2626 유지 | 보편적 경고 |
| 중심점 | #DC2626 | #7C3AED (보라) + 펄스 | 차별화된 "중간지점" 강조 |

### 그라데이션 토큰
```
gradient-ocean:   from-primary to-primary-700   (CTA 버튼, 헤더)
gradient-terrain: from-surface to-background    (카드 배경)
gradient-pin:     from-sub to-amber-400         (마커 하이라이트)
```

---

## 3. 컴포넌트 라이브러리 재정의

### 기존 컴포넌트 변경

**Button**
- Primary: `gradient-ocean` 배경 + 미세 그림자 + hover 물결(ripple) 효과
- Sub: 핀 골드(#F59E0B) 배경, "내 위치" 관련 액션용
- Ghost: 점선 언더라인 (경로선 스타일)
- 신규 variant `icon-circle`: 지도 컨트롤 스타일 원형 버튼

**Card**
- 등고선 느낌 미세 보더 그라데이션 (border-image)
- hover: elevation 효과 (shadow + translateY -2px)
- 모서리: rounded-lg → rounded-2xl 확대

**Input**
- 포커스: 보더 점선 → 실선 전환 애니메이션 (경로선 메타포)
- 검색: 돋보기 → 핀 아이콘 변형 마이크로 애니메이션

**Toast**
- 위치: 하단 → 상단, 핀 드롭 애니메이션으로 등장
- 아이콘: 지도 핀 + 상태별 색상

**Modal/BottomSheet**
- 배경: blur + 지도 격자 패턴 오버레이
- BottomSheet 핸들바: 등고선 모양 스타일링

**Badge**
- 원형 마커 스타일 (지도 핀 상단 원형)
- 참여자 수: 핀 위 숫자 부유 형태

### 신규 컴포넌트

**MapPin** — 재사용 가능한 핀 컴포넌트
- Props: avatar, name, color, type(mine/others/center)
- 드롭 애니메이션 내장

**ProgressRoute** — 경로선 형태 진행률 표시
- 스텝 위자드용, SVG 기반 경로선 + 체크포인트 노드
- 완료 스텝: 실선 + 채워진 원, 미완료: 점선 + 빈 원

**PulseMarker** — 펄스 원형 마커
- 중심점 표시, 로딩 상태 표현
- 동심원 펄스 애니메이션 (CSS keyframes)

---

## 4. 반응형 레이아웃

| 화면 | 사이즈 | 레이아웃 |
|------|--------|---------|
| 모바일 | ~639px | 풀스크린 1컬럼, 현재와 유사 |
| 태블릿 | 640~1023px | 지도(좌 60%) + 패널(우 40%) 사이드바 |
| 데스크톱 | 1024px+ | 지도(좌 70%) + 패널(우 30%) + 상단 네비 |

### 핵심 변경점
- 태블릿/데스크톱에서 BottomSheet → 사이드 패널 자동 전환
- 모든 화면에서 100dvh + safe-area 유지
- 지도 영역 최대화 (지도가 항상 주인공)

---

## 5. UX 플로우 개선

### HomePage 스텝 위자드
- ProgressRoute 컴포넌트로 경로선 형태 진행률 표시
- 스텝 전환: 좌우 slide 애니메이션 (뒤로=왼, 다음=오른)
- 입력 완료 시 즉각 피드백 (체크 아이콘 + 녹색 플래시)

### RoomPage
- 입장: 지도 줌인 펼침 애니메이션
- 마커 등록: 탭 → 핀 드롭 → 확인 시트
- 결과: 중심점 PulseMarker + 참여자 핀 연결선 효과

### 로딩/에러 상태
- 스켈레톤: 등고선 패턴 스켈레톤 UI
- 에러: 공감형 해요체 ("연결이 불안정해요. 잠시 후 다시 시도해볼게요")
- 빈 상태: "아직 아무도 위치를 등록하지 않았어요" + 핀 일러스트

### PWA
- 오프라인: 마지막 방 정보 캐싱 표시
- 설치 배너: 첫 방문 시만 슬라이드 업, 이후 비노출

---

## 6. 기술 적용 (Agent Skills 활용)

### 작업 단계별 스킬 매핑

| 단계 | 스킬 | 적용 내용 |
|------|------|----------|
| 디자인 방향 | `frontend-design` | 컴포넌트 미학, 애니메이션 전략 |
| 구현 | `vercel-react-best-practices` | memo, useTransition, content-visibility, 조건부 렌더링 |
| 리뷰 | `web-design-guidelines` | 접근성 감사, 웹 표준 준수 |

### 주요 성능 규칙 적용
- `rendering-content-visibility`: ParticipantList 긴 목록 최적화
- `rerender-memo`: MapMarker, ParticipantItem memo화
- `rendering-hoist-jsx`: 정적 JSX 호이스팅
- `rerender-transitions`: startTransition으로 스텝 전환

---

## 7. 작업 순서

1. **컬러 시스템 재정의** — colors.ts, globals.css 업데이트
2. **공통 컴포넌트 리디자인** — Button, Card, Input, Toast, Modal, Badge
3. **신규 컴포넌트 생성** — MapPin, ProgressRoute, PulseMarker
4. **HomePage 리디자인** — ProgressRoute 적용, 전환 애니메이션
5. **RoomPage 리디자인** — 반응형 레이아웃, 마커 애니메이션
6. **로딩/에러/빈 상태** — 스켈레톤, 에러 메시지, 빈 상태 UI
7. **PWA 최적화** — 오프라인 캐싱, 설치 배너 개선
8. **접근성 감사** — web-design-guidelines 기반 최종 리뷰

---

## 8. 검증 방법

- `npm run build` — 타입 에러 없이 빌드 성공
- `npm run lint` — ESLint 통과
- `npm run dev` — 모바일/태블릿/데스크톱 뷰포트에서 시각 확인
- WidgetShowcase 페이지에서 모든 컴포넌트 렌더링 확인
- Lighthouse PWA 감사 점수 확인
