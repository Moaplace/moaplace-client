import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import PWAInstallBanner from '@/components/common/PWAInstallBanner'
import SearchBar from '@/components/common/SearchBar'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-pretendard-sb text-lg text-foreground">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
)

const WidgetShowcase = () => {
  const [inputValue, setInputValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [nickname, setNickname] = useState('')

  return (
    <div className="min-h-dvh bg-background pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 pt-safe">
        <h1 className="font-pretendard-bd text-xl text-foreground text-center">
          Widget Showcase
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          MoaPlace 공용 위젯 테스트
        </p>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">

        {/* Colors */}
        <Section title="Colors">
          <div className="grid grid-cols-4 gap-2">
            <div className="h-12 rounded-lg bg-primary" title="primary" />
            <div className="h-12 rounded-lg bg-primary-600" title="primary-600" />
            <div className="h-12 rounded-lg bg-primary-700" title="primary-700" />
            <div className="h-12 rounded-lg bg-primary-100" title="primary-100" />
            <div className="h-12 rounded-lg bg-sub" title="sub" />
            <div className="h-12 rounded-lg bg-sub-600" title="sub-600" />
            <div className="h-12 rounded-lg bg-sub-100" title="sub-100" />
            <div className="h-12 rounded-lg bg-black-100" title="black-100" />
            <div className="h-12 rounded-lg bg-destructive" title="destructive" />
            <div className="h-12 rounded-lg bg-success" title="success" />
            <div className="h-12 rounded-lg bg-warning" title="warning" />
            <div className="h-12 rounded-lg bg-info" title="info" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-black">text-black: 헤딩 텍스트</p>
            <p className="text-foreground">text-foreground: 기본 본문 (black800)</p>
            <p className="text-muted-foreground">text-muted-foreground: 보조 (black600)</p>
            <p className="text-black-400">text-black-400: 힌트/플레이스홀더</p>
          </div>
        </Section>

        <Separator />

        {/* Typography */}
        <Section title="Typography (Pretendard)">
          <p className="font-pretendard-xbd text-2xl">ExtraBold 24px</p>
          <p className="font-pretendard-bd text-xl">Bold 20px</p>
          <p className="font-pretendard-sb text-lg">SemiBold 18px</p>
          <p className="font-pretendard-md text-base">Medium 16px</p>
          <p className="text-base">Regular 16px (기본)</p>
          <p className="text-sm text-muted-foreground">Regular 14px 보조 텍스트</p>
          <p className="text-xs text-black-400">Regular 12px 힌트 텍스트</p>
        </Section>

        <Separator />

        {/* Button */}
        <Section title="Button">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="sub">Sub (Orange)</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <Button className="w-full" size="lg">
            새로운 모임 만들기
          </Button>
          <Button variant="sub" className="w-full" size="lg">
            여기로 확정!
          </Button>
          <Button disabled>Disabled</Button>
        </Section>

        <Separator />

        {/* Input */}
        <Section title="Input">
          <Input
            placeholder="모임 이름을 입력해주세요 (예: 주말 점심 모임)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input placeholder="비활성 상태" disabled />
        </Section>

        <Separator />

        {/* SearchBar */}
        <Section title="SearchBar (커스텀)">
          <SearchBar value={searchValue} onChange={setSearchValue} />
        </Section>

        <Separator />

        {/* Badge */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">참여자</span>
            <Badge variant="secondary">3명 참여</Badge>
          </div>
        </Section>

        <Separator />

        {/* Card */}
        <Section title="Card">
          <Card>
            <CardHeader>
              <CardTitle>모아플레이스</CardTitle>
              <CardDescription>우리 만날 장소, 같이 찾자</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">참여자</span>
                  <span className="font-pretendard-md">3명</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">최단거리</span>
                  <span className="font-pretendard-md">12.4km</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* Toast */}
        <Section title="Toast (Sonner)">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.success('위치가 등록되었어요!')}
            >
              Success
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.error('위치를 가져올 수 없었어요')}
            >
              Error
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.info('링크가 복사되었어요!')}
            >
              Info
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.warning('모임이 곧 만료돼요')}
            >
              Warning
            </Button>
          </div>
        </Section>

        <Separator />

        {/* Dialog */}
        <Section title="Dialog (Modal)">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">닉네임 입력 모달 열기</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>이름을 입력해주세요</DialogTitle>
                <DialogDescription>
                  모임에서 사용할 이름을 입력해주세요
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="이름 입력 (예: 홍길동)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <Button className="w-full mt-2" disabled={!nickname.trim()}>
                확인
              </Button>
            </DialogContent>
          </Dialog>
        </Section>

        <Separator />

        {/* Drawer (BottomSheet) */}
        <Section title="Drawer (BottomSheet)">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">바텀시트 열기</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>결과</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-destructive">⭐</span>
                  <span className="font-pretendard-md">모두의 중심점</span>
                  <span className="text-sm text-muted-foreground">서울시 중구</span>
                </div>
                <Separator />
                <div className="space-y-3">
                  {['강남 (3.2km)', '신촌 (4.1km)', '잠실 (5.1km)'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full" size="lg">
                  링크 복사하기
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </Section>

        <Separator />

        {/* Sheet (Side Panel) */}
        <Section title="Sheet (사이드 패널)">
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm">왼쪽 패널</Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>메뉴</SheetTitle>
                </SheetHeader>
                <nav className="space-y-2 px-4">
                  {['내 모임', '참여 모임', '설정', '도움말'].map((item) => (
                    <div key={item} className="py-2 text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm">오른쪽 패널</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>참여자 목록</SheetTitle>
                </SheetHeader>
                <div className="space-y-3 px-4">
                  {['홍길동 — 강남구', '김철수 — 마포구', '이영희 — 종로구'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-100" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </Section>

        <Separator />

        {/* Popover */}
        <Section title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">클릭해보세요</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto px-3 py-2 text-sm">
              <p>홍길동 — 서울 강남구</p>
            </PopoverContent>
          </Popover>
        </Section>

        <Separator />

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* PWAInstallBanner */}
        <Section title="PWAInstallBanner (커스텀)">
          <PWAInstallBanner
            onInstall={() => toast.info('설치 시작!')}
            onDismiss={() => toast.info('다음에 할게요')}
            className="mx-0"
          />
        </Section>

        <Separator />

        {/* Animation test */}
        <Section title="Animations">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-primary animate-fade-in" />
            <div className="w-16 h-16 rounded-lg bg-sub animate-scale-up" />
            <div className="w-16 h-16 rounded-lg bg-success animate-slide-up" />
          </div>
          <p className="text-xs text-muted-foreground">
            fade-in / scale-up / slide-up
          </p>
        </Section>

      </main>
    </div>
  )
}

export default WidgetShowcase
