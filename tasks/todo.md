# Presenter Mode for External Display

## Todo

- [x] Add main-process presenter session management with external display detection, presenter window lifecycle, and cleanup when displays change.
- [x] Extend the preload bridge with presenter APIs for external display list, start/stop actions, and presenter status or availability events.
- [x] Add renderer presenter state in the laptop app for availability, active session binding, and auto-stop when the source tab changes or closes.
- [x] Add a simple monitor picker flow and a `Presenter Mode` control that only appears when a non-primary display is available.
- [x] Add laptop-only stopwatch UI for active presenter sessions, starting paused and resetting automatically when presenter mode stops.
- [x] Add presenter renderer mode so the second window shows only the active PDF page in fullscreen, single-page, fit-to-screen mode without normal app chrome.
- [x] Sync page navigation from the bound laptop tab to the presenter window without syncing laptop zoom, layout, or toolbar state.
- [x] Preserve the existing `Slide Show` behavior and run focused verification for presenter start, stop, tab binding, and display-removal cleanup.

## Notes

- External display means any monitor other than the primary display.
- Stopwatch starts in paused state and resets automatically when presenter mode ends.
- v1 supports only one presenter window at a time.

## Review

- Added presenter session handling in the Electron main process, including external-display detection based on non-primary monitors, second-window lifecycle management, presenter bootstrap payload delivery, and cleanup when the active display disappears.
- Extended the preload bridge with presenter APIs and events so the laptop renderer can query displays, start or stop presenter mode, sync page changes, and observe presenter availability or session status.
- Added a dedicated presenter renderer entry path that boots into a clean fullscreen page-only experience, loads the PDF from bytes, and keeps the current page fit to the projector window.
- Added laptop-side presenter state in the main app, including monitor picker dialog, source-tab binding, page-sync behavior, auto-stop when the bound tab changes or closes, and a stopwatch that starts paused and resets when presenter mode ends.
- Added `Presenter Mode` and `Stop Presenter` controls to the existing ribbon without changing the existing `Slide Show` flow.
- Verification:
- `npm run build:electron` passed.
- `npm run build:vite` passed.
- `npx vitest run src/renderer/components/PDFViewer.test.tsx` passed.
- `npx tsc --noEmit --pretty false` still reports pre-existing repo-wide errors in unrelated files, but a filtered follow-up check returned no TypeScript errors for the files changed in this presenter-mode work.
