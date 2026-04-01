'use strict';

const { app, protocol, BrowserWindow, dialog, shell, Menu, ipcMain, nativeImage, nativeTheme, session } = require('electron');

// Tray
const tray = require('./tray');
// AutoLaunch
const AutoLaunch = require('auto-launch');
// Configuration
const Config = require('electron-store');
// Updater
const updater = require('./updater');
// File System
const fs = require('fs');
const path = require('path');
// Context menu
let contextMenu;

// If 'data' folder exists in Hamsket's folder, set userdata, logs, and usercache path to there
var basepath = app.getAppPath();
if (fs.existsSync(path.join(basepath, 'data'))) {
	app.setPath('userData', path.join(basepath, 'data', 'data'));
	app.setPath('logs', path.join(basepath, 'data', 'logs'));
	app.setPath('userCache', path.join(basepath, 'data', 'cache'));
}

// Initial Config
const config = new Config({
	 defaults: {
		 always_on_top: false
		,hide_menu_bar: false
		,tabbar_location: 'top'
		,window_display_behavior: 'taskbar_tray'
		,auto_launch: false
		,flash_frame: true
		,window_close_behavior: 'keep_in_tray'
		,start_minimized: false
		,systemtray_indicator: true
		,master_password: false
		,dont_disturb: false
		,disable_gpu: false
		,ignore_gpu_blacklist: true
		,proxy: false
		,proxyHost: ''
		,proxyPort: ''
		,proxyLogin: ''
		,proxyPassword: ''
		,locale: 'en'
		,enable_hidpi_support: false
		,dark_mode: 'system'
		,default_service: 'hamsketTab'
		,x: undefined
		,y: undefined
		,width: 1000
		,height: 800
		,maximized: false
	}
});

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Fix issues with HiDPI scaling on Windows platform
if (config.get('enable_hidpi_support') && (process.platform === 'win32')) {
	app.commandLine.appendSwitch('high-dpi-support', 'true');
	app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

// Ignore GPU blacklist
if ( config.get('ignore_gpu_blacklist') )
	app.commandLine.appendSwitch('ignore-gpu-blacklist');

// This must match the package name in package.json
app.setAppUserModelId('com.thegoddessinari.hamsket');

app.userAgentFallback = app.userAgentFallback.replace(`Electron/${process.versions.electron}`, ``).replace(`Hamsket/${app.getVersion()}`, ``);

// Menu
const appMenu = require('./menu')(config);

// Configure AutoLaunch
const appLauncher = new AutoLaunch({ name: 'Hamsket', isHidden: config.get('start_minimized') });
appLauncher.isEnabled().then((isEnabled) => {
	if (config.get('auto_launch') && !isEnabled) {
		appLauncher.enable();
	} else if (!config.get('auto_launch') && isEnabled) {
		appLauncher.disable();
	}
	return;
}).catch((err) => { console.log(err); });

// Set native theme properties
nativeTheme.themeSource = 'system';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let isQuitting = false;

function createWindow () {
	// Create the browser window using the state information
	mainWindow = new BrowserWindow({
		 title: 'Hamsket'
		,icon: nativeImage.createFromPath(path.join(app.getAppPath(), '/resources/Icon.' + (process.platform === 'linux' ? 'png' : 'ico')))
		,backgroundColor: nativeTheme.shouldUseDarkColors? '#000' : '#FFF'
		,x: config.get('x')
		,y: config.get('y')
		,width: config.get('width')
		,height: config.get('height')
		,alwaysOnTop: config.get('always_on_top')
		,autoHideMenuBar: config.get('hide_menu_bar')
		,skipTaskbar: config.get('window_display_behavior') === 'show_trayIcon'
		,show: !config.get('start_minimized')
		,acceptFirstMouse: true
		,webPreferences: {
			partition: 'persist:hamsket',
			contextIsolation: true,
			sandbox: false,
			nodeIntegration: false,
			webviewTag: true,
			spellcheck: false,
			preload: path.join(__dirname, 'preload.js'),
		}
	});

	if ( !config.get('start_minimized') && config.get('maximized') )
		mainWindow.maximize();

	if ( config.get('start_minimized') ) {
		if (config.get('window_display_behavior') == 'show_taskbar')
			mainWindow.webContents.once('did-finish-load', (e) => { mainWindow.minimize(); })
		else
			mainWindow.webContents.once('did-finish-load', (e) => { mainWindow.hide(); });
	}

	// Check if the window its outside of the view (ex: multi monitor setup)
	const { positionOnScreen } = require('./utils/positionOnScreen');
	const inBounds = positionOnScreen([config.get('x'), config.get('y')]);
	if ( inBounds ) {
		mainWindow.setPosition(config.get('x'), config.get('y'));
	} else {
		mainWindow.center();
	}

	process.setMaxListeners(10000);

	// and load the index.html of the app
	mainWindow.loadURL('file://' + __dirname + '/../index.html');

	Menu.setApplicationMenu(appMenu);

	tray.create(mainWindow, config);

	if ( fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'Update.exe')) && process.argv.indexOf('--without-update') === -1 )
		updater.initialize(mainWindow);

	// Open links in default browser
	mainWindow.webContents.setWindowOpenHandler((details) => {
		const { URL } = require('url');
		const url = new URL(details.url);
		const protocol = url.protocol;
		switch (details.disposition) {
			case 'new-window': {
				return {
					action: 'allow',
					overrideBrowserWindowOptions: {
						show: true,
					}
				};
			}
			case 'foreground-tab': {
				if (protocol === 'file:' || protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'zoom:' || protocol === 'slack:' || protocol === 'skype:' || protocol === 'teams:') {
					shell.openExternal(url.href);
					return { action: 'allow' };
				}

				console.log("Blocked by 'setWindowOpenHandler': " + url.href);
				return { action: 'deny' };
			}
			default: {
				console.log("Blocked by 'setWindowOpenHandler': " + url.href);
				return { action: 'deny' };
			}
		}
	});

	mainWindow.webContents.on('did-create-window', (childWindow, { url, frameName, options, disposition }) => {
  		const win = childWindow;
  		win.once('ready-to-show', () => { win.show(); });
  		win.loadURL(url);
	});
	mainWindow.webContents.on('will-navigate', (event, url) => { event.preventDefault(); });

	// BrowserWindow events
	mainWindow.on('page-title-updated', (e, title) => { updateBadge(title); });
	mainWindow.on('maximize', (e) => { config.set('maximized', true); });
	mainWindow.on('unmaximize', (e) => { config.set('maximized', false); });
	mainWindow.on('resize', (e) => { if (!mainWindow.isMaximized()) config.set(mainWindow.getBounds()); });
	mainWindow.on('move', (e) => { if (!mainWindow.isMaximized()) config.set(mainWindow.getBounds()); });
	mainWindow.on('app-command', (e, cmd) => {
		// Navigate the window back when the user hits their mouse back button
		if ( cmd === 'browser-backward' )
			mainWindow.webContents.executeJavaScript('if(Ext.cq1("app-main")) { Ext.cq1("app-main").getActiveTab().goBack(); }');
		// Navigate the window forward when the user hits their mouse forward button
		if ( cmd === 'browser-forward' )
			mainWindow.webContents.executeJavaScript('if(Ext.cq1("app-main")) { Ext.cq1("app-main").getActiveTab().goForward(); }');
	});

	// Emitted when the window is closed
	mainWindow.on('close', (e) => {
		if ( !isQuitting ) {
			e.preventDefault();

			switch (process.platform) {
				case 'darwin':
					app.hide();
					break;
				default:
					switch (config.get('window_close_behavior')) {
						case 'keep_in_tray':
							mainWindow.hide();
							break;
						case 'keep_in_tray_and_taskbar':
							mainWindow.minimize();
							break;
						case 'quit':
							app.quit();
							break;
					}
					break;
			}
		}
	});

	mainWindow.on('closed', (e) => { mainWindow = null; });
	mainWindow.once('focus', () => { mainWindow.flashFrame(false); });
}

