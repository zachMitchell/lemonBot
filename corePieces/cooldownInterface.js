//Made by Zachary Mitchell in 2021!
//An attempt to make general functions not directly related to the command interface separate. I needed these across files so it feels like it would make sense to move them here
const timeTools = require('../lemonModules/timeTools');

//Print a message to the user that the limit for the target command was hit. This includes if the command was disabled
function cooldownStrikeErr(cooldownResults,msg){
    if(cooldownResults[0] === null && !cooldownResults[1])
        msg.reply('aww, looks like this command is turned off :/');
    //If the user hasn't tried typing the command twice, show this message if cooldown is present
    else if(!cooldownResults[1])
        msg.reply('*huff*, one second; I need a breather. Give me '+timeTools.timeToEnglish(timeTools.secondsToTime(cooldownResults[2]))+'!');
    //If the user tried again, don't respond back.
}

module.exports = {
    cooldownStrikeErr:cooldownStrikeErr
}