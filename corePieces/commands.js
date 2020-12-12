//Made by Zachary Mitchell in 2020!
//This file lists the commands we're using in the lemonModules directory. Each item parses it's own arguments and when done passes those arguments to the module.
//We also load lemon modules here.

//Load the modules!
var lemonModules = {};
var messageOverflow = require('./messageOverflow');
var adminTools = require('./adminTools');

//These are file names you can find from lemonModules. For example: eMark.js would be eMark here.
var moduleList = [
    'camelCase',
    'creepyCase',
    'dumbotModule',
    'eMark',
    'rylan',
    'rylansWisdom',
    'shuffle',
    //Admin stuff
    'mentionTools'
]

for(var i of moduleList)
    lemonModules[i] = require('../lemonModules/'+i+'.js');

delete moduleList;

//Command help descriptions are over here. Some dynamic items are here to sort help in alphabetical order
var helpDescriptions = [
    ["age", "Find out the age of two discord accounts"],
    ["back", "!naidrocsid gnuoy eikooc trams a er'uoy yeh ho"],
    ["camel", "typeLikeANerd"],
    ["creepy", "tYpE lIkE a CrEePy PeRsOn"],
    ["dumbot", "Ask an intelligent question"],
    ["e", "b[e] r[e]sponsibl[e] with this on[e]"],
    ["math", "Do Stonks"],
    ["rnd", "Ask for a random number"],
    ["rylan", "Display this man's greatness to the channel"],
    ["shuf", "Randomize a list of things"],
    ["wisdom", "Recieve good advice from a wise man"]
];

var adminHelpDesc = [
    ['del','Remove messages from the channel you called this command from'],
    ['move','Takes messages out of this channel and puts them in another of your choice'],
    ['mute','Mutes an entire voice channel, if you add a number it will stay muted for that number in minutes'],
    ['umute','Un-mutes an entire channel']
]

//Timers that are ticking when somebody runs the /muteall command. They are here to manually unmute everyone.
var voiceStates = {};