let mainMasterPasswordWindow;
function createMasterPasswordWindow() {
	mainMasterPasswordWindow = new BrowserWindow({
		 backgroundColor: '#0675A0'
		,frame: false
		,webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
		}
	});
	mainMasterPasswordWindow.loadURL('file://' + __dirname + '/../masterpassword.html');
	mainMasterPasswordWindow.on('close', () => { mainMasterPasswordWindow = null; });
}

function updateBadge(title) {
	title = title.split(" - ")[0];
	//Discard service name if present, could also contain digits
	let messageCount = title.match(/\d+/g) ? parseInt(title.match(/\d+/g).join("")) : 0;
	messageCount = isNaN(messageCount) ? 0 : messageCount;

	tray.setBadge(messageCount, config.get('systemtray_indicator'));

	// Windows
	if (process.platform === 'win32') {
		if (messageCount === 0) {
			mainWindow.setOverlayIcon(null, "");
			return;
		}

		mainWindow.webContents.send('setBadge', messageCount);
	// MacOS & Linux
	}
	else {
		app.badgeCount = messageCount;
	}

	if ( messageCount > 0 && !mainWindow.isFocused() && !config.get('dont_disturb') && config.get('flash_frame') )
		mainWindow.flashFrame(true);
}

ipcMain.on('setBadge', (event, messageCount, value) => {
	const img = nativeImage.createFromDataURL(value);
	mainWindow.setOverlayIcon(img, messageCount.toString());
});

