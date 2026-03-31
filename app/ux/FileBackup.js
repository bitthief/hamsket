Ext.define('Hamsket.ux.FileBackup', {
	singleton: true,
	constructor: function() {
		const me = this;
		me.callParent(arguments);
		me.remote = require('@electron/remote');
		me.path = me.remote.require('path');
		me.fs = me.remote.require('fs');
		me.userPath = me.remote.app.getPath('userData');
		me.defaultFileName = 'hamsket-backup.json';
		me.myDefaultPath = me.userPath + me.path.sep + me.defaultFileName;
	},
	backupConfiguration: function(callback) {
		const me = this;
		let services = [];
		const service_store = Ext.getStore('Services');
		service_store.sync();
		service_store.each((service) => {
			const s = Ext.clone(service);
			delete s.data.id;
			delete s.data.zoomLevel;
			services.push(s.data);
		});

		const json_string = JSON.stringify(services, null, 4);
		me.remote.dialog.showSaveDialog({ defaultPath: me.myDefaultPath}).then((result) => {
			if (!result.filePath)
				return;
			me.fs.writeFile(result.filePath, json_string, (err) => {
				if (err) {
					console.log(err);
				}
			});
		}).catch((err) => {
  			console.log(err);
		});
		if (Ext.isFunction(callback))
			callback.bind(me)();
	},
	restoreConfiguration: function() {
		const me = this;
		const service_store = Ext.getStore('Services');
		me.remote.dialog.showOpenDialog({ defaultPath: me.myDefaultPath, properties: ['openFile']})
		.then((result) => {
			if (result.filePaths && result.filePaths.length === 1) {
				const filePath = result.filePaths[0];
				me.fs.readFile(filePath, (err, data) => {
					if (err) {
						console.log(err);
					}
					const services = JSON.parse(data);
					if (services) {
						if (Ext.cq1('app-main') != undefined) {
							Ext.cq1('app-main').getController().removeAllServices(true, () => {
								Ext.each(services, (s) => {
									const service = Ext.create('Hamsket.model.Service', s);
									service_store.add(service);
								});
								service_store.sync();
								me.remote.getCurrentWindow().reload();
							});
						}
						else {
							console.error('Unable to remove all services, app-main is undefined!');
						}
					}
				});
			}
		}).catch((err) => { console.log(err); });
	}
});
