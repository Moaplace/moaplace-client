import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

import { AppColors } from '@/constants/colors';
import type { LatLng } from '@/types';

interface RoutePolylineProps {
  path: LatLng[];
}

const RoutePolyline = ({ path }: RoutePolylineProps) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;

    polylineRef.current = new mapsLib.Polyline({
      map,
      path: path.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: AppColors.primary,
      strokeOpacity: 0.8,
      strokeWeight: 3,
      geodesic: true,
    });

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [map, mapsLib, path]);

  return null;
};

export default RoutePolyline;
