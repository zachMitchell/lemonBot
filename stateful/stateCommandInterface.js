//Made by Zachary Mitchell during 1 day of 2020 and the rest of 2021 probably XP
//This file is the middle man for controlling states; things like the @mention listener lives here along with the list of active states.
//Cleanups every 5 minutes also happen as well.
const stateManager = require('./stateManager');

//Every state regardless of guild
const activeStates = {},
    guildList = {},
    commonVars = {
        userNotStart:'Sorry, this user hasn\'t started an activity :/'
    }

function findState(m,pass ='',cmd,userId=0 ){
    //Search through the guild object and try to find the state based on userId
    var userResults = findUser(m,userId);
    if(!userResults) return;
    if(!pass){
        if(userResults){
            var targetUser = guild.users[userId];
            if(targetUser.activeCommands[cmd]){
                var keys = Object.keys(targetUser.activeCommands[cmd]);
                if(!keys.length)
                    m.reply('This user isn\'t running /'+cmd+'!')
                else return targetCommand.currContext[keys[keys.length-1]];
            }
            else if(targetUser.currContext)
                return targetUser.currContext;
            else m.reply(commonVars.userNotStart);
        }
    }
    else if(pass && !cmd){
    }
    else if(pass && !activeStates[pass])
        m.reply('Invalid code!')
    else return activeStates[pass];
}

//hot garbage function for finding users in a guild
function findUser(m,userId){
    var guild = guildList[m.channel.guild.id];
    if( !guild )
        m.reply('Nobody in the server has started anything!')
    else if(!guild.users[userId])
        m.reply(commonVars.userNotStart);
    //Two possible outcomes here, if no command was specified, try to join the latest activity, otherwise fail
    return guild.users[userId];
}