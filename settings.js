// As of 4/16/14: Changing session control from trying to use one session for multiple tabs to separate sessions per tab
// As of 4/16/14: Getting rid of JID/RID/SID chrome.storage save, instead saving JID/PASS to chrome.storage
// As of 5/15/15: Creating setting.js's very own Object. Only options saving occurs on this page, no Strophe connections

var Settings = {

  status: null,

  which_friend: null,

  first_jid: null,
  first_name: null,

  second_jid: null,
  second_name: null,

  third_jid: null,
  third_name: null,

  fourth_jid: null,
  fourth_name: null,

  fifth_jid: null,
  fifth_name: null,

  charKeycode: { 'a':65,'b':66,'c':67,'d':68,'e':69,'f':70,'g':71,'h':72,'i':73,'j':74,'k':75,'l':76,'m':77,'n':78,'o':79,'p':80,'q':81,'r':82,'s':83,'t':84,'u':85,'v':86,'w':87,'x':88,'y':89,'z':90 },

  on_save_onoff: function(checkbox, value) {
    var options = {};

    if ($('#'+checkbox).is(':checked')) {
      console.log(checkbox+' detected. Chrome.storage triggered.');

      options[checkbox] = true;

      // Get value string, separate each letter out (for loop)
      var value_keys = $('#'+value).val().toLowerCase();
      console.log('value_keys: '+value_keys);
      console.log('Typeof value_keys: '+typeof value_keys);

      var keyBank = {};
      // For each letter...
      for (var i=0; i < value_keys.length; i++) {       
        var key = value_keys.charAt(i);
        console.log('charAt('+i+'): '+key);

        // Convert to keycode
        var keycode = Settings.charKeycode[key];
        console.log(keycode);

        // Push keycode to keycode bank
        
        keyBank[keycode] = 'false';
      }

      console.log('keyBank: ');
      console.log(keyBank);
      
      options[value] = keyBank;

      console.log('options:');
      console.log(options);

      chrome.storage.sync.set(options);
      
      // Save value
      console.log(value+': '+value_keys);
    } else {
      console.log(checkbox+' not detected.');

      options[checkbox] = false;
      options[value] = null;
      console.log('options:');
      console.log(options);

      chrome.storage.sync.set(options);
    }
  },

  on_save_friends: function(checkbox, value, friend_jid, friend_name) {
    var options = {};

    if ($('#'+checkbox).is(':checked')) {
      console.log(checkbox+' detected. Chrome.storage triggered.');

      options[checkbox] = true;

      // Get value string, separate each letter out (for loop)
      var value_keys = $('#'+value).val().toLowerCase();
      console.log('value_keys: '+value_keys);
      console.log('Typeof value_keys: '+typeof value_keys);

      var keyBank = {};
      // For each letter...
      for (var i=0; i < value_keys.length; i++) {       
        var key = value_keys.charAt(i);
        console.log('charAt('+i+'): '+key);

        // Convert to keycode
        var keycode = Settings.charKeycode[key];
        console.log(keycode);

        // Push keycode to keycode bank
        
        keyBank[keycode] = 'false';
      }

      console.log('keyBank: ');
      console.log(keyBank);
      
      options[value] = keyBank;
      
      // Get JID and NAME from roster choice
      options[friend_jid] = Settings[friend_jid];
      options[friend_name] = Settings[friend_name];

      console.log('options:');
      console.log(options);

      chrome.storage.sync.set(options);
      
      // Save value
      console.log(value+': '+value_keys);
    } else {
      console.log(checkbox+' not detected.');

      options[checkbox] = false;
      options[value] = null;

      Settings[friend_jid] = null;
      Settings[friend_name] = null;

      options[friend_jid] = Settings[friend_jid];
      options[friend_name] = Settings[friend_name];

/* BUGGY => FIX LATER
      if (value !== 'onoff') {
        options[friend_jid] = null;
        options[friend_name] = null;
      }
*/
      chrome.storage.sync.set(options);
    }
  },

  on_save_regular: function(checkbox, value) {
    var options = {};

    if ($('#'+checkbox).is(':checked')) {
      console.log(checkbox+' detected. Chrome.storage triggered.');

      options[checkbox] = true;

      // Get value string, separate each letter out (for loop)
      var value_num = $('#'+value).val();
      console.log('value_num: '+value_num);
      console.log('Typeof value_num: '+typeof value_num);
      
      options[value] = value_num;


      console.log('options:');
      console.log(options);

      chrome.storage.sync.set(options);

    } else {
      console.log(checkbox+' not detected.');

      options[checkbox] = false;
      options[value] = null;

      chrome.storage.sync.set(options);
    }
  },

  on_saved: function() {
    $('#save_message').show();
    setTimeout(function() {
      $('#save_message').fadeOut('slow');
    }, 1000);  
  },

}



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
            Settings[array[i]+'_jid'] = result[array[i]+'_jid'];
            Settings[array[i]+'_name'] = result[array[i]+'_name'];
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

  // [ADDED] Listen for 'roster' && 'status' message from BG (5/15/14)
  chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type == 'roster') {
      console.log('Roster received: ', message.content);
      $('#roster-area ul').append(message.content);
      sendResponse({type: 'success'})
    } else if (message.type == 'status') {
      console.log('Status received: ', message.content);
      switch (message.content) {
        case 1: 
          Settings.status = 1;
          $('#login-status').html('Connecting...').css('color', 'rgb(50,200,50)');
          console.log('Connecting initiated...');
          break;
        case 2:
          Settings.status = 2;
          $('#login-status').html('Connection failed').css('color', 'rgb(200,0,0)');
          console.log('Connection failed.');
          break;
        case 3:
          Settings.status = 3;
          $('#login-status').html('Authenticating...').css('color', 'rgb(50,200,50)');
          console.log('Authenticating initiated...');
          break;
        case 4:
          Settings.status = 4;
          $('#login-status').html('Authentication failed').css('color', 'rgb(200,0,0)');
          console.log('Authentication failed.');
          break;
        case 5:
          Settings.status = 5;
          $('#login-status').html('Connected!').css('color', 'rgb(0,150,0)');
          // $('#user_login').html(Whisper.connection.authcid); [FIX] Get this from background page as message, on connect (5/15/14)
          break;
        case 6:
          Settings.status = 6;
          $('#roster-area ul').empty();
          $('#login-status').html('Disconnected').css('color', 'rgb(200,0,0)');
          $('#attach-status').html('No');
          $('#user_login').html('no one');
          console.log('Disconnected.');
          break;
        case 7:
          Settings.status = 7;
          $('#login-status').html('Disconnecting...').css('color', 'rgb(200,100,100)');
          console.log('Disconnecting initiated...');
          break;
        default:
          console.log('No status received, something is wrong.');   
      }
    }
  });

  // LOGIN CLICK LISTENER \\
  $('#login_submit').click(function() {
    // [EDITED] Deleted 'connect' trigger, added background login(); (5/15/14)
    var bg = chrome.extension.getBackgroundPage();
    bg.login($('#username').val().toLowerCase(), $('#password').val());

    $('#username').val('');
    $('#password').val('');
  });

  // [ADD] Send disconnect message to background.js (5/15/14)
  // DISCONNECT CLICK LISTENER \\
  $('#disconnect').click(function () {
    console.log('Disconnect button clicked.');
    //Whisper.connection.disconnect();
    //Whisper.connection = null;
    chrome.extension.sendMessage({type: 'disconnect'}, function (response) {
      if (response.type == 'success') {
        console.log('Disconnect sent successfully.');
      }
    });
  });

  // FRIEND_LINK CLICKS LISTENER \\
  $('.friend_link').click(function() {
    console.log('.friend_link click detected.');

    // [ADDED] conditional to see if user is already logged in (5/6/14)
    if (Settings.status === 5) {
      $('#roster-area').show();
      var currentElement = $(this)[0];
      console.log(currentElement);
      var clicked = $(this)[0].id;
      console.log('Clicked ID: '+clicked);
      switch(clicked) {
        case 'first_link': Settings.which_friend = 'first';
          break;
        case 'second_link': Settings.which_friend = 'second';
          break;
        case 'third_link': Settings.which_friend = 'third';
          break;
        case 'fourth_link': Settings.which_friend = 'fourth';
          break;
        case 'fifth_link': Settings.which_friend = 'fifth';
          break;
      }
      console.log('Settings.which_friend: '+Settings.which_friend);
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
    
    Settings.on_save_onoff('onoff_checkbox', 'onoff');
    Settings.on_save_friends('first_checkbox', 'first', 'first_jid', 'first_name');
    Settings.on_save_friends('second_checkbox', 'second', 'second_jid', 'second_name');
    Settings.on_save_friends('third_checkbox', 'third', 'third_jid', 'third_name');
    Settings.on_save_friends('fourth_checkbox', 'fourth', 'fourth_jid', 'fourth_name');
    Settings.on_save_friends('fifth_checkbox', 'fifth', 'fifth_jid', 'fifth_name');
    Settings.on_save_regular('timeout_checkbox', 'timeout');
    Settings.on_save_regular('fadeout_checkbox', 'fadeout');
    Settings.on_saved();
  });

});