ipcMain.on('getConfig', (event, arg) => {
	event.returnValue = config.store;
});

ipcMain.on('setConfig', (event, values) => {
	config.set(values);

	// hide_menu_bar
	mainWindow.setAutoHideMenuBar(values.hide_menu_bar);
	if ( !values.hide_menu_bar )
		mainWindow.setMenuBarVisibility(true);
	// always_on_top
	mainWindow.setAlwaysOnTop(values.always_on_top);
	// auto_launch
	if (values.auto_launch)
		appLauncher.enable();
	else
		appLauncher.disable();

	// systemtray_indicator
	updateBadge(mainWindow.getTitle());

	mainWindow.webContents.executeJavaScript('(function(a) { if(a) a.controller.initialize(a); })(Ext.cq1("app-main"))');

	switch ( values.window_display_behavior ) {
		case 'show_taskbar':
			mainWindow.setSkipTaskbar(false);
			tray.destroy();
			break;
		case 'show_trayIcon':
			mainWindow.setSkipTaskbar(true);
			tray.create(mainWindow, config);
			break;
		case 'taskbar_tray':
			mainWindow.setSkipTaskbar(false);
			tray.create(mainWindow, config);
			break;
		default:
			break;
	}
});

ipcMain.on('validateMasterPassword', (event, pass) => {
	if ( config.get('master_password') === require('crypto').createHash('md5').update(pass).digest('hex') ) {
		createWindow();
		mainMasterPasswordWindow.close();
		event.returnValue = true;
	}
	event.returnValue = false;
});

// Handle Service Notifications
ipcMain.on('setServiceNotifications', (event, partition, op) => {
	if (partition) {
		session.fromPartition(partition).setPermissionRequestHandler((webContents, permission, callback) => {
			if (permission === 'notifications')
				return callback(op);
			callback(true);
		});
	}
});

ipcMain.on('setDontDisturb', (event, arg) => {
	config.set('dont_disturb', arg);
});

// Reload app
ipcMain.on('reloadApp', (event) => {
	mainWindow.reload();
});

// Relaunch app
ipcMain.on('relaunchApp', (event) => {
	app.relaunch();
	app.quit(0);
});

// ==========================================================================
// Phase 2: New IPC handlers for contextBridge preload
// These replace @electron/remote calls from the renderer process
// ==========================================================================

ipcMain.on('getAppVersionSync', (event) => {
	event.returnValue = app.getVersion();
});

ipcMain.handle('shell:openExternal', (event, url) => {
	const allowedProtocols = ['http:', 'https:', 'mailto:'];
	try {
		const parsed = new URL(url);
		if (allowedProtocols.includes(parsed.protocol)) {
			return shell.openExternal(url);
		}
		console.warn(`[IPC] Blocked shell:openExternal for protocol: ${parsed.protocol}`);
	} catch (e) {
		console.warn(`[IPC] Invalid URL for shell:openExternal: ${url}`);
	}
});

