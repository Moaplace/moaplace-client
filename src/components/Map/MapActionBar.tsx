import { memo } from 'react';
import { Link2, MapPin, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MapActionBarProps {
  onLocate: () => void;
  onShare: () => void;
  onRelocate: () => void;
  hasMyMarker: boolean;
  showShare?: boolean;
}

const MapActionBar = memo(({
  onLocate,
  onShare,
  onRelocate,
  hasMyMarker,
  showShare = true,
}: MapActionBarProps) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
      {hasMyMarker ? (
        <Button
          onClick={onRelocate}
          variant="outline"
          className="rounded-full shadow-lg gap-2"
          size="lg"
        >
          <RefreshCw className="size-5" />
          위치 변경
        </Button>
      ) : (
        <Button
          onClick={onLocate}
          className="rounded-full shadow-lg gap-2"
          size="lg"
        >
          <MapPin className="size-5" />
          위치 찍기
        </Button>
      )}
      {showShare && (
        <Button
          onClick={onShare}
          variant="icon-circle"
          size="icon-lg"
        >
          <Link2 className="size-5" />
        </Button>
      )}
    </div>
  );
});

MapActionBar.displayName = 'MapActionBar';

export default MapActionBar;
