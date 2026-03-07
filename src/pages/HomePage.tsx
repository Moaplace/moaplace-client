import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ChevronLeft } from 'lucide-react';

import FeatureSelector from '@/components/Home/FeatureSelector';
import PWAInstallBanner from '@/components/common/PWAInstallBanner';
import ProgressRoute from '@/components/common/ProgressRoute';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRoomStore } from '@/store/roomStore';
import type { RoomType } from '@/types';

import { ko } from 'react-day-picker/locale';

const CALENDAR_CLASS_NAMES = {
  root: 'w-full',
  months: 'w-full flex flex-col relative',
  month: 'w-full',
  month_caption: 'flex items-center justify-center gap-3 h-12 mb-2',
  weekdays: 'flex w-full',
  weekday: 'flex-1 text-sm font-pretendard-sb text-black-600',
  week: 'flex w-full mt-1',
  day: 'relative flex-1 p-0 text-center aspect-square select-none',
  today: 'rounded-full bg-primary text-primary-foreground',
  nav: 'flex items-center w-full absolute top-0 inset-x-0 justify-between h-12 px-1 z-10',
} as const;

type Step = 'feature' | 'name' | 'password' | 'dates';

const PLACE_STEPS: Step[] = ['feature', 'name', 'password'];
const TIME_STEPS: Step[] = ['feature', 'name', 'password', 'dates'];

const HomePage = () => {
  const [step, setStep] = useState<Step>('feature');
  const [roomType, setRoomType] = useState<RoomType>('place');
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const createRoom = useRoomStore((s) => s.createRoom);
  const isLoading = useRoomStore((s) => s.isLoading);
  const navigate = useNavigate();

  const steps = roomType === 'time' ? TIME_STEPS : PLACE_STEPS;
  const currentIndex = steps.indexOf(step);
  const totalSteps = steps.length;
  const stepLabels = roomType === 'time'
    ? ['기능', '이름', '비밀번호', '날짜']
    : ['기능', '이름', '비밀번호'];

  const goTo = (target: Step, dir: 'forward' | 'back' = 'forward') => {
    setDirection(dir);
    setStep(target);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalSteps) {
      goTo(steps[nextIndex], 'forward');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      goTo(steps[currentIndex - 1], 'back');
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleCreate = async () => {
    try {
      const dates =
        roomType === 'time'
          ? selectedDates.map((d) => d.toISOString().split('T')[0])
          : undefined;
      const room = await createRoom(
        roomName.trim(),
        roomType,
        dates,
        roomPassword || undefined,
      );
      toast.success(
        roomType === 'place'
          ? '모임이 만들어졌어요!'
          : '시간 모으기가 시작됐어요!',
      );
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
    }
  };

  const isNameValid = roomName.trim().length >= 2 && roomName.trim().length <= 20;
  const isPasswordValid = roomPassword.length === 0 || (roomPassword.length >= 4 && roomPassword.length <= 12);
  const isLastStep = currentIndex === totalSteps - 1;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;

    if (step === 'name' && isNameValid) {
      handleNext();
    } else if (step === 'password' && isPasswordValid) {
      if (isLastStep) handleCreate();
      else handleNext();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-dvh bg-background py-12">
      {/* 상단 네비게이션 */}
      <div className="flex flex-col w-full max-w-sm mb-8 gap-4">
        <div className="h-8 flex items-center">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-black-400 hover:text-black-600 transition-colors py-1"
            >
              <ChevronLeft className="w-4 h-4" />
              뒤로
            </button>
          )}
        </div>
        <ProgressRoute
          steps={stepLabels}
          currentStep={currentIndex}
        />
      </div>

      {/* 스텝 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center w-full max-w-sm">
        <div
          key={step}
          className={cn(
            'flex flex-col items-center gap-6 w-full animate-in fade-in duration-300',
            direction === 'forward' ? 'slide-in-from-right-8' : 'slide-in-from-left-8',
          )}
        >
          {/* Step: 기능 선택 */}
          {step === 'feature' && (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-3xl font-pretendard-xbd text-black">모아</h1>
                <p className="text-lg font-pretendard-sb text-foreground">
                  우리 모임, 같이 정하자
                </p>
                <p className="text-sm text-muted-foreground">
                  로그인 없이 바로 시작하세요
                </p>
              </div>
              <FeatureSelector selected={roomType} onSelect={setRoomType} />
              <Button onClick={handleNext} size="lg" className="w-full">
                다음
              </Button>
            </>
          )}

          {/* Step: 모임 이름 */}
          {step === 'name' && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-xl font-pretendard-bd text-black">
                  모임 이름을 정해주세요
                </h2>
                <p className="text-sm text-black-600">
                  2~20자로 입력해주세요
                </p>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <Input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value.slice(0, 20))}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 주말 점심 모임"
                  inputSize="lg" className="w-full"
                  maxLength={20}
                  autoFocus
                />
                <span className={cn(
                  'text-xs text-right',
                  roomName.trim().length > 0 && !isNameValid ? 'text-error' : 'text-black-400',
                )}>
                  {roomName.trim().length}/20
                </span>
              </div>
              <Button onClick={handleNext} size="lg" disabled={!isNameValid} className="w-full">
                다음
              </Button>
            </>
          )}

          {/* Step: 비밀번호 */}
          {step === 'password' && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-xl font-pretendard-bd text-black">
                  비밀번호를 설정할까요?
                </h2>
                <p className="text-sm text-black-600">
                  설정하면 비밀번호를 아는 사람만 참여할 수 있어요
                </p>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <Input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value.slice(0, 12))}
                  onKeyDown={handleKeyDown}
                  placeholder="4~12자 (선택)"
                  inputSize="lg" className="w-full"
                  maxLength={12}
                  autoFocus
                />
                {roomPassword.length > 0 && !isPasswordValid && (
                  <span className="text-xs text-error">
                    4자 이상 입력해주세요
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                {isLastStep ? (
                  <Button
                    onClick={handleCreate}
                    size="lg"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full"
                  >
                    {isLoading
                      ? '만드는 중...'
                      : roomType === 'place'
                        ? '장소 모으기 시작'
                        : '다음'}
                  </Button>
                ) : (
                  <Button onClick={handleNext} size="lg" disabled={!isPasswordValid} className="w-full">
                    다음
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setRoomPassword('');
                    if (isLastStep) handleCreate();
                    else handleSkip();
                  }}
                  className="text-sm text-black-400 hover:text-black-600 transition-colors py-2"
                >
                  {isLastStep ? '건너뛰고 시작' : '건너뛰기'}
                </button>
              </div>
            </>
          )}

          {/* Step: 날짜 선택 (모아타임만) */}
          {step === 'dates' && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-xl font-pretendard-bd text-black">
                  모임 날짜를 골라주세요
                </h2>
                <p className="text-sm text-black-600">
                  여러 날짜를 선택할 수 있어요
                </p>
              </div>
              <Calendar
                mode="multiple"
                locale={ko}
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates ?? [])}
                showOutsideDays={false}
                className="w-full rounded-2xl bg-white shadow-sm p-5 [--cell-size:--spacing(12)]"
                classNames={CALENDAR_CLASS_NAMES}
              />
              <Button
                onClick={handleCreate}
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? '만드는 중...' : '시간 모으기 시작'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* PWA 배너 */}
      {step === 'feature' && (
        <div className="w-full max-w-sm mt-8">
          <PWAInstallBanner
            onInstall={() => {}}
            onDismiss={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default HomePage;
