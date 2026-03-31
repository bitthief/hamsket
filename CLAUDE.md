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
| `@electron/remote` | 2.1.3 | **Deprecated** — migrate to contextBridge/ipcRenderer (Phase 2) |
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
- `main.js` — Window management, IPC handlers, config (electron-store), auto-launch, user-agent spoofing, proxy support, portable mode (data/ folder)
- `menu.js` — Application menu (locale-aware)
- `tray.js` — System tray icon with unread badge (Windows/Linux only)
- `updater.js` — Auto-updater (feed URL: `forcent.io/download/hamsket/update/`, currently disabled in code)

### ExtJS App (`app/`)
Uses classic MVC/MVVM pattern:
- `Application.js` — App entry, locale loading, update checker, zoom handler
- `model/Service.js` — Service config (url, name, custom JS/CSS, unread counter JS, user agent, zoom)
- `model/ServiceList.js` — Built-in service definitions (~95 services)
- `store/Services.js` — User's added services (LocalStorage-backed)
- `store/ServicesList.js` — Built-in service catalog
- `view/main/Main.js` — Main tab panel, bottom toolbar with "Follow us" social links
- `view/main/MainController.js` — Tab/service management logic
- `view/main/About.js` — About dialog (uses `@electron/remote` + `fs` for version info)
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
- **`@electron/remote`:** Used for IPC between renderer and main process. Deprecated; migrate to explicit ipcMain/ipcRenderer with contextBridge in Phase 2.
- **User-agent spoofing:** `electron/main.js` strips Electron/Hamsket from the user agent to avoid service detection/blocking. Google accounts get a hardcoded Firefox UA via `session.webRequest.onBeforeSendHeaders`.
- **Portable mode:** If a `data/` folder exists next to the app, userData/logs/cache redirect there.
- **Locale system:** Language files in `resources/languages/`, loaded via script injection in `index.html` using `ipcRenderer.sendSync`.
- **Unread counters:** Each service has a `js_unread` field containing JavaScript that runs inside the webview to extract unread counts. Service-specific and fragile — breaks when services change their DOM.
- **DarkReader integration:** Dark theme support added via DarkReader library.
- **ESM dependency:** `electron-context-menu` 4.x is pure ESM — loaded via `await import()` in the `app.on('ready')` handler, before any windows are created.

### ExtJS Framework Management
- **Framework is gitignored.** Upgrade via: `sencha app upgrade --minimal -ext@X.Y.Z`
- After upgrade: rename directory to match version, update `path` in `workspace.json`
- **Trial watermark fix (required after each upgrade):**
  1. Set `$ext-trial: false` in `ext-X.Y.Z/classic/theme-base/sass/etc/all.scss` and `ext-X.Y.Z/modern/theme-base/sass/etc/all.scss`
  2. The `npm run patch-license` step (auto-runs during compile) patches the built `app.json`/`app.jsonp` to replace `"license":"trial"` with `"license":"commercial"` and removes watermark resources

## Completed Work (This Session)

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

## Planned Work (Priority Order)

### Phase 2: Security Hardening (High Priority)
Major refactor of renderer↔main process communication. All changes are interdependent — do as one batch.

**Create preload script (`electron/preload.js`):**
- Use `contextBridge.exposeInMainWorld('hamsket', { ... })` to expose safe API
- Expose: `getConfig()`, `getVersion()`, `getPlatform()`, `getArch()`, `getProcessVersions()`, `send()`, `on()`, `invoke()`

**Update `electron/main.js` webPreferences:**
- Set `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Add `preload: path.join(__dirname, 'preload.js')`
- Convert `ipcMain.on('getConfig')` sync handler to `ipcMain.handle('getConfig')` async handler

**Migrate renderer code (all files that use `require('electron')` or `require('@electron/remote')`):**
- `app.js` — replace `require('electron').ipcRenderer` with `window.hamsket.*` bridge API
- `app/Application.js` — replace `require('@electron/remote').app.getVersion()` / `process.argv`
- `app/view/main/About.js` — replace `require('@electron/remote').app.getVersion()`, `require('fs').readFileSync`
- `app/ux/FileBackup.js` — replace `require('@electron/remote')` for path/fs/dialog
- `app/ux/WebView.js` — replace `require('@electron/remote')` for shell/getCurrentWindow/process
- `app/view/main/MainController.js` — replace `require('@electron/remote')` for session
- `app/view/preferences/PreferencesController.js` — replace IPC calls
- `app/view/preferences/Preferences.js` — replace config access
- `index.html` — replace inline `require('electron').ipcRenderer.sendSync('getConfig')`

**Fix service webview preload (`resources/js/hamsket-service-api.js`):**
- Replace `require('electron').ipcRenderer` with contextBridge-exposed API
- The `Notification` override and `atob`/`btoa` polyfills need careful handling

**Remove `@electron/remote` dependency entirely** after all migrations complete.

### Phase 3: Fork Identity & Infrastructure
- Update `electron-builder.json` — change app ID from `com.thegoddessinari.hamsket` to own
- Update `package.json` — author, repository URL, bugs URL, homepage to bitthief/hamsket
- Update `app/Application.js` — change update check URL from TheGoddessInari's GitHub to this fork
- Update `app/view/main/About.js` — GitHub link to this fork
- Update `app/view/main/Main.js` — Follow us social links to this fork's URLs
- Update `electron/menu.js` — help menu links (Gitter, GitHub, social media)
- Set up GitHub Actions CI/CD (build + release for Windows/Linux/macOS)
- Configure auto-updater at `forcent.io/download/hamsket/update/`

### Phase 4: Dark Mode
- ExtJS panels/toolbars don't follow system dark mode (the service list panel has white background)
- DarkReader integration exists but is partial — investigate what's working and what's not
- May need theme-level SCSS changes for `$dark-mode` variable (already defined in theme vars)
- Electron 35 has good `nativeTheme` API — wire it to ExtJS theme switching

### Phase 5: Service List & UX Modernization
- Audit built-in service list (~95 services) — many have changed URLs or no longer exist
- Review and update `js_unread` counter snippets for active services
- Replace deprecated `<webview>` tag with WebContentsView (Electron's modern replacement)
- Add ability to reorder services via drag-and-drop
- Consider adding service categories/folders

### Known Issues (Low Priority)
- SASS build shows ENOENT errors for theme images with `undefined` path segment (cosmetic, no impact)
- `hamsket-service-api.js` overrides `window.atob`/`window.btoa` — verify if still needed on Electron 35
- `workspace.json` has stale `ext70`/`ext77` aliases removed but directory is named `ext-7.9.0` while it was originally `ext-7.7.0` — fully clean now

## Code Style
- No linter configured (no eslintrc). `.editorconfig` existed historically but was removed.
- Prettier is a dev dependency but no config file or pre-commit hook.
- ExtJS code follows Sencha conventions (Ext.define, xtype, configs, etc.).
- Electron code is CommonJS (`require`/`module.exports`), except `electron-context-menu` which is ESM (dynamic import).
