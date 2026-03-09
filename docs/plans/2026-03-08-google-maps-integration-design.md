# Google Maps 실제 지도 연동 + 핵심 로직 + 실시간 동기화 통합 설계

> 이슈: #007 | 브랜치: `20260307_#7_Google_Maps_실제_지도_연동_핵심_로직_실시간_동기화_통합`

## 결정 사항

| 항목 | 결정 |
|------|------|
| 접근법 | B안 — 기능별 분리 + 커스텀 훅 |
| MockMapView | 완전 삭제, GoogleMapView로 대체 |
| API 데이터 | 모든 API는 mock JSON으로 동작, 나중에 실제 API 교체 |
| 계산 로직 | `geo.ts`에서 프론트 계산 (centroid, TSP, haversine) |
| Polling | 구현하지 않음, API 연결 시 쉽게 붙을 구조만 준비 |
| 환경변수 | `GOOGLE_MAPS_API_KEY` (Vite proxy 또는 서버사이드 주입) |
| 패키지 | `@vis.gl/react-google-maps` |

---

## 1. 파일 구조

```
src/
├── components/Map/
│   ├── MapView.tsx              # Google Maps 렌더링 (Map 컴포넌트)
│   ├── GoogleMarker.tsx         # AdvancedMarker + Pin (mine/others/center)
│   ├── RoutePolyline.tsx        # TSP 경로 Polyline 표시
│   ├── PlaceSearchBar.tsx       # Places Autocomplete 검색바 (mock JSON)
│   ├── NearbyPlaceList.tsx      # 중심점 주변 POI 목록 (mock JSON)
│   ├── MapPin.tsx               # 기존 유지 — GoogleMarker 내부 재사용
│   ├── PulseMarker.tsx          # 기존 유지 — 중심점 강조
│   ├── MapActionBar.tsx         # 기존 유지
│   └── MockMapView.tsx          # 삭제
│
├── hooks/
│   ├── useGeocoding.ts          # 좌표 → 주소 변환 (mock)
│   ├── useGeolocation.ts        # 브라우저 GPS 위치 감지
│   ├── usePlaceSearch.ts        # Places Autocomplete (mock JSON)
│   ├── useDirections.ts         # Directions API 경로 (mock JSON)
│   ├── usePWA.ts                # beforeinstallprompt + 설치 배너
│   └── useRoom.ts               # 방 데이터 fetch (API 연결 대비 구조)
│
├── lib/
│   ├── api.interface.ts         # 확장: searchPlaces, getNearbyPlaces 등
│   ├── api.mock.ts              # 확장: centroid/TSP 계산, mock POI
│   ├── api.ts                   # 기존 유지 (Factory)
│   ├── api.http.ts              # HTTP 어댑터 껍데기
│   ├── geo.ts                   # Haversine, centroid, TSP 유틸
│   └── clipboard.ts             # navigator.clipboard + textarea 폴백
│
├── mock/
│   ├── places.json              # Places Autocomplete mock 데이터
│   ├── nearby.json              # Nearby Search mock 데이터
│   └── directions.json          # Directions API mock 데이터
│
├── types/
│   └── index.ts                 # 확장: LatLng, PlaceResult, NearbyPlace 등
```

---

## 2. API 계층 확장

### ApiClient 인터페이스 확장

```typescript
export interface ApiClient {
  // 기존
  createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  verifyRoomPassword(roomId: string, password: string): Promise<boolean>;
  verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null>;
  getResult(roomId: string): Promise<RoomResult | null>;

  // 신규
  searchPlaces(query: string): Promise<PlaceResult[]>;
  getNearbyPlaces(lat: number, lng: number, type?: string): Promise<NearbyPlace[]>;
  getDirections(origin: LatLng, destination: LatLng, waypoints?: LatLng[]): Promise<DirectionsResult>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
}
```

### Mock 구현 전략

- `getResult()` — `geo.ts`의 centroid/TSP/haversine으로 프론트 계산
- `searchPlaces()` — `mock/places.json` 필터링
- `getNearbyPlaces()` — `mock/nearby.json` 반환
- `getDirections()` — `mock/directions.json` 반환
- `reverseGeocode()` — mock 주소 문자열 반환

### api.http.ts

모든 메서드에 `throw new Error('HTTP API 미구현')`. Factory에서 환경변수로 mock/http 전환.

---

## 3. 컴포넌트 설계

### MapView.tsx

