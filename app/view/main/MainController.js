Ext.define('Hamsket.view.main.MainController', {
	 extend: 'Ext.app.ViewController'
	,alias: 'controller.main'
	,initialize: function( tabPanel ) {
		const me = this;
		const config = ipc.sendSync('getConfig');

		// Dark mode
		me.applyDarkMode(config.dark_mode);
		window.hamsket.theme.onUpdated(function() {
			const currentConfig = window.hamsket.config.get();
			if (currentConfig.dark_mode === 'system') {
				me.applyDarkMode('system');
			}
		});

		tabPanel.setTabPosition(config.tabbar_location);
		tabPanel.setTabRotation(0);

		let reorderer = tabPanel.plugins.find((plugin) => { return plugin.ptype === "tabreorderer"; });
		if ( reorderer !== undefined ) {
			const names = reorderer.container.getLayout().names;
			reorderer.dd.dim = names.width;
			reorderer.dd.startAttr = names.beforeX;
			reorderer.dd.endAttr = names.afterX;
		} else {
			console.error('Unable to find tabreorderer plugin!');
		}
	}
	// Load Services store
	,onBeforeRender: function() {
		const store = Ext.getStore('Services');
		if (!(store.isLoaded() || store.isLoading())) {
			store.suspendEvent('beforerender');
			store.load();
			store.resumeEvent('beforerender');
		}
	}
	// Make focus on webview every time the user change tabs, to enable the autofocus in websites
	,onTabChange: function( tabPanel, newTab, oldTab ) {
		const me = this;

		localStorage.setItem('last_active_service', newTab.id);

		if ( newTab.id === 'hamsketTab' ) {
			if ( Hamsket.app.getTotalNotifications() > 0 ) {
				document.title = 'Hamsket ('+ Hamsket.app.getTotalNotifications() +')';
			} else {
				document.title = 'Hamsket';
			}
			return;
		}

		if (!newTab.record.get('enabled') ) {
			return;
		}

		newTab.focus();

		// Update the main window so it includes the active tab title.
		if ( Hamsket.app.getTotalNotifications() > 0 ) {
			document.title = `Hamsket (${Hamsket.app.getTotalNotifications()}) - ${Ext.String.htmlEncode(newTab.record.get('name'))}`;
		} else {
			document.title = `Hamsket - ${Ext.String.htmlEncode(newTab.record.get('name'))}`;
		}
	}
	,updatePositions: function(tabPanel, tab) {
		if ( tab.id === 'hamsketTab' || tab.id === 'tbfill' )
			return true;

		const store = Ext.getStore('Services');
		store.suspendEvent('childmove');

		let align = 'left';
		Ext.each(tabPanel.items.items, (t, i) => {
			if ( t.id !== 'hamsketTab' && t.id !== 'tbfill' && t.record.get('enabled') ) {
				const rec = store.getById(t.record.get('id'));
				if ( align === 'right' )
					i--;
				if (rec) {
					rec.set('align', align);
					rec.set('position', i);
					rec.save();
				}
			}
			else if ( t.id === 'tbfill' ) {
				align = 'right';
			}
		});

		store.load();
		store.resumeEvent('childmove');
	}
	,showServiceTab: function( grid, record, tr, rowIndex, e ) {
		if ( e.position.colIdx === 0 ) {
			// Service Logo
			Ext.getCmp('tab_'+record.get('id')).show();
		}
	}
	,onRenameService: function(editor, e) {
		const me = this;

		e.record.commit();

		// Change the title of the Tab
		Ext.getCmp('tab_'+e.record.get('id')).setTitle(Ext.String.htmlEncode(e.record.get('name')));
	}
	,onEnableDisableService: function(cc, rowIndex, checked, obj, hideTab) {
		const rec = Ext.getStore('Services').getAt(rowIndex);

		if ( !checked ) {
			Ext.getCmp('tab_'+rec.get('id')).destroy();
		}
		else {
			if (Ext.cq1('app-main') != undefined) {
				Ext.cq1('app-main').insert(rec.get('align') === 'left' ? rec.get('position') : rec.get('position')+1, {
					xtype: 'webview'
					,id: 'tab_'+rec.get('id')
					,title: `${Ext.String.htmlEncode(rec.get('name'))}`
					,icon: rec.get('type') !== 'custom' ? 'resources/icons/'+rec.get('logo') : ( rec.get('logo') === '' ? 'resources/icons/custom.png' : rec.get('logo'))
					,src: rec.get('url')
					,type: rec.get('type')
					,muted: rec.get('muted')
					,includeInGlobalUnreadCounter: rec.get('includeInGlobalUnreadCounter')
					,displayTabUnreadCounter: rec.get('displayTabUnreadCounter')
					,custom_css_complex: rec.get('custom_css_complex')
					,passive_event_listeners: rec.get('passive_event_listeners')
					,slowed_timers: rec.get('slowed_timers')
					,userAgent: rec.get('userAgent')
					,os_override: rec.get('os_override')
					,chrome_version: rec.get('chrome_version')
					,enabled: rec.get('enabled')
					,record: rec
					,hidden: hideTab
					,tabConfig: {
						service: rec
					}
				});
			}
			else {
				console.error('Unable to enable service, app-main is undefined!');
			}
		}
	}
	,onNewServiceSelect: function( view, record, item, index, e ) {
		Ext.create('Hamsket.view.add.Add', { record: record });
	}
	,removeServiceFn: function(serviceId, total, actual, resolve) {
		const me = this;

		if ( !serviceId )
			return false;

		// Get Record
		const rec = Ext.getStore('Services').getById(serviceId);
		let partition;
		let tab = null;
		if ( !rec.get('enabled') ) {
			partition = `persist:${rec.get('type')}_${serviceId}`;
		} else {
			// Get Tab
			tab = Ext.getCmp('tab_'+serviceId);
			partition = tab.getWebView().partition;
		}

		const config = window.hamsket.config.get();
		if ( config.default_service === rec.get('id') )
			window.hamsket.config.set(Ext.apply(config, { default_service: 'hamsketTab' }));

		// Clear all trash data via IPC
		window.hamsket.session.clearServiceData(partition).catch((err) => {
			console.error(`Error removing service data: ${rec.name} ${err}`);
			Ext.Msg.alert('Error!', `Error removing service data: ${rec.name}: ${err}`);
		}).finally(() => {
			const service_store = Ext.getStore('Services');
			// Remove record from localStorage
			service_store.remove(rec);
			service_store.sync();
			// Close tab
			if (tab)
				tab.close();
			if ( Ext.isFunction(resolve) )
				resolve();
			// Close waiting message
			if ( total === actual ) {
				Ext.Msg.close();
			}
		});
	}
	,removeService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		const me = this;

		Ext.Msg.confirm(locale['app.window[12]'], locale['app.window[13]']+' <b>'+Ext.String.htmlEncode(rec.get('name'))+'</b>?', (btnId) => {
			if ( btnId === 'yes' ) {
				Ext.Msg.wait('Please wait until we clear all.', 'Removing..');
				me.removeServiceFn(rec.get('id'), 1, 1);
			}
		});
	}
	,removeAllServices: function(btn, callback) {
		const me = this;

		// Clear counter for unread messaging
		document.title = 'Hamsket';

		const store = Ext.getStore('Services');

		if ( btn ) {
			Ext.Msg.confirm(locale['app.window[12]'], locale['app.window[14]'], (btnId) => {
				if ( btnId === 'yes' ) {
					Ext.Msg.wait('Please wait until we clear all.', 'Removing..');
					_removeAllServices(callback);
				}
			});
		} else {
			_removeAllServices(callback);
		}

		function _removeAllServices (callback) {
			store.load((records, operation, success) => {
				store.suspendEvent('remove');
				store.suspendEvent('childmove');
				const count = store.getCount();
				let i = 1;
				let promises = [];
				Ext.Array.each(store.collect('id'), (serviceId) => { promises.push(new Promise((resolve) => { me.removeServiceFn(serviceId, count, i++, resolve); })); });
				Promise.all(promises)
				.then(resolve => {
					if ( Ext.isFunction(callback) )
						callback();
					return resolve;
				}).catch((err) => {
					console.error('Error removing services: ' + err);
					Ext.Msg.alert('Error!','Error removing services: ' + err);
				}).finally(() => {
					store.resumeEvent('childmove');
					store.resumeEvent('remove');
					document.title = 'Hamsket';
				});
			});
		}
	}
	,configureService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		Ext.create('Hamsket.view.add.Add', { record: rec, service: Ext.getStore('ServicesList').getById(rec.get('type')), edit: true });
	}
	,onSearchRender: function( field ) {
		field.focus(false, 1000);
	}
	,onSearchEnter: function( field, e ) {
		const me = this;

		// Two because we always shows Custom Service option
		if ( e.getKey() === e.ENTER && Ext.getStore('ServicesList').getCount() === 2 ) {
			me.onNewServiceSelect(field.up().down('dataview'), Ext.getStore('ServicesList').getAt(0));
			me.onClearClick(field);
		}
	}
	,doTypeFilter: function( cg, newValue, oldValue ) {
		const me = this;

		Ext.getStore('ServicesList').getFilters().replaceAll({
			fn(record) {
				return Ext.Array.contains(Ext.Object.getKeys(cg.getValue()), record.get('type')) || record.get('type') === 'custom';
			}
		});
	}
	,onSearchServiceChange: function(field, newValue, oldValue) {
		const me = this;

		const cg = field.up().down('checkboxgroup');
		if ( !Ext.isEmpty(newValue) && newValue.length > 0 ) {
			field.getTrigger('clear').show();

			Ext.getStore('ServicesList').getFilters().replaceAll({
				fn(record) {
					if ( record.get('type') === 'custom' )
						return true;
					if ( !Ext.Array.contains(Ext.Object.getKeys(cg.getValue()), record.get('type')) )
						return false;

					return Ext.String.htmlEncode(record.get('name')).toLowerCase().indexOf(newValue.toLowerCase()) > -1 ? true : false;
				}
			});
		} else {
			field.getTrigger('clear').hide();
			Ext.getStore('ServicesList').getFilters().removeAll();
			me.doTypeFilter(cg);
		}
		field.updateLayout();
	}
	,onClearClick: function(field, trigger, e) {
		const me = this;

		const cg = field.up().down('checkboxgroup');

		field.reset();
		field.getTrigger('clear').hide();
		field.updateLayout();

		Ext.getStore('ServicesList').getFilters().removeAll();
		me.doTypeFilter(cg);
	}
	,dontDisturb: function(btn, e, called) {
		console.info('Dont Disturb:', btn.pressed ? 'Enabled' : 'Disabled');

		Ext.Array.each(Ext.getStore('Services').collect('id'), (serviceId) => {
			// Get Tab
			const tab = Ext.getCmp('tab_'+serviceId);

			if ( !tab )
				return; // Skip disabled services

			// Mute sounds
			tab.setAudioMuted(btn.pressed ? true : tab.record.get('muted'), true);

			// Prevent Notifications
			tab.setNotifications(btn.pressed ? false : tab.record.get('notifications'), true);
		});

		localStorage.setItem('dontDisturb', btn.pressed);

		ipc.send('setDontDisturb', btn.pressed);

		btn.setText(locale['app.main[16]']+': ' + ( btn.pressed ? locale['app.window[20]'] : locale['app.window[21]'] ));

		// If this method is called from Lock method, prevent showing toast
		if ( !e )
			return;
		Ext.toast({ html: btn.pressed ? 'ENABLED' : 'DISABLED' ,title: 'Don\'t Disturb' ,width: 200 ,align: 't' ,closable: false });
	}
	,lockHamsket: function(btn) {
		const me = this;

		if ( ipc.sendSync('getConfig').master_password ) {
			Ext.Msg.confirm(locale['app.main[19]'], 'Do you want to use the Master Password as your temporal password?', (btnId) => {
				if ( btnId === 'yes' ) {
					setLock(ipc.sendSync('getConfig').master_password);
				} else {
					showTempPass();
				}
			});
		} else {
			showTempPass();
		}
		function showTempPass() {
			const msgbox = Ext.Msg.prompt(locale['app.main[19]'], locale['app.window[22]'], (btnId, text) => {
				if ( btnId === 'ok' ) {
					const msgbox2 = Ext.Msg.prompt(locale['app.main[19]'], locale['app.window[23]'], (btnId, text2) => {
						if ( btnId === 'ok' ) {
							if ( text !== text2 ) {
								Ext.Msg.show({ title: locale['app.window[24]'], message: locale['app.window[25]'], icon: Ext.Msg.WARNING, buttons: Ext.Msg.OK, fn: me.lockHamsket });
								return false;
							}

							setLock(Hamsket.util.MD5.encrypt(text));
						}
					});
					msgbox2.textField.inputEl.dom.type = 'password';
				}
			});
			msgbox.textField.inputEl.dom.type = 'password';
		}

		function setLock(text) {
			console.info('Lock Hamsket:', 'Enabled');

			// Save encrypted password in localStorage to show locked when app is reopen
			localStorage.setItem('locked', text);

			me.lookupReference('disturbBtn').setPressed(true);
			me.dontDisturb(me.lookupReference('disturbBtn'), false, true);

			me.showLockWindow();
		}
	}
	,showLockWindow: function() {
		const me = this;

		const validateFn = function() {
			if ( localStorage.getItem('locked') === Hamsket.util.MD5.encrypt(winLock.down('textfield').getValue()) ) {
				console.info('Lock Hamsket:', 'Disabled');
				localStorage.removeItem('locked');
				winLock.close();
				me.lookupReference('disturbBtn').setPressed(false);
				me.dontDisturb(me.lookupReference('disturbBtn'), false);
			} else {
				winLock.down('textfield').reset();
				winLock.down('textfield').markInvalid('Unlock password is invalid');
			}
		};

		const winLock = Ext.create('Ext.window.Window', {
			 maximized: true
			,closable: false
			,resizable: false
			,minimizable: false
			,maximizable: false
			,draggable: false
			,onEsc: Ext.emptyFn
			,layout: 'center'
			,bodyStyle: 'background-color:#2e658e;'
			,items: [
				{
					 xtype: 'container'
					,layout: 'vbox'
					,items: [
						{
							 xtype: 'image'
							,src: 'resources/Icon.png'
							,width: 256
							,height: 256
						}
						,{
							 xtype: 'component'
							,autoEl: {
								 tag: 'h1'
								,html: locale['app.window[26]']
								,style: 'text-align:center;width:256px;'
						   }
						}
						,{
							 xtype: 'textfield'
							,inputType: 'password'
							,width: 256
							,listeners: {
								specialkey: function(field, e) {
									if ( e.getKey() === e.ENTER ) {
										validateFn();
									}
								}
							}
						}
						,{
							 xtype: 'button'
							,text: locale['app.window[27]']
							,glyph: 0xF13E
							,width: 256
							,scale: 'large'
							,handler: validateFn
						}
					]
				}
			]
			,listeners: {
				render: function(win) {
					win.getEl().on('click', () => { win.down('textfield').focus(100); });
				}
			}
		}).show();
		winLock.down('textfield').focus(1000);
	}
	,openPreferences: function( btn ) {
		const me = this;

		Ext.create('Hamsket.view.preferences.Preferences').show();
	}
	,applyDarkMode: function(mode) {
		const me = this;
		if (mode === 'system') {
			window.hamsket.theme.shouldUseDarkColors().then(function(isDark) {
				me.setDarkClass(isDark);
			});
		} else {
			me.setDarkClass(mode === 'dark');
		}
	}
	,setDarkClass: function(isDark) {
		// Ensure dark-mode.css is loaded (injected after all ExtJS CSS)
		if (!document.getElementById('hamsket-dark-css')) {
			const link = document.createElement('link');
			link.id = 'hamsket-dark-css';
			link.rel = 'stylesheet';
			link.href = 'resources/css/dark-mode.css';
			document.head.appendChild(link);
		}
		document.body.classList.toggle('hamsket-dark', isDark);
	}
});
