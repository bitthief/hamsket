Ext.define('Hamsket.view.main.About', {
	 extend: 'Ext.window.Window'
	,xtype: 'about'
	,title: locale['app.about[0]']
	,autoShow: true
	,modal: true
	,resizable: false
	,constrain: true
	,width: 300
	,height: 530
	,autoScroll: true
	,bodyPadding: 10
	,initComponent: function() {
		const me = this;

		me.callParent(arguments);
		window.hamsket.fs.readBuildVersion().then(function(version) {
			me.data.buildversion = version;
			me.update(me.data);
		});
	}
	,data: {
		 version: window.hamsket.appVersion
		,platform: window.hamsket.platform
		,arch: window.hamsket.arch
		,electron: window.hamsket.versions.electron
		,chromium: window.hamsket.versions.chrome
		,node: window.hamsket.versions.node
		,buildversion: '...'
	}
	,tpl: [
		 '<div style="text-align:center;"><img src="resources/Icon.png" width="100" /></div>'
		,'<h3>' + locale['app.about[1]'] + '</h3>'
		,'<div><b>' + locale['app.about[2]'] + ':</b> {version}</div>'
		,'<div><b>' + locale['app.about[3]'] + ':</b> {platform} ({arch})</div>'
		,'<div><b>Electron:</b> {electron}</div>'
		,'<div><b>Chromium:</b> {chromium}</div>'
		,'<div><b>Node:</b> {node}</div>'
		,'<div><b>BuildVersion:</b> {buildversion}</div>'
		,'<br />'
		,'<div style="text-align:center;"><a href="https://github.com/TheGoddessInari/hamsket" target="_blank">GitHub</a></div>'
		,'<br />'
		,'<div style="text-align:center;"><i>' + locale['app.about[4]'] + ' TheGoddessInari.'
		,'<br />'
		,'Original version by Ramiro Saenz.</i></div>'
	]
});
