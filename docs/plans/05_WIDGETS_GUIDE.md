# 05. 위젯 가이드

> MoaPlace 공통 UI 컴포넌트 카탈로그.
> Toss UI/UX 원칙 + MoaPlace 컬러 시스템(18색) + shadcn/ui 패턴 기반.

---

## 1. 디자인 원칙 — Toss UX 법칙 적용

MoaPlace 위젯은 다음 UX 법칙을 따른다:

| 법칙 | 위젯 적용 |
|------|-----------|
| **피츠의 법칙** | 터치 영역 최소 44px, CTA 버튼은 하단 배치 |
| **힉의 법칙** | 한 화면에 하나의 주요 액션, 선택지 최소화 |
| **밀러의 법칙** | 참여자 목록 등 정보를 청크 단위로 그룹핑 |
| **피크엔드 법칙** | 에러/완료 화면에 친근한 문구 + 부드러운 애니메이션 |
| **도허티 임계** | 로딩 시 스켈레톤 UI 제공 (0.4초 이내 피드백) |
| **심미적 사용성** | 둥근 모서리(rounded-lg 이상), 캐주얼한 톤 |
| **포스텔의 법칙** | 입력은 유연하게, 요청 정보는 최소한으로 (1Thing/1Page) |
| **폰 레스토프 효과** | PWA 설치 배너, 중심점 마커에만 강조색 사용 |

## 2. 컬러 시스템 요약

> 상세: `docs/Moaplace_ColorSystem.md`

### 2.1 팔레트 (18색)

| 카테고리 | 토큰 | HEX | Tailwind 클래스 |
|----------|------|-----|-----------------|
| **Black~White** | `white` | #FFFFFF | `bg-white` |
| | `black` | #0A0E12 | `text-black` |
| | `black800` | #1E293B | `text-black-800` |
| | `black600` | #475569 | `text-black-600` |
| | `black400` | #94A3B8 | `text-black-400` |
| | `black300` | #CBD5E1 | `border-black-300` |
| | `black100` | #F1F5F9 | `bg-black-100` |
| **Primary** | `primary` | #3B82F6 | `bg-primary` |
| | `primary700` | #1D4ED8 | `active:bg-primary-700` |
| | `primary600` | #2563EB | `hover:bg-primary-600` |
| | `primary100` | #DBEAFE | `bg-primary-100` |
| **Sub** | `sub` | #C2410C | `bg-sub` |
| | `sub600` | #9A3412 | `hover:bg-sub-600` |
| | `sub100` | #FFEDD5 | `bg-sub-100` |
| **Status** | `success` | #15803D | `text-success` |
| | `error` | #DC2626 | `text-error` |
| | `warning` | #A16207 | `text-warning` |
| | `info` | #0369A1 | `text-info` |

### 2.2 마커 색상

| 마커 | 색상 | Tailwind |
|------|------|----------|
| 내 마커 | `sub` #C2410C | `bg-sub` |
| 다른 참여자 | `primary` #3B82F6 | `bg-primary` |
| 중심점 | `error` #DC2626 | `bg-error` |
| 경로 라인 | `primary` #3B82F6 | `stroke-primary` |

## 3. 타이포그래피

| 계층 | Tailwind 클래스 | 색상 | 용도 |
|------|-----------------|------|------|
| 헤딩 | `text-xl font-bold` | `text-black` | 페이지 타이틀, 섹션 제목 |
| 서브헤딩 | `text-lg font-semibold` | `text-black-800` | 카드 제목, 라벨 |
| 본문 | `text-base` | `text-black-800` | 기본 텍스트 |
| 보조 | `text-sm` | `text-black-600` | 부가 설명, 캡션 |
| 힌트 | `text-sm` | `text-black-400` | 플레이스홀더, 비활성 텍스트 |

## 4. Button

CTA 및 일반 액션 버튼. 피츠의 법칙에 따라 최소 터치 영역 44px 확보.

### 4.1 Variants

| Variant | 용도 | 스타일 |
|---------|------|--------|
| `primary` | CTA (새 모임 만들기, 여기로 확정!) | bg-primary, text-white |
| `secondary` | 보조 액션 (취소, 닫기) | border border-black-300, text-black-800 |
| `destructive` | 위험 액션 (삭제) | bg-error, text-white |
| `ghost` | 미니멀 액션 (링크형 버튼) | text-primary, hover:bg-primary-100 |

### 4.2 Sizes

| Size | 클래스 | 용도 |
|------|--------|------|
| `sm` | `px-3 py-1.5 text-sm h-8` | 인라인 액션 |
| `md` | `px-4 py-2 text-base h-10` | 기본 |
| `lg` | `px-6 py-3 text-lg h-12` | CTA (풀너비) |

### 4.3 코드

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
  variant: {
    primary: 'bg-primary hover:bg-primary-600 active:bg-primary-700 text-white',
    secondary: 'border border-black-300 bg-white hover:bg-black-100 text-black-800',
    destructive: 'bg-error hover:bg-red-700 text-white',
    ghost: 'text-primary hover:bg-primary-100',
  },
  size: {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
  },
};

const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled,
  fullWidth,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        buttonStyles.base,
        buttonStyles.variant[variant],
        buttonStyles.size[size],
        fullWidth && 'w-full',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
