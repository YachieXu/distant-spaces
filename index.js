//Webex Bot Starter - featuring the webex-node-bot-framework - https://www.npmjs.com/package/webex-node-bot-framework

var framework = require('webex-node-bot-framework');
var webhook = require('webex-node-bot-framework/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(express.static('images'));
const config = require("./config.json");


//set both access tokens
var bottoken = config.token;
var dnatoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYnkiOiJMb2NhdGlvbiIsInR5cGUiOiJCZWFyZXIiLCJ0ZW5hbnRJZCI6MTc3NjksInVzZXJuYW1lIjoieWFjeHVAY2lzY28uY29tIiwia2V5SWQiOiI3M2FkYWQ0NC0yYjQwLTRhOTEtOGMwOS0zYzUxZjQ5YmQwMDYiLCJ1c2VySWQiOjI0MjY3LCJpYXQiOjE1OTQwODkzMzMsImV4cCI6MTYwMTg2NTMzM30.1gS2jWgara12uYQwsqhwDIYYN9lhGNnSXv01JCrrxhs"

//set email of office admin
var officeadminemail = "kelvinwhcui@gmail.com"


var cardstatus = 0; //guide - 0 is default, and triggers the floor_output_card when action.submit is called, 1 triggers office_admin_card when action.submit is called, 2 triggers a dm to the office admin


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
      msg = `Hello there! ${msg}`; 
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

framework.hears('info', function (bot) {
  console.log("Client Count in the location");
  responded = true;
  //There would be an additional API call here to verify how many floors exist in the DNASpaces account, and set options for the floor_input_card
  bot.sendCard(floor_input_card, 'Floor Count Selector Card'); //Send card in message, with card_dice_JSON defined below - second string is displayed when card is not supported
  cardstatus = 0;
});

framework.hears('Office Admin', function (bot) {
  console.log("Office Admin");
  responded = true;
  //There would be an additional API call here to verify how many floors exist in the DNASpaces account, and set options for the floor_input_card
  bot.sendCard(office_admin_card, 'Office Admin Information'); //Send card in message, with card_dice_JSON defined below - second string is displayed when card is not supported
  cardstatus = 2;
});

framework.on('attachmentAction', function (bot, trigger) {
  let personname = trigger.person.displayName;
  let personemail = trigger.person.emails[0];


  if (cardstatus == 0) {//send floor_output_card
    //variable definitions
    let floor = "";
    let count = 0;
    let status = "";
    let floorcount = {};


    //floorkey - use this to convert floor id to human readable floor numbers
    let floorkey = {"719d02e2b00e4535b6e095c0d757e44b" : "26", } 

    //date - use this object to get the time of the query
    let date = new Date();
    let time = date.toUTCString();

    //start api call to dnaspaces to query all counts on all floors
    const https = require('https');
    const options = {
      hostname: 'dnaspaces.io',
      path: '/api/location/v1/clients/floors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'bearer ' + dnatoken
      },
    }
    https.get(options, (response) => {
    console.log(`statusCode: ${response.statusCode}`)

    let data = ''
    response.on('data', function (chunk) {
        data += chunk;
    });

    response.on('end', function () { 
        let client_res = (JSON.parse(data))
        //iterating over all floors, adding the count of each floor to the floorcount object
        for (let i of client_res.results) {
          let floorid = i.floorID;
          let floor = floorkey[floorid]; //convert floorid into human readable floor numbers using floorkey object
          floorcount[floor] = parseInt(i.count); 
        }
    });

    response.on("error", function (error) {
      console.error(error);
      });
    });


    floorcount = {"27":8, "28":17, "29":25}; //DEMO ONLY - remove this line if using api

    let input = JSON.parse(JSON.stringify(trigger.attachmentAction, null, 2)); //parse data from previous card
    floor = input.inputs.floor //find which floor user selected
    console.log("floor is " + floor)

    let messageid = input.messageId; //find message id from previous card
    deletemsg(messageid); //delete previous card

    count = floorcount[floor]; //find the cound assosiated with the floor chosen
    status = getstatus(count); //set "status" in output card
    console.log("Status on floor " + floor + " is " + status);
    floor_output_card.body[0].columns[0].items[1].text = "Floor " + floor; //set floor number in output card
    floor_output_card.body[2].items[0].text = "Number of people on this floor: " + count; //set number of people in output card
    floor_output_card.body[5].items[0].text = "Time: " + time;
    bot.sendCard((floor_output_card), 'Floor Count Card'); //send to end user
    cardstatus = 1;
  }
  else if (cardstatus == 1){//send out office_admin_card
    bot.sendCard((office_admin_card), 'Office Admin Card')
    cardstatus = 2;
  }

  else if (cardstatus == 2){
    let roomid = ""
    console.log("Creating room!");
    createroom(personname, personemail)
  }

});

// ------------------Helper Functions --------------------------------------

//--------------------Get status based on people count function---------------
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

