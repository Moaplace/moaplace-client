import { Link2, MapPin, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MapActionBarProps {
  onLocate: () => void;
  onShare: () => void;
  onRelocate: () => void;
  hasMyMarker: boolean;
}

const MapActionBar = ({ onLocate, onShare, onRelocate, hasMyMarker }: MapActionBarProps) => {
  return (
    <div className="flex gap-3 py-3">
      {hasMyMarker ? (
        <Button
          onClick={onRelocate}
          variant="outline"
          className="flex-1 gap-2"
          size="lg"
        >
          <RefreshCw className="w-4 h-4" />
          위치 변경
        </Button>
      ) : (
        <Button
          onClick={onLocate}
          className="flex-1 gap-2"
          size="lg"
        >
          <MapPin className="w-4 h-4" />
          위치 찍기
        </Button>
      )}
      <Button
        onClick={onShare}
        variant="outline"
        className="gap-2"
        size="lg"
      >
        <Link2 className="w-4 h-4" />
        공유
      </Button>
    </div>
  );
};

export default MapActionBar;