ipcMain.handle('dialog:showSave', (event, options) => {
	return dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), options);
});

ipcMain.handle('dialog:showOpen', (event, options) => {
	return dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), options);
});

ipcMain.handle('fs:readFile', (event, filePath, encoding) => {
	return fs.promises.readFile(filePath, encoding || 'utf8');
});

ipcMain.handle('fs:writeFile', (event, filePath, data) => {
	return fs.promises.writeFile(filePath, data);
});

ipcMain.handle('fs:readBuildVersion', () => {
	return fs.promises.readFile(path.join(app.getAppPath(), 'BUILDVERSION'), 'utf8').catch(() => 'unknown');
});

ipcMain.handle('session:clearServiceData', async (event, partition) => {
	const ses = session.fromPartition(partition);
	ses.flushStorageData();
	await ses.clearCache();
	await ses.clearStorageData();
	await ses.cookies.flushStore();
});

ipcMain.handle('window:reload', (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win) win.reload();
});

ipcMain.handle('app:quit', () => {
	app.quit();
});

ipcMain.handle('app:getArgv', () => {
	return process.argv;
});

ipcMain.handle('app:getUserDataPath', () => {
	return app.getPath('userData');
});

// Dark mode / nativeTheme
ipcMain.handle('nativeTheme:shouldUseDarkColors', () => {
	return nativeTheme.shouldUseDarkColors;
});

nativeTheme.on('updated', () => {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send('nativeTheme:updated', nativeTheme.shouldUseDarkColors);
	}
});

// ==========================================================================

const haveLock = app.requestSingleInstanceLock();
app.on('second-instance', (commandLine, workingDirectory) => {
	// Someone tried to run a second instance, we should focus our window.
	if (mainWindow) {
		if (mainWindow.isMinimized())
			mainWindow.restore();
		mainWindow.focus();
		mainWindow.show();
		mainWindow.setSkipTaskbar(false);
		if (app.dock && app.dock.show)
			app.dock.show();
	}
});

if (!haveLock) {
	app.quit();
}

// Allowed URL popups
let allowPopUp = [
	'feedly.com/v3/auth/',
	'identity.linuxfoundation.org/cas/login',
	'auth.missiveapp.com',
	'accounts.google.com/AccountChooser',
	'accounts.google.com/o/oauth2',
	'app.slack.com/files/import/gdrive',
	'spikenow.com/s/account',
	'app.mixmax.com/_oauth/google',
	'officeapps.live.com',
	'dropbox.com/profile_services/start_auth_flow',
	'facebook.com/v3.1/dialog/oauth?',
	'facebook.com/v3.2/dialog/oauth?',
	'notion.so/googlepopupredirect',
	'zoom.us/office365',
	'figma.com/start_google_sso',
	'mail.google.com/mail',
	'account.protonmail.com/authorize?',
	'account.proton.me/authorize?',
	'account-api.proton.me',
	'app.slack.com/free-willy/',
	'messenger.com/videocall',
	'api.moo.do',
	'manychat.com/fb?popup',
	'=?print=true'
];

