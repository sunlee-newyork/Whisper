// INJECT OUTGOING CHAT BOX DIV
var outgoingDiv = "<div id='whisper_outgoing'><input id='outgoing' /></div>";
$('body').append(outgoingDiv);

$(document).ready(function() {

  // Store all chrome.storage to HTML5 localStorage [11/2/14]
  chrome.storage.sync.get(function (result) {
    console.log('chrome.storage triggered.');
    // JSON.stringify result because localStorage can only handle key-value pairs for now [11/2/14]
    localStorage.setItem('Tab', JSON.stringify(result));
  });

  // Save parsed localStorage as window-level object [11/2/14]
  window.Tab = JSON.parse(localStorage.getItem('Tab'));
  console.log('Tab at window level: ', Tab);

  // Some additional functions saved to Tab object [11/2/14]
  Tab['convertJidToId'] = function (jid) {
    return jid
      .replace(/@/g, "-")
      .replace(/\./g, "-");
  }

/*
  Tab['scrollChat'] = function (jidID) {

    var elem = $('#chat-'+jidID);
    elem.scrollTop = elem.scrollHeight;

  }
*/

  // Request connection status from background.js [11/2/14]
  chrome.runtime.sendMessage({type: "requestStatus"}, function(response) {
    console.log('Response from background:');
    console.log('Type: ' + response.type); 
    console.log('Status: ' + response.status);
  });

  // Listen for incoming message from connection.js [11/2/14]
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    // ******* MESSAGE RECEIVER ******* \\
    if (request.type == "incomingMessage") {

      var message = request.message;
      var jid = request.jid;
      var jidID = request.jidID;
      var name = request.name;

      console.log('Received message packet from message.js: ', request);

      // IF CHAT BOX FOR SPECIFIED JID DOESN'T EXIST YET, MAKE ONE
      if ($('#chat-'+jidID).length === 0) {
        // add person div to master chat div
        var personDiv = '<div id="chat-'+jidID+'" class="chat-div"><div class="chat-text-wrapper"></div></div>';
        console.log('Person div: '+personDiv);

        $('body').append(personDiv);

        console.log('#chat-jidID triggered.');
      }

/* Don't think i need this [11/2/14]
      // give fullJID data to person div
      $('#chat-'+jidID).data({'jid': jid, 'name': name});
      console.log('jid data attached to #chat-jidID');
      console.log($('#chat-'+jidID).data('jid'));
*/

      // IF MESSAGE EXISTS
      if (message) {

        // add the new message wrappers
        $('#chat-'+jidID+' .chat-text-wrapper').append(
          '<div class="chat-message whisper-text">' +
          name +
          ': <span class="chat-text"></span>' +
          '</div>'
        );
        console.log('.chat-message and .chat-text appended.');

        // add the actual new message text
        $('#chat-'+jidID+' .chat-message:last .chat-text').append(message);        
        
        // AUTO SCROLLER, FINALLY [11/8/2014 5:51PM]
        var chatDiv = $('#chat-'+jidID);
        chatDiv.fadeIn('fast').animate({scrollTop: chatDiv[0].scrollHeight});

      }

      // Incoming message fadeout detect      
      if (Tab.fadeout.enabled == true) {
        var fadeout = setTimeout(function() {
          $("#chat-"+jidID).fadeOut('fast');
        }, Tab.fadeout.timespan);  
      }

      // If user clicks incoming message <div>, cancel the fadeout [11/2/14]
      $('#chat-'+jidID).click(function() {
        if (fadeout) {
          clearTimeout(fadeout);  
        }
      });

    }

    // ******* CONNECTION RECEIVER ******* \\
    if (request.type == "connection") {

      console.log('Received connection status from connection.js: ', request);
      sendResponse({response: "success"});

      // Add handler for when successfully connected [10/28/14]
    }

  });

  // OUTGOING CHAT LISTENER
  $('#outgoing').on('keypress', function (ev) {

    var friend = $(this).attr('data-friend');

    switch (friend) {
      case 'first': var jid = Tab.first.jid;
      break;
      case 'second': var jid = Tab.second.jid;
      break;
      case 'third': var jid = Tab.third.jid;
      break;
      case 'fourth': var jid = Tab.fourth.jid;
      break;
      case 'fifth': var jid = Tab.fifth.jid;
      break;
    }

    console.log('JID: '+jid);
    var jidID = Tab.convertJidToId(jid);
    console.log('JidID: '+jidID);

    // IF 'enter' is pressed...
    if (ev.which === 13) {

      console.log('"Enter" pressed/detected.');
      ev.preventDefault();

      // Get the outgoing message text
      var body = $(this).val();

      // Send message packet to connection.js
      chrome.runtime.sendMessage({type: "outgoingMessage", body: body, jid: jid}, function(response) {
        console.log('Response from background: ', response);
      });
      
      // If chat div doesn't exist yet...
      if ($('#chat-'+jidID).length < 1) {
        // Add the outgoing message
        $('body').append('<div id="chat-'+jidID+'" class="chat-div"><div class="chat-text-wrapper"></div></div>');
      }

      // Add the outgoing message to the chat div
      $('#chat-'+jidID+' .chat-text-wrapper').append(
        '<div class="chat-message whisper-text">Me: <span class="chat-text">' + body + '</span></div>'
      );

      // AUTO SCROLL, OH YEA
      var chatDiv = $('#chat-'+jidID);
      chatDiv.fadeIn('fast').animate({scrollTop: chatDiv[0].scrollHeight});  
    
      // Message fadeout detect
      if (Tab.fadeout.enabled == true) {
        var fadeout = setTimeout(function() {
          $("#chat-"+jidID).fadeOut('fast');
        }, Tab.fadeout.timespan);  
      }

      // If user clicks message <div>, cancel the fadeout [11/2/14]
      $('#chat-'+jidID).click(function() {
        if (fadeout) {
          clearTimeout(fadeout);  
        }
      });

      // Empty out outgoing input field after message send
      $(this).val('');
      
    } else { // ELSE if 'enter' is not pressed yet...
      
      // Send the 'composing' status
      chrome.runtime.sendMessage({type: "composing", jid: jid});
      
    }

  });

  $('#outgoing').on('keyup', function () {

    var friend = $(this).attr('data-friend');

    switch (friend) {
      case 'first': var jid = Tab.first.jid;
      break;
      case 'second': var jid = Tab.second.jid;
      break;
      case 'third': var jid = Tab.third.jid;
      break;
      case 'fourth': var jid = Tab.fourth.jid;
      break;
      case 'fifth': var jid = Tab.fifth.jid;
      break;
    }

    // If user backspaces completely...
    if ($(this).val().length == 0) {
      // Remove the 'composing' status
      chrome.runtime.sendMessage({type: "paused", jid: jid});
    }

  });

});


