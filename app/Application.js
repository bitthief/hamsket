Ext.define('Hamsket.Application', {
	 extend: 'Ext.app.Application'
	,name: 'Hamsket'
	,requires: [
		 'Hamsket.ux.FileBackup'
		,'Hamsket.util.MD5'
		,'Ext.window.Toast'
		,'Ext.util.Cookies'
		,'Ext.ux.TabReorderer'
	]
	,stores: [
		 'ServicesList'
		,'Services'
		,'OS'
	]
	,config: {
		 totalServicesLoaded: 0
		,totalNotifications: 0
	}
	,launch: function() {
		/*if (Ext.isModern) {
            Ext.Viewport.add([{ xtype: 'app-main' }]);
        } else {
            var app = this.getApplication();
            app.setMainView('Hamsket.view.main.Main');
        }

		if (Ext.isClassic == true) {
			Ext.create({xtype: 'app-main', plugins: 'viewport'});
			var app = this.getApplication();
            app.setMainView('Hamsket.view.main.Main');
		}
		else {
			Ext.Viewport.add([{xtype: app-main}]);
		}*/

		// Load language for Ext JS library
		Ext.Loader.loadScript({url: Ext.util.Format.format("resources/locale/locale-{0}.js", localStorage.getItem('locale') || 'en')});

		// Set cookies to help Tooltip.io messages segmentation
		const appVersion = require('@electron/remote').app.getVersion();
		Ext.util.Cookies.set('version', appVersion);

		// Check for updates
		const argv = require('@electron/remote').process.argv;
		if ( argv.indexOf('--without-update') === -1 )
			Hamsket.app.checkUpdate(true);

		// Mouse Wheel zooming
		document.addEventListener('mousewheel', (e) => {
			if( e.ctrlKey ) {
				const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));

				const tabPanel = Ext.cq1('app-main');
				if (tabPanel != undefined) {
					if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 )
						return false;

					if ( delta === 1 ) {
						// Zoom In
						tabPanel.getActiveTab().zoomIn();
					} else {
						// Zoom Out
						tabPanel.getActiveTab().zoomOut();
					}
				} else {
					console.error('Unable to zoom from mouse wheel handler, app-main is undefined!');
				}
			}
		}, { passive: true });

		// Define default value
		if ( localStorage.getItem('dontDisturb') === null )
			localStorage.setItem('dontDisturb', false);
		// We store it in config
		ipc.send('setDontDisturb', localStorage.getItem('dontDisturb'));

		if ( localStorage.getItem('locked') ) {
			console.info('Lock Hamsket:', 'Enabled');
			if (Ext.cq1('app-main') != undefined) {
				Ext.cq1('app-main').getController().showLockWindow();
			} else {
				console.error('Unable to show lock window, app-main is undefined!');
			}
		}

		// Remove spinner
		Ext.get('spinner').destroy();
	}
	,updateTotalNotifications: function( newValue, oldValue ) {
		const mainPanel = Ext.cq1('app-main');
		if (!mainPanel) return;

		newValue = parseInt(newValue);
		const activeTab = mainPanel.getActiveTab();
		const serviceName = activeTab && activeTab.record ? Ext.String.htmlEncode(activeTab.record.get('name')) : null;

		if ( newValue > 0 ) {
			document.title = serviceName
				? `Hamsket (${Hamsket.util.Format.formatNumber(newValue)}) - ${serviceName}`
				: `Hamsket (${Hamsket.util.Format.formatNumber(newValue)})`;
		} else {
			document.title = serviceName ? `Hamsket - ${serviceName}` : `Hamsket`;
		}
	}
	,checkUpdate: function(silence) {
		console.info('Checking for updates..');
		Ext.Ajax.request({
			 url: 'https://api.github.com/repos/TheGoddessInari/hamsket/releases/latest'
			,method: 'GET'
			,success: function(response) {
				const json = JSON.parse(response.responseText);
				const version = require('@electron/remote').app.getVersion();
				const appVersion = new Ext.Version(version);
				const updateVersion = new Ext.Version(json.tag_name);
				if ( appVersion.isLessThan(updateVersion) ) {
					console.info('New version is available', updateVersion);
					if (Ext.cq1('app-main') != undefined) {
						Ext.cq1('app-main').addDocked(
						{
							xtype: 'toolbar'
							,dock: 'top'
							,ui: 'newversion'
							,items:
							[
								'->'
								,{
									xtype: 'label'
									,html: '<b>'+locale['app.update[0]']+'</b> ('+updateVersion+')'
								}
								,{
									xtype: 'button'
									,text: locale['app.update[1]']
									,href: 'https://github.com/TheGoddessInari/hamsket/releases/latest'
								}
								,{
									xtype: 'button'
									,text: locale['app.update[2]']
									,ui: 'decline'
									,tooltip: 'Click here to see more information about the new version.'
									,href: 'https://github.com/TheGoddessInari/hamsket/releases/tag/'+updateVersion
								}
								,'->'
								,{
									glyph: 0xF00D
									,baseCls: ''
									,style: 'cursor:pointer;'
									,handler: function(btn) {
										if (Ext.cq1('app-main') != undefined) {
											Ext.cq1('app-main').removeDocked(btn.up('toolbar'), true);
										} else {
											console.error('Unable to remove docked, app-main is undefined!');
										}
									}
								}
							]
						});
					} else {
						console.error('Unable to add docked, app-main is undefined!');
					}
					return;
				} else if ( !silence ) {
					Ext.Msg.show({ title: locale['app.update[3]'], message: locale['app.update[4]'], icon: Ext.Msg.INFO, buttons: Ext.Msg.OK });
				}

				console.info('Your version is the latest, no need to update.');
			}
		});
	}
});
