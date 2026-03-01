/** 방 유형 — 장소 모으기 또는 시간 모으기 */
export type RoomType = 'place' | 'time';

/** 입장 단계 상태 머신 */
export type EntryStep = 'idle' | 'room_password' | 'nickname' | 'participant_password' | 'done';

/** EntryModal에서 사용하는 입장 단계 (활성 단계만) */
export type ActiveEntryStep = Exclude<EntryStep, 'idle' | 'done'>;

/** 방 (Room) — UUID 기반 모임 단위 */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  markers: Marker[];
  dates?: string[];
  password?: string;
  createdAt: string;
}

/** 마커 (Marker) — 참여자의 위치 */
export interface Marker {
  id: string;
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
  password: string;
  createdAt: string;
}

/** 마커 생성 요청 */
export interface MarkerRequest {
  nickname: string;
  lat: number;
  lng: number;
  address?: string;
  password: string;
}

/** 중심점 */
export interface Centroid {
  lat: number;
  lng: number;
  address?: string;
}

/** TSP 경로 결과 */
export interface RouteResult {
  totalDistance: number;
  path: Marker[];
}

/** 방 결과 (중심점 + 경로 + 개별 거리) */
export interface RoomResult {
  centroid: Centroid;
  route: RouteResult;
  distances: MarkerDistance[];
}

/** 마커별 중심점까지 거리 */
export interface MarkerDistance {
  markerId: string;
  nickname: string;
  distance: number;
}
