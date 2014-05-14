// As of 4/16/14: Changing session control from trying to use one session for multiple tabs to separate sessions per tab
// As of 4/16/14: Getting rid of JID/RID/SID chrome.storage save, instead saving JID/PASS to chrome.storage

$(document).ready(function() {

  // CHROME.STORAGE GET ALL SAVED PREFERENCES AND RESTORE \\
  chrome.storage.sync.get(function (result) {
    console.log('Chrome.storage result: ', result);

    // [EDITED] DRYless version of initial fill-in (5/13/14)
    var array = ['onoff', 'first', 'second', 'third', 'fourth', 'fifth', 'timeout', 'fadeout'];

    for (var i=0; i<array.length; i++) {
      console.log(array[i]);
      if (result[array[i]+'_checkbox'] === true) {
        $('#'+array[i]+'_checkbox').prop('checked', true);
        if (typeof result[array[i]] == 'string') {
          if (result[array[i]]) {
            $('#'+array[i]).val(result[array[i]]);  
          } else {
            $('#'+array[i]).val('Select');
          }
        } else if (typeof result[array[i]] == 'object') {
          var characters = "";
          for (var x in result[array[i]]) {
            var letter = String.fromCharCode(x);
            characters += letter;
          }
          characters.split('').join(' '); // [FIX] buggy, no effect
          $('#'+array[i]).attr('value', characters);
          if (result[array[i]+'_jid']) {
            $('#'+array[i]+'_link').html(result[array[i]+'_name']+' (click to change)');
            Whisper[array[i]+'_jid'] = result[array[i]+'_jid'];
            Whisper[array[i]+'_name'] = result[array[i]+'_name'];
          } else {
            $('#'+array[i]+'_link').html('no one (click to assign)');
          }
        }
      } else {
        $('#'+array[i]+'_checkbox').prop('checked', false);
        $('#'+array[i]).attr('placeholder', 'Enter hotkey letters');
      }
    }

  });

  // CHROME.STORAGE GET JID/SID/RID \\
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

  // LOGIN CLICK LISTENER \\
  $('#login_submit').click(function() {
    $(document).trigger('connect', {
      jid: $('#username').val().toLowerCase(),
      password: $('#password').val()
    });
    $('#username').val('');
    $('#password').val('');
  });

  // DISCONNECT CLICK LISTENER \\
  $('#disconnect').click(function () {
    console.log('Disconnect button clicked.');
    Whisper.connection.disconnect();
    Whisper.connection = null;
  });

  // FRIEND_LINK CLICKS LISTENER \\
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
    } else { // Else show the 'Login first!' message alert
      $('#roster-alert').show(function() {
        setTimeout(function() {
          $('#roster-alert').fadeOut('slow');
        }, 1000);  
      });
    }
    
  });

  // OPTIONS SAVE CLICK LISTENER \\
  $('#save').click(function() {
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

/* ======================= CUSTOM EVENT BINDS ====================== */

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

  // [ADDED] background page (5/9/14)
  var bg = chrome.extension.getBackgroundPage();
  bg.saveInfo(Whisper.connection.authzid, Whisper.connection.pass);
});

// ATTACH EVENT \\
$(document).bind('attach', function (ev, data) {
  Whisper.connection = new Strophe.Connection(
   'http://ec2-54-186-151-244.us-west-2.compute.amazonaws.com:5280/http-bind');

  Whisper.connection.attach(data.jid, data.sid, data.rid, Whisper.on_connect);
});

// DISCONNECTED EVENT \\
$(document).bind('disconnected', function () {
  Whisper.del_storage();
  Whisper.connection = null;
  Whisper.pending_subscriber = null;
  Whisper.on_connect;

  $('#roster-area ul').empty();
  // [DELETE] $('#chat-area ul').empty();
  // [DELETE] $('#chat-area div').remove();
});

// ROSTER LOADED EVENT \\
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

// UNLOAD EVENT (Leaving page / for session info save) \\
$(window).bind('unload', function () {
  console.log('Unload triggered.');
  if (Whisper.connection !== null) {
    // Manually save JID/SID/RID to chrome.storage here
    chrome.storage.sync.set({
      jid: Whisper.connection.jid,
      sid: Whisper.connection._proto.sid,
      rid: Whisper.connection._proto.rid
    }, function() {
      console.log('JID/SID/RID saved to chrome.storage');
      //console.log('Whisper.storage JID: '+Whisper.storage.jid+' and SID: '+Whisper.storage.sid+' and RID: '+Whisper.storage.rid);
    });
  } else {
    // Delete JID/SID/RID from chrome.storage
    Whisper.del_storage();
  }
});
