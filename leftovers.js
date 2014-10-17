// connection.js [10/16/14]

							// CHANGE THIS, THIS IS THE FRIENDS LIST (FOR KEYBOARD SHORTCUTS)
onRoster: function (iq) {
  console.log('onRoster triggered.');

  $(iq).find('item').each(function () {

    console.log('Item: ', this);
    var jid = $(this).attr('jid');
    console.log('Item JID: ' + jid);
    var name = $(this).attr('name') || jid;
    console.log('Item name: ' + name);

    // transform jid into an id
    var jid_id = Connector.convertJidToId(jid);
    console.log('JID converted to ID: ' + jid_id);

    var contact = $("<li id='" + jid_id + "'>" +
                  "<div class='roster-contact offline'>" +
                  "<div class='roster-name text small'>" +
                  name +
                  "</div><div class='roster-jid hidden'>" +
                  jid +
                  "</div></div></li>");

    console.log(contact);

    Connector.insertContact(contact);
  });

  // set up presence handler and send initial presence
  this.connection.addHandler(this.onPresence, null, "presence");
  this.connection.send($pres());
},

// connection.js [10/16/14]
onConnect: function (status, error) {
  if (status === Strophe.Status.CONNECTING) {
    //this.currentStatus = 1;  // Don't need this, can call Connector.connection.currenStatus instead.
    $('#login-status').html('Connecting...').css('color', 'rgb(50,200,50)');
    console.log('Connecting initiated...');
  } else if (status === Strophe.Status.CONNFAIL) {
    //this.currentStatus = 2;
    $('#login-status').html('Connection failed').css('color', 'rgb(200,0,0)');
    console.log('Connection failed.');
  } else if (status === Strophe.Status.AUTHENTICATING) {
    //this.currentStatus = 3;
    $('#login-status').html('Authenticating...').css('color', 'rgb(50,200,50)');
    console.log('Authenticating initiated...');
  } else if (status === Strophe.Status.AUTHFAIL) {
    //this.currentStatus = 4;
    $('#login-status').html('Authentication failed').css('color', 'rgb(200,0,0)');
    console.log('Authentication failed.');
  } else if (status === Strophe.Status.CONNECTED) {
    console.log('Status 5 detected');
    //this.currentStatus = 5;
    console.log('Current state: ' + this.currentStatus);
    console.log('Error: ' + error);
    //$('#login-status').html('Connected!').css('color', 'rgb(0,150,0)');
    //$('#user_login').html(this.connection.authcid);
    Connector.onConnected(); // for some reason, this.onConnected(); is not working. weird?? [10/15/14]
  } else if (status === Strophe.Status.DISCONNECTING) {
    //this.currentStatus = 7;
    $('#login-status').html('Disconnecting...').css('color', 'rgb(200,100,100)');
    console.log('Disconnecting initiated...');
  } else if (status === Strophe.Status.DISCONNECTED) {
    //this.currentStatus = 6;
    $(document).trigger('disconnected');
    $('#login-status').html('Disconnected').css('color', 'rgb(200,0,0)');
    $('#attach-status').html('No');
    $('#user_login').html('no one');
    console.log('Disconnected.');
  } else if (status === Strophe.Status.ATTACHED) {
    //this.currentStatus = 8;
    $('#attach-status').html('Yes');
    $('#login-status').html('Session').css('color', 'rgb(0,150,0)');
    $('#user_login').html(Strophe.getNodeFromJid(this.connection.jid));
    var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
    this.connection.sendIQ(iq, this.onRoster);
    this.connection.addHandler(this.onRosterChanged, "jabber:iq:roster", "iq", "set");
    console.log('Session attached.');
  }
},

// connection.js [10/16/14]
/* [DELETE] Don't need this, this is for session attachment (5/15/14)
  storage: {
    jid: null,
    sid: null,
    rid: null
  },


  deleteStorage: function() {
    chrome.storage.sync.remove([
      'jid', 
      'sid', 
      'rid'
    ], function() {
      this.storage.jid = null;
      this.storage.sid = null;
      this.storage.rid = null;      
      console.log('JID/SID/RID removed from chrome.storage');
      console.log('this.storage JID: '+this.storage.jid+' and SID: '+this.storage.sid+' and RID: '+this.storage.rid);
    });
  },
*/


// tab.js => connection.js [10/16/14]
// DISCONNECTED EVENT \\
$(document).bind('disconnected', function () {
  // Manually (or maybe I can keep this one in the Whisper object?)
  //Whisper.del_storage();
  
  Whisper.connection = null;
  Whisper.pending_subscriber = null;
  Whisper.on_connect;
});

// background.js [10/16/14]
// [MOVED] From 'settings.js' (5/15/14)
/* ======================= CUSTOM EVENT BINDS ====================== */

/* [DELETED] Added as methods to Connector object in connection.js [10/15/14] 
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
*/
