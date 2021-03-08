//Made by Zachary Mitchell during 1 day of 2020 and the rest of 2021 probably XP
//This file is the middle man for controlling states; things like the @mention listener lives here along with the list of active states.
//Cleanups every 5 minutes also happen as well.
const stateManager = require('./stateManager'),
    mentionTools = require('../corePieces/mentionTools'),
    fileCore = require('./fileCore'), //Statefull commands get imported here!
    //Every state regardless of guild
    activeStates = {},
    guildList = {},
    commonVars = {
        cantJoin:'Sorry, the command blocked you from joining. Reason: ',
        cantLeave:'Sorry, the command blocked you from leaving. Reason: ',
        stateNotFound: ["Sorry, I couldn't find anything for you to join :/","\nTry again with different information or start something new!"],
        client:undefined,
        symbol:undefined, //The symbol for the target command
        cooldownGroup:undefined //Imported from lemon.js in order to prevent command abuse. Stateful commands have allot more moving parts so this is important :P
    },
    coolInf = require('../corePieces/cooldownInterface');


//I need to move this command somewhere else, but it's here because I'm panniking yay
//grabs the guildId of the message being used. If none exists, then use "dm" (direct message)
var guildIdOfMessage = msg=>msg.channel.guild?msg.guild.id : 'dm';

//Wow I literally have no comments in this function... LET'S FIX THAT
//What it says on the tin, find a state with all information provided. If a password is provided, it gives us more context and is more clear than just a username
function findState(m,pass,cmd,userId){
    
    if(!userId) userId = m.author.id;

    //Search through the guild object and try to find the state based on userId
    var targetUser = findUser(m,userId);
    if(!pass && targetUser){
        if(targetUser.activeCommands[cmd]){
            //A user and command together can help bring a specific context.
            var ctx = targetUser.activeCommands[cmd].currContext;
            if(!ctx)
                return { notFoundReason: 'This user isn\'t running '+commonVars.symbol+cmd+'!' }
            else return { state:ctx, foundByPass:false };
        }
        else if(targetUser.currContext)
            return { state:targetUser.currContext, foundByPass:false };
        else return { notFoundReason: 'This user hasn\'t started an activity :/' };
    }
    else if(pass){
        //Very direct method of finding the state. If we have a target user, check that first, but otherwise go into this file's activeStates object.
        if(targetUser && cmd){
            var reason = 'User mentioned isn\'t hosting the specified passcode for '+commonVars.symbol+cmd+'!';
            if(!targetUser.activeCommands[cmd])
                return {notFoundReason:reason}
            var targetState = targetUser.activeCommands[cmd].states[pass];
            if(!targetState)
                return { notFoundReason:reason}
            else return { state:targetState, foundByPass:true }
        }
        //Not sure when this would actually hit since passcodes are checked before hitting this function. It's here anyway.
        else if(!activeStates[pass])
            return { notFoundReason: 'Invalid code!'}
        else return { state: activeStates[pass], foundByPass:true };
    }
    else return { notFoundReason: 'Session could not be found with the given context' }
}

//hot garbage function for finding users in a guild
function findUser(m,userId){
    var guild = guildList[guildIdOfMessage(m)];

    if(!guild || !guild.users[userId]) return
    //Two possible outcomes here, if no command was specified, try to join the latest activity, otherwise fail
    else return guild.users[userId];
}

//Because lemon.js is forced to ignite any new command, we don't need to ever create a cooldown group in this file! If you are importing this file to a different bot however, please keep this in mind.
//m is a discord message.
var cooldownExists = m=>commonVars.cooldownGroup && commonVars.cooldownGroup[guildIdOfMessage(m)];

