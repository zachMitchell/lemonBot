//Made by Zachary Mitchell in 2020!
//Lemon Bot is a basic discord bot we can use on our server: limewithease. He will grow over time, but he should potentially have all sorts of toys to play with :D

//His backbone will be discord.js:
const Discord = require('discord.js');
const client = new Discord.Client(),
    responses = require('./corePieces/responses'),
    adminCommands = require('./corePieces/adminCommands'),
    {checkPerms, printPermsErr} = require('./corePieces/adminTools'),
    sci = require('./stateful/stateCommandInterface'),
    commandConfig = require('./corePieces/commands.js'),
    cooldown = require('./corePieces/cooldown.js'),
    coolInf = require('./corePieces/cooldownInterface'),
    botActivityMsg = ()=>client.user.setActivity(" ("+commandSymbol+"help) (admins: "+commandSymbol+"adminhelp) - memes & shenaniganz! Deploy me! https://bit.ly/2ZCvh1j"),
    respondToBots = process.argv.indexOf('-b') > -1; //If this flag is toggled, listen to bots
    
const commands = commandConfig.commands,

//This holds every group the bot has touched while it's been turned on. Used to cooldown commands.
const cooldownGroup = new cooldown.guildGroup();
sci.setCooldownGroup(cooldownGroup); //The state command interface needs this to make sure we can restrict these regardless of how commands are called.

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
    'shuf':{ coolTime:90, uses:1 },
    //This is to discourage spamming the admin error message
    'adminGroup':{
        isGroup:true,
        glue:true,
        coolTime:60*60,
        uses:2,
        commands:['adminhelp','del','move','mute','umute','voisplit','raid']
    },
    'gamesGroup':{
        isGroup:true,
        coolTime: 45,
        uses:4,
        commands:['tttoe','hangman','mmind']
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
commandConfig.helpDescriptions.push(...sci.helpDescriptions);
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

//DM's have different permissions, mostly in the vein of disabling things. Very quick & dirty clone
var dmCooldownDefaults = JSON.parse(JSON.stringify(cooldownDefaults));
dmCooldownDefaults.gamesGroup = {isGroup:true,commands:['tttoe','hangman','mmind','adminhelp','del','move','mute','umute','voisplit','raid'], uses: 0, coolTime:-1};
dmCooldownDefaults.adminGroup = dmCooldownDefaults.gamesGroup; //gamesGroup and amdin group are grouped together for the sole purpose of disabling everything

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
for(var i in sci.commands)
    commands[i] = sci.commands[i];

//We need two items - inserting the client for @mentions to work, and and the command symbol
sci.setClient(client);
sci.setCommandSymbol(commandSymbol);

client.on('ready',()=>{
    console.log('Im in! ',client.user.tag);
    botActivityMsg();
    setInterval(botActivityMsg,30*60*1000); //From what I remember, activity messages last for 30 minutes at least for users.
});

//Grab the contents of a message and converts it into a command/argument pattern
var parseCommand = (str, symbol = commandSymbol)=>{
    if(str.indexOf(symbol) !== -0) return [];
    var args = str.split(' ');
    var command = args[0].substring(symbol.length);
    return [command,args];
}

//Beacuse this was all fused within the client.on statement previously, there will most likely be allot of object deconstruction / object returning in all of these
var commandChecks = {
    adminCommand:(m,command,guildId)=>{
        /*Admin commands are special - They do not get recorded for cooldown unless somebody doesn't have correct permissions
        If one is found to not have correct permissions, an error will show up instead of launching the command*/
        var res = {
            runAdminCommand: false,
            adminCommand: false,
            permsResults
        }

        if(guildId!='dm' && res.adminCommands.commands[command]){
            //adminhelp is considered a regular command that checks permissions individually instead of from the get-go, admin checks will skip here in that scenario.
            res.adminCommand = true;
            if(command == 'adminhelp'){
                //Check if any commands are applicable; otherwise trigger the cooldown

                //Permissions check but with "or" (if any permissions exist return true)
                if(checkPerms(m,allPermissions,true,false)[0])
                    res.runAdminCommand = true;
                else res.adminCommand = false;

            }
            else if((res.permsResults = checkPerms(m,adminCommands.permissionsMap[command],false,false))[0])
                res.runAdminCommand = true;
        }

        return res;
    }
}

//Holy cow, this really needs to be cleaned up >_<*
client.on('message',msg=>{
    if(msg.author.bot && !respondToBots) return;

    //Commands should be easier to run though since we're using associative arrays to determine if the command is even there
    //Check to see what command we got if at all:
    var [actualCommand,args] = parseCommand(msg.content);

    //If a command wasn't typed, check if anyone triggered any pre-built responses
    if(!actualCommand){
        var content = msg.content.toLowerCase();
        //Recurse through pre-determined chat responses
        for(var i in responses){
            if(content.indexOf(i) > -1){
                responses[i](msg);
                return;
            }
        }
    }

    if(!commands[actualCommand]) return;
    //If we get past this if statement, we have a command to play with!

    //Setup command cooldown for this guild. If there's no config we have defaults
    var guild = msg.channel.guild;
    var guildId = guild?guild.id:'dm';

    if(!cooldownGroup[guildId])
        cooldownGroup.createConfig(guildId, guildId == 'dm' ? dmCooldownDefaults:cooldownDefaults);

    //Admin command check
    var {adminCommand, runAdminCommand, permsResults} = commandChecks.adminCommand(m,actualCommand,guildId)

    //Ignore cooldown check:
    //This function tracks the command's use. If we can't use it, don't run the command.
    var cooldownResults = (sci.commands[actualCommand] || runAdminCommand) ? undefined: cooldownGroup[guildId].updateUsage(actualCommand,msg);
    if(adminCommand && cooldownResults && !cooldownResults[0])
        printPermsErr(msg,permsResults[1]);

    //check if we can run the command
    var listOfChecks = [
        //Exact comparison for false because it could also be null. (disabled)
        (!cooldownResults || (cooldownResults && cooldownResults[0] === false )),
        /*Admin commands should silently fail because printPermsErr() should have already showed required permissions.
        Otherwise if this is a normal command it should run:*/
        (runAdminCommand) || !adminCommand
    ]

    //As long as we pass this check, the command will run
    if(listOfChecks.indexOf(false) == -1){ 
        //Execute the command//
        var commandResults = commands[actualCommand](msg,args,actualCommand);
    
        //Change the cooldown time of said command for that user
        if(typeof commandResults == 'object' && commandResults.cooldownAppend)
            cooldownGroup[guildId].appendSeconds(actualCommand, msg, commandResults.cooldownAppend);
    }

    //If the command was disabled, show this message assuming this isn't initially an admin command
    else if(!adminCommand && cooldownResults) coolInf.cooldownStrikeErr(cooldownResults,msg);
});

client.login(require('./token.js'));