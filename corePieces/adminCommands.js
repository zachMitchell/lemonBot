//Made by Zachary Mitchell in 2020!
//Holy cow admin tools are getting huge; guess it's time for a dedicated file!

var adminTools = require('./adminTools'),
    mentionTools = require('../lemonModules/mentionTools'),
    shuffle = require('../lemonModules/shuffle'),
    timeTools = require('../lemonModules/timeTools'),
    adminHelpDesc = [
        ['del','Remove messages from the channel you called this command from'],
        ['move','Takes messages out of this channel and puts them in another of your choice'],
        ['mute','Mutes entire voice channels (or groups of), if you add a number it will stay muted for that number in minutes'],
        ['umute','Un-mutes an entire channel'],
        ['voisplit','Put everyone randomly (but evenly) into different voice channels'],
        ['raid','Move an entire voice channel into another channel']
    ],
    overUsedVars = {
        channelErr:'Specify the channel of choice within quotation marks (e.g "Rylans png fest")',
        channelNotFound:'*Error: Couldn\'t find any channels!*',
        delMoveBigNum:'Sorry dude, Discord will only let me handle up to 99 messages :/',
        //@~ - Delete, move; @! - command: del, move
        delMoveHelp:`Example usage:
        @~ the last 5 messages:
        \`/@! 5\`
        
        @~ messages from @joeSchmoe within a 10 message radius
        \`/@! 10 @joeSchmoe\`
        
        @~ messages from multiple people within a 50 message radius, as long as they said "pog"
        \`/@! @joe @caleb "pog" 50\``,
        voicePermissions:m=>m.reply("Sorry, In order to do voice channel commands I need the following permissions: Mute Members, Move Members")
    };

//Timers that are ticking when somebody runs the /muteall command. They are here to manually unmute everyone.
var voiceStates = {};

//This really should be in another file somewhere :P
//Anyway, this fella takes in a message, and based on items in quotation marks "channel name" finds all channels with that content.
function findChannelMacro(m){
    var results = [];
    
    //run through the parse dance
    var channelNames = mentionTools.quoteParser(m.content);
    if(!channelNames.length) {
        m.reply(overUsedVars.channelErr);
        return results;
    }
    
    //next, poll through all voice channel names; the first result get's muted
    for(var i of channelNames){
        var item = adminTools.queryChannel(m,i,'voice');
        if(item) results.push(item);
    }

    if(!results.length){
        m.reply(overUsedVars.channelNotFound);
        return results;
    }

    return results;
}

