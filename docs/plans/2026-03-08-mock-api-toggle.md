# Mock API 환경변수 토글 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `USE_MOCK_API` 환경변수로 Mock/HTTP API 어댑터를 런타임에 전환

**Architecture:** Vite `define`으로 빌드 타임 상수 주입 -> Factory(api.ts)에서 조건 분기

**Tech Stack:** Vite define, TypeScript, 기존 Port/Adapter/Factory 패턴

---

## 현재 구조

```
.env                    → USE_MOCK_API=true
vite.config.ts          → define에 __GOOGLE_MAPS_API_KEY__만 있음
src/vite-env.d.ts       → __GOOGLE_MAPS_API_KEY__ 선언만 있음
src/lib/api.ts          → mockApi 하드코딩 export
src/lib/api.interface.ts → ApiClient 인터페이스 (변경 없음)
src/lib/api.mock.ts     → Mock 어댑터 (변경 없음)
src/lib/api.http.ts     → HTTP 어댑터 스켈레톤 (변경 없음)
```

## 변경 후 구조

```
.env                    → USE_MOCK_API=true (변경 없음)
vite.config.ts          → __USE_MOCK_API__ 상수 추가
src/vite-env.d.ts       → __USE_MOCK_API__ 타입 선언 추가
src/lib/api.ts          → __USE_MOCK_API__ 기반 조건 분기
```

---

### Task 1: Vite define에 환경변수 주입

**Files:**
- Modify: `vite.config.ts`

**변경 내용:**

`define` 블록에 `__USE_MOCK_API__` 추가:

```typescript
define: {
  __GOOGLE_MAPS_API_KEY__: JSON.stringify(env.GOOGLE_MAPS_API_KEY),
  __USE_MOCK_API__: env.USE_MOCK_API === 'true',
},
```

`env.USE_MOCK_API === 'true'`로 비교하여 boolean 값으로 주입.
(.env에서 읽은 값은 항상 string이므로 명시적 비교 필요)

---

### Task 2: TypeScript 타입 선언

**Files:**
- Modify: `src/vite-env.d.ts`

**변경 내용:**

```typescript
/// <reference types="vite/client" />

declare const __GOOGLE_MAPS_API_KEY__: string;
declare const __USE_MOCK_API__: boolean;
```

---

### Task 3: Factory에서 조건 분기

**Files:**
- Modify: `src/lib/api.ts`

**변경 내용:**

```typescript
import type { ApiClient } from './api.interface';
import mockApi from './api.mock';
import httpApi from './api.http';

const api: ApiClient = __USE_MOCK_API__ ? mockApi : httpApi;

export default api;
```

기존 주석 제거, 깔끔하게 삼항 연산자로 분기.

---

## 동작 확인

- `.env`에 `USE_MOCK_API=true` → mockApi 사용 (현재 동작 그대로)
- `.env`에 `USE_MOCK_API=false` → httpApi 사용 (백엔드 연동 시)
- 빌드 타임 상수이므로 트리쉐이킹 가능 (사용하지 않는 어댑터 번들에서 제거)

## 비변경 사항

- `api.interface.ts` — 변경 없음
- `api.mock.ts` — 변경 없음
- `api.http.ts` — 변경 없음
- `.env` — 이미 `USE_MOCK_API=true` 설정됨
