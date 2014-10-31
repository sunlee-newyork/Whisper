// INJECT OUTGOING CHAT BOX DIV
var outgoingDiv = "<div id='whisper_outgoing'><input id='outgoing' /></div>";
$('body').append(outgoingDiv);

var Tab = {

  convertJidToId: function (jid) {
    return Strophe.getBareJidFromJid(jid)
      .replace(/@/g, "-")
      .replace(/\./g, "-");
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

$(document).ready(function() {

  chrome.runtime.sendMessage({type: "requestStatus"}, function(response) {
    console.log('Response from background:');
    console.log('Type: ' + response.type); 
    console.log('Status: ' + response.status);
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    // ******* MESSAGE RECEIVER ******* \\
    if (request.type == "message") {

      var message = request.message;
      var jid = request.jid;
      var jidID = request.jidID;
      var fullJID = request.fullJID;

      console.log('Received message packet from message.js: ', request);
      // ******************************************************************** \\
      // ******* EVERYTHING BELOW SHOULD BE HANDLED BY CONTENT SCRIPT ******* \\
      // ******************************************************************** \\

      // IF CHAT BOX FOR SPECIFIED JID DOESN'T EXIST YET, MAKE ONE
      if ($('#chat-'+jidID).length === 0) {
        // add person div to master chat div
        var personDiv = '<div id="chat-'+jidID+'" class="chat-div"></div>';
        $('#chat-'+jidID).css({ "position": "absolute", "bottom": "0", "left": "0" });
        console.log('Person div: '+personDiv);

        $('body').append(personDiv);

        console.log('#chat-jidID triggered.');
      }

      // give fullJID data to person div
      $('#chat-'+jidID).data('jid', fullJID);
      console.log('jid data attached to #chat-jidID');
      console.log($('#chat-'+jidID).data('jid'));


      // MAKE SPAN OUT OF MESSAGE TEXT
      var span = $("<span></span>");
      span = span.append(message)

      // IF MESSAGE EXISTS
      if (message) {

        // add the new message wrappers
        $('#chat-'+jidID).append(
          '<div class="chat-message whisper-text">' +
          Strophe.getNodeFromJid(jid) +                              // <========= work on this next, this is prompting error [10/30/14]
          ': <span class="chat-text"></span>' +
          '</div>'
        );
        console.log('.chat-message and .chat-text appended.');

        // add the actual new message text
        $('#chat-'+jidID+' .chat-message:last .chat-text').append(span);
        console.log('Message <span> appended to #chat-text.');
        $('#chat-'+jidID).fadeIn('fast');

        Tab.scrollChat(jidID);
      }

      // Incoming message fadeout detect
      if (Tab.fadeout !== null) {
        var fadeout = setTimeout(function() {
          $("#chat-"+jidID).fadeOut('slow');
        }, this.fadeout);  
      }

      $('#chat-'+jidID).click(function() {
        if (fadeout) {
          clearTimeout(fadeout);  
        }
      });

      // ******************************************************************** \\
      // ******* EVERYTHING ABOVE SHOULD BE HANDLED BY CONTENT SCRIPT ******* \\
      // ******************************************************************** \\

    }

    // ******* CONNECTION RECEIVER ******* \\
    if (request.type == "connection") {

      console.log('Received connection status from connection.js: ', request);
      sendResponse({response: "success"});

      // Add handler for when successfully connected [10/28/14]
    }
  });

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
          Tab[array[i]] = result[array[i]];
          console.log('Tab.'+array[i]+': ', Tab[array[i]]);
          if (result[array[i]+'_jid']) {
            Tab[array[i]+'_jid'] = result[array[i]+'_jid'];
            Tab[array[i]+'_name'] = result[array[i]+'_name'];
            console.log('Whisper '+array[i]+'_jid: '+Tab[array[i]+'_jid']+' and '+array[i]+'_name: '+Tab[array[i]+'_name']);
          }
        }
      }
    }

  });

  // OUTGOING CHAT LISTENER
  $('#outgoing').on('keypress', function (ev) {
    //var jid = (Strophe.getBareJidFromJid('-100008213824782@chat.facebook.com')); // change this later
    //var jid_id = Tab.convertJidToId(jid); // change this later
    var friend = $(this).attr('data-friend');
    switch (friend) {
      case 'first': var jid = Tab.first_jid;
      break;
      case 'second': var jid = Tab.second_jid;
      break;
      case 'third': var jid = Tab.third_jid;
      break;
      case 'fourth': var jid = Tab.fourth_jid;
      break;
      case 'fifth': var jid = Tab.fifth_jid;
      break;
    }
    console.log('JID: '+jid);
    var jid_id = Tab.convertJidToId(jid);
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
      Tab.connection.send(message);

      // Find the corresponding incoming message div
      $('#chat-'.jid_id).append( // #chat-jid_id => change this later
        '<div class="chat-message">' +
        Strophe.getNodeFromJid(Tab.connection.jid) +
        '<span class="chat-text">' +
        body +
        "</span></div>"
      );

      Tab.scrollChat(jid_id);

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

        Tab.connection.send(notify);

        $('#chat-'+jid_id).data('composing', true);
      }
    }
  });

});


// UNLOAD EVENT (Leaving page) \\
$(window).bind('unload', function () {
  console.log('Unload triggered.');
  if (Tab.connection !== null) {
    // Store JID/SID/RID to sessionStorages
    sessionStorage.setItem('jid', Tab.connection.jid);
    sessionStorage.setItem('sid', Tab.connection._proto.sid);
    sessionStorage.setItem('rid', Tab.connection._proto.rid);
    console.log('JID/SID/RID saved to sessionStorage');
  } else {
    // Manually delete JID/SID/RID to chrome.storage here (or maybe I can keep this one in the Whisper object?)\\
    Tab.del_storage();
  }
});

