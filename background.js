// CAME WITH FB LIKE EXAMPLE, HAVE NOT CUSTOMIZED ANYTHING TO STEALTHCHAT YET
// Seems like something I shouldn't touch. To be reviewed later (4/1/14)

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

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage();
});
