import { useEffect } from 'react';
import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import useGeocoding from '@/hooks/useGeocoding';

interface LocationConfirmSheetProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  lat: number;
  lng: number;
}

const LocationConfirmSheet = ({
  open,
  onConfirm,
  onCancel,
  lat,
  lng,
}: LocationConfirmSheetProps) => {
  const { address, isLoading, reverseGeocode } = useGeocoding();

  useEffect(() => {
    if (open) {
      reverseGeocode(lat, lng);
    }
  }, [open, lat, lng, reverseGeocode]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onCancel()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sub" />
            이 위치로 등록할까요?
          </DrawerTitle>
          <DrawerDescription>
            {isLoading ? '주소를 찾고 있어요...' : address ?? `(${lat.toFixed(4)}, ${lng.toFixed(4)})`}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={onConfirm} size="lg" className="w-full">
            여기로 확정!
          </Button>
          <Button onClick={onCancel} variant="outline" size="lg" className="w-full">
            취소
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default LocationConfirmSheet;
