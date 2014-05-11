// CAME WITH FB LIKE EXAMPLE, HAVE NOT CUSTOMIZED ANYTHING TO STEALTHCHAT YET
// Seems like something I shouldn't touch. To be reviewed later (4/1/14)

// [EDITED] Making major shift from using chrome.storage for JID/PASS_MASTER to background pages (5/9/14)

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
  });

}

/* [DELETE??] I'm not sure what this does yet (5/9/14)
chrome.extension.onConnect.addListener(function(port) {

  var tab = port.sender.tab;
  // This will get called by the content script we execute in
  // the tab as a result of the user pressing the browser action.
  port.onMessage.addListener(function(info) {
    var max_length = 1024;
    if (info.selection.length > max_length)
      info.selection = info.selection.substring(0, max_length);
      openOrFocusOptionsPage();
  });

});
*/

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage();
});

// [ADDED] Options page connection event listener (5/9/14)
var BG = {
  jid: null,
  pass: null
}

function saveInfo(jid, pass) {
  BG.jid = jid;
  BG.pass = pass; 
  console.log('BG JID: '+BG.jid+' and PASS: '+BG.pass);
}

// [ADDED] New tab event listener (5/9/14)
/* [DELETE?] This is only needed if opened tab sends manual message request (5/9/14)
// as compared to background immediately sending request upon tabCreated (see below)
function onMessage(request, sender, sendResponse) {
  if (request.action == 'getLogin') {
    if (BG.kid && BG.pass) {
      sendResponse(BG);
    }
  }
}
*/

chrome.tabs.onCreated.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, BG, function (response) {
    console.log('sendMessage response: '+response);
  });
});

