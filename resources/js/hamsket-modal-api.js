document.addEventListener("DOMContentLoaded", () => {
	window.WHAT_TYPE.isChildWindowAnIframe = () => { return false; }; // for iCloud
	window.onbeforeunload = () => {
		return require("electron").ipcRenderer.sendToHost("close");
	};
});
