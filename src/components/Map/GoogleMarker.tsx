import { AdvancedMarker } from '@vis.gl/react-google-maps';

import MapPin from '@/components/Map/MapPin';
import PulseMarker from '@/components/Map/PulseMarker';
import type { LatLng } from '@/types';

interface GoogleMarkerProps {
  type: 'mine' | 'others' | 'center';
  position: LatLng;
  nickname?: string;
}

const GoogleMarker = ({ type, position, nickname }: GoogleMarkerProps) => {
  return (
    <AdvancedMarker position={position}>
      {type === 'center' ? (
        <PulseMarker color="center" size="lg" label="중간지점" />
      ) : (
        <MapPin type={type} nickname={nickname} />
      )}
    </AdvancedMarker>
  );
};

export default GoogleMarker;
