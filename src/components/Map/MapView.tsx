import { useCallback, useMemo } from 'react';
import { Map, type MapMouseEvent } from '@vis.gl/react-google-maps';

import GoogleMarker from '@/components/Map/GoogleMarker';
import RoutePolyline from '@/components/Map/RoutePolyline';
import { cn } from '@/lib/utils';
import type { Marker, RoomResult } from '@/types';

interface MapViewProps {
  markers: Marker[];
  myNickname: string;
  result: RoomResult | null;
  onMapClick: (lat: number, lng: number) => void;
  className?: string;
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

const MapView = ({ markers, myNickname, result, onMapClick, className }: MapViewProps) => {
  const routePath = useMemo(
    () => result?.route?.path.map((m) => ({ lat: m.lat, lng: m.lng })) ?? [],
    [result?.route?.path],
  );

  const handleClick = useCallback((e: MapMouseEvent) => {
    const pos = e.detail.latLng;
    if (pos) {
      onMapClick(pos.lat, pos.lng);
    }
  }, [onMapClick]);

  return (
    <div className={cn('relative h-full', className)}>
      <Map
        defaultCenter={SEOUL_CENTER}
        defaultZoom={12}
        mapId="moaplace"
        onClick={handleClick}
        gestureHandling="greedy"
        disableDefaultUI
        className="w-full h-full"
      >
        {markers.map((marker) => (
          <GoogleMarker
            key={marker.id}
            type={marker.nickname === myNickname ? 'mine' : 'others'}
            position={{ lat: marker.lat, lng: marker.lng }}
            nickname={marker.nickname}
          />
        ))}

        {result?.centroid && (
          <GoogleMarker
            type="center"
            position={{ lat: result.centroid.lat, lng: result.centroid.lng }}
          />
        )}

        {routePath.length > 1 && (
          <RoutePolyline path={routePath} />
        )}
      </Map>
    </div>
  );
};

export default MapView;
