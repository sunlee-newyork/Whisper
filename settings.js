// As of 4/16/14: Changing session control from trying to use one session for multiple tabs to separate sessions per tab
// As of 4/16/14: Getting rid of JID/RID/SID chrome.storage save, instead saving JID/PASS to chrome.storage

$(document).ready(function() {

  // RESTORE ALL SAVED PREFERENCES
  // (have to shape this up => value ONLY IF checkbox === true)
  // [UPGRADE] too DRY, make Whisper method
  chrome.storage.sync.get(function (result) {
    // Get onoff_checkbox
    if (result.onoff_checkbox === true) { 
      $('#onoff_checkbox').prop('checked', true); 
      // Get onoff value
      if (result.onoff) {
        // Loop through result per keycode, convert to character
        var characters = "";
        for (var x in result.onoff) {
          var letter = String.fromCharCode(x);
          characters += letter;
        }
        characters.split('').join(' '); // [FIX] buggy, no effect
        $('#onoff').attr('value', characters); 
      } else { 
        $('#onoff').val(''); 
        $('#onoff').attr('placeholder', 'Enter hotkey letters'); 
      }
    } else { 
      $('#onoff_checkbox').prop('checked', false); 
      $('#onoff').attr('placeholder', 'Enter hotkey letters');
    }
    

    // Get first_checkbox
    if (result.first_checkbox === true) { 
      $('#first_checkbox').prop('checked', true); 

      // Get first value
      if (result.first) {
        // Loop through result per keycode, convert to character
        var characters = "";
        for (var x in result.first) {
          var letter = String.fromCharCode(x);
          characters += letter;
        }
        characters.split('').join(' '); // [FIX] buggy, no effect
        $('#first').attr('value', characters); 
        $('#first_link').html(result.first_name+' (click to change)');
        Whisper.first_jid = result.first_jid;
        Whisper.first_name = result.first_name;
      } else {
        $('#first').val('');
        $('#first').attr('placeholder', 'Enter hotkey letters');
      }
    } else { 
      $('#first_checkbox').prop('checked', false); 
      $('#first_link').html('no one (click to assign)');
      $('#first').attr('placeholder', 'Enter hotkey letters');
    }


    // Get second_checkbox
    if (result.second_checkbox === true) { 
      $('#second_checkbox').prop('checked', true); 
      // Get second value
      if (result.second) {
        // Loop through result per keycode, convert to character
        var characters = "";
        for (var x in result.second) {
          var letter = String.fromCharCode(x);
          characters += letter;
        }
        characters.split('').join(' '); // [FIX] buggy, no effect
        $('#second').attr('value', characters);
        $('#second_link').html(result.second_name+' (click to change)');
        Whisper.second_jid = result.second_jid;
        Whisper.second_name = result.second_name;
      } else {
        $('#second').val('');
        $('#second').attr('placeholder', 'Enter hotkey letters');
      }
    } else { 
      $('#second_checkbox').prop('checked', false); 
      $('#second_link').html('no one (click to assign)');
      $('#second').attr('placeholder', 'Enter hotkey letters');
    }
    

    // Get third_checkbox
    if (result.third_checkbox === true) { 
      $('#third_checkbox').prop('checked', true); 
      // Get third value
      if (result.third) {
        // Loop through result per keycode, convert to character
        var characters = "";
        for (var x in result.third) {
          var letter = String.fromCharCode(x);
          characters += letter;
        }
        characters.split('').join(' '); // [FIX] buggy, no effect
        $('#third').attr('value', characters); 
        $('#third_link').html(result.third_name+' (click to change)');
        Whisper.third_jid = result.third_jid;
        Whisper.third_name = result.third_name;
      } else {
        $('#third').val('');
        $('#third').attr('placeholder', 'Enter hotkey letters');
      }
    } else { 
      $('#third_checkbox').prop('checked', false); 
      $('#third_link').html('no one (click to assign)');
      $('#third').attr('placeholder', 'Enter hotkey letters');
    }
    

    // Get fourth_checkbox
    if (result.fourth_checkbox === true) { 
      $('#fourth_checkbox').prop('checked', true); 
      // Get fourth value
      if (result.fourth) {
        // Loop through result per keycode, convert to character
        var characters = "";
        for (var x in result.fourth) {
          var letter = String.fromCharCode(x);
          characters += letter;
        }
        characters.split('').join(' '); // [FIX] buggy, no effect
        $('#fourth').attr('value', characters); 
        $('#fourth_link').html(result.fourth_name+' (click to change)');
        Whisper.fourth_jid = result.fourth_jid;
        Whisper.fourth_name = result.fourth_name;
      } else {
        $('#fourth').val('');
        $('#fourth').attr('placeholder', 'Enter hotkey letters');
      }
    } else { 
      $('#fourth_checkbox').prop('checked', false); 
      $('#fourth_link').html('no one (click to assign)');
      $('#fourth').attr('placeholder', 'Enter hotkey letters');
    }
    

    // Get fifth_checkbox
    if (result.fifth_checkbox === true) { 
      $('#fifth_checkbox').prop('checked', true); 
      // Get fifth value
      if (result.fifth) {
        // Loop through result per keycode, convert to character
        var characters = "";
        for (var x in result.fifth) {
          var letter = String.fromCharCode(x);
          characters += letter;
        }
        characters.split('').join(' '); // [FIX] buggy, no effect
        $('#fifth').attr('value', characters); 
        $('#fifth_link').html(result.fifth_name+' (click to change)');
        Whisper.fifth_jid = result.fifth_jid;
        Whisper.fifth_name = result.fifth_name;
      } else {
        $('#fifth').val('');
        $('#fifth').attr('placeholder', 'Enter hotkey letters');
      }
    } else { 
      $('#fifth_checkbox').prop('checked', false); 
      $('#fifth_link').html('no one (click to assign)');
      $('#fifth').attr('placeholder', 'Enter hotkey letters');
    }
    

    // Get timeout_checkbox
    if (result.timeout_checkbox === true) { $('#timeout_checkbox').prop('checked', true); } else { $('#timeout_checkbox').prop('checked', false); }
    // Get timeout value
    if (result.timeout) { 
      $('#timeout').val(result.timeout); 
    } else { 
      $('#timeout').val(1800000); 
    }

    // Get fadeout_checkbox
    if (result.fadeout_checkbox === true) { $('#fadeout_checkbox').prop('checked', true); } else { $('#fadeout_checkbox').prop('checked', false); }
    // Get fadeout value
    if (result.fadeout) { $('#fadeout').val(result.fadeout); } else { $('#fadeout').val(5000); }   
  });

  // GET RID OF DIALOG, CHANGE TO NORMAL INPUT / SEND INFO
  $('#login_submit').click(function() {
    $(document).trigger('connect', {
      jid: $('#username').val().toLowerCase(),
      password: $('#password').val()
    });
    $('#username').val('');
    $('#password').val('');
  });

  $('#disconnect').click(function () {
    console.log('Disconnect button clicked.');
    Whisper.connection.disconnect();
    Whisper.connection = null;
  });

  ////////////////////////////////////////////////////////////////
  // CHANGE COOKIES TO chrome.storage (4/15/14)!!!!!!!!!!!!!!!!!!!
  // Manually get JID/SID/RID from chrome.storage here ///////////
  // [UPGRADE] Whisper.get_storage(); // Taking this out??? (4/16/14) // Make it work (4/24/14)
  chrome.storage.sync.get([
    'jid',
    'sid',
    'rid'
  ], function (result) {
    Whisper.storage.jid = result.jid;
    Whisper.storage.sid = result.sid;
    Whisper.storage.rid = result.rid;
    console.log('JID/SID/RID retrieved from chrome.storage');
    console.log('Whisper.storage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);
    if (Whisper.storage.jid && Whisper.storage.sid && Whisper.storage.rid) {
      console.log('Chrome storage JID/SID/RID detected. Triggering attach...');
      $(document).trigger('attach', Whisper.storage);
    } else {
      console.log('No storage detected. Action stopped.');
    }
  });

  // FRIEND_LINK CLICKS 
  $('.friend_link').click(function() {
    console.log('.friend_link click detected.');

    // [ADDED] conditional to see if user is already logged in (5/6/14)
    if (Whisper.currentStatus === 5 || Whisper.currentStatus === 8) {
      $('#roster-area').show();
      var currentElement = $(this)[0];
      console.log(currentElement);
      var clicked = $(this)[0].id;
      console.log('Clicked ID: '+clicked);
      switch(clicked) {
        case 'first_link': Whisper.which_friend = 'first';
          break;
        case 'second_link': Whisper.which_friend = 'second';
          break;
        case 'third_link': Whisper.which_friend = 'third';
          break;
        case 'fourth_link': Whisper.which_friend = 'fourth';
          break;
        case 'fifth_link': Whisper.which_friend = 'fifth';
          break;
      }
      console.log('Whisper.which_friend: '+Whisper.which_friend);
      $(document).trigger('roster', function() {
        console.log('Roster event triggered.');
      });  
    } else {
      $('#roster-alert').show(function() {
        setTimeout(function() {
          $('#roster-alert').fadeOut('slow');
        }, 1000);  
      });
    }
    
  });

  // SAVE EVENT \\
  $('#save').on('click', function() {
    console.log('"Save" clicked.');
    
    Whisper.on_save_onoff('onoff_checkbox', 'onoff');
    Whisper.on_save_friends('first_checkbox', 'first', 'first_jid', 'first_name');
    Whisper.on_save_friends('second_checkbox', 'second', 'second_jid', 'second_name');
    Whisper.on_save_friends('third_checkbox', 'third', 'third_jid', 'third_name');
    Whisper.on_save_friends('fourth_checkbox', 'fourth', 'fourth_jid', 'fourth_name');
    Whisper.on_save_friends('fifth_checkbox', 'fifth', 'fifth_jid', 'fifth_name');
    Whisper.on_save_regular('timeout_checkbox', 'timeout');
    Whisper.on_save_regular('fadeout_checkbox', 'fadeout');
    Whisper.on_saved();
  });

});


// CONNECT EVENT \\
$(document).bind('connect', function (ev, data) {
  Whisper.connection = new Strophe.Connection(
    'http://ec2-54-186-151-244.us-west-2.compute.amazonaws.com:5280/http-bind');

  Whisper.connection.connect(data.jid+'@chat.facebook.com', data.password, Whisper.on_connect);
});

// CONNECTED EVENT \\
$(document).bind('connected', function () {

  console.log('Connected.');
  console.log(Whisper.connection);

  var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
  
  Whisper.connection.sendIQ(iq, Whisper.on_roster);
  Whisper.connection.addHandler(Whisper.on_roster_changed, "jabber:iq:roster", "iq", "set");
  //Whisper.connection.addHandler(Whisper.on_message, null, "message", "chat");

  // Manually save JID_master and PASS to chrome.storage here \\
  chrome.storage.sync.set({
    jid_master: Whisper.connection.authzid,
    pass_master: Whisper.connection.pass
  }, function() {
    console.log('JID/PASS saved to chrome.storage');
    //console.log('Whisper.storage JID: '+Whisper.storage.jid_master+' and PASS: '+Whisper.storage.pass_master);
  });
});

// ATTACH EVENT \\
$(document).bind('attach', function (ev, data) {
  Whisper.connection = new Strophe.Connection(
   'http://ec2-54-186-151-244.us-west-2.compute.amazonaws.com:5280/http-bind');

  //data.rid = parseInt(data.rid,10)+1;
  Whisper.connection.attach(data.jid, data.sid, data.rid, Whisper.on_connect);
});

////////////////////////////////////////////////////////////////
// CHANGE COOKIES TO chrome.storage!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// DISCONNECTED EVENT \\
$(document).bind('disconnected', function () {
  // Manually (or maybe I can keep this one in the Whisper object?)
  Whisper.del_storage();
  
  Whisper.connection = null;
  Whisper.pending_subscriber = null;
  Whisper.on_connect;

  $('#roster-area ul').empty();
  $('#chat-area ul').empty();
  $('#chat-area div').remove();
});
////////////////////////////////////////////////////////////////

// ROSTER LOADED EVENT
$(document).bind('roster', function() {
  $('.roster-contact').on('click', function() {
    console.log('.roster-contact click detected.');
    var jid = $(this).find(".roster-jid").text();
    console.log('.roster-contact JID: '+jid);
    var name = $(this).find(".roster-name").text();
    console.log('.roster-contact NAME: '+name);
    
    switch(Whisper.which_friend) {
      case 'first':
        Whisper.first_jid = jid;
        Whisper.first_name = name;
        console.log('Whisper.first_jid: '+Whisper.first_jid+' and name: '+Whisper.first_name);
        $('#first_link').html(Whisper.first_name+' (click to change)');
        break;
      case 'second':
        Whisper.second_jid = jid;
        Whisper.second_name = name;
        console.log('Whisper.second_jid: '+Whisper.second_jid+' and name: '+Whisper.second_name);
        $('#second_link').html(Whisper.second_name+' (click to change)');
        break;
      case 'third':
        Whisper.third_jid = jid;
        Whisper.third_name = name;
        console.log('Whisper.first_jid: '+Whisper.third_jid+' and name: '+Whisper.third_name);
        $('#third_link').html(Whisper.third_name+' (click to change)');
        break;
      case 'fourth':
        Whisper.fourth_jid = jid;
        Whisper.fourth_name = name;
        console.log('Whisper.fourth_jid: '+Whisper.fourth_jid+' and name: '+Whisper.fourth_name);
        $('#fourth_link').html(Whisper.fourth_name+' (click to change)');
        break; 
      case 'fifth':
        Whisper.fifth_jid = jid;
        Whisper.fifth_name = name;
        console.log('Whisper.fifth_jid: '+Whisper.fifth_jid+' and name: '+Whisper.fifth_name);
        $('#fifth_link').html(Whisper.fifth_name+' (click to change)');
        break;
    }
    $('#roster-area').fadeOut('fast');
  });
});

////////////////////////////////////////////////////////////////
// CHANGE COOKIES TO chrome.storage!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// UNLOAD EVENT (Leaving page) \\
$(window).bind('unload', function () {
  console.log('Unload triggered.');
  if (Whisper.connection !== null) {
    // Manually save JID/SID/RID to chrome.storage here \\
    //Whisper.set_storage();
    chrome.storage.sync.set({
      jid: Whisper.connection.jid,
      sid: Whisper.connection._proto.sid,
      rid: Whisper.connection._proto.rid
    }, function() {
      console.log('JID/SID/RID saved to chrome.storage');
      //console.log('Whisper.storage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);
    });
  } else {
    // Manually delete JID/SID/RID to chrome.storage here (or maybe I can keep this one in the Whisper object?)\\
    Whisper.del_storage();
  }
});
////////////////////////////////////////////////////////////////