// **************************** \\
// ***** HOTKEY DETECTION ***** \\
// **************************** \\

$(window).keydown(function (e) {

  console.log('Keydown triggered.');
  console.log(e.keyCode);

  // ESC detection [11/4/14]
  if (e.which === 27) {
    console.log('"ESC" pressed/detected.');
    $('#whisper_outgoing').fadeOut('fast');
    $('.chat-div').fadeOut('fast');
  }

  if (e.keyCode in Tab.first.keyBank) {
    
    Tab.first.keyBank[e.keyCode] = true;
    var firstCounter = 0;

    for (var x in Tab.first.keyBank) {
      if (Tab.first.keyBank[x] == true) {
        firstCounter = firstCounter + 1;
        console.log('FirstCounter: '+firstCounter);
      }
    }

    console.log(Tab.first.keyBank);

    // FIRE EVENT
    if (firstCounter === 3) {
      console.log('Hotkeys for '+Tab.first.name+' pressed.');
      $('#whisper_outgoing').show();
      var jidID = Tab.convertJidToId(Tab.first.jid); 
      console.log('JidID: '+jidID);
      // [DELETE] $('#whisper_incoming').show(); (5/6/14)
      $('#chat-'+jidID).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'first'); // <=====
      }, 20);
    }  

  }

  // NEED TO FILL REST OF FRIENDS
  if (e.keyCode in Tab.second.keyBank) {
    
    Tab.second.keyBank[e.keyCode] = true;
    var secondCounter = 0;

    for (var x in Tab.second.keyBank) {
      if (Tab.second.keyBank[x] == true) {
        secondCounter = secondCounter + 1;
      }
    }

    console.log(Tab.second.keyBank);

    // FIRE EVENT
    if (secondCounter === 3) { 
      console.log('Hotkeys for '+Tab.second.name+' pressed.');
      $('#whisper_outgoing').show();
      var jidID = Tab.convertJidToId(Tab.second.jid); 
      $('#chat-'+jidID).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'second');
      }, 20);
    }   

  }

  if (e.keyCode in Tab.third.keyBank) {
    
    Tab.third.keyBank[e.keyCode] = true;
    var thirdCounter = 0;

    for (var x in Tab.third.keyBank) {
      if (Tab.third.keyBank[x] == true) {
        thirdCounter = thirdCounter + 1;
      }
    }

    console.log(Tab.third.keyBank);

    // FIRE EVENT
    if (thirdCounter === 3) { 
      console.log('Hotkeys for '+Tab.third.name+' pressed.');
      $('#whisper_outgoing').show();
      var jidID = Tab.convertJidToId(Tab.third.jid); 
      $('#chat-'+jidID).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'third');
      }, 20);
    }   

  }

  if (e.keyCode in Tab.fourth.keyBank) {
    
    Tab.fourth.keyBank[e.keyCode] = true;
    var fourthCounter = 0;

    for (var x in Tab.fourth.keyBank) {
      if (Tab.fourth.keyBank[x] == true) {
        fourthCounter = fourthCounter + 1;
      }
    }

    console.log(Tab.fourth.keyBank);

    // FIRE EVENT
    if (fourthCounter === 3) { 
      console.log('Hotkeys for '+Tab.fourth.name+' pressed.');
      $('#whisper_outgoing').show();
      var jidID = Tab.convertJidToId(Tab.fourth.jid); 
      $('#chat-'+jidID).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'fourth');
      }, 20);
    } 

  }

  if (e.keyCode in Tab.fifth.keyBank) {
    
    Tab.fifth.keyBank[e.keyCode] = true;
    var fifthCounter = 0;

    for (var x in Tab.fifth.keyBank) {
      if (Tab.fifth.keyBank[x] == true) {
        fifthCounter = fifthCounter + 1; 
      }
    }

    console.log(Tab.fifth.keyBank);

    // FIRE EVENT
    if (fifthCounter === 3) { 
      console.log('Hotkeys for '+Tab.fifth.name+' pressed.');
      $('#whisper_outgoing').show();
      var jidID = Tab.convertJidToId(Tab.fifth.jid); 
      $('#chat-'+jidID).show();
      setTimeout(function() {
        $('#outgoing').focus();
        $('#outgoing').attr('data-friend', 'fifth');
      }, 20);
    } 

  }

}).keyup(function (e) {
  if (e.keyCode in Tab.first.keyBank) {
    Tab.first.keyBank[e.keyCode] = false;
    console.log('Tab.first.keyBank after keyup:');
    console.log(Tab.first.keyBank);
  }
  if (e.keyCode in Tab.second.keyBank) {
    Tab.second.keyBank[e.keyCode] = false;
    console.log('Tab.second after keyup: '+Tab.second.keyBank);
    console.log(Tab.second.keyBank);
  }
  if (e.keyCode in Tab.third.keyBank) {
    Tab.third.keyBank[e.keyCode] = false;
    console.log('Tab.third after keyup: '+Tab.third.keyBank);
    console.log(Tab.third.keyBank);
  }
  if (e.keyCode in Tab.fourth.keyBank) {
    Tab.fourth.keyBank[e.keyCode] = false;
    console.log('Tab.fourth.keyBank after keyup: '+Tab.fourth.keyBank);
    console.log(Tab.fourth.keyBank);
  }
  if (e.keyCode in Tab.fifth.keyBank) {
    Tab.fifth.keyBank[e.keyCode] = false;
    console.log('Tab.fifth.keyBank after keyup: '+Tab.fifth.keyBank);
    console.log(Tab.fifth.keyBank);
  }
});

// IF mouse is clicked outside #whisper_outgoing...
$(document).on('click', function(event) {

  var Tab = JSON.parse(localStorage.getItem('Tab'));

  // [ADDED] ONLY IF fadeout is set (5/6/14)
  if (Tab.fadeout.enabled == true) {
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
