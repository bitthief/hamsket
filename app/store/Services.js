Ext.define('Hamsket.store.Services', {
	 extend: 'Ext.data.Store'
	,alias: 'store.services'
	,requires: [
		'Ext.data.proxy.LocalStorage'
	]
	,model: 'Hamsket.model.Service'
	,storeId: 'Services'
	,autoLoad: false
	,autoSync: true
	,groupField: 'align'
	,sorters: [
		{
			 property: 'position'
			,direction: 'ASC'
		}
	]
	,listeners: {
		load: function( store, records, successful ) {
			if (Ext.cq1('app-main') != undefined) {
				Ext.cq1('app-main').suspendEvent('add');
			} else {
				console.error('Unable to suspend add event, app-main is undefined!');
			}

			let servicesLeft = [];
			let servicesRight = [];
			store.each(function(service) {
				// If the service is disabled, we don't add it to tab bar
				if ( !service.get('enabled') )
					return;

				const cfg = {
					xtype: 'webview'
					,id: 'tab_'+service.get('id')
					,title: Ext.String.htmlEncode(service.get('name'))
					,icon: service.get('type') !== 'custom' ? 'resources/icons/'+service.get('logo') : ( service.get('logo') === '' ? 'resources/icons/custom.png' : service.get('logo'))
					,src: service.get('url')
					,type: service.get('type')
					,muted: service.get('muted')
					,includeInGlobalUnreadCounter: service.get('includeInGlobalUnreadCounter')
					,displayTabUnreadCounter: service.get('displayTabUnreadCounter')
					,custom_css_complex: service.get('custom_css_complex')
					,passive_event_listeners: service.get('passive_event_listeners')
					,slowed_timers: service.get('slowed_timers')
					,userAgent: service.get('userAgent')
					,os_override: service.get('os_override')
					,chrome_version: service.get('chrome_version')
					,enabled: service.get('enabled')
					,record: service
					,tabConfig: { service: service }
				};

				if (service.get('align') === 'left') {
					servicesLeft.push(cfg);
				} else {
					servicesRight.push(cfg);
				}
			});

			if (Ext.cq1('app-main') != undefined) {
				if ( !Ext.isEmpty(servicesLeft) )
					Ext.cq1('app-main').insert(1, servicesLeft);
				if ( !Ext.isEmpty(servicesRight) )
					Ext.cq1('app-main').add(servicesRight);
			}
			else {
				console.error('Unable to insert/add service, app-main is undefined!');
			}

			// Set default active service
			const config = ipc.sendSync('getConfig');
			switch ( config.default_service ) {
				case 'last':
					if (Ext.cq1('app-main') != undefined) {
						Ext.cq1('app-main').setActiveTab(localStorage.getItem('last_active_service'));
					} else {
						console.error('Unable to set active service tab default, app-main is undefined!');
					}
					break;
				case 'hamsketTab':
					break;
				default:
					if ( Ext.getCmp('tab_' + config.default_service) ) {
						if (Ext.cq1('app-main') != undefined) {
							Ext.cq1('app-main').setActiveTab('tab_'+config.default_service);
						} else {
							console.error('Unable to set active service tab, app-main is undefined!');
						}
					}
					break;
			}

			store.suspendEvent('load');

			if (Ext.cq1('app-main') != undefined) {
				Ext.cq1('app-main').resumeEvent('add');
			} else {
				console.error('Unable to resume add event, app-main is undefined!');
			}
		}
	}
});
