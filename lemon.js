//Made by Zachary Mitchell in 2020!
//Lemon Bot is a basic discord bot we can use on our server: lemonwithease. He will grow over time, but he should potentially have all sorts of toys to play with :D

//His backbone will be discord.js:
const Discord = require('discord.js');
const client = new Discord.Client(),
    emoji = require('./corePieces/emoji'),
    rndAction = require('./lemonModules/rndAction'),
    adminCommands = require('./corePieces/adminCommands'),
    timeTools = require('./lemonModules/timeTools'),
    {checkPerms, printPermsErr} = require('./corePieces/adminTools'),
    respondToBots = process.argv.indexOf('-b') > -1, //If this flag is toggled, listen to bots
    sci = require('./stateful/stateCommandInterface');

var commandConfig = require('./corePieces/commands.js');
var commands = commandConfig.commands,
    cooldown = require('./corePieces/cooldown.js');

//Reactions are the way lemonbot responds back whether that be an emoji or a message to users.
var reactions = {
    bigDumb:[
        'brain',
        'woozy',
        'zombieF',
        'zombieM'
    ],
    hi: [
        'Howdy!',
        'hiIneedattention',
        'sup n00b',
        'Hi!',
        'Hello!',
        'salutations and the most epic of greetings to you as well.'
    ],
    jojoReference:[
        'expressionless',
        'eyeroll',
        'lying',
        'flushed'
    ],
    pog: [
        'cool',
        'mecharm',
        'moneyface',
        'starstruck'
    ],
    sadness:[
        'bigCry',
        'confounded',
        'cry',
        'frown',
        'scrunched'
    ]
}

var responses = {
    'hi lemonbot':m=>{
        rndAction(0,e=>m.reply(e),reactions.hi);
        // console.log(m);
    },
    'pog':m=>rndAction(5,e=>m.react(emoji[e]),reactions.pog),
    'jojo reference':m=>{
        var chance = Math.floor(Math.random()*5);
        if(chance === 0){
            var selectedReaction = Math.floor(Math.random()*reactions.jojoReference.length);
            m.react(emoji[reactions.jojoReference[selectedReaction]]);
        }
        else if(chance === 4) m.reply('Yare, yaradaze...');
    },
    'big dumb': m=>rndAction(5,e=>m.react(emoji[e]),reactions.bigDumb),
    'sadness': m=>rndAction(5,e=>m.react(emoji[e]),reactions.sadness)
}

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
    'math': { coolTime:25, uses:5 },
    'mock': { coolTime:15, uses:1 },
    'help':{coolTime:180,uses:1 },
    'rnd':{ coolTime:3, uses:2 },
    'rylan':{ coolTime:30, uses:2 },
    'shuf':{ coolTime:15, uses:1 },
    //This is to discourage spamming the admin error message
    'adminGroup':{
        isGroup:true,
        glue:true,
        coolTime:60*60,
        uses:2,
        commands:['adminhelp','del','move','mute','umute','voisplit','raid']
    }
}

//Administration tools - big ol' serious commands for managing big groups of people
for(var i in adminCommands.commands)
    commands[i] = adminCommands.commands[i];

 //list of every permission:
 var allPermissions = []
 for(var i in adminCommands.permissionsMap)
     for(var j of adminCommands.permissionsMap[i])
         if(allPermissions.indexOf(j) == -1) allPermissions.push(j);

/*Private configuration - you can use lemonbot as a base for some of your own projects.
Just edit this file and your own things will be included in the bot. This is convenient for something like heroku deployment
where you can just pull in the lastest changes from the community without much hastle*/
var privateCore = require('./privateCore');
var privateConfig = privateCore.resultObject;

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

//Finally, take a look at the launching arguments to see if there's a new symbol to execute commands
var commandSymbol = '/';
for(var i of process.argv){
    if(i.indexOf('-d=') == 0){
        var key = i.split('-d=')[1];
        if(privateCore.collectedModules[key])
            commandSymbol = privateCore.collectedModules[key].debugSymbol;
        else console.warn('Could not find the config matching:"'+key+'". Gonna default to the last symbol defined ('+commandSymbol+')');
    }
}
//End Private config

