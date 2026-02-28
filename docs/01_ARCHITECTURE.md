# 01. 시스템 아키텍처

> MoaPlace 클라이언트의 전체 시스템 구조와 기술 선정 근거

---

## 1. 시스템 개요

여러 사람의 위치를 모아 최적의 중간지점을 찾아주는 PWA 서비스.
로그인 없이 URL 공유만으로 즉시 사용 가능한 경량 위치 기반 앱이다.

```
┌─────────────────────────────────────────────────┐
│                   Client (PWA)                   │
│  React + Vite + TypeScript + Tailwind + Three.js │
│                                                   │
│  Vercel 배포                                      │
└──────────────────────┬──────────────────────────┘
                       │ REST API (Axios)
                       │ Polling 3초 간격
                       ▼
┌─────────────────────────────────────────────────┐
│                Server (Spring Boot 3.x)          │
│  Java 17+ / RESTful API / Swagger                │
│                                                   │
│  AWS EC2 / Railway 배포                           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                Redis (Docker)                     │
│  TTL 24시간 임시 저장 / Hash 구조                 │
└─────────────────────────────────────────────────┘
```

## 2. 프론트엔드 기술스택

| 구분 | 기술 | 선정 이유 |
|------|------|-----------|
| 빌드 도구 | **Vite** | 빠른 HMR, PWA 플러그인 생태계 |
| 프레임워크 | **React 18** | 컴포넌트 기반 UI, Three.js 통합 용이 |
| 라우팅 | **React Router v6** | SPA 라우팅, 동적 경로 (`/room/:id`) |
| 언어 | **TypeScript** | strict 모드, 타입 안정성 |
| 스타일링 | **Tailwind CSS** | 빠른 UI 개발, 리스폰시브 |
| 상태 관리 | **Zustand** | 경량, 보일러플레이트 최소화 |
| 지도 | **@vis.gl/react-google-maps** | Google Maps 공식 React 라이브러리 |
| 3D | **Three.js + @react-three/fiber + @react-three/drei** | 3D 시각화, React 생태계 통합 |
| PWA | **vite-plugin-pwa** | Vite 네이티브 통합, Workbox 자동 설정 |
| HTTP | **Axios** | API 통신 및 Polling 구현 |
| UI 컴포넌트 | **shadcn/ui 패턴** | Radix 기반, 커스터마이징 용이 |

## 3. 데이터 플로우

```
[방 생성] → POST /api/rooms → UUID 발급
    │
    ▼
[URL 공유] → https://moaplace.com/room/{uuid}
    │
    ▼
[참여자 접속] → GET /api/rooms/{roomId} → 기존 마커 표시
    │
    ▼
[위치 등록] → POST /api/rooms/{roomId}/markers → 마커 저장
    │
    ▼
[실시간 동기화] → GET /api/rooms/{roomId} (3초 Polling)
    │
    ▼
[결과 계산] → GET /api/rooms/{roomId}/result
    │           → 중심점(산술 평균) + 최단거리(TSP)
    ▼
[결과 표시] → 지도 위 중심점 마커 + 경로 폴리라인
```

## 4. API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/rooms` | 방 생성 (UUID 발급) |
| `GET` | `/api/rooms/{roomId}` | 방 정보 조회 (마커 목록 포함) |
| `POST` | `/api/rooms/{roomId}/markers` | 마커 등록 |
| `DELETE` | `/api/rooms/{roomId}/markers/{markerId}` | 마커 삭제 |
| `GET` | `/api/rooms/{roomId}/result` | 중심점 + 최단거리 결과 |

## 5. 핵심 알고리즘 (서버 책임)

> **주의:** 아래 알고리즘은 **백엔드(Spring Boot `CalculationService`)가 수행**한다.
> 프론트엔드는 `GET /api/rooms/{roomId}/result` 응답을 표시만 한다.
> centroid/TSP/haversine을 프론트에 구현하지 않는다.

### 5.1 중심점 계산 (Geometric Centroid)

모든 마커의 좌표 산술 평균:

```
centroid_lat = (lat1 + lat2 + ... + latN) / N
centroid_lng = (lng1 + lng2 + ... + lngN) / N
```

### 5.2 최단거리 경로 (TSP)

- **10명 이하:** Brute-force 순열 탐색 (10! = 3,628,800)
- **10명 초과:** Nearest Neighbor 휴리스틱

### 5.3 거리 계산 (Haversine)

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c    (R = 6,371km)
```

## 5.5 API 클라이언트 구조 (클린 아키텍처)

의존성 역전 원칙(DIP) 적용. 스토어는 인터페이스에만 의존하고, 구현체는 팩토리에서 주입.

```
src/lib/
├── api.interface.ts   # Port — ApiClient 인터페이스 (계약)
├── api.mock.ts        # Adapter — localStorage 목업 구현체
├── api.ts             # Factory — 현재 구현체 선택 및 export
└── api.http.ts        # Adapter — axios 실서버 구현체 (나중에)
```

교체 시 `api.ts`에서 import 한 줄만 변경:

```typescript
// Before (목업)
import mockApi from './api.mock';
const api: ApiClient = mockApi;

// After (실서버)
import httpApi from './api.http';
const api: ApiClient = httpApi;
```

## 6. 상태 관리 전략

Zustand 2개 스토어로 관심사 분리:

| 스토어 | 파일 | 책임 |
|--------|------|------|
| **roomStore** | `src/store/roomStore.ts` | 방 정보, 마커 목록, 중심점, 경로 |
| **uiStore** | `src/store/uiStore.ts` | 모달, 토스트, 3D 토글, 로딩 상태 |

## 7. PWA 전략

- **Service Worker:** Workbox 기반, 정적 자산 프리캐시, API는 Network First
- **Manifest:** standalone 모드, 아이콘 192/512, 테마 컬러
- **설치 프롬프트:** `beforeinstallprompt` 이벤트 커스텀 배너
- **오프라인:** 안내 페이지 표시 (지도 기능은 온라인 필수)
