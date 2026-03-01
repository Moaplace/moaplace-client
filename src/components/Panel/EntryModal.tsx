import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type EntryStep = 'room_password' | 'nickname' | 'participant_password';

interface EntryModalProps {
  open: boolean;
  step: EntryStep;
  hasRoomPassword: boolean;
  onRoomPasswordVerify: (password: string) => Promise<boolean>;
  onNicknameSubmit: (nickname: string) => void;
  onParticipantPasswordSubmit: (password: string) => Promise<void>;
}

const EntryModal = ({
  open,
  step,
  hasRoomPassword,
  onRoomPasswordVerify,
  onNicknameSubmit,
  onParticipantPasswordSubmit,
}: EntryModalProps) => {
  const [roomPassword, setRoomPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(0);

  // step이 바뀔 때 애니메이션 트리거
  const triggerAnim = () => {
    setDirection('forward');
    setAnimKey((k) => k + 1);
  };

  const handleRoomPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ok = await onRoomPasswordVerify(roomPassword);
      if (ok) {
        triggerAnim();
      } else {
        toast.error('비밀번호가 틀려요');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onNicknameSubmit(nickname.trim());
    triggerAnim();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsSubmitting(true);
    try {
      await onParticipantPasswordSubmit(password.trim());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '참여에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div
          key={animKey}
          className={cn(
            'animate-in fade-in duration-300',
            direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4',
          )}
        >
          {/* Step 1: 방 비밀번호 */}
          {step === 'room_password' && hasRoomPassword && (
            <>
              <DialogHeader>
                <DialogTitle>모임 비밀번호</DialogTitle>
                <DialogDescription>
                  방장이 설정한 비밀번호를 입력해주세요
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRoomPasswordSubmit} className="flex flex-col gap-4 mt-4">
                <Input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="h-12 px-4 text-base"
                  autoFocus
                />
                <Button type="submit" size="lg" disabled={!roomPassword || isSubmitting} className="w-full">
                  {isSubmitting ? '확인 중...' : '확인'}
                </Button>
              </form>
            </>
          )}

          {/* Step 2: 닉네임 */}
          {step === 'nickname' && (
            <>
              <DialogHeader>
                <DialogTitle>이름을 알려주세요</DialogTitle>
                <DialogDescription>
                  지도에 표시될 이름이에요
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleNicknameSubmit} className="flex flex-col gap-4 mt-4">
                <Input
                  type="text"
                  placeholder="예: 홍길동"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-12 px-4 text-base"
                  autoFocus
                />
                <Button type="submit" size="lg" disabled={!nickname.trim()} className="w-full">
                  다음
                </Button>
              </form>
            </>
          )}

          {/* Step 3: 개인 비밀번호 */}
          {step === 'participant_password' && (
            <>
              <DialogHeader>
                <DialogTitle>수정용 비밀번호</DialogTitle>
                <DialogDescription>
                  나중에 위치를 바꿀 때 필요해요
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 mt-4">
                <Input
                  type="password"
                  placeholder="예: 1234"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 text-base"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!password.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? '참여 중...' : '참여하기'}
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntryModal;
