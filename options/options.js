// As of 4/16/14: Changing session control from trying to use one session for multiple tabs to separate sessions per tab
// As of 4/16/14: Getting rid of JID/RID/SID chrome.storage save, instead saving JID/PASS to chrome.storage
// As of 5/15/15: Creating setting.js's very own Object. Only options saving occurs on this page, no Strophe connections

/* ======================================================================
=                            OPTIONS OBJECT                             =
====================================================================== */

var Options = {

  status: Number,

  roster: {},

  username: String,

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

  save: function (option, friendJid, friendName) {
    // Options need to be passed as an object to chrome.storage, so create placeholder
    var optionsPlaceholder = {};

    // Create namespaced object
    optionsPlaceholder[option] = {};

    // If the option is checked in the options page...
    if ($('#'+option+'_checkbox').is(':checked')) {

      console.log(option+' detected. Chrome.storage triggered.');

      // Set enabled to true
      optionsPlaceholder[option]['enabled'] = true;

      // *** IF SHORTCUT KEYS *** \\
      if (isNaN(parseInt($('#'+option).val()))) {

        console.log('Not a number!');

        // Get value string
        var keysRawValue = $('#'+option).val().toLowerCase();
        console.log('keysRawValue: '+keysRawValue);

        keysRawValue = keysRawValue.split('+').join('');
        console.log('keysRawValue without "+": ' + keysRawValue);

        // Call key converter method, convert to keycode
        var keyBank = this.convertRawKeys(keysRawValue);

        // Save key bank to this options object
        optionsPlaceholder[option]['keyBank'] = keyBank;
        console.log('Options placeholder: ', optionsPlaceholder);

        // *** IF FRIENDS OPTION *** \\
        if (friendJid) {
          optionsPlaceholder[option]['friendJid'] = this[friend_jid];
          optionsPlaceholder[option]['friendName'] = this[friend_name];
        }

        /* This gets prompted even when checkbox is not checked. Need to get back to this.
        // If friend is not assigned from roster...
        else {
          alert('Friend not assigned! Please assign a friend from the roster first.');
          return;
        }
        */
      } 

      // *** IF TIMEOUT/FADEOUT *** \\
      else {

        console.log('Yes it is a number!');

        var timespan = parseInt($('#'+option).val());
        console.log('Timespan = ' + timespan);
        console.log('Typeof timespan: ' + typeof timespan);

        optionsPlaceholder[option]['timespan'] = timespan;

        console.log('Options placeholder: ', optionsPlaceholder);

      }
    }

    // Still necessary in case user unchecks the option
    else {
      console.log(option + ' not detected. Setting option to \'disabled\' in chrome.storage');

      // Disable this option
      optionsPlaceholder[option]['enabled'] = false;
    }

    // Save options to chrome.storage
    chrome.storage.sync.set(optionsPlaceholder);

    chrome.storage.sync.get(function (result) {
      console.log(result);
    });

  },

  onSaved: function() {
    $('#save_message').show();
    setTimeout(function() {
      $('#save_message').fadeOut('slow');
    }, 1000);  
  },

  onStatusReceived: function (status, callback) {
    this.status = status;
    console.log('Status received: ' + this.status);

    callback();
  },

  onConnectReceived: function (username) {
    this.username = username;
    $('#user_login').html(this.username);
  },

  onRosterReceived: function (roster, callback) {
    this.roster = roster;

    callback();
  },

  handleStatus: function () {
    console.log('handleConnection triggered.');
    switch (Options.status) {
      case 1: 
        $('#login-status').html('Connecting...').css('color', 'rgb(50,200,50)');
        console.log('Connecting initiated...');
        break;
      case 2:
        $('#login-status').html('Connection failed').css('color', 'rgb(200,0,0)');
        console.log('Connection failed.');
        break;
      case 3:
        $('#login-status').html('Authenticating...').css('color', 'rgb(50,200,50)');
        console.log('Authenticating initiated...');
        break;
      case 4:
        $('#login-status').html('Authentication failed').css('color', 'rgb(200,0,0)');
        console.log('Authentication failed.');
        break;
      case 5:
        $('#login-status').html('Connected!').css('color', 'rgb(0,150,0)');
        break;
      case 6:
        $('#roster-area ul').empty();
        $('#login-status').html('Disconnected').css('color', 'rgb(200,0,0)');
        $('#attach-status').html('No');
        $('#user_login').html('no one');
        console.log('Disconnected.');
        break;
      case 7:
        $('#login-status').html('Disconnecting...').css('color', 'rgb(200,100,100)');
        console.log('Disconnecting initiated...');
        break;
      default:
        console.log('No status received, something is wrong.');   
    }
  }
 
}

