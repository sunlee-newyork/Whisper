//=== AS OF 4/15/14, CHROME.STORAGE WORKING VERSION ===\\
// Check if this file is loaded [10/12/14]
console.log('Whisper');

var Connector = {

  connection: null,
  currentStatus: Number,

  convertJidToId: function (jid) {
    return Strophe.getBareJidFromJid(jid)
      .replace(/@/g, "-")
      .replace(/\./g, "-");
  },

  onConnect: function (status) {
    if (status === Strophe.Status.CONNECTING) {
      Whisper.currentStatus = 1;
      $('#login-status').html('Connecting...').css('color', 'rgb(50,200,50)');
      console.log('Connecting initiated...');
    } else if (status === Strophe.Status.CONNFAIL) {
      Whisper.currentStatus = 2;
      $('#login-status').html('Connection failed').css('color', 'rgb(200,0,0)');
      console.log('Connection failed.');
    } else if (status === Strophe.Status.AUTHENTICATING) {
      Whisper.currentStatus = 3;
      $('#login-status').html('Authenticating...').css('color', 'rgb(50,200,50)');
      console.log('Authenticating initiated...');
    } else if (status === Strophe.Status.AUTHFAIL) {
      Whisper.currentStatus = 4;
      $('#login-status').html('Authentication failed').css('color', 'rgb(200,0,0)');
      console.log('Authentication failed.');
    } else if (status === Strophe.Status.CONNECTED) {
      Whisper.currentStatus = 5;
      $('#login-status').html('Connected!').css('color', 'rgb(0,150,0)');
      $('#user_login').html(Whisper.connection.authcid);
      $(document).trigger('connected');
    } else if (status === Strophe.Status.DISCONNECTING) {
      Whisper.currentStatus = 7;
      $('#login-status').html('Disconnecting...').css('color', 'rgb(200,100,100)');
      console.log('Disconnecting initiated...');
    } else if (status === Strophe.Status.DISCONNECTED) {
      Whisper.currentStatus = 6;
      $(document).trigger('disconnected');
      $('#login-status').html('Disconnected').css('color', 'rgb(200,0,0)');
      $('#attach-status').html('No');
      $('#user_login').html('no one');
      console.log('Disconnected.');
    } else if (status === Strophe.Status.ATTACHED) {
      Whisper.currentStatus = 8;
      $('#attach-status').html('Yes');
      $('#login-status').html('Session').css('color', 'rgb(0,150,0)');
      $('#user_login').html(Strophe.getNodeFromJid(Whisper.connection.jid));
      var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
      Whisper.connection.sendIQ(iq, Whisper.onRoster);
      Whisper.connection.addHandler(Whisper.onRosterChanged, "jabber:iq:roster", "iq", "set");
      console.log('Session attached.');
    }
  },

  // CHANGE THIS, THIS IS THE FRIENDS LIST (FOR KEYBOARD SHORTCUTS)
  onRoster: function (iq) {
    $(iq).find('item').each(function () {
      var jid = $(this).attr('jid');
      var name = $(this).attr('name') || jid;

      // transform jid into an id
      var jid_id = Whisper.convertJidToId(jid);

      var contact = $("<li id='" + jid_id + "'>" +
                    "<div class='roster-contact offline'>" +
                    "<div class='roster-name text small'>" +
                    name +
                    "</div><div class='roster-jid hidden'>" +
                    jid +
                    "</div></div></li>");

      Whisper.insertContact(contact);
    });

    // set up presence handler and send initial presence
    Whisper.connection.addHandler(Whisper.onPresence, null, "presence");
    Whisper.connection.send($pres());
  },

  insertContact: function (elem) {
    var jid = elem.find('.roster-jid').text();
    var pres = Whisper.presenceValue(elem.find('.roster-contact'));
    
    var contacts = $('#roster-area li');

    if (contacts.length > 0) {
      var inserted = false;
      contacts.each(function () {
        var cmp_pres = Whisper.presenceValue(
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
    var jid_id = Whisper.convertJidToId(from);

    if (ptype === 'subscribe') {
      // populate pendingSubscriber, the approve-jid span, and open the dialog
      Whisper.pendingSubscriber = from;
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
      Whisper.insertContact(li);
    }

    // reset addressing for user since their presence changed
    var jid_id = Whisper.convertJidToId(from);
    $('#chat-' + jid_id).data('jid', Strophe.getBareJidFromJid(from));

    return true;
  },

  onRosterChanged: function (iq) {
    $(iq).find('item').each(function () {
      var sub = $(this).attr('subscription');
      var jid = $(this).attr('jid');
      var name = $(this).attr('name') || jid;
      var jid_id = Whisper.convertJidToId(jid);

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
          Whisper.insertContact($(contact_html));
        }
      }
    });

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
      Whisper.storage.jid = null;
      Whisper.storage.sid = null;
      Whisper.storage.rid = null;      
      console.log('JID/SID/RID removed from chrome.storage');
      console.log('Whisper.storage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);
    });
  },
*/

  // ==================== MESSAGE.JS PROPERTIES ==================== 
  onMessage: function (message) {
    // [DELETE] $("#whisper_incoming").fadeIn('fast'); (5/6/14)
    console.log('Message triggered: ', message);
    var full_jid = $(message).attr('from');
    console.log(full_jid);
    var jid = Strophe.getBareJidFromJid(full_jid);
    console.log(jid);
    var jid_id = Whisper.convertJidToId(jid);
    console.log(jid_id);

    // IF CHAT BOX FOR SPECIFIED JID DOESN'T EXIST YET, MAKE ONE
    if ($('#chat-'+jid_id).length === 0) {
      // add person div to master chat div
      var personDiv = '<div id="chat-'+jid_id+'" class="chat-div"></div>';
      $('#chat-'+jid_id).css({ "position": "absolute", "bottom": "0", "left": "0" });
      console.log('Person div: '+personDiv);

      $('body').append(personDiv);
      // [DELETE?] $('#whisper_incoming').append(personDiv); (5/6/14)
      // [DELETE?] $('#chat-'+jid_id).fadeIn('fast'); (5/6/14)

      console.log('#chat-jid_id triggered.');
    }

    // give full_jid data to person div
    $('#chat-'+jid_id).data('jid', full_jid);
    console.log('jid data attached to #chat-jid_id');
    console.log($('#chat-'+jid_id).data('jid'));

    // ADD "TYPING..." FUNCTIONALITY
    var composing = $(message).find('composing');
    // if composing exists...
    if (composing.length > 0) {
      console.log('Composing triggered.');
      // add the "is typing..." div
      $('#chat-'+jid_id).append(
        '<div class="chat-event whisper-text">' +
        Strophe.getNodeFromJid(jid) + //This is where the first/last name will go
        ' is typing...</div>'
      );
      $('#chat-'+jid_id).fadeIn('fast');
      // make person div scrollable
      Whisper.scrollChat(jid_id);
    }

    // FIND THE MESSAGE TEXT AND ADD TO MESSAGE DIV
    var body = $(message).find("html > body");

    // IF there is no body
    if (body.length === 0) {
      console.log('Body not found.');
      body = $(message).find('body');
      if (body.length > 0) {
        // get message text
        body = body.text();
        console.log('First Body: '+body);
      } else { // otherwise there is no message, set body to null
        body = null;
      }
    } else {
      body = body.contents();
      console.log('Second Body: '+body);

      // MAKE SPAN OUT OF MESSAGE TEXT
      var span = $("<span></span>");
      body.each(function() {
        if (document.importNode) {
          $(document.importNode(this, true)).appendTo(span);
        } else {
          // IE workaround
          span.append(this.xml);
        }
      });
      body = span;
      console.log('Third Body: '+body);
    }

    // IF MESSAGE EXISTS
    if (body) {
      console.log('Body exists.');
      // remove notifications since user is now active
      $('#chat-'+jid_id+' .chat-event').remove();
      console.log('.chat-event removed.');

      // add the new message wrappers
      $('#chat-'+jid_id).append(
        '<div class="chat-message whisper-text">' +
        Strophe.getNodeFromJid(jid) +
        ': <span class="chat-text"></span>' +
        '</div>'
      );
      console.log('.chat-message and .chat-text appended.');

      // add the actual new message text
      $('#chat-'+jid_id+' .chat-message:last .chat-text').append(body);
      console.log('Body appended to #chat-text.');
      $('#chat-'+jid_id).fadeIn('fast');

      Whisper.scrollChat(jid_id);
    }

    // Incoming message fadeout detect
    if (Whisper.fadeout !== null) {
      var fadeout = setTimeout(function() {
        $("#chat-"+jid_id).fadeOut('slow');
      }, Whisper.fadeout);  
    }

    $('#chat-'+jid_id).click(function() {
      if (fadeout) {
        clearTimeout(fadeout);  
      }
    });

    return true;
  },

  scrollChat: function (jid_id) {
    // ORIGINAL Whisper \\
    var height = $('#chat-'+jid_id).scrollHeight;
    $('#chat-'+jid_id).scrollTop(height);

    // MINE - VERSION 1 \\
    // $('#chat-'+jid_id+' :last-child').focus();

    // MINE - VERSION 2 \\
    // $('chat-'+jid_id).lastChild.focus();
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

    Whisper.storage.jid = null;
    Whisper.storage.sid = null;
    Whisper.storage.rid = null;

    console.log('JID/SID/RID removed from sessionStorage.');
    console.log('Whisper.storage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);
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

