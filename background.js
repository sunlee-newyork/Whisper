// ********* [EDITED] Making major shift from using chrome.storage for JID/PASS_MASTER to background pages (5/9/14) **********

// [INITIAL] Options page icon on top right corner
function openOrFocusOptionsPage() {

  var optionsUrl = chrome.extension.getURL('settings.html');

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
      chrome.tabs.create({url: "settings.html"});
    }
  })

}

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage();
});

// [ADDED] Options page connection event listener (5/9/14)
var BG = {

  connection: null,

  loginInfo: {
    jid: null,
    pass: null  
  },
  
  roster: null,

  currentStatus: null,

  jid_to_id: function (jid) {
    return Strophe.getBareJidFromJid(jid)
      .replace(/@/g, "-")
      .replace(/\./g, "-");
  },

  on_connect: function (status) {
    if (status === Strophe.Status.CONNECTING) {
      BG.currentStatus = 1;
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    } else if (status === Strophe.Status.CONNFAIL) {
      BG.currentStatus = 2;
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    } else if (status === Strophe.Status.AUTHENTICATING) {
      BG.currentStatus = 3;
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    } else if (status === Strophe.Status.AUTHFAIL) {
      BG.currentStatus = 4;
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    } else if (status === Strophe.Status.CONNECTED) {
      BG.currentStatus = 5;
      $(document).trigger('connected');
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    } else if (status === Strophe.Status.DISCONNECTING) {
      BG.currentStatus = 7;
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    } else if (status === Strophe.Status.DISCONNECTED) {
      BG.currentStatus = 6;
      $(document).trigger('disconnected');
      chrome.extension.sendMessage({ type: 'status', content: BG.currentStatus }, function (response) {
        if (response.type == "success") { console.log('Status sent successfully.'); }
      });
    }
  },

  onRoster: function(iq) {
    $(iq).find('item').each(function () {
      var jid = $(this).attr('jid');
      var name = $(this).attr('name') || jid;

      var jid_id = BG.jid_to_id(jid);

      var contact = $("<li id='" +jid_id+ "'>" +
                      "<div class='roster-contact'>" +
                      "<div class='roster-name text small'>" +
                      name + "</div></div></li>");

      BG.roster += contact;
    });

    $(iq).find('item').promise().done(function () {
      chrome.extension.sendMessage({ type: 'roster', content: BG.roster }, function (response) {
        if (response.type == 'success') { console.log("Roster sent successfully."); }
      })
    });
    
    // [ORIGINAL] Send initial presence to Strophe connection (5/15/14)
    BG.connection.send($pres());
  }

}

function login(user, pass) {
  BG.loginInfo.jid = user;
  BG.loginInfo.pass = pass; 
  console.log('BG JID: '+BG.loginInfo.jid+' and PASS: '+BG.loginInfo.pass);
  $(document).trigger('connect', BG.loginInfo);
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

// CONNECT EVENT \\
$(document).bind('connect', function (ev, data) {
  BG.connection = new Strophe.Connection(
    'http://0.0.0.0:5280/http-bind/');

  BG.connection.connect(data.jid+'@chat.facebook.com', data.pass, BG.onConnect);
});

// CONNECTED EVENT \\
$(document).bind('connected', function () {
  console.log('Connected.');
  console.log(BG.connection);

  var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
  
  BG.connection.sendIQ(iq, BG.onRoster);
});

// [ADDED] DISCONNECT LISTENER (5/15/14) \\
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == 'disconnect') {
    BG.connection.disconnect();
    BG.connection = null;
    BG.onConnect;

    sendResponse({type: 'success'});
  }
});

