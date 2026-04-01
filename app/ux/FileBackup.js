Ext.define('Hamsket.ux.FileBackup', {
	singleton: true,
	constructor: function() {
		const me = this;
		me.callParent(arguments);
		me.defaultFileName = 'hamsket-backup.json';
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
		window.hamsket.paths.getUserData().then((userPath) => {
			return window.hamsket.dialog.showSave({ defaultPath: userPath + '/' + me.defaultFileName });
		}).then((result) => {
			if (!result.filePath)
				return;
			return window.hamsket.fs.writeFile(result.filePath, json_string);
		}).catch((err) => {
			console.log(err);
		});
		if (Ext.isFunction(callback))
			callback.bind(me)();
	},
	restoreConfiguration: function() {
		const me = this;
		const service_store = Ext.getStore('Services');
		window.hamsket.paths.getUserData().then((userPath) => {
			return window.hamsket.dialog.showOpen({ defaultPath: userPath + '/' + me.defaultFileName, properties: ['openFile'] });
		}).then((result) => {
			if (result.filePaths && result.filePaths.length === 1) {
				const filePath = result.filePaths[0];
				return window.hamsket.fs.readFile(filePath, 'utf8');
			}
		}).then((data) => {
			if (!data)
				return;
			const services = JSON.parse(data);
			if (services) {
				if (Ext.cq1('app-main') != undefined) {
					Ext.cq1('app-main').getController().removeAllServices(true, () => {
						Ext.each(services, (s) => {
							const service = Ext.create('Hamsket.model.Service', s);
							service_store.add(service);
						});
						service_store.sync();
						window.hamsket.window.reload();
					});
				}
				else {
					console.error('Unable to remove all services, app-main is undefined!');
				}
			}
		}).catch((err) => { console.log(err); });
	}
});
