# Parallel Review Command Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/review` 커맨드를 병렬 에이전트 디스패치 방식으로 재작성하여, React 프론트엔드 코드의 6가지 독립적 품질 검사를 동시에 실행하게 한다.

**Architecture:** 기존 monolithic review.md를 교체. 커맨드 실행 시 6개 Task agent를 동시에 dispatch하고, 각 에이전트가 독립적 검사 영역을 담당한 뒤 결과를 통합 리포트로 합친다.

**Tech Stack:** Claude Code custom command (.claude/commands/review.md), Task tool parallel dispatch

---

## 병렬 에이전트 6개 영역

| # | Agent | 검사 대상 | 독립성 |
|---|-------|----------|--------|
| 1 | **Design System Compliance** | AppColors 18색 vs 하드코딩 HEX, Tailwind 커스텀 토큰 사용, globals.css 폰트 토큰 일관성 | 독립 |
| 2 | **DRY Violations** | 중복 코드 패턴, 유사 컴포넌트, 반복 로직 | 독립 |
| 3 | **Dead Code** | 미사용 import, 미사용 컴포넌트/함수/변수, 미참조 파일 | 독립 |
| 4 | **Circular Dependencies** | import 순환 참조, useEffect 무한 루프, 상태 업데이트 순환 | 독립 |
| 5 | **Unnecessary Re-renders** | React.memo/useMemo/useCallback 누락, useEffect 의존성 배열 오류, Zustand 전체 스토어 구독 | 독립 |
| 6 | **Memory Leaks** | useEffect cleanup 누락, 이벤트 리스너 미해제, setInterval/setTimeout 미정리, 구독 미해제 | 독립 |

---

### Task 1: review.md 커맨드 파일 교체

**Files:**
- Modify: `.claude/commands/review.md` (전체 교체)

**Step 1: 기존 review.md 백업 확인**

기존 내용은 git history에 남아 있으므로 별도 백업 불필요. 현재 커밋 상태 확인만.

Run: `git log --oneline -1`

**Step 2: review.md를 병렬 디스패치 커맨드로 교체**

아래 내용으로 `.claude/commands/review.md` 전체를 교체한다:

````markdown
# Parallel Code Review (React Frontend)

React 프론트엔드 코드를 **6개 독립 영역으로 병렬 리뷰**합니다.

## 실행 방법

이 커맨드가 호출되면 아래 6개 에이전트를 **동시에** Task tool로 dispatch하세요.
모든 에이전트는 `subagent_type: "general-purpose"`로, **read-only 조사만** 수행합니다 (코드 수정 금지).

> **중요:** 6개 Task를 반드시 **하나의 메시지에서 병렬로** 호출하세요.

---

## Agent 1: Design System Compliance (디자인 시스템 준수)

```
프로젝트의 디자인 시스템 준수 여부를 검사하세요. 코드 수정은 하지 마세요.

검사 기준:
1. src/constants/colors.ts의 AppColors 18색 토큰 확인
2. src/styles/globals.css의 @theme 커스텀 컬러/폰트 토큰 확인
3. src/ 하위 모든 .tsx/.ts 파일에서 HEX 하드코딩 검색 (정규식: #[0-9A-Fa-f]{3,8})
   - AppColors에 매칭되는 색상이 하드코딩되어 있으면 위반
   - 외부 라이브러리 파일(node_modules, ui/)은 제외
4. 인라인 style={{}} 사용 검색
5. Tailwind 커스텀 토큰 대신 임의 값 사용 (bg-[#xxx]) 검색
6. 폰트 관련: globals.css에 정의된 font-family 토큰 외 직접 font-family 지정 검색

출력 형식:
### 🎨 Design System Compliance
**위반 수:** N개
| 심각도 | 파일:라인 | 문제 | 권장 수정 |
|--------|----------|------|----------|
| Critical/Major/Minor | 경로:줄번호 | 구체적 위반 내용 | 대체할 토큰 |
```

## Agent 2: DRY Violations (중복 코드)