// [DELETE?] Moved to 'background.js' except attach bind (5/15/14)
/* ======================= CUSTOM EVENT BINDS ====================== 

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
==================================================================== */

// ROSTER LOADED EVENT \\
$(document).bind('roster', function() {
  $('.roster-contact').on('click', function() {
    console.log('.roster-contact click detected.');
    var jid = $(this).find(".roster-jid").text();
    console.log('.roster-contact JID: '+jid);
    var name = $(this).find(".roster-name").text();
    console.log('.roster-contact NAME: '+name);
    
    switch(Settings.which_friend) {
      case 'first':
        Settings.first_jid = jid;
        Settings.first_name = name;
        console.log('Settings.first_jid: '+Settings.first_jid+' and name: '+Settings.first_name);
        $('#first_link').html(Settings.first_name+' (click to change)');
        break;
      case 'second':
        Settings.second_jid = jid;
        Settings.second_name = name;
        console.log('Settings.second_jid: '+Settings.second_jid+' and name: '+Settings.second_name);
        $('#second_link').html(Settings.second_name+' (click to change)');
        break;
      case 'third':
        Settings.third_jid = jid;
        Settings.third_name = name;
        console.log('Settings.first_jid: '+Settings.third_jid+' and name: '+Settings.third_name);
        $('#third_link').html(Settings.third_name+' (click to change)');
        break;
      case 'fourth':
        Settings.fourth_jid = jid;
        Settings.fourth_name = name;
        console.log('Settings.fourth_jid: '+Settings.fourth_jid+' and name: '+Settings.fourth_name);
        $('#fourth_link').html(Settings.fourth_name+' (click to change)');
        break; 
      case 'fifth':
        Settings.fifth_jid = jid;
        Settings.fifth_name = name;
        console.log('Settings.fifth_jid: '+Settings.fifth_jid+' and name: '+Settings.fifth_name);
        $('#fifth_link').html(Settings.fifth_name+' (click to change)');
        break;
    }
    $('#roster-area').fadeOut('fast');
  });
});

/* [DELETE] Don't need this anymore, Strophe connection lives on background page (5/15/14)
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
*/