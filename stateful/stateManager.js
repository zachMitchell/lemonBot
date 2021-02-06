//Made by Zachary Mitchell in 2020/2021!
//States allow commands to remember things! They are capable of having expirations, so memory doesn't get clogged up with random things people stopped doing.

function passcode(length = 6, characterRanges = [[97,122],[48,57]]){
    var res = '';
    var differences = [];
    for(var i of characterRanges)
        differences.push(i[1] - i[0]);
    
    //Create the string:
    for(var i = 0;i < length; i++){
        let rndIndex = Math.floor(Math.random()*differences.length); 
        res+=String.fromCharCode(characterRanges[rndIndex][0] + Math.floor(Math.random()*differences[rndIndex]));
    }

    return res;
}

function user(userId = 0){
    this.userId = userId;
    this.currContext;
    this.activeCommands = {};
    this.passcodes = {}; //find a state by a passcode
}

user.prototype.switchToLastContext = function(){
    //Global context
    var keys = Object.keys(this.passcodes);
    this.currContext = this.passcodes[keys[keys.length-1]]; //Can be undefined on purpose.

    //Search for the state within the activeCommands
    if(this.currContext)
        this.activeCommands[this.currContext.cmd].currContext = this.currContext;
}

user.prototype.deleteState = function(targetState){
    if(this.currContext == targetState)
        delete this.currContext;
    
    //Grab the command context and remove it there as well
    if(this.activeCommands[targetState.cmd].currContext == targetState)
        delete this.activeCommands[targetState.cmd].currContext;
    
    delete this.activeCommands[targetState.cmd].states[targetState.pass];
    delete this.passcodes[targetState.pass];
    delete targetState.members[this.userId];
    
    //If this user is the host... well rip
    if(targetState.host == this)
        delete targetState.host;

    //Reset context
    this.switchToLastContext();
}

function commandCtx(){
    this.currContext;
    this.states = {};
}

//States are basically clean slates to do whatever with. The only rule behind it is to keep the source of other cotexts readily available for a state sweep
//These assume the origin is an object with a passcode
function state(cmd = '', pass = '', members = [], timestamp = 0, expires = -1){
    this.cmd = cmd;
    this.pass = pass;
    this.members = {};
    this.host = members[0];
    this.timestamp = timestamp; //Updated everytime an action happens
    this.expires = expires; //Time in seconds. If -1 it's unlimited
    //Creates a dedicated space to hold outside variables and not step on variable names here
    this.stateData = { rootInfo: this };
    //Function that can be used to conduct a states usage. In other words, it's a way to expose the series of functions and execute things accordingly
    this.onFind = (stateData,member,msg,args)=>{};
    this.onEnd = (stateData,m)=>{};
    this.joinCheck = (stateData,msg)=>true;
    this.leaveCheck = (stateData,msg)=>true;

    for(var i of members)
        this.members[i.userId] = i;
}

//An object that holds a set of passcodes. This could be sorted out by category, guild or both.
//Property-wise it's merly a vessel. Functionally it's the conductor for things like searching for states, creating and removing them.
function passBase(){
    this.users = {};
}

//New commands are prioritized front and center. As such every possible way to find the state is updated to be main priority
var setNewStateContext = (cmd,usr,state)=>cmd.states[state.pass] = usr.passcodes[state.pass] = cmd.currContext = usr.currContext = state;
//Existing commands don't need to be re-defined, so this varient just sets context.
var setStateContext = (cmd,usr,state)=> cmd.currContext = usr.currContext = state;

passBase.prototype.createSession = function(userId = 0,cmd='',pass = passcode(),timestamp = 0,expires = -1){
    var targetUser = this.users[userId] || (this.users[userId] = new user(userId));
    var targetCommand = targetUser.activeCommands[cmd] || (targetUser.activeCommands[cmd] = new commandCtx());
    var targetState = new state(cmd,pass,[targetUser],timestamp,expires);

    //All context goes to this new state. Next time there's an @mention, this will be priority one.
    setNewStateContext(targetCommand,targetUser,targetState,pass);
    return targetState;
}


passBase.prototype.joinSession = function(userId=0,state){
    var targetUser = this.users[userId] || (this.users[userId] = new user(userId));
    var targetCommand = targetUser.activeCommands[state.cmd] || (targetUser.activeCommands[state.cmd] = new commandCtx());
    setNewStateContext(targetCommand,targetUser,state,state.pass);
    //Add user to state
    state.members[userId] = targetUser;

    return state;
}

//I intend on having a separate object full of passwords to obtain states. If for some reason that fails or I get lazy, here is another method to search for things
passBase.prototype.joinSessionByClues = function(hostId=0,joiningId=0,pass=''){
    var hostUser = this.users[hostId],state;
    //Confirm host user is there, as well as the session
    if(!hostUser || !(state = hostUser.passcodes[pass])) return;

    //from here we add this user to the state
    return this.joinSession(joiningId,state);
}

if(typeof module == 'object' && module.exports)
    module.exports = {
        passBase:passBase,
        passcode:passcode,
        setStateContext:setStateContext,
    }