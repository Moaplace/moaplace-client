import { useState } from 'react';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EntryGateProps {
  roomName: string;
  onRoomPasswordVerify: (password: string) => Promise<boolean>;
}

const EntryGate = ({
  roomName,
  onRoomPasswordVerify,
}: EntryGateProps) => {
  const [roomPassword, setRoomPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ok = await onRoomPasswordVerify(roomPassword);
      if (!ok) {
        toast.error('비밀번호가 틀려요');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;
    if (roomPassword.length >= 4) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-sm text-black-400 mb-1">모임에 참여하기</p>
          <h1 className="text-2xl font-pretendard-bd text-black">{roomName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center">
            <h2 className="text-xl font-pretendard-bd text-black mb-2">
              모임 비밀번호
            </h2>
            <p className="text-sm text-black-600">
              방장이 설정한 비밀번호를 입력해주세요
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Input
              type="password"
              placeholder="4~12자"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value.slice(0, 12))}
              onKeyDown={handleKeyDown}
              inputSize="lg"
              maxLength={12}
              autoFocus
            />
            {roomPassword.length > 0 && roomPassword.length < 4 && (
              <span className="text-xs text-error">4자 이상 입력해주세요</span>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={roomPassword.length < 4 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? '확인 중...' : '확인'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EntryGate;
