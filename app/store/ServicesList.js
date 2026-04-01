Ext.define('Hamsket.store.ServicesList', {
	 extend: 'Ext.data.Store'
	,alias: 'store.serviceslist'
	,requires: [
		'Ext.data.proxy.LocalStorage'
	]
	,model: 'Hamsket.model.ServiceList'
	,proxy: {
		 type: 'memory'
	}
	,sorters: [{
		 property: 'name'
		,direction: 'ASC'
	}]
	,storeId: 'ServicesList'
	,autoLoad: true
	,autoSync: true
	,pageSize: 100000
	,data: [
		{
			 id: 'whatsapp'
			,logo: 'whatsapp.png'
			,name: 'WhatsApp'
			,description: locale['services[0]']
			,url: 'https://web.whatsapp.com/'
			,type: 'messaging'
			,js_unread: `let dbCache=null;const openDB=()=>new Promise((resolve,reject)=>{const req=indexedDB.open("model-storage");req.onsuccess=()=>{dbCache=req.result;resolve()};req.onerror=()=>reject()});const checkUnread=()=>{if(!dbCache){openDB().then(checkUnread).catch(()=>{});return}try{const txn=dbCache.transaction("chat","readonly");const store=txn.objectStore("chat");const query=store.getAll();query.onsuccess=()=>{let unread=0;for(const chat of query.result){if(chat.unreadCount>0&&!chat.archive&&chat.muteExpiration===0&&!chat.isAutoMuted){unread+=chat.unreadCount}}hamsket.updateBadge(unread)};query.onerror=()=>{dbCache=null}}catch(e){dbCache=null}};setInterval(checkUnread,3e3);navigator.serviceWorker.getRegistrations().then(r=>{for(const reg of r)reg.unregister()}).catch(()=>{});`
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,description: locale['services[1]']
			,url: 'https://___.slack.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const indirectSelector=".p-channel_sidebar__channel--unread:not(.p-channel_sidebar__channel--muted)";const indirect=document.querySelectorAll(indirectSelector).length;let direct=0;const badges=document.querySelectorAll(indirectSelector+" .p-channel_sidebar__badge");for(const badge of badges){const i=parseInt(badge.textContent);if(!isNaN(i))direct+=i}hamsket.updateBadge(direct,indirect)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'messenger'
			,logo: 'messenger.png'
			,name: 'Messenger'
			,description: locale['services[3]']
			,url: 'https://www.messenger.com'
			,type: 'messaging'
			,titleBlink: true
			,note: 'To enable desktop notifications, you have to go to Options inside Messenger.'
			,js_unread: `let checkUnread=()=>{const reg = /Chats, /;const mapped = Array.from(document.querySelectorAll('a[aria-label]')).map((x) => x.getAttribute('aria-label'));const strings=mapped.filter((x) => reg.test(x));var parsed=0;if (strings.length>0) {const value=strings[0].split(" ")[1];parsed = hamsket.parseIntOrZero(value);}hamsket.updateBadge(parsed)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'skype'
			,logo: 'skype.png'
			,name: 'Skype'
			,description: locale['services[4]']
			,url: 'https://web.skype.com/'
			,type: 'messaging'
			,note: 'Text and Audio calls are supported only. <a href="https://github.com/TheGoddessInari/hamsket/wiki/Skype" target="_blank">Read more...</a>'
		},
		{
			 id: 'telegram'
			,logo: 'telegram.png'
			,name: 'Telegram'
			,description: locale['services[7]']
			,url: 'https://web.telegram.org/'
			,type: 'messaging'
			,js_unread: `const checkUnread=()=>{let count=0;const webA=document.querySelectorAll(".ChatBadge.unread:not(.muted)");const webK=document.querySelectorAll(".rp:not(.is-muted) .dialog-subtitle-badge");const badges=webA.length?webA:webK;for(const b of badges){const n=parseInt(b.textContent);if(!isNaN(n))count+=n}hamsket.updateBadge(count)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'wechat'
			,logo: 'wechat.png'
			,name: 'WeChat'
			,description: locale['services[8]']
			,url: 'https://web.wechat.com/'
			,type: 'messaging'
		},
		{
			 id: 'gmail'
			,logo: 'gmail.png'
			,name: 'Gmail'
			,description: locale['services[9]']
			,url: 'https://mail.google.com/mail/?labs=0'
			,type: 'email'
			,allow_popups: true
			,js_unread: `let checkUnread=()=>{try{const m=document.title.match(/Inbox\\s*\\((\\d+)\\)/);if(m){hamsket.updateBadge(parseInt(m[1]));return}const a=document.getElementsByClassName("aim")[0];if(a){const parts=a.textContent.split(":");hamsket.updateBadge(parseInt(parts[parts.length-1].replace(/[^0-9]/g,""))||0)}else{hamsket.updateBadge(0)}}catch(e){hamsket.updateBadge(0)}};setInterval(checkUnread,3e3);`
			,note: 'To enable desktop notifications, you have to go to Settings inside Gmail. <a href="https://support.google.com/mail/answer/1075549?ref_topic=3394466" target="_blank">Read more...</a>'
		},
		{
			 id: 'chatwork'
			,logo: 'chatwork.png'
			,name: 'ChatWork'
			,description: locale['services[11]']
			,url: 'https://www.chatwork.com/login.php'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside ChatWork.'
		},
		{
			 id: 'groupme'
			,logo: 'groupme.png'
			,name: 'GroupMe'
			,description: locale['services[12]']
			,url: 'https://web.groupme.com/signin'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside GroupMe. To count unread messages, be sure to be in Chats.'
			,js_unread: `let checkUnread=()=>{const a=document.querySelectorAll(".badge-count:not(.ng-hide)");let b=0;for(let i of a)b+=parseInt(i.innerHTML.trim());hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'gitter'
			,logo: 'gitter.png'
			,name: 'Gitter'
			,description: locale['services[14]']
			,url: 'https://gitter.im/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("unread-indicator");let c=0;for(let i of e)c+=parseInt(i.innerHTML.trim(),10)||0;hamsket.updateBadge(c)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'steam'
			,logo: 'steam.png'
			,name: 'Steam Chat'
			,description: locale['services[15]']
			,url: 'https://steamcommunity.com/chat'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside Steam Chat.'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("FriendMessageCount");let t=0;for(let i of e){const iTrim=parseInt(i.innerHTML.trim());t+=isNaN(iTrim)||"none"===i.parentNode.style.display?0:iTrim}hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'discord'
			,logo: 'discord.png'
			,name: 'Discord'
			,description: locale['services[16]']
			,url: 'https://discord.com/login'
			,type: 'messaging'
			,titleBlink: true
			,js_unread: `const checkUnread=()=>{let direct=0;const badges=document.querySelectorAll('[class*="lowerBadge_"] [class*="numberBadge_"],[class*="lowerBadge-"] [class*="numberBadge-"]');for(const badge of badges){const n=parseInt(badge.textContent);if(!isNaN(n))direct+=n}const indirect=document.title.indexOf("\\u2022")!==-1?1:0;hamsket.updateBadge(direct,indirect)};setInterval(checkUnread,3e3);`
			,note: 'To enable desktop notifications, you have to go to Options inside Discord.'
		},
		{
			 id: 'outlook'
			,logo: 'outlook.png'
			,name: 'Outlook'
			,description: locale['services[17]']
			,url: 'https://mail.live.com/'
			,type: 'email'
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{const fav=document.querySelector(".ms-FocusZone [role=tree] i[data-icon-name=Inbox]").parentNode.parentNode.lastElementChild,folders=document.querySelectorAll(".ms-FocusZone [role=tree]")[1].children[1].querySelector("span span"),textContent=fav?fav.textContent:folders?folders.textContent:0,count=hamsket.parseIntOrZero(textContent);hamsket.updateBadge(count)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'outlook365'
			,logo: 'outlook365.png'
			,name: 'Outlook 365'
			,description: locale['services[18]']
			,url: 'https://outlook.office.com/owa/'
			,type: 'email'
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{const inbox=document.querySelector(".ms-FocusZone i[data-icon-name=Inbox]").parentNode.parentNode.querySelector("span span"),result=inbox?inbox.textContent:0,count=hamsket.parseIntOrZero(result);hamsket.updateBadge(count)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'yahoo'
			,logo: 'yahoo.png'
			,name: 'Yahoo! Mail'
			,description: locale['services[19]']
			,url: 'https://mail.yahoo.com/'
			,type: 'email'
			,note: 'To enable desktop notifications, you have to go to Options inside Yahoo! Mail.'
		},
		{
			 id: 'protonmail'
			,logo: 'protonmail.png'
			,name: 'ProtonMail'
			,description: locale['services[20]']
			,url: 'https://account.proton.me/login'
			,type: 'email'
		},
		{
			 id: 'tutanota'
			,logo: 'tutanota.png'
			,name: 'Tutanota'
			,description: locale['services[21]']
			,url: 'https://mail.tutanota.com/'
			,type: 'email'
		},
		{
			 id: 'hushmail'
			,logo: 'hushmail.png'
			,name: 'Hushmail'
			,description: locale['services[22]']
			,url: 'https://www.hushmail.com/hushmail/index.php'
			,type: 'email'
		},
		{
			 id: 'missive'
			,logo: 'missive.png'
			,name: 'Missive'
			,description: locale['services[23]']
			,url: 'https://mail.missiveapp.com/login'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("unseen-count");let t=0;for(let i of e)t+=parseInt(i.innerHTML.trim());hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'rocketchat'
			,logo: 'rocketchat.png'
			,name: 'Rocket Chat'
			,description: locale['services[24]']
			,url: '___'
			,type: 'messaging'
			,note: 'You have to use this service by signing in with your email or username (No SSO allowed yet).'
		},
		{
			 id: 'wire'
			,logo: 'wire.png'
			,name: 'Wire'
			,description: locale['services[25]']
			,url: 'https://app.wire.com/'
			,type: 'messaging'
		},
		{
			 id: 'mattermost'
			,logo: 'mattermost.png'
			,name: 'Mattermost'
			,description: locale['services[32]']
			,url: '___'
			,type: 'messaging'
			,custom_js: `Object.defineProperty(document,"title",{configurable:!0,set(a){document.getElementsByTagName("title")[0].innerHTML="*"===a[0]?"(•) Mattermost":a},get:()=>document.getElementsByTagName("title")[0].innerHTML});`
		},
		{
			 id: 'dingtalk'
			,logo: 'dingtalk.png'
			,name: 'DingTalk'
			,description: locale['services[33]']
			,url: 'https://im.dingtalk.com/'
			,type: 'messaging'
		},
		{
			 id: 'mysms'
			,logo: 'mysms.png'
			,name: 'mysms'
			,description: locale['services[34]']
			,url: 'https://app.mysms.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("unread");let t=0;for(let i of e)t+=parseInt(i.firstChild.innerHTML.trim());hamsket.updateBadge(t)};"https://app.mysms.com/#login"===document.baseURI&&(document.getElementsByClassName("innerPanel")[0].rows[0].style.display="none",document.getElementsByClassName("innerPanel")[0].rows[1].cells[0].firstElementChild.style.display="none",document.getElementsByClassName("msisdnLoginPanel")[0].style.display="inline"),setInterval(checkUnread,3e3);`
			,note: 'You have to use this service by signing in with your mobile number.'
		},
		{
			 id: 'threads'
			,logo: 'threads.png'
			,name: 'Threads'
			,description: 'Threads is a text-based social app by Meta.'
			,url: 'https://www.threads.net/'
			,type: 'social'
		},
		{
			 id: 'bluesky'
			,logo: 'bluesky.png'
			,name: 'Bluesky'
			,description: 'Bluesky is a decentralized social network built on the AT Protocol.'
			,url: 'https://bsky.app/'
			,type: 'social'
		},
		{
			 id: 'chatgpt'
			,logo: 'chatgpt.png'
			,name: 'ChatGPT'
			,description: 'ChatGPT is an AI assistant by OpenAI.'
			,url: 'https://chatgpt.com/'
			,type: 'ai'
		},
		{
			 id: 'claude'
			,logo: 'claude.png'
			,name: 'Claude'
			,description: 'Claude is an AI assistant by Anthropic.'
			,url: 'https://claude.ai/'
			,type: 'ai'
		},
		{
			 id: 'gemini'
			,logo: 'gemini.png'
			,name: 'Gemini'
			,description: 'Gemini is an AI assistant by Google.'
			,url: 'https://gemini.google.com/'
			,type: 'ai'
		},
		{
			 id: 'notion'
			,logo: 'notion.png'
			,name: 'Notion'
			,description: 'Notion is an all-in-one workspace for notes, tasks, wikis, and databases.'
			,url: 'https://www.notion.so/'
			,type: 'productivity'
		},
		{
			 id: 'linear'
			,logo: 'linear.png'
			,name: 'Linear'
			,description: 'Linear is a project management tool for software teams.'
			,url: 'https://linear.app/'
			,type: 'productivity'
		},
		{
			 id: 'figma'
			,logo: 'figma.png'
			,name: 'Figma'
			,description: 'Figma is a collaborative design tool for UI/UX.'
			,url: 'https://www.figma.com/'
			,type: 'productivity'
		},
		{
			 id: 'signal'
			,logo: 'signal.png'
			,name: 'Signal'
			,description: 'Signal is a privacy-focused encrypted messaging app.'
			,url: 'https://signal.org/'
			,type: 'messaging'
			,note: 'Signal requires linking your phone to use the desktop/web version.'
		},
		{
			 id: 'custom'
			,logo: 'custom.png'
			,name: '_Custom Service'
			,description: locale['services[38]']
			,url: '___'
			,type: 'custom'
			,allow_popups: true
		},
		{
			 id: 'mightytext'
			,logo: 'mightytext.png'
			,name: 'Mighty Text'
			,description: locale['services[41]']
			,url: 'https://mightytext.net/web/'
			,type: 'messaging'
		},
		{
			 id: 'roundcube'
			,logo: 'roundcube.png'
			,name: 'Roundcube'
			,description: locale['services[42]']
			,url: '___'
			,type: 'email'
		},
		{
			 id: 'horde'
			,logo: 'horde.png'
			,name: 'Horde'
			,description: locale['services[43]']
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("count");let t=0;for(let i of e)t+=parseInt(i.innerHTML.match(/[0-9]+/g));hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,note: 'To enable desktop notifications and automatic mail check, you have to go to Options inside Horde.'
		},
		{
			 id: 'squirrelmail'
			,logo: 'squirrelmail.png'
			,name: 'SquirrelMail'
			,description: locale['services[44]']
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("leftunseen");let t=0;for(let i of e)t+=parseInt(i.innerHTML);hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'zohoemail'
			,logo: 'zohoemail.png'
			,name: 'Zoho Email'
			,description: locale['services[45]']
			,url: 'https://mail.zoho.___/'
			,type: 'email'
			,js_unread: 'zmail.aInfo[zmail.accId].mailId = "a";'
			,note: 'To enable desktop notifications, you have to go to Settings inside Zoho Email. Add .com or the other relevant fieldto the URL field depending on your location.'
		},
		{
			 id: 'zohochat'
			,logo: 'zohochat.png'
			,name: 'Zoho Chat'
			,description: locale['services[46]']
			,url: 'https://chat.zoho.___/'
			,type: 'messaging'
			,js_unread: `NotifyByTitle.show=function(){},NotifyByTitle.start=function(){},NotifyByTitle.stop=function(){};let checkUnread=()=>{let t=0;$(".msgnotify").each(function(){let i=parseInt($(this).html());t+=isNaN(i)?0:i}),hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,note: 'Add .com the other relevant TLD into the URL field depending on your location.'
		},
		{
			 id: 'aol'
			,logo: 'aol.png'
			,name: 'Aol'
			,description: 'Free and simple (old) webmail service.'
			,url: 'https://mail.aol.com/'
			,type: 'email'
		},
		{
			 id: 'ringcentral'
			,logo: 'glip.png'
			,name: 'RingCentral'
			,description: 'RingCentral is a team messaging and video conferencing platform for business communication.'
			,url: 'https://app.ringcentral.com/'
			,type: 'messaging'
		},
		{
			 id: 'yandex'
			,logo: 'yandex.png'
			,name: 'Yandex Mail'
			,description: 'Yandex is a free webmail service with unlimited mail storage, protection from viruses and spam, access from web interface, etc.'
			,url: 'https://mail.yandex.com/'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const t=parseInt($(".mail-MessagesFilters-Item_unread .mail-LabelList-Item_count").html());hamsket.updateBadge(isNaN(t)?0:t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'irccloud'
			,logo: 'irccloud.png'
			,name: 'IRCCloud'
			,description: 'IRCCloud is a modern IRC client that keeps you connected, with none of the baggage.'
			,url: 'https://www.irccloud.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let t=0;const badges=document.querySelectorAll(".bufferBadges > .badge");for(let n of badges)t+=n.textContent?parseInt(n.textContent,10):0;hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,custom_domain: true
		},
		{
			 id: 'ryver'
			,logo: 'ryver.png'
			,name: 'Ryver'
			,description: 'Ryver is a team communication tool that organizes team collaboration, chats, files, and even emails into a single location, for any size team, for FREE.'
			,url: 'https://___.ryver.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(parseInt(document.getElementsByClassName("scene-space-tab-button--flash").length))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'kiwi'
			,logo: 'kiwi.png'
			,name: 'Kiwi IRC'
			,description: 'KiwiIRC makes Web IRC easy. A hand-crafted IRC client that you can enjoy. Designed to be used easily and freely.'
			,url: 'https://kiwiirc.com/client'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let a=0,b=!1;$(".activity").each(function(){a+=parseInt($(this).html())});const msgs=$(".panel[style*='display:block'] .msg");for(let msg of msgs)b?a++:$(this).hasClass("last_seen")&&(b=!0);hamsket.updateBadge(a)};setInterval(checkUnread,3e3);`
			,custom_domain: true
		},
		{
			 id: 'icloud'
			,logo: 'icloud.png'
			,name: 'iCloud Mail'
			,description: 'iCloud makes sure you always have the latest versions of your most important things — documents, photos, notes, contacts, and more — on all your devices. It can even help you locate a missing iPhone, iPad, iPod touch or Mac.'
			,url: 'https://www.icloud.com/#mail'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge("none"===document.querySelector(".current-app").querySelector(".sb-badge").style.display?0:parseInt(document.querySelector(".current-app").querySelector(".text").innerHTML.trim()))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'rainloop'
			,logo: 'rainloop.png'
			,name: 'RainLoop'
			,description: 'RainLoop Webmail - Simple, modern & fast web-based email client.'
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const t=document.querySelectorAll(".e-item .e-link:not(.hidden) .badge.pull-right.count");let e=0;for(let i of t){let iTrim=parseInt(i.textContent.trim());iTrim%1==0&&"block"===window.getComputedStyle(i).display&&(e+=parseInt(iTrim))}hamsket.updateBadge(e)};setInterval(checkUnread,1e3);`
		},
		{
			 id: 'hootsuite'
			,logo: 'hootsuite.png'
			,name: 'Hootsuite'
			,description: 'Enhance your social media management with Hootsuite, the leading social media dashboard. Manage multiple networks and profiles and measure your campaign results.'
			,url: 'https://hootsuite.com/dashboard'
			,type: 'messaging'
		},
		{
			 id: 'zimbra'
			,logo: 'zimbra.png'
			,name: 'Zimbra'
			,description: 'Over 500 million people rely on Zimbra and enjoy enterprise-class open source email collaboration at the lowest TCO in the industry. Discover the benefits!'
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(appCtxt.getById(ZmFolder.ID_INBOX).numUnread)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'movim'
			,logo: 'movim.png'
			,name: 'Movim'
			,description: 'Movim is a decentralized social network, written in PHP and HTML5 and based on the XMPP standard protocol.'
			,url: 'https://___.movim.eu/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("color dark");let b=0;for(let i of a){const c=i.getElementsByClassName("counter");for(let ii of c){const iiTrim=parseInt(ii.textContent.trim());iiTrim%1==0&&(b+=iiTrim)}}hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`
			,custom_domain: true
		},
		{
			 id: 'pushbullet'
			,logo: 'pushbullet.png'
			,name: 'Pushbullet'
			,description: 'Pushbullet connects your devices, making them feel like one.'
			,url: 'https://www.pushbullet.com/'
			,type: 'messaging'
		},
		{
			 id: 'Element'
			,logo: 'element.png'
			,name: 'Element'
			,description: 'Element is a simple and elegant collaboration environment that gathers all of your different conversations and app integrations into one single app.'
			,url: 'https://app.element.io/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const indirect=document.querySelectorAll(".mx_RoomTile_badgeContainer > .mx_NotificationBadge_visible.mx_NotificationBadge_dot > .mx_NotificationBadge_count").length,q=document.querySelectorAll(".mx_RoomSublist_badgeContainer > .mx_NotificationBadge_visible:not(.mx_NotificationBadge_dot) > .mx_NotificationBadge_count");let direct=0;for(let i of q)direct+=hamsket.parseIntOrZero(i.textContent);hamsket.updateBadge(direct,indirect)};setInterval(checkUnread,1e3);`
			,custom_domain: true
		},
		{
			 id: 'webexteams'
			,logo: 'webexteams.png'
			,name: 'Cisco Webex Teams'
			,description: 'Cisco Webex Teams is for group chat, video calling, and sharing documents with your team. It’s all backed by Cisco security and reliability.'
			,url: 'https://teams.webex.com/'
			,type: 'messaging'
		},
		{
			 id: 'flock'
			,logo: 'flock.png'
			,name: 'Flock'
			,description: 'Flock is a free enterprise tool for business communication. Packed with tons of productivity features, Flock drives efficiency and boosts speed of execution.'
			,url: 'https://web.flock.co/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("unreadMessages no-unread-mentions has-unread");let b=0;for(const i of a)b+=parseInt(i.innerHTML.trim());hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`

		},
		{
			 id: 'crisp'
			,logo: 'crisp.png'
			,name: 'Crisp'
			,description: 'Connect your customers to your team.'
			,url: 'https://app.crisp.chat/'
			,type: 'messaging'
		},
		{
			id: 'xing',
			logo: 'xing.png',
			name: 'XING',
			description: 'Career-oriented social networking',
			url: 'https://www.xing.com/messages/conversations',
			type: 'messaging',
			js_unread: `let checkUnread=()=>{let count=null;const notificationElement=document.querySelector('[data-update="unread_conversations"]');notificationElement&&"none"!==notificationElement.style.display&&(count=parseInt(notificationElement.textContent.trim(),10)),hamsket.updateBadge(count)};setInterval(checkUnread,3e3);`
		},
		{
			id: 'threema',
			logo: 'threema.png',
			name: 'Threema',
			description: 'Seriously secure messaging',
			url: 'https://web.threema.ch/',
			type: 'messaging',
			js_unread: `!function(){let unreadCount=0;function checkUnread(){let newUnread=0;try{const webClientService=angular.element(document.documentElement).injector().get("WebClientService"),conversations=webClientService.conversations.conversations;conversations.forEach(function(conversation){newUnread+=conversation.unreadCount})}catch(e){}newUnread!==unreadCount&&(unreadCount=newUnread,hamsket.updateBadge(unreadCount))}setInterval(checkUnread,3e3),checkUnread()}();`
		},
		{
			 id: 'workplace'
			,logo: 'workplace.png'
			,name: 'Workplace'
			,description: 'Connect everyone in your company and turn ideas into action. Through group discussion, a personalised News Feed, and voice and video calling, work together and get more done. Workplace is an ad-free space, separate from your personal Facebook account.'
			,url: 'https://___.facebook.com/'
			,type: 'messaging'
		},
		{
			 id: 'teams'
			,logo: 'teams.png'
			,name: 'Microsoft Teams'
			,description: 'Microsoft Teams is the chat-based workspace in Office 365 that integrates all the people, content, and tools your team needs to be more engaged and effective.'
			,url: 'https://teams.microsoft.com'
			,custom_js: 'Object.defineProperty(navigator.serviceWorker,"register",{value:()=>Promise.reject()});'
			,type: 'messaging'
			,js_unread: `const checkUnread=()=>{let messages=0;const badges=document.querySelectorAll(".fui-Badge");for(const badge of badges){const n=parseInt(badge.textContent);if(!isNaN(n))messages+=n}hamsket.updateBadge(messages)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'lounge'
			,logo: 'lounge.png'
			,name: 'The Lounge'
			,description: 'Self-hosted web IRC client.'
			,url: '___'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("badge highlight");let b=0;for(let i of a){const iTrim=parseInt(i.textContent.trim());iTrim%1==0&&(b+=iTrim)}hamsket.updateBadge(b)};setInterval(checkUnread,1e3);`
		},
		{
			 id: 'linkedin'
			,logo: 'linkedin.png'
			,name: 'LinkedIn'
			,description: 'Professional networking and messaging platform.'
			,url: 'https://www.linkedin.com/messaging'
			,type: 'social'
		},
		{
			 id: 'fastmail'
			,logo: 'fastmail.png'
			,name: 'FastMail'
			,description: 'Secure, reliable email hosting for businesses, families and professionals. Premium email with no ads, excellent spam protection and rapid personal support.'
			,url: 'https://www.fastmail.com/mail/'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("v-FolderSource-badge");let t=0;for(const i of e){const iTrim=parseInt(i.innerHTML.trim());t+=isNaN(iTrim)?0:iTrim}hamsket.updateBadge(t)};setInterval(checkUnread,3e3),setTimeout(function(){O.WindowController.openExternal=function(a){let b=document.createElement("a");b.href=a,b.setAttribute("target","_blank"),b.click()}},3e3);`
			,note: 'To enable desktop notifications, you have to go to Settings inside FastMail.'
		},
		{
			 id: 'jandi'
			,logo: 'jandi.png'
			,name: 'Jandi'
			,description: 'Jandi is a group-oriented enterprise messaging platform with an integrated suite of collaboration tools for workplace.'
			,url: 'https://___.jandi.com/'
			,type: 'messaging'
		},
		{
			 id: 'messengerpages'
			,logo: 'messengerpages.png'
			,name: 'Messenger for Pages'
			,description: 'Chat with the people of your Facebook Page.'
			,url: 'https://facebook.com/___/inbox/'
			,type: 'messaging'
			,custom_js: `let remove=e=>{let r=document.getElementById(e);return r.parentNode.removeChild(r)};remove("pagelet_bluebar"),remove("pages_manager_top_bar_container");`
		},
		{
			 id: 'messengerbusiness'
			,logo: 'messengerpages.png'
			,name: 'Messenger for Business'
			,description: 'Messenger can help facilitate communication with your customers.'
			,url: 'https://business.facebook.com/___/inbox/'
			,type: 'messaging'
			,custom_js: `let remove=e=>{let r=document.getElementById(e);return r.parentNode.removeChild(r)};remove("pagelet_bluebar"),remove("pages_manager_top_bar_container");`
		},
		{
			 id: 'vk'
			,logo: 'vk.png'
			,name: 'VK Messenger'
			,description: 'Simple and Easy App for Messaging on VK.'
			,url: 'https://m.vk.com/im'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(parseInt(document.getElementById("l_msg").innerText.replace(/[^0-9]+/g,"")))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'mastodon'
			,logo: 'mastodon.png'
			,name: 'Mastodon'
			,description: 'Mastodon is a free, open-source social network server. A decentralized solution to commercial platforms.'
			,url: 'https://mastodon.social/auth/sign_in'
			,type: 'social'
			,custom_domain: true
			,note: '<a href="https://instances.social/" target="_blank">List of instances</a>'
		},
		{
			 id: 'teamworkchat'
			,logo: 'teamworkchat.png'
			,name: 'Teamwork Chat'
			,description: 'Say goodbye to email. Take your online collaboration to the next level with Teamwork Chat and keep all team discussions in one place. Chat to your team in a fun and informal way with Teamwork Chat.'
			,url: 'https://___/chat'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(parseInt(document.getElementsByClassName("sidebar-notification-indicator").length>0?document.getElementsByClassName("sidebar-notification-indicator")[0].innerHTML:0))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'intercom'
			,logo: 'intercom.png'
			,name: 'Intercom'
			,description: 'Intercom makes it easy to communicate with your customers personally, at scale. Designed to feel like the messaging apps you use every day, Intercom lets you talk to consumers almost anywhere: inside your app, on your website, across social media and via email.'
			,url: 'https://app.intercom.io'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("unread")[0];hamsket.updateBadge(t=void 0===a?0:parseInt(a.textContent.replace(/[^0-9]/g,"")))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'googlevoice'
			,logo: 'googlevoice.png'
			,name: 'Google Voice'
			,description: 'A free phone number for life.  Stay in touch from any screen.  Use your free number to text, call, and check voicemail  all from one app. Plus, Google Voice works on all of your devices so you can connect and communicate how you want.'
			,url: 'https://voice.google.com'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.querySelectorAll("a[gv-test-id='sidenav-calls'] .navItemBadge, a[gv-test-id='sidenav-messages'] .navItemBadge, a[gv-test-id='sidenav-voicemail'] .navItemBadge");let n=0;e.forEach(r=>{hamsket.isInViewport(r)&&(n+=hamsket.parseIntOrZero(r.innerHTML))}),hamsket.updateBadge(n)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'mailru'
			,logo: 'mailru.png'
			,name: 'Mail.Ru'
			,description: 'Free voice and video calls, ICQ support, Odnoklassniki, VKontakte, Facebook, online games, free SMS.'
			,url: 'https://webagent.mail.ru/webim/agent/popup.html'
			,type: 'email'
		},
		{
			 id: 'zulip'
			,logo: 'zulip.png'
			,name: 'Zulip'
			,description: "The world's most productive group chat"
			,url: 'https://___.zulipchat.com/'
			,type: 'messaging'
			,custom_domain: true
		},
		{
			 id: 'hangoutschat'
			,logo: 'hangoutschat.png'
			,name: 'Google Chat'
			,description: 'Google Chat is a messaging platform built for teams.'
			,url: 'https://chat.google.com/'
			,type: 'messaging'
			,titleBlink: true
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(document.querySelectorAll(".SSPGKf.EyyDtb.Q6oXP:not(.oCHqfe) .eM5l9e.FVKzAb").length)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'androidmessages'
			,logo: 'androidmessages.png'
			,name: 'Android Messages'
			,description: 'Text on your computer with Messages for web.'
			,url: 'https://messages.google.com/web'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(Array.prototype.slice.apply(document.querySelectorAll(".text-content.unread")).reduce((c,b) => !b.querySelector(".notifications-off")+c,0))};setInterval(checkUnread,3e3);`
		},
		{
			id: 'instagram'
			,logo: 'instagram.png'
			,name: 'Instagram'
			,description: 'Instagram is a photo and video sharing social networking service.'
			,url: 'https://www.instagram.com'
			,type: 'social'
			,js_unread: `const checkUnread=()=>{const element=document.querySelector('a[href^="/direct/inbox"]');hamsket.updateBadge(hamsket.parseIntOrZero(element.textContent))};setInterval(checkUnread,3e3);`
		},
	]
});
