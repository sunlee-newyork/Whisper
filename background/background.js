// ********* [EDITED] Making major shift from using chrome.storage for JID/PASS_MASTER to background pages (5/9/14) **********

console.log('background.js loaded.');
/* ======================================================================
=                        BROWSER ICON LISTENER                          =
====================================================================== */

// [INITIAL] Options page icon on top right corner
function openOrFocusOptionsPage() {

  var optionsUrl = chrome.extension.getURL('options.html');

  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;
    for (var i=0; i < extensionTabs.length; i++) {
      if (optionsUrl == extensionTabs[i].url) {
        found = true;
        console.log("tab id: " + extensionTabs[i].id);
        chrome.tabs.update(extensionTabs[i].id, {"selected": true});
      }
    }
    if (found == false) {
      chrome.tabs.create({url: "options.html"});
    }
  })

}

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage();
});


/* ======================================================================
=                           BACKGROUND OBJECT                           =
====================================================================== */

// [ADDED] Options page connection event listener (5/9/14)
var Handler = {

  loginInfo: {
    jid: null,
    pass: null  
  },
  
  roster: null,

  currentStatus: null,

  login: function (user, pass) {
    this.loginInfo.jid = user;
    this.loginInfo.pass = pass;
    console.log('BG JID: '+this.loginInfo.jid+' and PASS: '+this.loginInfo.pass);
    $(document).trigger('connect', this.loginInfo);
  }

}

/* [FIX] Change this to send message div variables (5/15/14)
chrome.tabs.onCreated.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, BG, function (response) {
    console.log('sendMessage response: '+response);
  });
});
*/


// [MOVED] From 'settings.js' (5/15/14)
/* ======================= CUSTOM EVENT BINDS ====================== */

// CONNECT EVENT BIND \\
$(document).bind('connect', function (ev, data) {
  Connector.connection = new Strophe.Connection(
    'http://0.0.0.0:5280/http-bind/');

  console.log('Connector.connection after "connect" trigger: ', Connector.connection);

  Connector.connection.connect(data.jid+'@chat.facebook.com', data.pass, Connector.onConnect);
  console.log('Connector.connection after connect is called: ', Connector.connection);
});

// CONNECTED EVENT BIND \\
$(document).bind('connected', function () {
  console.log('Connected.');
  console.log(Connector.connection);

  var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
  
  Connector.connection.sendIQ(iq, Connector.onRoster);
});

// [ADDED] DISCONNECT LISTENER (5/15/14) \\
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == 'disconnect') {
    Connector.connection.disconnect();
    Connector.connection = null;
    Connector.onConnect;

    sendResponse({type: 'success'});
  }
});

