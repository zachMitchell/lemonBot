//Made by Zachary Mitchell in 2020!
//This file lists the commands we're using in the lemonModules directory. Each item parses it's own arguments and when done passes those arguments to the module.
//We also load lemon modules here.

//Load the modules!
var lemonModules = {};
var messageOverflow = require('./messageOverflow');

//These are file names you can find from lemonModules. For example: eMark.js would be eMark here.
var moduleList = [
    'camelCase',
    'creepyCase',
    'dumbotModule',
    'eMark',
    'rylan',
    'rylansWisdom',
    'shuffle'
]

for(var i of moduleList)
    lemonModules[i] = require('../lemonModules/'+i+'.js');

delete moduleList;

//Command help descriptions are over here. Some dynamic items are here to sort help in alphabetical order
var helpDescriptions = [
    ["age", "Find out the age of two discord accounts",'tool'],
    ["back", "!naidrocsid gnuoy eikooc trams a er'uoy yeh ho",'text'],
    ["camel", "typeLikeANerd",'text'],
    ["creepy", "tYpE lIkE a CrEePy PeRsOn",'text'],
    ["dumbot", "Ask an intelligent question",'meme'],
    ["e", "b[e] r[e]sponsibl[e] with this on[e]",'text'],
    ["gamerfy", "Mak3 y0ur 73x7 gam3r 57yl3.",'text'],
    ["math", "Do Stonks",'tool'],
    ["mock","End all your debates instantly with the power of mocking spongebob!",'meme'],
    ["rnd", "Ask for a random number",'tool'],
    ["rylan", "Display this man's greatness to the channel",'meme'],
    ["shuf", "Randomize a list of things",'tool'],
    ["wisdom", "Recieve good advice from a wise man",'meme'],
];

//Also originally in lemon.js - cooldowns that are set for each command defined here. They are limiters for how often a command can be used.
var cooldowns = {
    'textWarpersGroup':{
        isGroup:true,
        coolTime:15,
        uses:3,
        commands:['camel','creepy','e','back','gamerfy']
    },
    //Clever name am I right? :D
    'once5Secs':{
        isGroup:true,
        coolTime:5,
        uses:1,
        commands:['age','dumbot','wisdom']
    },
    'math': { coolTime:25, uses:5 },
    'mock': { coolTime:15, uses:1 },
    'rnd':{ coolTime:3, uses:2 },
    'rylan':{ coolTime:30, uses:2 },
    'shuf':{ coolTime:90, uses:1 },
}

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
        m.reply(args.slice(1).join(' ').split('').reverse().join('')).then(()=>m.delete());
    },
    'camel':(m,args)=>{
        m.reply(lemonModules.camelCase(args.slice(1))).then(()=>m.delete());
    },
    'creepy':(m,args)=>{
        m.reply(lemonModules.creepyCase(args.slice(1).join(' '))).then(()=>m.delete());
    },
    'dumbot':m=>{
        var result = lemonModules.dumbotModule();
        m.channel.send(result[0].join(' ') + result[1][0]);
    },
    'e':m=>{
        let result = lemonModules.eMark(m.content.substring(2));
        if(!messageOverflow(m,result,m.author.id)) m.reply(result).then(()=>m.delete());
    },
    'gamerfy':(m,args)=>{
        let result = args.slice(1).join(' ').replaceAll('e','3').replaceAll('s','5').replaceAll('b','8')
        .replaceAll('t','7').replaceAll('o','0').replaceAll('i','1')
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
    'mock':msg=>{
        msg.channel.messages.fetch({limit:2}).then(e=>{
            creepyContent = lemonModules.creepyCase([...e.values()][1].content);
            msg.channel.send('https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/mocking-spongebob-1556133078.jpg \n' + creepyContent);
        });
    },

    'rylan':m=>m.channel.send(lemonModules.rylan()),
    'rnd':(m,args)=>{
        if(!isNaN(args[1]))
            m.channel.send(Math.floor(Math.random()*args[1])+1);
        else m.channel.send('Give me a number! Like this: /rnd 5');
    },
    'shuf':(m,args)=>{

        //Help messages
        var mainHelp = `shuf gives everything you threw at it back at you but in a random order
        You can either give it a list of things like this: \`/shuf item 1,item 2,hiCaleb\`
        
        Or, you can put in a list of items!`;
        var listHelp = `Syntax: \`["word, or phrase",1.5,8,"MyOtherlistItem"]\`
        Your words and phrases need to be in quotation marks, but numbers don't need quotes.
        Separate everything by commas and enclose your whole list inside these: \`[]\``;

        //Accept either a javaScript array or a list of items separated by comma
        var shufStr = args.slice(1).join(' ');
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
}

module.exports = {
    commands:commands,
    cooldowns:cooldowns,
    helpDescriptions:helpDescriptions,
};