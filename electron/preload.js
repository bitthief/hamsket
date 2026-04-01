'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Channel allowlists for security — only these channels can be used from renderer
const SEND_CHANNELS = [
	'autoUpdater:quit-and-install',
	'autoUpdater:check-for-updates',
	'setBadge',
	'setConfig',
	'setDontDisturb',
	'relaunchApp',
	'toggleWin',
	'setServiceNotifications',
];

const SEND_SYNC_CHANNELS = [
	'getConfig',
	'getAppVersionSync',
	'validateMasterPassword',
];

const RECEIVE_CHANNELS = [
	'showAbout',
	'showPreferences',
	'autoUpdater:check-update',
	'autoUpdater:update-not-available',
	'autoUpdater:update-available',
	'autoUpdater:update-downloaded',
	'setBadge',
	'reloadCurrentService',
	'tabFocusNext',
	'tabFocusPrevious',
	'focusTab',
	'tabZoomIn',
	'tabZoomOut',
	'tabResetZoom',
	'toggleDoNotDisturb',
	'lockWindow',
	'nativeTheme:updated',
];

const INVOKE_CHANNELS = [
	'shell:openExternal',
	'dialog:showSave',
	'dialog:showOpen',
	'fs:readFile',
	'fs:writeFile',
	'fs:readBuildVersion',
	'session:clearServiceData',
	'window:reload',
	'app:quit',
	'app:getArgv',
	'app:getUserDataPath',
	'nativeTheme:shouldUseDarkColors',
];

contextBridge.exposeInMainWorld('hamsket', {
	// Sync properties — available immediately at class-definition time
	platform: process.platform,
	arch: process.arch,
	osRelease: require('os').release(),
	versions: {
		electron: process.versions.electron,
		chrome: process.versions.chrome,
		node: process.versions.node,
	},
	appVersion: ipcRenderer.sendSync('getAppVersionSync'),

	// Absolute path to webview preload script
	webviewPreloadPath: path.join(__dirname, '..', 'resources', 'js', 'hamsket-service-api.js'),

	// Config access
	config: {
		get: () => ipcRenderer.sendSync('getConfig'),
		set: (values) => ipcRenderer.send('setConfig', values),
	},

	// IPC bridge — channel-allowlisted
	ipc: {
		send: (channel, ...args) => {
			if (SEND_CHANNELS.includes(channel)) {
				ipcRenderer.send(channel, ...args);
			} else {
				console.warn(`[preload] Blocked send to unauthorized channel: ${channel}`);
			}
		},
		sendSync: (channel, ...args) => {
			if (SEND_SYNC_CHANNELS.includes(channel)) {
				return ipcRenderer.sendSync(channel, ...args);
			}
			console.warn(`[preload] Blocked sendSync to unauthorized channel: ${channel}`);
			return undefined;
		},
		on: (channel, callback) => {
			if (RECEIVE_CHANNELS.includes(channel)) {
				ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
			} else {
				console.warn(`[preload] Blocked listener on unauthorized channel: ${channel}`);
			}
		},
		invoke: (channel, ...args) => {
			if (INVOKE_CHANNELS.includes(channel)) {
				return ipcRenderer.invoke(channel, ...args);
			}
			console.warn(`[preload] Blocked invoke to unauthorized channel: ${channel}`);
			return Promise.reject(new Error(`Unauthorized channel: ${channel}`));
		},
	},

	// Shell
	shell: {
		openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
	},

	// Dialogs
	dialog: {
		showSave: (opts) => ipcRenderer.invoke('dialog:showSave', opts),
		showOpen: (opts) => ipcRenderer.invoke('dialog:showOpen', opts),
	},

	// File system (sandboxed to specific operations)
	fs: {
		readFile: (filePath, encoding) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
		writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
		readBuildVersion: () => ipcRenderer.invoke('fs:readBuildVersion'),
	},

	// Session management
	session: {
		clearServiceData: (partition) => ipcRenderer.invoke('session:clearServiceData', partition),
	},

	// Window control
	window: {
		reload: () => ipcRenderer.invoke('window:reload'),
	},

	// App control
	app: {
		quit: () => ipcRenderer.invoke('app:quit'),
		getArgv: () => ipcRenderer.invoke('app:getArgv'),
	},

	// Paths
	paths: {
		getUserData: () => ipcRenderer.invoke('app:getUserDataPath'),
	},

	// Theme / dark mode
	theme: {
		shouldUseDarkColors: () => ipcRenderer.invoke('nativeTheme:shouldUseDarkColors'),
		onUpdated: (callback) => {
			ipcRenderer.on('nativeTheme:updated', (event, isDark) => callback(isDark));
		},
	},
});