app.on('web-contents-created', (webContentsCreatedEvent, contents) => {
	if (contents.getType() !== 'webview')
		return;

	// Block some deep links to prevent that native app is opened (e.g. Slack, Teams, Zoom)
	contents.on('will-navigate', (event, url) => {
		if ( url.substring(0, 10) === 'discord://' ||
			 url.substring(0, 8)  === 'slack://' ||
			 url.substring(0, 8)  === 'skype://' ||
			 url.substring(0, 8)  === 'teams://' ||
			 url.substring(0, 7)  === 'zoom://'
		)
			event.preventDefault();
	});

	// New Window handler
	/*contents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures, referrer, postBody) => {
		// If the url is 'about:blank', we allow the window and handle it in 'did-create-window'
		if (['about:blank', 'about:blank#blocked'].includes(url)) {
			event.preventDefault();
			Object.assign(options, { show: false });
			const win = new BrowserWindow(options);
			win.center();
			let once = false;
			win.webContents.on('will-navigate', (e, nextURL) => {
				if (once)
					return;
				if (['about:blank', 'about:blank#blocked'].includes(nextURL))
					return;
				once = true;
				let allow = false;
				allowPopUp.forEach(url => nextURL.indexOf(url) > -1 && (allow = true));
				// If the url is in aboutBlankOnlyWindow, we handle this as a popup window
				if (allow)
					return win.show();
				shell.openExternal(nextURL);
				win.close()
			});

			event.newGuest = win;
			return;
		}
		// We check if url is in the allowPopUpLoginURLs or allowForegroundTabURLs in Firebase to open a as a popup,
		// if it is not, we send this to the app
		let allow = false;
		allowPopUp.forEach(allowed => url.indexOf(allowed) > -1 && (allow = true));
		if (allow)
			return;
		shell.openExternal(url);
		event.preventDefault();
	});*/

	contents.setWindowOpenHandler((details) => {
		switch ( details.disposition ) {
			case 'new-window': {
				// If the url is 'about:blank', we allow the window and handle it in 'did-create-window'
				if (['about:blank', 'about:blank#blocked'].includes(details.url)) {
					return {
						action: allow,
						overrideBrowserWindowOptions: {
							show: false,
							center: true,
						}
					};
				}

				// We check if url is in the allowPopUpLoginURLs or allowForegroundTabURLs in Firebase to open as a popup,
				// if it is not, we send this to the app
				let allow = false;
				allowPopUp.forEach(allowed => details.url.indexOf(allowed) > -1 && (allow = true));
				if (allow) {
					shell.openExternal(details.url);
					return { action: 'allow' };
				}

				console.log("Blocked by 'setWindowOpenHandler': " + details.url);
				return { action: 'deny' };
			}
			default: {
				console.log("Blocked by 'setWindowOpenHandler': " + details.url);
				return { action: 'deny' };
			}
		}
	});

	// Open links in default browser
	contents.on('did-create-window', (win, details) => {
		win.center();
		const { URL } = require('url');
		const url = new URL(details.url);
		const protocol = url.protocol;
		switch (details.disposition) {
			case 'new-window': {
				const win = new BrowserWindow(options);
				win.once('ready-to-show', () => win.show());
				win.loadURL(url.href);
				break;
			}
			case 'foreground-tab': {
				if (protocol === 'file:' || protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'zoom:' || protocol === 'slack:' || protocol === 'skype:' || protocol === 'teams:') {
					shell.openExternal(url.href);
					win.close();
				}
				break;
			}
			default:
				break;
		}
	});
});

// Code for downloading images as temporary files
// Credit: Ghetto Skype (https://github.com/stanfieldr/ghetto-skype)
let imageCache = {};
ipcMain.on('image:download', (event, url, partition) => {
	const tmp = require('tmp');
	const mime = require('mime');
	let file = imageCache[`${url}`];
	if (file) {
		if (file.complete) {
			shell.openPath(file.path);
		}

		// Pending downloads intentionally do not proceed
		return;
	}

	let tmpWindow = new BrowserWindow({
		 show: false
		,webPreferences: {
			partition: partition,
		}
	});

	tmpWindow.webContents.session.once('will-download', (event, downloadItem) => {
		imageCache[`${url}`] = file = {
			 path: tmp.tmpNameSync() + '.' + mime.getExtension(downloadItem.getMimeType())
			,complete: false
		};

		downloadItem.setSavePath(file.path);
		downloadItem.once('done', () => {
			tmpWindow.destroy();
			tmpWindow = null;
			shell.openPath(file.path);
			file.complete = true;
		});
	});

	tmpWindow.webContents.downloadURL(url);
});

