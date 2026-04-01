# Hamsket - CLAUDE.md

## Project Overview

Hamsket is a messaging aggregator desktop app (like Franz/Rambox) built with **Electron + ExtJS**. It embeds multiple web services (Slack, WhatsApp, Telegram, Gmail, etc.) as webview tabs in a single window.

**Lineage:** Rambox Community Edition → Hamsket (TheGoddessInari fork) → this fork (bitthief).
The original dev went inactive; this fork initially upgraded Electron/Chromium for security, then began a larger revamp including ExtJS 7 migration.

## Git Remotes & Branches

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | TheGoddessInari/hamsket | Original Hamsket fork (upstream of our fork) |
| `downstream` | bitthief/hamsket | **Our fork** — push here |
| `upstream` | ramboxapp/community-edition | Original Rambox (historical reference only) |

- `master` branch = our working branch (includes commits beyond origin/master)
- `downstream/master` = our GitHub fork (may lag behind local master by a few commits)
- `origin/master` = TheGoddessInari's last release (Electron 20, hasn't been updated)

## Tech Stack & Versions (Current State)

### Runtime Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| `auto-launch` | 5.0.6 | Auto-start on system boot |
| `electron-context-menu` | 4.1.2 | Right-click context menus (ESM, loaded via dynamic import in ready handler) |
| `electron-store` | 8.1.0 | Persistent config storage |
| `mime` | 3.0.0 | MIME type detection |
| `tmp` | 0.2.1 | Temporary file handling |

### Dev Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| `electron` | 35.7.5 | Chromium 134 |
| `electron-builder` | 26.8.1 | Packaging tool |
| `@electron/asar` | 3.2.7 | ASAR archive support |
| `mocha` | 10.2.0 | Test runner |
| `chai` | 5.0.0-alpha.0 | Assertion library |
| `prettier` | 3.0.3 | Code formatter (no config file) |
| `shx` | 0.3.4 | Cross-platform shell commands |
| `crowdin` | 3.5.0 | Translation management |
| `csvjson` | 5.1.0 | CSV/JSON conversion |

### Framework & Build Tools
| Component | Version | Notes |
|-----------|---------|-------|
| **ExtJS** | 7.9.0.20 | Classic toolkit. Framework in `ext-7.9.0/` (gitignored) |
| **Sencha Cmd** | 7.9.0.35 | Build tool. Ensure this version is first in PATH |
| **Node.js** | >=18.0.0 (package.json engine), v25.8.2 installed locally | |
| **App version** | 0.6.5 | |

## Architecture

### Electron Main Process (`electron/`)
- `main.js` — Window management, IPC handlers (ipcMain.handle/on), config (electron-store), auto-launch, user-agent spoofing, proxy support, portable mode (data/ folder)
- `preload.js` — contextBridge-based safe API (`window.hamsket.*`), channel allowlists for send/receive/invoke
- `menu.js` — Application menu (locale-aware)
- `tray.js` — System tray icon with unread badge (Windows/Linux only)
- `updater.js` — Auto-updater (feed URL: `forcent.io/download/hamsket/update/`, currently disabled in code)

### ExtJS App (`app/`)
Uses classic MVC/MVVM pattern:
- `Application.js` — App entry, locale loading, update checker, zoom handler
- `model/Service.js` — Service config (url, name, custom JS/CSS, unread counter JS, user agent, zoom)
- `model/ServiceList.js` — Built-in service definitions (~76 services)
- `store/Services.js` — User's added services (LocalStorage-backed)
- `store/ServicesList.js` — Built-in service catalog
- `view/main/Main.js` — Main tab panel, bottom toolbar with "Follow us" social links
- `view/main/MainController.js` — Tab/service management logic
- `view/main/About.js` — About dialog (uses `window.hamsket.*` bridge for version info)
- `view/add/Add.js` — Add/edit service dialog
- `view/preferences/Preferences.js` — Settings dialog
- `ux/WebView.js` — Custom webview wrapper panel (core component)
- `util/UnreadCounter.js` — Aggregates unread counts across services
- `util/Notifier.js` — Desktop notification dispatch

