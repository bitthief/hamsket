/**
 * This file is loaded as a preload script in service webviews.
 * It exposes a safe API to the service page via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

const locale = ipcRenderer.sendSync('getConfig').locale;

function parseIntOrZero(text) {
	if (text === undefined || text === null) {
		return 0;
	}
	const parsedNumber = Number.parseInt(text.toString(), 10);
	const adjustedNumber = Number.isNaN(parsedNumber) ? 0 : parsedNumber;
	return Math.max(adjustedNumber, 0);
}

contextBridge.exposeInMainWorld('hamsket', {
	locale: locale,

	/**
	 * Sets the unread count of the tab.
	 * @param {*} count The unread count
	 */
	setUnreadCount: function(count) {
		ipcRenderer.sendToHost('hamsket.setUnreadCount', parseIntOrZero(count));
	},

	/**
	 * Update the badge of the tab.
	 * @param {*} direct
	 * @param {*} indirect
	 */
	updateBadge: function(direct, indirect) {
		ipcRenderer.sendToHost('hamsket.updateBadge', parseIntOrZero(direct), parseIntOrZero(indirect || 0));
	},

	/**
	 * Clears the unread count.
	 */
	clearUnreadCount: function() {
		ipcRenderer.sendToHost('hamsket.clearUnreadCount');
	},

	parseIntOrZero: parseIntOrZero,

	isInViewport: function(node) {
		const rect = node.getBoundingClientRect();
		return rect.bottom > 0 && rect.right > 0 &&
			rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
			rect.top < (window.innerHeight || document.documentElement.clientHeight);
	},

	showWindowAndActivateTab: function() {
		ipcRenderer.sendToHost('hamsket.showWindowAndActivateTab');
	},
});

/**
 * Override Notification to add click handler that activates the service tab.
 * This runs in the preload's isolated world.
 */
const NativeNotification = Notification;
Notification = function(title, options) {
	const notification = new NativeNotification(title, options);
	notification.addEventListener('click', () => {
		ipcRenderer.sendToHost('hamsket.showWindowAndActivateTab');
	});
	return notification;
};
Notification.prototype = NativeNotification.prototype;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission.bind(NativeNotification);

// Override window.close to prevent services from closing the webview
window.close = () => { location.href = location.origin; };
