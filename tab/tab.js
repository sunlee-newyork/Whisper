// INJECT OUTGOING CHAT BOX DIV
var outgoingDiv = "<div id='whisper_outgoing'></div>";
$('body').append(outgoingDiv);

var inputBox = "<input id='outgoing' />";
$('#whisper_outgoing').append(inputBox);


$(document).ready(function() {

  // GET FROM sessionStorage JID/SID/RID
  Whisper.storage.jid = sessionStorage.getItem('jid');
  Whisper.storage.sid = sessionStorage.getItem('sid');
  Whisper.storage.rid = sessionStorage.getItem('rid');

  // IF JID/SID/RID are set...
  if (Whisper.storage.jid && Whisper.storage.sid && Whisper.storage.rid) {
    // Console.log outputs
    console.log('sessionStorage JID/SID/RID detected.');
    console.log('JID/SID/RID retrieved from sessionStorage.');
    console.log('sessionStorage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);

    // Trigger attach with outputs
    $(document).trigger('attach', Whisper.storage); 
  } else { // ELSE if JID/SID/RID are not set...
    console.log('JID/SID/RID not found.');
    console.log('sessionStorage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);
    // [ADDED] Get login info from background page (5/9/14)
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request) {
        console.log(request);
        Whisper.loginStorage.jid_master = request.jid;
        Whisper.loginStorage.pass_master = request.pass;
        console.log('JID_Master/PASS_Master retrieved from background page.');
        console.log('Whisper.loginStorage JID_Master: '+Whisper.loginStorage.jid_master+' and PASS_Master: '+Whisper.loginStorage.pass_master);
        if (Whisper.loginStorage.jid_master && Whisper.loginStorage.pass_master) {
          // Console.log outputs
          console.log('No sessionStorage detected. (Connecting)');
          // Trigger connect with outputs
          $(document).trigger('connect', Whisper.loginStorage);
        } else {
          console.log('No background page login info detected. Action stopped.');
        }
      } else {
        console.log('No background page request detected. Action stopped.');
      }
    }); 
  }

  // STORE ALL CHROME.STORAGE TO Whisper
  chrome.storage.sync.get(function (result) {
    console.log('chrome.storage triggered.');
    console.log(result);

    // [EDITED] DRYless version of chrome.storage retrieval (5/13/14)
    var array = ['onoff', 'first', 'second', 'third', 'fourth', 'fifth', 'timeout', 'fadeout']

    for (var i=0; i<array.length; i++) {
      if (result[array[i]+'_checkbox'] === true) {
        console.log(array[i]+'_checkbox detected: '+result[array[i]+'_checkbox']);
        if (result[array[i]]) {
          console.log(array[i]+' detected.', result[array[i]]);
          Whisper[array[i]] = result[array[i]];
          console.log('Whisper.'+array[i]+': ', Whisper[array[i]]);
          if (result[array[i]+'_jid']) {
            Whisper[array[i]+'_jid'] = result[array[i]+'_jid'];
            Whisper[array[i]+'_name'] = result[array[i]+'_name'];
            console.log('Whisper '+array[i]+'_jid: '+Whisper[array[i]+'_jid']+' and '+array[i]+'_name: '+Whisper[array[i]+'_name']);
          }
        }
      }
    }

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
/*
    } 
      // NOT WORKINGGGGGG
      else if (ev.which === 27) { // ELSE IF 'ESC' is pressed...
      console.log('"ESC" pressed/detected.');
      $('#whisper_outgoing').fadeOut('fast');
*/

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

  // [ADDED] delete loginStorage after usage, no longer need it (5/9/14)
  Whisper.loginStorage.jid_master = null;
  Whisper.loginStorage.pass_master = null;
  console.log('Whisper.loginStorage JID: '+Whisper.loginStorage.jid_master+' and PASS: '+Whisper.loginStorage.pass_master);
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