var commands = {
    'adminhelp':m=>{
        if(!adminTools.isAdmin(m)) return;
        
        var resultStr = 'Please note that these commands do not have cooldown... **Use responsibly!**\n';
        for(var i of adminHelpDesc)
            resultStr+='`\n'+'/'+i[0]+'` - '+i[1];
        m.channel.send(resultStr);
    },
    'del':(m,args)=>{
        if(!adminTools.isAdmin(m)) return;

        if(args.length == 1){
            m.reply(overUsedVars.delMoveHelp.replaceAll('@!','del').replaceAll('@~','Delete'));
            return;
        }
        
        var currNum = 1;
        //Scan through all args to find numbers
        for(var i of args)
            if(!isNaN(i)) currNum = i*1;
        
        currNum++;

        if(currNum > 100){
            m.reply(overUsedVars.delMoveBigNum);
            return
        }

        //Go through the messasge to see if there was a specified phrase to look for
        var phraseList = mentionTools.quoteParser(m.content);

        adminTools.queryMessages(m,currNum,phraseList,messages=>{
            m.channel.bulkDelete(messages);
        });
    },
    'move':(m,args)=>{
        if(!adminTools.isAdmin(m)) return;

        //Totally original help page and totally not 100% copied from /del
        if(args.length == 1){
            m.reply(overUsedVars.delMoveHelp.replaceAll('@!','move').replaceAll('@~','Move'));
            return;
        }
        
        var currNum = 1;
        //Scan through all args to find numbers
        for(var i of args)
            if(!isNaN(i)) currNum = i*1;
        
        currNum++;

        if(currNum > 100){
            m.reply(overUsedVars.delMoveBigNum);
            return;
        }

        //Go through the messasge to see if there was a specified phrase to look for
        var phraseList = mentionTools.quoteParser(m.content),
            channel = mentionTools.channelParser(m.content)[0];

        if(!channel){
            m.reply('Specify a channel to move messages to (e.g #burgers-and-fries)');
            return;
        }

        var channelObj = m.channel.guild.channels.cache.get(channel);
        if(!channelObj.isText()){
            m.reply('**Error: not a text channel!**');
            return;
        }

        adminTools.queryMessages(m,currNum,phraseList,messages=>{
            //Copy all messages
            var finalText = messages.map(e=>'<@'+e.author.id+'> '+e.content).reverse();
            for(var i of finalText) channelObj.send(i);
            m.channel.bulkDelete(messages);
        });
    },
    'mute':(m,args)=>{
        if(!adminTools.isAdmin(m)) return;
        //First find the voice channel in the args, it should be in quotes
        let muteLimit = 5000*60, //5 minutes
            channels = findChannelMacro(m);
        
        /*It's possible to mute multiple channels at once, un-muting however has been a huge pain when trying to async different instances.
        Literally the only way I can think of being able to unmute everybody at once is through the same timeout. If we cancel one through code we cancel
        the others however... WAIT A MINUTE
        
        Ok, new plan: only cut off the timeout if only 1 channel has the same timeout! That way, 1 timeout for multiple channels is still possible! (edit: IT FREAKEN WORKS)*/
        if(!channels.length)
            return;

        //Skim through all numbers to find mute limit
        for(var i of args)
            if(!isNaN(i)) muteLimit = i*1000*60;

        //If we find a timestamp, replace the number with the last mentioned timestamp
        var timeStamps = timeTools.strToTimeObjs(args);
        if(timeStamps.length)
            muteLimit = timeTools.timeToSeconds(timeStamps[timeStamps.length-1]) * 1000;
        
        //The total is in an object to use js' reference abilities
        var channelTotalObj = {total:channels.length};
        var universalTimeout = setTimeout(()=>commands.umute(channels),muteLimit);
        //Mute Everyone and set a time limit:
        //set an address based on channel id
        for(var targetChannel of channels){
            voiceStates[targetChannel.id] = [0,targetChannel,channelTotalObj];
            for(var i of targetChannel.members){
                i[1].voice.setMute(true).then(undefined,()=>overUsedVars.voicePermissions(m));
            }
            //Theoretically we could group all of these into one timeout, that would be cool
            voiceStates[targetChannel.id][0] = universalTimeout;
        }
    },
    'umute':m=>{
        /*This command is special, it can either take a message object or an array of channel objects
        It wouldn't make sense to check for admin upon accepting channel objects so this is avoided*/
        if(m.content && !adminTools.isAdmin(m)) return;
        //m can be two things, a message or a channel depending on how it was invoked.
        let channels;
        if(!m.content) channels = m;
        else channels = findChannelMacro(m);

        if(!Array.isArray(channels)) channels = [channels];
        
        if(!channels.length)
            return;

        for(let targetChannel of channels){
            //Unmute everybody
            for(var i of targetChannel.members){
                i[1].voice.setMute(false).then(undefined,()=>overUsedVars.voicePermissions(m));
            }
            
            if(voiceStates[targetChannel.id]){
                //Only clear the timeout if there are no other channels tied
                //Main concern isn't if everythingin a group is subtracted, rather it's if an admin manually invokes an unmute for individual channels
                voiceStates[targetChannel.id][2].total--;

                if(!voiceStates[targetChannel.id][2].total)
                    clearTimeout(voiceStates[targetChannel.id][0]);
                delete voiceStates[targetChannel.id];
            }
        }
    },
    'voisplit':m=>{
        if(m.content && !adminTools.isAdmin(m)) return;
        //Grab all requested channels
        var channels = findChannelMacro(m);

        //All members will be from the first channel
        if(channels.length < 2){
            m.reply('You need at least 2 channels to use this command!');
            return;
        }

        var members = shuffle([...channels[0].members].map(e=>e[1]));
        channels = shuffle(channels);

        var reasonStr = 'Lemonbot moved you!';
        //Evenly disperse everyone in the first channel to groups
        if(members.length > channels.length){
            var split = Math.floor(members.length / channels.length);

            for(var i = 0; i < channels.length;i++){
                for(var j = 0; j < split; j++ ){
                    //member joins
                    members[members.length-1].voice.setChannel(channels[i],reasonStr).then(undefined,()=>overUsedVars.voicePermissions(m));
                    members.pop();
                }
            }
        }
        else{
            //Just put members in random rooms
            for(var i = 0; members.length; i++){
                members[members.length-1].voice.setChannel(channels[i],reasonStr).then(undefined,()=>overUsedVars.voicePermissions(m));
                members.pop();
            }
        }

    },

    'raid':(m,args)=>{
        if(m.content && !adminTools.isAdmin(m)) return;
        //Grab all requested channels
        var channels = findChannelMacro(m);

        if(args.length == 1){
            m.reply(`Example usage - move everyone from voice channels \`a\` \`b\` and \`c\` over to \`d\`
            \`/raid "a" "b" "c" "d"\``);
            return;
        }
        if(channels.length < 2){
            m.reply('You need at least 2 channels to use this command!');
            return;
        }

        //Everyone will be headed to one channel, a.k.a the final one specified
        var members = [];
        //Go through each channel to find respective member
        for(var i of channels)
            members.push(...[...i.members].map(e=>e[1]));

        // console.log(members);
        var insertedMembers = [];
        for(var i of members){
            if(insertedMembers.indexOf(i) == -1){
                i.voice.setChannel(channels[channels.length-1],'Lemonbot raid!').then(undefined,()=>overUsedVars.voicePermissions(m));
                insertedMembers.push(i);
            }
        }
    }
}

module.exports = commands;