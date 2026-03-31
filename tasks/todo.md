# Viewer Reading Modes Refresh

## Todo

- [x] Update persisted viewer mode types and legacy migration for `facing`.
- [x] Apply default zoom and default view mode when opening a new PDF tab.
- [x] Split facing-page rendering into `two-page` and `book` spread behaviors.
- [x] Add temporary viewer shell modes for `read`, `fullscreen`, and `slideshow`.
- [x] Add floating minimal controls and restore hidden chrome state when exiting temporary modes.
- [x] Wire ribbon actions, keyboard shortcuts, and Electron view menu events for the new modes.
- [x] Update English and Indonesian labels plus shortcut help text for the new viewer modes.
- [x] Add focused tests and run targeted verification.

## Review

- Added a shared viewer mode helper so `facing` now migrates to `book`, and all persisted/runtime view-mode writes normalize through one place.
- New PDF tabs now honor the saved default zoom and default layout mode instead of always opening in the hardcoded continuous view.
- Spread rendering now supports two distinct layouts: `two-page` for `1-2, 3-4, ...` and `book` for `1`, then `2-3, 4-5, ...`.
- Viewer shell modes now support `read`, `fullscreen`, and `slideshow` without moving temporary chrome state into the tab store.
- Read mode hides the ribbon and sidebars while preserving their previous state; fullscreen uses the viewer container’s Fullscreen API; slideshow forces single-page + fit-to-page and restores the prior page/layout/zoom on exit.
- Added floating minimal controls for temporary viewer modes with previous/next, page indicator, zoom controls, and an exit action.
- Wired `F11` to viewer fullscreen, `F5` to slideshow, and `Ctrl+Alt+R` to read mode, plus Electron View menu events for fullscreen and slideshow.
- Updated English and Indonesian labels, settings options, shortcut dialogs, and shortcut-store defaults for the new modes.
- Added focused store tests covering legacy migration and spread-aware navigation.
- Verification: `npx vitest run src/renderer/store/settings-store.test.ts src/renderer/store/pdf-store.test.ts` passed.
- Verification note: `npm run type-check` still fails because of pre-existing repo-wide TypeScript errors outside this feature; filtering the compiler output showed no TypeScript errors in the files changed for this viewer-mode work.