/*Do stuff before interacting with the command; AKA: preStateExecution
If for example the target state is expired, we purge it out of existence*/
function interactWithCommand(state,m,args){
    if(state.expires != -1 && m.createdTimestamp - (state.expires * 1000) > state.timestamp){
        //End the sesion and clean up:
        state.onEnd(state.stateData,m,'sessionExpired');
        purgeState(state);
        return;
    }

    //A "checkOnly" argument was added to cooldown functionality just to see the status of the command cooldown without affecting the numbers themselves
    //As a result it will be run twice, once to view the status here, and another next time in order to update usage.
    if(cooldownExists(m)){
        var cooldownInspect = commonVars.cooldownGroup[guildIdOfMessage(m)].updateUsage(state.cmd,m,true);
        if(cooldownInspect[0] || cooldownInspect[0] === null){
            coolInf.cooldownStrikeErr(cooldownInspect,m);
            return; //A true boolean over here means we cannot continue running the command.
        }
    }

    //Ignite the command!
    var targetUser = state.members[m.author.id];
    state.timestamp = m.createdTimestamp;
    var returnObj = state.onFind(state.stateData,targetUser,m,args);

    //Cooldown! U ain't escaping it m8 >:)
    if(cooldownExists(m) && returnObj && returnObj.cooldownHit )
        commonVars.cooldownGroup[guildIdOfMessage(m)].updateUsage(state.cmd,m);

    //If the command wants to do anything else (specifically purging itself for now), do the thing
    if(returnObj && returnObj.endAll)
        purgeState(state);

}

/*This is designed for any stateful command, plus the @mention listener and /join.
The purpose of this is to find all the information needed for findState() but all information is gathered through the message object and the items within the string.
Returns an array, the first being the state, and the second: filtered arguments without mentions*/
function findStateByContextClues(m,cmd){
    //split up the args and take out @mentions for a clean parse
    var args = filterCommandAndCreate(mentionTools.clearMentions(m.content).split(' '));

    //This is somewhat of a monolithic function, so we first need to figure out what the user is trying to say based on context clues

    //Find the first item in the string in order to test for a passcode.
    var potentialPass = args[0],
    //Also look for mentions, specifically the ID's of every user besides lemonbot. The first user is our target here in order to join a state
        firstMention = [...m.mentions.users.keys()].filter(e=>e == commonVars.client.user.id?undefined:e)[0];

    //We should at least check if the first parameter is a valid passcode. If not, make it undefined so as not to confuse findState()
    if(!activeStates[potentialPass])
        potentialPass = undefined;
    
    //Obtain state
    var resultState = findState(m,potentialPass,cmd,firstMention);

    //Remove the beginning where the password was found
    if(resultState && resultState.state && resultState.foundByPass)
        args = args.slice(1);

    return [resultState.state,args,resultState.notFoundReason];
}

//Joins a state. If it's not possible to join, the command from that state will tell the reason behind it.
function joinState(m,state,args){
    //Hello dear stranger! Let's see if you can come in...
    if(state.members[m.author.id]){
        m.reply(commonVars.cantJoin+m.author.username+'#'+m.author.discriminator+' already joined.');
        return;
    }

    var joinCheck = state.joinCheck(state.stateData,m);
    if(joinCheck.joinable){
        guildList[guildIdOfMessage(m)].joinSession(m.author.id,state);
        interactWithCommand(state,m,args);
    }
    else m.reply(commonVars.cantJoin+joinCheck.reason);
}

//Copied-pasted joinState to make an opposite function. leaveState is also capable of dismantling a state and removing it across everyone's radar.
function leaveState(m,state){
    //Hello dear stranger! Let's see if you can come in...
    if(!state.members[m.author.id]){
        m.reply(commonVars.cantLeave+"You aren't in the session!");
        return;
    }

    var leaveCheck = state.leaveCheck(state.stateData,m);
    //Delete state here doesn't mean it's remove for everyone, just for the individual who called it.
    //To end it for everyone, the leaveCheck value above must have "endAll" == true.
    if(leaveCheck.leavable && !leaveCheck.endAll)
        state.members[m.author.id].deleteState(state);
    else if(leaveCheck.endAll){
        purgeState(state);
    }
    else m.reply(commonVars.cantLeave+leaveCheck.reason);
}

//Create a black hole and remove everything about this state object
function purgeState(targetState){
    //As far as I know these steps can be done in any order

    //Remove from active states
    delete activeStates[targetState.pass];
    //Every member needs this de-referenced and a new context in it's place
    for(var i in targetState.members)
        targetState.members[i].deleteState(targetState);
}

