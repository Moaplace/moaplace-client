import { describe, it, expect } from 'vitest';
import { haversine, centroid, solveTSP } from '../geo';
import type { Marker } from '@/types';

describe('haversine', () => {
  it('서울시청 ↔ 강남역 직선거리 약 8.9km', () => {
    const d = haversine(
      { lat: 37.5665, lng: 126.9780 },
      { lat: 37.4979, lng: 127.0276 },
    );
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(10);
  });

  it('같은 좌표는 0', () => {
    const d = haversine({ lat: 37.5665, lng: 126.9780 }, { lat: 37.5665, lng: 126.9780 });
    expect(d).toBe(0);
  });
});

describe('centroid', () => {
  it('두 점의 중심', () => {
    const c = centroid([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
    ]);
    expect(c.lat).toBeCloseTo(37.5, 1);
    expect(c.lng).toBeCloseTo(127.5, 1);
  });

  it('빈 배열은 0,0', () => {
    const c = centroid([]);
    expect(c.lat).toBe(0);
    expect(c.lng).toBe(0);
  });
});

describe('solveTSP', () => {
  const mkMarker = (id: string, lat: number, lng: number): Marker => ({
    id,
    nickname: id,
    lat,
    lng,
    password: 'test',
    createdAt: new Date().toISOString(),
  });

  it('2개 마커 → 경로 포함, 거리 > 0', () => {
    const markers = [
      mkMarker('a', 37.5665, 126.9780),
      mkMarker('b', 37.4979, 127.0276),
    ];
    const result = solveTSP(markers);
    expect(result.path).toHaveLength(2);
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  it('1개 마커 → 거리 0', () => {
    const markers = [mkMarker('a', 37.5665, 126.9780)];
    const result = solveTSP(markers);
    expect(result.path).toHaveLength(1);
    expect(result.totalDistance).toBe(0);
  });
});
