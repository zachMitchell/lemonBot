//Made by Zachary Mitchell in 2020!
/*Cooldown is a tool that slows down the use of certain commands. 
Not all of them need it, just ones that can get annoying fast*/

/*This object is basically like a directory structure. It's sorted as follows:
uses - an integer that states how many uses can happen in one spurt
guild - object that holds guilds by ID, for each guild there are ID's for every user.
{
    [guildId]
    {
        Commands - a command that was filtered through the update command
        {
            [user]
            {
                usesLeft - integer that stops user if uses are at 0
                timeStamp - timeStamp of the last message using this command.
            }
        }
    }
}*/

//NOTE: this module was built specifically for Discord.js; you can use it in other places, but you'll have to edit things for it to work.

function guild (id=''){
    this.id='';
    this.commands = {};
}

//update the usage of the command. The return statement is true if the command was blocked.
/* Return values:
[
    true/false/null - cooldown was hit, cooldown not hit, command blocked
    bool - true or false depending on if the user tried the command again
    number - time in seconds for the command to open up again. Undefined if cooldown is not active.
]
    the checkOnly parameter will not cause the use-counter to go down, but will instead just inspect what's already there.
 */
guild.prototype.updateUsage = function(cmd,message,checkOnly = false){
    var targetCommand = this.commands[cmd],
        userId = message.author.id,
        timeStamp = message.createdTimestamp,
        commandUser;
    
    if(!targetCommand) return;

    //Look for and assign this variable. If it fails, create something from scratch.
    if(!(commandUser = targetCommand.users[userId]))
        commandUser = targetCommand.users[userId] = new user(userId,targetCommand.uses,timeStamp);

    if(targetCommand.uses === 0 && coolTime == -1){
        var triedAgainOg = commandUser.triedAgain;
        if(!checkOnly) commandUser.triedAgain = true;
        return [null,triedAgainOg];
    }
    
    else if(commandUser.usesLeft > 0){
        if(!checkOnly){
            commandUser.usesLeft--;
            commandUser.timeStamp = timeStamp;
        }
        
        return [false,false];
    }
    else if((timeStamp - commandUser.timeStamp) / 1000 > targetCommand.coolTime ){
        // console.log((timeStamp - commandUser.timeStamp),timeStamp,commandUser.timeStamp);
        if(!checkOnly){
            commandUser.usesLeft = targetCommand.uses -1;
            commandUser.timeStamp = timeStamp;
            commandUser.triedAgain = false;
        }

        return [false,false];
    }

    //We hit the cool down trigger; the next time the user tries this again, the bot has the choice not to respond.
    else{
        var triedAgainOg = commandUser.triedAgain
        commandUser.triedAgain = true;
        return [true,triedAgainOg,Math.ceil(( targetCommand.coolTime - ((timeStamp - commandUser.timeStamp) / 1000) ))];
    }
}

//Adds more time to the clock to potentially reset a command for a user or extend waiting time
guild.prototype.appendSeconds = function(cmd, msg, timeInSeconds = 0){
    var targetCommand,
        commandUser,
        userId = msg.author.id;

    if(!(targetCommand = this.commands[cmd])) return;

    if(!(commandUser = targetCommand.users[userId]))
        commandUser = targetCommand.users[userId] = new user(userId,targetCommand.uses,timeStamp);
    
    commandUser.timeStamp += 1000*timeInSeconds;
}

function command(uses = 1,coolTime = 30){
    this.uses = uses;
    this.coolTime = coolTime;
    this.users = {}; //Use this to store user objects
}

function user(id = '',usesLeft = 1, timeStamp = 0){
    this.id = id;
    this.usesLeft = usesLeft;
    this.timeStamp = timeStamp;
    this.triedAgain = false;
}

function guildGroup(){}

/*Create a config for a specific guild. This can be retrieved from any source you like (most likely a database or a default)

Inside the config should be an object that's json friendly:
'commandName':{
    coolTime:30
    uses:12345
}*/
guildGroup.prototype.createConfig = function(guildId,config){
    this[guildId] = new guild(guildId);
    for(let i in config){
        this[guildId].commands[i] = new command(config[i].uses,config[i].coolTime);

        //Groups are a basic way to bind a single cooldown instance to more commands.
        //If glue is set to true: if one command gets a cooldown, so will the others. Otherwise cooldown times are independent.
        if(config[i].isGroup){
            if(config[i].glue) for(let j of config[i].commands)
                this[guildId].commands[j] = this[guildId].commands[i];

            else for( let j of config[i].commands)
                this[guildId].commands[j] = new command(config[i].uses,config[i].coolTime);
        }
        
    }
}

if(typeof module == 'object' && module.exports) module.exports = {
    guildGroup:guildGroup,
    guild:guild
}