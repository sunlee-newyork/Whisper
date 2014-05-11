// INJECT CHAT DIV
// DIV version (instead of iframe) WORKING BEST (4/2/14)
// [DELETE] var messageDiv = document.createElement("div");
// [DELETE] messageDiv.id = "whisper_incoming";
// [DELETE] document.body.appendChild(messageDiv);
// [DELETE?] var incomingDiv = "<div id='whisper_incoming'></div>"; (5/6/14)
// [DELETE?] $('body').append(incomingDiv); (5/6/14)

// INJECT OUTGOING CHAT BOX DIV
// [DELETE] var outgoingDiv = document.createElement("div");
// [DELETE] outgoingDiv.id = "whisper_outgoing";
// [DELETE] document.body.appendChild(outgoingDiv);
var outgoingDiv = "<div id='whisper_outgoing'></div>";
$('body').append(outgoingDiv);

// [DELETE] var inputBox = document.createElement("input");
// [DELETE] inputBox.id = "outgoing";
// [DELETE] document.getElementById('whisper_outgoing').appendChild(inputBox);
var inputBox = "<input id='outgoing' />";
$('#whisper_outgoing').append(inputBox);


// [DELETE] INJECT ROSTER (test) \\
// var rosterArea = document.createElement("div");

//=== AS OF 4/15/14, CHROME.STORAGE WORKING VERSION ===\\
// [FIX] For some reason, Whisper object from content script isn't accessible to message.js \\

