import { useState } from 'react';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';

interface ProfileSheetProps {
  open: boolean;
  onSubmit: (nickname: string, password: string) => Promise<void>;
  onClose: () => void;
}

const ProfileSheet = ({ open, onSubmit, onClose }: ProfileSheetProps) => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNicknameValid = nickname.trim().length >= 1;
  const isPasswordValid = password.length >= 4 && password.length <= 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNicknameValid || !isPasswordValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit(nickname.trim(), password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '참여에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;
    if (isNicknameValid && isPasswordValid) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>내 정보를 입력해주세요</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-6">
          <p className="text-sm text-black-600">
            지도에 표시될 이름과 수정용 비밀번호예요
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-pretendard-md text-black-800">이름</label>
            <Input
              type="text"
              placeholder="예: 홍길동"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              inputSize="lg"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-pretendard-md text-black-800">수정용 비밀번호</label>
            <Input
              type="password"
              placeholder="4~12자 (나중에 위치 수정 시 필요)"
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 12))}
              onKeyDown={handleKeyDown}
              inputSize="lg"
              maxLength={12}
            />
            {password.length > 0 && !isPasswordValid && (
              <span className="text-xs text-error">4자 이상 입력해주세요</span>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!isNicknameValid || !isPasswordValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? '참여 중...' : '위치 찍으러 가기'}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default ProfileSheet;