```
프로젝트의 DRY(Don't Repeat Yourself) 위반을 검사하세요. 코드 수정은 하지 마세요.

검사 기준:
1. src/components/ 내 유사한 JSX 패턴 반복 (10줄+ 유사 블록)
2. src/hooks/ 내 중복 로직 (동일한 useEffect/useState 패턴)
3. src/lib/ 내 유사 유틸 함수
4. 동일한 API 호출 패턴이 여러 곳에 반복
5. 동일한 Tailwind 클래스 조합이 3회 이상 반복 (컴포넌트 추출 가능)
6. 동일한 타입 정의가 여러 파일에 중복

출력 형식:
### 🔄 DRY Violations
**위반 수:** N개
| 심각도 | 위치들 | 중복 내용 | 권장 리팩토링 |
|--------|--------|----------|-------------|
| Major/Minor | 파일1:줄, 파일2:줄 | 무엇이 중복인지 | 공통 추출 방법 |
```

## Agent 3: Dead Code (미사용 코드)

```
프로젝트의 Dead Code를 검사하세요. 코드 수정은 하지 마세요.

검사 기준:
1. 미사용 import 문 (import 했지만 파일 내에서 참조 안 됨)
2. 미사용 변수/함수 (선언했지만 호출/참조 안 됨)
3. 미사용 컴포넌트 파일 (export 했지만 다른 파일에서 import 안 됨)
4. 미사용 타입/인터페이스
5. 주석 처리된 코드 블록 (3줄+)
6. 도달 불가능한 코드 (return/throw 이후 코드)

검사 범위: src/ 하위 전체 (.tsx, .ts 파일)
제외: node_modules/, dist/, src/components/ui/ (shadcn 생성 파일)

출력 형식:
### 💀 Dead Code
**발견 수:** N개
| 심각도 | 파일:라인 | 유형 | 상세 |
|--------|----------|------|------|
| Major/Minor | 경로:줄번호 | import/변수/함수/파일/주석코드 | 구체적 내용 |
```

## Agent 4: Circular Dependencies (순환 참조 / 무한 루프)

```
프로젝트의 순환 참조와 무한 루프 가능성을 검사하세요. 코드 수정은 하지 마세요.

검사 기준:
1. import 순환 참조: A→B→C→A 패턴 (src/ 내 모든 import 관계 추적)
2. useEffect 무한 루프: 의존성 배열에 매 렌더마다 새로 생성되는 값 포함
   - 객체/배열 리터럴이 deps에 직접 들어간 경우
   - useEffect 내에서 deps에 포함된 상태를 업데이트하는 경우
3. 상태 업데이트 순환: setState A → triggers effect → setState B → triggers effect → setState A
4. Zustand 스토어 간 순환 구독
5. useCallback/useMemo deps가 자기 자신을 참조

검사 범위: src/ 하위 전체
제외: node_modules/

출력 형식:
### 🔁 Circular Dependencies
**발견 수:** N개
| 심각도 | 위치 | 유형 | 순환 경로 / 상세 |
|--------|------|------|----------------|
| Critical/Major | 파일:줄 | import순환/useEffect루프/상태순환 | A→B→C→A 등 |
```

## Agent 5: Unnecessary Re-renders (불필요한 리렌더링)

```
React 컴포넌트의 불필요한 리렌더링 가능성을 검사하세요. 코드 수정은 하지 마세요.

검사 기준:
1. 컴포넌트 내부에서 매 렌더마다 새 객체/배열/함수 생성 후 자식에게 props로 전달
   - onClick={() => ...} 인라인 핸들러 (자식이 React.memo인 경우 문제)
   - style={{...}} 인라인 스타일 객체
   - 배열/객체 리터럴을 props로 직접 전달
2. Zustand 스토어 전체 구독 (useStore() 대신 useStore(s => s.field) 사용해야)
3. useEffect 의존성 배열 누락 또는 과다
4. Context Provider의 value에 매 렌더마다 새 객체 전달
5. key prop에 Math.random() 또는 index 사용 (리스트 아이템)
6. 부모 리렌더 시 불필요하게 함께 리렌더되는 무거운 자식 컴포넌트

검사 범위: src/components/, src/pages/, src/hooks/
제외: src/components/ui/ (shadcn 생성 파일)

출력 형식:
### ⚡ Unnecessary Re-renders
**발견 수:** N개
| 심각도 | 파일:라인 | 패턴 | 권장 수정 |
|--------|----------|------|----------|
| Critical/Major/Minor | 경로:줄번호 | 구체적 리렌더 원인 | useMemo/useCallback/memo 등 |
```

