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
        'flex items-center justify-between gap-3',
        'px-4 py-3 mx-4 rounded-xl',
        'bg-primary-100 border border-primary/20',
        className,
      )}
    >
      <span className="text-sm text-foreground">
        홈 화면에 추가하면 더 빠르게 쓸 수 있어요
      </span>
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
