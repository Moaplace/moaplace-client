# /commit 커맨드 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/commit` 슬래시 커맨드로 변경사항을 기능별 분리 커밋하는 자동화 커맨드 생성

**Architecture:** `.claude/commands/commit.md`에 커맨드 정의. 브랜치 이름에서 이슈 번호/타입 자동 추출, 변경사항을 기능 단위로 그룹핑 후 순차 커밋.

**Tech Stack:** Claude Code slash commands, Git

---

### Task 1: 커맨드 파일 생성

**Files:**
- Create: `.claude/commands/commit.md`

**완료 기준:**
- `/commit` 실행 시 변경사항 분석 → 기능별 분리 커밋
- 브랜치 이름에서 이슈 번호 자동 추출 (`feature/#12-xxx` → `#12`)
- Co-Authored-By 태그 절대 미포함
- push 절대 금지
- 커밋 메시지 형식: `<Type>: <한글 설명> <#이슈번호>`

**Status:** DONE