//---------------Delete a message function------------------------
function deletemsg(messageid){
  const https = require('https') //start https
  const options = {
    hostname: 'webexapis.com', 
    path: '/v1/messages/' + messageid, //messageid from message you'd want to delete
    method: 'DELETE', //this API calls for DELETE - can be subsituted for GET or POST or PUT depending on what API requires
    headers: {"Authorization" : "Bearer "  + bottoken} //set authorization in header - "Bearer" lets the API know that it's OAuth and not HTTP Basic Auth
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
//---------------------Create a Room function ------------------
function createroom(personname, personemail){
  console.log("creating room!")
  const https = require('https');
  let roomid = ""
  
  var postData = JSON.stringify(
    {
    "title": personname + "'s Office Admin Request"
    }
  );
  
  var options = {
    hostname: 'webexapis.com',
    path: '/v1/rooms',
    method: 'POST',
    headers: {
         'Content-Type': 'application/json',
         'Content-Length': postData.length,
         "Authorization" : "Bearer "  + bottoken
       }
  };
 
  var req = https.request(options, (res) => {
    //console.log('statusCode:', res.statusCode);
    //console.log('headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      data = JSON.parse(data);
      //console.log("data" + data);
      roomid = data.id;
      //console.log("data.id: " + data.id);
      addroom(roomid, officeadminemail);
      addroom(roomid, personemail);
    });
  });

  req.on('error', (e) => {
    console.error(e);
  });
  
  req.write(postData);
  req.end();
}

//--------------------Add people to a room subfunction-------------
function addroom(roomid, personemail) {
  console.log("Adding " + personemail + " to room with id " + roomid)
  const https = require('https');
  
  var postData = JSON.stringify(
    {
    "roomId": roomid,
    "personEmail": personemail
    }
  );
  
  var options = {
    hostname: 'webexapis.com',
    path: '/v1/memberships',
    method: 'POST',
    headers: {
         'Content-Type': 'application/json',
         'Content-Length': postData.length,
         "Authorization" : "Bearer "  + bottoken
       }
  };
 
  var req = https.request(options, (res) => {
    //console.log('statusCode:', res.statusCode);
    //console.log('headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      data = JSON.stringify(data);
      //console.log(data);
    });
  });

  req.on('error', (e) => {
    console.error(e);
  });
  
  req.write(postData);
  req.end();
}

//---------------------------------Card JSONs----------------------------
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
                          "title": "Floor 27",
                          "value": "27"
                      },
                      {
                          "title": "Floor 28",
                          "value": "28"
                      },
                      {
                          "title": "Floor 29",
                          "value": "29"
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
                  "text": "Status: ",
                  "id": "status"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Number of people on this floor: ",
                  "id": "number"
              }
          ],
          "separator": true
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Sanitization Stations are located in the following areas:",
                  "id": "sanitization",
                  "wrap": true,
                  "weight": "Lighter"
              },
              {
                  "type": "TextBlock",
                  "text": "Lobby, Cafeteria, Mail Room"
              },
              {
                  "type": "Container",
                  "items": [
                      {
                          "type": "TextBlock",
                          "text": "Please visit WHO for the latest advice regarding COVID-19:",
                          "weight": "Lighter",
                          "id": "who",
                          "wrap": true,
                          "maxLines": 1
                      },
                      {
                          "type": "ActionSet",
                          "actions": [
                              {
                                  "type": "Action.OpenUrl",
                                  "title": "World Health Organization",
                                  "iconUrl": "https://img.icons8.com/windows/32/000000/world-health-organization.png",
                                  "url": "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public"
                              }
                          ],
                          "spacing": "None",
                          "horizontalAlignment": "Left"
                      }
                  ],
                  "separator": true
              }
          ],
          "separator": true
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Contact Office Admin:",
                  "weight": "Lighter",
                  "spacing": "None"
              },
              {
                  "type": "ActionSet",
                  "horizontalAlignment": "Left",
                  "actions": [
                      {
                          "type": "Action.Submit",
                          "title": "Office Admin Info",
                          "iconUrl": "https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-contact-512.png"
                      }
                  ],
                  "spacing": "None"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Time:",
                  "size": "Small",
                  "weight": "Lighter",
                  "color": "Accent"
              }
          ],
          "separator": true
      }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.2"
}

let office_admin_card = 
{
  "type": "AdaptiveCard",
  "version": "1.0",
  "body": [
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Distant Spaces Demo",
                  "color": "Accent",
                  "weight": "Lighter"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Office Admin",
                  "size": "Large",
                  "weight": "Bolder"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "The office admin for this space is:"
              },
              {
                  "type": "TextBlock",
                  "text": "Kelvin Cui",
                  "weight": "Bolder"
              }
          ]
      },
      {
          "type": "Container",
          "separator": true,
          "items": [
              {
                  "type": "TextBlock",
                  "text": "Contact Information:"
              },
              {
                  "type": "TextBlock",
                  "text": "Email: kelvinwhcui@gmail.com"
              },
              {
                  "type": "ActionSet",
                  "actions": [
                      {
                          "type": "Action.Submit",
                          "title": "Start a Conversation"
                      }
                  ]
              }
          ]
      }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json"
}


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
  bot.say("markdown", 'If you are looking for floor density updates, please enter:', '\n\n ' +
    '**info**\n' 
    )}


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