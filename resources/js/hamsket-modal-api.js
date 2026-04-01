const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hamsketModal', {
	close: function() {
		ipcRenderer.sendToHost('close');
	}
});

document.addEventListener("DOMContentLoaded", () => {
	window.WHAT_TYPE.isChildWindowAnIframe = () => { return false; }; // for iCloud
	window.onbeforeunload = () => {
		ipcRenderer.sendToHost("close");
	};
});
