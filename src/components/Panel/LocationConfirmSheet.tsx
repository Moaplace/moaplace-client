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

interface LocationConfirmSheetProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  x: number;
  y: number;
}

const LocationConfirmSheet = ({
  open,
  onConfirm,
  onCancel,
  x,
  y,
}: LocationConfirmSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onCancel()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sub" />
            이 위치로 등록할까요?
          </DrawerTitle>
          <DrawerDescription>
            좌표: ({x.toFixed(1)}, {y.toFixed(1)})
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
