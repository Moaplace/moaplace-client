import type { LatLng, Marker, RouteResult } from '@/types';

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** 두 좌표 간 Haversine 직선거리 (km) */
export const haversine = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/** 좌표 배열의 무게중심 (산술 평균) */
export const centroid = (points: LatLng[]): LatLng => {
  if (points.length === 0) return { lat: 0, lng: 0 };
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
};

/** TSP 최단경로 — Nearest Neighbor 휴리스틱 */
export const solveTSP = (markers: Marker[]): RouteResult => {
  if (markers.length <= 1) {
    return { path: [...markers], totalDistance: 0 };
  }

  const visited = new Set<string>();
  const path: Marker[] = [];
  let current = markers[0];
  visited.add(current.id);
  path.push(current);
  let totalDistance = 0;

  while (visited.size < markers.length) {
    let nearest: Marker | null = null;
    let nearestDist = Infinity;

    for (const m of markers) {
      if (visited.has(m.id)) continue;
      const d = haversine(current, m);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = m;
      }
    }

    if (nearest) {
      visited.add(nearest.id);
      path.push(nearest);
      totalDistance += nearestDist;
      current = nearest;
    }
  }

  return { path, totalDistance };
};