```tsx
// App.tsx에서 APIProvider 래핑
// MapView는 Map + 자식 컴포넌트 렌더링
<Map defaultCenter={서울시청} defaultZoom={12} mapId="moaplace">
  {markers.map(m => <GoogleMarker key={m.id} marker={m} type={...} />)}
  {centroid && <GoogleMarker type="center" position={centroid} />}
  {route && <RoutePolyline path={route.path} />}
</Map>
```

- `onMapClick` → 클릭 좌표를 상위로 전달 (실좌표 lat/lng)

### GoogleMarker.tsx

```tsx
<AdvancedMarker position={{ lat, lng }}>
  <MapPin type={type} nickname={nickname} />
</AdvancedMarker>
```

- 중심점: `PulseMarker` 사용

### RoutePolyline.tsx

- `useMapsLibrary('maps')` → `google.maps.Polyline` 직접 생성
- 색상: `AppColors.primary`, 점선 스타일

### PlaceSearchBar.tsx

- 지도 상단 오버레이 검색바
- `usePlaceSearch` 훅 → mock JSON 필터링 → 드롭다운
- 선택 시 지도 카메라 이동

### NearbyPlaceList.tsx

- ResultPanel 내부에 표시
- 카테고리 필터 탭 (전체 / 식당 / 카페 / 지하철)

### RoomPage.tsx 변경

- MockMapView → MapView 교체
- `onMapClick` 시그니처: `(x%, y%)` → `(lat, lng)` 실좌표
- LocationConfirmSheet에 역지오코딩 주소 표시

---

## 4. 훅 설계

### useGeocoding — 좌표 → 주소 변환

```typescript
const { reverseGeocode } = useGeocoding();
const address = await reverseGeocode(lat, lng); // mock: "서울특별시 중구 세종대로 110"
```

### useGeolocation — 브라우저 GPS

```typescript
const { position, error, getCurrentPosition } = useGeolocation();
```

- MapActionBar "내 위치" 버튼 연결, GPS 권한 거부 시 토스트 안내

### usePlaceSearch — 장소 검색 (mock)

```typescript
const { results, search, clear } = usePlaceSearch();
```

### useDirections — 경로 (mock)

```typescript
const { getRoute } = useDirections();
```

### usePWA — PWA 설치

```typescript
const { canInstall, install } = usePWA();
```

- `beforeinstallprompt` 이벤트 캐치, `PWAInstallBanner`와 연결

### useRoom — 방 데이터 fetch

```typescript
const useRoom = (roomId: string) => { ... };
```

- roomStore.fetchRoom 래퍼, 나중에 polling/WebSocket 추가 시 여기만 수정

---

## 5. 계산 로직 (geo.ts)

```typescript
haversine(a: LatLng, b: LatLng): number        // km 단위
centroid(points: LatLng[]): LatLng              // 산술 평균
solveTSP(points: Marker[]): RouteResult         // Nearest Neighbor 휴리스틱
```

- 마커 2개 미만 → `getResult()` → `null`

---

## 6. 신규 타입

```typescript
export interface LatLng { lat: number; lng: number; }
export interface PlaceResult { placeId: string; name: string; address: string; lat: number; lng: number; }
export interface NearbyPlace { id: string; name: string; category: string; lat: number; lng: number; distance: number; }
export interface DirectionsResult { distance: number; duration: string; polyline: LatLng[]; }
```

---

## 7. App.tsx 래핑

```tsx
import { APIProvider } from '@vis.gl/react-google-maps';

const App = () => (
  <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
    <RouterProvider router={router} />
    <Toaster />
  </APIProvider>
);
```

- 환경변수: `GOOGLE_MAPS_API_KEY` (Vite proxy 또는 서버사이드 주입)
- `.env.example`에 키 템플릿 추가

---

## 8. 데이터 플로우

```
지도 클릭 → useGeocoding(좌표→주소) → LocationConfirmSheet(주소 표시)
                                        → 확정 → roomStore.addMarker
                                        → getResult() → centroid/route/distances
                                        → GoogleMarker(중심점) + RoutePolyline + ResultPanel
```

---

## 9. Mock 데이터

- `mock/places.json` — 서울 주요 장소 10~15개
- `mock/nearby.json` — 카테고리별 POI 10~15개
- `mock/directions.json` — 샘플 경로 1개

---

## 참고 문서

- Google API 설계: `docs/plans/2026-03-08-google-api-design.md`
- 이슈: `.issue/#20260308_007_기능추가_GoogleMaps_실제지도연동_통합.md`
- 아키텍처: `docs/01_ARCHITECTURE.md`
