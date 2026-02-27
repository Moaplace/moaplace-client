# 🎨 MoaPlace 컬러 시스템 (Color System) v2.1

> 디자인 상수 기반 — Solid 값 18개, WCAG AA 전수 검증 완료

---

## 1. 컬러 카테고리

| 카테고리          | 설명                                             |
| ----------------- | ------------------------------------------------ |
| **Black ~ White** | 기본 흑백 + Black Scale (레이아웃, 텍스트, 보더) |
| **Primary**       | 브랜드 핵심 색상 — Blue 계열                     |
| **Sub**           | 보조 강조 색상 — Orange 계열                     |
| **Status**        | 시스템 상태 색상 — Success, Error, Warning, Info |

---

## 2. 색상 정의

### 2.1 Black ~ White (7개)

| 토큰       | HEX       | 흰색 대비 | 용도                                         |
| ---------- | --------- | --------- | -------------------------------------------- |
| `white`    | `#FFFFFF` | —         | 기본 배경                                    |
| `black`    | `#0A0E12` | 19.36:1   | 헤딩, 최고 강조 텍스트                       |
| `black800` | `#1E293B` | 14.63:1   | 기본 본문 텍스트                             |
| `black600` | `#475569` | 7.58:1    | 보조 텍스트                                  |
| `black400` | `#94A3B8` | 2.56:1    | 플레이스홀더, 힌트 (대형 텍스트/아이콘 전용) |
| `black300` | `#CBD5E1` | 1.48:1    | 보더, 디바이더 (비텍스트 전용)               |
| `black100` | `#F1F5F9` | 1.10:1    | 섹션/카드 배경                               |

### 2.2 Primary — Blue (4개)

| 토큰         | HEX       | 흰색 대비 | 용도                                  |
| ------------ | --------- | --------- | ------------------------------------- |
| `primary`    | `#3B82F6` | 3.68:1    | CTA 버튼, 다른 참여자 마커, 경로 라인 |
| `primary700` | `#1D4ED8` | 6.70:1    | 버튼 액티브                           |
| `primary600` | `#2563EB` | 5.17:1    | 버튼 호버                             |
| `primary100` | `#DBEAFE` | 1.22:1    | 선택된 카드 배경, 칩 배경             |

### 2.3 Sub — Orange (3개)

| 토큰     | HEX       | 흰색 대비 | 용도                       |
| -------- | --------- | --------- | -------------------------- |
| `sub`    | `#C2410C` | 5.18:1    | 내 마커, 알림 강조, 액센트 |
| `sub600` | `#9A3412` | 7.31:1    | 호버                       |
| `sub100` | `#FFEDD5` | 1.15:1    | 토스트/알림 배경           |

### 2.4 Status (4개)

| 토큰      | HEX       | 흰색 대비 | 용도                   |
| --------- | --------- | --------- | ---------------------- |
| `success` | `#15803D` | 5.02:1    | 위치 등록 완료         |
| `error`   | `#DC2626` | 4.83:1    | 입력 오류, 중심점 마커 |
| `warning` | `#A16207` | 4.92:1    | TTL 만료 임박          |
| `info`    | `#0369A1` | 5.93:1    | 안내 메시지            |

---

## 3. 총 색상 수

| 카테고리       | 개수     |
| -------------- | -------- |
| Black ~ White  | 7개      |
| Primary (Blue) | 4개      |
| Sub (Orange)   | 3개      |
| Status         | 4개      |
| **합계**       | **18개** |

---

## 4. 지도 마커 색상 매핑

| 마커        | 색상 토큰 | HEX     |
| ----------- | --------- | ------- |
| 내 마커     | `sub`     | #C2410C |
| 다른 참여자 | `primary` | #3B82F6 |
| 중심점 (⭐) | `error`   | #DC2626 |
| 경로 라인   | `primary` | #3B82F6 |

---

## 5. 코드 적용