### Theme & Icons
- `packages/local/hamsket-default-theme/` — Custom ExtJS theme (extends theme-crisp)
- Font Awesome 5 is the icon font — **brand icons** (Facebook, Twitter, GitHub) require `Font Awesome 5 Brands` font family, not the default `Font Awesome 5 Free`
- Default glyph font set in `app.js`: `Ext.setGlyphFontFamily("'Font Awesome 5 Free'")`
- **Brand icons** (Facebook, Twitter, GitHub) must use `iconCls: 'x-fab fa-{name}'` — the `glyph` string format doesn't reliably work with the Brands font family

### Key Directories
```
ext-7.9.0/          # ExtJS 7.9.0 framework (active, gitignored)
packages/local/      # Local Sencha packages (theme, calendar, pivot, etc.)
resources/           # Icons, images, language files (30+ locales)
resources/css/       # Runtime CSS overlays (dark-mode.css)
sass/                # App-level SASS styles
overrides/           # ExtJS framework overrides
test/                # Mocha + Chai tests (minimal — one example spec)
```

## Build System

### Prerequisites
- Node.js v18+
- Sencha Cmd 7.9.0.35 installed and in PATH (`sencha` command)
- ExtJS 7.9.0 SDK in `ext-7.9.0/` (gitignored — see upgrade instructions below)
- `npm install` for dependencies

### Build Commands
```bash
# Development
npm run compile          # sencha app build + copy deps + buildversion + patch-license
npm start                # compile + launch in Electron
npm run debug            # launch with --inspect (must compile first)

# Full release
npm run setup:win64      # clean + compile + build Windows x64 installer
npm run setup:linux64    # clean + compile + build Linux x64 package
npm run setup:osx        # clean + compile + build macOS DMG

# Incremental
npm run recompile        # distclean + compile
npm run repack:win64     # clean + compile + distclean + pack (unpacked, faster)

# Testing
npm test                 # mocha test/tests/**/*.spec.js
```

### Build Flow
1. `sencha app build` — compiles ExtJS app (JS/CSS bundling, SASS compilation)
2. Copy `package.json` + `package-lock.json` to build output
3. Generate `BUILDVERSION` file from git info
4. `patch-license` — replaces `"license":"trial"` → `"license":"commercial"` in `app.json`/`app.jsonp`, removes `ext-watermark` resources

### Build Output
- `build/production/Hamsket/` — Compiled app (ready for Electron)
- `dist/` — Platform installers (electron-builder output)

## Configuration

### workspace.json
Defines ExtJS framework path. Points `ext` → `ext-7.9.0/`.

### app.json
ExtJS app manifest — theme, classpath, toolkit (classic), requires (ext-locale), production build settings (closure compiler).

### .sencha/ (removed by --minimal upgrade)
Previously contained Sencha Cmd scaffolding. Removed during `sencha app upgrade --minimal`. Build reads config from `workspace.json` and `app.json` directly.

### electron-builder.json
Packaging config — app ID `com.thegoddessinari.hamsket`, ASAR enabled, platform-specific installer settings.

### electron-store (runtime)
User preferences persisted at runtime: window behavior, proxy, locale, master password, tray settings, etc.

## Key Patterns & Gotchas

- **Webview usage:** The app uses Electron's `<webview>` tag for embedding services. Deprecated but still functional with `webviewTag: true` in webPreferences.
- **contextBridge API:** All renderer↔main IPC goes through `window.hamsket.*` (exposed via `electron/preload.js`). `@electron/remote` has been fully removed.
- **User-agent spoofing:** `electron/main.js` strips Electron/Hamsket from the user agent to avoid service detection/blocking. Google accounts get a hardcoded Firefox UA via `session.webRequest.onBeforeSendHeaders`.
- **Portable mode:** If a `data/` folder exists next to the app, userData/logs/cache redirect there.
- **Locale system:** Language files in `resources/languages/`, loaded via `window.hamsket.config.getSync()` in `index.html`.
- **Unread counters:** Each service has a `js_unread` field containing JavaScript that runs inside the webview to extract unread counts. Service-specific and fragile — breaks when services change their DOM. WhatsApp now uses IndexedDB instead of DOM selectors. Gmail uses `document.title` regex as primary method. Discord uses `[class*="..."]` selectors with both underscore and dash suffixes for resilience. Telegram supports both Web K and Web A clients. Ferdium recipes repo (`github.com/ferdium/ferdium-recipes`) is the best reference for keeping selectors current.
- **Dark mode:** Runtime CSS overlay (`resources/css/dark-mode.css`) toggled via `.hamsket-dark` body class. Injected dynamically by `MainController.setDarkClass()` to ensure it loads after ExtJS framework CSS. Config key: `dark_mode` (`'system'`/`'light'`/`'dark'`).
- **ESM dependency:** `electron-context-menu` 4.x is pure ESM — loaded via `await import()` in the `app.on('ready')` handler, before any windows are created.