var commands = {
    'age':(m,args)=>{

        var dateStr = e=>(e+"").split(" ").slice(0,5).join(' ');
        var users = [];
        for(var i of m.mentions.users.values()) users.push(i);

        if(users.length == 2){
            //grab the userIds and determine which one is smaller
            var olderThanStr = ["'s account is older than ","'s account"];

            var dateStr ="\n===\n"+
                users[0].username+": *"+dateStr(users[0].createdAt)+'*\n'+
                users[1].username+": *"+dateStr(users[1].createdAt)+'*';

            if(users[0].id < users[1].id)
                m.channel.send(users[0].username+olderThanStr[0]+users[1].username+olderThanStr[1]+dateStr);
            else m.channel.send(users[1].username+olderThanStr[0]+users[0].username+olderThanStr[1]+dateStr);
        }
        else m.channel.send('Place in two users and I\'ll figure out which account is older! Like this: `/age @user1 @user2`');

    },
    'back':(m,args)=>{
        //gorgeous
        m.reply(args.slice(1).join(' ').split('').reverse().join(''));
        m.delete();
    },
    'camel':(m,args)=>{
        m.reply(lemonModules.camelCase(args.slice(1)));
        m.delete();
    },
    'creepy':m=>{
        m.reply(lemonModules.creepyCase(m.content.split('/creepy')[1]));
        m.delete();
    },
    'dumbot':m=>{
        var result = lemonModules.dumbotModule();
        m.channel.send(result[0].join(' ') + result[1][0]);
    },
    'e':m=>{
        let result = lemonModules.eMark(m.content.substring(2));
        if(!messageOverflow(m,result,m.author.id)) m.reply(result).then(()=>m.delete());
    },
    'math':(m,args)=>{

        //Check literally every character to make sure we don't have an abuse on the js math system.
        var mathStr = args.slice(1).join('');
        // console.log(mathStr);
        var filter = '+-*/%().';
        var invalid = false;
        for(var i = 0;i < mathStr.length;i++){
            if(filter.indexOf(mathStr[i]) == -1 && isNaN(mathStr[i])){
                invalid = true;
                break;
            }
        }

        if(invalid){
            m.channel.send(
            `Bad argument(s) :(
            Usage: ${args[0]} 1 + 1
            I take the following symbols:
            + (plus)
            - (minus)
            * (multiply)
            / (divide)

            But a number must always come first. You can chain symbols and numbers together like \`${args[0]} 1 + 1 * 2 / 4\`
            Parenthesis works too: \`(1+1) * 2\``);
        }
        else m.channel.send(Function('return '+mathStr)());

    },
    'rylan':m=>m.channel.send(lemonModules.rylan()),
    'rnd':(m,args)=>{
        if(!isNaN(args[1]))
            m.channel.send(Math.floor(Math.random()*args[1])+1);
        else m.channel.send('Give me a number! Like this: /rnd 5');
    },
    'shuf':m=>{

        //Help messages
        var mainHelp = `shuf gives everything you threw at it back at you but in a random order
        You can either give it a list of things like this: \`/shuf item 1,item 2,hiCaleb\`
        
        Or, you can put in a list of items!`;
        var listHelp = `Syntax: \`["word, or phrase",1.5,8,"MyOtherlistItem"]\`
        Your words and phrases need to be in quotation marks, but numbers don't need quotes.
        Separate everything by commas and enclose your whole list inside these: \`[]\``;

        //Accept either a javaScript array or a list of items separated by comma
        var shufStr = m.content.split('/shuf')[1].substring(1);
        var itemsToShuf = [];

        //If this is an array, try to parse it:
        if(!shufStr.length){
            m.channel.send(mainHelp+'\n'+listHelp);
            return
        }
        else if(shufStr[0] == '['){
            try{
                itemsToShuf = JSON.parse(shufStr);
            }
            catch(e){
                m.channel.send('Invalid List!\n'+listHelp);
            }
        }

        else itemsToShuf = shufStr.split(',');

        if(itemsToShuf.length)
            m.channel.send(lemonModules.shuffle(itemsToShuf).join('\n'));
        else m.channel.send(mainHelp+'\n'+listHelp);
    },
    'wisdom':m=>{
        m.channel.send('> '+lemonModules.rylansWisdom()+' -RylanStylin');
    },
    //Help message. this should also be updated along with new commands:
    'help':m=>{
        var resultStr = 'I have a lot of commands!';
        //Insert help strings
        for(var i of helpDescriptions)
            resultStr+='`\n'+'/'+i[0]+'` - '+i[1];

        m.channel.send(resultStr);
    },

    //Administrator commands
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
            m.reply(`Example usage:
            Delete the last 5 messages:
            \`/del 5\`
            
            Delete messages from @joeSchmoe within a 10 message radius
            \`/del 10 @joeSchmoe\`
            
            Delete messages from multiple people within a 50 message radius, as long as they said "pog"
            \`/del @joe @caleb "pog" 50\``);
            return;
        }
        
        var currNum = 1;
        //Scan through all args to find numbers
        for(var i of args)
            if(!isNaN(i)) currNum = i*1;
        
        currNum++;

        //Go through the messasge to see if there was a specified phrase to look for
        var phraseList = [];
        //Remove quotation marks in the search results
        for(var i of [...m.content.matchAll(/"[A-Za-z0-9]*"/g)]) phraseList.push(i[0].split('"')[1]);

        adminTools.queryMessages(m,currNum,phraseList,messages=>{
            m.channel.bulkDelete(messages);
        });
    },
    'move':(m,args)=>{
        if(!adminTools.isAdmin(m)) return;

        //Totally original help page and totally not 100% copied from /del
        if(args.length == 1){
            m.reply(`Example usage:
            move the last 5 messages:
            \`/move 5 #burgers-and-fries\`
            
            Move messages from @joeSchmoe within a 10 message radius
            \`/move 10 @joeSchmoe #burgers-and-fries\`
            
            Move messages from multiple people within a 50 message radius, as long as they said "pog"
            \`/move @joe @caleb "pog" 50 #burgers-and-fries\``);
            return;
        }
        
        var currNum = 1;
        //Scan through all args to find numbers
        for(var i of args)
            if(!isNaN(i)) currNum = i*1;
        
        currNum++;

        //Go through the messasge to see if there was a specified phrase to look for
        var phraseList = [];
        //Remove quotation marks in the search results
        for(var i of [...m.content.matchAll(/"[A-Za-z0-9]*"/g)]) phraseList.push(i[0].split('"')[1]);

        //Grab target channel
        var channel = lemonModules.mentionTools.channelParser(m.content)[0];
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
        var channelName,
            muteLimit = 5;
        try{
            channelName = [...m.content.matchAll(/"[A-Za-z0-9]*"/g)][0][0].split('"')[1];
        }
        catch(e){
            m.reply('Specify the channel of choice within quotation marks (e.g "Rylans png fest")');
            return;
        }
        
        var targetChannel;
        //next, poll through all voice channel names; the first result get's muted
        
        for(var i of m.channel.guild.channels.cache){
            if(i[1].name == channelName && i[1].type == 'voice'){
                targetChannel = i[1];
                break;
            }
        }

        if(!targetChannel){
            m.reply('*Error: Couldn\'t find that voice channel :/ ('+channelName+')*');
            return;
        }

        //Skim through all numbers to find mute limit
        for(var i of args)
            if(!isNaN(i)) muteLimit = i*1;

        //Mute Everyone and set a time limit:
        //set an address based on channel id
        voiceStates[targetChannel.id] = [0,targetChannel];
        for(var i of targetChannel.members){
            i[1].voice.setMute(true);
        }
        voiceStates[targetChannel.id][0] = setTimeout(()=>commands.umute(targetChannel),muteLimit*1000*60);

    },
    'umute':(m,args)=>{
        if(!adminTools.isAdmin(m)) return;
        //m can be two things, a message or a channel depending on how it was invoked.
        var targetChannel;
        if(!m.content) targetChannel = m;
        else{
            //run through the parse dance
            try{
                channelName = [...m.content.matchAll(/"[A-Za-z0-9]*"/g)][0][0].split('"')[1];
            }
            catch(e){
                m.reply('Specify the channel of choice within quotation marks (e.g "Rylans png fest")');
                return;
            }
            
            var targetChannel;
            //next, poll through all voice channel names; the first result get's muted
            for(var i of m.channel.guild.channels.cache){
                if(i[1].name == channelName && i[1].type == 'voice'){
                    targetChannel = i[1];
                    break;
                }
            }
        }

        //Unmute everybody
        for(var i of targetChannel.members){
            i[1].voice.setMute(false);
        }
        
        if(voiceStates[targetChannel.id]){
            clearTimeout(voiceStates[targetChannel.id][0]);
            delete voiceStates[targetChannel.id];
        }
    }

}

module.exports = {
    helpDescriptions:helpDescriptions,
    commands:commands
};