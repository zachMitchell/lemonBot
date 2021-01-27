/*This is an example of what a stateful command looks like. It's all over the place, but 
That's because these commands can have items happen at anytime. There are three major functions that may be used:

1. joinCheck - Runs for everybody who wants to come into a session, besides the host. It's possible you want an individual to meet a certain criterea
before entering, so this is a way you can do that. Leaving this out of your command will allow anyone to join.
2. leaveCheck - essentially the same thing as joinCheck but the opposite. One thing it's capable of is to end a state/session all together via { endAll:true }
3. onFind - the heartbeat of your statefull program. Every time an interaction is made with the command, this is where you process information to determine what to do next.
I would personally recommend splitting up tasks of onFind into smaller items and treat onFind as a conductor instead of a one-man band. In the example below it's like that to
remove noise of what's required in a statefull command, but organize things anyway you like... this is part of a programming language after all!
*/

function joinCheck(stateData){
    if(stateData.a == 10)
        return { joinable:false, reason:'youbadlol' };
    else return { joinable:true };
}

function leaveCheck(stateData,m){
    if(stateData.b == 15)
        return {leavable:false, reason:"YOU'RE STUCK HERE FOREVER NOOB - MUAHAHAHAHA."}
    
    else if(stateData.b == 20){
        m.channel.send('End all has been triggered, therefore everybody will disbanded from the session');
        return { leavable: true, endAll: true }
    }
    else{
        m.reply(' is leaving the session...');
        return { leavable:true }
    }
}

//In this example I'm just parsing arguments and assigning them to state data.
function onFind(stateData, member, msg, args){
    stateData.lm = msg;
    switch(args[0]){
        case 'leave':
            //ignore everything else and leave the state. Normally it would be good to check if host or the last user is leaving so the state can purge
            msg.channel.send(msg.author.username + ' is leaving the state...');
            stateData.rootInfo.members[msg.author.id].deleteState(stateData.rootInfo);
            return;
        case 'purge':
            msg.channel.send('A purge has been activated! This state will now be removed and will be invalid when attempting to join.');
            /*For purging, an endAll boolean is sent instead of manually removing everyone.
            This is so whatever's managing states on the command level can handle the state outside of this command's scope.*/
            return { endAll:true }
    }
    //parse arguments. They will be specific since this is just an example.
    for(var i = 0; i < args.length; i+=2){
        if(args[i] && args[i+1]){
            //Check if a dash is in front of the variable
            if(args[i][0] == '-'){
                stateData.rootInfo[args[i].slice(1)] = args[i+1]
                msg.channel.send('rootObj.'+args[i].slice(1)+' = '+args[i+1]);
            }

            else{
                stateData[args[i]] = args[i+1];
                msg.channel.send('stateData.'+args[i]+' = '+args[i+1]);
            }
        }
        else if(args[i]){
            if(args[i][0] == '-')
                msg.channel.send('result:' + stateData.rootInfo[args[i].slice(1)]);
            else msg.channel.send('result:' + stateData[args[i]]);
        }
    }

}

//Optional function for cleanup after a state is set to be removed.
//The only time this is run in the command interface is when the expire time is overtime. You would need to run this manually for your other items.
function onEnd(stateData,m,reason){
    (m || stateData.lm).reply('Toodaloo! Final keys:'+Object.keys(stateData) + '\n' + reason );
}

/*This is required as well. Unlike files inside lemonModules, this is expecting that it's going inside the
state command interface (SCI if you like accronyms) It includes the functions written above plus some other items:

cmd - this is the command name; the item people will be typing in to execute your command. It is one of the
few ways to also get back into a command state, with a couple of others being @mention-ing lemonbot and using
/join with a passcode or @mention of someone else running the command.

expires - time in seconds for when your state goes away (or stops being usable) due to inactivity.
Note that due to keeping resources efficient, it's not deleted right away. It is removed after:
* somebody types in the command after the time is up
* a cleanup sweep that is run every 10 minutes

In either case, there's another function you could use for handling expired states which should help with showing the end-results of an activity for example*/
module.exports = {
    cmd:'state',
    joinCheck:joinCheck,
    onFind:onFind,
    onEnd:onEnd,
    leaveCheck:leaveCheck,
    expires:20
}