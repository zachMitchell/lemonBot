//Made by Zachary Mitchell in 2020!
//Lemon Bot is a basic discord bot we can use on our server: limewithease. He will grow over time, but he should potentially have all sorts of toys to play with :D

//His backbone will be discord.js:
const Discord = require('discord.js');
const client = new Discord.Client(),
    adminCommands = require('./corePieces/adminCommands'),
    botActivityMsg = ()=>client.user.setActivity(" ("+commandSymbol+"help) (admins: "+commandSymbol+"adminhelp) - memes & shenaniganz! Deploy me! https://bit.ly/2ZCvh1j"),
    commandConfig = require('./corePieces/commands.js'),
    {checkPerms, printPermsErr} = require('./corePieces/adminTools'),
    cooldown = require('./corePieces/cooldown.js'),
    coolInf = require('./corePieces/cooldownInterface'),
    privateCore = require('./privateCore'),
    respondToBots = process.argv.indexOf('-b') > -1, //If this flag is toggled, listen to bots
    responses = require('./corePieces/responses'),
    sci = require('./stateful/stateCommandInterface');

const privateConfig = privateCore.resultObject,
//This holds every group the bot has touched while it's been turned on. Used to cooldown commands.
    cooldownGroup = new cooldown.guildGroup();

//Take a look at the launching arguments to see if there's a new symbol to execute commands
var commandSymbol = '/';
for(var i of process.argv){
    if(i.indexOf('-d=') == 0){
        var key = i.split('-d=')[1];
        if(privateCore.collectedModules[key])
            commandSymbol = privateCore.collectedModules[key].debugSymbol;
        else console.warn('Could not find the config matching:"'+key+'". Gonna default to the last symbol defined ('+commandSymbol+')');
    }
}

//We need two items - inserting the client for @mentions to work, and and the command symbol
sci.setClient(client);
sci.setCommandSymbol(commandSymbol);
sci.setCooldownGroup(cooldownGroup); //The state command interface needs this to make sure we can restrict these regardless of how commands are called.

/*Ok... So this was previously not organized a ton so we're organizing now
There are a few things to configure before lemonbot can do anything: commands, reactions, cooldowns, disabled commands in a DM and help descriptions.
Every object that we wish to implement each with will need specific variable names, for example:
{
    commands:{}
    cooldowns:{}
    disabledDMCommands:[],
    helpDescriptions:[],
    responses:{},
}
The target object does not need all three, but it helps bind related things together. In lemonbot's case we have standard, admin, private and stateful commands

It looks like I had descriptions for each command category before reorganizing, so here they are all at once:
Sandard commands - these functions were the foundation for how all the others were constructed. They don't have special attributes like permissions or being dynamically plugged in, 
    so they make a great resource for learning to make a command.
Administration tools - big ol' serious commands for managing big groups of people.
Statefull commands - these are configured within sateCommandInterface and are not like regular commands. However they are treated as such for backward compatibility.
Private configuration - you can use lemonbot as a base for some of your own projects. Just edit this file [./privateConfig/cfg_*.js] and your own things will
    be included in the bot. This is convenient for something like heroku deployment where you can just pull in the lastest changes from the community without much hastle*/

//Master commands list, aggregated across all files.
const commands = {},
    helpDescriptions = commandConfig.helpDescriptions, //We need a base here so "/help" can see it from commands.js.
    cooldownDefaults = {
        //I'm not sure how to apply this directly to stateful commands yet, or at least group them coherently. They're fine here for now :P
        'gamesGroup':{
            isGroup:true,
            coolTime: 45,
            uses:4,
            commands:['tttoe','hangman','mmind']
        }
    },
    disabledDMCommands = ['tttoe','hangman','mmind'];

