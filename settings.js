// As of 4/16/14: Changing session control from trying to use one session for multiple tabs to separate sessions per tab
// As of 4/16/14: Getting rid of JID/RID/SID chrome.storage save, instead saving JID/PASS to chrome.storage
// As of 5/15/15: Creating setting.js's very own Object. Only options saving occurs on this page, no Strophe connections

/* ======================================================================
=                           SETTINGS OBJECT                             =
====================================================================== */

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

  convertRawKeys: function (keysRawValue) {
    var keyBank = {};

    for (var i=0; i < keysRawValue.length; i++) {
      var key = keysRawValue.charAt(i);
      console.log('charAt('+i+'): '+key);

      // Convert to keycode
      var keycode = this.charKeycode[key];
      console.log('Keycode = '+keycode);

      // Push keycode to bank, and set initially to false
      keyBank[keycode] = 'false';
    }

    console.log('keyBank: ', keyBank);

    return keyBank;
  },

  saveOption: function (checkbox, value, friendJid, friendName) {
    // Settings need to be passed as an object to chrome.storage, so create placeholder
    var optionsPlaceholder = {};

    // If the option is checked in the settings page...
    if ($('#'+checkbox).is(':checked')) {

      console.log(checkbox+' detected. Chrome.storage triggered.');

      // Create namespaced object
      optionsPlaceholder[checkbox] = {};

      // Set enabled to true
      optionsPlaceholder[checkbox]['enabled'] = true;

      console.log('parseInt value = ' + parseInt(value));

      // *** IF TIMEOUT/FADEOUT *** \\
      if (parseInt(value) == NaN) {

        var timespanValue = parseInt($('#'+value).val());
        console.log('Timespan value = ' + timespanValue);
        console.log('Typeof timespan value: ' + typeof timespanValue);

        optionsPlaceholder[checkbox]['timespan'] = timespanValue;

        console.log('Options placeholder: ', optionsPlaceholder);

      } 

      // *** IF SHORTCUT KEYS *** \\
      else {

        // Get value string
        var keysRawValue = $('#'+value).val().toLowerCase();
        console.log('keysRawValue: '+keysRawValue);

        // Call key converter method, convert to keycode
        var keyBank = this.convertRawKeys(keysRawValue);

        // Save key bank to this options object
        optionsPlaceholder[checkbox]['keyBank'] = keyBank;
        console.log('Options placeholder: ', optionsPlaceholder);

        // *** IF FRIENDS OPTION *** \\
        if (friendJid !== undefined) {
          optionsPlaceholder[checkbox]['friendJid'] = this[friend_jid];
          optionsPlaceholder[checkbox]['friendName'] = this[friend_name];
        }

      }
    }

    // Still necessary in case user unchecks the option
    else {
      console.log(checkbox + ' not detected. Setting option to \'disabled\' in chrome.storage');

      // Disable this option
      optionsPlaceholder[checkbox] = false;
    }

    // Save settings to chrome.storage
    chrome.storage.sync.set(optionsPlaceholder);

  },

  onSaved: function() {
    $('#save_message').show();
    setTimeout(function() {
      $('#save_message').fadeOut('slow');
    }, 1000);  
  }

}

/* ======================================================================
=                         SETTINGS DOM READY                            =
====================================================================== */

$(document).ready(function() {

  // CHROME.STORAGE GET ALL SAVED PREFERENCES AND RESTORE \\
  chrome.storage.sync.get(function (result) {

    console.log('Chrome.storage result: ', result);

    // [EDITED] DRYless version of initial fill-in (5/13/14)
    var array = ['onoff', 'first', 'second', 'third', 'fourth', 'fifth', 'timeout', 'fadeout'];

    for (var i=0; i<array.length; i++) {

      console.log(array[i]);

      // If option is enabled in chrome.storage...
      if (result[array[i]+'_checkbox']) {

        // Check the checkbox in the settings page
        $('#'+array[i]+'_checkbox').prop('checked', true);

        // Set the option's value in the settings page
        $('#'+array[i]).val(result[array[i]]);

        // *** IF SHORTCUT KEYS *** \\
        if (result[array[i]+'_checkbox']['keyBank']) {

          var characters = "";

          for (var x in result[array[i]+'_checkbox']['keyBank']) {

            var letter = String.fromCharCode(x);
            characters += letter;

          }

          characters = characters.split('').join('+');

          $('#'+array[i]).attr('value', characters);

          // *** IF FRIENDS *** \\
          if (result[array[i]+'_checkbox']['friendJid']) {

            $('#'+array[i]+'_link').html(result[array[i]+'_checkbox']['friendName']+' (click to change)');

            Settings[array[i]+'_jid'] = result[array[i]+'_checkbox']['friendJid'];
            Settings[array[i]+'_name'] = result[array[i]+'_checkbox']['friendName'];

          } 

        }

        // *** IF TIMEOUT / FADEOUT *** \\
        if (result[array[i]+'_checkbox']['timespan']) {

          var timespan = result[array[i]+'_checkbox']['timespan'].toString();
          $('#'+array[i]).val(timespan);  

        }

      }

      // Else if option is false in chrome.storage...
      else {

        // Uncheck the checkbox
        $('#'+array[i]+'_checkbox').prop('checked', false);

        // Set the default value
        switch (array[i]) {

          case 'onoff':
          case 'first':
          case 'second':
          case 'third':
          case 'fourth':
          case 'fifth':
            $('#'+array[i]).attr('placeholder', 'Enter hotkey letters');
            $('#'+array[i]+'_link').html('no one (click to assign)');
            break;
          case 'timeout':
          case 'fadeout':
            $('#'+array[i]).val('Select');
            break;
          default:
            console.log('No value. Something is wrong!');

        }

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

  // ******* NEW LOGIN CLICK LISTENER [10/12/14] ********* \\


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
    
    Settings.saveOption('onoff_checkbox', 'onoff');
    Settings.saveOption('first_checkbox', 'first', 'first_jid', 'first_name');
    Settings.saveOption('second_checkbox', 'second', 'second_jid', 'second_name');
    Settings.saveOption('third_checkbox', 'third', 'third_jid', 'third_name');
    Settings.saveOption('fourth_checkbox', 'fourth', 'fourth_jid', 'fourth_name');
    Settings.saveOption('fifth_checkbox', 'fifth', 'fifth_jid', 'fifth_name');
    Settings.saveOption('timeout_checkbox', 'timeout');
    Settings.saveOption('fadeout_checkbox', 'fadeout');
    Settings.onSaved();
  });

});

/* ======================================================================
=                       SETTINGS DOM EVENT BINDS                        =
====================================================================== */

// ROSTER LOADED EVENT LISTENER \\
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