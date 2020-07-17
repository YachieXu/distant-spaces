//Webex Bot Starter - featuring the webex-node-bot-framework - https://www.npmjs.com/package/webex-node-bot-framework

var framework = require('webex-node-bot-framework');
var webhook = require('webex-node-bot-framework/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(express.static('images'));
const config = require("./config.json");

// init framework
var framework = new framework(config);
framework.start();
console.log("Starting framework, please wait...");

framework.on("initialized", function () {
  console.log("framework is all fired up! [Press CTRL-C to quit]");
});

// A spawn event is generated when the framework finds a space with your bot in it
// If actorId is set, it means that user has just added your bot to a new space
// If not, the framework has discovered your bot in an existing space
framework.on('spawn', (bot, id, actorId) => {
  if (!actorId) {
    // don't say anything here or your bot's spaces will get
    // spammed every time your server is restarted
    console.log(`While starting up, the framework found our bot in a space called: ${bot.room.title}`);
  } else {
    // When actorId is present it means someone added your bot got added to a new space
    // Lets find out more about them..
    var msg = 'You can say `help` to get the list of words I am able to respond to.';
    bot.webex.people.get(actorId).then((user) => {
      msg = `Hello there ${user.displayName}. ${msg}`; 
    }).catch((e) => {
      console.error(`Failed to lookup user details in framwork.on("spawn"): ${e.message}`);
      msg = `Hello there. ${msg}`;  
    }).finally(() => {
      // Say hello, and tell users what you do!
      if (bot.isDirect) {
        bot.say('markdown', msg);
      } else {
        let botName = bot.person.displayName;
        msg += `\n\nDon't forget, in order for me to see your messages in this group space, be sure to *@mention* ${botName}.`;
        bot.say('markdown', msg);
      }
    });
  }
});


//Process incoming messages

let responded = false;
/* On mention with command
ex User enters @botname help, the bot will write back in markdown
*/
framework.hears(/help|what can i (do|say)|what (can|do) you do/i, function (bot, trigger) {
  console.log(`someone needs help! They asked ${trigger.text}`);
  responded = true;
  bot.say(`Hello ${trigger.person.displayName}.`)
    .then(() => sendHelp(bot))
    .catch((e) => console.error(`Problem in help hander: ${e.message}`));
});


/* ----------------------------------------------------------------------------
------------------------Number of Clients per floor----------------------------
-----------------------------------------------------------------------------*/

framework.hears('Client Count', function (bot) {
  console.log("Client Count in the location");
  responded = true;
  //There would be an additional API call here to verify how many floors exist in the DNASpaces account, and set options for the floor_input_card
  bot.sendCard(floor_input_card, 'This is customizable fallback text for clients that do not support buttons & cards'); //Send card in message, with card_dice_JSON defined below - second string is displayed when card is not supported

  /* ----- Old Code -------------
  console.log("Client Count in the location");
  responded = true;

  var myHeaders = newHeaders ();
  myHeaders.append("Content.Type", "application/json");
  myHeaders.append("Authorization", "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYnkiOiJMb2NhdGlvbiIsInR5cGUiOiJCZWFyZXIiLCJ0ZW5hbnRJZCI6MTc3NjksInVzZXJuYW1lIjoieWFjeHVAY2lzY28uY29tIiwia2V5SWQiOiI3M2FkYWQ0NC0yYjQwLTRhOTEtOGMwOS0zYzUxZjQ5YmQwMDYiLCJ1c2VySWQiOjI0MjY3LCJpYXQiOjE1OTQwODkzMzMsImV4cCI6MTYwMTg2NTMzM30.1gS2jWgara12uYQwsqhwDIYYN9lhGNnSXv01JCrrxhs")
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  var output = fetch("https://dnaspaces.io/api/location/v1/clients/count", requestOptions)
    .then (response=> response.json())
    .then (data=>{
      var total = data.results.total
      console.log ('Client count is ${total}')
      bot.say('The number of clients in the current location is: ${total}');
    })
    .then (result => console.log(result))
    .catch (error => console.log('error', error));

    ------------------old code end--------------------------------*/
});

framework.on('attachmentAction', function (bot, trigger) {
  //initalizing variables 
  let floor = "";
  let count = 0;
  let status = "";

  let placeholdercount = {'26':7, '27':18, '28':25}; //this would be replaced with a api call

  let input = JSON.parse(JSON.stringify(trigger.attachmentAction, null, 2)); //parse data from previous card
  floor = input.inputs.floor //find which floor user selected

  let messageid = input.messageId; //find message id from previous card
  deletemsg(messageid); //delete previous card

  count = placeholdercount[floor]; //find the cound assosiated with the floor chosen
  status = getstatus(count); //set "status" in output card
  console.log("Status on floor " + floor + " is " + status);
  (floor_output_card).body[0].columns[0].items[1].text = "Floor " + floor; //set floor number in output card
  (floor_output_card).body[2].items[0].text = "Number of people on this floor: " + count; //set number of people in output card
  bot.sendCard((floor_output_card), 'Placeholder'); //send to end user
});


// ------------------Helper Functions for Number of Clients --------------------------------------
function getstatus(count) {
  if (count < 10) { //when there are less than 10 people
    (floor_output_card).body[1].items[0].text = "Status : Safe";
    (floor_output_card).body[1].items[0].color = "Good"; 
    (floor_output_card).body[1].items[0].weight = "Lighter"
    return ("safe");
  }

  else if (count < 20) { //when there are less than 20 people
    (floor_output_card).body[1].items[0].text = "Status : Busy";
    (floor_output_card).body[1].items[0].color = "Warning"; 
    (floor_output_card).body[1].items[0].weight = "Lighter"
    return ("crowded");
  }

  else { //when there are 20 or more people
    (floor_output_card).body[1].items[0].text = "Status : Very Busy";
    (floor_output_card).body[1].items[0].color = "Warning"; 
    (floor_output_card).body[1].items[0].weight = "Bolder"
    return ("busy");
  }

}

function deletemsg(messageid){
  const https = require('https') //start https
  const options = {
    hostname: 'webexapis.com', 
    path: '/v1/messages/' + messageid, //messageid from message you'd want to delete
    method: 'DELETE', //this API calls for DELETE - can be subsituted for GET or POST or PUT depending on what API requires
    headers: {"Authorization" : "Bearer "  + token} //set authorization in header - "Bearer" lets the API know that it's OAuth and not HTTP Basic Auth
  }
  
  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`)
  
    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })
  
  req.on('error', (error) => {
    console.error(error)
  })
  
  req.end()

}

//---------------------------------Card JSON for number of clients----------------------------
let floor_input_card = 
{
  "type": "AdaptiveCard",
  "body": [
      {
          "type": "ColumnSet",
          "columns": [
              {
                  "type": "Column",
                  "items": [
                      {
                          "type": "TextBlock",
                          "text": "Distant Spaces Demo",
                          "weight": "Lighter",
                          "color": "Accent"
                      },
                      {
                          "type": "TextBlock",
                          "weight": "Bolder",
                          "text": "Please pick a floor!",
                          "horizontalAlignment": "Left",
                          "wrap": true,
                          "color": "Light",
                          "size": "Large",
                          "spacing": "Small"
                      }
                  ],
                  "width": "stretch"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Which floor do you want to learn about?"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "Input.ChoiceSet",
                  "placeholder": "Floor Choice",
                  "choices": [
                      {
                          "title": "Floor 26",
                          "value": "26"
                      },
                      {
                          "title": "Floor 27",
                          "value": "27"
                      },
                      {
                          "title": "Floor 28",
                          "value": "28"
                      }
                  ],
                  "style": "expanded",
                  "id": "floor",
                  "isMultiSelect": false
              }
          ],
          "separator": true
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "ActionSet",
                  "actions": [
                      {
                          "type": "Action.Submit",
                          "title": "Submit"
                      }
                  ]
              }
          ],
          "separator": true
      }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.2"
}


let floor_output_card = 
{
  "type": "AdaptiveCard",
  "body": [
      {
          "type": "ColumnSet",
          "columns": [
              {
                  "type": "Column",
                  "items": [
                      {
                          "type": "TextBlock",
                          "text": "Distant Spaces Demo",
                          "weight": "Lighter",
                          "color": "Accent"
                      },
                      {
                          "type": "TextBlock",
                          "weight": "Bolder",
                          "text": "Floor ",
                          "horizontalAlignment": "Left",
                          "wrap": true,
                          "color": "Light",
                          "size": "Large",
                          "spacing": "Small",
                          "id": "title"
                      }
                  ],
                  "width": "stretch"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Status : ",
                  "id": "status"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Number of people on this floor : ",
                  "id": "number"
              }
          ],
          "separator": true
      }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.2"
}

// maintnance areas

framework.hears('Maintnance Areas', function (bot) {
  console.log("Avoided Areas");
  responded = true;
  var myHeaders = newHeaders ();
  myHeaders.append("Content.Type", "application/json");
  myHeaders.append("Authorization", "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYnkiOiJMb2NhdGlvbiIsInR5cGUiOiJCZWFyZXIiLCJ0ZW5hbnRJZCI6MTc3NjksInVzZXJuYW1lIjoieWFjeHVAY2lzY28uY29tIiwia2V5SWQiOiI3M2FkYWQ0NC0yYjQwLTRhOTEtOGMwOS0zYzUxZjQ5YmQwMDYiLCJ1c2VySWQiOjI0MjY3LCJpYXQiOjE1OTQwODkzMzMsImV4cCI6MTYwMTg2NTMzM30.1gS2jWgara12uYQwsqhwDIYYN9lhGNnSXv01JCrrxhs")
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  var output = fetch("https://dnaspaces.io/api/location/v1/map/elements/floor", requestOptions)
    .then (response=> response.json())
    .then (data=>{
      var total = data.results.total
      console.log ('Avoid the following floors ${total}')
      bot.say(' Please avoid the following areas: ${total}');
    })
    .then (result => console.log(result))
    .catch (error => console.log('error', error));
});

//Office Admin
framework.hears('Office Admin', function (bot) {
	  console.log('Office Admin Info Requested');
	  responded = true;
	  bot.say('The Office Admin is Tara Ward');
	});

//Sanitization Stations
framework.hears('Sanitization Stations', function (bot) {
	  console.log('Sanitization Station info requested');
	  responded = true;
	  bot.say('Sanitization Stations are located at the following: lobby Area, cafeteria, mail room');
	});


/* On mention with unexpected bot command
   Its a good practice is to gracefully handle unexpected input
*/
framework.hears(/.*/, function (bot, trigger) {
  // This will fire for any input so only respond if we haven't already
  if (!responded) {
    console.log(`catch-all handler fired for user input: ${trigger.text}`);
    bot.say(`Sorry, I don't know how to respond to "${trigger.text}"`)
      .then(() => sendHelp(bot))
      .catch((e) => console.error(`Problem in the unexepected command hander: ${e.message}`));
  }
  responded = false;
});

function sendHelp(bot) {
  bot.say("markdown", 'These are the commands I can respond to:', '\n\n ' +
    '1. **Client Count**   (clients per floor) \n' +
    '2. **Maintnance Areas**  (Maintnace zones in process of being cleaned) \n' +
    '3. **Office Admin**  (get details about office admin) \n' +
    '4. **Sanitization Stations** (get details about the location of sanitization stations) \n' );

}


//Server config & housekeeping
// Health Check
app.get('/', function (req, res) {
  res.send(`I'm alive.`);
});

app.post('/', webhook(framework));

var server = app.listen(config.port, function () {
  framework.debug('framework listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function () {
  framework.debug('stoppping...');
  server.close();
  framework.stop().then(function () {
    process.exit();
  });
});