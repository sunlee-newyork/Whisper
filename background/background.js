// ********* [EDITED] Making major shift from using chrome.storage for JID/PASS_MASTER to background pages (5/9/14) **********

console.log('background.js loaded.');
/* ======================================================================
=                        BROWSER ICON LISTENER                          =
====================================================================== */

// [INITIAL] Options page icon on top right corner
function openOrFocusOptionsPage() {

  var optionsUrl = chrome.extension.getURL('options/options.html');

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
      chrome.tabs.create({url: "options/options.html"});
    }
  })

}

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage();
});

/* ======================================================================
=                             HANDLER OBJECT                            =
====================================================================== */

// [ADDED] Options page connection event listener (5/9/14)
var Handler = {

  roster: null,

  login: function(user, pass) {
    Connector.connection = new Strophe.Connection('http://0.0.0.0:5280/http-bind/');

    Connector.connection.connect(user+'@chat.facebook.com', pass, Connector.onConnect);
  },

  convertJidToId: function (jid) {
    return Strophe.getBareJidFromJid(jid)
      .replace(/@/g, "-")
      .replace(/\./g, "-");
  }

}

/* [FIX] Change this to send message div variables (5/15/14)
chrome.tabs.onCreated.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, BG, function (response) {
    console.log('sendMessage response: '+response);
  });
});
*/

/* ======================================================================
=                           MESSAGE LISTENERS                           =
====================================================================== */

// [ADDED] DISCONNECT LISTENER (5/15/14) \\
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == 'disconnect') {
    Connector.connection.disconnect();
    Connector.connection = null;
    Connector.onConnect;

    sendResponse({type: 'success'});
  }
});


// [ADDED] OUTGOING MESSAGE LISTENER [10/15/14] \\
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == 'incomingMessage') {

    // ......... Need to fill in the rest when incoming message is received [10/15/14]

    sendResponse({type: 'success'});
  }
});

// NEW TAB LISTENER [10/29/14]
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == 'requestStatus') {
    console.log('Status request received from new tab.');
    sendResponse({
      type: 'connection',
      status: Connector.status
    });
  }
}); 