var Whisper = {

  /* -----------------------
  ------ OPTIONS PAGE ------
  ----------------------- */
  connection: null,

  jid_to_id: function (jid) {
    return Strophe.getBareJidFromJid(jid)
      .replace(/@/g, "-")
      .replace(/\./g, "-");
  },

  on_connect: function (status) {
    if (status === Strophe.Status.CONNECTING) {
      $('#login-status').html('[Connecting...]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Connecting initiated...');
    } else if (status === Strophe.Status.CONNFAIL) {
      $('#login-status').html('[Connection failed]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Connection failed.');
    } else if (status === Strophe.Status.AUTHENTICATING) {
      $('#login-status').html('[Authenticating...]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Authenticating initiated...');
    } else if (status === Strophe.Status.AUTHFAIL) {
      $('#login-status').html('[Authentication failed]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Authentication failed.');
    } else if (status === Strophe.Status.CONNECTED) {
      $(document).trigger('connected');
    } else if (status === Strophe.Status.DISCONNECTING) {
      $('#login-status').html('[Disconnecting...]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Disconnecting initiated...');
    } else if (status === Strophe.Status.DISCONNECTED) {
      // [DELETE?] $(document).trigger('disconnected'); (5/6/14)
      // [ADDED] When disconnected, reattach instead (5/6/14)
      $('#login-status').html('[Disconnected]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      $('#attach-status').html('[No]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Disconnected.');
      if (Whisper.storage.jid && Whisper.storage.sid && Whisper.storage.rid) {
        $(document).trigger('attach', Whisper.storage);  
      }
    } else if (status === Strophe.Status.ATTACHED) {
      $('#attach-status').html('[Yes!]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      $('#login-status').html('[Session]'); // [REVISIT] turn this into a small login status bar that user can see in window (5/6/14)
      console.log('Session attached.');
    }
  },

  on_message: function (message) {
    // [DELETE] $("#whisper_incoming").fadeIn('fast'); (5/6/14)
    console.log('Message triggered.');
    var full_jid = $(message).attr('from');
    console.log(full_jid);
    var jid = Strophe.getBareJidFromJid(full_jid);
    console.log(jid);
    var jid_id = Whisper.jid_to_id(jid);
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
      Whisper.scroll_chat(jid_id);
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

      Whisper.scroll_chat(jid_id);
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
/* [DELETE] (5/6/14) 
      // Attempt at detecting if #whisper_incoming is clicked within 3 seconds
      $(document).on('click', function(event) { 
        if($(event.target).parents().index($('#chat-'+jid_id)) == -1) {
          if($('#chat-'+jid_id).is(":visible")) {
            $('#chat-'+jid_id).fadeOut('slow');
          }
        }
      });
*/
    });

    return true;
  },

  scroll_chat: function (jid_id) {
    // ORIGINAL Whisper \\
    var height = $('#chat-'+jid_id).scrollHeight;
    $('#chat-'+jid_id).scrollTop(height);

    // MINE VERSION 1 \\
    // $('#chat-'+jid_id+' :last-child').focus();

    // MINE VERSION 2 \\
    // $('chat-'+jid_id).lastChild.focus();
  },

  presence_value: function (elem) {
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

  del_storage: function() {
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

$(document).ready(function() {

  //Whisper.get_storage();

  // GET FROM sessionStorage JID/SID/RID
  Whisper.storage.jid = sessionStorage.getItem('jid');
  Whisper.storage.sid = sessionStorage.getItem('sid');
  Whisper.storage.rid = sessionStorage.getItem('rid');
  // Console.log outputs
  console.log('JID/SID/RID retrieved from sessionStorage.');
  console.log('sessionStorage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);

  // IF JID/SID/RID are set...
  if (Whisper.storage.jid && Whisper.storage.sid && Whisper.storage.rid) {
    // Console.log outputs
    console.log('sessionStorage JID/SID/RID detected.');
  
/* [DELETE] I don't know why this was here to begin with... don't need JID and password for session attach (5/6/14)
    // GET FROM chrome.storage JID_Master/PASS_Master
    chrome.storage.sync.get([
      'jid_master',
      'pass_master'
    ], function (result) { 
      // Save results to loginStorage
      Whisper.loginStorage.jid_master = result.jid_master;
      Whisper.loginStorage.pass_master = result.pass_master;
      console.log('JID_Master/PASS_Master retrieved from chrome.storage.');
      console.log('chrome.storage JID_Master: '+Whisper.loginStorage.jid_master+' and PASS_Master: '+Whisper.loginStorage.pass_master);
      if (Whisper.loginStorage.jid_master && Whisper.loginStorage.pass_master) {
        // Trigger attach with outputs
        $(document).trigger('attach', Whisper.storage);
      } else {
        console.log('No chrome.storage detected. Action stopped.');  
        Whisper.del_storage();
      }
    });
*/
    // Trigger attach with outputs
    $(document).trigger('attach', Whisper.storage); 

  } else { // ELSE if JID/SID/RID are not set...
    chrome.storage.sync.get([
      'jid_master',
      'pass_master'
    ], function (result) { 
      // Save results to loginStorage
      Whisper.loginStorage.jid_master = result.jid_master;
      Whisper.loginStorage.pass_master = result.pass_master;
      console.log('JID_Master/PASS_Master retrieved from chrome.storage.');
      console.log('chrome.storage JID_Master: '+Whisper.loginStorage.jid_master+' and PASS_Master: '+Whisper.loginStorage.pass_master);
      if (Whisper.loginStorage.jid_master && Whisper.loginStorage.pass_master) {
        // Console.log outputs
        console.log('No sessionStorage detected. (Connecting)');
        // Trigger connect with outputs
        $(document).trigger('connect', Whisper.loginStorage);
      } else {
        console.log('No chrome.storage detected. Action stopped.');
        Whisper.del_storage();
      }
    }); 
  }

  // STORE ALL CHROME.STORAGE TO Whisper
  chrome.storage.sync.get(function (result) {
    console.log('chrome.storage triggered.');
    // Onoff save
    if (result.onoff_checkbox === true) {
      console.log('Onoff_checkbox detected: '+result.onoff_checkbox);
      if (result.onoff) {
        console.log('Onoff detected:');
        console.log(result.onoff);
        Whisper.onoff = result.onoff;
        console.log('Whisper.onoff:');
        console.log(Whisper.onoff);
      }
    }
    // First save
    if (result.first_checkbox === true) {
      console.log('First_checkbox detected: '+result.first_checkbox);
      if (result.first) {
        console.log('First detected:');
        console.log(result.first);
        Whisper.first = result.first;
        Whisper.first_jid = result.first_jid;
        Whisper.first_name = result.first_name;
        console.log('Whisper first_jid: '+Whisper.first_jid+' and first_name: '+Whisper.first_name);
      }
    }
    // Second save
    if (result.second_checkbox === true) {
      console.log('Second_checkbox detected: '+result.second_checkbox);
      if (result.second) {
        console.log('Second detected:');
        console.log(result.second);
        Whisper.second = result.second;
        Whisper.second_jid = result.second_jid;
        Whisper.second_name = result.second_name;
        console.log('Whisper second_jid: '+Whisper.second_jid+' and second_name: '+Whisper.second_name);
      }
    }
    // Third save
    if (result.third_checkbox === true) {
      console.log('Third_checkbox detected: '+result.third_checkbox);
      if (result.third) {
        console.log('Third detected:');
        console.log(result.third);
        Whisper.third = result.third;
        Whisper.third_jid = result.third_jid;
        Whisper.third_name = result.third_name;
        console.log('Whisper third_jid: '+Whisper.third_jid+' and third_name: '+Whisper.third_name);
      }
    }
    // Fourth save
    if (result.fourth_checkbox === true) {
      console.log('Fourth_checkbox detected: '+result.fourth_checkbox);
      if (result.fourth) {
        console.log('Fourth detected:');
        console.log(result.fourth);
        Whisper.fourth = result.fourth;
        Whisper.fourth_jid = result.fourth_jid;
        Whisper.fourth_name = result.fourth_name;
        console.log('Whisper fourth_jid: '+Whisper.fourth_jid+' and fourth_name: '+Whisper.fourth_name);
      }
    }
    // Fifth save
    if (result.fifth_checkbox === true) {
      console.log('Fifth_checkbox detected: '+result.fifth_checkbox);
      if (result.fifth) {
        console.log('Fifth detected:');
        console.log(result.fifth);
        Whisper.fifth = result.fifth;
        Whisper.fifth_jid = result.fifth_jid;
        Whisper.fifth_name = result.fifth_name;
        console.log('Whisper fifth_jid: '+Whisper.fifth_jid+' and fifth_name: '+Whisper.fifth_name);
      }
    }
    // Timeout save
    if (result.timeout_checkbox === true) {
      console.log('Timeout_checkbox detected: '+result.timeout_checkbox);
      if (result.timeout > 0) {
        console.log('Timeout detected: '+result.timeout);
        Whisper.timeout = result.timeout;
        console.log('Whisper.timeout: '+Whisper.timeout);
      }
    } // NO DEFAULT BECAUSE USER CAN OPT OUT OF IT
    // Fadeout save
    if (result.fadeout_checkbox === true) {
      console.log('Fadeout_checkbox detected: '+result.fadeout_checkbox);
      if (result.fadeout > 0) {
        console.log('Fadeout detected: '+result.fadeout);
        Whisper.fadeout = result.fadeout;
        console.log('Whisper.fadeout: '+Whisper.fadeout);
      }
    } // NO DEFAULT BECAUSE USER CAN OPT OUT OF IT
  });

  // OUTGOING CHAT LISTENER
  $('#outgoing').on('keypress', function (ev) {
    //var jid = (Strophe.getBareJidFromJid('-100008213824782@chat.facebook.com')); // change this later
    //var jid_id = Whisper.jid_to_id(jid); // change this later
    var friend = $(this).attr('data-friend');
    switch (friend) {
      case 'first': var jid = Whisper.first_jid;
      break;
      case 'second': var jid = Whisper.second_jid;
      break;
      case 'third': var jid = Whisper.third_jid;
      break;
      case 'fourth': var jid = Whisper.fourth_jid;
      break;
      case 'fifth': var jid = Whisper.fifth_jid;
      break;
    }
    console.log('JID: '+jid);
    var jid_id = Whisper.jid_to_id(jid);
    console.log('Jid_id: '+jid_id);

    // IF 'enter' is pressed...
    if (ev.which === 13) {
      console.log('"Enter" pressed/detected.');
      ev.preventDefault();

      // Get the outgoing message text
      var body = $(this).val();

      // Construct the message xmlns
      var message = $msg({
        to: jid,
        "type": "chat"
      }).c('body').t(body).up()
        .c('active', {xmlns: "http://jabber.org/protocol/chatstates"});

      // Send the message through Strophe
      Whisper.connection.send(message);

      // Find the corresponding incoming message div
      $('#chat-'.jid_id).append( // #chat-jid_id => change this later
        '<div class="chat-message">' +
        Strophe.getNodeFromJid(Whisper.connection.jid) +
        '<span class="chat-text">' +
        body +
        "</span></div>"
      );

      Whisper.scroll_chat(jid_id);

      // Not sure what this does
      $(this).val('');
      // After sending, 
      $('#chat-'+jid_id).data('composing', false); // #chat-jid_id => change this later

    } 
      // NOT WORKINGGGGGG
      else if (ev.which === 27) { // ELSE IF 'ESC' is pressed...
      console.log('"ESC" pressed/detected.');
      $('#whisper_outgoing').fadeOut('fast');
    } else { // ELSE if 'enter' is not pressed yet...
      var composing = $('#chat-'+jid_id).data('composing');
      if (!composing) {
        var notify = $msg({
          to: jid,
          "type": "chat"
        }).c('composing', {xmlns: "http://jabber.org/protocol/chatstates"});

        Whisper.connection.send(notify);

        $('#chat-'+jid_id).data('composing', true);
      }
    }
  });

});

// CONNECT EVENT \\
$(document).bind('connect', function (ev, data) {
  Whisper.connection = new Strophe.Connection(
    'http://ec2-54-186-151-244.us-west-2.compute.amazonaws.com:5280/http-bind');

  console.log('Connect triggered...');

  Whisper.connection.connect(data.jid_master, data.pass_master, Whisper.on_connect);
});

// CONNECTED EVENT \\
$(document).bind('connected', function () {
  $('#login-status').html('[Connected!]');
  console.log('Connected.');
  console.log(Whisper.connection);

  var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
  
  Whisper.connection.sendIQ(iq, Whisper.on_roster);
  Whisper.connection.addHandler(Whisper.on_roster_changed, "jabber:iq:roster", "iq", "set");
  Whisper.connection.addHandler(Whisper.on_message, null, "message", "chat");

  chrome.storage.sync.remove(['jid_master', 'pass_master'], function() {
    Whisper.loginStorage.jid_master = null;
    Whisper.loginStorage.pass_master = null;

    chrome.storage.sync.get(['jid_master', 'pass_master'], function (result) {
      console.log('JID_Master: '+result.jid_master+' and Pass: '+result.pass_master);
    });
  });
});

// ATTACH EVENT \\
$(document).bind('attach', function (ev, data) {
  Whisper.connection = new Strophe.Connection(
   'http://ec2-54-186-151-244.us-west-2.compute.amazonaws.com:5280/http-bind');

  if (data.jid || data.sid || data.rid) {
    Whisper.connection.attach(data.jid, data.sid, data.rid, Whisper.on_connect);
    Whisper.connection.addHandler(Whisper.on_message, null, "message", "chat");  
  }
});

// DISCONNECTED EVENT \\
$(document).bind('disconnected', function () {
  // Manually (or maybe I can keep this one in the Whisper object?)
  //Whisper.del_storage();
  
  Whisper.connection = null;
  Whisper.pending_subscriber = null;
  Whisper.on_connect;

  $('#roster-area ul').empty();
  $('#chat-area ul').empty();
  $('#chat-area div').remove();
});

// UNLOAD EVENT (Leaving page) \\
$(window).bind('unload', function () {
  console.log('Unload triggered.');
  if (Whisper.connection !== null) {
    // Store JID/SID/RID to sessionStorages
    sessionStorage.setItem('jid', Whisper.connection.jid);
    sessionStorage.setItem('sid', Whisper.connection._proto.sid);
    sessionStorage.setItem('rid', Whisper.connection._proto.rid);
    console.log('JID/SID/RID saved to sessionStorage');
  } else {
    // Manually delete JID/SID/RID to chrome.storage here (or maybe I can keep this one in the Whisper object?)\\
    Whisper.del_storage();
  }
});

// INSTEAD OF ^, GET KEYCODES FROM Whisper
$(window).keydown(function (e) {
  console.log('Keydown triggered.');
  console.log(e.keyCode);

  if (e.keyCode in Whisper.first) {
    
    Whisper.first[e.keyCode] = true;
    var first_counter = 0;

    for (var x in Whisper.first) {
      if (Whisper.first[x] == true) {
        first_counter = first_counter + 1; // [DELETE] Whisper.first['triggered'] = true;
        console.log('First_counter: '+first_counter);
      }
    }

    console.log(Whisper.first);

    // FIRE EVENT
    if (first_counter === 3) { // [DELETE] if (Whisper.first.triggered === true) {
      console.log('Hotkeys for '+Whisper.first_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Whisper.jid_to_id(Whisper.first_jid); 
      console.log('Jid_id: '+jid_id);
      // [DELETE] $('#whisper_incoming').show(); (5/6/14)
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'first'); // <=====
      }, 20);
    }   
  }
  // NEED TO FILL REST OF FRIENDS
  if (e.keyCode in Whisper.second) {
    
    Whisper.second[e.keyCode] = true;
    var second_counter = 0;

    for (var x in Whisper.second) {
      if (Whisper.second[x] == true) {
        second_counter = second_counter + 1; // [DELETE] Whisper.second['triggered'] = true;
      }
    }

    console.log(Whisper.second);

    // FIRE EVENT
    if (second_counter === 3) { // [DELETE] if (Whisper.second.triggered === true) {
      console.log('Hotkeys for '+Whisper.second_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Whisper.jid_to_id(Whisper.second_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'second'); // <=====
      }, 20);
    }   
  }
  if (e.keyCode in Whisper.third) {
    
    Whisper.third[e.keyCode] = true;
    var third_counter = 0;

    for (var x in Whisper.third) {
      if (Whisper.third[x] == true) {
        third_counter = third_counter + 1; // [DELETE] Whisper.third['triggered'] = true;
      }
    }

    console.log(Whisper.third);

    // FIRE EVENT
    if (third_counter === 3) { // [DELETE] if (Whisper.third.triggered === true) {
      console.log('Hotkeys for '+Whisper.third_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Whisper.jid_to_id(Whisper.third_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'third'); // <=====
      }, 20);
    }   
  }
  if (e.keyCode in Whisper.fourth) {
    
    Whisper.fourth[e.keyCode] = true;
    var fourth_counter = 0;

    for (var x in Whisper.fourth) {
      if (Whisper.fourth[x] == true) {
        fourth_counter = fourth_counter + 1; // [DELETE] Whisper.fourth['triggered'] = true;
      }
    }

    console.log(Whisper.fourth);

    // FIRE EVENT
    if (fourth_counter === 3) { // [DELETE] if (Whisper.fourth.triggered === true) {
      console.log('Hotkeys for '+Whisper.fourth_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Whisper.jid_to_id(Whisper.fourth_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'fourth'); // <=====
      }, 20);
    }   
  }
  if (e.keyCode in Whisper.fifth) {
    
    Whisper.fifth[e.keyCode] = true;
    var fifth_counter = 0;

    for (var x in Whisper.fifth) {
      if (Whisper.fifth[x] == true) {
        fifth_counter = fifth_counter + 1; // [DELETE] Whisper.fifth['triggered'] = true;
      }
    }

    console.log(Whisper.fifth);

    // FIRE EVENT
    if (fifth_counter === 3) { // [DELETE] if (Whisper.fifth.triggered === true) {
      console.log('Hotkeys for '+Whisper.fifth_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Whisper.jid_to_id(Whisper.fifth_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'fifth'); // <=====
      }, 20);
    }   
  }
}).keyup(function (e) {
  if (e.keyCode in Whisper.first) {
    Whisper.first[e.keyCode] = false;
    Whisper.first.triggered = false;
    console.log('Whisper.first after keyup:');
    console.log(Whisper.first);
    console.log('Whisper.first.triggered after keyup: '+Whisper.first.triggered);
  }
  if (e.keyCode in Whisper.second) {
    Whisper.second[e.keyCode] = false;
    Whisper.second.triggered = false;
    console.log('Whisper.second after keyup: '+Whisper.second);
    console.log(Whisper.second);
    console.log('Whisper.second.triggered after keyup: '+Whisper.second.triggered);
  }
  if (e.keyCode in Whisper.third) {
    Whisper.third[e.keyCode] = false;
    Whisper.third.triggered = false;
    console.log('Whisper.third after keyup: '+Whisper.third);
    console.log(Whisper.third);
    console.log('Whisper.third.triggered after keyup: '+Whisper.third.triggered);
  }
  if (e.keyCode in Whisper.fourth) {
    Whisper.fourth[e.keyCode] = false;
    Whisper.fourth.triggered = false;
    console.log('Whisper.fourth after keyup: '+Whisper.fourth);
    console.log(Whisper.fourth);
    console.log('Whisper.fourth.triggered after keyup: '+Whisper.fourth.triggered);
  }
  if (e.keyCode in Whisper.fifth) {
    Whisper.fifth[e.keyCode] = false;
    Whisper.fifth.triggered = false;
    console.log('Whisper.fifth after keyup: '+Whisper.fifth);
    console.log(Whisper.fifth);
    console.log('Whisper.fifth.triggered after keyup: '+Whisper.fifth.triggered);
  }
});


// MAYBE add the <send to correct person> function here??
// Changing ^ to outside outgoingbox click listener to fade it out
// ^ ...what did I mean here? I don't remember anymore...

// IF mouse is clicked outside #whisper_outgoing...
$(document).on('click', function(event) {
  // [ADDED] ONLY IF fadeout is set (5/6/14)
  if (Whisper.fadeout) {
    // FOR INCOMING DIV
    if ($(event.target).parents().index($('.chat-div')) == -1) {
      if ($('.chat-div').is(":visible")) {
        // ...fade out.
        $('.chat-div').fadeOut('fast');
      }
    }  
  }

  // FOR OUTGOING DIV
  if ($(event.target).parents().index($('#whisper_outgoing')) == -1) {
    if ($('#whisper_outgoing').is(":visible")) {
      // ...fade out.
      $('#whisper_outgoing').fadeOut('fast');
    }
  }
});