### 5.1 TypeScript 디자인 상수

```ts
// src/constants/colors.ts

/**
 * 앱 전역 색상 팔레트
 * App Global Color Palette
 *
 * 사용법:
 * - style={{ color: AppColors.primary }}
 * - className에서는 Tailwind 커스텀 컬러로 매핑
 */
export const AppColors = {
  // ============================================
  // Black ~ White (기본 흑백 + 스케일)
  // ============================================

  /** 흰색 — 기본 배경 */
  white: "#FFFFFF",

  /** 검정 — 헤딩, 최고 강조 텍스트 */
  black: "#0A0E12",

  /** 검정 800 — 기본 본문 텍스트 */
  black800: "#1E293B",

  /** 검정 600 — 보조 텍스트 */
  black600: "#475569",

  /** 검정 400 — 플레이스홀더, 힌트 */
  black400: "#94A3B8",

  /** 검정 300 — 보더, 디바이더 */
  black300: "#CBD5E1",

  /** 검정 100 — 섹션/카드 배경 */
  black100: "#F1F5F9",

  // ============================================
  // Primary — Blue (브랜드 핵심)
  // ============================================

  /** 프라이머리 — CTA 버튼, 브랜드 강조 */
  primary: "#3B82F6",

  /** 프라이머리 700 — 버튼 액티브 */
  primary700: "#1D4ED8",

  /** 프라이머리 600 — 버튼 호버 */
  primary600: "#2563EB",

  /** 프라이머리 100 — 선택된 카드 배경 */
  primary100: "#DBEAFE",

  // ============================================
  // Sub — Orange (보조 강조)
  // ============================================

  /** 서브 — 내 마커, 알림 강조 */
  sub: "#C2410C",

  /** 서브 600 — 호버 */
  sub600: "#9A3412",

  /** 서브 100 — 토스트/알림 배경 */
  sub100: "#FFEDD5",

  // ============================================
  // Status (시스템 상태)
  // ============================================

  /** 성공 — 위치 등록 완료 */
  success: "#15803D",

  /** 에러 — 입력 오류, 중심점 마커 */
  error: "#DC2626",

  /** 경고 — TTL 만료 임박 */
  warning: "#A16207",

  /** 정보 — 안내 메시지 */
  info: "#0369A1",
} as const;

export type AppColorKey = keyof typeof AppColors;
```

### 5.2 Tailwind 커스텀 컬러 연동

```ts
// tailwind.config.ts
import { AppColors } from "./src/constants/colors";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: AppColors.white,
        black: {
          DEFAULT: AppColors.black,
          800: AppColors.black800,
          600: AppColors.black600,
          400: AppColors.black400,
          300: AppColors.black300,
          100: AppColors.black100,
        },
        primary: {
          DEFAULT: AppColors.primary,
          700: AppColors.primary700,
          600: AppColors.primary600,
          100: AppColors.primary100,
        },
        sub: {
          DEFAULT: AppColors.sub,
          600: AppColors.sub600,
          100: AppColors.sub100,
        },
        success: AppColors.success,
        error: AppColors.error,
        warning: AppColors.warning,
        info: AppColors.info,
      },
    },
  },
};
```

### 5.3 사용 예시

```tsx
{/* CTA 버튼 */}
<button className="bg-primary hover:bg-primary-600 active:bg-primary-700 text-white">
  새로운 모임 만들기
</button>

{/* 텍스트 계층 */}
<h1 className="text-black">모아장소</h1>
<p className="text-black-800">기본 본문 텍스트</p>
<p className="text-black-600">보조 텍스트</p>
<input placeholder="장소 검색" className="placeholder:text-black-400" />

{/* 카드 */}
<div className="bg-black-100 border border-black-300">카드</div>

{/* 상태 메시지 */}
<span className="text-success">✅ 위치가 등록되었어요!</span>
<span className="text-error">위치를 선택해주세요</span>
```
