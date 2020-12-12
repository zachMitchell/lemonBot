//Made by Zachary Mitchell in 2020!
//Lemon Bot is a basic discord bot we can use on our server: lemonwithease. He will grow over time, but he should potentially have all sorts of toys to play with :D

//His backbone will be discord.js:
const Discord = require('discord.js');
const client = new Discord.Client();
const emoji = require('./corePieces/emoji');
var rndAction = require('./lemonModules/rndAction');

//Reactions are the way lemonbot responds back whether that be an emoji or a message to users.
var reactions = {
    hi: [
        'Howdy!',
        'hiIneedattention',
        'sup n00b',
        'Hi!',
        'Hello!',
        'salutations and the most epic of greetings to you as well.'
    ],
    pog: [
        'cool',
        'mecharm',
        'moneyface',
        'starstruck'
    ]
}

var responses = {
    'hi lemonbot':m=>{
        rndAction(0,e=>m.reply(e),reactions.hi);
        // console.log(m);
    },
    'pog':m=>rndAction(5,e=>m.react(emoji[e]),reactions.pog)
}

var commandConfig = require('./corePieces/commands.js');

var commands = commandConfig.commands,
    cooldown = require('./corePieces/cooldown.js');

//This holds every group the bot has touched while it's been turned on. Used to cooldown commands.
const cooldownGroup = new cooldown.guildGroup();

var cooldownDefaults = {
    'textWarpersGroup':{
        isGroup:true,
        coolTime:15,
        uses:3,
        commands:['camel','creepy','e','back']
    },
    //Clever name am I right? :D
    'once5Secs':{
        isGroup:true,
        coolTime:5,
        uses:1,
        commands:['age','dumbot','wisdom']
    },
    'math': { coolTime:25, uses: 5},
    'rnd':{ coolTime:3, uses:2 },
    'rylan':{ coolTime:30, uses:2 },
    'shuf':{ coolTime:15, uses:1 },
    'help':{ coolTime:180, uses:1 },
}

/*Private configuration - you can use lemonbot as a base for some of your own projects.
Just edit this file and your own things will be included in the bot. This is convenient for something like heroku deployment
where you can just pull in the lastest changes from the community without much hastle*/
var privateConfig = require('./privateConfig');

//Merge commands and the help strings
commandConfig.helpDescriptions.push(...privateConfig.helpDescriptions);
commandConfig.helpDescriptions.sort((e,f)=>e[0] > f[0] ? 1:-1);

for(var i in privateConfig.commands)
    commands[i] = privateConfig.commands[i];

//Responses are basically the same dance:
for(var i in privateConfig.responses)
    responses[i] = privateConfig.responses[i];

//The cooldown config is a little different as every value will deep-dive in order to modify existing configurations.
for(var i in privateConfig.cooldowns){
    if(!cooldownDefaults[i])
        cooldownDefaults[i] = privateConfig.cooldowns[i]
    else{
        //go through all keys from the private config and apply them to the defaults
        for(var j in privateConfig.cooldowns[i])
            cooldownDefaults[i][j] = privateConfig.cooldowns[i][j];
    }
}
//End Private config

client.on('ready',()=>console.log('Im in! ',client.user.tag));

client.on('message',msg=>{
    var gotCommand = false;
    //Commands should be easier to run though since we're using associative arrays to determine if the command is even there
    if('/\\'.indexOf(msg.content[0]) > -1){
        //Check to see what command we got if at all:
        var args = msg.content.split(' ');
        var actualCommand = args[0].substring(1);

        if(commands[actualCommand] && !msg.author.bot){
            //Setup command cooldown for this guild. If there's no config we have defaults
            var guild = msg.channel.guild;
            if(guild && !cooldownGroup[guild.id])
                cooldownGroup.createConfig(msg.channel.guild.id,cooldownDefaults);
            
            //This function tracks the command's use. If we can't use it, don't run the command.
            var cooldownResults = cooldownGroup[msg.channel.guild.id].updateUsage(actualCommand,msg);
            //Run the comand
            if(!guild || !cooldownResults || (cooldownResults && !cooldownResults[0])){
                // console.log(msg);
                var commandResults = commands[actualCommand](msg,args);

                //Change the cooldown time of said command for that user
                if(typeof commandResults == 'object' && commandResults.cooldownAppend){
                    cooldownGroup[msg.channel.guild.id].appendSeconds(actualCommand, msg, commandResults.cooldownAppend);
                }
            }

            //If the command was disabled, show this message
            else if(cooldownResults[0] === null && !cooldownResults[1])
                msg.reply('aww, looks like this command is turned off :/');
            //If the user hasn't tried typing the command twice, show this message if cooldown is present
            else if(!cooldownResults[1])
                msg.reply('*huff*, one second; I need a breather. Give me '+cooldownResults[2]+' more seconds!');
            //If the user tried again, don't respond back.
            
            // console.log(cooldownGroup);
        }
    }
    else if(!gotCommand && !msg.author.bot){
        var content = msg.content.toLowerCase();
        //Recurse through pre-determined chat responses
        for(var i in responses){
            if(content.indexOf(i) > -1){
                responses[i](msg);
                break;
            }
        }
    }
});

client.login(privateConfig.token);