/* Does the following:
based on the message, find the state based on specific state details
If the member has already joined the state, switch contexts and perform the next state action
Otherwise, join the state
This is here because more than one function does the same thing.*/
function handleStateContext(m,cmd){
    var [targetState, args, notFoundReason] = findStateByContextClues(m,cmd);
    if(notFoundReason) return notFoundReason;

    //We have a state now! It's time to understand what we wanna do with this
    if(targetState.members[m.author.id]){
        //Switch context
        var targetUser = targetState.members[m.author.id];
        stateManager.setStateContext(targetState,targetUser,targetState);
        //onFind will allow us to record what's happening to the base of whatever command we're sending this to
        interactWithCommand(targetState,m,args);
    }
    else joinState(m,targetState,args);

    return true;
}

//This will probably be a big fella once it's done. It's purpose is to filter out context in order to figure out what to do with user context
var mentionListener = m=>{
    if(m.author.id == commonVars.client.user.id || !m.mentions.users.get(commonVars.client.user.id) || !m.content.length || m.content.indexOf(commonVars.symbol) === 0) return;
    //Somebody mentioned lemonbot, Let's continue
    //Array Destructuring: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
    var errStr = handleStateContext(m);
    if(typeof errStr == 'string') m.reply(commonVars.stateNotFound[0]+(errStr.length?'\nReason: '+errStr:'')+commonVars.stateNotFound[1]);
}

/*Wow this was ambiguous :P
Filter out any known commands from the arguments, while also removing the word "create"
Ok should be less ambiguous bye*/
function filterCommandAndCreate(args){
    var sliceIndex = 0;
    var argSize = args.length >=2 ? 2 : 1;
    for(var i = 0; i < argSize; i++){
        if((args[i].indexOf(commonVars.symbol) == 0 && commands[args[i].slice(commonVars.symbol.length)]) || 
            args[i] == 'create')
            sliceIndex++;
    }
    return args.slice(sliceIndex);
}

//Creates a fresh state. If the guild hasn't done anything since the last lemonbot execution, then reload the base guild object
/*configObj consists of various items that help create said session. They do not touch this interface, but intstead have items that
stateManager and stateCommandInterface can use to trigger things without the original item needing to do extra work.

cmd: Name of the command that will run
host (m.author.id): User ID, if this id isn't in the guild object yet, it's created within stateManager.
timestamp (m.createdTimeStamp): the time the message was sent
expires: time in seconds before this command is done
onFind: whenever the command is triggered, this is the function that is run to determine what to do next on the command side (your code)
joinCheck: function that says weather or not a member can join the state. Here to provide dynamics. The only thing that is automaticallly rejected is if a member already joined a state.*/
function createState(m,configObj){
    //First off; create a passcode, if somehow out of the billions of combinations this password is already used, make another one.
    var newPass = stateManager.passcode();
    var attempts = 0;

    //Even though it's extremely unlikely; this is here for safety so lemonbot doesn't hang
    while(activeStates[newPass]){
        newPass = stateManager.passcode();
        if(attempts > 100){
            m.reply(`Ok so get this, somehow the stars aligned and despite making a new passcode 100 times, a new session couldn't be made!
            Since the odds are about one in 1.5 billion, there's a good chance this is a bug, 
            or the stars really did align; either way please let the developer know by making an issue at https://github.com/zachMitchell/lemonbot and he will be surely left in awe.`);
            break;
        }
        else attempts++;
    }
    if(attempts > 100) return;

    //Thankfully the stars didn't align, let's continue
    /*Creating a new pass base is not being done within stateManager because I want this to be an open method of interpreting sessions.
    In my configuration the goal was to have a mix of either accessing sessions only in one guild, or making it open to transferring sessions to multiple guilds.
    Somebody else could easily make this so it's even restricted to certain users; For example, people with discord nitro and non-nitro.
    In my case I'm not using that logic on this layer, so I've left it open to a mixed scope to confirm the logic on the app layer and not the stateful layer.*/
    var currGuild = guildList[guildIdOfMessage(m)];
    if(!currGuild)
        currGuild = guildList[guildIdOfMessage(m)] = new stateManager.passBase();
    var state = currGuild.createSession(m.author.id,configObj.cmd,newPass,m.createdTimestamp,configObj.expires);

    //Listener check - go through every possible listener and add it to the state accordingly:
    for(var i of ['onFind','joinCheck','leaveCheck','onEnd'])
        if(configObj[i]) state[i] = configObj[i];

    //Assign the state to the active states object
    activeStates[newPass] = state;


    //Create is a reserved keyword, when used, the person making the command doesn't need this, so it's removed
    var argsArray = filterCommandAndCreate(m.content.split(' '));

    //The host has created a state, time for them to join!
    interactWithCommand(state,m,argsArray);
}