### ExtJS Framework Management
- **Framework is gitignored.** Upgrade via: `sencha app upgrade --minimal -ext@X.Y.Z`
- After upgrade: rename directory to match version, update `path` in `workspace.json`
- **Shared SDK location:** A stable copy of the SDK lives at `C:\Users\Administrator\Code\hamsket-shared\ext-7.9.0`. Both the main repo and all worktrees create NTFS junctions to this shared copy. This protects the Sencha Cmd cache (`~\bin\Sencha\Cmd\repo\extract\ext\`) from accidental deletion when cleaning up worktrees.
- **Worktree setup:** `cmd /c "mklink /J ext-7.9.0 C:\Users\Administrator\Code\hamsket-shared\ext-7.9.0"`
- **DANGER:** Never use `rm -rf` or recursive delete on an `ext-7.9.0` junction — it will follow the junction and destroy the shared SDK. Use `rmdir ext-7.9.0` (Windows) or `cmd /c "rmdir ext-7.9.0"` (Git Bash) to safely remove only the junction.
- **Trial watermark fix (required after each upgrade or SDK re-extract):**
  1. Set `$ext-trial: false` in `ext-X.Y.Z/classic/theme-base/sass/etc/all.scss` and `ext-X.Y.Z/modern/theme-base/sass/etc/all.scss`
  2. The `npm run patch-license` step (auto-runs during compile) patches the built `app.json`/`app.jsonp` to replace `"license":"trial"` with `"license":"commercial"` and removes watermark resources
  3. **Check after worktree creation:** If ext-7.9.0 doesn't exist or is empty, re-create the junction and verify `$ext-trial: false` is set

## Completed Work

### Phase 1: Core Upgrades
- Electron 27.0.0 → **35.7.5** (Chromium 134)
- electron-builder 24.6.4 → **26.8.1**
- electron-context-menu 3.6.1 → **4.1.2** (ESM migration via dynamic import)
- @electron/remote 2.0.12 → **2.1.3**
- ExtJS 7.7.0 → **7.9.0.20**
- Sencha Cmd config 7.7.0 → **7.9.0.35**
- Removed `spectron` (abandoned), `ext-7.0.0/` (dead weight)
- Fixed: `enableRemoteModule` removal, `shell.openItem` → `openPath`, callback→promise APIs
- Fixed: webview `webpreferences` string (removed deprecated options)
- Fixed: trial watermark (SCSS `$ext-trial` + automated `patch-license` build step)
- Fixed: `updateTotalNotifications` race condition at startup
- Fixed: updater URL → forcent.io
- UI polish: service list text overflow, About dialog sizing, notification info box layout, Follow us brand icons

### Phase 2: Security Hardening
- Created `electron/preload.js` with `contextBridge.exposeInMainWorld('hamsket', ...)` safe API
- Channel allowlists: SEND_CHANNELS, SEND_SYNC_CHANNELS, RECEIVE_CHANNELS, INVOKE_CHANNELS
- Set `contextIsolation: true`, `nodeIntegration: false` in main window webPreferences
- Added `ipcMain.handle()` async handlers for shell, dialog, fs, session, paths, window ops
- Migrated all renderer code from `require('electron')`/`require('@electron/remote')` to `window.hamsket.*`:
  - `app.js`, `Application.js`, `About.js`, `FileBackup.js`, `WebView.js`, `MainController.js`, `Preferences.js`
  - `index.html`, `masterpassword.html`
- Migrated `resources/js/hamsket-service-api.js` to use contextBridge preload API
- Migrated `resources/js/hamsket-modal-api.js` to use contextBridge preload API
- Removed `@electron/remote` dependency entirely
- Fixed: default toolbar green background (#31B96E → #fff) that leaked into tab context menus
- Fixed: About dialog height for long BuildVersion strings
- Updated all 40+ locale files to use `window.hamsket.config.getSync()` instead of `ipcRenderer.sendSync`

### Phase 3: Dark Mode
- Created `resources/css/dark-mode.css` — runtime CSS overlay scoped under `.hamsket-dark` body class
- Added `dark_mode` config key (values: `'system'`, `'light'`, `'dark'`, default: `'system'`)
- Added `nativeTheme:shouldUseDarkColors` IPC handler and `nativeTheme:updated` broadcast
- Exposed `window.hamsket.theme.shouldUseDarkColors()` and `window.hamsket.theme.onUpdated()` in preload
- `MainController.applyDarkMode()` toggles body class, dynamically injects CSS after ExtJS framework CSS
- Added Dark Mode dropdown (Auto/Light/Dark) in Preferences with live preview on change
- Dark theme covers: panels, windows, toolbars, tab bar, grids, forms, menus, buttons, tooltips, scrollbars, bottom bar
- Key lesson: dark-mode.css must use `!important` on background/border overrides because the ExtJS microloader injects framework CSS dynamically, defeating cascade order

### Phase 4: Service List & UX Modernization
- **Service audit:** Removed 29 defunct services (HipChat, Hangouts, Stride, ICQ, TweetDeck, Freenode, etc.), updated URLs (Discord, Google Chat, RingCentral), re-categorized social/productivity services
- **New services added (9):** Threads, Bluesky, ChatGPT, Claude, Gemini, Notion, Linear, Figma, Signal — with placeholder color-block icons in `resources/icons/`
- **Service categories:** Added `social`, `ai`, `productivity` types alongside existing `messaging`/`email`/`custom`. Category filter checkboxes in the home tab service panel. Color-coded category badges on service tiles (`.service-type-badge` CSS).
- **Icon fallback:** Added `onerror` handler on all `<img>` tags in service list templates — missing icons now show `resources/icons/custom.png` instead of broken image
- **js_unread updates:** WhatsApp (IndexedDB approach, no longer DOM-based), Slack (descendant selector), Discord (underscore+dash fallback, title-based indirect), Gmail (title regex primary, `.aim` fallback), Telegram (Web K + Web A dual support), Microsoft Teams (added new `.fui-Badge` counter)
- **Drag-and-drop polish:** CSS transitions, opacity, box-shadow on dragged tabs + dark mode variant
- **WebContentsView migration: DEFERRED** — `<webview>` works in Electron 35, migration would be 40-60 hours with ExtJS layout incompatibility as main blocker. Revisit when Electron announces deprecation timeline.
- Final service count: 76 (46 messaging, 18 email, 5 social, 3 AI, 3 productivity, 1 custom)

## Planned Work (Priority Order)

### Phase 5: Fork Identity & Infrastructure (next)
- Update `electron-builder.json` — change app ID from `com.thegoddessinari.hamsket` to own
- Update `package.json` — author, repository URL, bugs URL, homepage to bitthief/hamsket
- Update `app/Application.js` — change update check URL from TheGoddessInari's GitHub to this fork
- Update `app/view/main/About.js` — GitHub link to this fork
- Update `app/view/main/Main.js` — Follow us social links to this fork's URLs
- Update `electron/menu.js` — help menu links (Gitter, GitHub, social media)
- Set up GitHub Actions CI/CD (build + release for Windows/Linux/macOS)
- Configure auto-updater at `forcent.io/download/hamsket/update/`

### Known Issues (Low Priority)
- SASS build shows ENOENT errors for theme images with `undefined` path segment (cosmetic, no impact)
- `ext-7.9.0/` is gitignored — worktrees need an NTFS junction (see ExtJS Framework Management above)
- New service icons (Threads, Bluesky, ChatGPT, etc.) are solid-color placeholders — replace with proper branded icons
- Test suite fails due to leftover `spectron` import in `test/helpers/HamsketTestHelper.js` (spectron was removed in Phase 1)
- `js_unread` scripts should be manually verified against live services periodically — DOM selectors change without notice

## Code Style
- No linter configured (no eslintrc). `.editorconfig` existed historically but was removed.
- Prettier is a dev dependency but no config file or pre-commit hook.
- ExtJS code follows Sencha conventions (Ext.define, xtype, configs, etc.).
- Electron main process and preload are CommonJS (`require`/`module.exports`), except `electron-context-menu` which is ESM (dynamic import).
- Renderer code accesses Electron APIs exclusively through `window.hamsket.*` (never `require('electron')`).
