# Google API 구성 디자인

> 모아장소에서 필요한 Google Maps Platform API 목록과 용도 정의

| 항목   | 내용               |
| ------ | ------------------ |
| 작성일 | 2026-03-08         |
| 상태   | 승인됨             |
| 범위   | MVP ~ Phase 3 전체 |

---

## 1. 필요 API 목록 (총 4개)

| #   | API                 | 용도                               | 적용 시점                |
| --- | ------------------- | ---------------------------------- | ------------------------ |
| 1   | Maps JavaScript API | 지도 렌더링, 마커, 폴리라인        | MVP                      |
| 2   | Places API          | 장소 검색/자동완성, 주변 시설 추천 | MVP(검색) + Phase 1(POI) |
| 3   | Geocoding API       | 좌표 → 주소 변환 (역지오코딩)      | MVP                      |
| 4   | Directions API      | 자동차 실제 경로 거리/폴리라인     | Phase 1                  |

---

## 2. API별 상세 용도

### 2.1 Maps JavaScript API

- `APIProvider` — 앱 전체 래핑
- `Map`, `AdvancedMarker`, `Pin` — 지도 렌더링 및 마커 표시
- `Polyline` — TSP 최단거리 경로 폴리라인 표시
- `@vis.gl/react-google-maps` 패키지가 의존하므로 별도 설치 불필요

### 2.2 Places API

- `useMapsLibrary('places')` — Places 라이브러리 로드
- **MVP:** Autocomplete 장소 검색 (강남역, 서울역 등)
- **Phase 1:** Nearby Search로 중심점 주변 식당/카페/지하철역 POI 추천
- **Phase 1:** Place Details로 POI 상세정보 (영업시간, 평점 등)

### 2.3 Geocoding API

- `useMapsLibrary('geocoding')` — Geocoding 라이브러리 로드
- 마커 좌표를 주소로 변환 (Reverse Geocoding)
- 위치 확정 바텀시트: "서울특별시 강남구 역삼동 123" 표시
- 결과 패널: 중심점 주소 표시 "중심점: 서울시 중구 OO동"

### 2.4 Directions API

- `useMapsLibrary('routes')` — Routes 라이브러리 로드
- 자동차 경로 기준 실제 도로 거리 계산 (Haversine 직선거리 대체)
- 도로 기반 경로 폴리라인 표시
- waypoints로 경유지 지정 가능 (TSP 결과 경로를 도로 기반으로 변환)

---

## 3. 불필요 API (제외 근거)

| API                      | 제외 이유                                                          |
| ------------------------ | ------------------------------------------------------------------ |
| Distance Matrix API      | 자동차 경로만 필요하므로 Directions API로 충분                     |
| Routes API (신규)        | Directions API가 레퍼런스 풍부하고 react-google-maps와 궁합 검증됨 |
| Street View API          | PRD에 스트리트뷰 요구 없음                                         |
| Elevation API            | 3D 지형은 Three.js로 자체 구현 예정 (Phase 2)                      |
| Geolocation API (Google) | 브라우저 내장 navigator.geolocation 사용                           |

---

## 4. 비용 예측

Google Maps Platform 무료 크레딧: $200/월

| API                 | 단가          | 무료 한도 내 호출 수 |
| ------------------- | ------------- | -------------------- |
| Maps JavaScript     | $7/1,000 로드 | ~28,500 로드         |
| Places Autocomplete | $2.83/1,000   | ~70,000 요청         |
| Geocoding           | $5/1,000      | ~40,000 요청         |
| Directions          | $5/1,000      | ~40,000 요청         |

MVP 단계에서는 무료 크레딧으로 충분히 커버 가능.

---

## 5. Google Cloud Console 설정 체크리스트

1. Google Cloud 프로젝트 생성 (또는 기존 프로젝트 사용)
2. 결제 계정 연결 ($200 무료 크레딧 활성화)
3. 아래 4개 API 활성화:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
4. API 키 생성
5. API 키 제한 설정:
   - HTTP 리퍼러 제한 (도메인 화이트리스트)
   - API 제한 (위 4개 API만 허용)
6. `.env`에 `GOOGLE_MAPS_API_KEY` 설정

---

## 6. 적용 타임라인

| 단계    | API                              | 구현 내용                      |
| ------- | -------------------------------- | ------------------------------ |
| MVP     | Maps JavaScript API              | 지도 렌더링, 마커, 폴리라인    |
| MVP     | Places API (Autocomplete)        | 장소 검색/자동완성             |
| MVP     | Geocoding API                    | 역지오코딩 (좌표 → 주소)       |
| Phase 1 | Directions API                   | 자동차 실제 경로 거리/폴리라인 |
| Phase 1 | Places API (New) (Nearby Search) | 중심점 주변 시설 추천          |
