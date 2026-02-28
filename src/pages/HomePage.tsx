import { useState } from 'react';

import CreateRoom from '@/components/Home/CreateRoom';
import FeatureSelector from '@/components/Home/FeatureSelector';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';
import type { RoomType } from '@/types';

const HomePage = () => {
  const [roomType, setRoomType] = useState<RoomType>('place');

  return (
    <div className="flex flex-col items-center gap-8 py-12 min-h-[calc(100dvh-32px)]">
      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-pretendard-xbd text-black">모아</h1>
        <p className="text-lg font-pretendard-sb text-foreground">
          우리 모임, 같이 정하자
        </p>
        <p className="text-sm text-muted-foreground">
          로그인 없이 바로 시작하세요
        </p>
      </section>

      {/* 기능 선택 카드 */}
      <section className="w-full max-w-sm">
        <FeatureSelector selected={roomType} onSelect={setRoomType} />
      </section>

      {/* 방 생성 폼 */}
      <section className="w-full max-w-sm">
        <CreateRoom roomType={roomType} />
      </section>

      {/* PWA 설치 배너 */}
      <section className="w-full max-w-sm">
        <PWAInstallBanner
          onInstall={() => {
            // Phase 6에서 usePWA 훅 연결 예정
          }}
          onDismiss={() => {
            // Phase 6에서 dismiss 로직 연결 예정
          }}
        />
      </section>
    </div>
  );
};

export default HomePage;
