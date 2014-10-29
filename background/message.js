console.log('message.js loaded.');

/* ======================================================================
=                            MESSAGE OBJECT                             =
====================================================================== */

var Message = {

	onMessageReceived: function (incomingMessage) {
    // [DELETE] $("#whisper_incoming").fadeIn('fast'); (5/6/14)
    console.log('Message triggered: ', incomingMessage);
    var fullJID = $(incomingMessage).attr('from');
    console.log('Full JID: ' + fullJID);
    var incomingJID = Strophe.getBareJidFromJid(fullJID);
    console.log('JID: ' + incomingJID);
    var jidID = Handler.convertJidToId(incomingJID);
    console.log('JID converted to ID: ' + jidID);

  	// Send message packet to all tabs [10/28/14]
		chrome.tabs.query({}, function(tabs) {
      for (var i=0; i<tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, {
        	'type': 'message',
        	//'messageReceived': incomingMessage,
        	'jid': incomingJID,
        	'full_jid': fullJID,
        	'jid_id': jidID
        });
      }
    });

    // if message is received, send $message to tab.js so it can be handled there [10/28/14]
    // send message as an object with $message, $fullJID, $jid, and $jidID [10/28/14]

    return true;
  },

  scrollChat: function (jidID) {
    // ORIGINAL Whisper \\
    var height = $('#chat-'+jidID).scrollHeight;
    $('#chat-'+jidID).scrollTop(height);

    // MINE - VERSION 1 \\
    // $('#chat-'+jidID+' :last-child').focus();

    // MINE - VERSION 2 \\
    // $('chat-'+jidID).lastChild.focus();
  }
	
}