# MoaPlace 프로젝트 문서 설계

> 작성일: 2026-02-27
> 상태: 승인됨

## 목표

PRD 기반으로 AI와 개발자 모두가 참조하는 통합 가이드 문서 6개를 `docs/plans/`에 생성한다.

## 문서 목록 및 생성 순서

1. `01_ARCHITECTURE.md` — 시스템 아키텍처
2. `02_FOLDER_STRUCTURE.md` — 폴더 구조 및 네이밍
3. `03_CODE_CONVENTIONS.md` — 코딩 컨벤션
4. `04_CODE_GENERATION_GUIDE.md` — AI 코드 생성 가이드
5. `05_WIDGETS_GUIDE.md` — 위젯/컴포넌트 가이드 (Toss UI/UX + MoaPlace 컬러 + shadcn/ui)
6. `00_QUICK_REFERENCE.md` — 퀵 레퍼런스 (위 5개 요약 인덱스)

## 접근 방식

- **접근 A: PRD 직접 파생** — PRD 내용을 각 문서 목적에 맞게 재구성
- 코드 생성에 바로 쓸 수 있는 구체적 규칙(네이밍, 패턴, 예시 코드) 추가
- Toss UI/UX 디자인 원칙을 위젯 가이드에 매핑
- MoaPlace 컬러 시스템(18색) 적용
- shadcn/ui 패턴 참고

## 참조 문서

- `docs/PRD.md` — 프로젝트 기획서
- `docs/TOSS_UI_UX_DESIGN.md` — Toss UI/UX 디자인 법칙
- `docs/Moaplace_ColorSystem.md` — MoaPlace 컬러 시스템 v2.1
