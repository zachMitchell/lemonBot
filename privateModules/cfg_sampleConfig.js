/*Made by Zachary Mitchell in 2020!
This file can be constructed by you to make lemonbot yours! Fill in the blanks for things like new commands, custom responses and additions to the help menu.
The file overall is your sandbox, do whatever you like such as importing modules.

If you are deploying from heroku, this file is your friend so you can merge your changes whenever the master branch gets an update

To use the debugSymbol in place of /, run lemonbot with this command: "node -p=sampleConfig"*/

//////////////////

//Custom imports - private modules can come from wherever you like, in this case we're importing from ./privateModules
//example: moduleList = ['file1','file2']; //file1.js and file2.js respectively
var moduleList = [
    // 'sampleModule',
];

//Debug Symbol - use this as a replacement for / so you don't step on another dev's toes.
var debugSymbol = "!";

//Your list loads here:
var privateModules = {};

for(var i of moduleList)
    privateModules[i] = require('./sampleConfig/'+i+'.js');

delete moduleList;

//Command help - when the help command is run, these messages will come up for every command you choose
/*Example: 
helpDescriptions = [
    ['command name', 'command description'],
    ['etc', 'etc]
]*/
var helpDescriptions = [
    // ['sample','custom command example!'],
];

/*Argument hanlding - This is where your command is detected and run. It's purpose is to be a way to set things up before actually running your module
...or you can just flat out place your command logic here instead of module importing :/
either way, this is required to make your magic happen. Make sure you don't overwrite the names of built-in commands.

Every command takes two parameters:
* msg - From discord.js, use this to see everything about the message. See discord.js documentation for more details.
* args - Built for lemonbot, the command's arguments, starting with the command name (without the forward slash). The the same thing as msg.content, but split by spaces.

In addition, you can optionally return the amount of time in seconds to append to the user's cooldown time for this command:

return { cooldownAppend: -30 } //Remove 30 seconds after the command is run

Example function:

commands = {
    "commandName":(msg,args)=>{
        msg.channel.send("Hello world!");

        return { cooldownAppend: 1 };
    }
}*/

var commands = {
    /*'sample':(msg,args)=>{
        var res = '';
        for(var i of args) res+='=='+privateModules.sampleModule(i)+'==\n';
        msg.channel.send(res);
    },*/
}

/*Responses - things not in command format. Phrases from this list are scanned from the message itself; for example if someone says "pog"
in the message "Caleb is pog", lemonbot will find that and execute a function

message is converted to lowercase to match a variety of results.

functions take only one argument - msg
example function:

responses = {
    "bacon":msg=>msg.reply('> '+msg.content+'\nHey as long as bacon is involved, I approve'),
}*/

var responses = {
    // 'pizza':m=>m.reply('Pizza rocks')
}

/* Cooldown settings - This is where you can manage how often users can run a command.
Cooldowdns can be either built for groups of commands, or just commands by themselves.
For an example, checkout the `cooldownDefaults` variable in lemon.js

Cooldown settings here that contain similar settings overwrite settings on a setting-per-setting basis, for example:

'rylan':{ uses:5000 }

will change how often rylan can be called, but the coolTime will stay the same.

For groups, if you want all commands to impact eachother's usage, add the glue parameter:
'textWarpersGroup':{
    glue:true
}*/

var cooldowns = {
    // 'sample':{coolTime:5, uses:1}
}

//You don't really need to touch this part
module.exports = {
    debugSymbol:debugSymbol,
    helpDescriptions:helpDescriptions,
    commands:commands,
    responses:responses,
    cooldowns:cooldowns,
}

//That's all; modify and go nuts!