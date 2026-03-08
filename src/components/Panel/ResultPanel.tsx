import { memo } from 'react';
import { ChevronUp, Route } from 'lucide-react';

import NearbyPlaceList from '@/components/Map/NearbyPlaceList';
import PulseMarker from '@/components/Map/PulseMarker';
import ParticipantList from '@/components/Panel/ParticipantList';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import type { Marker, RoomResult } from '@/types';

interface ResultPanelProps {
  markers: Marker[];
  myNickname: string;
  result: RoomResult | null;
}

const ResultPanel = memo(({ markers, myNickname, result }: ResultPanelProps) => {
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
        <div className="px-4 pb-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {result?.centroid && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-center-100 border border-center/20">
              <PulseMarker color="center" size="sm" />
              <div>
                <p className="text-sm font-pretendard-sb text-center-600">
                  모두의 중간지점
                </p>
                <p className="text-xs text-black-600">
                  {result.centroid.address ?? `(${result.centroid.lat.toFixed(4)}, ${result.centroid.lng.toFixed(4)})`}
                </p>
              </div>
            </div>
          )}

          {result?.route && result.route.totalDistance > 0 && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary-100 border border-primary/20">
              <Route className="size-5 text-primary" />
              <div>
                <p className="text-sm font-pretendard-sb text-primary">최단 경로</p>
                <p className="text-xs text-black-600">
                  총 {result.route.totalDistance.toFixed(1)}km
                </p>
              </div>
            </div>
          )}

          {result?.distances && result.distances.length > 0 && (
            <div>
              <h3 className="text-sm font-pretendard-sb text-black-800 mb-2">중심점까지 거리</h3>
              <ul className="flex flex-col gap-1.5">
                {result.distances.map((d) => (
                  <li key={d.markerId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black-100/50">
                    <span className="text-sm text-black-800">{d.nickname}</span>
                    <span className="text-xs text-black-400">{d.distance.toFixed(1)}km</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-pretendard-sb text-black-800 mb-2">참여자</h3>
            <ParticipantList markers={markers} myNickname={myNickname} />
          </div>

          {result?.centroid && (
            <>
              <Separator />
              <NearbyPlaceList lat={result.centroid.lat} lng={result.centroid.lng} />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
});

ResultPanel.displayName = 'ResultPanel';

export default ResultPanel;
