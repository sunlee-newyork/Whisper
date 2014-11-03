//=== AS OF 4/15/14, CHROME.STORAGE WORKING VERSION ===\\
// Check if this file is loaded [10/12/14]
console.log('connection.js loaded.');

/* ======================================================================
=                           CONNECTION OBJECT                           =
====================================================================== */

var Connector = {

  connection: null,
  status: null,
  roster: [],

  onConnect: function (status, error) {
    // Get all pages except the background page [10/17/14]
    //Connector.views = chrome.extension.getViews();

    if (status === Strophe.Status.CONNECTING) {
      console.log('Connecting initiated...');
      Connector.status = 1;
    } else if (status === Strophe.Status.CONNFAIL) {
      console.log('Connection failed.');
      Connector.status = 2;
    } else if (status === Strophe.Status.AUTHENTICATING) {
      console.log('Authenticating initiated...');
      Connector.status = 3;
    } else if (status === Strophe.Status.AUTHFAIL) {
      console.log('Authentication failed.');
      Connector.status = 4;
    } else if (status === Strophe.Status.CONNECTED) {
      console.log('Connected.');
      Connector.status = 5;
      Connector.onConnected();
      var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});      
      Connector.connection.sendIQ(iq, Connector.onRoster);
      var rosterHandler = Connector.connection.addHandler(Connector.onRosterChanged, "jabber:iq:roster", "iq", "set");
      console.log('onRosterChanged handler return value: ', rosterHandler);
      var messageHandler = Connector.connection.addHandler(Connector.onMessageIncoming, null, "message", "chat");
      console.log('onMessageIncoming handler return value: ', messageHandler);
    } else if (status === Strophe.Status.DISCONNECTING) {
      console.log('Disconnecting initiated...');
      Connector.status = 7;
    } else if (status === Strophe.Status.DISCONNECTED) {
      console.log('Disconnected.');
      Connector.status = 6;
      Connector.onDisconnected();
    } else if (status === Strophe.Status.ATTACHED) {
      this.status = 8;
      var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
      Connector.connection.sendIQ(iq, this.onRoster);
      Connector.connection.addHandler(Connector.onRosterChanged, "jabber:iq:roster", "iq", "set");
      console.log('Session attached.');
    }

    Connector.sendStatus();
  },

  sendStatus: function () {
    
    // Send to options page
    var views = chrome.extension.getViews();

    views[1].Options.onStatusReceived(Connector.status, function () {
      views[1].Options.handleStatus();
    });

    // Send to all open tabs
    chrome.tabs.query({}, function(tabs) {
      for (var i=0; i<tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, {
          type: 'connection',
          status: Connector.status
        });
      }
    });    

  },

  onConnected: function () {
    var views = chrome.extension.getViews();

    views[1].Options.onConnectReceived(Connector.connection.authcid);
  },

  onDisconnected: function () {

    this.connection = null;
    this.pendingSubscriber = null;

    var views = chrome.extension.getViews();

    views[1].Options.onDisconnectReceived();

  },

  // CHANGE THIS, THIS IS THE FRIENDS LIST (FOR KEYBOARD SHORTCUTS)
  onRoster: function (iq) {

    console.log('onRoster triggered.');
    console.log('Roster iq: ', iq);

    if (Connector.roster.length < 1) {
      $(iq).find('item').each(function () {
        var jid = $(this).attr('jid');
        var name = $(this).attr('name') || jid;
        // transform jid into an id
        var jidNode = Strophe.getNodeFromJid(jid);

        // Build the Roster object to ship to options.js [10/17/14]
        Connector.roster.push({ 'name': name, 'jid': jid, 'jidNode': jidNode });
      });

      console.log('Completed roster: ', Connector.roster);  
    }
    
    var views = chrome.extension.getViews();

    if (!views[1].Options.roster) {
      views[1].Options.onRosterReceived(Connector.roster, function () {
        console.log('Roster received: ', Options.roster);
      });
    }

    
    // Working up until this point. Remove 'return' later when ready to continue [10/18/14]
    return;

    // set up presence handler and send initial presence
    this.connection.addHandler(Connector.onPresence, null, "presence");
    this.connection.send($pres());
  },

  onRosterChanged: function (iq) {
    $(iq).find('item').each(function () {
      var sub = $(this).attr('subscription');
      var jid = $(this).attr('jid');
      var name = $(this).attr('name') || jid;
      var jid_id = Handler.convertJidToId(jid);

      if (sub === 'remove') {
        // contact is being removed
        $('#' + jid_id).remove();
      } else {
        // contact is being added or modified
        var contact_html = "<li id='" + jid_id + "'>" +
                           "<div class='" + 
                           ($('#' + jid_id).attr('class') || "roster-contact offline") +
                           "'>" +
                           "<div class='roster-name text small'>" +
                           name +
                           "</div><div class='roster-jid'>" +
                           jid +
                           "</div></div></li>";

        if ($('#' + jid_id).length > 0) {
          $('#' + jid_id).replaceWith(contact_html);
        } else {
          this.insertContact($(contact_html));
        }
      }
    });

    return true;
  },

  onMessageIncoming: function (msg) {

    console.log('Message triggered: ', msg);
    var fullJID = $(msg).attr('from');
    console.log('Full JID: ' + fullJID);
    var jid = Strophe.getBareJidFromJid(fullJID);
    console.log('JID: ' + jid);
    var jidNode = Strophe.getNodeFromJid(jid);
    console.log('JID node: ' + jidNode);
    var jidID = Handler.convertJidToId(jid);
    console.log('JID converted to ID: ' + jidID);

    // Loop through roster to convert numerical JID node to real name [11/1/14]
    for (var i=0; i<Connector.roster.length; ++i) {
      if (jidNode == Connector.roster[i].jidNode) {
        var name = Connector.roster[i].name;
      }
    }

    // IF INCOMING MESSAGE [10/30/14]
    var messageText = $(msg).children('body');

    if (messageText.length > 0) {
      console.log('Incoming message detected.\n Body from msg: ', messageText);
      messageText = messageText.text();
      console.log('Body text from msg: ' + messageText);

      // Send message packet to all tabs [10/28/14]
      chrome.tabs.query({}, function(tabs) {
        for (var i=0; i<tabs.length; ++i) {
          chrome.tabs.sendMessage(tabs[i].id, {
            'type': 'incomingMessage',
            'message': messageText,
            'jid': jid, 
            'jidID': jidID,
            'name': name
          });
        }
      });
    }

    return true;
    
  },

  onMessageOutgoing: function (body, jid) {
    // Construct the message xmlns
    var message = $msg({
      to: jid,
      "type": "chat"
    }).c('body').t(body).up()
      .c('active', {xmlns: "http://jabber.org/protocol/chatstates"});

    // Send the message through Strophe
    Connector.connection.send(message);
  },

  insertContact: function (elem) {
    console.log('insertContact triggered.');
    var jid = elem.find('.roster-jid').text();
    var pres = this.presenceValue(elem.find('.roster-contact'));
    
    var contacts = $('#roster-area li');

    if (contacts.length > 0) {
      var inserted = false;
      contacts.each(function () {
        var cmp_pres = this.presenceValue(
          $(this).find('.roster-contact'));
        var cmp_jid = $(this).find('.roster-jid').text();

        if (pres > cmp_pres) {
          $(this).before(elem);
          inserted = true;
          return false;
        } else if (pres === cmp_pres) {
          if (jid < cmp_jid) {
            $(this).before(elem);
            inserted = true;
            return false;
          }
        }
      });

      if (!inserted) {
        $('#roster-area ul').append(elem);
      }
    } else {
      $('#roster-area ul').append(elem);
    }
  },

  pendingSubscriber: null,

  onPresence: function (presence) {
    var ptype = $(presence).attr('type');
    var from = $(presence).attr('from');
    var jid_id = Handler.convertJidToId(from);

    if (ptype === 'subscribe') {
      // populate pendingSubscriber, the approve-jid span, and open the dialog
      this.pendingSubscriber = from;
      $('#approve-jid').text(Strophe.getBareJidFromJid(from));
      $('#approve_dialog').dialog('open');
    } else if (ptype !== 'error') {
      var contact = $('#roster-area li#' + jid_id + ' .roster-contact')
        .removeClass("online")
        .removeClass("away")
        .removeClass("offline");
      if (ptype === 'unavailable') {
        contact.addClass("offline");
      } else {
        var show = $(presence).find("show").text();
        if (show === "" || show === "chat") {
          contact.addClass("online");
        } else {
          contact.addClass("away");
        }
      }

      var li = contact.parent();
      li.remove();
      this.insertContact(li);
    }

    // reset addressing for user since their presence changed
    var jid_id = Handler.convertJidToId(from);
    $('#chat-' + jid_id).data('jid', Strophe.getBareJidFromJid(from));

    return true;
  },

  presenceValue: function (elem) {
    if (elem.hasClass('online')) {
      return 2;
    } else if (elem.hasClass('away')) {
      return 1;
    }

    return 0;
  },

  storage: {
    jid: null,
    sid: null,
    rid: null
  },

  loginStorage: {
    jid_master: null,
    pass_master: null
  },

  deleteStorage: function() {
    sessionStorage.removeItem('jid');
    sessionStorage.removeItem('sid');
    sessionStorage.removeItem('rid');

    this.storage.jid = null;
    this.storage.sid = null;
    this.storage.rid = null;

    console.log('JID/SID/RID removed from sessionStorage.');
    console.log('Whisper.storage JID: '+this.storage.jid+' and SID: '+this.storage.sid+' and RID: '+this.storage.rid);
  },

  onoff: null,
  first: null,
  first_jid: null,
  first_name: null,
  second: null,
  second_jid: null,
  second_name: null,
  third: null,
  third_jid: null,
  third_name: null,
  fourth: null,
  fourth_jid: null,
  fourth_name: null,
  fifth: null,
  fifth_jid: null,
  fifth_name: null,
  fadeout: null,
  timeout: null

};