//This will be filled up based on a separate file in order to keep things clean. The only two vital are /join and /leave which will be defined here
var commands = {
    /*Primary purpose is to attempt a join regardless if the member joined already.
    It's a design choice to give assesrtion to the user they have joined a state.
    "/join" is filtered out in findStateByContextClues*/
    'join':m=>{
        var [targetState, args, notFoundReason] = findStateByContextClues(m);
        if(typeof notFoundReason == 'string') m.reply(commonVars.stateNotFound[0]+(notFoundReason.length?'\nReason: ' + notFoundReason:'' )+commonVars.stateNotFound[1]);
        else joinState(m,targetState,args);
    },
    //Like the respective function, it's copy paste of the join command :P
    'leave':m=>{
        var [targetState, args, notFoundReason] = findStateByContextClues(m);
        if(typeof notFoundReason == 'string') m.reply("Hmm... I couldn't find a session for you;\nReason: "+notFoundReason+"\nTry to describe one that you are already in!");
        else leaveState(m,targetState,args);
    }
},
//These will display based on help descriptions of commands from fileCore. Descriptions from /join and /leave will be present too.
helpDescriptions = [
    ['join','hop into an existing activity with your friends!'],
    ['leave',"exit an activity you're in the middle of"]
]

//Append custom commands to this list.
for(var i in fileCore)
    helpDescriptions.push([i,fileCore[i].helpText])

/*Initial setup for the commands object. The dependency for this part is fileCore.js in order to create a consistent foundation.
For backwards compatibility with commands.js, everything will be addressed as if each item were their own command. The main difference 
is that said commands will all be the same function simply going in and setting up a session

Like /join, the command is filtered out so it's not an argument*/
function commandIgnite(m,args,actualCommand){
    //This will assume since it was launched from the commands object that actualCommand is a thing.
    var filteredArgs = args.slice(1); //removes the beginning the command

    //Create a new state if: 1.the word create is present at the beginning, or 2. we fail to find a state based on other context in the message.
    if(filteredArgs[0] == 'create' || typeof handleStateContext(m,actualCommand) == 'string')
        createState(m,fileCore[actualCommand]);
}

//Time to fill up the commands object! It will be commandIgnite for everything, because the command is distinguished via the actualCommand argument
for(var i in fileCore)
    commands[i] = commandIgnite;

//This interval will do a constant sweep and check if items are expiring or not.
//Not sure if it's the best idea, but it's mostly to prevent holding thousands of timeouts and resetting them.
setInterval(()=>{
    var sweepTimestamp = new Date().valueOf();
    for( var i in activeStates ){
        if(sweepTimestamp - (activeStates[i].expires*1000) > activeStates[i].timestamp ){
            activeStates[i].onEnd(activeStates[i].stateData,undefined,'sessionExpired');
            purgeState(activeStates[i]);
        }
    }
}, 5*60*1000);

module.exports = {
    setClient:e=>{
        commonVars.client = e;
        e.on('message',mentionListener);
    },
    setCommandSymbol:e=>commonVars.symbol = e,
    setCooldownGroup:e=>commonVars.cooldownGroup = e,
    commands:commands,
    helpDescriptions:helpDescriptions,
    disabledDMCommands:['join','leave']
}