# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

moaplace-client is a React 19 + TypeScript client application built with Vite 7.

## Commands

- **Dev server**: `npm run dev`
- **Build**: `npm run build` (runs `tsc -b && vite build`)
- **Lint**: `npm run lint` (ESLint v9 flat config)
- **Preview production build**: `npm run preview`

## Tech Stack

- **React 19** with TypeScript 5.9
- **Vite 7** for bundling and dev server
- **Plain CSS** for styling (no preprocessor or utility framework)
- **ESLint 9** with flat config (`eslint.config.js`), includes react-hooks and react-refresh plugins

## Architecture

Currently a minimal scaffold. Entry flow: `index.html` → `src/main.tsx` → `src/App.tsx`.

No routing, state management, or API layer is configured yet. All TypeScript strict options are enabled.
