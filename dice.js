//Webex Bot Starter - featuring the webex-node-bot-framework - https://www.npmjs.com/package/webex-node-bot-framework

var framework = require('webex-node-bot-framework');
var webhook = require('webex-node-bot-framework/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(express.static('images'));
const config = require("./configs.json");

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
    //bot.say('markdown', 'restart');
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


/*------------------------------------------------------------------------------------------------------
 ----------------------------------- START OF API DEMO -------------------------------------------------
 ------------------------------------------------------------------------------------------------------*/

framework.hears("dice", function(bot){
  console.log("dice card initiated!");
  responded = true;
  bot.sendCard(card_dice_JSON, 'This is customizable fallback text for clients that do not support buttons & cards'); //Send card in message, with card_dice_JSON defined below - second string is displayed when card is not supported
});

framework.on('attachmentAction', function (bot, trigger) {
  const http = require('http'); //create http, change both to https for DNAspaces API
  let apiaddress = ''
  let currentroll = 0;

  let data = JSON.parse(JSON.stringify(trigger.attachmentAction, null, 2)); //trigger.attachment needs to be converted to a JSON String, then a JSON object which includes all the data from the card
  console.log(data);
  let dice_type = data.inputs.dice_type; //pull the dice type from the input field dice_type
  let dice_number = data.inputs.dice_number; //pull the dice number from the input field dice_number
  apiaddress = dice_number + dice_type; 
  console.log(apiaddress);

  if (dice_number > 0) {//check to make sure input is valid
    apiaddress = 'http://roll.diceapi.com/json/' + apiaddress; //specific address for type and number of dice
    http.get(apiaddress, (resp) => {  //GET request to apiaddress
      let roll = '';
      //add response to roll string
      resp.on('data', (chunk) => {
        roll += chunk; // add chunk to existing roll, save to roll
      });

      resp.on('end', () => { //once all data is done
        currentroll = (JSON.parse(roll)); //parse roll from JSON string into object
        for (let i of currentroll.dice) { //loop through all the dice array in currentroll.dice
          console.log("user rolled a value of" + i.value);
          bot.say('You rolled a ' + i.value); //send to user
        }
      });

    }).on("error", (err) => { //on error
      console.log("error: " + err.message); //send error, with message
    }); 
  
  }

  else {
    bot.say('Please choose a number greater than zero!');
  }
});




/*-----------------------------------------------------------------------------------------
------------------------------------ END API DEMO -----------------------------------------
-----------------------------------------------------------------------------------------*/


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
    '1. **dice**   (Card + API call demo) \n' +
    '2. **help** (what you are reading now)');
}

/*framework.hears("roll dice", function(bot) {
  console.log("dice roll initiated!");
  responded = true;

  //Setup API call
  const http = require('http');
  http.get('http://roll.diceapi.com/json/d6', (resp) => {
    let data = '';
    

    //add response to roll
    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      let roll = (JSON.parse(data));
      console.log("User rolled a value of " + (roll.dice)[0].value);
      bot.say('You rolled a ' + (roll.dice)[0].value +'!');
      console.log("message sent")
    });

  }).on("error", (err) => {
    console.log("error: " + err.message);
  });

});*/

// Buttons & Cards data

let card_dice_JSON = 
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
                          "text": "Kelvin Cui's",
                          "weight": "Lighter",
                          "color": "Accent"
                      },
                      {
                          "type": "TextBlock",
                          "weight": "Bolder",
                          "text": "Dice Rolling Card Demo",
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
                  "text": "What kind of dice do you want to roll?"
              },
              {
                  "type": "Input.ChoiceSet",
                  "placeholder": "Choose the type of dice...",
                  "choices": [
                      {
                          "title": "4 Sided",
                          "value": "d4"
                      },
                      {
                          "title": "6 Sided",
                          "value": "d6"
                      },
                      {
                          "title": "20 Sided",
                          "value": "d20"
                      }
                  ],
                  "spacing": "Medium",
                  "id": "dice_type"
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "TextBlock",
                  "text": "How many dice do you want to roll?"
              },
              {
                  "type": "Input.Number",
                  "placeholder": "1",
                  "min": 1,
                  "max": 10,
                  "id": "dice_number"
              }
          ]
      },
      {
          "type": "ActionSet",
          "actions": [
              {
                  "type": "Action.Submit",
                  "title": "Roll!",
                  "data": {
                      "subscribe": true
                  }
              }
          ],
          "horizontalAlignment": "Center",
          "spacing": "None",
          "id": "dice_roll"
      }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.2"
};

/*let cardJSON =
{

    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
        {
            "type": "ColumnSet",
            "columns": [
                {
                    "type": "Column",
                    "width": 2,
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": "Card Sample",
                            "weight": "Bolder",
                            "size": "Medium"
                        },
                        {
                            "type": "TextBlock",
                            "text": "What is your name?",
                            "wrap": true
                        },
                        {
                            "type": "Input.Text",
                            "id": "myName",
                            "placeholder": "John Doe"
                        }
                    ]
                }
            ]
        }
    ],
    "actions": [
        {
            "type": "Action.Submit",
            "title": "Submit"
        }
    ]
 };*/

/* On mention with card example
ex User enters @botname 'card me' phrase, the bot will produce a personalized card - https://developer.webex.com/docs/api/guides/cards
*/
/*framework.hears('card me', function (bot, trigger) {
  console.log("someone asked for a card");
  responded = true;
  let avatar = trigger.person.avatar;

  cardJSON.body[0].columns[0].items[0].url = (avatar) ? avatar : `${config.webhookUrl}/missing-avatar.jpg`;
  cardJSON.body[0].columns[0].items[1].text = trigger.person.displayName;
  cardJSON.body[0].columns[0].items[2].text = trigger.person.emails[0];
  bot.sendCard(cardJSON, 'This is customizable fallback text for clients that do not support buttons & cards');
});

/* On mention reply example
ex User enters @botname 'reply' phrase, the bot will post a threaded reply

framework.hears('reply', function (bot, trigger) {
  console.log("someone asked for a reply.  We will give them two.");
  responded = true;
  bot.reply(trigger.message, 
    'This is threaded reply sent using the `bot.reply()` method.',
    'markdown');
  var msg_attach = {
    text: "This is also threaded reply with an attachment sent via bot.reply(): ",
    file: 'https://media2.giphy.com/media/dTJd5ygpxkzWo/giphy-downsized-medium.gif'
  };
  bot.reply(trigger.message, msg_attach);
});

/* On mention with unexpected bot command
   Its a good practice is to gracefully handle unexpected input
*/



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