## Agent 6: Memory Leaks (메모리 누수)

```
React 애플리케이션의 메모리 누수 가능성을 검사하세요. 코드 수정은 하지 마세요.

검사 기준:
1. useEffect cleanup 누락:
   - addEventListener 후 removeEventListener 없음
   - setInterval/setTimeout 후 clearInterval/clearTimeout 없음
   - WebSocket/EventSource 연결 후 close 없음
   - 구독(subscribe) 후 unsubscribe 없음
2. 비동기 작업:
   - 컴포넌트 언마운트 후 setState 호출 가능성 (AbortController 미사용)
   - fetch/axios 요청 취소 미처리
3. DOM 참조:
   - useRef로 DOM 참조 후 cleanup 미처리
   - 전역 이벤트 리스너 등록 후 미해제
4. Zustand:
   - subscribe() 호출 후 unsubscribe 미처리
5. 타이머/폴링:
   - Polling(3초) 패턴에서 clearInterval 누락

검사 범위: src/ 하위 전체
제외: node_modules/, src/components/ui/

출력 형식:
### 🧠 Memory Leaks
**발견 수:** N개
| 심각도 | 파일:라인 | 유형 | 상세 | 권장 수정 |
|--------|----------|------|------|----------|
| Critical/Major | 경로:줄번호 | cleanup누락/비동기/DOM/타이머 | 구체적 내용 | cleanup 코드 예시 |
```

---

## 결과 통합

6개 에이전트가 모두 완료되면 아래 형식으로 **통합 리포트**를 출력하세요:

```markdown
# 🔍 Parallel Code Review Report

**프로젝트:** moaplace-client (React Frontend)
**검사 일시:** YYYY-MM-DD
**검사 범위:** src/ 하위 전체

---

## 📊 요약

| 영역 | Critical | Major | Minor | 합계 |
|------|----------|-------|-------|------|
| 🎨 Design System | - | - | - | - |
| 🔄 DRY | - | - | - | - |
| 💀 Dead Code | - | - | - | - |
| 🔁 Circular Deps | - | - | - | - |
| ⚡ Re-renders | - | - | - | - |
| 🧠 Memory Leaks | - | - | - | - |
| **합계** | **-** | **-** | **-** | **-** |

---

[각 에이전트의 상세 결과를 순서대로 나열]

---

## 🎯 우선 수정 권장 (Critical → Major 순)

1. ...
2. ...
3. ...
```
````

**Step 3: 변경 확인**

Run: `head -5 .claude/commands/review.md`
Expected: `# Parallel Code Review (React Frontend)` 첫 줄 확인

**Step 4: 커밋**

```bash
git add .claude/commands/review.md
git commit -m "Refactor: /review 커맨드를 6개 병렬 에이전트 디스패치 방식으로 재작성"
```

---

### Task 2: 동작 검증

**Step 1: `/review` 커맨드를 실행하여 6개 에이전트가 병렬 dispatch되는지 확인**

새 세션에서 `/review` 실행. 다음을 확인:
- 6개 Task tool 호출이 **하나의 메시지**에서 동시에 발생하는지
- 각 에이전트가 read-only로 동작하는지 (코드 수정 없음)
- 통합 리포트가 올바른 형식으로 출력되는지

**Step 2: 결과 확인 후 필요 시 프롬프트 미세 조정**

에이전트 출력이 기대와 다르면 review.md의 해당 에이전트 프롬프트를 수정.