/* ======================================================================
=                          OPTIONS DOM READY                            =
====================================================================== */

$(document).ready(function() {

  $(window).name = 'optionsPage';

  // CHROME.STORAGE GET ALL SAVED PREFERENCES AND RESTORE \\
  chrome.storage.sync.get(function (result) {

    console.log('Chrome.storage result: ', result);

    // [EDITED] DRYless version of initial fill-in (5/13/14)
    var array = ['onoff', 'first', 'second', 'third', 'fourth', 'fifth', 'timeout', 'fadeout'];

    for (var i=0; i<array.length; i++) {

      console.log(array[i]);

      // If option is enabled in chrome.storage...
      if (result[array[i]].enabled) {

        // Check the checkbox in the options page
        $('#'+array[i]+'_checkbox').prop('checked', true);

        // *** IF SHORTCUT KEYS *** \\
        if (result[array[i]].keyBank) {

          var characters = "";

          for (var x in result[array[i]]['keyBank']) {

            console.log('Var x: ' + x);
            var letter = String.fromCharCode(x);
            console.log('Letter: ' + letter);
            characters += letter;

          }

          console.log('Characters before split: ' + characters);

          characters = characters.split('').join('+');

          console.log('Characters after split: ' + characters);

          $('#'+array[i]).attr('value', characters);

          // *** IF FRIENDS *** \\
          if (result[array[i]]['friendJid']) {

            $('#'+array[i]+'_link').html(result[array[i]]['friendName']+' (click to change)');

            Options[array[i]+'_jid'] = result[array[i]]['friendJid'];
            Options[array[i]+'_name'] = result[array[i]]['friendName'];

          } 

        }

        // *** IF TIMEOUT / FADEOUT *** \\
        if (result[array[i]].timespan) {

          console.log(result[array[i]].timespan);
          var timespan = result[array[i]].timespan.toString();
          $('#'+array[i]).val(timespan);  

        }

      }

      // Else if option is false in chrome.storage...
      else {

        console.log('No option detected for ' + array[i] + '. Leaving option blank.');

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
          Options.status = 1;
          $('#login-status').html('Connecting...').css('color', 'rgb(50,200,50)');
          console.log('Connecting initiated...');
          break;
        case 2:
          Options.status = 2;
          $('#login-status').html('Connection failed').css('color', 'rgb(200,0,0)');
          console.log('Connection failed.');
          break;
        case 3:
          Options.status = 3;
          $('#login-status').html('Authenticating...').css('color', 'rgb(50,200,50)');
          console.log('Authenticating initiated...');
          break;
        case 4:
          Options.status = 4;
          $('#login-status').html('Authentication failed').css('color', 'rgb(200,0,0)');
          console.log('Authentication failed.');
          break;
        case 5:
          Options.status = 5;
          $('#login-status').html('Connected!').css('color', 'rgb(0,150,0)');
          // $('#user_login').html(Whisper.connection.authcid); [FIX] Get this from background page as message, on connect (5/15/14)
          break;
        case 6:
          Options.status = 6;
          $('#roster-area ul').empty();
          $('#login-status').html('Disconnected').css('color', 'rgb(200,0,0)');
          $('#attach-status').html('No');
          $('#user_login').html('no one');
          console.log('Disconnected.');
          break;
        case 7:
          Options.status = 7;
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

    console.log(bg);

    //var username = $('#username').val().toLowerCase();
    //var password = $('#password').val().toLowerCase();

    bg.Handler.login($('#username').val().toLowerCase(), $('#password').val().toLowerCase());

    //$('#username').val('');
    //$('#password').val('');
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
    if (Options.status === 5) {

      $('.container').width(975);
      $('#roster-area').removeClass('hidden');

      var currentElement = $(this)[0];
      console.log(currentElement);
      var clicked = $(this)[0].id;
      console.log('Clicked ID: '+clicked);
      switch(clicked) {
        case 'first_link': Options.which_friend = 'first';
          break;
        case 'second_link': Options.which_friend = 'second';
          break;
        case 'third_link': Options.which_friend = 'third';
          break;
        case 'fourth_link': Options.which_friend = 'fourth';
          break;
        case 'fifth_link': Options.which_friend = 'fifth';
          break;
      }
      console.log('Options.which_friend: '+Options.which_friend);
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
    
    Options.save('onoff');
    Options.save('first', 'first_jid', 'first_name');
    Options.save('second', 'second_jid', 'second_name');
    Options.save('third', 'third_jid', 'third_name');
    Options.save('fourth', 'fourth_jid', 'fourth_name');
    Options.save('fifth', 'fifth_jid', 'fifth_name');
    Options.save('timeout');
    Options.save('fadeout');
    Options.onSaved();
  });

});

/* ======================================================================
=                        OPTIONS DOM EVENT BINDS                        =
====================================================================== */


// ------------ BUILD ROSTER SEARCH ENGINE HERE [10/18/14] ----------- \\
//.....................................................................\\
// ------------------------------------------------------------------- \\


// ROSTER LOADED EVENT LISTENER \\
$(document).bind('roster', function() {
  $('.roster-contact').on('click', function() {
    console.log('.roster-contact click detected.');
    var jid = $(this).find(".roster-jid").text();
    console.log('.roster-contact JID: '+jid);
    var name = $(this).find(".roster-name").text();
    console.log('.roster-contact NAME: '+name);
    
    switch(Options.which_friend) {
      case 'first':
        Options.first_jid = jid;
        Options.first_name = name;
        console.log('Options.first_jid: '+Options.first_jid+' and name: '+Options.first_name);
        $('#first_link').html(Options.first_name+' (click to change)');
        break;
      case 'second':
        Options.second_jid = jid;
        Options.second_name = name;
        console.log('Options.second_jid: '+Options.second_jid+' and name: '+Options.second_name);
        $('#second_link').html(Options.second_name+' (click to change)');
        break;
      case 'third':
        Options.third_jid = jid;
        Options.third_name = name;
        console.log('Options.first_jid: '+Options.third_jid+' and name: '+Options.third_name);
        $('#third_link').html(Options.third_name+' (click to change)');
        break;
      case 'fourth':
        Options.fourth_jid = jid;
        Options.fourth_name = name;
        console.log('Options.fourth_jid: '+Options.fourth_jid+' and name: '+Options.fourth_name);
        $('#fourth_link').html(Options.fourth_name+' (click to change)');
        break; 
      case 'fifth':
        Options.fifth_jid = jid;
        Options.fifth_name = name;
        console.log('Options.fifth_jid: '+Options.fifth_jid+' and name: '+Options.fifth_name);
        $('#fifth_link').html(Options.fifth_name+' (click to change)');
        break;
    }
    $('#roster-area').fadeOut('fast');
  });
});

// [TEST FOR NOW, MAYBE DELETE??] [10/16/14] \\
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == 'roster') {
    console.log('Connector roster: ', message.roster);
    sendResponse({type: 'success'});
  }
});
