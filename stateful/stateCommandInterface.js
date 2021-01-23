//Made by Zachary Mitchell during 1 day of 2020 and the rest of 2021 probably XP
//This file is the middle man for controlling states; things like the @mention listener lives here along with the list of active states.
//Cleanups every 5 minutes also happen as well.
const stateManager = require('./stateManager'),
    mentionTools = require('../corePieces/mentionTools'),
    fileCore = require('./fileCore');

//Every state regardless of guild
const activeStates = {},
    guildList = {},
    commonVars = {
        userNotStart:'Sorry, this user hasn\'t started an activity :/',
        cantJoin:'Sorry, the command blocked you from joining. Reason: ',
        cantLeave:'Sorry, the command blocked you from leaving. Reason: ',
        client:undefined,
        symbol:undefined //The symbol for the target command
    }

function findState(m,pass,cmd,userId){
    
    if(!userId) userId = m.author.id;

    //Search through the guild object and try to find the state based on userId
    var targetUser = findUser(m,userId);
    if(!pass && targetUser){
        if(targetUser.activeCommands[cmd]){
            var ctx = targetUser.activeCommands[cmd].currContext;
            if(!ctx)
                m.reply('This user isn\'t running '+commonVars.symbol+cmd+'!')
            else return { state:ctx, foundByPass:false };
        }
        else if(targetUser.currContext)
            return { state:targetUser.currContext, foundByPass:false };
        else m.reply(commonVars.userNotStart);
    }
    else if(pass){
        if(targetUser && cmd && targetUser.activeCommands[cmd]){
            var targetState = targetUser.activeCommands[cmd].states[pass];
            if(!targetState)
                m.reply('The user you mentioned isn\'t hosting the specified passcode for '+commonVars.symbol+cmd+'!');
            else return { state:targetState, foundByPass:true }
        }
        else if(!activeStates[pass])
            m.reply('Invalid code!')
        else return { state: activeStates[pass], foundByPass:true };
    }
    else m.reply("Sorry, I couldn't find anything for you to join :/ \nTry again with different information or start something new!");
}

//hot garbage function for finding users in a guild
function findUser(m,userId){
    var guild = guildList[m.channel.guild.id];

    if(!guild || !guild.users[userId]) return
    //Two possible outcomes here, if no command was specified, try to join the latest activity, otherwise fail
    else return guild.users[userId];
}

/*This is designed for any stateful command, plus the @mention listener and /join.
The purpose of this is to find all the information needed for findState() but all information is gathered through the message object and the items within the string.
Returns an array, the first being the state, and the second: filtered arguments without mentions*/
function findStateByContextClues(m,cmd){
    //split up the args and take out @mentions for a clean parse
    var args = filterCommandAndCreate(mentionTools.clearMentions(m.content).split(' '));

    //This is somewhat of a monolithic function, so we first need to figure out what the user is trying to say based on context clues

    //Find the first quote in the string in order to test for a passcode.
    var potentialPass = args[0],
    //Also look for mentions, specifically the ID's of every user besides lemonbot. The first user is our target here in order to join a state
        firstMention = [...m.mentions.users.keys()].filter(e=>e == commonVars.client.user.id?undefined:e)[0];

    //We should at least check if the first parameter is a valid passcode. If not, make it undefined so as not to confuse findState()
    console.log(activeStates,guildList,!activeStates[potentialPass]);
    if(!activeStates[potentialPass])
        potentialPass = undefined;
    
    //Obtain state
    var resultState = findState(m,potentialPass,cmd,firstMention);

    //Remove the beginning where the password was found
    if(resultState && resultState.foundByPass){
        console.log('heyyyyy');
        args = args.slice(1);
    }

    return [resultState?resultState.state:undefined,args];
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
        guildList[m.channel.guild.id].joinSession(m.author.id,state);
        state.onFind(state.stateData,state.members[m.author.id],m,args);
    }
    else m.reply(commonVars.cantJoin+joinCheck.reason);
}

