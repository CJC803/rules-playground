# Feature Flag Rules Playground

A tiny **Vite + Vanilla TypeScript** single-page app (no frameworks, no external UI libs) that lets you tweak a `Context` and instantly see an **ENABLED / DISABLED** decision, plus the **human-readable reason** and **rule id** that fired.

Rules are evaluated **top-to-bottom** and the **first match wins** (otherwise fallback).

---

## How to run

```bash
npm install
npm run dev