// Hangouts
ipcMain.on('image:popup', (event, url, partition) => {
	let tmpWindow = new BrowserWindow({
		 width: mainWindow.getBounds().width
		,height: mainWindow.getBounds().height
		,parent: mainWindow
		,icon: nativeImage.createFromPath(path.join(app.getAppPath(), '/resources/Icon.' + (process.platform === 'linux' ? 'png' : 'ico')))
		,backgroundColor: nativeTheme.shouldUseDarkColors ? '#000' : '#FFF'
		,autoHideMenuBar: true
		,skipTaskbar: true
		,webPreferences: {
			partition: partition
		}
	});

	tmpWindow.maximize();
	tmpWindow.loadURL(url);
});

ipcMain.on('toggleWin', (event, alwaysShow) => {
	if ( !mainWindow.isMinimized() && mainWindow.isMaximized() && mainWindow.isVisible() ) {
		// Maximized
		if (alwaysShow)
			mainWindow.show()
		else
			mainWindow.close();
	} else if ( mainWindow.isMinimized() && !mainWindow.isMaximized() && !mainWindow.isVisible() ) {
		// Minimized
		mainWindow.restore();
	} else if ( !mainWindow.isMinimized() && !mainWindow.isMaximized() && mainWindow.isVisible() ) {
		// Windowed mode
		if (alwaysShow)
			mainWindow.show();
		else
			mainWindow.close();
	} else if ( mainWindow.isMinimized() && !mainWindow.isMaximized() && mainWindow.isVisible() ) {
		// Closed to taskbar
		mainWindow.restore();
	} else if ( !mainWindow.isMinimized() && mainWindow.isMaximized() && !mainWindow.isVisible() ) {
		// Closed maximized to tray
		mainWindow.show();
	} else if ( !mainWindow.isMinimized() && !mainWindow.isMaximized() && !mainWindow.isVisible() ) {
		// Closed windowed to tray
		mainWindow.show();
	} else if ( mainWindow.isMinimized() && !mainWindow.isMaximized() && !mainWindow.isVisible() ) {
		// Closed minimized to tray
		mainWindow.restore();
	} else {
		mainWindow.show();
	}
});

// Proxy
if ( config.get('proxy') ) {
	app.commandLine.appendSwitch('proxy-server', config.get('proxyHost') + ':' + config.get('proxyPort'));
	app.on('login', (event, webContents, request, authInfo, callback) => {
		if( !authInfo.isProxy )
			return;

		event.preventDefault();
		callback(config.get('proxyLogin'), config.get('proxyPassword'));
	});
}

// Disable GPU Acceleration for Linux to prevent white page bug
// https://github.com/electron/electron/issues/6139
// https://github.com/saenzramiro/hamsket/issues/181
if ( config.get('disable_gpu') )
	app.disableHardwareAcceleration();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
	const contextMenuModule = await import('electron-context-menu');
	contextMenu = contextMenuModule.default;

	if (config.get('master_password')) {
		createMasterPasswordWindow();
	} else {
		createWindow();
	}
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// Only MacOS: On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
	if (mainWindow === null && mainMasterPasswordWindow === null ) {
		if (config.get('master_password')) {
			createMasterPasswordWindow();
		} else {
			createWindow();
		}
	}

	if ( mainWindow !== null )
		mainWindow.show();
});

app.on('before-quit', () => {
	isQuitting = true;
});

// Prevent the ability to create WebView with nodeIntegration.
app.on('web-contents-created', (event, contents) => {
	const contextMenuWebContentsDispose = contextMenu({
		window: contents,
		showCopyImageAddress: true,
		showSaveImage: false,
		showSaveImageAs: true,
		showSelectAll: false
	});

	contents.session.webRequest.onBeforeSendHeaders({
		urls: [
			'https://accounts.google.com/',
			'https://accounts.google.com/*'
		]
	}, (details, callback) => {
		details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64; rv:108.0) Gecko/20100101 Firefox/108.0';
		callback({ requestHeaders: details.requestHeaders });
	});

    contents.on('will-attach-webview', (event, webPreferences) => {
		// Always prevent node integration
		webPreferences.nodeIntegration = false;
		//webPreferences.nodeIntegrationInSubFrames = false;
		//webPreferences.nodeIntegrationInWorker = false;
	});

	contents.on('destroyed', () => {
		contextMenuWebContentsDispose();
	});
});