// INSTEAD OF ^, GET KEYCODES FROM Whisper
$(window).keydown(function (e) {
  console.log('Keydown triggered.');
  console.log(e.keyCode);

  if (e.keyCode in Tab.first) {
    
    Tab.first[e.keyCode] = true;
    var first_counter = 0;

    for (var x in Tab.first) {
      if (Tab.first[x] == true) {
        first_counter = first_counter + 1; // [DELETE] Tab.first['triggered'] = true;
        console.log('First_counter: '+first_counter);
      }
    }

    console.log(Tab.first);

    // FIRE EVENT
    if (first_counter === 3) { // [DELETE] if (Tab.first.triggered === true) {
      console.log('Hotkeys for '+Tab.first_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Tab.convertJidToId(Tab.first_jid); 
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
  if (e.keyCode in Tab.second) {
    
    Tab.second[e.keyCode] = true;
    var second_counter = 0;

    for (var x in Tab.second) {
      if (Tab.second[x] == true) {
        second_counter = second_counter + 1; // [DELETE] Tab.second['triggered'] = true;
      }
    }

    console.log(Tab.second);

    // FIRE EVENT
    if (second_counter === 3) { // [DELETE] if (Tab.second.triggered === true) {
      console.log('Hotkeys for '+Tab.second_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Tab.convertJidToId(Tab.second_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'second'); // <=====
      }, 20);
    }   
  }
  if (e.keyCode in Tab.third) {
    
    Tab.third[e.keyCode] = true;
    var third_counter = 0;

    for (var x in Tab.third) {
      if (Tab.third[x] == true) {
        third_counter = third_counter + 1; // [DELETE] Tab.third['triggered'] = true;
      }
    }

    console.log(Tab.third);

    // FIRE EVENT
    if (third_counter === 3) { // [DELETE] if (Tab.third.triggered === true) {
      console.log('Hotkeys for '+Tab.third_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Tab.convertJidToId(Tab.third_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'third'); // <=====
      }, 20);
    }   
  }
  if (e.keyCode in Tab.fourth) {
    
    Tab.fourth[e.keyCode] = true;
    var fourth_counter = 0;

    for (var x in Tab.fourth) {
      if (Tab.fourth[x] == true) {
        fourth_counter = fourth_counter + 1; // [DELETE] Tab.fourth['triggered'] = true;
      }
    }

    console.log(Tab.fourth);

    // FIRE EVENT
    if (fourth_counter === 3) { // [DELETE] if (Tab.fourth.triggered === true) {
      console.log('Hotkeys for '+Tab.fourth_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Tab.convertJidToId(Tab.fourth_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'fourth'); // <=====
      }, 20);
    }   
  }
  if (e.keyCode in Tab.fifth) {
    
    Tab.fifth[e.keyCode] = true;
    var fifth_counter = 0;

    for (var x in Tab.fifth) {
      if (Tab.fifth[x] == true) {
        fifth_counter = fifth_counter + 1; // [DELETE] Tab.fifth['triggered'] = true;
      }
    }

    console.log(Tab.fifth);

    // FIRE EVENT
    if (fifth_counter === 3) { // [DELETE] if (Tab.fifth.triggered === true) {
      console.log('Hotkeys for '+Tab.fifth_name+' pressed.');
      $('#whisper_outgoing').show();
      var jid_id = Tab.convertJidToId(Tab.fifth_jid); 
      $('#chat-'+jid_id).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'fifth'); // <=====
      }, 20);
    }   
  }
}).keyup(function (e) {
  if (e.keyCode in Tab.first) {
    Tab.first[e.keyCode] = false;
    Tab.first.triggered = false;
    console.log('Tab.first after keyup:');
    console.log(Tab.first);
    console.log('Tab.first.triggered after keyup: '+Tab.first.triggered);
  }
  if (e.keyCode in Tab.second) {
    Tab.second[e.keyCode] = false;
    Tab.second.triggered = false;
    console.log('Tab.second after keyup: '+Tab.second);
    console.log(Tab.second);
    console.log('Tab.second.triggered after keyup: '+Tab.second.triggered);
  }
  if (e.keyCode in Tab.third) {
    Tab.third[e.keyCode] = false;
    Tab.third.triggered = false;
    console.log('Tab.third after keyup: '+Tab.third);
    console.log(Tab.third);
    console.log('Tab.third.triggered after keyup: '+Tab.third.triggered);
  }
  if (e.keyCode in Tab.fourth) {
    Tab.fourth[e.keyCode] = false;
    Tab.fourth.triggered = false;
    console.log('Tab.fourth after keyup: '+Tab.fourth);
    console.log(Tab.fourth);
    console.log('Tab.fourth.triggered after keyup: '+Tab.fourth.triggered);
  }
  if (e.keyCode in Tab.fifth) {
    Tab.fifth[e.keyCode] = false;
    Tab.fifth.triggered = false;
    console.log('Tab.fifth after keyup: '+Tab.fifth);
    console.log(Tab.fifth);
    console.log('Tab.fifth.triggered after keyup: '+Tab.fifth.triggered);
  }
});

// IF mouse is clicked outside #whisper_outgoing...
$(document).on('click', function(event) {
  // [ADDED] ONLY IF fadeout is set (5/6/14)
  if (Tab.fadeout) {
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
