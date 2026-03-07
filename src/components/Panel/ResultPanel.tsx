import { memo } from 'react';
import { ChevronUp } from 'lucide-react';

import PulseMarker from '@/components/Map/PulseMarker';
import ParticipantList from '@/components/Panel/ParticipantList';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import type { Marker } from '@/types';

interface ResultPanelProps {
  markers: Marker[];
  myNickname: string;
  centroid?: { lat: number; lng: number };
}

const ResultPanel = memo(({ markers, myNickname, centroid }: ResultPanelProps) => {
  if (markers.length === 0) return null;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex items-center justify-center gap-2 w-full py-3 text-sm font-pretendard-md text-black-600 hover:text-black-800 transition-colors">
          <ChevronUp className="w-4 h-4" />
          참여자 {markers.length}명 · 결과 보기
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>모임 결과</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 flex flex-col gap-4">
          {/* 중심점 정보 */}
          {centroid && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-center-100 border border-center/20">
              <PulseMarker color="center" size="sm" />
              <div>
                <p className="text-sm font-pretendard-sb text-center-600">
                  모두의 중간지점
                </p>
                <p className="text-xs text-black-600">
                  ({centroid.lng.toFixed(1)}, {centroid.lat.toFixed(1)})
                </p>
              </div>
            </div>
          )}

          {/* 참여자 목록 */}
          <div>
            <h3 className="text-sm font-pretendard-sb text-black-800 mb-2">
              참여자
            </h3>
            <ParticipantList markers={markers} myNickname={myNickname} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

ResultPanel.displayName = 'ResultPanel';

export default ResultPanel;
