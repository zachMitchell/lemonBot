//Cleaned up version of cfg_sampleConfig.js. If you know what you're doing, just copy this

//Custom imports
var moduleList = [];

//Debug Symbol
var debugSymbol = "!";

//Your list loads here:
var privateModules = {};

for(var i of moduleList)
    privateModules[i] = require('./moduleFolder/'+i+'.js');

delete moduleList;

//Command help
var helpDescriptions = [];

//Argument hanlding
var commands = {};

//Responses
var responses = {};

//Cooldown settings
var cooldowns = {};

//You don't really need to touch this part
module.exports = {
    debugSymbol:debugSymbol,
    helpDescriptions:helpDescriptions,
    commands:commands,
    responses:responses,
    cooldowns:cooldowns,
}