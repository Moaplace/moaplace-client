import CreateRoom from '@/components/Home/CreateRoom';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-32px)] gap-8 py-12">
      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-pretendard-xbd text-black">
          모아장소
        </h1>
        <p className="text-lg font-pretendard-sb text-foreground">
          우리 만날 장소, 같이 찾자
        </p>
        <p className="text-sm text-muted-foreground">
          로그인 없이 바로 시작하세요
        </p>
      </section>

      {/* 방 생성 폼 */}
      <section className="w-full max-w-sm">
        <CreateRoom />
      </section>

      {/* PWA 설치 배너 */}
      <section className="w-full">
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