for(var config of [adminCommands,commandConfig,privateConfig,sci]){
    //Aggregate all commands:
    if(config.commands) for(var i in config.commands)
        commands[i] = config.commands[i];

    //The helpDescriptions array is based on the one from commands.js so comparing it to itself should prevent duplicate items.
    if(config.helpDescriptions && config.helpDescriptions != helpDescriptions)
        helpDescriptions.push(...config.helpDescriptions);

    if(config.responses) for(var i in privateConfig.responses)
        responses[i] = config.responses[i];

    if(config.disabledDMCommands) disabledDMCommands.push(...config.disabledDMCommands);

    //The cooldown config is a little different as every value will deep-dive in order to modify existing configurations.
    if(config.cooldowns) for(var i in config.cooldowns){
        if(!cooldownDefaults[i])
            cooldownDefaults[i] = config.cooldowns[i]
        else{
            //go through all keys from the private config and apply them to the defaults
            for(var j in cofnig.cooldowns[i])
                cooldownDefaults[i][j] = config.cooldowns[i][j];
        }
    }
}

//Sort the help descriptions
commandConfig.helpDescriptions.sort((e,f)=>e[0] > f[0] ? 1:-1);

//DM's have different permissions, mostly in the vein of disabling things. Very quick & dirty clone
const dmCooldownDefaults = JSON.parse(JSON.stringify(cooldownDefaults));
//Let's go through each cooldown setting and only include each if they are not in the list we created
for(var i in dmCooldownDefaults){
    if(disabledDMCommands.indexOf(i) > -1) delete dmCooldownDefaults[i];
    else if(dmCooldownDefaults[i].isGroup){
        var newCooldownList = [],
            applyList = false;
        for(var j of dmCooldownDefaults[i].commands){
            if(disabledDMCommands.indexOf(j) == -1) newCooldownList.push(j);
            else applyList = true;
        }
        
        //Replace the original list
        if(applyList) dmCooldownDefaults[i].commands = newCooldownList;
    }
}

dmCooldownDefaults.disabledGroup = {isGroup:true, commands:disabledDMCommands, uses: 0, coolTime:-1};

//list of every permission:
var allPermissions = [];
for(var i in adminCommands.permissionsMap)
    for(var j of adminCommands.permissionsMap[i])
        if(allPermissions.indexOf(j) == -1) allPermissions.push(j);
        
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
            permsResults:undefined
        }

        if(guildId!='dm' && adminCommands.commands[command]){
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
    var {adminCommand, runAdminCommand, permsResults} = commandChecks.adminCommand(msg,actualCommand,guildId)

    //Ignore cooldown check:
    //This function tracks the command's use. If we can't use it, don't run the command.
    var cooldownResults;
    //disabled commands are scanned here in case there is an overhead that normally allows it regardless of anything else.
    if((guildId == 'dm' && disabledDMCommands.indexOf(actualCommand) > -1) || !sci.commands[actualCommand] && !runAdminCommand)
        cooldownResults = cooldownGroup[guildId].updateUsage(actualCommand,msg);

    if(adminCommand && cooldownResults && !cooldownResults[0])
        printPermsErr(msg,permsResults[1]);

    //check if we can run the command
    var listOfChecks = [
        //Exact comparison for false because it could also be null. (disabled)
        (!cooldownResults || cooldownResults[0] === false ),
        /*Admin commands should silently fail because printPermsErr() should have already showed required permissions.
        Otherwise if this is a normal command it should run:*/
        (runAdminCommand) || !adminCommand
    ]

    //As long as we pass this check, the command will run
    if(listOfChecks.indexOf(false) == -1){ 
        //Execute the command//
        if(!msg.channel.permissionsFor(msg.guild.members.cache.get(client.user.id)).has('SEND_MESSAGES')){
            console.log('I cannot speak here ('+msg.channel.id+')');
            return;
        } 
        var commandResults = commands[actualCommand](msg,args,actualCommand);

        //Change the cooldown time of said command for that user
        if(typeof commandResults == 'object' && commandResults.cooldownAppend)
            cooldownGroup[guildId].appendSeconds(actualCommand, msg, commandResults.cooldownAppend);
    }

    //Determine inside cooldownStrikeErr if we should show said error. In the specific scenario of abusing admin commands when you can't use them, this is also applied.
    else if((adminCommand && cooldownResults && cooldownResults[0] && !cooldownResults[1]) || 
    (!adminCommand && cooldownResults)) coolInf.cooldownStrikeErr(cooldownResults,msg);
});

client.login(require('./token.js'));