```

## 5. Input

텍스트/검색 입력 필드. 포스텔의 법칙 — 입력은 유연하게 수용.

### 5.1 코드

```tsx
interface InputProps {
  type?: 'text' | 'search';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className,
}: InputProps) => {
  return (
    <div className="flex flex-col gap-1">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-4 py-3 rounded-lg border text-black-800 text-base',
          'placeholder:text-black-400',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'transition-colors',
          error ? 'border-error' : 'border-black-300',
          className,
        )}
      />
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
};

export default Input;
```

### 5.2 플레이스홀더 규칙 (Toss Easy to Speak)

- 소리 내어 읽었을 때 자연스러운 문장
- 예시를 괄호로 제공: `"모임 이름을 입력해주세요 (예: 주말 점심 모임)"`
- 검색: `"장소 검색 (예: 강남역)"`
- 닉네임: `"이름 입력 (예: 홍길동)"`

## 6. Toast

피드백 메시지. 피크엔드 법칙 — 완료/실패 순간의 감정에 공감.

### 6.1 Variants

| Variant | 아이콘 | 배경 | 텍스트 | 예시 |
|---------|--------|------|--------|------|
| `success` | ✅ | bg-success/10 | text-success | "위치가 등록되었어요!" |
| `error` | ❌ | bg-error/10 | text-error | "위치를 가져올 수 없었어요" |
| `info` | ℹ️ | bg-info/10 | text-info | "링크가 복사되었어요!" |
| `warning` | ⚠️ | bg-warning/10 | text-warning | "모임이 곧 만료돼요" |

### 6.2 코드

```tsx
interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const toastStyles = {
  success: 'bg-green-50 text-success border-success/20',
  error: 'bg-red-50 text-error border-error/20',
  info: 'bg-blue-50 text-info border-info/20',
  warning: 'bg-yellow-50 text-warning border-warning/20',
};

const toastIcons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const Toast = ({ variant, message, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-2 px-4 py-3 rounded-lg border',
      'shadow-lg animate-slide-up',
      toastStyles[variant],
    )}>
      <span>{toastIcons[variant]}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;
```

## 7. Modal

닉네임 입력, 확인 다이얼로그. 포스텔의 법칙 1Thing/1Page — 한 모달에 하나의 목적.

### 7.1 코드

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 모달 콘텐츠 */}
      <div
        className={cn(
          'relative z-10 w-[calc(100%-32px)] max-w-sm',
          'bg-white rounded-2xl p-6',
          'animate-scale-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-black mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
```

### 7.2 사용 예시 — 닉네임 입력 모달

```tsx
<Modal isOpen={isNicknameModalOpen} onClose={closeModal} title="이름을 입력해주세요">
  <Input
    placeholder="이름 입력 (예: 홍길동)"
    value={nickname}
    onChange={setNickname}
  />
  <Button
    fullWidth
    className="mt-4"
    onClick={handleConfirm}
    disabled={!nickname.trim()}
  >
    확인
  </Button>
</Modal>
```

## 8. BottomSheet

위치 확정, 결과 패널. 힉의 법칙 — 정보를 섹션별로 그룹핑.

### 8.1 코드

```tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet = ({ isOpen, onClose, children }: BottomSheetProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-white rounded-t-2xl p-6 pb-safe',
          'max-h-[70vh] overflow-y-auto',
          'animate-slide-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="w-10 h-1 bg-black-300 rounded-full mx-auto mb-4" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
```

## 9. PWAInstallBanner

PWA 설치 유도. 폰 레스토프 효과로 시각적 강조 + Suggest Over Force — 강요하지 않는 권유.

### 9.1 코드

```tsx
import usePWA from '@/hooks/usePWA';

const PWAInstallBanner = () => {
  const { canInstall, install, dismiss } = usePWA();

  if (!canInstall) return null;

  return (
    <div className={cn(
      'flex items-center justify-between gap-3',
      'px-4 py-3 mx-4 rounded-lg',
      'bg-primary-100 border border-primary/20',
    )}>
      <span className="text-sm text-black-800">
        홈 화면에 추가하면 더 빠르게 쓸 수 있어요
      </span>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          괜찮아요
        </Button>
        <Button size="sm" onClick={install}>
          추가하기
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
```

## 10. 애니메이션

도허티 임계(0.4초 이내 피드백) 적용을 위한 Tailwind 커스텀 애니메이션:

```css
/* src/styles/globals.css */
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-scale-up {
  animation: scale-up 0.2s ease-out;
}
```

## 11. 위젯 사용 체크리스트

코드 생성/리뷰 시 확인:

- [ ] 터치 영역이 44px 이상인가? (피츠의 법칙)
- [ ] 한 화면에 주요 액션이 하나인가? (힉의 법칙)
- [ ] 정보가 청크 단위로 그룹핑되었는가? (밀러의 법칙)
- [ ] 완료/에러 시 친근한 피드백이 있는가? (피크엔드 법칙)
- [ ] 로딩 시 스켈레톤/애니메이션이 있는가? (도허티 임계)
- [ ] 하드코딩 색상 없이 컬러 토큰을 사용하는가?
- [ ] 마이크로카피가 비격식체(해요체)인가?
- [ ] 강요형 표현 없이 권유형인가? (Suggest Over Force)