//Copied-pasted joinState to make an opposite function. leaveState is also capable of dismantling a state and removing it across everyone's radar.
function leaveState(m,state,args){
    //Hello dear stranger! Let's see if you can come in...
    if(!state.members[m.author.id]){
        m.reply(commonVars.cantLeave+"You aren't in the session!");
        return;
    }

    var joinCheck = state.leaveCheck(state.stateData,m);
    //Delete state here doesn't mean it's remove for everyone, just for the individual who called it.
    //To end it for everyone, the leaveCheck value above must have "endAll" == true.
    if(joinCheck.leavable && !joinCheck.endAll)
        guildList[m.channel.guild.id].deleteState(state);
    else if(joinCheck.endAll){

    }
    else m.reply(commonVars.cantLeave+joinCheck.reason);
}

function purgeState(){
    
}

/* Does the following:
based on the message, find the state based on specific state details
If the member has already joined the state, switch contexts and perform the next state action
Otherwise, join the state
This is here because more than one function does the same thing.*/
function handleStateContext(m,cmd){
    var [targetState, args] = findStateByContextClues(m,cmd);
    if(!targetState) return false;

    //We have a state now! It's time to understand what we wanna do with this
    if(targetState.members[m.author.id]){
        //Switch context
        var targetUser = targetState.members[m.author.id];
        var targetCommand = targetUser.activeCommands[targetState.cmd];
        stateManager.setStateContext(targetState,targetUser,targetState);
        //onFind will allow us to record what's happening to the base of whatever command we're sending this to
        targetState.onFind(targetState.stateData,targetState.members[m.author.id],m,args);
    }
    else joinState(m,targetState,args);

    return true;
}

//This will probably be a big fella once it's done. It's purpose is to filter out context in order to figure out what to do with user context
var mentionListener = m=>{
    if(!m.mentions.users.get(commonVars.client.user.id) || !m.content.length || m.content.indexOf(commonVars.symbol) === 0) return;
    //Somebody mentioned lemonbot, Let's continue
    //Array Destructuring: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
    handleStateContext(m);
}

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
    var currGuild = guildList[m.guild.id];
    if(!currGuild)
        currGuild = guildList[m.guild.id] = new stateManager.passBase();

    var state = currGuild.createSession(m.author.id,configObj.cmd,newPass,m.createdTimeStamp,configObj.expires);
    state.onFind = configObj.onFind;
    state.joinCheck = configObj.joinCheck;
    //Assign the state to the active states object
    activeStates[newPass] = state;


    //Create is a reserved keyword, when used, the person making the command doesn't need this, so it's removed
    var argsArray = filterCommandAndCreate(m.content.split(' '));

    //The host has created a state, time for them to join!
    state.onFind(state.stateData,state.members[m.author.id],m,argsArray);
}

//This will be filled up based on a separate file in order to keep things clean. The only one vital is /join which will be defined here
var commands = {
    /*Primary purpose is to attempt a join regardless if the member joined already.
    It's a design choice to give assesrtion to the user they have joined a state.
    "/join" is filtered out in findStateByContextClues*/
    'join':m=>{
        var [targetState, args] = findStateByContextClues(m);
        if(targetState) joinState(m,targetState,args);
    }
}

/*Initial setup for the commands object. The dependency for this part is fileCore.js in order to create a consistent foundation.
For backwards compatibility with commands.js, everything will be addressed as if each item were their own command. The main difference 
is that said commands will all be the same function simply going in and setting up a session

Like /join, the command is filtered out so it's not an argument*/
function commandIgnite(m,args,actualCommand){
    //This will assume since it was launched from the commands object that actualCommand is a thing.
    var filteredArgs = args.slice(1); //removes the beginning the command

    //Create a new state if: 1.the word create is present at the beginning, or 2. we fail to find a state based on other context in the message.
    if(filteredArgs[0] == 'create' || !handleStateContext(m,actualCommand))
        createState(m,fileCore[actualCommand]);

    console.log(guildList);
}

//Time to fill up the commands object! It will be commandIgnite for everything, because the command is distinguished via the actualCommand argument
for(var i in fileCore)
    commands[i] = commandIgnite;

module.exports = {
    setClient:e=>{
        commonVars.client = e;
        e.on('message',mentionListener);
    },
    setCommandSymbol:e=>commonVars.symbol = e,
    commands:commands
}