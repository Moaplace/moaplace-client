import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PWAInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
  className?: string;
}

const PWAInstallBanner = ({ onInstall, onDismiss, className }: PWAInstallBannerProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        'rounded-2xl bg-white border border-black-300/50 p-4 shadow-lg animate-slide-up',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-primary-100 shrink-0">
        <Download className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-pretendard-sb text-black">홈 화면에 추가</p>
        <p className="text-xs text-black-600">더 빠르게 모아장소를 이용해요</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          괜찮아요
        </Button>
        <Button size="sm" onClick={onInstall}>
          추가하기
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