//Statefull commands, these are configured within sateCommandInterface and are not like regular commands. However they are treated as such for backward compatibility
for(var i in sci.commands){
    commands[i] = sci.commands[i];
}

//We need two items - inserting the client for @mentions to work, and and the command symbol
sci.setClient(client);
sci.setCommandSymbol(commandSymbol);

client.on('ready',()=>console.log('Im in! ',client.user.tag));

client.on('message',msg=>{
    var gotCommand = false;
    //Commands should be easier to run though since we're using associative arrays to determine if the command is even there
    if(msg.content.indexOf(commandSymbol) === 0){
        //Check to see what command we got if at all:
        var args = msg.content.split(' ');
        var actualCommand = args[0].substring(commandSymbol.length);

        if(commands[actualCommand] && (!msg.author.bot || respondToBots)){
            //Setup command cooldown for this guild. If there's no config we have defaults
            var guild = msg.channel.guild;
            if(guild && !cooldownGroup[guild.id])
                cooldownGroup.createConfig(msg.channel.guild.id,cooldownDefaults);
            

            /*Admin commands are special - They do not get recorded for cooldown unless somebody doesn't have correct permissions
            If one is found to not have correct permissions, an error will show up instead of launching the command*/
            var runAdminCommand = false,
                adminCommand = false,
                permsResults;

            if(adminCommands.commands[actualCommand]){
                //adminhelp is considered a regular command that checks permissions individually instead of from the get-go, admin checks will skip here in that scenario.
                adminCommand = true;
                if(actualCommand == 'adminhelp'){
                    //Check if any commands are applicable; otherwise trigger the cooldown

                    //Permissions check but with "or" (if any permissions exist return true)
                    if(checkPerms(msg,allPermissions,true,false)[0])
                        runAdminCommand = true;
                    else adminCommand = false;
                    
                }
                else if((permsResults = checkPerms(msg,adminCommands.permissionsMap[actualCommand],false,false))[0])
                    runAdminCommand = true;
            }

            //This function tracks the command's use. If we can't use it, don't run the command.
            var cooldownResults = runAdminCommand? undefined: cooldownGroup[msg.channel.guild.id].updateUsage(actualCommand,msg);
            if(adminCommand && cooldownResults && !cooldownResults[0])
                printPermsErr(msg,permsResults[1]);
            //Run the comand
            if((!guild || !cooldownResults || (cooldownResults && !cooldownResults[0]))){
                /*Admin commands should silently fail because printPermsErr() should have already showed required permissions.
                Otherwise if this is a normal command it should run:*/
                if((adminCommand && runAdminCommand) || !adminCommand){
                    // console.log(msg);
                    //ACTUALLY RUN THE COMMAND... this is really burried in allot of fluff isn't it? >_<
                    var commandResults = commands[actualCommand](msg,args,actualCommand);
    
                    //Change the cooldown time of said command for that user
                    if(typeof commandResults == 'object' && commandResults.cooldownAppend)
                        cooldownGroup[msg.channel.guild.id].appendSeconds(actualCommand, msg, commandResults.cooldownAppend);
                }
            }

            //If the command was disabled, show this message assuming this isn't initially an admin command
            else if(cooldownResults){
                if(cooldownResults[0] === null && !cooldownResults[1])
                    msg.reply('aww, looks like this command is turned off :/');
                //If the user hasn't tried typing the command twice, show this message if cooldown is present
                else if(!cooldownResults[1])
                    msg.reply('*huff*, one second; I need a breather. Give me '+timeTools.timeToEnglish(timeTools.secondsToTime(cooldownResults[2]))+'!');
                //If the user tried again, don't respond back.
            }
            
            // console.log(cooldownGroup);
        }
    }
    else if(!gotCommand && (!msg.author.bot || respondToBots)){
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

client.login(require('./token.js'));